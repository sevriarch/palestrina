import type Score from '../scores/score';
import type MetaEvent from '../meta-events/meta-event';
import type NumericValidator from '../validation/numeric';

import Melody from '../sequences/melody';

import { PITCH_CLASS_MAP } from '../constants';

import { isInt } from '../helpers/validation';
import { dedupe, arraySubtract } from '../helpers/arrays';
import { dumpOneLine } from '../dump/dump';

/**
 * A helper module exporting functions for transforming Scores, Melodies and others.
 */

function mapNotesToUnique(notes: number[], fn: (n: number) => number): number[] {
    if (!Array.isArray(notes)) {
        throw new Error('notes is not an array');
    }

    return dedupe(notes.map(fn).sort((a, b) => a - b));
}

/**
 * Return an object mapping midi ticks to tuples containing the notes that start and end during them.
 */
export function getOnOff(mels: Melody[]): { [k: number]: [ number[], number[] ] } {
    const onoff: { [k: number]: [ number[], number[] ] } = {};

    mels.forEach(m => {
        m.toSummary().forEach(event => {
            const start = event.tick;
            const stop  = event.tick + event.duration;

            if (!onoff[start]) { onoff[start] = [ [], [] ]; }
            if (!onoff[stop]) { onoff[stop] = [ [], [] ]; }

            onoff[start][0].push(...event.pitch);
            onoff[stop][1].push(...event.pitch);
        });
    });

    return onoff;
}

/**
 * Given a group of pitches, convert them into a gamut of pitches. In this gamut, C is
 * represented by 0, C# by 1, and so on up to B represented by 11.
 */
export function notesToGamut(notes: number[]): number[] {
    return mapNotesToUnique(notes, n => n % 12);
}

/**
 * Given a group of pitches, return all intervals between them, in ascending order.
 */
export function notesToIntervals(notes: number[]): number[] {
    if (!Array.isArray(notes)) {
        throw new Error('notes is not an array');
    }

    const len = notes.length;

    if (len < 2) {
        return [];
    }

    const ret = [];

    for (let i = 0; i < notes.length; i++) {
        for (let j = i + 1; j < notes.length; j++) {
            ret[Math.abs(notes[j] - notes[i])] = true;
        }
    }

    return Object.keys(ret).map(n => Number(n)).sort((a, b) => a - b);
}

/**
 * Given a group of pitches, return a gamut of intervals between them, in ascending order.
 */
export function notesToIntervalGamut(notes: number[]): number[] {
    return mapNotesToUnique(notesToIntervals(notes), n => n % 12);
}

/**
 * Given a group of pitches, return the Forte pitch class set.
 */
export function notesToPitchClass(notes: number[]): string {
    if (notes.length === 0) { return PITCH_CLASS_MAP['']; }

    const set = notesToGamut(notes);

    for (let i = 0; i < set.length; i++) {
        const add  = 12 - set[i];
        const test = set.map(v => ((v + add) % 12).toString(16)).sort().join('');

        if (PITCH_CLASS_MAP[test]) {
            return PITCH_CLASS_MAP[test];
        }
    }

    throw new Error(`pitch class was not found for notes ${dumpOneLine(notes)}`);
}

/**
 * Given a Score, convert it to a tuple of two arrays of equal length.
 * The first, an array of Numbers, contains the MIDI ticks where notes either start or end.
 * The second, an array of arrays of Numbers, contains the notes that are playing at the end
 * of that MIDI tick (no notes being represented by an empty array).
 */
export function scoreToNotes(score: Score): [ number[], number[][] ] {
    const onoff = getOnOff(score.contents);
    const times = Object.keys(onoff).map(v => Number(v)).sort((a, b) => a - b);
    const max = times.length;
    const ret: number[][] = [];

    let curr: number[] = [];

    for (let i = 0; i < max; i++) {
        const [ on, off ] = onoff[times[i]];

        curr = arraySubtract([ ...curr, ...on ], off).sort((a, b) => a - b);

        ret[i] = curr.slice();
    }

    return [ times, ret ];
}

