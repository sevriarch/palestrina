import * as fs from 'fs';
import * as path from 'path';

import type { JSONValue, CanvasArg, CanvasArgOpts, ScoreCanvasOpts, Score } from '../types';

import * as transformations from '../transformations/transformations';

import { dumpOneLine } from '../dump/dump';

/**
 * A helper module exporting visualization functions.
 */

function readTemplateFile(template: string): string {
    if (typeof template !== 'string') {
        throw new Error(`template must be a string; was ${dumpOneLine(template)}`);
    }

    if (template.match(/[^a-z0-9-]/g)) {
        throw new Error(`invalid template: ${template}`);
    }

    const file = path.join(__dirname, 'templates', template + '.template');

    return fs.readFileSync(file, { encoding: 'utf8' });
}

export function JSONTemplate(template: string, substitutions: { [k: string]: JSONValue } = {}): string {
    let str = readTemplateFile(template);

    for (const key of Object.keys(substitutions)) {
        str = str.replace(new RegExp(key, 'g'), JSON.stringify(substitutions[key]));
    }

    return str;
}

function getColorRule(rule?: string): (n: number) => string {
    switch (rule) {
    case 'mod12':
        return n => {
            switch (n % 12) {
            case 0: return '#E08080';
            case 1: return '#80E080';
            case 2: return '#8080E0';
            case 3: return '#E0E080';
            case 4: return '#E080E0';
            case 5: return '#80E0E0';
            case 6: return '#E02020';
            case 7: return '#20E080';
            case 8: return '#2080E0';
            case 9: return '#E0E020';
            case 10: return '#E020E0';
            default: return '#20E0E0';
            }
        };

    default:
        return () => '#C0C0C0';
    }
}

