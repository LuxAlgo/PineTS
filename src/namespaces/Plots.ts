import type { BackgroundColorOptions, BarColorOptions, FillOptions, PlotArrowOptions, PlotBarOptions, PlotCandleOptions, PlotOptions, PlotCharOptions, PlotShapeOptions, HlineOptions } from '../types/PineTypes';
import { Series } from '../Series';
import { parseArgsForPineParams, extractCallsiteId } from './utils';

//prettier-ignore
const PLOT_SIGNATURE = [
    'series', 'title', 'color', 'linewidth', 'style', 'trackprice', 'histbase', 'offset',
    'join', 'editable', 'show_last', 'display', 'format', 'precision', 'force_overlay',
];

//prettier-ignore
const PLOTCHAR_SIGNATURE = [
    'series', 'title', 'char', 'location', 'color', 'offset', 'text', 'textcolor',
    'editable', 'size', 'show_last', 'display', 'format', 'precision', 'force_overlay',
];

//prettier-ignore
const PLOTCHAR_ARGS_TYPES = {
    series: 'series', title: 'string', char: 'string', location: 'string',
    color: 'color', offset: 'number', text: 'string', textcolor: 'color',
    editable: 'boolean', size: 'string', show_last: 'number', display: 'string',
    format: 'string', precision: 'number', force_overlay: 'boolean',
};

//prettier-ignore
const PLOT_SHAPE_SIGNATURE = [
    'series', 'title', 'style', 'location', 'color', 'offset', 'text', 'textcolor',
    'editable', 'size', 'show_last', 'display', 'format', 'precision', 'force_overlay',
];

//prettier-ignore
const PLOT_ARROW_SIGNATURE = [
    'series', 'title', 'colorup', 'colordown', 'offset', 'minheight', 'maxheight',
    'editable', 'show_last', 'display', 'format', 'precision', 'force_overlay',
];

//prettier-ignore
const PLOTBAR_SIGNATURE = [
    'open', 'high', 'low', 'close', 'title', 'color', 'editable', 'show_last', 'display', 'format', 'precision', 'force_overlay',
];

//prettier-ignore
const PLOTCANDLE_SIGNATURE = [
    'open', 'high', 'low', 'close', 'title', 'color', 'wickcolor', 'editable', 'show_last', 'bordercolor', 'display', 'format', 'precision', 'force_overlay',
]
//prettier-ignore
const BGCOLOR_SIGNATURE = [
    'color', 'offset', 'editable', 'show_last', 'title', 'display', 'force_overlay',
];

//prettier-ignore
const BARCOLOR_SIGNATURE = [
    'color', 'offset', 'editable', 'show_last', 'title', 'display'
];

//prettier-ignore
const HLINE_SIGNATURE = [
    'price', 'title', 'color', 'linestyle', 'linewidth', 'editable', 'display',
];

//prettier-ignore
const FILL_SIGNATURE = [
    'plot1', 'plot2', 'color', 'title', 'editable', 'show_last', 'fillgaps', 'display',
];

//prettier-ignore
const PLOT_ARGS_TYPES = {
    series: 'series', title: 'string', color: 'color', linewidth: 'number',
    style: 'string', trackprice: 'boolean', histbase: 'number', offset: 'number',
    join: 'bool', editable: 'boolean', show_last: 'number', display: 'string',
    format: 'string', precision: 'number', force_overlay: 'boolean',
};

//prettier-ignore
const PLOT_SHAPE_ARGS_TYPES = {
    series: 'series', title: 'string', style: 'string', location: 'string',
    color: 'color', offset: 'number', text: 'string', textcolor: 'color',
    editable: 'boolean', size: 'string', show_last: 'number', display: 'string',
    format: 'string', precision: 'number', force_overlay: 'boolean',
};

//prettier-ignore
const PLOT_ARROW_ARGS_TYPES = {
    series: 'series', title: 'string', colorup: 'color', colordown: 'color',
    offset: 'number', minheight: 'number', maxheight: 'number',
    editable: 'boolean', show_last: 'number', display: 'string',
    format: 'string', precision: 'number', force_overlay: 'boolean',
};

//prettier-ignore
const PLOTBAR_ARGS_TYPES = {
    open: 'series', high: 'series', low: 'series', close: 'series',
    title: 'string', color: 'color', editable: 'boolean', show_last: 'number', display: 'string',
    format: 'string', precision: 'number', force_overlay: 'boolean',
};

