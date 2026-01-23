// SPDX-License-Identifier: AGPL-3.0-only
// This file is auto-generated. Do not edit manually.
// Run: npm run generate:request-index

import { currency_rate } from './methods/currency_rate';
import { dividends } from './methods/dividends';
import { earnings } from './methods/earnings';
import { economic } from './methods/economic';
import { financial } from './methods/financial';
import { param } from './methods/param';
import { quandl } from './methods/quandl';
import { security } from './methods/security';
import { security_lower_tf } from './methods/security_lower_tf';
import { seed } from './methods/seed';
import { splits } from './methods/splits';

const methods = {
  currency_rate,
  dividends,
  earnings,
  economic,
  financial,
  param,
  quandl,
  security,
  security_lower_tf,
  seed,
  splits
};

export class PineRequest {
  private _cache = {};
  currency_rate: ReturnType<typeof methods.currency_rate>;
  dividends: ReturnType<typeof methods.dividends>;
  earnings: ReturnType<typeof methods.earnings>;
  economic: ReturnType<typeof methods.economic>;
  financial: ReturnType<typeof methods.financial>;
  param: ReturnType<typeof methods.param>;
  quandl: ReturnType<typeof methods.quandl>;
  security: ReturnType<typeof methods.security>;
  security_lower_tf: ReturnType<typeof methods.security_lower_tf>;
  seed: ReturnType<typeof methods.seed>;
  splits: ReturnType<typeof methods.splits>;

  constructor(private context: any) {
    // Install methods
    Object.entries(methods).forEach(([name, factory]) => {
      this[name] = factory(context);
    });
  }
}

export default PineRequest;
