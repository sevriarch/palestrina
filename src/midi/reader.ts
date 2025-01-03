import type { MetaEventArg, MetaEventNumericEvent, MetaEventStringEvent, MetadataData, MelodyMemberArg } from '../types';

import * as fs from 'fs';

import Metadata from '../metadata/metadata';
import Melody from '../sequences/melody';

import { MIDI } from '../constants';
import { fixedBytesToNumber, variableBytesToNumber, fixedBytesToString } from './conversions';
import { isNonnegInt, isIntBetween,validateArray } from '../helpers/validation';
import { dumpOneLine, dumpHex } from '../dump/dump';

import * as keySignature from '../helpers/key-signature';
import * as timeSignature from '../helpers/time-signature';
import { toInstrument, toPercussionInstrument } from '../helpers/instrument';

// Used to flag types where we can be certain the 'at' field has been set
type Timed<X> = X & { at: number };

function compareBytes(arr1: number[], arr2: number[]) {
    for (let i = 0; i < arr1.length; i++) {
        if (arr1[i] !== arr2[i]) { return false; }
    }

    return true;
}

/**
 * A class exporting a MIDI reader that can read from files or from arrays of bytes.
 */
class MidiReader {
    runningstatus = 0;
    currentbyte = 0;
    currenttick = 0;
    channel = -2;
    metadata: MetadataData;
    contents!: number[];
    otherEvents: Timed<MetaEventArg>[] = [];
    noteOnEvents: Record<number, Timed<MelodyMemberArg>[]> = {};
    notes: Timed<MelodyMemberArg>[] = [];
    length!: number;

    constructor(arg: string | number[], metadata: MetadataData = {}) {
        if (typeof arg === 'string') {
            const buf = fs.readFileSync(arg);
            const len = buf.length;
            const arr: number[] = new Array(len);

            for (let i = 0; i < len; i++) {
                arr[i] = buf.readUInt8(i);
            }

            this.contents = arr;
            this.length = len;
            this.metadata = metadata;
        } else if (Array.isArray(arg)) {
            const failed = validateArray(arg, v => isIntBetween(v, 0, 255));

            if (failed.length) {
                const msg = failed.map(v => `byte ${v[0]}: ${v[1]}`).join('; ');

                throw new Error(`invalid data: ${msg}`);
            }

            this.contents = arg;
            this.length = arg.length;
            this.metadata = metadata;
        } else {
            throw new Error('MidiReader only takes a filename or an array of byte values between 0 and 255');
        }
    }

    slurp(num: number): number[] {
        if (!isNonnegInt(num)) {
            throw new Error(`tried to slurp ${num} bytes, must be a non-negative integer`);
        }

        if (this.length < this.currentbyte + num) {
            throw new Error(`tried to slurp ${num} bytes but only ${this.length - this.currentbyte} were available.`);
        }

        const slurp = this.contents.slice(this.currentbyte, this.currentbyte + num);

        this.currentbyte += num;

        return slurp;
    }

    peek(): number {
        if (this.length <= this.currentbyte) {
            throw new Error('tried to peek but no bytes were available');
        }

        return this.contents[this.currentbyte];
    }

    slide(num: number): void {
        this.currentbyte += num;
    }

    /**
     * Extract a variable bytes representation of a number from a series of MIDI bytes.
     */
    extractNumberFromVariableBytes(): number {
        // The 5 here comes from the MIDI file specification's maximum length of a variable byte number (1 byte for length, 4 for value)
        const [ number, len ] = variableBytesToNumber(this.contents.slice(this.currentbyte, this.currentbyte + 5));

        this.slurp(len);

        return number;
    }

    /**
     * Given an array of MIDI bytes, process the header and return the version.
     * Removes the header from the passed array of bytes.
     */
    extractMidiVersionFromHeader() {
        let cmp = this.slurp(MIDI.HEADER_CHUNK.length);

        if (!compareBytes(cmp, MIDI.HEADER_CHUNK)) {
            throw new Error('invalid header chunk in bytes');
        }

        cmp = this.slurp(MIDI.HEADER_LENGTH.length);

        if (!compareBytes(cmp, MIDI.HEADER_LENGTH)) {
            throw new Error('invalid header length in bytes');
        }

        cmp = this.slurp(MIDI.HEADER_FORMAT.length);

        return fixedBytesToNumber(cmp);
    }

    /**
     * Given an array of MIDI bytes with the header already removed, extract
     * a two-byte number and move the pointer two bytes further on.
     *
     * @returns {Number}
     */
    extractTwoByteNumber(): number {
        return fixedBytesToNumber(this.slurp(2));
    }

    /**
     * Given an array of MIDI bytes, extract the bytes corresponding to a track.
     * Removes the bytes corresponding to the track from the passed byte array.
     */
    extractTrackBytes(): number[] {
        const cmp = this.slurp(MIDI.TRACK_HEADER_CHUNK.length);

        if (!compareBytes(cmp, MIDI.TRACK_HEADER_CHUNK)) {
            throw new Error('invalid track header chunk in bytes');
        }

        const len = fixedBytesToNumber(this.slurp(4));

        return this.slurp(len);
    }

