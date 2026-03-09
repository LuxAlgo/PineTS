// SPDX-License-Identifier: AGPL-3.0-only
// This file is auto-generated. Do not edit manually.
// Run: npm run generate:matrix-index

export { PineMatrixObject } from './PineMatrixObject';

import { PineMatrixObject } from './PineMatrixObject';
import { new_fn } from './methods/new';
import { param } from './methods/param';

export class PineMatrix {
    [key: string]: any;

    constructor(private context: any) {

        // Install methods
    this.add_col = (id: PineMatrixObject, ...args: any[]) => id.add_col(...args);
    this.add_row = (id: PineMatrixObject, ...args: any[]) => id.add_row(...args);
    this.avg = (id: PineMatrixObject, ...args: any[]) => id.avg(...args);
    this.col = (id: PineMatrixObject, ...args: any[]) => id.col(...args);
    this.columns = (id: PineMatrixObject, ...args: any[]) => id.columns(...args);
    this.concat = (id: PineMatrixObject, ...args: any[]) => id.concat(...args);
    this.copy = (id: PineMatrixObject, ...args: any[]) => id.copy(...args);
    this.det = (id: PineMatrixObject, ...args: any[]) => id.det(...args);
    this.diff = (id: PineMatrixObject, ...args: any[]) => id.diff(...args);
    this.eigenvalues = (id: PineMatrixObject, ...args: any[]) => id.eigenvalues(...args);
    this.eigenvectors = (id: PineMatrixObject, ...args: any[]) => id.eigenvectors(...args);
    this.elements_count = (id: PineMatrixObject, ...args: any[]) => id.elements_count(...args);
    this.fill = (id: PineMatrixObject, ...args: any[]) => id.fill(...args);
    this.get = (id: PineMatrixObject, ...args: any[]) => id.get(...args);
    this.inv = (id: PineMatrixObject, ...args: any[]) => id.inv(...args);
    this.is_antidiagonal = (id: PineMatrixObject, ...args: any[]) => id.is_antidiagonal(...args);
    this.is_antisymmetric = (id: PineMatrixObject, ...args: any[]) => id.is_antisymmetric(...args);
    this.is_binary = (id: PineMatrixObject, ...args: any[]) => id.is_binary(...args);
    this.is_diagonal = (id: PineMatrixObject, ...args: any[]) => id.is_diagonal(...args);
    this.is_identity = (id: PineMatrixObject, ...args: any[]) => id.is_identity(...args);
    this.is_square = (id: PineMatrixObject, ...args: any[]) => id.is_square(...args);
    this.is_stochastic = (id: PineMatrixObject, ...args: any[]) => id.is_stochastic(...args);
    this.is_symmetric = (id: PineMatrixObject, ...args: any[]) => id.is_symmetric(...args);
    this.is_triangular = (id: PineMatrixObject, ...args: any[]) => id.is_triangular(...args);
    this.is_zero = (id: PineMatrixObject, ...args: any[]) => id.is_zero(...args);
    this.kron = (id: PineMatrixObject, ...args: any[]) => id.kron(...args);
    this.max = (id: PineMatrixObject, ...args: any[]) => id.max(...args);
    this.median = (id: PineMatrixObject, ...args: any[]) => id.median(...args);
    this.min = (id: PineMatrixObject, ...args: any[]) => id.min(...args);
    this.mode = (id: PineMatrixObject, ...args: any[]) => id.mode(...args);
    this.mult = (id: PineMatrixObject, ...args: any[]) => id.mult(...args);
    this.new = new_fn(context);
    this.param = param(context);
    this.pinv = (id: PineMatrixObject, ...args: any[]) => id.pinv(...args);
    this.pow = (id: PineMatrixObject, ...args: any[]) => id.pow(...args);
    this.rank = (id: PineMatrixObject, ...args: any[]) => id.rank(...args);
    this.remove_col = (id: PineMatrixObject, ...args: any[]) => id.remove_col(...args);
    this.remove_row = (id: PineMatrixObject, ...args: any[]) => id.remove_row(...args);
    this.reshape = (id: PineMatrixObject, ...args: any[]) => id.reshape(...args);
    this.reverse = (id: PineMatrixObject, ...args: any[]) => id.reverse(...args);
    this.row = (id: PineMatrixObject, ...args: any[]) => id.row(...args);
    this.rows = (id: PineMatrixObject, ...args: any[]) => id.rows(...args);
    this.set = (id: PineMatrixObject, ...args: any[]) => id.set(...args);
    this.sort = (id: PineMatrixObject, ...args: any[]) => id.sort(...args);
    this.submatrix = (id: PineMatrixObject, ...args: any[]) => id.submatrix(...args);
    this.sum = (id: PineMatrixObject, ...args: any[]) => id.sum(...args);
    this.swap_columns = (id: PineMatrixObject, ...args: any[]) => id.swap_columns(...args);
    this.swap_rows = (id: PineMatrixObject, ...args: any[]) => id.swap_rows(...args);
    this.trace = (id: PineMatrixObject, ...args: any[]) => id.trace(...args);
    this.transpose = (id: PineMatrixObject, ...args: any[]) => id.transpose(...args);
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