/**
 * Given a Score, split it into slices lasting 'increment' MIDI ticks, where 'increment' is
 * the second argument passed. Then return an array containing the number of notes played in
 * each slice.
 */
export function scoreToNoteCount(score: Score, increment: number): number[] {
    if (!isInt(increment)) {
        throw new Error(`transformations.scoreToNoteCount(): increment must be a number, wwas ${dumpOneLine(increment)}`);
    }

    const onoff = getOnOff(score.contents);
    const times = Object.keys(onoff).map(v => Number(v)).sort((a, b) => a - b);
    const len = times.length;

    if (len === 0) {
        return [];
    }

    const ret = new Array(Math.ceil((1 + times[len - 1]) / increment)).fill(0);

    for (let i = 0; i < len; i++) {
        ret[Math.floor(times[i] / increment)] += onoff[times[i]][0].length;
    }

    return ret;
}

/**
 * Given a Score, convert it to a tuple of two arrays of equal length.
 * The first, an array of Numbers, contains the MIDI ticks where notes either start or end.
 * The second, an array of arrays of Numbers, contains a gamut of pitches that are playing
 * at the end of that MIDI tick (no notes being represented by an empty array). In this gamut,
 * C is represented by 0, C# by 1, and so on up to B represented by 11.
 */
export function scoreToGamut(score: Score): [ number[], number[][] ] {
    const [ timeline, notes ] = scoreToNotes(score);

    return [ timeline, notes.map(n => notesToGamut(n)) ];
}

/**
 * Given a Score, convert it to a tuple of two arrays of equal length.
 * The first, an array of Numbers, contains the MIDI ticks where notes either start or end.
 * The second, an array of arrays of Numbers, contains all intervals between notes currently
 * playing at that MIDI tick.
 */
export function scoreToIntervals(score: Score): [ number[], number[][] ] {
    const [ timeline, notes ] = scoreToNotes(score);

    return [ timeline, notes.map(n => notesToIntervals(n)) ];
}

/**
 * Given a Score, convert it to a tuple of two arrays of equal length.
 * The first, an array of Numbers, contains the MIDI ticks where notes either start or end.
 * The second, an array of arrays of Numbers, contains a gamut of all intervals between notes
 * currently playing at that MIDI tick.
 */
export function scoreToIntervalGamut(score: Score): [ number[], number[][] ] {
    const [ timeline, notes ] = scoreToNotes(score);

    return [ timeline, notes.map(n => notesToIntervalGamut(n)) ];
}

/**
 * Given a Score, convert it to a tuple of two arrays of equal length.
 * The first, an array of Numbers, contains the MIDI ticks where notes either start or end.
 * The second, an array of strings, contains the pitch classes of the notes playing at that tick.
 */
export function scoreToPitchClasses(score: Score): [ number[], string[] ] {
    const [ timeline, notes ] = scoreToNotes(score);

    return [ timeline, notes.map(n => notesToPitchClass(n)) ];
}

/**
 * Given a score, extract specific matching events from it.
 */
export function scoreToMatchingTimedEvents(score: Score, fn: (evs: MetaEvent) => boolean): MetaEvent[] {
    const timed = score.withAllTicksExact();
    const ret = timed.metadata.before.contents.filter(fn);

    timed.each(mel => {
        const meta = mel.metadata.before.contents.filter(fn);
        if (meta) {
            ret.push(...meta);
        }

        mel.each(mm => {
            const before = mm.before.contents.filter(fn);

            if (before.length) {
                ret.push(...before);
            }

            const after = mm.after.contents.filter(fn);

            if (after.length) {
                ret.push(...after);
            }
        });
    });

    // as score.withAllTicksExact() has been called, at should always have a value
    return ret.sort((a, b) => (a.at as number) - (b.at as number));
}

/**
 * Create a Melody from a timeline and an array containing the notes playing at specific times.
 */
export function melodyFromTimeline(timeline: number[], notes: number[][], v?: NumericValidator): Melody {
    const durations = timeline.map((v, i) => timeline[i + 1] - v);

    durations[durations.length - 1] = 240; // TODO: This is arbitrary

    return Melody.from(notes, v ? { validator: v } : {}).withExactTick(timeline).withDuration(durations);
}