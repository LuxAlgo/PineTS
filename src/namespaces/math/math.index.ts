// SPDX-License-Identifier: AGPL-3.0-only
// This file is auto-generated. Do not edit manually.
// Run: npm run generate:math-index

import { __eq } from './methods/__eq';
import { abs } from './methods/abs';
import { acos } from './methods/acos';
import { asin } from './methods/asin';
import { atan } from './methods/atan';
import { avg } from './methods/avg';
import { ceil } from './methods/ceil';
import { cos } from './methods/cos';
import { e } from './methods/e';
import { exp } from './methods/exp';
import { floor } from './methods/floor';
import { ln } from './methods/ln';
import { log } from './methods/log';
import { log10 } from './methods/log10';
import { max } from './methods/max';
import { min } from './methods/min';
import { param } from './methods/param';
import { phi } from './methods/phi';
import { pi } from './methods/pi';
import { pow } from './methods/pow';
import { random } from './methods/random';
import { round } from './methods/round';
import { round_to_mintick } from './methods/round_to_mintick';
import { rphi } from './methods/rphi';
import { sign } from './methods/sign';
import { sin } from './methods/sin';
import { sqrt } from './methods/sqrt';
import { sum } from './methods/sum';
import { tan } from './methods/tan';
import { todegrees } from './methods/todegrees';
import { toradians } from './methods/toradians';

const methods = {
  __eq,
  abs,
  acos,
  asin,
  atan,
  avg,
  ceil,
  cos,
  e,
  exp,
  floor,
  ln,
  log,
  log10,
  max,
  min,
  param,
  phi,
  pi,
  pow,
  random,
  round,
  round_to_mintick,
  rphi,
  sign,
  sin,
  sqrt,
  sum,
  tan,
  todegrees,
  toradians
};

export class PineMath {
  private _cache = {};
  __eq: ReturnType<typeof methods.__eq>;
  abs: ReturnType<typeof methods.abs>;
  acos: ReturnType<typeof methods.acos>;
  asin: ReturnType<typeof methods.asin>;
  atan: ReturnType<typeof methods.atan>;
  avg: ReturnType<typeof methods.avg>;
  ceil: ReturnType<typeof methods.ceil>;
  cos: ReturnType<typeof methods.cos>;
  e: ReturnType<typeof methods.e>;
  exp: ReturnType<typeof methods.exp>;
  floor: ReturnType<typeof methods.floor>;
  ln: ReturnType<typeof methods.ln>;
  log: ReturnType<typeof methods.log>;
  log10: ReturnType<typeof methods.log10>;
  max: ReturnType<typeof methods.max>;
  min: ReturnType<typeof methods.min>;
  param: ReturnType<typeof methods.param>;
  phi: ReturnType<typeof methods.phi>;
  pi: ReturnType<typeof methods.pi>;
  pow: ReturnType<typeof methods.pow>;
  random: ReturnType<typeof methods.random>;
  round: ReturnType<typeof methods.round>;
  round_to_mintick: ReturnType<typeof methods.round_to_mintick>;
  rphi: ReturnType<typeof methods.rphi>;
  sign: ReturnType<typeof methods.sign>;
  sin: ReturnType<typeof methods.sin>;
  sqrt: ReturnType<typeof methods.sqrt>;
  sum: ReturnType<typeof methods.sum>;
  tan: ReturnType<typeof methods.tan>;
  todegrees: ReturnType<typeof methods.todegrees>;
  toradians: ReturnType<typeof methods.toradians>;

  constructor(private context: any) {
    // Install methods
    Object.entries(methods).forEach(([name, factory]) => {
      this[name] = factory(context);
    });
  }
}

export default PineMath;
