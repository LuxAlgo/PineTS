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
    flag = 'shape_flag',
    arrowdown = 'shape_arrow_down',
    arrowup = 'shape_arrow_up',
    circle = 'shape_circle',
    cross = 'shape_cross',
    diamond = 'shape_diamond',
    labeldown = 'shape_label_down',
    labelup = 'shape_label_up',
    square = 'shape_square',
    triangledown = 'shape_triangle_down',
    triangleup = 'shape_triangle_up',
    xcross = 'shape_xcross',
}

export enum location {
    abovebar = 'AboveBar',
    belowbar = 'BelowBar',
    absolute = 'Absolute',
    bottom = 'Bottom',
    top = 'Top',
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

export enum xloc {
    bar_index = 'bi',
    bar_time = 'bt',
}

export enum yloc {
    price = 'pr',
    abovebar = 'ab',
    belowbar = 'bl',
}

export enum text {
    align_left = 'left',
    align_center = 'center',
    align_right = 'right',
    wrap_auto = 'auto',
    wrap_none = 'none',
}

export enum font {
    family_default = 'default',
    family_monospace = 'monospace',
}

export enum adjustment {
    none = 'none',
    splits = 'splits',
    dividends = 'dividends',
}

export enum backadjustment {
    inherit = 'inherit',
    off = 'off',
    on = 'on',
}

export enum earnings {
    actual = 'earnings_actual',
    estimate = 'earnings_estimate',
    standardized = 'earnings_standardized',
    future_eps = 'earnings_future_eps',
    future_period_end_time = 'earnings_future_period_end_time',
    future_revenue = 'earnings_future_revenue',
    future_time = 'earnings_future_time',
}

export enum dividends {
    gross = 'dividends_gross',
    net = 'dividends_net',
    future_amount = 'dividends_future_amount',
    future_ex_date = 'dividends_future_ex_date',
    future_pay_date = 'dividends_future_pay_date',
}

export enum splits {
    denominator = 'splits_denominator',
    numerator = 'splits_numerator',
}

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
    xloc,
    yloc,
    text,
    font,
    adjustment,
    backadjustment,
    earnings,
    dividends,
    splits,
};

export default types;
