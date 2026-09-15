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

/**
 * A Pine display value is a SET of surfaces: `display.all - display.price_scale` and
 * `display.pane + display.data_window` are valid Pine. PineTS represents a display as
 * the concatenation of its member names in this canonical order ('all' / 'none' for the
 * full / empty set) — the shape `+` on the string enum has always produced, so hosts
 * parsing member names keep working. The transpiler routes `+` / `-` between display
 * operands to `display.__union` / `display.__minus` (native `-` on strings is NaN).
 */
const DISPLAY_SURFACES = [display.pane, display.data_window, display.status_line, display.price_scale] as const;
const DISPLAY_TOKENS = [...DISPLAY_SURFACES, display.all, display.none];

function displaySurfaces(value: unknown): Set<string> {
    const out = new Set<string>();
    if (typeof value !== 'string') return out; // `na` or a non-display operand contributes nothing
    // Greedy scan of the concatenated names; a `+` the transpiler could not attribute
    // to display operands still concatenates in source order, which this reads as well.
    for (let i = 0; i < value.length; ) {
        const tok = DISPLAY_TOKENS.find((t) => value.startsWith(t, i));
        if (!tok) break; // unknown residue: keep what was recognized
        if (tok === display.all) return new Set(DISPLAY_SURFACES);
        if (tok !== display.none) out.add(tok);
        i += tok.length;
    }
    return out;
}

function displayFromSurfaces(surfaces: Set<string>): string {
    const kept = DISPLAY_SURFACES.filter((s) => surfaces.has(s));
    if (kept.length === DISPLAY_SURFACES.length) return display.all;
    if (kept.length === 0) return display.none;
    return kept.join('');
}

/** `a + b` on display values — the union of both surface sets. */
export function displayUnion(a: unknown, b: unknown): string {
    return displayFromSurfaces(new Set([...displaySurfaces(a), ...displaySurfaces(b)]));
}

/** `a - b` on display values — the surfaces of `a` without those of `b`. */
export function displayMinus(a: unknown, b: unknown): string {
    const out = displaySurfaces(a);
    for (const s of displaySurfaces(b)) out.delete(s);
    return displayFromSurfaces(out);
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

export enum extend {
    left = 'l',
    right = 'r',
    both = 'b',
    none = 'n',
}

export enum text {
    align_bottom = 'bottom',
    align_top = 'top',
    align_left = 'left',
    align_center = 'center',
    align_right = 'right',
    wrap_auto = 'auto',
    wrap_none = 'none',
    format_bold = 'bold',
    format_italic = 'italic',
    format_none = 'none',
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

export enum position {
    top_left = 'top_left',
    top_center = 'top_center',
    top_right = 'top_right',
    middle_left = 'middle_left',
    middle_center = 'middle_center',
    middle_right = 'middle_right',
    bottom_left = 'bottom_left',
    bottom_center = 'bottom_center',
    bottom_right = 'bottom_right',
}

export enum scale {
    left = 'left',
    none = 'none',
    right = 'right',
}

export enum settlement_as_close {
    inherit = 'inherit',
    off = 'off',
    on = 'on',
}

const types = {
    order,
    currency,
    dayofweek,
    // The runtime `display` carries the set operators the transpiler emits for `+` / `-`.
    display: { ...display, __union: displayUnion, __minus: displayMinus },
    shape,
    location,
    size,
    format,
    barmerge,
    xloc,
    yloc,
    extend,
    text,
    font,
    adjustment,
    backadjustment,
    earnings,
    dividends,
    splits,
    position,
    scale,
    settlement_as_close,
};

export default types;
