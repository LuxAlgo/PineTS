// Known Pine Script namespaces that might be used as functions or objects
export const KNOWN_NAMESPACES = ['ta', 'math', 'request', 'array', 'input'];

// This is used to transform ns() calls to ns.any() calls
// Entries with a __value property also support dual-use as variables (e.g. time, na)
export const NAMESPACES_LIKE = ['hline', 'plot', 'fill', 'label', 'line', 'na', 'time', 'time_close', 'dayofmonth', 'dayofweek', 'hour', 'minute', 'month', 'second', 'weekofyear', 'year'];

// Async methods that require await keyword (format: 'namespace.method')
export const ASYNC_METHODS = ['request.security', 'request.security_lower_tf'];

// Factory methods that create objects with side effects (format: 'namespace.method')
// When used inside `var` declarations, these calls are wrapped in arrow functions
// so they are only evaluated on bar 0 (deferred evaluation via initVar thunk).
export const FACTORY_METHODS = ['line.new', 'line.copy', 'label.new', 'label.copy', 'polyline.new', 'box.new', 'box.copy', 'table.new'];

// All known data variables in the context
export const CONTEXT_DATA_VARS = ['open', 'high', 'low', 'close', 'volume', 'hl2', 'hlc3', 'ohlc4', 'hlcc4', 'openTime', 'closeTime'];

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
    'timestamp',
    'str',
    'box',
    'line',
    'label',
    'table',
    'chart',
    'linefill',
    'polyline',
    'map',
    'matrix',
    'log',
    'map',
    //types
    'Type', //UDT
    'bool',
    'int',
    'float',
    'string',

    //market info
    'timeframe',
    'syminfo',
    'barstate',

    //builtin variables
    'bar_index',
    'last_bar_index',
    'last_bar_time',
    'inputs',
    'time',
    'time_close',
    'time_tradingday',
    'dayofmonth',
    'hour',
    'minute',
    'month',
    'second',
    'weekofyear',
    'year',

    // Pine Script enum types
    'order',
    'currency',
    'display',
    'shape',
    'location',
    'size',
    'format',
    'dayofweek',

    // Coordinate and alignment constants
    'xloc',
    'yloc',
    'text',
    'font',
    'extend',
    'position',

    // Adjustment constants
    'adjustment',
    'backadjustment',

    // Financial data constants
    'earnings',
    'dividends',
    'splits',
];

// All known core variables in the context
//names exposed in legacy pine.core namespace
//this will be deprecated then removed
export const CONTEXT_CORE_VARS = ['na', 'nz', 'plot', 'plotchar', 'color', 'hline', 'fill'];
