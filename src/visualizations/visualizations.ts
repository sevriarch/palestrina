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