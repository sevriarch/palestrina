import * as fs from 'fs';

import type { Timed, MetadataData, ScoreCanvasOpts, SVGOpts } from '../types';

import type MetaEvent from '../meta-events/meta-event';
import type MelodyMember from '../sequences/members/melody';

import Melody from '../sequences/melody';
import Metadata from '../metadata/metadata';
import CollectionWithMetadata from '../collections/with-metadata';

import * as transformations from '../transformations/transformations';
import * as visualizations from '../visualizations/visualizations';
import * as midiWriter from '../midi/writer';
import MidiReader from '../midi/reader';
import { numberToFixedBytes, orderedEntitiesToMidiTrack } from '../midi/conversions';

import { MIDI } from '../constants';

import { min, max } from '../helpers/calculations';
import { validateArray } from '../helpers/validation';
import { dumpOneLine } from '../dump/dump';

/** hidden */
type TransientScoreMetadata = {
    midiBytes?: number[],    // midi bytes generated as part of MIDI file creation
    ticksAreExact?: boolean, // does this Score have all ticks exact?
};

/**
 * A container for zero or more Melodies.
 * 
 * Can write MIDI files or HTML canvas representations of the Melodies.
 */
export default class Score extends CollectionWithMetadata<Melody> {
    static from(arg: Melody[] | string, metadata?: MetadataData) {
        if (typeof arg === 'string') {
            const [ tracks, ticks ] = new MidiReader(arg, metadata).toScoreContents();

            const meta = { ticks_per_quarter: ticks, ...metadata };

            return new Score(tracks, Metadata.from(meta));
        }

        if (!Array.isArray(arg)) {
            throw new Error('Score.from(): first argument must be a filename or an array of Melodies');
        }

        const failed = validateArray(arg, m => m instanceof Melody);

        if (failed.length) {
            throw new Error(`Score.from(): first argument indices [${failed.map(m => m[0]).join(',')}] were not Melodies`);
        }

        return new Score(arg.slice(), Metadata.from(metadata));
    }

    #transientMetadata: TransientScoreMetadata = {};

    constructor(tracks: Melody[], metadata: Metadata) {
        super(tracks, metadata);

        Object.freeze(this);
    }

    override clone(): this {
        const copy = this.construct(this.contents);

        copy.#transientMetadata = this.#transientMetadata;

        return copy;
    }

    /**
     * Returns the lowest and highest pitches in the Score.
     */
    pitchRange(): [ number | null, number | null ] {
        return [
            min(this.contents.map(t => t.min())),
            max(this.contents.map(t => t.max()))
        ];
    }

    /**
     * Returns the lowest and highest volumes in the Score.
     */
    volumeRange(): [ number | null, number | null ] {
        return [
            min(this.contents.map(t => t.minVolume())),
            max(this.contents.map(t => t.maxVolume()))
        ];
    }

    /**
     * Returns the last MIDI tick in the Score.
     * If there are no events in the Score, this will be 0.
     */
    lastTick(): number {
        function updateLastTick(event: MetaEvent) {
            if (event.at as number > last) { last = event.at as number; }
        }

        const fixed = this.withAllTicksExact();

        let last = 0;

        fixed.metadata.before.each(updateLastTick);

        fixed.each(m => {
            m.metadata.before.each(updateLastTick);

            m.each(note => {
                note.before.each(updateLastTick);
                if ((note.at as number + note.duration) > last) {
                    last = note.at as number + note.duration;
                }
                note.after.each(updateLastTick);
            });
        });

        return last;
    }

    /**
     * Return a new Score where all ticks of everything within it are exact.
     */
    withAllTicksExact(): this {
        if (this.#transientMetadata.ticksAreExact) {
            return this;
        }

        const ret = this.map(m => m.withAllTicksExact()).withMetadataTicksExact();

        // Shallow copy instead of modifying in place as this is shared between clones
        ret.#transientMetadata = { ...ret.#transientMetadata, ticksAreExact: true };

        return ret;
    }

