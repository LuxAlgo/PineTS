// One-time test migration for PineTS.run()'s native-Pine default.
// Existing compatibility tests deliberately exercise trusted JavaScript input.
import fs from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';

const root = path.resolve('tests');
const dryRun = process.argv.includes('--dry-run');
const failedOnlyIndex = process.argv.indexOf('--failed-only');
let failedFiles = null;
if (failedOnlyIndex !== -1) {
    const report = JSON.parse(await fs.readFile(process.argv[failedOnlyIndex + 1], 'utf8'));
    failedFiles = new Set();
    for (const test of report.testResults) {
        if ((test.assertionResults ?? []).some((assertion) =>
            assertion.status === 'failed' && (assertion.failureMessages ?? []).some((message) =>
                /version marker required|JavaScript functions require|Native Pine source required/.test(message)))) {
            failedFiles.add(path.relative(root, test.name).replaceAll('\\', '/'));
        }
    }
}
const excluded = new Set([
    'core/source-mode.test.ts',
    'transpiler/closed-world-verifier.test.ts',
    'transpiler/loop-budget.test.ts',
    'transpiler/loop-guard-hardening.test.ts',
    'namespaces/input-host-objects.test.ts',
    'namespaces/matrix/matrix-index-validation.test.ts',
    'namespaces/table/table-hardening.test.ts',
    'namespaces/ta/ta-length-policy.test.ts',
    'marketData/binanceHardening.test.ts',
    'marketData/mockFilenameHardening.test.ts',
]);

async function* files(directory) {
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
        const full = path.join(directory, entry.name);
        if (entry.isDirectory()) yield* files(full);
        else if (entry.name.endsWith('.test.ts')) yield full;
    }
}

let filesChanged = 0;
let callsChanged = 0;
const unusual = [];
for await (const file of files(root)) {
    const relative = path.relative(root, file).replaceAll('\\', '/');
    if (excluded.has(relative)) continue;
    if (failedFiles !== null && !failedFiles.has(relative)) continue;
    const source = await fs.readFile(file, 'utf8');
    const parsed = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    const edits = [];
    function visit(node) {
        if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === 'run') {
            const count = node.arguments.length;
            if (count >= 1 && count < 4) {
                const callee = node.expression.expression.getText(parsed);
                if (!/pine|Pine|indicator|Indicator|engine|Engine|runner|Runner|ts|TS|make|new|provider|Provider/i.test(callee)) {
                    unusual.push(`${relative}:${parsed.getLineAndCharacterOfPosition(node.pos).line + 1}: ${callee}`);
                }
                edits.push({ at: node.end - 1, insert: `${', undefined'.repeat(3 - count)}, { sourceMode: 'trustedJavaScript' }` });
            }
        } else if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)
            && (node.expression.name.text === 'stream' || node.expression.name.text === 'update')) {
            const count = node.arguments.length;
            if (count === 1) {
                edits.push({ at: node.end - 1, insert: ", { sourceMode: 'trustedJavaScript' }" });
            } else if (count === 2 && ts.isObjectLiteralExpression(node.arguments[1])) {
                const options = node.arguments[1];
                const hasMode = options.properties.some((property) => property.name?.getText(parsed) === 'sourceMode');
                if (!hasMode) edits.push({ at: options.end - 1, insert: `${options.properties.length ? ', ' : ''}sourceMode: 'trustedJavaScript'` });
            }
        }
        ts.forEachChild(node, visit);
    }
    visit(parsed);
    if (edits.length === 0) continue;
    let updated = source;
    for (const edit of edits.sort((a, b) => b.at - a.at)) {
        updated = updated.slice(0, edit.at) + edit.insert + updated.slice(edit.at);
    }
    if (!dryRun) await fs.writeFile(file, updated);
    filesChanged++;
    callsChanged += edits.length;
}
process.stdout.write(JSON.stringify({ dryRun, filesChanged, callsChanged, unusual: unusual.slice(0, 40), unusualCount: unusual.length }, null, 2) + '\n');
