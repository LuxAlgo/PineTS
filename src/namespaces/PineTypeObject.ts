export class PineTypeObject {
    public get __def__() {
        return this._definition;
    }

    /**
     * Back-reference to the UDT factory that produced this instance.
     * Used by `request.security_lower_tf`'s pure-builtin fast path to
     * detect UDTs whose field defaults are all bare price builtins
     * (e.g. `type candle { float o = open; float h = high; … }`) — when
     * detected, the secondary's per-LTF-bar values can be synthesised
     * directly from the candle stream without running any user script.
     * Optional and nullable: instances created outside `Type().new` (or
     * for legacy / direct constructions) leave this undefined and the
     * fast path simply doesn't engage.
     */
    public _udt?: any;

    constructor(private _definition: Record<string, string>, public context: any, _udt?: any) {
        for (let key in _definition) {
            this[key] = _definition[key];
        }
        this._udt = _udt;
    }

    copy() {
        return new PineTypeObject(this._fieldValues(), this.context, this._udt);
    }

    // Current field values (shallow). Fields left na by `new()` are absent from
    // `_definition`, so the type's field list is needed to catch later assignments.
    _fieldValues(): Record<string, any> {
        const keys = new Set<string>([...(this._udt?._definitionKeys ?? []), ...Object.keys(this._definition)]);
        const values: Record<string, any> = {};
        for (const key of keys) {
            if (Object.prototype.hasOwnProperty.call(this, key)) values[key] = this[key];
        }
        return values;
    }

    toString() {
        const obj = {};
        for (let key in this.__def__) {
            const val = this[key];
            // Avoid circular references: stringify complex objects via their own toString
            if (val !== null && val !== undefined && typeof val === 'object' && typeof val.toString === 'function' && !(val instanceof Array)) {
                obj[key] = val.toString();
            } else {
                obj[key] = val;
            }
        }
        try {
            return JSON.stringify(obj);
        } catch {
            // Fallback if circular references still slip through
            return '{' + Object.keys(obj).map(k => `"${k}":${String(obj[k])}`).join(',') + '}';
        }
    }
}
