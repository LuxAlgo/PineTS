import { PineArrayObject } from '../PineArrayObject';
import { sortValueReader } from '../utils';

export function binary_search_rightmost(context: any) {
    return (id: PineArrayObject, value: any, sort_field?: string | number): number => {
        const array = id.array;
        const key = sortValueReader(array, sort_field) ?? ((v: any) => v);
        let low = 0;
        let high = array.length;

        while (low < high) {
            const mid = Math.floor((low + high) / 2);
            if (key(array[mid]) <= value) {
                low = mid + 1;
            } else {
                high = mid;
            }
        }
        // low is upper_bound (first element > value)

        // Check if found (element before upper_bound is the last occurrence)
        if (low > 0 && key(array[low - 1]) === value) {
            return low - 1;
        }

        return low;
    };
}
