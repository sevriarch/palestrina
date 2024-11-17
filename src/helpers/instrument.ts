import type { MetaEventValue } from '../types';

import { isNBitInt } from './validation';
import { dumpOneLine } from '../dump/dump';

const INSTRUMENTS: { [k: string]: number } = {
    piano: 0,
    'bright acoustic piano': 1,
    'electric grand piano': 2,
    'honky-tonk piano': 3,
    'rhodes piano': 4,
    'chorused piano': 5,
    harpsichord: 6,
    clavinet: 7,
    celesta: 8,
    glockenspiel: 9,
    vibraphone: 11,
    marimba: 12,
    xylophone: 13,
    'tubular bells': 14,
    dulcimer: 15,
    'hammond organ': 16,
    'percussive organ': 17,
    'rock organ': 18,
    organ: 19,
    'reed organ': 20,
    accordion: 21,
    harmonica: 22,
    'tango accordion': 23,
    guitar: 24,
    'steel guitar': 25,
    'jazz electric guitar': 26,
    'electric guitar': 27,
    'electric guitar muted': 28,
    'electric guitar overdrive': 29,
    'electric guitar distortion': 30,
    'eletric guitar harmonics': 31,
    'bass guitar': 32,
    'electric bass': 33,
    violin: 40,
    viola: 41,
    cello: 42,
    'double bass': 43,
    'pizz strings': 45,
    harp: 46,
    timpani: 47,
    trumpet: 56,
    trombone: 57,
    tuba: 58,
    'trumpet muted': 59,
    horn: 60,
    'soprano sax': 64,
    'alto sax': 65,
    'tenor sax': 66,
    'baritone sax': 67,
    oboe: 68,
    'cor anglais': 69,
    bassoon: 70,
    clarinet: 71,
    piccolo: 72,
    flute: 73,
    recorder: 74,
    'pan flute': 75,
    shakuhachi: 77,
    whistle: 78,
    ocarina: 79
};

const BYTE_TO_INSTRUMENT: string[] = [];
Object.keys(INSTRUMENTS).forEach(inst => BYTE_TO_INSTRUMENT[INSTRUMENTS[inst]] = inst);

/**
 * Is this a valid MIDI instrument?
 */
export function toInstrument(arg?: MetaEventValue): string | undefined {
    if (typeof arg === 'number') {
        return BYTE_TO_INSTRUMENT[arg];
    }

    if (typeof arg === 'string' && arg in INSTRUMENTS) {
        return arg;
    }
}

/**
 * Given a MIDI instrument name or MIDI byte, get the MIDI byte for that name.
 */
export function toMidiByte(arg: number | string): number {
    if (typeof arg === 'string') {
        if (arg in INSTRUMENTS) {
            return INSTRUMENTS[arg];
        }

        throw new Error(`unknown instrument: "${arg}"`);
    }

    if (!isNBitInt(arg, 8)) {
        throw new Error(`invalid instrument ${dumpOneLine(arg)}`);
    }

    return arg;
}