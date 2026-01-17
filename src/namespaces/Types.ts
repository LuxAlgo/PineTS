export enum order {
    ascending = 1,
    descending = 0,
}

export enum currency {
    AED = 'AED',
    ARS = 'ARS',
    AUD = 'AUD',
    BDT = 'BDT',
    BHD = 'BHD',
    BRL = 'BRL',
    BTC = 'BTC',
    CAD = 'CAD',
    CHF = 'CHF',
    CLP = 'CLP',
    CNY = 'CNY',
    COP = 'COP',
    CZK = 'CZK',
    DKK = 'DKK',
    EGP = 'EGP',
    ETH = 'ETH',
    EUR = 'EUR',
    GBP = 'GBP',
    HKD = 'HKD',
    HUF = 'HUF',
    IDR = 'IDR',
    ILS = 'ILS',
    INR = 'INR',
    ISK = 'ISK',
    JPY = 'JPY',
    KES = 'KES',
    KRW = 'KRW',
    KWD = 'KWD',
    LKR = 'LKR',
    MAD = 'MAD',
    MXN = 'MXN',
    MYR = 'MYR',
    NGN = 'NGN',
    NOK = 'NOK',
    NONE = 'NONE',
    NZD = 'NZD',
    PEN = 'PEN',
    PHP = 'PHP',
    PKR = 'PKR',
    PLN = 'PLN',
    QAR = 'QAR',
    RON = 'RON',
    RSD = 'RSD',
    RUB = 'RUB',
    SAR = 'SAR',
    SEK = 'SEK',
    SGD = 'SGD',
    THB = 'THB',
    TND = 'TND',
    TRY = 'TRY',
    TWD = 'TWD',
    USD = 'USD',
    USDT = 'USDT',
    VES = 'VES',
    VND = 'VND',
    ZAR = 'ZAR',
}

export enum dayofweek {
    sunday = 1,
    monday = 2,
    tuesday = 3,
    wednesday = 4,
    thursday = 5,
    friday = 6,
    saturday = 7,
}

export enum display {
    all = 'all',
    data_window = 'data_window',
    none = 'none',
    pane = 'pane',
    price_scale = 'price_scale',
    status_line = 'status_line',
}

export enum shape {
    flag = 'flag',
    arrowdown = 'arrowdown',
    arrowup = 'arrowup',
    circle = 'circle',
    cross = 'cross',
    diamond = 'diamond',
    labeldown = 'labeldown',
    labelup = 'labelup',
    square = 'square',
    triangledown = 'triangledown',
    triangleup = 'triangleup',
    xcross = 'xcross',
}

export enum location {
    abovebar = 'abovebar',
    belowbar = 'belowbar',
    absolute = 'absolute',
    bottom = 'bottom',
    top = 'top',
}

export enum size {
    auto = 'auto',
    tiny = 'tiny',
    small = 'small',
    normal = 'normal',
    large = 'large',
    huge = 'huge',
}

export enum format {
    inherit = 'inherit',
    mintick = 'mintick',
    percent = 'percent',
    price = 'price',
    volume = 'volume',
}
export enum plot {
    linestyle_dashed = 'linestyle_dashed',
    linestyle_dotted = 'linestyle_dotted',
    linestyle_solid = 'linestyle_solid',
    style_area = 'style_area',
    style_areabr = 'style_areabr',
    style_circles = 'style_circles',
    style_columns = 'style_columns',
    style_cross = 'style_cross',
    style_histogram = 'style_histogram',
    style_line = 'style_line',
    style_linebr = 'style_linebr',
    style_stepline = 'style_stepline',
    style_stepline_diamond = 'style_stepline_diamond',
    style_steplinebr = 'style_steplinebr',
}

export enum barmerge {
    gaps_on = 'gaps_on',
    gaps_off = 'gaps_off',
    lookahead_on = 'lookahead_on',
    lookahead_off = 'lookahead_off',
}

// ============================================================
// Adjustment Types
// ============================================================

