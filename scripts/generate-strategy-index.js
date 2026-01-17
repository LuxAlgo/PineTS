// SPDX-License-Identifier: AGPL-3.0-only
import { readdir, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const strategyDir = join(__dirname, '../src/namespaces/strategy');
const methodsDir = join(strategyDir, 'methods');
const outputFile = join(strategyDir, 'strategy.index.ts');

// Methods that should be direct properties (not functions)
// Note: opentrades and closedtrades are handled specially as sub-namespaces
const PROPERTY_METHODS = [
    'position_size',
    'position_avg_price',
    'equity',
    'initial_capital',
    'openprofit',
    'netprofit',
    'grossprofit',
    'grossloss',
    'wintrades',
    'losstrades',
    'eventrades',
    'max_drawdown',
    'max_runup',
    'profit_factor',
    'avg_trade',
    'avg_winning_trade',
    'avg_losing_trade',
    'win_rate',
    'sharpe_ratio',
];

// These are handled as sub-namespaces with count property
const SUB_NAMESPACE_COUNTS = ['opentrades', 'closedtrades'];

// Methods for opentrades namespace
const OPENTRADES_METHODS = [
    'opentrades_entry_price',
    'opentrades_entry_bar_index',
    'opentrades_entry_time',
    'opentrades_entry_id',
    'opentrades_size',
    'opentrades_profit',
];

// Methods for closedtrades namespace
const CLOSEDTRADES_METHODS = [
    'closedtrades_entry_price',
    'closedtrades_exit_price',
    'closedtrades_entry_bar_index',
    'closedtrades_exit_bar_index',
    'closedtrades_profit',
    'closedtrades_size',
    'closedtrades_commission',
    'closedtrades_max_runup',
    'closedtrades_max_drawdown',
];

async function generateIndex() {
    try {
        // Read methods directory
        const methodFiles = await readdir(methodsDir);
        const allMethods = methodFiles
            .filter((f) => f.endsWith('.ts'))
            .map((f) => f.replace('.ts', ''));

        // Separate action methods from properties and sub-namespace methods
        const actionMethods = allMethods.filter(
            (m) =>
                !PROPERTY_METHODS.includes(m) &&
                !SUB_NAMESPACE_COUNTS.includes(m) &&
                !OPENTRADES_METHODS.includes(m) &&
                !CLOSEDTRADES_METHODS.includes(m)
        );

        const propertyMethods = allMethods.filter((m) => PROPERTY_METHODS.includes(m));
        const subNamespaceCountMethods = allMethods.filter((m) => SUB_NAMESPACE_COUNTS.includes(m));
        const opentradesMethods = allMethods.filter((m) => OPENTRADES_METHODS.includes(m));
        const closedtradesMethods = allMethods.filter((m) => CLOSEDTRADES_METHODS.includes(m));

        // Generate imports
        const allImports = allMethods.map((name) => `import { ${name} } from './methods/${name}';`).join('\n');

        // Generate methods objects
        const actionMethodsObj = actionMethods.map((name) => `  ${name}`).join(',\n');
        const propertyMethodsObj = propertyMethods.map((name) => `  ${name}`).join(',\n');
        const subNamespaceCountMethodsObj = subNamespaceCountMethods.map((name) => `  ${name}`).join(',\n');
        const opentradesMethodsObj = opentradesMethods.map((name) => `  ${name}`).join(',\n');
        const closedtradesMethodsObj = closedtradesMethods.map((name) => `  ${name}`).join(',\n');

        // Generate type declarations
        const actionMethodTypes = actionMethods.map((name) => `  ${name}: ReturnType<typeof actionMethods.${name}>;`).join('\n');

        // Generate opentrades sub-namespace type
        const opentradesTypes = opentradesMethods
            .map((name) => {
                const shortName = name.replace('opentrades_', '');
                return `    ${shortName}: ReturnType<typeof opentradesMethods.${name}>;`;
            })
            .join('\n');

        // Generate closedtrades sub-namespace type
        const closedtradesTypes = closedtradesMethods
            .map((name) => {
                const shortName = name.replace('closedtrades_', '');
                return `    ${shortName}: ReturnType<typeof closedtradesMethods.${name}>;`;
            })
            .join('\n');

        // Generate the class
        const classCode = `// SPDX-License-Identifier: AGPL-3.0-only
// This file is auto-generated. Do not edit manually.
// Run: npm run generate:strategy-index

${allImports}

import { StrategyEngine } from './StrategyEngine';
import {
  direction,
  oca_type,
  commission_type,
  position,
  cash,
  fixed,
  percent_of_equity,
} from './types';

const actionMethods = {
${actionMethodsObj}
};

const propertyMethods = {
${propertyMethodsObj}
};

const subNamespaceCountMethods = {
${subNamespaceCountMethodsObj}
};

const opentradesMethods = {
${opentradesMethodsObj}
};

const closedtradesMethods = {
${closedtradesMethodsObj}
};

// Type for opentrades sub-namespace (callable with methods)
interface OpentradesNamespace {
  (): number;
${opentradesTypes}
}

// Type for closedtrades sub-namespace (callable with methods)
interface ClosedtradesNamespace {
  (): number;
${closedtradesTypes}
}

export class PineStrategy {
  private context: any;
  private _propertyCache: Record<string, () => number> = {};

  // Constants
  readonly direction = direction;
  readonly oca = oca_type;
  readonly commission = commission_type;
  readonly position = position;
  readonly cash = cash;
  readonly fixed = fixed;
  readonly percent_of_equity = percent_of_equity;
  readonly long = 'long' as const;
  readonly short = 'short' as const;

  // Sub-namespaces (callable with methods attached)
  opentrades: OpentradesNamespace;
  closedtrades: ClosedtradesNamespace;

  // Action methods
${actionMethodTypes}

  // Properties (using Object.defineProperty for getters)
  readonly position_size!: number;
  readonly position_avg_price!: number;
  readonly equity!: number;
  readonly initial_capital!: number;
  readonly openprofit!: number;
  readonly netprofit!: number;
  readonly grossprofit!: number;
  readonly grossloss!: number;
  readonly wintrades!: number;
  readonly losstrades!: number;
  readonly eventrades!: number;
  readonly max_drawdown!: number;
  readonly max_runup!: number;
  readonly profit_factor!: number;
  readonly avg_trade!: number;
  readonly avg_winning_trade!: number;
  readonly avg_losing_trade!: number;
  readonly win_rate!: number;
  readonly sharpe_ratio!: number;

  constructor(context: any) {
    this.context = context;

    // Initialize strategy engine if not present
    if (!context._strategyEngine) {
      context._strategyEngine = new StrategyEngine(context);
    }

    // Install action methods
    Object.entries(actionMethods).forEach(([name, factory]) => {
      (this as any)[name] = factory(context);
    });

    // Install property methods as getters
    Object.entries(propertyMethods).forEach(([name, factory]) => {
      this._propertyCache[name] = factory(context);
      Object.defineProperty(this, name, {
        get: () => this._propertyCache[name](),
        enumerable: true,
      });
    });

    // Create opentrades sub-namespace (callable + has methods)
    const opentradesCountFn = subNamespaceCountMethods.opentrades(context);
    const opentradesNs = Object.assign(
      () => opentradesCountFn(),
      Object.fromEntries(
        Object.entries(opentradesMethods).map(([name, factory]) => [
          name.replace('opentrades_', ''),
          factory(context),
        ])
      )
    ) as OpentradesNamespace;
    this.opentrades = opentradesNs;

    // Create closedtrades sub-namespace (callable + has methods)
    const closedtradesCountFn = subNamespaceCountMethods.closedtrades(context);
    const closedtradesNs = Object.assign(
      () => closedtradesCountFn(),
      Object.fromEntries(
        Object.entries(closedtradesMethods).map(([name, factory]) => [
          name.replace('closedtrades_', ''),
          factory(context),
        ])
      )
    ) as ClosedtradesNamespace;
    this.closedtrades = closedtradesNs;
  }

  /**
   * Process pending orders - called at the start of each bar
   */
  processOrders(): void {
    if (this.context._strategyEngine) {
      this.context._strategyEngine.processOrders();
    }
  }
}

export default PineStrategy;
`;

        await writeFile(outputFile, classCode, 'utf-8');
        console.log(`✅ Generated ${outputFile}`);
        console.log(`   - ${actionMethods.length} action methods: ${actionMethods.join(', ')}`);
        console.log(`   - ${propertyMethods.length} property methods: ${propertyMethods.join(', ')}`);
        console.log(`   - ${subNamespaceCountMethods.length} sub-namespace count methods: ${subNamespaceCountMethods.join(', ')}`);
        console.log(`   - ${opentradesMethods.length} opentrades methods`);
        console.log(`   - ${closedtradesMethods.length} closedtrades methods`);
    } catch (error) {
        console.error('Error generating Strategy index:', error);
        process.exit(1);
    }
}

generateIndex();
