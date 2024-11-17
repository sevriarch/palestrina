import { MIDI } from '../constants';
import { dumpOneLine, dumpHex } from '../dump/dump';

const KEYMAP: Record<string, number> = {
    C: 0,
    a: 0,
    G: 1,
    e: 1,
    D: 2,
    b: 2,
    A: 3,
    'f#': 3,
    E: 4,
    'c#': 4,
    B: 5,
    'g#': 5,
    'F#': 6,
    'd#': 6,
    'C#': 7,
    'a#': 7,
    Cb: 249,
    ab: 249,
    Gb: 250,
    eb: 250,
    Db: 251,
    bb: 251,
    Ab: 252,
    f: 252,
    Eb: 253,
    c: 253,
    Bb: 254,
    g: 254,
    F: 255,
    d: 255,
};

const MAJOR_KEYS = [ 'Cb', 'Gb', 'Db', 'Ab', 'Eb', 'Bb', 'F', 'C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#' ];
const MINOR_KEYS = [ 'ab', 'eb', 'bb', 'f', 'c', 'g', 'd', 'a', 'e', 'b', 'f#', 'c#', 'g#', 'd#', 'a#' ];

/**
 * Is this a valid key signature?
 */
export function validate(k: string) {
    return KEYMAP[k] !== undefined;
}

/**
 * Given a key signature, return the MIDI bytes representing it.
 */
export function toMidiBytes(k: string): number[] {
    const byte1 = KEYMAP[k];
    const byte2 = k === k.toLowerCase() ? 1 : 0;

    if (byte1 === undefined) {
        throw new Error(`invalid key signature: ${dumpOneLine(k)}`);
    }

    return [ ...MIDI.KEY_SIGNATURE_EVENT, byte1, byte2 ];
}

/**
 * Given the last two bytes of a key signature meta event, return the key it represents.
 */
export function fromMidiBytes(bytes: number[]): string {
    if (bytes.length !== 2) {
        throw new Error(`wrong number of bytes in key signature event (was ${bytes.length} [${dumpHex(...bytes)}], should be 2)`);
    }

    if (bytes[0] > 0x07 && bytes[0] < 0xf9) {
        throw new Error(`invalid first byte of key signature event: ${dumpHex(bytes[0])}`);
    }

    const val = (bytes[0] + 7) & 0xff;
    switch (bytes[1]) {
    case 0x00:
        return MAJOR_KEYS[val];
    case 0x01:
        return MINOR_KEYS[val];
    default:
        throw new Error(`second byte of key signature event must be 0x00 or 0x01; was ${dumpHex(bytes[1])}`);
    }
}