// SPDX-License-Identifier: AGPL-3.0-only

const MAX_INDEX = 2 ** 32 - 2;

function toIndex(prop: string | symbol): number {
    if (typeof prop !== 'string' || !/^(0|[1-9]\d*)$/.test(prop)) return -1;
    const i = Number(prop);
    return i <= MAX_INDEX ? i : -1;
}

/**
 * A JS array that is a window `[start, start + length)` onto `parent` (which may itself be a view), as
 * `array.slice()` returns on TradingView: reads and writes go to the parent, and growing or shrinking the
 * view inserts into / removes from the parent at the end of the window. Every Array.prototype method works on
 * it, since they only use index access and `length`.
 *
 * Structural changes made to the parent directly do not move the window: it keeps its start and length.
 */
export function createSliceView(parent: any[], start: number, length: number): any[] {
    const target: any[] = [];
    target.length = length;

    const resize = (newLength: number) => {
        const len = target.length;
        if (newLength < len) parent.splice(start + newLength, len - newLength);
        else if (newLength > len) parent.splice(start + len, 0, ...new Array(newLength - len));
        target.length = newLength;
    };

    return new Proxy(target, {
        get(t, prop, receiver) {
            const i = toIndex(prop);
            if (i !== -1) return i < t.length ? parent[start + i] : undefined;
            return Reflect.get(t, prop, receiver);
        },
        set(t, prop, value, receiver) {
            if (prop === 'length') {
                resize(Number(value));
                return true;
            }
            const i = toIndex(prop);
            if (i !== -1) {
                if (i >= t.length) resize(i + 1);
                parent[start + i] = value;
                return true;
            }
            return Reflect.set(t, prop, value, receiver);
        },
        has(t, prop) {
            const i = toIndex(prop);
            if (i !== -1) return i < t.length;
            return Reflect.has(t, prop);
        },
        deleteProperty(t, prop) {
            const i = toIndex(prop);
            if (i !== -1) {
                if (i < t.length) parent[start + i] = undefined;
                return true;
            }
            return Reflect.deleteProperty(t, prop);
        },
        ownKeys(t) {
            const keys: (string | symbol)[] = [];
            for (let i = 0; i < t.length; i++) keys.push(String(i));
            return keys.concat(Reflect.ownKeys(t));
        },
        getOwnPropertyDescriptor(t, prop) {
            const i = toIndex(prop);
            if (i !== -1) {
                if (i >= t.length) return undefined;
                return { value: parent[start + i], writable: true, enumerable: true, configurable: true };
            }
            return Reflect.getOwnPropertyDescriptor(t, prop);
        },
    });
}
