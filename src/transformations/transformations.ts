import type { Timed, TimedEntity, Score, Renderable, MetaEvent } from '../types';

import * as timeSignature from '../helpers/time-signature';

import { PITCH_CLASS_MAP } from '../constants';

import { isPosInt } from '../helpers/validation';
import { dedupe, arraySubtract } from '../helpers/arrays';
import { dumpOneLine } from '../dump/dump';

/**
 * A helper module exporting functions for transforming Scores, Melodies and others.
 */

function mapNotesToUnique(notes: number[], fn: (n: number) => number): number[] {
    if (!Array.isArray(notes)) {
        throw new Error('notes is not an array');
    }

    return dedupe(notes.map(fn)).sort((a, b) => a - b);
}

/**
 * Return an object mapping midi ticks to tuples containing the notes that start and end during them.
 */
function getOnOff(music: Renderable): Map<number, [ number[], number [] ]> {
    const onoffmap: Map<number, [ number[], number[] ]> = new Map();

    for (const [ chords ] of music.toOrderedChordsWithMetadata()) {
        for (const chord of chords) {
            const start = chord.at;
            const stop  = chord.at + chord.duration;

            if (onoffmap.has(start)) {
                (onoffmap.get(start) as [ number[], number[] ])[0].push(...chord.pitches());
            } else {
                onoffmap.set(start, [ chord.pitches().slice(), [] ]);
            }

            if (onoffmap.has(stop)) {
                (onoffmap.get(stop) as [ number[], number[] ])[1].push(...chord.pitches());
            } else {
                onoffmap.set(stop, [ [], chord.pitches().slice() ]);
            }
        }
    }

    return onoffmap;
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

    const ret: Set<number> = new Set();

    for (let i = 0; i < len; i++) {
        for (let j = i + 1; j < len; j++) {
            ret.add(Math.abs(notes[j] - notes[i]));
        }
    }

    return Array.from(ret).sort((a, b) => a - b);
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
 * Given a renderable entity, convert it to a tuple of two arrays of equal length.
 * The first, an array of numbers, contains the MIDI ticks where notes either start or end.
 * The second, an array of arrays of numbers, contains the notes that are playing at the end
 * of that MIDI tick (no notes being represented by an empty array).
 */
export function toNotes(music: Renderable): [ number[], number[][] ] {
    const onoffmap = getOnOff(music);
    const times: number[] = [];
    const notes: number[][] = [];
    let curr: number[] = [];

    const ordered = [...onoffmap.entries()].sort((a, b) => a[0] - b[0]);

    for (const [ time, onoff ] of ordered) {
        curr = arraySubtract(curr, onoff[1]).concat(onoff[0]).sort((a, b) => a - b);
        times.push(time);
        notes.push(curr);
    }

    return [ times, notes ];
}

/**
 * Given a renderable entity, split it into slices lasting 'increment' MIDI ticks, where
 * 'increment' is * the second argument passed. Then return an array containing the number
 * of notes played in each slice.
 */
export function toNoteCount(music: Renderable, increment: number): number[] {
    if (!isPosInt(increment)) {
        throw new Error(`transformations.toNoteCount(): increment must be a positive number, wwas ${dumpOneLine(increment)}`);
    }

    const onoffmap = getOnOff(music);
    const ret: number[] = [];

    for (const [ time, onoff ] of onoffmap) {
        const ix = Math.floor(time / increment);

        if (ret[ix]) {
            ret[ix] += onoff[0].length;
        } else {
            ret[ix] = onoff[0].length;
        }
    }

    for (let ix = 0; ix < ret.length; ix++) {
        if (!ret[ix]) {
            ret[ix] = 0;
        }
    }

    return ret;
}

/**
 * Given a renderable entity, convert it to a tuple of two arrays of equal length.
 * The first, an array of numbers, contains the MIDI ticks where notes either start or end.
 * The second, an array of arrays of numbers, contains a gamut of pitches that are playing
 * at the end of that MIDI tick (no notes being represented by an empty array). In this gamut,
 * C is represented by 0, C# by 1, and so on up to B represented by 11.
 */
export function toGamut(music: Renderable): [ number[], number[][] ] {
    const [ timeline, notes ] = toNotes(music);

    return [ timeline, notes.map(n => notesToGamut(n)) ];
}

/**
 * Given a renderable entity, convert it to a tuple of two arrays of equal length.
 * The first, an array of numbers, contains the MIDI ticks where notes either start or end.
 * The second, an array of arrays of numbers, contains all intervals between notes currently
 * playing at that MIDI tick.
 */
export function toIntervals(music: Renderable): [ number[], number[][] ] {
    const [ timeline, notes ] = toNotes(music);

    return [ timeline, notes.map(n => notesToIntervals(n)) ];
}

/**
 * Given a renderable entity, convert it to a tuple of two arrays of equal length.
 * The first, an array of numbers, contains the MIDI ticks where notes either start or end.
 * The second, an array of arrays of numbers, contains a gamut of all intervals between notes
 * currently playing at that MIDI tick.
 */
export function toIntervalGamut(music: Renderable): [ number[], number[][] ] {
    const [ timeline, notes ] = toNotes(music);

    return [ timeline, notes.map(n => notesToIntervalGamut(n)) ];
}

/**
 * Given a renderable entity, convert it to a tuple of two arrays of equal length.
 * The first, an array of numbers, contains the MIDI ticks where notes either start or end.
 * The second, an array of strings, contains the pitch classes of the notes playing at that tick.
 */
export function toPitchClasses(music: Renderable): [ number[], string[] ] {
    const [ timeline, notes ] = toNotes(music);

    return [ timeline, notes.map(n => notesToPitchClass(n)) ];
}

/**
 * Given a renderable entity, extract specific matching events from it.
 */
export function toMatchingTimedEvents(music: Renderable, fn: (evs: TimedEntity) => boolean): TimedEntity[] {
    return music.toOrderedEntitiesWithMetadata()
        .map(v => v[0])
        .flat()
        .filter(fn)
        .sort((a, b) => a.at - b.at);
}

/**
 * Given a Score, return an array of the ticks each bar begins at.
 */
export function scoreToBarTimeline(score: Score): number[] {
    const ret: number[] = [];
    const lasttick = score.lastTick();
    const tpq = score.metadata.ticks_per_quarter;
    const tsigevts = toMatchingTimedEvents(score, e => 'event' in e && e.event === 'time-signature') as Timed<MetaEvent<'time-signature'>>[];
    const sigs: [ number, number ][] = tsigevts.map(e => [ e.at, timeSignature.toQuarterNotes(e.value) ]);

    if (!score.length) {
        return [];
    }

    /*
    if (score.metadata.time_signature) {
        sigs.unshift([ 0, timeSignature.toQuarterNotes(score.metadata.time_signature) ]);
    }

    score.each(mel => {
        if (mel.metadata.time_signature) {
            sigs.unshift([ 0, timeSignature.toQuarterNotes(mel.metadata.time_signature) ]);
        }
    });
    */

    const numix = sigs.length;

    // MIDI defaults to 4/4 as a time signature
    let currsig = numix > 0 && sigs[0][0] === 0 ? sigs[0][1] : 4;
    let currix = 0;
    let currtick = 0;

    while (currtick < lasttick) {
        ret.push(currtick);

        while (currix < numix && sigs[currix][0] <= currtick) {
            currsig = sigs[currix][1];
            currix++;
        }

        currtick += currsig * tpq;
    }

    return ret;
}