//prettier-ignore
const PLOTCANDLE_ARGS_TYPES = {
    open: 'series', high: 'series', low: 'series', close: 'series',
    title: 'string', color: 'color', wickcolor: 'color', bordercolor: 'color',
    editable: 'boolean', show_last: 'number', display: 'string',
    format: 'string', precision: 'number', force_overlay: 'boolean',
};

//prettier-ignore
const BGCOLOR_ARGS_TYPES = {
    color: 'color', offset: 'number', editable: 'boolean', show_last: 'number',
    title: 'string', display: 'string', force_overlay: 'boolean',
};

//prettier-ignore
const BARCOLOR_ARGS_TYPES = {
    color: 'color', offset: 'number', editable: 'boolean', show_last: 'number',
    title: 'string', display: 'string',
};

//prettier-ignore
const HLINE_ARGS_TYPES = {
    price: 'series', title: 'string', color: 'color', linestyle: 'string', linewidth: 'number',
    editable: 'boolean', display: 'string'
};

//prettier-ignore
const FILL_ARGS_TYPES = {
    plot1: 'object', plot2: 'object', color: 'color', title: 'string', editable: 'boolean', show_last: 'number', fillgaps: 'boolean', display: 'string',
};

export class PlotHelper {
    constructor(private context: any) { }

    /**
     * Resolve the key to use in context.plots.
     * Uses title by default for backward compatibility.
     * On title collision (two different call sites producing the same title),
     * appends the transpiler-generated callsite suffix: "title#N".
     * The callsite ID is generated by ScopeManager as "#0", "#1", etc.
     */
    private _resolvePlotKey(title: string | undefined, callsiteId: string | undefined): string {
        if (title) {
            const existing = this.context.plots[title];
            // No collision: title not yet used, or same callsite reusing it (same plot, next bar)
            if (!existing || !callsiteId || existing._callsiteId === callsiteId) {
                return title;
            }
            // Collision: same title but different callsite → append callsite suffix
            return title + callsiteId;
        }
        // No title: use callsite ID or generic fallback
        return callsiteId || 'plot';
    }

    private extractPlotOptions(options: PlotCharOptions | PlotShapeOptions) {
        const _options: any = {};
        for (let key in options) {
            _options[key] = Series.from(options[key]).get(0);
        }
        return _options;
    }

    public get linestyle_dashed() {
        return 'linestyle_dashed';
    }
    public get linestyle_dotted() {
        return 'linestyle_dotted';
    }
    public get linestyle_solid() {
        return 'linestyle_solid';
    }
    public get style_area() {
        return 'style_area';
    }
    public get style_areabr() {
        return 'style_areabr';
    }
    public get style_circles() {
        return 'style_circles';
    }
    public get style_columns() {
        return 'style_columns';
    }
    public get style_cross() {
        return 'style_cross';
    }
    public get style_histogram() {
        return 'style_histogram';
    }
    public get style_line() {
        return 'style_line';
    }
    public get style_linebr() {
        return 'style_linebr';
    }
    public get style_stepline() {
        return 'style_stepline';
    }
    public get style_stepline_diamond() {
        return 'style_stepline_diamond';
    }
    public get style_steplinebr() {
        return 'style_steplinebr';
    }

    param(source: any, index: number = 0, name?: string) {
        return Series.from(source).get(index);
    }

    //in the current implementation, plot functions are only used to collect data for the plots array and map it to the market data
    plotchar(...args) {
        const callsiteId = extractCallsiteId(args);
        const _parsed = parseArgsForPineParams<PlotCharOptions>(args, PLOTCHAR_SIGNATURE, PLOTCHAR_ARGS_TYPES);
        const { series, title, ...others } = _parsed;
        const options = this.extractPlotOptions(others);
        const plotKey = this._resolvePlotKey(title, callsiteId);

        if (!this.context.plots[plotKey]) {
            this.context.plots[plotKey] = { data: [], options: { ...options, style: 'char' }, title, _plotKey: plotKey, _callsiteId: callsiteId };
        }

        const value = Series.from(series).get(0);

        this.context.plots[plotKey].data.push({
            title,
            time: this.context.marketData[this.context.idx].openTime,
            value: value,
            options: {
                char: options.char,
                color: options.color,
                textcolor: options.textcolor,
                location: options.location,
                size: options.size,
                offset: options.offset,
            },
        });
        return this.context.plots[plotKey];
    }

    //this will map to plot() - see README.md for more details

