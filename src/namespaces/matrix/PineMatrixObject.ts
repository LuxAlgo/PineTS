// SPDX-License-Identifier: AGPL-3.0-only
// This file is auto-generated. Do not edit manually.
// Run: npm run generate:matrix-index

import { add_col as add_col_factory } from './methods/add_col';
import { add_row as add_row_factory } from './methods/add_row';
import { avg as avg_factory } from './methods/avg';
import { col as col_factory } from './methods/col';
import { columns as columns_factory } from './methods/columns';
import { concat as concat_factory } from './methods/concat';
import { copy as copy_factory } from './methods/copy';
import { det as det_factory } from './methods/det';
import { diff as diff_factory } from './methods/diff';
import { eigenvalues as eigenvalues_factory } from './methods/eigenvalues';
import { eigenvectors as eigenvectors_factory } from './methods/eigenvectors';
import { elements_count as elements_count_factory } from './methods/elements_count';
import { fill as fill_factory } from './methods/fill';
import { get as get_factory } from './methods/get';
import { inv as inv_factory } from './methods/inv';
import { is_antidiagonal as is_antidiagonal_factory } from './methods/is_antidiagonal';
import { is_antisymmetric as is_antisymmetric_factory } from './methods/is_antisymmetric';
import { is_binary as is_binary_factory } from './methods/is_binary';
import { is_diagonal as is_diagonal_factory } from './methods/is_diagonal';
import { is_identity as is_identity_factory } from './methods/is_identity';
import { is_square as is_square_factory } from './methods/is_square';
import { is_stochastic as is_stochastic_factory } from './methods/is_stochastic';
import { is_symmetric as is_symmetric_factory } from './methods/is_symmetric';
import { is_triangular as is_triangular_factory } from './methods/is_triangular';
import { is_zero as is_zero_factory } from './methods/is_zero';
import { kron as kron_factory } from './methods/kron';
import { max as max_factory } from './methods/max';
import { median as median_factory } from './methods/median';
import { min as min_factory } from './methods/min';
import { mode as mode_factory } from './methods/mode';
import { mult as mult_factory } from './methods/mult';
import { pinv as pinv_factory } from './methods/pinv';
import { pow as pow_factory } from './methods/pow';
import { rank as rank_factory } from './methods/rank';
import { remove_col as remove_col_factory } from './methods/remove_col';
import { remove_row as remove_row_factory } from './methods/remove_row';
import { reshape as reshape_factory } from './methods/reshape';
import { reverse as reverse_factory } from './methods/reverse';
import { row as row_factory } from './methods/row';
import { rows as rows_factory } from './methods/rows';
import { set as set_factory } from './methods/set';
import { sort as sort_factory } from './methods/sort';
import { submatrix as submatrix_factory } from './methods/submatrix';
import { sum as sum_factory } from './methods/sum';
import { swap_columns as swap_columns_factory } from './methods/swap_columns';
import { swap_rows as swap_rows_factory } from './methods/swap_rows';
import { trace as trace_factory } from './methods/trace';
import { transpose as transpose_factory } from './methods/transpose';
import { assertMatrixDimensions, chargeCollectionAllocation } from '../collectionCapacity';
import { guardMatrix } from './capacity';

export class PineMatrixObject {
    private _matrix: any[][];
    private _add_col: any;
    private _add_row: any;
    private _avg: any;
    private _col: any;
    private _columns: any;
    private _concat: any;
    private _copy: any;
    private _det: any;
    private _diff: any;
    private _eigenvalues: any;
    private _eigenvectors: any;
    private _elements_count: any;
    private _fill: any;
    private _get: any;
    private _inv: any;
    private _is_antidiagonal: any;
    private _is_antisymmetric: any;
    private _is_binary: any;
    private _is_diagonal: any;
    private _is_identity: any;
    private _is_square: any;
    private _is_stochastic: any;
    private _is_symmetric: any;
    private _is_triangular: any;
    private _is_zero: any;
    private _kron: any;
    private _max: any;
    private _median: any;
    private _min: any;
    private _mode: any;
    private _mult: any;
    private _pinv: any;
    private _pow: any;
    private _rank: any;
    private _remove_col: any;
    private _remove_row: any;
    private _reshape: any;
    private _reverse: any;
    private _row: any;
    private _rows: any;
    private _set: any;
    private _sort: any;
    private _submatrix: any;
    private _sum: any;
    private _swap_columns: any;
    private _swap_rows: any;
    private _trace: any;
    private _transpose: any;