    /**
     * Return a new Score where all notes with identical duration, start tick
     * and volume are combined into a single chord.
     * 
     * This is an experimental feature: the API should *not* be considered stable.
     *
     * Caveats:
     *  - all tracks are collapsed into a single track
     *  - metadata associated with tracks beyond the first are lost
     *  - metadata associated with notes beyond the first in a chord is lost
     *  - note order is not retained
     *  - exact ticks are applied to all notes within the Score
     *  - notes in different instruments may be collapsed into one chord
     */
    withChordsCombined(): this {
        if (this.length === 0) { return this; }

        const exact = this.withAllTicksExact();
        const mel = exact.contents[0].append(...exact.contents.slice(1))
            .sort((a, b) => ((a.at as number) - (b.at as number)) || (a.duration - b.duration))
            .replaceIfWindow(2, 1,
                ([ curr, next ]) => (curr.at as number) === (next.at as number) && curr.duration === next.duration && curr.velocity === next.velocity,
                ([ curr, next ]) => curr.setPitches([ ...curr.pitch.pitches(), ...next.pitch.pitches() ])
            );

        return this.construct([ mel ]);
    }

    /**
     * Returns an HTML canvas visualisation of the Score. Will attempt to size the canvas
     * as close as possible to the sizes supplied.
     * 
     * Option fields are:
     * 
     * opts.ht - Target height of the pitch canvas in pixels (default 750)
     * 
     * opts.wd - Target width of the pitch canvas in pixels (default 2500)
     * 
     * opts.wd_quarter - Number of pixels per quarter note (if set, overrides wd)
     * 
     * opts.wd_scale - Number of quarter notes per horizontal scale increment (default 1)
     * 
     * opts.wd_min - Minimum width in pixels for any note (default 2)
     */
    toCanvas(opts: ScoreCanvasOpts = {}): string {
        return visualizations.scoreToScoreCanvas(this, opts);
    }

    /**
     * Write an SVG file containing the notes in this Score.
     * 
     * If filename does not end in `.svg`, this will be appended.
     * 
     * Option fields are:
     * 
     * opts.maxval: Maximum pitch to display on the SVG
     * 
     * opts.minval: Minimum pitch to display on the SVG
     * 
     * opts.height: Height of the SVG. Overrides opts.px_vert
     * 
     * opts.width: Width of the SVG. Overrides opts.px_horiz
     * 
     * opts.px_vert: Number of pixels to use per semitone. Defaults to 10,
     * overridden by opts.height
     * 
     * opts.px_horiz: Number of pixels to use per beat. Defaults to 0.025,
     * overridden by opts.width
     * 
     * opts.px_lines: Show a vertical line every X beats, with corresponding bar number
     *
     * opts.sublines: If set, show (X - 1) additional vertical lines between the above lines
     * 
     * opts.note_lines: Display list of pitches every X vertical lines
     * 
     * opts.leftpad: Number of pixels to pad on left by (defaults to 16)
     * 
     * opts.rightpad: Number of pixels to pad on right by (defaults to 8)
     * 
     * opts.color_rule: Determine how to color pitches: "mod12" gives a different color
     * for each pitch of the scale.
     * 
     * opts.value_rule: Determine how to display pitches in text. "note" displays pitch
     * with octave; "pitch" displays pitch without octave, anything else displays MIDI
     * pitch value
     * 
     * opts.textstyle: color for basic text (default: #C0C0C0)
     * 
     * opts.beatstyle: color for vertical lines (default: #404040)
     * 
     * opts.offbeatstyle: color for vertical sublines (default: #202020)
     * 
     * opts.header: a short piece of text to display at the top left of the SVG
     */
    writeNotesSVG(file: string, opts: SVGOpts = {}): this {
        if (typeof file !== 'string') {
            throw new Error(`${this.constructor.name}.writeCanvas(): requires a string argument; was ${dumpOneLine(file)}`);
        }

        const filename = file.endsWith('.svg') ? file : `${file}.svg`;

        fs.writeFileSync(filename,
            visualizations.build2DSVG(this, transformations.scoreToNotes,
                { color_rule: 'mod12', value_rule: 'note', id: 'notes_svg', header: 'Notes', ...opts }
            )
        );

        return this;
    }

    /**
     * Write an SVG file containing the gamut used in this Score.
     * 
     * If filename does not end in `.svg`, `.gamut.svg` will be appended to it.
     * 
     * Options are as in Score.toNotesSVG().
     */
    writeGamutSVG(file: string, opts: SVGOpts = {}): this {
        if (typeof file !== 'string') {
            throw new Error(`${this.constructor.name}.writeCanvas(): requires a string argument; was ${dumpOneLine(file)}`);
        }

        const filename = file.endsWith('.svg') ? file : `${file}.gamut.svg`;
    
        fs.writeFileSync(filename,
            visualizations.build2DSVG(this, transformations.scoreToGamut,
                { color_rule: 'mod12', value_rule: 'gamut', id: 'gamut_svg', header: 'Gamut', ...opts }
            )
        );

        return this;
    }