    any(...args) {
        const callsiteId = extractCallsiteId(args);
        const _parsed = parseArgsForPineParams<PlotOptions>(args, PLOT_SIGNATURE, PLOT_ARGS_TYPES);
        const { series, title, ...others } = _parsed;
        const options = this.extractPlotOptions(others);
        const plotKey = this._resolvePlotKey(title, callsiteId);

        // Check if user explicitly passed a color argument (even if it's na/null).
        // After extractPlotOptions, null color becomes null (not undefined).
        const hasExplicitColor = 'color' in others;

        if (!this.context.plots[plotKey]) {
            const overlay = options.force_overlay ?? (this.context?.indicator?.overlay || false);
            this.context.plots[plotKey] = { data: [], options: { ...options, overlay }, title, _plotKey: plotKey, _callsiteId: callsiteId };
        }

        const value = Series.from(series).get(0);

        // Set per-point color for QFChart:
        //   - User didn't pass color  → use Pine Script default #2962ff
        //   - User passed a color string → use that value (e.g. '#089981')
        //   - User passed color = na  → undefined (QFChart hides the segment)
        let rawColor = options.color;
        // Resolve bound functions (e.g. chart.fg_color, chart.bg_color)
        if (typeof rawColor === 'function') rawColor = rawColor();
        const pointColor = hasExplicitColor
            ? (typeof rawColor === 'string' ? rawColor : undefined)
            : (rawColor || '#2962ff');
        const pointOptions: any = { color: pointColor };
        if ('offset' in others) pointOptions.offset = options.offset;

        this.context.plots[plotKey].data.push({
            title,
            time: this.context.marketData[this.context.idx].openTime,
            value: value,
            options: pointOptions,
        });
        return this.context.plots[plotKey];
    }
    plotshape(...args) {
        const callsiteId = extractCallsiteId(args);
        const _parsed = parseArgsForPineParams<PlotShapeOptions>(args, PLOT_SHAPE_SIGNATURE, PLOT_SHAPE_ARGS_TYPES);
        const { series, title, ...others } = _parsed;
        const options: PlotShapeOptions = this.extractPlotOptions(others);
        const plotKey = this._resolvePlotKey(title, callsiteId);

        if (!this.context.plots[plotKey]) {
            const overlay = options.force_overlay ?? (this.context?.indicator?.overlay || false);
            this.context.plots[plotKey] = {
                data: [],
                options: { ...options, style: 'shape', shape: options.style, overlay },
                title,
                _plotKey: plotKey,
                _callsiteId: callsiteId,
            };
        }
        const value = Series.from(series).get(0);
        this.context.plots[plotKey].data.push({
            title,
            time: this.context.marketData[this.context.idx].openTime,
            value: value,
            options:
                options?.location === 'absolute' || value
                    ? {
                        text: options.text,
                        textcolor: options.textcolor,
                        color: options.color,
                        offset: options.offset,
                        shape: options.style,
                        location: options.location,
                        size: options.size,
                    }
                    : undefined,
        });
        return this.context.plots[plotKey];
    }

    plotarrow(...args) {
        const callsiteId = extractCallsiteId(args);
        const _parsed = parseArgsForPineParams<PlotArrowOptions>(args, PLOT_ARROW_SIGNATURE, PLOT_ARROW_ARGS_TYPES);
        const { series, title, ...others } = _parsed;
        const value = Series.from(series).get(0);
        const options: PlotArrowOptions = this.extractPlotOptions(others);
        const plotKey = this._resolvePlotKey(title, callsiteId);

        if (!this.context.plots[plotKey]) {
            const overlay = options.force_overlay ?? (this.context?.indicator?.overlay || false);
            this.context.plots[plotKey] = { data: [], options: { ...options, style: 'shape', overlay }, title, _plotKey: plotKey, _callsiteId: callsiteId };
        }

        this.context.plots[plotKey].data.push({
            title,
            time: this.context.marketData[this.context.idx].openTime,
            value: value,
            options:
                typeof value === 'number' && !isNaN(value) && value !== 0
                    ? {
                          text: undefined,
                          textcolor: undefined,
                          color: value > 0 ? options.colorup : options.colordown,
                          offset: options.offset,
                          shape: value > 0 ? 'shape_arrow_up' : 'shape_arrow_down',
                          location: value > 0 ? 'BelowBar' : 'AboveBar',
                          height: options.maxheight,
                      }
                    : undefined,
        });
        return this.context.plots[plotKey];
    }

