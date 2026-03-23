const LicenseHeader = `
/* 
 * Copyright (C) 2025 Alaa-eddine KADDOURI
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */`;

import json from '@rollup/plugin-json';
import esbuild from 'rollup-plugin-esbuild';
import sourcemaps from 'rollup-plugin-sourcemaps';
import typescriptPaths from 'rollup-plugin-typescript-paths';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';

const format = process.env.FORMAT || 'es';
const build = process.env.BUILD || 'dev';

// License text is applied via Rollup `output.banner` (not a generateBundle hook).
// Mutating chunk code after the bundle is emitted breaks source maps — breakpoints drift in debuggers.

const CJSConfigDev = {
    input: './src/index.ts',
    output: {
        file: './dist/pinets.dev.cjs', // BrowserCommonJS output
        format: 'cjs', // Specify the CommonJS format
        sourcemap: true,
        inlineDynamicImports: true, // Inline all dynamic imports into one file
        banner: LicenseHeader,
    },
    plugins: [
        resolve({
            browser: false, // Allow bundling of modules from `node_modules`
            preferBuiltins: true, // Prefer Node.js built-in modules
            mainFields: ['module', 'main'], // Ensure Node.js package resolution
            extensions: ['.js', '.ts', '.json'], // Resolve these extensions
        }),
        commonjs(), // Convert CommonJS modules to ES6 for Rollup to bundle them

        //filenameReplacePlugin(),
        typescriptPaths({
            tsconfig: './tsconfig.json',
            preserveExtensions: true,
            nonRelative: false,
        }),
        esbuild({
            sourceMap: true,
            minify: false,
            treeShaking: false,
            target: 'node18',
        }),
        sourcemaps(),
    ],
};

// Plugin to exclude MockProvider from browser builds
function excludeMockProvider() {
    return {
        name: 'exclude-mock-provider',
        resolveId(source) {
            // Exclude MockProvider from browser builds
            if (source.includes('Mock/MockProvider.class') || source.includes('Mock\\MockProvider.class')) {
                return { id: '\0mock-provider-stub', external: false };
            }
            return null;
        },
        load(id) {
            // Return stub that implements IProvider interface but does nothing
            if (id === '\0mock-provider-stub') {
                return `
                    export class MockProvider {
                        async getMarketData() {
                            return [];
                        }
                    }
                `;
            }
            return null;
        },
    };
}

const BrowserConfigDev = {
    input: './src/index.ts',
    output: {
        file: './dist/pinets.dev.browser.js',
        format: 'umd',
        name: 'PineTSLib',
        exports: 'auto',
        sourcemap: true,
        banner: LicenseHeader,
        footer:
            ';var PineTS = PineTSLib.PineTS;PineTS.Provider = PineTSLib.Provider;PineTS.Context = PineTSLib.Context;',
    },
    plugins: [
        excludeMockProvider(),
        resolve({
            preferBuiltins: true,
            extensions: ['.js', '.ts', '.json'],
            browser: true,
        }),
        commonjs(),
        typescriptPaths({
            tsconfig: './tsconfig.json',
            preserveExtensions: true,
            nonRelative: false,
        }),
        esbuild({
            sourceMap: true,
            minify: false,
            treeShaking: false,
            target: 'es2020',
        }),

        sourcemaps(),
    ],
};

const ESConfigDev = {
    input: './src/index.ts',
    output: {
        format: 'es',
        sourcemap: true,

        //Comment this line and uncomment the following lines if you need ES bundle
        file: './dist/pinets.dev.es.js',
        banner: LicenseHeader,
    },
    plugins: [
        json(),
        resolve({
            preferBuiltins: true,
            extensions: ['.js', '.ts', '.json'],
        }),
        commonjs(),
        //filenameReplacePlugin(),
        typescriptPaths({
            tsconfig: './tsconfig.json',
            preserveExtensions: true,
            nonRelative: false,
        }),
        esbuild({
            sourceMap: true,
            minify: false,
            treeShaking: false,
        }),

        sourcemaps(),
    ],
};

