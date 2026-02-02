// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2025 Alaa-eddine KADDOURI

import { Series } from '../../../Series';

/**
 * Parameter wrapper for strategy namespace
 * Type B - Simple Unwrapping (like input, array, map, matrix)
 */
export function param(context: any) {
    return (source: any, index?: number) => {
        return Series.from(source).get(index || 0);
    };
}
