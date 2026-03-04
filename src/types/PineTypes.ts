// SPDX-License-Identifier: AGPL-3.0-only

export type PlotCharOptions = {
    title?: string;
    char?: string;
    location?: string;
    color?: string;
    offset?: number;
    text?: string;
    textcolor?: string;
    editable?: boolean;
    size?: number;
    show_last?: boolean;
    display?: boolean;
    format?: string;
    precision?: number;
    force_overlay?: boolean;
};

export type PlotOptions = {
    series?: number;
    title?: string;
    color?: string;
    linewidth?: number;
    style?: string;
    trackprice?: boolean;
    histbase?: boolean;
    offset?: number;
    join?: boolean;
    editable?: boolean;
    show_last?: boolean;
    display?: boolean;
    format?: string;
    precision?: number;
    force_overlay?: boolean;
};

export type PlotShapeOptions = {
    series?: number;
    title?: string;
    style?: string;
    location?: string;
    color?: string;
    offset?: number;
    text?: string;
    textcolor?: string;
    editable?: boolean;
    size?: string;
    show_last?: number;
    display?: string;
    format?: string;
    precision?: number;
    force_overlay?: boolean;
};

export type PlotArrowOptions = {
    series?: number;
    title?: string;
    colorup?: string;
    colordown?: string;
    offset?: number;
    minheight?: number;
    maxheight?: number;
    editable?: boolean;
    show_last?: number;
    display?: string;
    format?: string;
    precision?: number;
    force_overlay?: boolean;
};

export type PlotBarOptions = {
    open: number;
    high: number;
    low: number;
    close: number;
    title?: string;
    color?: string;
    editable?: boolean;
    show_last?: number;
    display?: string;
    format?: string;
    precision?: number;
    force_overlay?: boolean;
};

export type BackgroundColorOptions = {
    color?: string;
    offset?: number;
    editable?: boolean;
    show_last?: number;
    title?: string;
    display?: string;
    force_overlay?: boolean;
};
export type BarColorOptions = {
    color?: string;
    offset?: number;
    editable?: boolean;
    show_last?: number;
    title?: string;
    display?: string;
};
export type PlotCandleOptions = {
    open: number;
    high: number;
    low: number;
    close: number;
    title?: string;
    color?: string;
    wickcolor?: string;
    bordercolor?: string;
    editable?: boolean;
    show_last?: number;
    display?: string;
    format?: string;
    precision?: number;
    force_overlay?: boolean;
};
export type IndicatorOptions = {
    title: string;
    shorttitle: string;
    overlay: boolean;
    format: string;
    precision: number;
    scale: string;
    max_bars_back: number;
    timeframe: string;
    timeframe_gaps: boolean;
    explicit_plot_zorder: boolean;
    max_lines_count: number;
    max_labels_count: number;
    max_boxes_count: number;
    calc_bars_count: number;
    max_polylines_count: number;
    dynamic_requests: boolean;
    behind_chart: boolean;
};

export type HlineOptions = {
    price: number;
    title: string;
    color: string;
    linestyle: string;
    linewidth: number;
    editable: boolean;
    display: string;
};

export type FillOptions = {
    plot1: Record<string, any>;
    plot2: Record<string, any>;
    color: string;
    title: string;
    editable: boolean;
    show_last: number;
    fillgaps: boolean;
    display: string;
};
export type TSessionInfo = {
    isfirstbar: boolean;
    isfirstbar_regular: boolean;
    islastbar: boolean;
    islastbar_regular: boolean;
    ismarket: boolean;
    ispostmarket: boolean;
    ispremarket: boolean;
    extended: boolean;
    regular: boolean;
};