    plotbar(...args) {
        const callsiteId = extractCallsiteId(args);
        const _parsed = parseArgsForPineParams<PlotBarOptions>(args, PLOTBAR_SIGNATURE, PLOTBAR_ARGS_TYPES);
        const { open, high, low, close, title, ...others } = _parsed;
        const options: PlotBarOptions = this.extractPlotOptions(others);
        const plotKey = this._resolvePlotKey(title, callsiteId);

        if (!this.context.plots[plotKey]) {
            const overlay = options.force_overlay ?? (this.context?.indicator?.overlay || false);
            this.context.plots[plotKey] = { data: [], options: { ...options, style: 'bar', overlay }, title, _plotKey: plotKey, _callsiteId: callsiteId };
        }

        const value = [Series.from(open).get(0), Series.from(high).get(0), Series.from(low).get(0), Series.from(close).get(0)];

        this.context.plots[plotKey].data.push({
            title,
            time: this.context.marketData[this.context.idx].openTime,
            value: value,
            options: { color: options.color },
        });
    }

    plotcandle(...args) {
        const callsiteId = extractCallsiteId(args);
        const _parsed = parseArgsForPineParams<PlotCandleOptions>(args, PLOTCANDLE_SIGNATURE, PLOTCANDLE_ARGS_TYPES);
        const { open, high, low, close, title, ...others } = _parsed;
        const options: PlotCandleOptions = this.extractPlotOptions(others);
        const plotKey = this._resolvePlotKey(title, callsiteId);

        if (!this.context.plots[plotKey]) {
            const overlay = options.force_overlay ?? (this.context?.indicator?.overlay || false);
            this.context.plots[plotKey] = { data: [], options: { ...options, style: 'candle', overlay }, title, _plotKey: plotKey, _callsiteId: callsiteId };
        }

        const value = [Series.from(open).get(0), Series.from(high).get(0), Series.from(low).get(0), Series.from(close).get(0)];

        this.context.plots[plotKey].data.push({
            title,
            time: this.context.marketData[this.context.idx].openTime,
            value: value,
            options: { color: options.color, wickcolor: options.wickcolor, bordercolor: options.bordercolor },
        });
        return this.context.plots[plotKey];
    }

    bgcolor(...args) {
        const callsiteId = extractCallsiteId(args);
        const _parsed = parseArgsForPineParams<BackgroundColorOptions>(args, BGCOLOR_SIGNATURE, BGCOLOR_ARGS_TYPES);
        const { title, ...others } = _parsed;
        const options: BackgroundColorOptions = this.extractPlotOptions(others);
        const plotKey = this._resolvePlotKey(title, callsiteId);

        if (!this.context.plots[plotKey]) {
            const overlay = options.force_overlay ?? (this.context?.indicator?.overlay || false);
            this.context.plots[plotKey] = { data: [], options: { ...options, style: 'background', overlay }, title, _plotKey: plotKey, _callsiteId: callsiteId };
        }

        this.context.plots[plotKey].data.push({
            title,
            time: this.context.marketData[this.context.idx].openTime,
            value: options.color && options.color !== 'na' && options?.color.toString() !== 'NaN',
            options: { color: options.color },
        });
    }
    barcolor(...args) {
        const callsiteId = extractCallsiteId(args);
        const _parsed = parseArgsForPineParams<BarColorOptions>(args, BGCOLOR_SIGNATURE, BGCOLOR_ARGS_TYPES);
        const { title, ...others } = _parsed;
        const options: BarColorOptions = this.extractPlotOptions(others);
        const plotKey = this._resolvePlotKey(title, callsiteId);

        if (!this.context.plots[plotKey]) {
            this.context.plots[plotKey] = { data: [], options: { ...options, style: 'barcolor' }, title, _plotKey: plotKey, _callsiteId: callsiteId };
        }

        this.context.plots[plotKey].data.push({
            title,
            time: this.context.marketData[this.context.idx].openTime,
            value: options.color && options.color !== 'na' && options?.color.toString() !== 'NaN',
            options: { color: options.color },
        });
        return this.context.plots[plotKey];
    }
}

export class HlineHelper {
    constructor(private context: any) { }

    public get style_dashed() {
        return 'dashed';
    }
    public get style_solid() {
        return 'solid';
    }
    public get style_dotted() {
        return 'dotted';
    }

    param(source: any, index: number = 0, name?: string) {
        return Series.from(source).get(index);
    }

