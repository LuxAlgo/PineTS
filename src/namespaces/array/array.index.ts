// SPDX-License-Identifier: AGPL-3.0-only
// This file is auto-generated. Do not edit manually.
// Run: npm run generate:array-index

export { PineArrayObject } from './PineArrayObject';

import { PineArrayObject } from './PineArrayObject';
import { withNamedArgs } from '../namedArgs';
import { ARRAY_PARAMS } from '../collectionParams';
import { from } from './methods/from';
import { new_fn } from './methods/new';
import { new_bool } from './methods/new_bool';
import { new_box } from './methods/new_box';
import { new_color } from './methods/new_color';
import { new_float } from './methods/new_float';
import { new_int } from './methods/new_int';
import { new_label } from './methods/new_label';
import { new_line } from './methods/new_line';
import { new_linefill } from './methods/new_linefill';
import { new_string } from './methods/new_string';
import { new_table } from './methods/new_table';
import { param } from './methods/param';
import { __from_int } from './methods/__from_int';

export class PineArray {
  [key: string]: any;

  constructor(private context: any) {

    // Install methods
    this.abs = withNamedArgs((id: PineArrayObject, ...args: any[]) => id.abs(...args), ARRAY_PARAMS.abs);
    this.avg = withNamedArgs((id: PineArrayObject, ...args: any[]) => id.avg(...args), ARRAY_PARAMS.avg);
    this.binary_search = withNamedArgs((id: PineArrayObject, ...args: any[]) => id.binary_search(...args), ARRAY_PARAMS.binary_search);
    this.binary_search_leftmost = withNamedArgs((id: PineArrayObject, ...args: any[]) => id.binary_search_leftmost(...args), ARRAY_PARAMS.binary_search_leftmost);
    this.binary_search_rightmost = withNamedArgs((id: PineArrayObject, ...args: any[]) => id.binary_search_rightmost(...args), ARRAY_PARAMS.binary_search_rightmost);
    this.clear = withNamedArgs((id: PineArrayObject, ...args: any[]) => id.clear(...args), ARRAY_PARAMS.clear);
    this.concat = withNamedArgs((id: PineArrayObject, ...args: any[]) => id.concat(...args), ARRAY_PARAMS.concat);
    this.copy = withNamedArgs((id: PineArrayObject, ...args: any[]) => id.copy(...args), ARRAY_PARAMS.copy);
    this.covariance = withNamedArgs((id: PineArrayObject, ...args: any[]) => id.covariance(...args), ARRAY_PARAMS.covariance);
    this.every = withNamedArgs((id: PineArrayObject, ...args: any[]) => id.every(...args), ARRAY_PARAMS.every);
    this.fill = withNamedArgs((id: PineArrayObject, ...args: any[]) => id.fill(...args), ARRAY_PARAMS.fill);
    this.first = withNamedArgs((id: PineArrayObject, ...args: any[]) => id.first(...args), ARRAY_PARAMS.first);
    this.from = from(context);
    this.get = withNamedArgs((id: PineArrayObject, ...args: any[]) => id.get(...args), ARRAY_PARAMS.get);
    this.includes = withNamedArgs((id: PineArrayObject, ...args: any[]) => id.includes(...args), ARRAY_PARAMS.includes);
    this.indexof = withNamedArgs((id: PineArrayObject, ...args: any[]) => id.indexof(...args), ARRAY_PARAMS.indexof);
    this.insert = withNamedArgs((id: PineArrayObject, ...args: any[]) => id.insert(...args), ARRAY_PARAMS.insert);
    this.join = withNamedArgs((id: PineArrayObject, ...args: any[]) => id.join(...args), ARRAY_PARAMS.join);
    this.last = withNamedArgs((id: PineArrayObject, ...args: any[]) => id.last(...args), ARRAY_PARAMS.last);
    this.lastindexof = withNamedArgs((id: PineArrayObject, ...args: any[]) => id.lastindexof(...args), ARRAY_PARAMS.lastindexof);
    this.max = withNamedArgs((id: PineArrayObject, ...args: any[]) => id.max(...args), ARRAY_PARAMS.max);
    this.median = withNamedArgs((id: PineArrayObject, ...args: any[]) => id.median(...args), ARRAY_PARAMS.median);
    this.min = withNamedArgs((id: PineArrayObject, ...args: any[]) => id.min(...args), ARRAY_PARAMS.min);
    this.mode = withNamedArgs((id: PineArrayObject, ...args: any[]) => id.mode(...args), ARRAY_PARAMS.mode);
    this.new = new_fn(context);
    this.new_bool = new_bool(context);
    this.new_box = new_box(context);
    this.new_color = new_color(context);
    this.new_float = new_float(context);
    this.new_int = new_int(context);
    this.new_label = new_label(context);
    this.new_line = new_line(context);
    this.new_linefill = new_linefill(context);
    this.new_string = new_string(context);
    this.new_table = new_table(context);
    this.param = param(context);
    this.percentile_linear_interpolation = withNamedArgs((id: PineArrayObject, ...args: any[]) => id.percentile_linear_interpolation(...args), ARRAY_PARAMS.percentile_linear_interpolation);
    this.percentile_nearest_rank = withNamedArgs((id: PineArrayObject, ...args: any[]) => id.percentile_nearest_rank(...args), ARRAY_PARAMS.percentile_nearest_rank);
    this.percentrank = withNamedArgs((id: PineArrayObject, ...args: any[]) => id.percentrank(...args), ARRAY_PARAMS.percentrank);
    this.pop = withNamedArgs((id: PineArrayObject, ...args: any[]) => id.pop(...args), ARRAY_PARAMS.pop);
    this.push = withNamedArgs((id: PineArrayObject, ...args: any[]) => id.push(...args), ARRAY_PARAMS.push);
    this.range = withNamedArgs((id: PineArrayObject, ...args: any[]) => id.range(...args), ARRAY_PARAMS.range);
    this.remove = withNamedArgs((id: PineArrayObject, ...args: any[]) => id.remove(...args), ARRAY_PARAMS.remove);
    this.reverse = withNamedArgs((id: PineArrayObject, ...args: any[]) => id.reverse(...args), ARRAY_PARAMS.reverse);
    this.set = withNamedArgs((id: PineArrayObject, ...args: any[]) => id.set(...args), ARRAY_PARAMS.set);
    this.shift = withNamedArgs((id: PineArrayObject, ...args: any[]) => id.shift(...args), ARRAY_PARAMS.shift);
    this.size = withNamedArgs((id: PineArrayObject, ...args: any[]) => id.size(...args), ARRAY_PARAMS.size);
    this.slice = withNamedArgs((id: PineArrayObject, ...args: any[]) => id.slice(...args), ARRAY_PARAMS.slice);
    this.some = withNamedArgs((id: PineArrayObject, ...args: any[]) => id.some(...args), ARRAY_PARAMS.some);
    this.sort = withNamedArgs((id: PineArrayObject, ...args: any[]) => id.sort(...args), ARRAY_PARAMS.sort);
    this.sort_indices = withNamedArgs((id: PineArrayObject, ...args: any[]) => id.sort_indices(...args), ARRAY_PARAMS.sort_indices);
    this.standardize = withNamedArgs((id: PineArrayObject, ...args: any[]) => id.standardize(...args), ARRAY_PARAMS.standardize);
    this.stdev = withNamedArgs((id: PineArrayObject, ...args: any[]) => id.stdev(...args), ARRAY_PARAMS.stdev);
    this.sum = withNamedArgs((id: PineArrayObject, ...args: any[]) => id.sum(...args), ARRAY_PARAMS.sum);
    this.unshift = withNamedArgs((id: PineArrayObject, ...args: any[]) => id.unshift(...args), ARRAY_PARAMS.unshift);
    this.variance = withNamedArgs((id: PineArrayObject, ...args: any[]) => id.variance(...args), ARRAY_PARAMS.variance);
    this.__from_int = __from_int(context);
  }
}

export default PineArray;
