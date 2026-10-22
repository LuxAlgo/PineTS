// SPDX-License-Identifier: AGPL-3.0-only
// This file is auto-generated. Do not edit manually.
// Run: npm run generate:array-index

import { abs as abs_factory } from './methods/abs';
import { avg as avg_factory } from './methods/avg';
import { binary_search as binary_search_factory } from './methods/binary_search';
import { binary_search_leftmost as binary_search_leftmost_factory } from './methods/binary_search_leftmost';
import { binary_search_rightmost as binary_search_rightmost_factory } from './methods/binary_search_rightmost';
import { clear as clear_factory } from './methods/clear';
import { concat as concat_factory } from './methods/concat';
import { copy as copy_factory } from './methods/copy';
import { covariance as covariance_factory } from './methods/covariance';
import { every as every_factory } from './methods/every';
import { fill as fill_factory } from './methods/fill';
import { first as first_factory } from './methods/first';
import { get as get_factory } from './methods/get';
import { includes as includes_factory } from './methods/includes';
import { indexof as indexof_factory } from './methods/indexof';
import { insert as insert_factory } from './methods/insert';
import { join as join_factory } from './methods/join';
import { last as last_factory } from './methods/last';
import { lastindexof as lastindexof_factory } from './methods/lastindexof';
import { max as max_factory } from './methods/max';
import { median as median_factory } from './methods/median';
import { min as min_factory } from './methods/min';
import { mode as mode_factory } from './methods/mode';
import { percentile_linear_interpolation as percentile_linear_interpolation_factory } from './methods/percentile_linear_interpolation';
import { percentile_nearest_rank as percentile_nearest_rank_factory } from './methods/percentile_nearest_rank';
import { percentrank as percentrank_factory } from './methods/percentrank';
import { pop as pop_factory } from './methods/pop';
import { push as push_factory } from './methods/push';
import { range as range_factory } from './methods/range';
import { remove as remove_factory } from './methods/remove';
import { reverse as reverse_factory } from './methods/reverse';
import { set as set_factory } from './methods/set';
import { shift as shift_factory } from './methods/shift';
import { size as size_factory } from './methods/size';
import { slice as slice_factory } from './methods/slice';
import { some as some_factory } from './methods/some';
import { sort as sort_factory } from './methods/sort';
import { sort_indices as sort_indices_factory } from './methods/sort_indices';
import { standardize as standardize_factory } from './methods/standardize';
import { stdev as stdev_factory } from './methods/stdev';
import { sum as sum_factory } from './methods/sum';
import { unshift as unshift_factory } from './methods/unshift';
import { variance as variance_factory } from './methods/variance';
import { tostringElements } from './format';
import { spreadNamedArgs } from '../namedArgs';
import { ARRAY_PARAMS } from '../collectionParams';

export enum PineArrayType {
    any = '',
    box = 'box',
    bool = 'bool',
    color = 'color',
    float = 'float',
    int = 'int',
    label = 'label',
    line = 'line',
    linefill = 'linefill',
    string = 'string',
    table = 'table',
}

export class PineArrayObject {
    private _abs: any;
    private _avg: any;
    private _binary_search: any;
    private _binary_search_leftmost: any;
    private _binary_search_rightmost: any;
    private _clear: any;
    private _concat: any;
    private _copy: any;
    private _covariance: any;
    private _every: any;
    private _fill: any;
    private _first: any;
    private _get: any;
    private _includes: any;
    private _indexof: any;
    private _insert: any;
    private _join: any;
    private _last: any;
    private _lastindexof: any;
    private _max: any;
    private _median: any;
    private _min: any;
    private _mode: any;
    private _percentile_linear_interpolation: any;
    private _percentile_nearest_rank: any;
    private _percentrank: any;
    private _pop: any;
    private _push: any;
    private _range: any;
    private _remove: any;
    private _reverse: any;
    private _set: any;
    private _shift: any;
    private _size: any;
    private _slice: any;
    private _some: any;
    private _sort: any;
    private _sort_indices: any;
    private _standardize: any;
    private _stdev: any;
    private _sum: any;
    private _unshift: any;
    private _variance: any;

