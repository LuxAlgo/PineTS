export declare enum order {
    ascending = 1,
    descending = 0
}
export declare enum currency {
    AED = "AED",
    ARS = "ARS",
    AUD = "AUD",
    BDT = "BDT",
    BHD = "BHD",
    BRL = "BRL",
    BTC = "BTC",
    CAD = "CAD",
    CHF = "CHF",
    CLP = "CLP",
    CNY = "CNY",
    COP = "COP",
    CZK = "CZK",
    DKK = "DKK",
    EGP = "EGP",
    ETH = "ETH",
    EUR = "EUR",
    GBP = "GBP",
    HKD = "HKD",
    HUF = "HUF",
    IDR = "IDR",
    ILS = "ILS",
    INR = "INR",
    ISK = "ISK",
    JPY = "JPY",
    KES = "KES",
    KRW = "KRW",
    KWD = "KWD",
    LKR = "LKR",
    MAD = "MAD",
    MXN = "MXN",
    MYR = "MYR",
    NGN = "NGN",
    NOK = "NOK",
    NONE = "NONE",
    NZD = "NZD",
    PEN = "PEN",
    PHP = "PHP",
    PKR = "PKR",
    PLN = "PLN",
    QAR = "QAR",
    RON = "RON",
    RSD = "RSD",
    RUB = "RUB",
    SAR = "SAR",
    SEK = "SEK",
    SGD = "SGD",
    THB = "THB",
    TND = "TND",
    TRY = "TRY",
    TWD = "TWD",
    USD = "USD",
    USDT = "USDT",
    VES = "VES",
    VND = "VND",
    ZAR = "ZAR"
}
export declare enum dayofweek {
    sunday = 1,
    monday = 2,
    tuesday = 3,
    wednesday = 4,
    thursday = 5,
    friday = 6,
    saturday = 7
}
export declare enum display {
    all = "all",
    data_window = "data_window",
    none = "none",
    pane = "pane",
    price_scale = "price_scale",
    status_line = "status_line"
}
export declare enum shape {
    flag = "flag",
    arrowdown = "arrowdown",
    arrowup = "arrowup",
    circle = "circle",
    cross = "cross",
    diamond = "diamond",
    labeldown = "labeldown",
    labelup = "labelup",
    square = "square",
    triangledown = "triangledown",
    triangleup = "triangleup",
    xcross = "xcross"
}
export declare enum location {
    abovebar = "abovebar",
    belowbar = "belowbar",
    absolute = "absolute",
    bottom = "bottom",
    top = "top"
}
export declare enum size {
    auto = "auto",
    tiny = "tiny",
    small = "small",
    normal = "normal",
    large = "large",
    huge = "huge"
}
export declare enum format {
    inherit = "inherit",
    mintick = "mintick",
    percent = "percent",
    price = "price",
    volume = "volume"
}
export declare enum plot {
    linestyle_dashed = "linestyle_dashed",
    linestyle_dotted = "linestyle_dotted",
    linestyle_solid = "linestyle_solid",
    style_area = "style_area",
    style_areabr = "style_areabr",
    style_circles = "style_circles",
    style_columns = "style_columns",
    style_cross = "style_cross",
    style_histogram = "style_histogram",
    style_line = "style_line",
    style_linebr = "style_linebr",
    style_stepline = "style_stepline",
    style_stepline_diamond = "style_stepline_diamond",
    style_steplinebr = "style_steplinebr"
}
export declare enum barmerge {
    gaps_on = "gaps_on",
    gaps_off = "gaps_off",
    lookahead_on = "lookahead_on",
    lookahead_off = "lookahead_off"
}
export declare enum adjustment {
    dividends = "dividends",
    none = "none",
    splits = "splits"
}
export declare const alert: {
    freq: {
        all: string;
        once_per_bar: string;
        once_per_bar_close: string;
    };
};
export declare enum backadjustment {
    inherit = "inherit",
    off = "off",
    on = "on"
}
export declare enum extend {
    both = "both",
    left = "left",
    none = "none",
    right = "right"
}
export declare const font: {
    family: {
        default: string;
        monospace: string;
    };
};
export declare enum position {
    bottom_center = "bottom_center",
    bottom_left = "bottom_left",
    bottom_right = "bottom_right",
    middle_center = "middle_center",
    middle_left = "middle_left",
    middle_right = "middle_right",
    top_center = "top_center",
    top_left = "top_left",
    top_right = "top_right"
}
export declare enum scale {
    left = "left",
    none = "none",
    right = "right"
}
export declare enum settlement_as_close {
    inherit = "inherit",
    off = "off",
    on = "on"
}
export declare enum splits {
    denominator = "denominator",
    numerator = "numerator"
}
export declare const text: {
    align_center: string;
    align_left: string;
    align_right: string;
    align_top: string;
    align_bottom: string;
    format_bold: string;
    format_italic: string;
    format_none: string;
    wrap_auto: string;
    wrap_none: string;
};
export declare const dividends: {
    future_amount: string;
    future_ex_date: string;
    future_pay_date: string;
    gross: string;
    net: string;
};
export declare const earnings: {
    future_eps: string;
    future_period_end_time: string;
    future_revenue: string;
    future_time: string;
    actual: string;
    estimate: string;
    standardized: string;
};
export declare enum xloc {
    bar_index = "bar_index",
    bar_time = "bar_time"
}
export declare enum yloc {
    abovebar = "abovebar",
    belowbar = "belowbar",
    price = "price"
}
export declare const label: {
    style_arrowdown: string;
    style_arrowup: string;
    style_circle: string;
    style_cross: string;
    style_diamond: string;
    style_flag: string;
    style_label_center: string;
    style_label_down: string;
    style_label_left: string;
    style_label_lower_left: string;
    style_label_lower_right: string;
    style_label_right: string;
    style_label_up: string;
    style_label_upper_left: string;
    style_label_upper_right: string;
    style_none: string;
    style_square: string;
    style_text_outline: string;
    style_triangledown: string;
    style_triangleup: string;
    style_xcross: string;
};
export declare const line: {
    style_arrow_both: string;
    style_arrow_left: string;
    style_arrow_right: string;
    style_dashed: string;
    style_dotted: string;
    style_solid: string;
};
declare const types: {
    order: typeof order;
    currency: typeof currency;
    dayofweek: typeof dayofweek;
    display: typeof display;
    shape: typeof shape;
    location: typeof location;
    size: typeof size;
    format: typeof format;
    barmerge: typeof barmerge;
    adjustment: typeof adjustment;
    alert: {
        freq: {
            all: string;
            once_per_bar: string;
            once_per_bar_close: string;
        };
    };
    backadjustment: typeof backadjustment;
    dividends: {
        future_amount: string;
        future_ex_date: string;
        future_pay_date: string;
        gross: string;
        net: string;
    };
    earnings: {
        future_eps: string;
        future_period_end_time: string;
        future_revenue: string;
        future_time: string;
        actual: string;
        estimate: string;
        standardized: string;
    };
    extend: typeof extend;
    font: {
        family: {
            default: string;
            monospace: string;
        };
    };
    position: typeof position;
    scale: typeof scale;
    settlement_as_close: typeof settlement_as_close;
    splits: typeof splits;
    text: {
        align_center: string;
        align_left: string;
        align_right: string;
        align_top: string;
        align_bottom: string;
        format_bold: string;
        format_italic: string;
        format_none: string;
        wrap_auto: string;
        wrap_none: string;
    };
    xloc: typeof xloc;
    yloc: typeof yloc;
    label: {
        style_arrowdown: string;
        style_arrowup: string;
        style_circle: string;
        style_cross: string;
        style_diamond: string;
        style_flag: string;
        style_label_center: string;
        style_label_down: string;
        style_label_left: string;
        style_label_lower_left: string;
        style_label_lower_right: string;
        style_label_right: string;
        style_label_up: string;
        style_label_upper_left: string;
        style_label_upper_right: string;
        style_none: string;
        style_square: string;
        style_text_outline: string;
        style_triangledown: string;
        style_triangleup: string;
        style_xcross: string;
    };
    line: {
        style_arrow_both: string;
        style_arrow_left: string;
        style_arrow_right: string;
        style_dashed: string;
        style_dotted: string;
        style_solid: string;
    };
};
export default types;
