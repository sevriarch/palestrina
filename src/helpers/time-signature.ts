import { MIDI } from '../constants';
import { isNBitInt } from './validation';
import { dumpOneLine, dumpHex } from '../dump/dump';

function getBytes(t: string): [ number, number ] | undefined {
    const match = t.match(/^(\d+)\/(\d+)$/);

    if (!match) {
        return undefined;
    }

    const num = Number(match[1]);
    const log = Math.log2(Number(match[2]));

    if (num === 0 || !isNBitInt(num, 8) || !isNBitInt(log, 8)) {
        return undefined;
    }

    return [ num, log ];
}

/**
 * Is this a valid time signature?
 */
export function validate(t: string): boolean {
    return getBytes(t) !== undefined;
}

/**
 * Given a time signature, return the MIDI bytes representing it.
 */
export function toMidiBytes(t: string): number[] {
    const bytes = getBytes(t);

    if (!bytes) {
        throw new Error(`invalid time signature: ${dumpOneLine(t)}`);
    }

    return [ ...MIDI.TIME_SIGNATURE_EVENT, ...bytes, 0x18, 0x08 ];
}

/**
 * Given a time signature, return the number of quarter notes in a bar.
 */
export function toQuarterNotes(t: string): number {
    const match = t.match(/^(\d+)\/(\d+)$/);

    if (!match) {
        throw new Error(`invalid time signature: ${dumpOneLine(t)}`);
    }

    const num = Number(match[1]);
    const log = Math.log2(Number(match[2]));

    return 4 * Number(match[1]) / Number(match[2]);
}

/**
 * Given the last four MIDI bytes representing a time signature, return that time signature.
 */
export function fromMidiBytes(bytes: number[]): string {
    if (bytes.length !== 4) {
        throw new Error(`wrong number of bytes in time signature event (was ${bytes.length} [${dumpHex(...bytes)}], should be 4)`);
    }

    if (bytes[3] !== 0x08) {
        throw new Error(`fourth byte of time signature event should be 0x04 (was ${dumpHex(bytes[3])})`);
    }

    return bytes[0] + '/' + Math.pow(2, bytes[1]);
}