function getValueRule(rule?: string): (n: number) => string {
    switch (rule) {
    case 'note':
        return n => {
            return [ 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B' ][n % 12]
                + String.fromCharCode(0x2080 + (Math.floor(n / 12) - 1));
        };
    case 'pitch':
        return n => [ 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B' ][n % 12];
    default:
        return n => n.toString();
    }
}

/*
type ParsedCanvasArgOpts = {
    horizPx: number,   // Number of pixels per MIDI quarter note horizontally
    vertPx: number,    // Number of pixels per unit value vertically
    beatPx: number,    // If showing beat lines, number of pixels per beat
    lineRepeatPx: number,  // If showing beat lines, show them every `beatlines` beats
    noteRepeatPx: number, // Show list of notes every n pixels
    height: number,     // Exact height of canvas; overrides vertPx
    width: number,      // Exact width of canvas; overrides horizPx
    leftpad: number,    // Pad canvas this many pixels on the left
    rightpad: number,   // Pad canvas this many pixels on the right
    toppad: number,     // Pad canvas this many pixels on the top
    btmpad: number,     // Pad canvas this many pixels on the bottom
    header?: string,    // Text header to display at the top left of the canvas
    maxval: number,     // Maximum value to show on Y axis
    minval: number,     // Minimum value to show on Y axis
    showbeats: boolean, // Show vertical lines every n beats?
    beats: number,      // Number of beats per bar
    textstyle: string,  // RGB colour for displaying text
    beatstyle: string,  // RGB colour for displaying first beat of the bar
    offbeatstyle: string, // RGB color for displaying offbeats
    vposRule: (v: number) => number,  // Function for calculating vertical positions
    colorRule: (i: number) => string; // Function for converting a pitch to a color
    valueRule: (i: number) => string; // Function for converting a pitch to a color
};

function parseOptions({ name, timeline, data, options = {} }: CanvasArg): ParsedCanvasArgOpts {
    if (typeof name !== 'string') {
        throw new Error(`visualizations.render2DCanvas(): canvas name should be a string, was ${dumpOneLine(name)}`);
    }

    if (!Array.isArray(timeline)) {
        throw new Error(`visualizations.render2DCanvas(): timeline was not an array, was ${dumpOneLine(timeline)}`);
    }

    if (!Array.isArray(data)) {
        throw new Error(`visualizations.render2DCanvas(): data was not an array, was ${dumpOneLine(data)}`);
    }

    if (timeline.length !== data.length) {
        throw new Error(`visualizations.render2DCanvas(): timeline length ${timeline.length} is not the same as data length ${data.length}`);
    }

    const horizPx = options.px_horiz ?? (1 / 40);
    const vertPx = options.px_vert ?? 10;
    const flattened = data.flat();
    const maxval = options.maxval || Math.max(...flattened);
    const minval = options.minval || Math.min(...flattened);
    const leftpad = options.leftpad ?? 16;
    const rightpad = options.rightpad ?? 8;
    const toppad = options.header ? 10 : 0;
    const btmpad = options.barlines ? 10 : 0;
    const beats = options.beats || 0;

    return {
        // Pixel scale
        horizPx,
        vertPx,
        beatPx: 1 / beats,

        // Padding
        leftpad, 
        rightpad,
        toppad,
        btmpad,

        // SVG size and positioning within it
        maxval,
        minval,
        height: Math.floor(toppad + (options.height || ((1 + maxval - minval) * vertPx))),
        width: Math.floor(leftpad + (options.width || ((1 + timeline[timeline.length - 1]) * horizPx)) + rightpad),

        // Rule methods for calculating how and what to display
        vposRule: v => toppad + vertPx * (maxval - v),
        colorRule: getColorRule(options.color_rule),
        valueRule: getValueRule(options.value_rule),

        // Styling
        textstyle: options.textstyle || '#C0C0C0',
        beatstyle: options.beatstyle || '#404040',
        offbeatstyle: options.offbeatstyle || '#202020',

        // Annotations
        showbeats: options.barlines ? true : false, 
        lineRepeatPx: options.barlines ?? 0,
        noteRepeatPx: options.barlines ? options.barlines * (options.value_bars || 8) : 1e9,
        beats,
        header: options.header,
    };
}

/**
 * Return HTML and Javascript for rendering a 2D canvas.
 * Fields within the argument passed are:
 * name: A name for the canvas.
 * timeline: A timeline of events in MIDI ticks.
 * data: An array of values corresponding to the timeline.
 * options: A list of options for rendering the canvas.
 */
export function render2DCanvas({ name, timeline, data, options = {} }: CanvasArg): string {
    if (typeof name !== 'string') {
        throw new Error(`visualizations.render2DCanvas(): canvas name should be a string, was ${dumpOneLine(name)}`);
    }

    if (!Array.isArray(timeline)) {
        throw new Error(`visualizations.render2DCanvas(): timeline was not an array, was ${dumpOneLine(timeline)}`);
    }

    if (!Array.isArray(data)) {
        throw new Error(`visualizations.render2DCanvas(): data was not an array, was ${dumpOneLine(data)}`);
    }

    if (timeline.length !== data.length) {
        throw new Error(`visualizations.render2DCanvas(): timeline length ${timeline.length} is not the same as data length ${data.length}`);
    }

    return JSONTemplate('canvas-2d', {
        __CANVAS_NAME__: name + '-canvas',
        __CANVAS_TIMELINE__: timeline,
        __CANVAS_DATA__: data,
        __CANVAS_OPTS__: options
    });
}

function getSVGHeader(ht: number, wd: number, id = 'notes_svg', beatstyle = '#404040'): string {
    if (typeof id !== 'string') {
        throw new Error(`visualizations.render2DSVG(): canvas name should be a string, was ${dumpOneLine(id)}`);
    }

    return `<svg id="${id}" viewbox="0,0,${wd},${ht}" width="${wd}" height="${ht}" xmlns="http://www.w3.org/2000/svg" style="border:1px solid black; background: black">
  <style>
    text {
      font-family: "Arial";
      font-size: 12px;
    }

    line {
      stroke-width: 1;
      stroke: ${beatstyle};
    }
  </style>
`;
}

function getSVGFooter(): string {
    return '</svg>\n';
}

/**
 * Return HTML for a 2D SVG.
 * Fields within the argument passed are:
 * name: A name for the SVG.
 * timeline: A timeline of events in MIDI ticks.
 * data: An array of values corresponding to the timeline.
 * options: A list of options for rendering the canvas.
 */
function render2DSVG(timeline: number[], data: number[][], options: CanvasArgOpts): string {
    if (timeline.length === 0) {
        return getSVGHeader(0, 0, options.id, options.beatstyle) + getSVGFooter();
    }

    const flattened = data.flat();
    const maxval = options.maxval || Math.max(...flattened);
    const minval = options.minval || Math.min(...flattened);
    const timerange = 1 + timeline[timeline.length - 1];
    const pitchrange = 1 + maxval - minval;

    // Pixel scale
    const horizPx = options.width ? (options.width / timerange) : options.px_horiz ?? (1 / 40);
    const vertPx = options.height ? (options.height / pitchrange) : options.px_vert ?? 10;
    const lineRepeatPx = options.barlines;
    const noteRepeatPx = lineRepeatPx ? lineRepeatPx * (options.value_bars || 8) : 1e9;

    // Padding
    const LEFTPAD  = options.leftpad ?? 16;
    const RIGHTPAD = options.rightpad ?? 8;
    const TOPPAD   = 10;
    const BTMPAD   = options.barlines ? 10 : 0;

    // SVG size and positioning within it
    const vposRule: (v: number) => number = v => TOPPAD + vertPx * (maxval - v);
    const height = Math.floor(TOPPAD + (options.height || (pitchrange * vertPx))) + BTMPAD;
    const width  = Math.floor(LEFTPAD + (options.width || (timerange * horizPx)) + RIGHTPAD);

    // Styling
    const colorRule = getColorRule(options.color_rule);
    const valueRule = getValueRule(options.value_rule);
    const textstyle = options.textstyle || '#C0C0C0';
    const beatstyle = options.beatstyle || '#404040';
    const offbeatstyle = options.offbeatstyle || '#202020';
    const beats = options.beats ?? 0;

    let str = getSVGHeader(height, width, options.id, beatstyle);

    // Horizontal alternation of background color by octave
    for (let i = 11; i < 128; i += 24) {
        const band = vertPx * 12;

        str += `  <rect x="0" y="${vposRule(i)}" width="${width}" height="${band}" fill="#101010" />
  <rect x="0" y="${vposRule(i) + band}" width="${width}" height="${band}" fill="#000000" />
`;
    }

    // Brief text header for the SVG
    str += `  <text x="${LEFTPAD}" y="10" fill="${textstyle}">${options.header}</text>\n`;

    // Annotate SVG with pitches
    const pxgap = Math.max(Math.ceil(10 / vertPx), 1);
    for (let i = minval; i <= maxval; i += pxgap) {
        for (let j = 2; j < width; j += noteRepeatPx) {
            str += `  <text x="${j}" y="${vposRule(i) + vertPx / 2 + 5}" fill="${colorRule(i)}">${valueRule(i)}</text>\n`;
        }
    }

    // Annotate with barlines and sub-bar-lines
    if (lineRepeatPx) {
        const beatPx = lineRepeatPx / beats;

        let bar = 1;
        for (let i = LEFTPAD; i < width; i += lineRepeatPx) {
            const val = i + lineRepeatPx / 2 - 8;

            str += `  <line x1="${i}" y1="0" x2="${i}" y2="${height}" />
  <text x="${val}" y="${height}" fill="${textstyle}">${bar}</text>
  <text x="${val}" y="10" fill="${textstyle}">${bar}</text>
`;
            bar++;

            if (beats) {
                for (let j = 1; j < beats; j++) {
                    const xpos = i + j + beatPx;

                    str += `  <line x1="${xpos}" y1="0" x2="${xpos}" y2=${height} style="stroke:${offbeatstyle}" />\n`;
                }
            }
        }
    }

    // Add notes to SVG
    for (let i = 0; i < timeline.length; i++) {
        const x = LEFTPAD + Math.floor(timeline[i] * horizPx);
        const wd = Math.max(Math.ceil((timeline[i + 1] - timeline[i]) * horizPx), 1);

        data[i].forEach(v => {
            const clr = colorRule(v);
            str += `  <rect x="${x}" y="${vposRule(v)}" width="${wd}" height="${vertPx}" fill="${clr}" stroke="${clr}" stroke-width="0" />\n`;
        });
    }

    return str + getSVGFooter();
}

/**
 * Given a Score, create an SVG showing the notes in the Score.
 */
export function scoreToNotesSVG(score: Score, opts: CanvasArgOpts = {}): string {
    const [ timeline, data ] = transformations.scoreToNotes(score);

    return render2DSVG(timeline, data, { color_rule: 'mod12', value_rule: 'note', header: 'Notes', ...opts });
}

/**
 * Given a Score, create an HTML canvas showing the notes in the Score.
 */
export function scoreToNotesCanvas(score: Score, opts: CanvasArgOpts = {}, name = 'notes' ): string {
    const [ timeline, data ] = transformations.scoreToNotes(score);

    return render2DCanvas({
        name,
        timeline,
        data,
        options: { color_rule: 'mod12', value_rule: 'note', header: 'Notes', ...opts }
    });
}

/**
 * Given a Score, return an HTML canvas showing the gamut used in the Score.
 */
export function scoreToGamutCanvas(score: Score, opts: CanvasArgOpts = {}): string {
    const [ timeline, data ] = transformations.scoreToGamut(score);

    return render2DCanvas({
        name: 'gamut',
        timeline,
        data,
        options: { color_rule: 'mod12', value_rule: 'gamut', header: 'Gamut', ...opts }
    });
}

/**
 * Given a Score, return an HTML canvas showing intervals in the Score.
 */
export function scoreToIntervalsCanvas(score: Score, opts: CanvasArgOpts = {}): string {
    const [ timeline, data ] = transformations.scoreToIntervals(score);

    return render2DCanvas({
        name: 'intervals',
        timeline,
        data,
        options: { color_rule: 'mod12', value_rule: 'number', header: 'Intervals', ...opts }
    });
}

/**
 * Given a Score, return an HTML canvas showing interval gamuts in the Score.
 */
export function scoreToIntervalGamutCanvas(score: Score, opts: CanvasArgOpts = {}): string {
    const [ timeline, data ] = transformations.scoreToIntervalGamut(score);

    return render2DCanvas({
        name: 'interval_gamut',
        timeline,
        data,
        options: { color_rule: 'mod12', value_rule: 'gamut', header: 'Interval Gamut', ...opts }
    });
}

/**
 * Returns an HTML canvas visualisation of the Score. Will attempt to size the canvas
 * as close as possible to the sizes supplied.
 * 
 * Options are:
 * ht: Target height of the pitch canvas in pixels (default 750)
 * wd: Target width of the pitch canvas in pixels (default 2500)
 * wd_quarter: Number of pixels per quarter note (if set, overrides wd)
 * wd_scale: Number of quarter notes per horizontal scale increment (default 1)
 * wd_min: Minimum width in pixels for any note (default 2)
 */
export function scoreToScoreCanvas(score: Score, { ht = 750, wd = 2500, wd_quarter, wd_scale = 1, wd_min = 2 }: ScoreCanvasOpts = {}): string {
    const notes = score.contents.map(t => t.toSummary().filter(n => n.pitch.length));
    const [ minp, maxp ] = score.pitchRange();
    const last = score.lastTick();

    return JSONTemplate('score', {
        __SCORE__: notes,
        __SHOWING__: new Array(notes.length).fill(true),
        __MIN_PITCH__: minp,
        __MAX_PITCH__: maxp,
        __LAST_TICK__: last,
        __TARGET_HT__: ht,
        __TARGET_WD__: wd,
        __MIN_WD__: wd_min,
        __TICKS_SCALE__: score.metadata.ticks_per_quarter * wd_scale,
        __TICKS_PX__: wd_quarter ? score.metadata.ticks_per_quarter / wd_quarter : 0
    });
}