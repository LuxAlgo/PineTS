// SPDX-License-Identifier: AGPL-3.0-only
import { readdir, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const matrixDir = join(__dirname, '../src/namespaces/matrix');
const gettersDir = join(matrixDir, 'getters');
const methodsDir = join(matrixDir, 'methods');
const indexFile = join(matrixDir, 'matrix.index.ts');
const objectFile = join(matrixDir, 'PineMatrixObject.ts');

async function generateIndex() {
    try {
        // Read getters directory (if it exists)
        let getters = [];
        try {
            const getterFiles = await readdir(gettersDir);
            getters = getterFiles.filter((f) => f.endsWith('.ts') && f !== 'matrix.index.ts' && f !== 'index.ts').map((f) => f.replace('.ts', ''));
        } catch (error) {
            // Getters directory doesn't exist, that's fine
            getters = [];
        }

        // Read methods directory
        const methodFiles = await readdir(methodsDir);
        const methods = methodFiles
            .filter((f) => f.endsWith('.ts'))
            .map((f) => {
                const name = f.replace('.ts', '');
                // Handle 'new' which is a reserved keyword - file is named 'new.ts' but exports as 'new_fn'
                return name === 'new' ? { file: name, export: 'new_fn', classProp: 'new' } : { file: name, export: name, classProp: name };
            });

        const staticMethods = ['new', 'param'];

        // --- Generate PineMatrixObject.ts ---
        const objectMethods = methods.filter((m) => !staticMethods.includes(m.classProp));

        const objectImports = objectMethods.map((m) => `import { ${m.export} as ${m.export}_factory } from './methods/${m.file}';`).join('\n');

        const objectPrivateProps = objectMethods.map((m) => `    private _${m.classProp}: any;`).join('\n');

        const objectInitProps = objectMethods.map((m) => `        this._${m.classProp} = ${m.export}_factory(this.context);`).join('\n');

        const objectMethodDefs = objectMethods
            .map((m) => {
                return `    ${m.classProp}(...args: any[]) {
        return this._${m.classProp}(this, ...args);
    }`;
            })
            .join('\n\n');

        const objectClassCode = `// SPDX-License-Identifier: AGPL-3.0-only
// This file is auto-generated. Do not edit manually.
// Run: npm run generate:matrix-index

${objectImports}

export class PineMatrixObject {
    public matrix: any[][];
${objectPrivateProps}

    constructor(
        rows: number = 0,
        cols: number = 0,
        initialValue: any = NaN,
        public context: any
    ) {
        this.matrix = [];
        if (rows > 0 && cols > 0) {
            for (let i = 0; i < rows; i++) {
                this.matrix.push(Array(cols).fill(initialValue));
            }
        }
${objectInitProps}
    }

    toString(): string {
        let result = '';
        for (let i = 0; i < this.matrix.length; i++) {
            result += result === '' ? '' : '\\n';
            result += '[' + this.matrix[i].join(', ') + ']';
        }
        return result;
    }

${objectMethodDefs}
}
`;
        await writeFile(objectFile, objectClassCode, 'utf-8');
        console.log(`✅ Generated ${objectFile}`);

        // --- Generate matrix.index.ts ---

        // Generate imports
        const getterImports = getters.length > 0 ? getters.map((name) => `import { ${name} } from './getters/${name}';`).join('\n') : '';

        // Imports for index file
        let indexImports = `export { PineMatrixObject } from './PineMatrixObject';\n\nimport { PineMatrixObject } from './PineMatrixObject';`;

        // Import static method factories
        const staticMethodImports = methods
            .filter((m) => staticMethods.includes(m.classProp))
            .map((m) => `import { ${m.export} } from './methods/${m.file}';`)
            .join('\n');

        indexImports += '\n' + staticMethodImports;

        // Generate getters object (for type definitions mostly, or we just inline)
        const getterInstall =
            getters.length > 0
                ? `    // Install getters
    const getters = {
${getters.map((g) => `      ${g}: ${g}`).join(',\n')}
    };
    Object.entries(getters).forEach(([name, factory]) => {
      Object.defineProperty(this, name, {
        get: factory(context),
        enumerable: true
      });
    });`
                : '';

        // Generate methods installation
        const methodInstall = methods
            .map((m) => {
                if (staticMethods.includes(m.classProp)) {
                    return `    this.${m.classProp} = ${m.export}(context);`;
                }
                return `    this.${m.classProp} = (id: PineMatrixObject, ...args: any[]) => id.${m.classProp}(...args);`;
            })
            .join('\n');

        // Type-specific aliases for matrix.new<TYPE>() → matrix.new_TYPE()
        // The transpiler rewrites generic type params to method name suffixes
        const typeAliases = ['float', 'int', 'string', 'bool', 'color', 'line', 'label', 'box', 'linefill', 'table'];
        const typeAliasInstall = typeAliases.map(t => `    this.new_${t} = new_fn(context);`).join('\n');

        const classCode = `// SPDX-License-Identifier: AGPL-3.0-only
// This file is auto-generated. Do not edit manually.
// Run: npm run generate:matrix-index

${indexImports}
${getterImports ? getterImports + '\n' : ''}
export class PineMatrix {
    [key: string]: any;

    constructor(private context: any) {
${getterInstall}
        // Install methods
${methodInstall}
    // Type-specific aliases — used internally by PineTS to handle strong types.
    // The transpiler rewrites matrix.new<float>(...) → matrix.new_float(...)
${typeAliasInstall}
    }
}

export default PineMatrix;
`;

        await writeFile(indexFile, classCode, 'utf-8');
        console.log(`✅ Generated ${indexFile}`);
        if (getters.length > 0) {
            console.log(`   - ${getters.length} getters: ${getters.join(', ')}`);
        }
        console.log(`   - ${methods.length} methods: ${methods.map((m) => m.classProp).join(', ')}`);
    } catch (error) {
        console.error('Error generating Matrix index:', error);
        process.exit(1);
    }
}

generateIndex();
