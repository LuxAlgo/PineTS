// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Named arguments for the drawing-object functions (line / box / label / linefill /
 * polyline / table setters, getters, copy, delete).
 *
 * The transpiler turns `line.set_extend(id=l, extend=extend.none)` into
 * `line.set_extend({id: l, extend: extend.none})`, but these helpers take positional
 * parameters only, so a named call used to hand the whole bag to `id` and change
 * nothing. Each table lists a function's parameters by their Pine names (the
 * TradingView reference), in positional order; `withNamedArgs` (namedArgs.ts) maps a
 * trailing bag onto those positions before the call.
 */

const ID = ['id'];
const one = (name: string) => ['id', name];

const LINE: Record<string, string[]> = {
    set_x1: one('x'),
    set_y1: one('y'),
    set_x2: one('x'),
    set_y2: one('y'),
    set_xy1: ['id', 'x', 'y'],
    set_xy2: ['id', 'x', 'y'],
    set_color: one('color'),
    set_width: one('width'),
    set_style: one('style'),
    set_extend: one('extend'),
    set_xloc: ['id', 'x1', 'x2', 'xloc'],
    set_first_point: one('point'),
    set_second_point: one('point'),
    get_x1: ID,
    get_y1: ID,
    get_x2: ID,
    get_y2: ID,
    get_price: one('x'),
    copy: ID,
    delete: ID,
};

const BOX: Record<string, string[]> = {
    set_left: one('left'),
    set_right: one('right'),
    set_top: one('top'),
    set_bottom: one('bottom'),
    set_lefttop: ['id', 'left', 'top'],
    set_rightbottom: ['id', 'right', 'bottom'],
    set_top_left_point: one('point'),
    set_bottom_right_point: one('point'),
    set_xloc: ['id', 'left', 'right', 'xloc'],
    set_bgcolor: one('color'),
    set_border_color: one('color'),
    set_border_width: one('width'),
    set_border_style: one('style'),
    set_extend: one('extend'),
    set_text: one('text'),
    set_text_color: one('text_color'),
    set_text_size: one('text_size'),
    set_text_halign: one('text_halign'),
    set_text_valign: one('text_valign'),
    set_text_wrap: one('text_wrap'),
    set_text_font_family: one('text_font_family'),
    set_text_formatting: one('text_formatting'),
    get_left: ID,
    get_right: ID,
    get_top: ID,
    get_bottom: ID,
    copy: ID,
    delete: ID,
};

const LABEL: Record<string, string[]> = {
    set_x: one('x'),
    set_y: one('y'),
    set_xy: ['id', 'x', 'y'],
    set_text: one('text'),
    set_color: one('color'),
    set_textcolor: one('textcolor'),
    set_size: one('size'),
    set_style: one('style'),
    set_textalign: one('textalign'),
    set_tooltip: one('tooltip'),
    set_text_font_family: one('text_font_family'),
    set_text_formatting: one('text_formatting'),
    set_xloc: ['id', 'x', 'xloc'],
    set_yloc: one('yloc'),
    set_point: one('point'),
    get_x: ID,
    get_y: ID,
    get_text: ID,
    copy: ID,
    delete: ID,
};

const LINEFILL: Record<string, string[]> = {
    set_color: one('color'),
    get_line1: ID,
    get_line2: ID,
    delete: ID,
};

const POLYLINE: Record<string, string[]> = { delete: ID };

const cellSetter = (name: string) => ['table_id', 'column', 'row', name];
const tableSetter = (name: string) => ['table_id', name];

// table.cell / clear / merge_cells parse their own arguments.
const TABLE: Record<string, string[]> = {
    delete: ['table_id'],
    cell_set_text: cellSetter('text'),
    cell_set_bgcolor: cellSetter('bgcolor'),
    cell_set_text_color: cellSetter('text_color'),
    cell_set_text_size: cellSetter('text_size'),
    cell_set_height: cellSetter('height'),
    cell_set_width: cellSetter('width'),
    cell_set_tooltip: cellSetter('tooltip'),
    cell_set_text_halign: cellSetter('text_halign'),
    cell_set_text_valign: cellSetter('text_valign'),
    cell_set_text_font_family: cellSetter('text_font_family'),
    cell_set_text_formatting: cellSetter('text_formatting'),
    set_position: tableSetter('position'),
    set_bgcolor: tableSetter('bgcolor'),
    set_border_color: tableSetter('border_color'),
    set_border_width: tableSetter('border_width'),
    set_frame_color: tableSetter('frame_color'),
    set_frame_width: tableSetter('frame_width'),
};

export const DRAWING_PARAMS: Record<string, Record<string, string[]>> = {
    line: LINE,
    box: BOX,
    label: LABEL,
    linefill: LINEFILL,
    polyline: POLYLINE,
    table: TABLE,
};