    //this will map to hline()
    any(...args) {
        // Extract transpiler-injected callsite ID and forward to plot.any
        const callsiteId = extractCallsiteId(args);
        const _parsed = parseArgsForPineParams<HlineOptions>(args, HLINE_SIGNATURE, HLINE_ARGS_TYPES);
        const { price, title, color, linestyle, linewidth, editable, display } = _parsed
        const plotArgs: any[] = [price, { title, color, linestyle, linewidth, editable, display, style: "hline" }];
        if (callsiteId) {
            plotArgs.push({ __callsiteId: callsiteId });
        }
        return this.context.pine.plot.any(...plotArgs);
    }
}

export class FillHelper {
    constructor(private context: any) { }
    param(source: any, index: number = 0, name?: string) {
        return Series.from(source).get(index);
    }
    any(...args) {
        const callsiteId = extractCallsiteId(args);

        // Detect gradient fill: fill(plot1, plot2, top_value, bottom_value, top_color, bottom_color, ...)
        // vs simple fill:       fill(plot1, plot2, color, title, ...)
        // Positional form: 3rd arg (index 2) is a number (top_value).
        // Named form: transpiler may bundle named args into an object at index 2
        // containing top_value, bottom_value, top_color, bottom_color.
        const isGradientPositional = args.length >= 6 && typeof args[2] === 'number';
        const namedArgs = !isGradientPositional && args.length >= 3 && args[2] !== null
            && typeof args[2] === 'object' && 'top_value' in args[2] ? args[2] : null;
        const isGradientFill = isGradientPositional || namedArgs !== null;

        if (isGradientFill) {
            const plot1 = args[0];
            const plot2 = args[1];
            const top_value = namedArgs ? Series.from(namedArgs.top_value).get(0) : args[2];
            const bottom_value = namedArgs ? Series.from(namedArgs.bottom_value).get(0) : args[3];
            const top_color = namedArgs ? Series.from(namedArgs.top_color).get(0) : args[4];
            const bottom_color = namedArgs ? Series.from(namedArgs.bottom_color).get(0) : args[5];
            const title = namedArgs
                ? (namedArgs.title || undefined)
                : (args.length > 6 && typeof args[6] === 'string' ? args[6] : undefined);

            const p1Key = plot1?._plotKey || plot1?.title;
            const p2Key = plot2?._plotKey || plot2?.title;
            let fillKey = title || 'fill';
            const existing = this.context.plots[fillKey];
            if (existing && callsiteId && existing._callsiteId !== callsiteId) {
                fillKey = callsiteId;
            }

            if (!this.context.plots[fillKey]) {
                this.context.plots[fillKey] = {
                    title: title || 'Fill',
                    plot1: p1Key,
                    plot2: p2Key,
                    data: [],
                    options: {
                        plot1: p1Key,
                        plot2: p2Key,
                        style: 'fill',
                        gradient: true,
                    },
                    _plotKey: fillKey,
                    _callsiteId: callsiteId,
                };
            }

            // Push per-bar gradient data
            this.context.plots[fillKey].data.push({
                time: this.context.marketData[this.context.idx].openTime,
                value: null,
                options: { top_value, bottom_value, top_color, bottom_color },
            });
        } else {
            const _parsed = parseArgsForPineParams<FillOptions>(args, FILL_SIGNATURE, FILL_ARGS_TYPES);
            const { plot1, plot2, color, title, editable, show_last, fillgaps, display } = _parsed;

            // For fill: prefer title, then callsite ID, then generic fallback
            let fillKey = title || 'fill';
            const existing = this.context.plots[fillKey];
            if (existing && callsiteId && existing._callsiteId !== callsiteId) {
                fillKey = callsiteId;
            }

            // Resolve the color for this bar.
            // The color may be a Series, a param tuple [value, name], or a plain string.
            const resolvedColor = Series.from(color).get(0);

            if (!this.context.plots[fillKey]) {
                const p1Key = plot1?._plotKey || plot1?.title;
                const p2Key = plot2?._plotKey || plot2?.title;
                this.context.plots[fillKey] = {
                    title: title || 'Fill',
                    plot1: p1Key,
                    plot2: p2Key,
                    data: [],
                    options: {
                        plot1: p1Key,
                        plot2: p2Key,
                        color: resolvedColor, editable, show_last, fillgaps, display, style: 'fill',
                    },
                    _plotKey: fillKey,
                    _callsiteId: callsiteId,
                };
            }

            // Always push per-bar color data so dynamic colors (e.g. green/red flip) work.
            // The fill renderer will use per-bar colors when the data array is populated.
            this.context.plots[fillKey].data.push({
                time: this.context.marketData[this.context.idx].openTime,
                value: null,
                options: { color: resolvedColor },
            });
        }
    }
}
