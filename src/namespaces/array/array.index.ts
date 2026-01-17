// SPDX-License-Identifier: AGPL-3.0-only
// This file is auto-generated. Do not edit manually.
// Run: npm run generate:array-index

export { PineArrayObject } from './PineArrayObject';

import { PineArrayObject } from './PineArrayObject';
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

export class PineArray {
  [key: string]: any;

  constructor(private context: any) {

    // Install methods
    this.abs = (id: PineArrayObject, ...args: any[]) => id.abs(...args);
    this.avg = (id: PineArrayObject, ...args: any[]) => id.avg(...args);
    this.binary_search = (id: PineArrayObject, ...args: any[]) => id.binary_search(...args);
    this.binary_search_leftmost = (id: PineArrayObject, ...args: any[]) => id.binary_search_leftmost(...args);
    this.binary_search_rightmost = (id: PineArrayObject, ...args: any[]) => id.binary_search_rightmost(...args);
    this.clear = (id: PineArrayObject, ...args: any[]) => id.clear(...args);
    this.concat = (id: PineArrayObject, ...args: any[]) => id.concat(...args);
    this.copy = (id: PineArrayObject, ...args: any[]) => id.copy(...args);
    this.covariance = (id: PineArrayObject, ...args: any[]) => id.covariance(...args);
    this.every = (id: PineArrayObject, ...args: any[]) => id.every(...args);
    this.fill = (id: PineArrayObject, ...args: any[]) => id.fill(...args);
    this.first = (id: PineArrayObject, ...args: any[]) => id.first(...args);
    this.from = from(context);
    this.get = (id: PineArrayObject, ...args: any[]) => id.get(...args);
    this.includes = (id: PineArrayObject, ...args: any[]) => id.includes(...args);
    this.indexof = (id: PineArrayObject, ...args: any[]) => id.indexof(...args);
    this.insert = (id: PineArrayObject, ...args: any[]) => id.insert(...args);
    this.join = (id: PineArrayObject, ...args: any[]) => id.join(...args);
    this.last = (id: PineArrayObject, ...args: any[]) => id.last(...args);
    this.lastindexof = (id: PineArrayObject, ...args: any[]) => id.lastindexof(...args);
    this.max = (id: PineArrayObject, ...args: any[]) => id.max(...args);
    this.median = (id: PineArrayObject, ...args: any[]) => id.median(...args);
    this.min = (id: PineArrayObject, ...args: any[]) => id.min(...args);
    this.mode = (id: PineArrayObject, ...args: any[]) => id.mode(...args);
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
    this.percentile_linear_interpolation = (id: PineArrayObject, ...args: any[]) => id.percentile_linear_interpolation(...args);
    this.percentile_nearest_rank = (id: PineArrayObject, ...args: any[]) => id.percentile_nearest_rank(...args);
    this.percentrank = (id: PineArrayObject, ...args: any[]) => id.percentrank(...args);
    this.pop = (id: PineArrayObject, ...args: any[]) => id.pop(...args);
    this.push = (id: PineArrayObject, ...args: any[]) => id.push(...args);
    this.range = (id: PineArrayObject, ...args: any[]) => id.range(...args);
    this.remove = (id: PineArrayObject, ...args: any[]) => id.remove(...args);
    this.reverse = (id: PineArrayObject, ...args: any[]) => id.reverse(...args);
    this.set = (id: PineArrayObject, ...args: any[]) => id.set(...args);
    this.shift = (id: PineArrayObject, ...args: any[]) => id.shift(...args);
    this.size = (id: PineArrayObject, ...args: any[]) => id.size(...args);
    this.slice = (id: PineArrayObject, ...args: any[]) => id.slice(...args);
    this.some = (id: PineArrayObject, ...args: any[]) => id.some(...args);
    this.sort = (id: PineArrayObject, ...args: any[]) => id.sort(...args);
    this.sort_indices = (id: PineArrayObject, ...args: any[]) => id.sort_indices(...args);
    this.standardize = (id: PineArrayObject, ...args: any[]) => id.standardize(...args);
    this.stdev = (id: PineArrayObject, ...args: any[]) => id.stdev(...args);
    this.sum = (id: PineArrayObject, ...args: any[]) => id.sum(...args);
    this.unshift = (id: PineArrayObject, ...args: any[]) => id.unshift(...args);
    this.variance = (id: PineArrayObject, ...args: any[]) => id.variance(...args);
  }
}

export default PineArray;