    constructor(public array: any, public type: PineArrayType, public context: any) {
        this._abs = abs_factory(this.context);
        this._avg = avg_factory(this.context);
        this._binary_search = binary_search_factory(this.context);
        this._binary_search_leftmost = binary_search_leftmost_factory(this.context);
        this._binary_search_rightmost = binary_search_rightmost_factory(this.context);
        this._clear = clear_factory(this.context);
        this._concat = concat_factory(this.context);
        this._copy = copy_factory(this.context);
        this._covariance = covariance_factory(this.context);
        this._every = every_factory(this.context);
        this._fill = fill_factory(this.context);
        this._first = first_factory(this.context);
        this._get = get_factory(this.context);
        this._includes = includes_factory(this.context);
        this._indexof = indexof_factory(this.context);
        this._insert = insert_factory(this.context);
        this._join = join_factory(this.context);
        this._last = last_factory(this.context);
        this._lastindexof = lastindexof_factory(this.context);
        this._max = max_factory(this.context);
        this._median = median_factory(this.context);
        this._min = min_factory(this.context);
        this._mode = mode_factory(this.context);
        this._percentile_linear_interpolation = percentile_linear_interpolation_factory(this.context);
        this._percentile_nearest_rank = percentile_nearest_rank_factory(this.context);
        this._percentrank = percentrank_factory(this.context);
        this._pop = pop_factory(this.context);
        this._push = push_factory(this.context);
        this._range = range_factory(this.context);
        this._remove = remove_factory(this.context);
        this._reverse = reverse_factory(this.context);
        this._set = set_factory(this.context);
        this._shift = shift_factory(this.context);
        this._size = size_factory(this.context);
        this._slice = slice_factory(this.context);
        this._some = some_factory(this.context);
        this._sort = sort_factory(this.context);
        this._sort_indices = sort_indices_factory(this.context);
        this._standardize = standardize_factory(this.context);
        this._stdev = stdev_factory(this.context);
        this._sum = sum_factory(this.context);
        this._unshift = unshift_factory(this.context);
        this._variance = variance_factory(this.context);
    }

    // Element count for JavaScript callers (PineTS syntax: `line.all.length`); Pine uses size().
    get length(): number {
        return this.array.length;
    }

    toString(): string {
        return '[' + tostringElements(this).join(', ') + ']';
    }

    [Symbol.iterator]() {
        return this.array[Symbol.iterator]();
    }

    abs(...args: any[]) {
        return this._abs(this, ...spreadNamedArgs(args, ARRAY_PARAMS.abs, 1));
    }

    avg(...args: any[]) {
        return this._avg(this, ...spreadNamedArgs(args, ARRAY_PARAMS.avg, 1));
    }

    binary_search(...args: any[]) {
        return this._binary_search(this, ...spreadNamedArgs(args, ARRAY_PARAMS.binary_search, 1));
    }

    binary_search_leftmost(...args: any[]) {
        return this._binary_search_leftmost(this, ...spreadNamedArgs(args, ARRAY_PARAMS.binary_search_leftmost, 1));
    }

    binary_search_rightmost(...args: any[]) {
        return this._binary_search_rightmost(this, ...spreadNamedArgs(args, ARRAY_PARAMS.binary_search_rightmost, 1));
    }

    clear(...args: any[]) {
        return this._clear(this, ...spreadNamedArgs(args, ARRAY_PARAMS.clear, 1));
    }

    concat(...args: any[]) {
        return this._concat(this, ...spreadNamedArgs(args, ARRAY_PARAMS.concat, 1));
    }

    copy(...args: any[]) {
        return this._copy(this, ...spreadNamedArgs(args, ARRAY_PARAMS.copy, 1));
    }

    covariance(...args: any[]) {
        return this._covariance(this, ...spreadNamedArgs(args, ARRAY_PARAMS.covariance, 1));
    }

    every(...args: any[]) {
        return this._every(this, ...spreadNamedArgs(args, ARRAY_PARAMS.every, 1));
    }

    fill(...args: any[]) {
        return this._fill(this, ...spreadNamedArgs(args, ARRAY_PARAMS.fill, 1));
    }

    first(...args: any[]) {
        return this._first(this, ...spreadNamedArgs(args, ARRAY_PARAMS.first, 1));
    }

    get(...args: any[]) {
        return this._get(this, ...spreadNamedArgs(args, ARRAY_PARAMS.get, 1));
    }

    includes(...args: any[]) {
        return this._includes(this, ...spreadNamedArgs(args, ARRAY_PARAMS.includes, 1));
    }