export enum adjustment {
    dividends = 'dividends',
    none = 'none',
    splits = 'splits',
}

// ============================================================
// Alert Frequency Types
// ============================================================

export const alert = {
    freq: {
        all: 'all',
        once_per_bar: 'once_per_bar',
        once_per_bar_close: 'once_per_bar_close',
    },
};

// ============================================================
// Back Adjustment Types
// ============================================================

export enum backadjustment {
    inherit = 'inherit',
    off = 'off',
    on = 'on',
}

// ============================================================
// Extend Types
// ============================================================

export enum extend {
    both = 'both',
    left = 'left',
    none = 'none',
    right = 'right',
}

// ============================================================
// Font Family Types
// ============================================================

export const font = {
    family: {
        default: 'default',
        monospace: 'monospace',
    },
};

// ============================================================
// Position Types (for tables)
// ============================================================

export enum position {
    bottom_center = 'bottom_center',
    bottom_left = 'bottom_left',
    bottom_right = 'bottom_right',
    middle_center = 'middle_center',
    middle_left = 'middle_left',
    middle_right = 'middle_right',
    top_center = 'top_center',
    top_left = 'top_left',
    top_right = 'top_right',
}

// ============================================================
// Scale Types
// ============================================================

export enum scale {
    left = 'left',
    none = 'none',
    right = 'right',
}

// ============================================================
// Settlement as Close Types
// ============================================================

export enum settlement_as_close {
    inherit = 'inherit',
    off = 'off',
    on = 'on',
}

// ============================================================
// Splits Types
// ============================================================

export enum splits {
    denominator = 'denominator',
    numerator = 'numerator',
}

// ============================================================
// Text Types
// ============================================================

export const text = {
    // Text alignment
    align_center: 'center',
    align_left: 'left',
    align_right: 'right',
    align_top: 'top',
    align_bottom: 'bottom',
    // Text format
    format_inherit: 'inherit',
    format_mintick: 'mintick',
    format_percent: 'percent',
    format_volume: 'volume',
    // Text wrap
    wrap_auto: 'auto',
    wrap_none: 'none',
};

// ============================================================
// X Location Types (for drawings)
// ============================================================

export enum xloc {
    bar_index = 'bar_index',
    bar_time = 'bar_time',
}

// ============================================================
// Y Location Types (for labels)
// ============================================================

export enum yloc {
    abovebar = 'abovebar',
    belowbar = 'belowbar',
    price = 'price',
}

// ============================================================
// Label Styles
// ============================================================

export const label = {
    style_arrowdown: 'arrowdown',
    style_arrowup: 'arrowup',
    style_circle: 'circle',
    style_cross: 'cross',
    style_diamond: 'diamond',
    style_flag: 'flag',
    style_label_center: 'label_center',
    style_label_down: 'label_down',
    style_label_left: 'label_left',
    style_label_lower_left: 'label_lower_left',
    style_label_lower_right: 'label_lower_right',
    style_label_right: 'label_right',
    style_label_up: 'label_up',
    style_label_upper_left: 'label_upper_left',
    style_label_upper_right: 'label_upper_right',
    style_none: 'none',
    style_square: 'square',
    style_text_outline: 'text_outline',
    style_triangledown: 'triangledown',
    style_triangleup: 'triangleup',
    style_xcross: 'xcross',
};

// ============================================================
// Line Styles
// ============================================================

export const line = {
    style_arrow_both: 'arrow_both',
    style_arrow_left: 'arrow_left',
    style_arrow_right: 'arrow_right',
    style_dashed: 'dashed',
    style_dotted: 'dotted',
    style_solid: 'solid',
};

// ============================================================
// Exports
// ============================================================

const types = {
    order,
    currency,
    dayofweek,
    display,
    shape,
    location,
    size,
    format,
    barmerge,
    adjustment,
    alert,
    backadjustment,
    extend,
    font,
    position,
    scale,
    settlement_as_close,
    splits,
    text,
    xloc,
    yloc,
    label,
    line,
};

export default types;