    constructor(
        rows: number = 0,
        cols: number = 0,
        initialValue: any = NaN,
        public context: any
    ) {
        const size = assertMatrixDimensions(rows, cols, 'matrix.new');
        chargeCollectionAllocation(context, size, 'matrix.new');
        const matrix: any[][] = [];
        if (rows > 0 && cols > 0) {
            for (let i = 0; i < rows; i++) {
                matrix.push(Array(cols).fill(initialValue));
            }
        }
        this._matrix = guardMatrix(matrix, context, false);
        this._add_col = add_col_factory(this.context);
        this._add_row = add_row_factory(this.context);
        this._avg = avg_factory(this.context);
        this._col = col_factory(this.context);
        this._columns = columns_factory(this.context);
        this._concat = concat_factory(this.context);
        this._copy = copy_factory(this.context);
        this._det = det_factory(this.context);
        this._diff = diff_factory(this.context);
        this._eigenvalues = eigenvalues_factory(this.context);
        this._eigenvectors = eigenvectors_factory(this.context);
        this._elements_count = elements_count_factory(this.context);
        this._fill = fill_factory(this.context);
        this._get = get_factory(this.context);
        this._inv = inv_factory(this.context);
        this._is_antidiagonal = is_antidiagonal_factory(this.context);
        this._is_antisymmetric = is_antisymmetric_factory(this.context);
        this._is_binary = is_binary_factory(this.context);
        this._is_diagonal = is_diagonal_factory(this.context);
        this._is_identity = is_identity_factory(this.context);
        this._is_square = is_square_factory(this.context);
        this._is_stochastic = is_stochastic_factory(this.context);
        this._is_symmetric = is_symmetric_factory(this.context);
        this._is_triangular = is_triangular_factory(this.context);
        this._is_zero = is_zero_factory(this.context);
        this._kron = kron_factory(this.context);
        this._max = max_factory(this.context);
        this._median = median_factory(this.context);
        this._min = min_factory(this.context);
        this._mode = mode_factory(this.context);
        this._mult = mult_factory(this.context);
        this._pinv = pinv_factory(this.context);
        this._pow = pow_factory(this.context);
        this._rank = rank_factory(this.context);
        this._remove_col = remove_col_factory(this.context);
        this._remove_row = remove_row_factory(this.context);
        this._reshape = reshape_factory(this.context);
        this._reverse = reverse_factory(this.context);
        this._row = row_factory(this.context);
        this._rows = rows_factory(this.context);
        this._set = set_factory(this.context);
        this._sort = sort_factory(this.context);
        this._submatrix = submatrix_factory(this.context);
        this._sum = sum_factory(this.context);
        this._swap_columns = swap_columns_factory(this.context);
        this._swap_rows = swap_rows_factory(this.context);
        this._trace = trace_factory(this.context);
        this._transpose = transpose_factory(this.context);
    }

    get matrix(): any[][] { return this._matrix; }
    set matrix(value: any[][]) { this._matrix = guardMatrix(value, this.context, true); }

    toString(): string {
        let result = '';
        for (let i = 0; i < this.matrix.length; i++) {
            result += result === '' ? '' : '\n';
            result += '[' + this.matrix[i].join(', ') + ']';
        }
        return result;
    }

    add_col(...args: any[]) {
        return this._add_col(this, ...args);
    }

    add_row(...args: any[]) {
        return this._add_row(this, ...args);
    }

    avg(...args: any[]) {
        return this._avg(this, ...args);
    }

    col(...args: any[]) {
        return this._col(this, ...args);
    }

    columns(...args: any[]) {
        return this._columns(this, ...args);
    }

    concat(...args: any[]) {
        return this._concat(this, ...args);
    }

    copy(...args: any[]) {
        return this._copy(this, ...args);
    }

    det(...args: any[]) {
        return this._det(this, ...args);
    }

    diff(...args: any[]) {
        return this._diff(this, ...args);
    }

    eigenvalues(...args: any[]) {
        return this._eigenvalues(this, ...args);
    }

    eigenvectors(...args: any[]) {
        return this._eigenvectors(this, ...args);
    }

    elements_count(...args: any[]) {
        return this._elements_count(this, ...args);
    }

    fill(...args: any[]) {
        return this._fill(this, ...args);
    }

    get(...args: any[]) {
        return this._get(this, ...args);
    }

    inv(...args: any[]) {
        return this._inv(this, ...args);
    }

    is_antidiagonal(...args: any[]) {
        return this._is_antidiagonal(this, ...args);
    }

    is_antisymmetric(...args: any[]) {
        return this._is_antisymmetric(this, ...args);
    }

    is_binary(...args: any[]) {
        return this._is_binary(this, ...args);
    }

    is_diagonal(...args: any[]) {
        return this._is_diagonal(this, ...args);
    }

    is_identity(...args: any[]) {
        return this._is_identity(this, ...args);
    }

    is_square(...args: any[]) {
        return this._is_square(this, ...args);
    }

    is_stochastic(...args: any[]) {
        return this._is_stochastic(this, ...args);
    }

    is_symmetric(...args: any[]) {
        return this._is_symmetric(this, ...args);
    }

    is_triangular(...args: any[]) {
        return this._is_triangular(this, ...args);
    }

    is_zero(...args: any[]) {
        return this._is_zero(this, ...args);
    }

    kron(...args: any[]) {
        return this._kron(this, ...args);
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

    mult(...args: any[]) {
        return this._mult(this, ...args);
    }

    pinv(...args: any[]) {
        return this._pinv(this, ...args);
    }

    pow(...args: any[]) {
        return this._pow(this, ...args);
    }

    rank(...args: any[]) {
        return this._rank(this, ...args);
    }

    remove_col(...args: any[]) {
        return this._remove_col(this, ...args);
    }

    remove_row(...args: any[]) {
        return this._remove_row(this, ...args);
    }

    reshape(...args: any[]) {
        return this._reshape(this, ...args);
    }

    reverse(...args: any[]) {
        return this._reverse(this, ...args);
    }

    row(...args: any[]) {
        return this._row(this, ...args);
    }

    rows(...args: any[]) {
        return this._rows(this, ...args);
    }

    set(...args: any[]) {
        return this._set(this, ...args);
    }

    sort(...args: any[]) {
        return this._sort(this, ...args);
    }

    submatrix(...args: any[]) {
        return this._submatrix(this, ...args);
    }

    sum(...args: any[]) {
        return this._sum(this, ...args);
    }

    swap_columns(...args: any[]) {
        return this._swap_columns(this, ...args);
    }

    swap_rows(...args: any[]) {
        return this._swap_rows(this, ...args);
    }

    trace(...args: any[]) {
        return this._trace(this, ...args);
    }

    transpose(...args: any[]) {
        return this._transpose(this, ...args);
    }
}
