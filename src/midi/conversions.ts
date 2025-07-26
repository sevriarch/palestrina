import type { MetaEventArg, MidiTickAndBytes, Melody, MetaList, Metadata, MelodyMember } from '../types';

import { MIDI } from '../constants';
import { isInt, isNumber, isMidiChannel, isNBitInt, is7BitInt, isNonnegInt, isPosInt } from '../helpers/validation';
import { dumpOneLine, dumpHex } from '../dump/dump';

import * as keySignature from '../helpers/key-signature';
import * as timeSignature from '../helpers/time-signature';
import * as instrument from '../helpers/instrument';

/**
 * Convert a number to a MIDI fixed bytes representation.
 */
export function numberToFixedBytes(num: number, len: number): number[] {
    if (!isNonnegInt(num)) {
        throw new Error(`number must be a non-negative integer; was ${dumpOneLine(num)}`);
    }

    if (!isPosInt(len)) {
        throw new Error(`number of bytes must be a positive integer; was ${dumpOneLine(len)}`);
    }

    if (num >= Math.pow(256, len)) {
        throw new Error(`number ${num} cannot fit in ${len} bytes`);
    }

    const bytes = new Array(len).fill(0);

    while (len-- && num) {
        bytes[len] = num & 0xff;
        num >>= 8;
    }

    return bytes;
}

/**
 * Convert a fixed byte representation to a number.
 */
export function fixedBytesToNumber(bytes: number[]): number {
    let i = bytes.length;
    let mult = 1;
    let ret = 0;

    while (i--) {
        ret += bytes[i] * mult;
        mult <<= 8;
    }

    return ret;
}

/**
 * Convert a number to a MIDI variable bytes representation.
 */
export function numberToVariableBytes(num: number): number[] {
    if (!isNBitInt(num, 28)) {
        throw new Error(`argument must be representable as a 28-bit integer; was ${dumpOneLine(num)}`);
    }

    const bytes = [ num & 0x7f ];

    while (num >= 0x80) {
        num >>= 7;
        bytes.push(num & 0x7f | 0x80);
    }

    return bytes.reverse();
}

/**
 * Convert a variable byte representation to a number.
 * Return a tuple containing the number and the number of bytes used to store it.
 */
export function variableBytesToNumber(bytes: number[]): [ number, number ] {
    let count = 0;

    for (let i = 0; i < bytes.length; i++) {
        if (bytes[i] < 0x80) {
            count = i + 1;
            break;
        }
    }

    if (count === 0) {
        throw new Error(`end of bytes ${dumpHex(...bytes)} reached while trying to extract number`);
    }

    let i = count;
    let tot = 0;
    let mult = 1;
    while (i--) {
        tot += mult * (bytes[i] & 0x7f);
        mult <<= 7;
    }

    return [ tot, count ];
}

/**
 * Convert a string to a MIDI variable bytes representation.
 */
export function stringToVariableBytes(str: string): number[] {
    const strbytes = str.split('').map(c => c.charCodeAt(0));

    return [ ...numberToVariableBytes(strbytes.length), ...strbytes ];
}

/**
 * Convert a fixed byte representation to a string. Return that string.
 */
export function fixedBytesToString(bytes: number[]): string {
    return bytes.map(c => String.fromCharCode(c)).join('');
}

function copyrightEventToMidiBytes(val: string) {
    return [ ...MIDI.COPYRIGHT_EVENT, ...stringToVariableBytes(val) ];
}

function trackNameEventToMidiBytes(val: string) {
    return [ ...MIDI.TRACK_NAME_EVENT, ...stringToVariableBytes(val) ];
}

function tempoEventToMidiBytes(val: number) {
    if (!isNumber(val)) {
        throw new Error(`tempo should be a number; was ${dumpOneLine(val)}`);
    }

    return [ ...MIDI.TEMPO_EVENT, ...numberToFixedBytes(Math.round(6e7 / val), 3) ];
}

function instrumentEventToMidiBytes(val: number | string, channel: number) {
    return [ channel + 0xbf, instrument.toMidiByte(val) ];
}

function pitchBendEventToMidiBytes(val: number, channel: number) {
    if (!isInt(val) || val >= 8192 || val < -8192) {
        throw new Error(`invalid value in pitch bend event: ${val}`);
    }

    const b = val - 8192;

    return [ channel + 0xdf, b & 0x7f, b >> 7 & 0x7f ];
}

/**
 * Convert a MetaEventArg to the MIDI bytes representing it.
 */
