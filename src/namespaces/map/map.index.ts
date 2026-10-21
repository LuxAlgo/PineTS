// SPDX-License-Identifier: AGPL-3.0-only
// This file is auto-generated. Do not edit manually.
// Run: npm run generate:map-index

export { PineMapObject } from './PineMapObject';

import { PineMapObject } from './PineMapObject';
import { withNamedArgs } from '../namedArgs';
import { MAP_PARAMS } from '../collectionParams';
import { new_fn } from './methods/new';
import { param } from './methods/param';

export class PineMap {
    [key: string]: any;

    constructor(private context: any) {

        // Install methods
    this.clear = withNamedArgs((id: PineMapObject, ...args: any[]) => id.clear(...args), MAP_PARAMS.clear);
    this.contains = withNamedArgs((id: PineMapObject, ...args: any[]) => id.contains(...args), MAP_PARAMS.contains);
    this.copy = withNamedArgs((id: PineMapObject, ...args: any[]) => id.copy(...args), MAP_PARAMS.copy);
    this.get = withNamedArgs((id: PineMapObject, ...args: any[]) => id.get(...args), MAP_PARAMS.get);
    this.keys = withNamedArgs((id: PineMapObject, ...args: any[]) => id.keys(...args), MAP_PARAMS.keys);
    this.new = new_fn(context);
    this.param = param(context);
    this.put = withNamedArgs((id: PineMapObject, ...args: any[]) => id.put(...args), MAP_PARAMS.put);
    this.put_all = withNamedArgs((id: PineMapObject, ...args: any[]) => id.put_all(...args), MAP_PARAMS.put_all);
    this.remove = withNamedArgs((id: PineMapObject, ...args: any[]) => id.remove(...args), MAP_PARAMS.remove);
    this.size = withNamedArgs((id: PineMapObject, ...args: any[]) => id.size(...args), MAP_PARAMS.size);
    this.values = withNamedArgs((id: PineMapObject, ...args: any[]) => id.values(...args), MAP_PARAMS.values);
    }
}

export default PineMap;
