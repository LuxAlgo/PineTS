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

    toString(): string {
        return '[' + this.array.toString().replace(/,/g, ', ') + ']';
    }

    [Symbol.iterator]() {
        return this.array[Symbol.iterator]();
    }

    abs(...args: any[]) {
        return this._abs(this, ...args);
    }

    avg(...args: any[]) {
        return this._avg(this, ...args);
    }

    binary_search(...args: any[]) {
        return this._binary_search(this, ...args);
    }

    binary_search_leftmost(...args: any[]) {
        return this._binary_search_leftmost(this, ...args);
    }

    binary_search_rightmost(...args: any[]) {
        return this._binary_search_rightmost(this, ...args);
    }

    clear(...args: any[]) {
        return this._clear(this, ...args);
    }

    concat(...args: any[]) {
        return this._concat(this, ...args);
    }

    copy(...args: any[]) {
        return this._copy(this, ...args);
    }

    covariance(...args: any[]) {
        return this._covariance(this, ...args);
    }

    every(...args: any[]) {
        return this._every(this, ...args);
    }

    fill(...args: any[]) {
        return this._fill(this, ...args);
    }

    first(...args: any[]) {
        return this._first(this, ...args);
    }

    get(...args: any[]) {
        return this._get(this, ...args);
    }

    includes(...args: any[]) {
        return this._includes(this, ...args);
    }

    indexof(...args: any[]) {
        return this._indexof(this, ...args);
    }

    insert(...args: any[]) {
        return this._insert(this, ...args);
    }

    join(...args: any[]) {
        return this._join(this, ...args);
    }

    last(...args: any[]) {
        return this._last(this, ...args);
    }

    lastindexof(...args: any[]) {
        return this._lastindexof(this, ...args);
    }

    max(...args: any[]) {
        return this._max(this, ...args);
    }

    median(...args: any[]) {
        return this._median(this, ...args);
    }

    min(...args: any[]) {
        return this._min(this, ...args);
    }

    mode(...args: any[]) {
        return this._mode(this, ...args);
    }

    percentile_linear_interpolation(...args: any[]) {
        return this._percentile_linear_interpolation(this, ...args);
    }

    percentile_nearest_rank(...args: any[]) {
        return this._percentile_nearest_rank(this, ...args);
    }

    percentrank(...args: any[]) {
        return this._percentrank(this, ...args);
    }

    pop(...args: any[]) {
        return this._pop(this, ...args);
    }

    push(...args: any[]) {
        return this._push(this, ...args);
    }

    range(...args: any[]) {
        return this._range(this, ...args);
    }

    remove(...args: any[]) {
        return this._remove(this, ...args);
    }

    reverse(...args: any[]) {
        return this._reverse(this, ...args);
    }

    set(...args: any[]) {
        return this._set(this, ...args);
    }

    shift(...args: any[]) {
        return this._shift(this, ...args);
    }

    size(...args: any[]) {
        return this._size(this, ...args);
    }

    slice(...args: any[]) {
        return this._slice(this, ...args);
    }

    some(...args: any[]) {
        return this._some(this, ...args);
    }

    sort(...args: any[]) {
        return this._sort(this, ...args);
    }

    sort_indices(...args: any[]) {
        return this._sort_indices(this, ...args);
    }

    standardize(...args: any[]) {
        return this._standardize(this, ...args);
    }

    stdev(...args: any[]) {
        return this._stdev(this, ...args);
    }

    sum(...args: any[]) {
        return this._sum(this, ...args);
    }

    unshift(...args: any[]) {
        return this._unshift(this, ...args);
    }

    variance(...args: any[]) {
        return this._variance(this, ...args);
    }
}
