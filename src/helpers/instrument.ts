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
    "music box": 10,
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
    ocarina: 79,
    'tinkle bell': 112,
    agogo: 113,
    'steel drums': 114,
    woodblock: 115,
    'taiko drum': 116,
    'melodic tom': 117,
    'synth drum': 118
};

const PERCUSSION_INSTRUMENTS: { [k: string]: number } = {
    'high q': 26,
    'spal': 27,
    'scratch push': 28,
    'scratch pull': 29,
    'sticks': 30,
    'square click': 31,
    'metronome click': 32,
    'metronome bell': 33,
    'bass drum': 34,
    'bass drum 2': 35,
    'side drum': 36,
    'snare drum': 37,
    'hand clap': 38,
    'electric snare drum': 39,
    'low floor tom': 40,
    'closed hi-hat': 41,
    'high floor tom': 42,
    'pedal hi-hat': 43,
    'low tom': 44,
    'open hi-hat': 45,
    'low-mid tom': 46,
    'hi-mid tom': 47,
    'crash cymbal': 48,
    'high tom': 49,
    'ride cymbal': 50,
    'chinese cymbal': 51,
    'ride bell': 52,
    'tambourine': 53,
    'splash cymbal': 54,
    'cowbell': 55,
    'crash cymbal 2': 56,
    'vibraslap': 57,
    'ride cymbal 2': 58,
    'high bongo': 59,
    'low bongo': 60,
    'high conga': 61,
    'mid conga': 62,
    'low conga': 63,
    'high timbale': 64,
    'low timbale': 65,
    'high agogo': 66,
    'low agogo': 67,
    'cabasa': 68,
    'maracas': 69,
    'whistle': 70,
    'long whistle': 71,
    'guiro': 72,
    'long guiro': 73,
    'claves': 74,
    'high wood block': 75,
    'low wood block': 76,
    'mute cuica': 77,
    'open cuica': 78,
    'mute triangle': 79,
    'open triangle': 80,
    'shaker': 81,
    'jingle bell': 82,
    'belltree': 83,
    'castanets': 84,
    'mute surdo': 85,
    'open surdo': 86,
};

const BYTE_TO_INSTRUMENT: string[] = [];
Object.keys(INSTRUMENTS).forEach(inst => BYTE_TO_INSTRUMENT[INSTRUMENTS[inst]] = inst);

const BYTE_TO_PERCUSSION_INSTRUMENT: string[] = [];
Object.keys(PERCUSSION_INSTRUMENTS).forEach(inst => BYTE_TO_PERCUSSION_INSTRUMENT[PERCUSSION_INSTRUMENTS[inst]] = inst);

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
 * Is this a valid MIDI instrument?
 */
export function toPercussionInstrument(arg?: MetaEventValue): string | undefined {
    if (typeof arg === 'number') {
        return BYTE_TO_PERCUSSION_INSTRUMENT[arg];
    }

    if (typeof arg === 'string' && arg in PERCUSSION_INSTRUMENTS) {
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

        if (arg in PERCUSSION_INSTRUMENTS) {
            return PERCUSSION_INSTRUMENTS[arg];
        }

        throw new Error(`unknown instrument: "${arg}"`);
    }

    if (!isNBitInt(arg, 8)) {
        throw new Error(`invalid instrument ${dumpOneLine(arg)}`);
    }

    return arg;
}