    /**
     * Method for extracting a meta event from a stream of bytes after the
     * initial 0xff byte has already been removed.
     * Removes the bytes corresponding to this event from the passed byte array.
     */
    protected extractNextMetaEvent(): Timed<MetaEventArg> | undefined {
        const [ byte ] = this.slurp(1);

        const numbytes = this.extractNumberFromVariableBytes();
        const metabytes = this.slurp(numbytes);

        if (byte === 0x2f) {
            if (numbytes !== 0) {
                throw new Error(`wrong number of bytes in end track event (was ${numbytes}, should be 0)`);
            }

            if (this.contents.length > this.currentbyte) {
                throw new Error(`end track event with ${this.contents.length - this.currentbyte} bytes remaining`);
            }

            return { event: 'end-track', at: this.currenttick };
        }

        if (byte === 0x51) {
            if (numbytes !== 0x03) {
                throw new Error(`wrong number of bytes in tempo event (was ${numbytes}, should be 3)`);
            }

            const tempo = Math.round(6e10 / fixedBytesToNumber(metabytes)) / 1e3;

            return { event: 'tempo', value: tempo, at: this.currenttick };
        }

        if (byte === 0x58) {
            if (numbytes !== 4) {
                throw new Error(`wrong number of bytes in time signature event (was ${numbytes}, should be 4)`);
            }

            if (metabytes[3] !== 0x08) {
                throw new Error(`fourth byte of time signature event should be 0x04 (was ${metabytes[3]})`);
            }

            const ts = timeSignature.fromMidiBytes(metabytes);

            return { event: 'time-signature', value: ts, at: this.currenttick };
        }

        if (byte === 0x59) {
            const key = keySignature.fromMidiBytes(metabytes);

            return { event: 'key-signature', value: key, at: this.currenttick };
        }

        if (byte >= 0x01 && byte <= 0x07) {
            let evtype: MetaEventStringEvent;
            
            switch (byte) {
            case 0x01:
                evtype = 'text';
                break;
            case 0x02:
                evtype = 'copyright';
                break;
            case 0x03:
                evtype = 'track-name';
                break;
            case 0x04:
                evtype = 'instrument-name';
                break;
            case 0x05:
                evtype = 'lyric';
                break;
            case 0x06:
                evtype = 'marker';
                break;
            default:
                evtype = 'cue-point';
                break;
            }

            const txt = fixedBytesToString(metabytes);

            return { event: evtype, value: txt, at: this.currenttick };
        }

        console.warn(`unsupported meta-event: ${dumpHex(byte)}(${numbytes}) -> ${fixedBytesToString(metabytes)}; omitting`);
    }

    protected extractNextNoteEvent(): void {
        const type = this.runningstatus & 0xf0;
        const [ pitch, velocity ] = this.slurp(2);

        if (pitch > 0x7f) {
            console.warn(`pitch out of range in note event ${dumpHex(this.runningstatus, pitch, velocity)}`);
            return;
        }

        if (velocity > 0x7f) {
            console.warn(`velocity out of range in note event ${dumpHex(this.runningstatus, pitch, velocity)}`);
            return;
        }

        if (type === 0x80 || velocity === 0) {
            if (!this.noteOnEvents[pitch]?.length) {
                console.warn(`note-off event ${dumpHex(this.runningstatus, pitch, velocity)} without corresponding note-on event; omitting`);
                return;
            }

            const note = this.noteOnEvents[pitch].shift() as Timed<MelodyMemberArg>;

            note.duration = this.currenttick - note.at;
            this.notes.push(note);
            return;
        }

        if (!this.noteOnEvents[pitch]) {
            this.noteOnEvents[pitch] = [];
        }
        this.noteOnEvents[pitch].push({ pitch, velocity, at: this.currenttick });
    }

