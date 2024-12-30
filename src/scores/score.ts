import * as fs from 'fs';
import * as crypto from 'crypto';

import type { MetadataData, ScoreCanvasOpts } from '../types';

import Melody from '../sequences/melody';
import Metadata from '../metadata/metadata';
import CollectionWithMetadata from '../collections/with-metadata';

import * as midiWriter from '../midi/writer';
import MidiReader from '../midi/reader';
import { numberToFixedBytes } from '../midi/conversions';

import { MIDI } from '../constants';

import { min, max } from '../helpers/calculations';
import { scoreToScoreCanvas } from '../visualizations/visualizations';
import { validateArray } from '../helpers/validation';
import { dumpOneLine } from '../dump/dump';

/** hidden */
type ScoreCache = { midiBytes?: number[] };

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

    private readonly cache: ScoreCache = {};

    constructor(tracks: Melody[], metadata: Metadata) {
        super(tracks, metadata);

        Object.freeze(this);
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
     */
    lastTick(): number | null {
        return max(this.contents.map(t => t.lastTick()));
    }

    /**
     * Return a new Score where all ticks of everything within it are exact.
     */
    withAllTicksExact(): this {
        return this.map(m => m.withAllTicksExact()).withMetadataTicksExact();
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
        return scoreToScoreCanvas(this, opts);
    }

    /**
     * Returns the MIDI bytes for this Score.
     */
    toMidiBytes(): number[] {
        // We cache because of the possibility that we will do multiple operations calling this
        // expensive method (both hash testing and writing to a file).
        if (this.cache.midiBytes) {
            return this.cache.midiBytes;
        }

        // Must copy as metadata in score needs to be applied to the first track
        const tracks = this.contents.slice();
        if (tracks.length) {
            tracks[0] = tracks[0].mergeMetadataFrom(this);
        }

        this.cache.midiBytes = [
            ...MIDI.HEADER_CHUNK,
            ...MIDI.HEADER_LENGTH,
            ...MIDI.HEADER_FORMAT,
            ...numberToFixedBytes(tracks.length, 2),
            ...numberToFixedBytes(this.metadata.ticks_per_quarter, 2),
            ...tracks.flatMap(t => t.toMidiTrack())
        ];

        return this.cache.midiBytes;
    }
    
    /**
     * Returns a data URI containing the MIDI data for this score.
     */
    toDataURI(): string {
        return 'data:audio/midi;base64,' + Buffer.from(this.toMidiBytes()).toString('base64');
    }

    /**
     * Returns a hash of the MIDI bytes for this score.
     */
    toHash(): string {
        const arr = this.toMidiBytes();
        const hash = crypto.createHash('md5');

        hash.update(Buffer.from(arr));

        return hash.digest('hex');
    }

    /**
     * Throws if the Score does not generate the expected hash, otherwise returns the Score.
     */
    expectHash(expected: string): this {
        const hash = this.toHash();

        if (expected !== hash) {
            throw new Error(`${this.constructor.name}.expectHash(): hash mismatch: expected ${expected}, got ${hash}`);
        }

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
        if (typeof file !== 'string') {
            throw new Error(`${this.constructor.name}.writeMidi(): requires a string argument; was ${dumpOneLine(file)}`);
        }

        midiWriter.writeBufferToFile(file + '.mid', Buffer.from(this.toMidiBytes()));

        return this;
    }
}