// ES Browser build (excludes Node.js-specific code)
const ESBrowserConfigDev = {
    input: './src/index.ts',
    output: {
        format: 'es',
        sourcemap: true,
        file: './dist/pinets.dev.browser.es.js',
        banner: LicenseHeader,
    },
    plugins: [
        excludeMockProvider(),
        json(),
        resolve({
            preferBuiltins: true,
            extensions: ['.js', '.ts', '.json'],
            browser: true,
        }),
        commonjs(),
        typescriptPaths({
            tsconfig: './tsconfig.json',
            preserveExtensions: true,
            nonRelative: false,
        }),
        esbuild({
            sourceMap: true,
            minify: false,
            treeShaking: false,
            target: 'es2020',
        }),
        sourcemaps(),
    ],
};

const CJSConfigProd = {
    input: './src/index.ts',
    output: {
        file: './dist/pinets.min.cjs', // BrowserCommonJS output
        format: 'cjs', // Specify the CommonJS format
        sourcemap: true,
        inlineDynamicImports: true, // Inline all dynamic imports into one file
        banner: LicenseHeader,
    },
    plugins: [
        resolve({
            browser: false, // Allow bundling of modules from `node_modules`
            preferBuiltins: true, // Prefer Node.js built-in modules
            mainFields: ['module', 'main'], // Ensure Node.js package resolution
            extensions: ['.js', '.ts', '.json'], // Resolve these extensions
        }),
        commonjs(), // Convert CommonJS modules to ES6 for Rollup to bundle them

        //filenameReplacePlugin(),
        typescriptPaths({
            tsconfig: './tsconfig.json',
            preserveExtensions: true,
            nonRelative: false,
        }),
        esbuild({
            sourceMap: true,
            minify: true,
            treeShaking: true,
            target: 'node18',
        }),
        sourcemaps(),
    ],
};

const BrowserConfigProd = {
    input: './src/index.ts',
    output: {
        file: './dist/pinets.min.browser.js',
        format: 'umd',
        name: 'PineTSLib',
        exports: 'auto',
        sourcemap: true,
        banner: LicenseHeader,
        footer:
            ';var PineTS = PineTSLib.PineTS;PineTS.Provider = PineTSLib.Provider;PineTS.Context = PineTSLib.Context;',
    },
    plugins: [
        excludeMockProvider(),
        resolve({
            preferBuiltins: true,
            extensions: ['.js', '.ts', '.json'],
            browser: true,
        }),
        commonjs(),
        typescriptPaths({
            tsconfig: './tsconfig.json',
            preserveExtensions: true,
            nonRelative: false,
        }),
        esbuild({
            sourceMap: true,
            minify: true,
            treeShaking: true,
            target: 'es2020',
        }),

        sourcemaps(),
    ],
};

const ESConfigProd = {
    input: './src/index.ts',
    output: {
        format: 'es',
        sourcemap: true,

        //Comment this line and uncomment the following lines if you need ES bundle
        file: './dist/pinets.min.es.js',
        banner: LicenseHeader,
    },
    plugins: [
        json(),
        resolve({
            preferBuiltins: true,
            extensions: ['.js', '.ts', '.json'],
        }),
        commonjs(),
        //filenameReplacePlugin(),
        typescriptPaths({
            tsconfig: './tsconfig.json',
            preserveExtensions: true,
            nonRelative: false,
        }),
        esbuild({
            sourceMap: true,
            minify: true,
            treeShaking: true,
        }),
        sourcemaps(),
    ],
};

// ES Browser build (excludes Node.js-specific code) - Production
const ESBrowserConfigProd = {
    input: './src/index.ts',
    output: {
        format: 'es',
        sourcemap: true,
        file: './dist/pinets.min.browser.es.js',
        banner: LicenseHeader,
    },
    plugins: [
        excludeMockProvider(),
        json(),
        resolve({
            preferBuiltins: true,
            extensions: ['.js', '.ts', '.json'],
            browser: true,
        }),
        commonjs(),
        typescriptPaths({
            tsconfig: './tsconfig.json',
            preserveExtensions: true,
            nonRelative: false,
        }),
        esbuild({
            sourceMap: true,
            minify: true,
            treeShaking: true,
            target: 'es2020',
        }),
        sourcemaps(),
    ],
};

let config = build === 'dev' ? ESConfigDev : ESConfigProd;
if (format === 'cjs') {
    config = build === 'dev' ? CJSConfigDev : CJSConfigProd;
}

if (format === 'browser') {
    config = build === 'dev' ? BrowserConfigDev : BrowserConfigProd;
}

if (format === 'browser-es') {
    config = build === 'dev' ? ESBrowserConfigDev : ESBrowserConfigProd;
}

export default config;