    /**
     * Write an SVG file containing the intervals used in this Score.
     * 
     * If filename does not end in `.svg`, `.intervals.svg` will be appended to it.
     * 
     * Options are as in Score.toNotesSVG().
     */
    writeIntervalsSVG(file: string, opts: SVGOpts = {}): this {
        if (typeof file !== 'string') {
            throw new Error(`${this.constructor.name}.writeCanvas(): requires a string argument; was ${dumpOneLine(file)}`);
        }

        const filename = file.endsWith('.svg') ? file : `${file}.intervals.svg`;
    
        fs.writeFileSync(filename,
            visualizations.build2DSVG(this, transformations.scoreToIntervals,
                { color_rule: 'mod12', value_rule: 'interval', id: 'intervals_svg', leftpad: 24, header: 'Intervals', ...opts }
            )
        );

        return this;
    }

    /**
     * Return an array with one member per each Melody within the score.
     * Each of these members contains all MetaEvents or notes/chords in that Melody,
     * ordered by exact tick, ascending.
     * 
     * MetaEvents that are generated from Score metadata appear in the first Melody.
     */
    toOrderedEntities(): Timed<(MetaEvent | MelodyMember)>[][] {
        const fixed = this.withAllTicksExact();

        // Must copy as metadata in score needs to be applied to the first track
        const tracks = fixed.contents.slice();
        if (tracks.length) {
            tracks[0] = tracks[0].mergeMetadataFrom(fixed);
        }

        return tracks.map(tr => tr.toOrderedEntities());
    }

    /**
     * Returns the MIDI bytes for this Score.
     */
    toMidiBytes(): number[] {
        // We cache because of the possibility that we will do multiple operations calling this
        // expensive method (both hash testing and writing to a file).
        if (this.#transientMetadata.midiBytes) {
            return this.#transientMetadata.midiBytes;
        }

        // Must copy as metadata in score needs to be applied to the first track
        const evts = this.toOrderedEntities();
        const bytechunks = [
            MIDI.HEADER_CHUNK,
            MIDI.HEADER_LENGTH,
            MIDI.HEADER_FORMAT,
            numberToFixedBytes(evts.length, 2),
            numberToFixedBytes(this.metadata.ticks_per_quarter, 2),
        ];

        for (let i = 0; i < this.contents.length; i++) {
            bytechunks.push(orderedEntitiesToMidiTrack(evts[i], this.contents[i].metadata.midichannel));
        }

        const bytes = bytechunks.flat();

        // Shallow copy instead of modifying in place as this is shared between clones
        this.#transientMetadata = { ...this.#transientMetadata, midiBytes: bytes };

        return bytes;
    }

    /**
     * Returns a data URI containing the MIDI data for this score.
     */
    toDataURI(): string {
        return midiWriter.toDataURI(this);
    }

    /**
     * Returns a hash of the MIDI bytes for this score.
     */
    toHash(): string {
        return midiWriter.toHash(this);
    }

    /**
     * Throws if the Score does not generate the expected hash, otherwise returns the Score.
     */
    expectHash(expected: string): this {
        midiWriter.expectHash(this, expected);

        return this;
    }

    /**
     * Writes an HTML canvas visualization of the Score to a file. Returns the Score.
     * 
     * Option fields are:
     * 
     * opts.ht - Target height of the pitch canvas in pixels (default 750)
     * 
     * opts.wd - Target width of the pitch canvas in pixels (default 2500)
     * 
     * opts.wd_quarter - Number of pixels per quarter note (if set, overrides wd)
     * 
     * opts.wd_scale - Number of quarter notes per horizontal scale increment (default 1)
     * 
     * opts.wd_min - Minimum width in pixels for any note (default 2)
     */
    writeCanvas(file: string, opts: ScoreCanvasOpts = {}): this {
        if (typeof file !== 'string') {
            throw new Error(`${this.constructor.name}.writeCanvas(): requires a string argument; was ${dumpOneLine(file)}`);
        }

        fs.writeFileSync(file + '.html', this.toCanvas(opts));

        return this;
    }

    /**
     * Writes a MIDI file containing the Score. Returns the Score.
     */
    writeMidi(file: string): this {
        midiWriter.writeToFile(file, this);

        return this;
    }
}