    indexof(...args: any[]) {
        return this._indexof(this, ...spreadNamedArgs(args, ARRAY_PARAMS.indexof, 1));
    }

    insert(...args: any[]) {
        return this._insert(this, ...spreadNamedArgs(args, ARRAY_PARAMS.insert, 1));
    }

    join(...args: any[]) {
        return this._join(this, ...spreadNamedArgs(args, ARRAY_PARAMS.join, 1));
    }

    last(...args: any[]) {
        return this._last(this, ...spreadNamedArgs(args, ARRAY_PARAMS.last, 1));
    }

    lastindexof(...args: any[]) {
        return this._lastindexof(this, ...spreadNamedArgs(args, ARRAY_PARAMS.lastindexof, 1));
    }

    max(...args: any[]) {
        return this._max(this, ...spreadNamedArgs(args, ARRAY_PARAMS.max, 1));
    }

    median(...args: any[]) {
        return this._median(this, ...spreadNamedArgs(args, ARRAY_PARAMS.median, 1));
    }

    min(...args: any[]) {
        return this._min(this, ...spreadNamedArgs(args, ARRAY_PARAMS.min, 1));
    }

    mode(...args: any[]) {
        return this._mode(this, ...spreadNamedArgs(args, ARRAY_PARAMS.mode, 1));
    }

    percentile_linear_interpolation(...args: any[]) {
        return this._percentile_linear_interpolation(this, ...spreadNamedArgs(args, ARRAY_PARAMS.percentile_linear_interpolation, 1));
    }

    percentile_nearest_rank(...args: any[]) {
        return this._percentile_nearest_rank(this, ...spreadNamedArgs(args, ARRAY_PARAMS.percentile_nearest_rank, 1));
    }

    percentrank(...args: any[]) {
        return this._percentrank(this, ...spreadNamedArgs(args, ARRAY_PARAMS.percentrank, 1));
    }

    pop(...args: any[]) {
        return this._pop(this, ...spreadNamedArgs(args, ARRAY_PARAMS.pop, 1));
    }

    push(...args: any[]) {
        return this._push(this, ...spreadNamedArgs(args, ARRAY_PARAMS.push, 1));
    }

    range(...args: any[]) {
        return this._range(this, ...spreadNamedArgs(args, ARRAY_PARAMS.range, 1));
    }

    remove(...args: any[]) {
        return this._remove(this, ...spreadNamedArgs(args, ARRAY_PARAMS.remove, 1));
    }

    reverse(...args: any[]) {
        return this._reverse(this, ...spreadNamedArgs(args, ARRAY_PARAMS.reverse, 1));
    }

    set(...args: any[]) {
        return this._set(this, ...spreadNamedArgs(args, ARRAY_PARAMS.set, 1));
    }

    shift(...args: any[]) {
        return this._shift(this, ...spreadNamedArgs(args, ARRAY_PARAMS.shift, 1));
    }

    size(...args: any[]) {
        return this._size(this, ...spreadNamedArgs(args, ARRAY_PARAMS.size, 1));
    }

    slice(...args: any[]) {
        return this._slice(this, ...spreadNamedArgs(args, ARRAY_PARAMS.slice, 1));
    }

    some(...args: any[]) {
        return this._some(this, ...spreadNamedArgs(args, ARRAY_PARAMS.some, 1));
    }

    sort(...args: any[]) {
        return this._sort(this, ...spreadNamedArgs(args, ARRAY_PARAMS.sort, 1));
    }

    sort_indices(...args: any[]) {
        return this._sort_indices(this, ...spreadNamedArgs(args, ARRAY_PARAMS.sort_indices, 1));
    }

    standardize(...args: any[]) {
        return this._standardize(this, ...spreadNamedArgs(args, ARRAY_PARAMS.standardize, 1));
    }

    stdev(...args: any[]) {
        return this._stdev(this, ...spreadNamedArgs(args, ARRAY_PARAMS.stdev, 1));
    }

    sum(...args: any[]) {
        return this._sum(this, ...spreadNamedArgs(args, ARRAY_PARAMS.sum, 1));
    }

    unshift(...args: any[]) {
        return this._unshift(this, ...spreadNamedArgs(args, ARRAY_PARAMS.unshift, 1));
    }

    variance(...args: any[]) {
        return this._variance(this, ...spreadNamedArgs(args, ARRAY_PARAMS.variance, 1));
    }
}