export function metaEventToMidiBytes(event: MetaEventArg, channel = 1): number[] {
    if (!isMidiChannel(channel)) {
        throw new Error(`channel should be a valid MIDI channel; was ${dumpOneLine(channel)}`);
    }

    const ch = channel - 1;

    switch (event.event) {
    case 'sustain':
        return [ ch + 0xb0, MIDI.SUSTAIN_CONTROLLER, event.value ? MIDI.EVENT_ON_VALUE : MIDI.EVENT_OFF_VALUE ];

    case 'volume':
        if (!is7BitInt(event.value)) {
            throw new Error(`invalid value in event ${dumpOneLine(event)}`);
        }

        return [ ch + 0xb0, MIDI.VOLUME_CONTROLLER, event.value ];

    case 'pan':
        if (!is7BitInt(event.value)) {
            throw new Error(`invalid value in event ${dumpOneLine(event)}`);
        }

        return [ ch + 0xb0, MIDI.PAN_CONTROLLER, event.value ];

    case 'balance':
        if (!is7BitInt(event.value)) {
            throw new Error(`invalid value in event ${dumpOneLine(event)}`);
        }

        return [ ch + 0xb0, MIDI.BALANCE_CONTROLLER, event.value ];

    case 'tempo':
        return tempoEventToMidiBytes(event.value);

    case 'time-signature':
        return timeSignature.toMidiBytes(event.value);

    case 'key-signature':
        return keySignature.toMidiBytes(event.value);

    case 'text':
        return [ ...MIDI.TEXT_EVENT, ...stringToVariableBytes(event.value) ];

    case 'copyright':
        return copyrightEventToMidiBytes(event.value);

    case 'track-name':
        return trackNameEventToMidiBytes(event.value);

    case 'instrument-name':
        return [ ...MIDI.INSTRUMENT_NAME_EVENT, ...stringToVariableBytes(event.value) ];

    case 'lyric':
        return [ ...MIDI.LYRIC_EVENT, ...stringToVariableBytes(event.value) ];

    case 'marker':
        return [ ...MIDI.MARKER_EVENT, ...stringToVariableBytes(event.value) ];

    case 'cue-point':
        return [ ...MIDI.CUE_POINT_EVENT, ...stringToVariableBytes(event.value) ];

    case 'instrument':
        return instrumentEventToMidiBytes(event.value, channel);

    case 'pitch-bend':
        return pitchBendEventToMidiBytes(event.value, channel);

    default:
        throw new Error(`no such event: ${dumpOneLine(event)}`);
    }
}

export function metaListToTimedMidiBytes(ml: MetaList, curr: number, channel: number): MidiTickAndBytes[] {
    return ml.contents.map(e => [
        e.timing.startTick(curr),
        metaEventToMidiBytes(e as MetaEventArg, channel)
    ]);
}

export function metadataToTimedMidiBytes(m: Metadata): MidiTickAndBytes[] {
    const ret: MidiTickAndBytes[] = [];

    if (m.copyright) {
        ret.push([ 0, copyrightEventToMidiBytes(m.copyright) ]);
    }

    if (m.trackname) {
        ret.push([ 0, trackNameEventToMidiBytes(m.trackname) ]);
    }

    if (m.time_signature) {
        ret.push([ 0, timeSignature.toMidiBytes(m.time_signature) ]);
    }

    if (m.key_signature) {
        ret.push([ 0, keySignature.toMidiBytes(m.key_signature) ]);
    }

    if (m.tempo) {
        ret.push([ 0, tempoEventToMidiBytes(m.tempo) ]);
    }

    if (m.instrument) {
        ret.push([ 0, instrumentEventToMidiBytes(m.instrument, m.midichannel) ]);
    }

    if (m.before) {
        ret.push(...metaListToTimedMidiBytes(m.before, 0, m.midichannel));
    }

    return ret;
}

export function melodyMemberToTimedMidiBytes(mm: MelodyMember, curr: number, channel: number, ix?: number): MidiTickAndBytes[] {
    const tick = mm.timing.startTick(curr);
    const ret = metaListToTimedMidiBytes(mm.before, tick, channel);

    mm.pitch.val().forEach(p => {
        if (p < 0 || p >= 256) {
            if (ix !== undefined) {
                throw new Error(`invalid pitch(es) at melody index ${ix}: ${mm.describe()}`);
            } else {
                throw new Error(`invalid pitch(es): ${mm.describe()}`);
            }
        }

        if (p % 1) {
            ret.push([
                tick,
                pitchBendEventToMidiBytes(Math.round(4096 * (p % 1)), channel)
            ],
            [
                tick + mm.duration - 2,
                pitchBendEventToMidiBytes(0, channel)
            ],
            [
                tick,
                [ channel + 0x8f, Math.floor(p), mm.velocity ]
            ],
            [
                tick + mm.duration,
                [ channel + 0x7f, Math.floor(p), mm.velocity ]
            ]);
        } else {
            ret.push([
                tick,
                [ channel + 0x8f, p, mm.velocity ]
            ],
            [
                tick + mm.duration,
                [ channel + 0x7f, p, mm.velocity ]
            ]);
        }
    });

    return [ ...ret, ...metaListToTimedMidiBytes(mm.after, mm.timing.endTick(curr), channel) ];
}

export function melodyToTimedMidiBytes(m: Melody): MidiTickAndBytes[] {
    const channel = m.metadata.midichannel;
    const ret = metadataToTimedMidiBytes(m.metadata);

    let curr = 0;

    for (let i = 0; i < m.length; i++) {
        ret.push(...melodyMemberToTimedMidiBytes(m.contents[i], curr, channel, i));

        curr = m.contents[i].timing.nextTick(curr);
    }

    return ret.sort((a, b) => a[0] - b[0]);
}

export function melodyToMidiTrack(m: Melody): number[] {
    const events = melodyToTimedMidiBytes(m);

    let curr = 0;
    const ret = events.flatMap(([ tick, bytes ]) => {
        const delta = tick - curr;

        curr = tick;

        return [ ...numberToVariableBytes(delta), ...bytes ];
    }).concat(0, MIDI.END_TRACK_EVENT);

    return [
        ...MIDI.TRACK_HEADER_CHUNK,
        ...numberToFixedBytes(ret.length, 4),
        ...ret
    ];
}