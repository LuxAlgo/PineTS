import { describe, it } from 'vitest';
import { runPineTestFromFiles } from './lib/run-pine-test';
import path from 'path';

const dataDir = path.join(__dirname, 'data');

describe('Automated: ta.sma', () => {
    it('matches TradingView output', async () => {
        await runPineTestFromFiles(path.join(dataDir, 'ta.sma.pine'), path.join(dataDir, 'ta.sma.logs'), { precision: 3, epsilon: 0.001001 });
    });
});
