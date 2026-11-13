// SPDX-License-Identifier: AGPL-3.0-only
import { readdir, readFile, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const taDir = join(__dirname, '../src/namespaces/ta');
const gettersDir = join(taDir, 'getters');
const methodsDir = join(taDir, 'methods');
const outputFile = join(taDir, 'ta.index.ts');

async function generateIndex() {
    try {
        // Read getters directory

        let getters = [];
        try {
            const getterFiles = await readdir(gettersDir);
            getters = getterFiles.filter((f) => f.endsWith('.ts') && f !== 'ta.index.ts' && f !== 'index.ts').map((f) => f.replace('.ts', ''));
        } catch (error) {
            // Getters directory doesn't exist, that's fine
            getters = [];
        }

        // Read methods directory
        const methodFiles = await readdir(methodsDir);
        const methods = methodFiles.filter((f) => f.endsWith('.ts')).map((f) => f.replace('.ts', ''));

        // Generate imports
        const getterImports = getters.map((name) => `import { ${name} } from './getters/${name}';`).join('\n');

        const methodImports = methods.map((name) => `import { ${name} } from './methods/${name}';`).join('\n');

        // Generate getters object
        const gettersObj = getters.map((name) => `  ${name}`).join(',\n');
        const gettersObjStr = `const getters = {\n${gettersObj}\n};`;

        // Generate methods object
        const methodsObj = methods.map((name) => `  ${name}`).join(',\n');
        const methodsObjStr = `const methods = {\n${methodsObj}\n};`;

        // Generate type declarations for getters (as readonly properties)
        const getterTypes = getters.map((name) => `  readonly ${name}: ReturnType<ReturnType<typeof getters.${name}>>;`).join('\n');

        // Generate type declarations for methods
        const methodTypes = methods.map((name) => `  ${name}: ReturnType<typeof methods.${name}>;`).join('\n');

        // Generate the class
        const classCode = `// SPDX-License-Identifier: AGPL-3.0-only
// This file is auto-generated. Do not edit manually.
// Run: npm run generate:ta-index

${getterImports}

${methodImports}

import { wrapTaLengthPolicy } from './lengthPolicy';

${gettersObjStr}

${methodsObjStr}

export class TechnicalAnalysis {
${getterTypes}

${methodTypes}

  constructor(private context: any) {
    // Install getters
${
    getters.length > 0
        ? `    Object.entries(getters).forEach(([name, factory]) => {
      Object.defineProperty(this, name, {
        get: factory(context),
        enumerable: true
      });
    });
    `
        : ''
}
    
    // Install methods
    Object.entries(methods).forEach(([name, factory]) => {
      this[name] = wrapTaLengthPolicy(name, factory(context));
    });
  }
}

export default TechnicalAnalysis;
`;

        await writeFile(outputFile, classCode, 'utf-8');
        console.log(`✅ Generated ${outputFile}`);
        console.log(`   - ${getters.length} getters: ${getters.join(', ')}`);
        console.log(`   - ${methods.length} methods: ${methods.join(', ')}`);
    } catch (error) {
        console.error('Error generating TA index:', error);
        process.exit(1);
    }
}

generateIndex();
