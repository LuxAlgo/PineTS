import { PineArrayObject } from '../PineArrayObject';
import { sortValueReader } from '../utils';

export function binary_search_leftmost(context: any) {
    return (id: PineArrayObject, value: any, sort_field?: string | number): number => {
        const array = id.array;
        const key = sortValueReader(array, sort_field) ?? ((v: any) => v);
        let low = 0;
        let high = array.length;

        while (low < high) {
            const mid = Math.floor((low + high) / 2);
            if (key(array[mid]) < value) {
                low = mid + 1;
            } else {
                high = mid;
            }
        }

        // low is lower_bound (first element >= value)

        // Check if found
        if (low < array.length && key(array[low]) === value) {
            return low;
        }

        // If not found, return left of insertion point; a value below every element (or an empty array) gives 0
        return Math.max(low - 1, 0);
    };
}
