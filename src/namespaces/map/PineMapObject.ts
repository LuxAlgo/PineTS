// SPDX-License-Identifier: AGPL-3.0-only
// This file is auto-generated. Do not edit manually.
// Run: npm run generate:map-index

import { clear as clear_factory } from './methods/clear';
import { contains as contains_factory } from './methods/contains';
import { copy as copy_factory } from './methods/copy';
import { get as get_factory } from './methods/get';
import { keys as keys_factory } from './methods/keys';
import { put as put_factory } from './methods/put';
import { put_all as put_all_factory } from './methods/put_all';
import { remove as remove_factory } from './methods/remove';
import { size as size_factory } from './methods/size';
import { values as values_factory } from './methods/values';
import { spreadNamedArgs } from '../namedArgs';
import { MAP_PARAMS } from '../collectionParams';

export class PineMapObject {
    public map: Map<any, any>;
    // 'string' for map<K, string>, whose missing keys read as the na string ("")
    public valueType?: string;
    private _clear: any;
    private _contains: any;
    private _copy: any;
    private _get: any;
    private _keys: any;
    private _put: any;
    private _put_all: any;
    private _remove: any;
    private _size: any;
    private _values: any;

    constructor(public context: any) {
        this.map = new Map();
        this._clear = clear_factory(this.context);
        this._contains = contains_factory(this.context);
        this._copy = copy_factory(this.context);
        this._get = get_factory(this.context);
        this._keys = keys_factory(this.context);
        this._put = put_factory(this.context);
        this._put_all = put_all_factory(this.context);
        this._remove = remove_factory(this.context);
        this._size = size_factory(this.context);
        this._values = values_factory(this.context);
    }

    toString(): string {
        return `PineMapObject(${this.map.size})`;
    }

    clear(...args: any[]) {
        return this._clear(this, ...spreadNamedArgs(args, MAP_PARAMS.clear, 1));
    }

    contains(...args: any[]) {
        return this._contains(this, ...spreadNamedArgs(args, MAP_PARAMS.contains, 1));
    }

    copy(...args: any[]) {
        return this._copy(this, ...spreadNamedArgs(args, MAP_PARAMS.copy, 1));
    }

    get(...args: any[]) {
        return this._get(this, ...spreadNamedArgs(args, MAP_PARAMS.get, 1));
    }

    keys(...args: any[]) {
        return this._keys(this, ...spreadNamedArgs(args, MAP_PARAMS.keys, 1));
    }

    put(...args: any[]) {
        return this._put(this, ...spreadNamedArgs(args, MAP_PARAMS.put, 1));
    }

    put_all(...args: any[]) {
        return this._put_all(this, ...spreadNamedArgs(args, MAP_PARAMS.put_all, 1));
    }

    remove(...args: any[]) {
        return this._remove(this, ...spreadNamedArgs(args, MAP_PARAMS.remove, 1));
    }

    size(...args: any[]) {
        return this._size(this, ...spreadNamedArgs(args, MAP_PARAMS.size, 1));
    }

    values(...args: any[]) {
        return this._values(this, ...spreadNamedArgs(args, MAP_PARAMS.values, 1));
    }
}