    protected extractNextChannelEvent(): Timed<MetaEventArg> | undefined {
        const type = this.runningstatus & 0xf0;

        if (type === 0xa0) {
            const [ b1, b2 ] = this.slurp(2);

            console.warn(`polyphonic key press unsupported: ${dumpHex(this.runningstatus, b1, b2)}; omitting`);

            return;
        }

        if (type === 0xb0) {
            const [ ctrl, val ] = this.slurp(2);
            let event: MetaEventNumericEvent, value: number;

            if (ctrl > 0x7f) {
                throw new Error(`controller number out of range: ${dumpHex(ctrl, val)}`);
            }

            if (val > 0x7f) {
                throw new Error(`controller value out of range: ${dumpHex(ctrl, val)}`);
            }

            switch (ctrl) {
            case MIDI.SUSTAIN_CONTROLLER:
                event = 'sustain';
                value = val >= 0x40 ? 1 : 0;
                break;
            case MIDI.VOLUME_CONTROLLER:
                event = 'volume';
                value = val;
                break;
            case MIDI.PAN_CONTROLLER:
                event = 'pan';
                value = val;
                break;
            case MIDI.BALANCE_CONTROLLER:
                event = 'balance';
                value = val;
                break;
            default:
                console.warn(`unsupported controller event: ${dumpHex(ctrl, val)}; omitting`);
                return;
            }

            return { event, value, at: this.currenttick };
        }

        if (type === 0xc0) {
            const [ value ] = this.slurp(1);

            if (value > 0x7f) {
                throw new Error('instrument out of range');
            }

            // Convert to a string value if known, otherwise keep as int to avoid obstructive errors
            const strvalue = (this.runningstatus & 0x0f) === 0x09 ? toPercussionInstrument(value) : toInstrument(value);

            return { event: 'instrument', value: strvalue ?? value, at: this.currenttick };
        }

        if (type === 0xd0) {
            this.slide(1);

            console.warn('channel aftertouch not supported');
            return;
        }

        if (type === 0xe0) {
            const [ b1, b2 ] = this.slurp(2);

            return { event: 'pitch-bend', value: b1 << 7 | b2, at: this.currenttick };
        }
    }

    extractMidiTrackEvents(): void {
        this.runningstatus = 0;
        this.currentbyte = 0;
        this.currenttick = 0;
        this.channel = -2; // -2 if no channel found, -1 if multiple channels found, channel # if one channel found
        this.notes = [];
        this.noteOnEvents = {};
        this.otherEvents = [];

        while (this.currentbyte < this.length) {
            this.currenttick += this.extractNumberFromVariableBytes();

            let [ first ] = this.slurp(1);

            // Update channel
            if (this.channel !== -1) {
                if (first >= 0x80 && first <= 0xef) {
                    if (this.channel === -2) {
                        this.channel = first & 0x0f;
                    } else if (this.channel !== (first & 0x0f)) {
                        this.channel = -1;
                    }
                }
            }

            if (first < 0x80) {
                if (this.runningstatus) {
                    this.slide(-1);
                    first = this.runningstatus;
                } else {
                    console.warn(`failed to extract event beginning with byte ${dumpHex(first)}`);
                }
            } else {
                this.runningstatus = first;
            }

            if (first >= 0x80 && first <= 0x9f) {
                this.extractNextNoteEvent();
            } else if (first >= 0xa0 && first <= 0xef) {
                const event = this.extractNextChannelEvent();

                if (event) {
                    this.otherEvents.push(event);
                }
            } else if (first === 0xff) {
                const event = this.extractNextMetaEvent();

                if (event) {
                    this.otherEvents.push(event);
                }
            } else {
                this.runningstatus = 0;
                console.warn(`failed to extract event beginning with byte ${dumpHex(first)}`);
            }
        }

        const leftovers = Object.values(this.noteOnEvents).flat();
        if (leftovers.length) {
            console.warn(`${leftovers.length} note-on events without matching note-off events: ${dumpOneLine(leftovers)}`);
        }

        if (this.channel < 0) {
            this.channel = 1;
        } else {
            this.channel++;
        }
    }

    extractMidiTrack(): Melody {
        // if bugs in this call, try/catch on this and inspect reader state
        this.extractMidiTrackEvents();

        const notes = Melody.from(this.notes.sort((a, b) => a.at - b.at));

        // a track should always end with an end track event, but we will not throw an error if it does not
        if (this.otherEvents.length && this.otherEvents[this.otherEvents.length - 1].event === 'end-track') {
            this.otherEvents.pop();
        }

        const trackmeta = Metadata.fromMetaEventArg(this.otherEvents).mergeFrom(Metadata.from(this.metadata));

        return Melody.from(notes, trackmeta)
            .if(this.channel !== 1)
            .then(m => m.withMidiChannel(this.channel));
    }

    /**
     * Convert an array of MIDI bytes into a Score.
     */
    toScoreContents(): [ Melody[], number ] {
        // Begins with ...MIDI.HEADER_CHUNK, ...MIDI.HEADER_LENGTH, ...MIDI.HEADER_FORMAT
        // Extract MIDI format, error if not 1
        // Extract number of tracks
        // Identify number of tracks from next two bytes
        // Identify number of ticks per quarter from next two bytes
        // Read track until track is done
        // Read next track until track is done
        // If out of bytes, confirm the right number of complete tracks are present
        const version = this.extractMidiVersionFromHeader();
        const numtrax = this.extractTwoByteNumber();
        const ticks   = this.extractTwoByteNumber();

        if (version !== 0 && version !== 1) {
            throw new Error('only MIDI versions 0 and 1 are currently supported');
        }

        if (ticks === 0) {
            throw new Error('ticks per quarter must not be zero');
        }

        const tracks: Melody[] = [];
        for (let i = 0; i < numtrax; i++) {
            const reader = new MidiReader(this.extractTrackBytes(), this.metadata);

            tracks.push(reader.extractMidiTrack());
        }

        return [ tracks, ticks ];
    }
}

export default MidiReader;