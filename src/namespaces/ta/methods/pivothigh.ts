// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';
import { pivot } from '../utils/pivotWindow';

export function pivothigh(context: any) {
    return (source: any, _leftbars: any, _rightbars: any, _callId?: string) => {
        // without a source the transpiler's call id lands in the _rightbars slot (a string value)
        if (typeof _rightbars === 'string') {
            _callId = _rightbars;
            _rightbars = _leftbars;
            _leftbars = source;
            source = context.data.high;
        }
        const leftbars = Series.from(_leftbars).get(0);
        const rightbars = Series.from(_rightbars).get(0);

        // Only the candidate confirmed on the current bar is examined
        return context.precision(pivot(context, _callId, source, leftbars, rightbars, true));
    };
}