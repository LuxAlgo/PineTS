// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

/** Only versioned Pine is accepted unless the caller explicitly opts in to JavaScript. */
export type SourceMode = 'nativePine' | 'trustedJavaScript';

// A change to source classification or final verification must invalidate
// prepared artifacts, even when the same Indicator instance is reused.
export const SOURCE_POLICY_VERSION = 1;
