export class PineTypeObject {
    public get __def__() {
        return this._definition;
    }

    constructor(private _definition: Record<string, string>, public context: any) {
        for (let key in _definition) {
            this[key] = _definition[key];
        }
    }

    copy() {
        return new PineTypeObject(this.__def__, this.context);
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
