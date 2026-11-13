import { PineArrayObject } from '../PineArrayObject';
import { sortValueReader } from '../utils';
import { arrayStore } from '../capacity';

export function binary_search(context: any) {
    return (id: PineArrayObject, value: any, sort_field?: string | number): number => {
        const plain = arrayStore(id);
        const array = plain;
        const key = sortValueReader(array, sort_field) ?? ((v: any) => v);
        let low = 0;
        let high = array.length - 1;

        while (low <= high) {
            const mid = Math.floor((low + high) / 2);
            const midVal = key(array[mid]);

            if (midVal === value) {
                return mid;
            }

            if (midVal < value) {
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }

        return -1;
    };
}
