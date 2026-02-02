// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2025 Alaa-eddine KADDOURI

/**
 * Constant for order sizing type: fixed
 * Used in default_qty_type parameter
 */
export function fixed(context: any) {
    return () => 'fixed';
}
