// Known Pine Script namespaces that might be used as functions or objects
export const KNOWN_NAMESPACES = ['ta', 'math', 'request', 'array', 'input'];

// This is used to transform ns() calls to ns.any() calls
export const NAMESPACES_LIKE = ['hline', 'plot', 'fill'];

// Async methods that require await keyword (format: 'namespace.method')
export const ASYNC_METHODS = ['request.security', 'request.security_lower_tf'];

// All known data variables in the context
export const CONTEXT_DATA_VARS = ['open', 'high', 'low', 'close', 'volume', 'hl2', 'hlc3', 'ohlc4', 'openTime', 'closeTime'];

// All known Pine variables in the context
export const CONTEXT_PINE_VARS = [
    //namespaces
    ...KNOWN_NAMESPACES,
    //plots
    'plotchar',
    'plotshape',
    'plotarrow',
    'plotbar',
    'plotcandle',
    'plot',
    'bgcolor',
    'barcolor',
    'hline',
    'fill',

    //declarations
    'indicator',
    'strategy',
    'library',

    //
    'alertcondition',
    'fixnan',
    'na',
    'color',
    'nz',
    'str',
    'box',
    'line',
    'label',
    'table',
    'map',
    'matrix',
    'log',
    'map',
    //types
    'Type', //UDT
    'bool',

    //market info
    'timeframe',
    'ticker',
    'syminfo',
    'barstate',

    //builtin variables
    'bar_index',
    'last_bar_index',
    'last_bar_time',
    'inputs',

    // Pine Script enum types
    'order',
    'currency',
    'display',
    'shape',
    'location',
    'size',
    'format',
    'dayofweek',
];

// All known core variables in the context
//names exposed in legacy pine.core namespace
//this will be deprecated then removed
export const CONTEXT_CORE_VARS = ['na', 'nz', 'plot', 'plotchar', 'color', 'hline', 'fill'];
