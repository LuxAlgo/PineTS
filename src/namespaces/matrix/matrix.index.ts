// SPDX-License-Identifier: AGPL-3.0-only
// This file is auto-generated. Do not edit manually.
// Run: npm run generate:matrix-index

export { PineMatrixObject } from './PineMatrixObject';

import { PineMatrixObject } from './PineMatrixObject';
import { withNamedArgs } from '../namedArgs';
import { MATRIX_PARAMS } from '../collectionParams';
import { new_fn } from './methods/new';
import { param } from './methods/param';

export class PineMatrix {
    [key: string]: any;

    constructor(private context: any) {

        // Install methods
    this.add_col = withNamedArgs((id: PineMatrixObject, ...args: any[]) => id.add_col(...args), MATRIX_PARAMS.add_col);
    this.add_row = withNamedArgs((id: PineMatrixObject, ...args: any[]) => id.add_row(...args), MATRIX_PARAMS.add_row);
    this.avg = withNamedArgs((id: PineMatrixObject, ...args: any[]) => id.avg(...args), MATRIX_PARAMS.avg);
    this.col = withNamedArgs((id: PineMatrixObject, ...args: any[]) => id.col(...args), MATRIX_PARAMS.col);
    this.columns = withNamedArgs((id: PineMatrixObject, ...args: any[]) => id.columns(...args), MATRIX_PARAMS.columns);
    this.concat = withNamedArgs((id: PineMatrixObject, ...args: any[]) => id.concat(...args), MATRIX_PARAMS.concat);
    this.copy = withNamedArgs((id: PineMatrixObject, ...args: any[]) => id.copy(...args), MATRIX_PARAMS.copy);
    this.det = withNamedArgs((id: PineMatrixObject, ...args: any[]) => id.det(...args), MATRIX_PARAMS.det);
    this.diff = withNamedArgs((id: PineMatrixObject, ...args: any[]) => id.diff(...args), MATRIX_PARAMS.diff);
    this.eigenvalues = withNamedArgs((id: PineMatrixObject, ...args: any[]) => id.eigenvalues(...args), MATRIX_PARAMS.eigenvalues);
    this.eigenvectors = withNamedArgs((id: PineMatrixObject, ...args: any[]) => id.eigenvectors(...args), MATRIX_PARAMS.eigenvectors);
    this.elements_count = withNamedArgs((id: PineMatrixObject, ...args: any[]) => id.elements_count(...args), MATRIX_PARAMS.elements_count);
    this.fill = withNamedArgs((id: PineMatrixObject, ...args: any[]) => id.fill(...args), MATRIX_PARAMS.fill);
    this.get = withNamedArgs((id: PineMatrixObject, ...args: any[]) => id.get(...args), MATRIX_PARAMS.get);
    this.inv = withNamedArgs((id: PineMatrixObject, ...args: any[]) => id.inv(...args), MATRIX_PARAMS.inv);
    this.is_antidiagonal = withNamedArgs((id: PineMatrixObject, ...args: any[]) => id.is_antidiagonal(...args), MATRIX_PARAMS.is_antidiagonal);
    this.is_antisymmetric = withNamedArgs((id: PineMatrixObject, ...args: any[]) => id.is_antisymmetric(...args), MATRIX_PARAMS.is_antisymmetric);
    this.is_binary = withNamedArgs((id: PineMatrixObject, ...args: any[]) => id.is_binary(...args), MATRIX_PARAMS.is_binary);
    this.is_diagonal = withNamedArgs((id: PineMatrixObject, ...args: any[]) => id.is_diagonal(...args), MATRIX_PARAMS.is_diagonal);
    this.is_identity = withNamedArgs((id: PineMatrixObject, ...args: any[]) => id.is_identity(...args), MATRIX_PARAMS.is_identity);
    this.is_square = withNamedArgs((id: PineMatrixObject, ...args: any[]) => id.is_square(...args), MATRIX_PARAMS.is_square);
    this.is_stochastic = withNamedArgs((id: PineMatrixObject, ...args: any[]) => id.is_stochastic(...args), MATRIX_PARAMS.is_stochastic);
    this.is_symmetric = withNamedArgs((id: PineMatrixObject, ...args: any[]) => id.is_symmetric(...args), MATRIX_PARAMS.is_symmetric);
    this.is_triangular = withNamedArgs((id: PineMatrixObject, ...args: any[]) => id.is_triangular(...args), MATRIX_PARAMS.is_triangular);
    this.is_zero = withNamedArgs((id: PineMatrixObject, ...args: any[]) => id.is_zero(...args), MATRIX_PARAMS.is_zero);
    this.kron = withNamedArgs((id: PineMatrixObject, ...args: any[]) => id.kron(...args), MATRIX_PARAMS.kron);
    this.max = withNamedArgs((id: PineMatrixObject, ...args: any[]) => id.max(...args), MATRIX_PARAMS.max);
    this.median = withNamedArgs((id: PineMatrixObject, ...args: any[]) => id.median(...args), MATRIX_PARAMS.median);
    this.min = withNamedArgs((id: PineMatrixObject, ...args: any[]) => id.min(...args), MATRIX_PARAMS.min);
    this.mode = withNamedArgs((id: PineMatrixObject, ...args: any[]) => id.mode(...args), MATRIX_PARAMS.mode);
    this.mult = withNamedArgs((id: PineMatrixObject, ...args: any[]) => id.mult(...args), MATRIX_PARAMS.mult);
    this.new = new_fn(context);
    this.param = param(context);
    this.pinv = withNamedArgs((id: PineMatrixObject, ...args: any[]) => id.pinv(...args), MATRIX_PARAMS.pinv);
    this.pow = withNamedArgs((id: PineMatrixObject, ...args: any[]) => id.pow(...args), MATRIX_PARAMS.pow);
    this.rank = withNamedArgs((id: PineMatrixObject, ...args: any[]) => id.rank(...args), MATRIX_PARAMS.rank);
    this.remove_col = withNamedArgs((id: PineMatrixObject, ...args: any[]) => id.remove_col(...args), MATRIX_PARAMS.remove_col);
    this.remove_row = withNamedArgs((id: PineMatrixObject, ...args: any[]) => id.remove_row(...args), MATRIX_PARAMS.remove_row);
    this.reshape = withNamedArgs((id: PineMatrixObject, ...args: any[]) => id.reshape(...args), MATRIX_PARAMS.reshape);
    this.reverse = withNamedArgs((id: PineMatrixObject, ...args: any[]) => id.reverse(...args), MATRIX_PARAMS.reverse);
    this.row = withNamedArgs((id: PineMatrixObject, ...args: any[]) => id.row(...args), MATRIX_PARAMS.row);
    this.rows = withNamedArgs((id: PineMatrixObject, ...args: any[]) => id.rows(...args), MATRIX_PARAMS.rows);
    this.set = withNamedArgs((id: PineMatrixObject, ...args: any[]) => id.set(...args), MATRIX_PARAMS.set);
    this.sort = withNamedArgs((id: PineMatrixObject, ...args: any[]) => id.sort(...args), MATRIX_PARAMS.sort);
    this.submatrix = withNamedArgs((id: PineMatrixObject, ...args: any[]) => id.submatrix(...args), MATRIX_PARAMS.submatrix);
    this.sum = withNamedArgs((id: PineMatrixObject, ...args: any[]) => id.sum(...args), MATRIX_PARAMS.sum);
    this.swap_columns = withNamedArgs((id: PineMatrixObject, ...args: any[]) => id.swap_columns(...args), MATRIX_PARAMS.swap_columns);
    this.swap_rows = withNamedArgs((id: PineMatrixObject, ...args: any[]) => id.swap_rows(...args), MATRIX_PARAMS.swap_rows);
    this.trace = withNamedArgs((id: PineMatrixObject, ...args: any[]) => id.trace(...args), MATRIX_PARAMS.trace);
    this.transpose = withNamedArgs((id: PineMatrixObject, ...args: any[]) => id.transpose(...args), MATRIX_PARAMS.transpose);
    // Type-specific aliases — used internally by PineTS to handle strong types.
    // The transpiler rewrites matrix.new<float>(...) → matrix.new_float(...)
    this.new_float = new_fn(context);
    this.new_int = new_fn(context);
    this.new_string = new_fn(context);
    this.new_bool = new_fn(context);
    this.new_color = new_fn(context);
    this.new_line = new_fn(context);
    this.new_label = new_fn(context);
    this.new_box = new_fn(context);
    this.new_linefill = new_fn(context);
    this.new_table = new_fn(context);
    }
}

export default PineMatrix;
