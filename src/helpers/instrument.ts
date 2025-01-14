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
    'music box': 10,
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
    'electric guitar harmonics': 31,
    'bass guitar': 32,
    'electric bass': 33,
    'electric bass (pick)': 34,
    'fretless bass': 35,
    'slap bass': 36,
    'slap bass 2': 37,
    'synth bass': 38,
    'synth bass 2': 39,
    violin: 40,
    viola: 41,
    cello: 42,
    'double bass': 43,
    'tremolo strings': 44,
    'pizz strings': 45,
    harp: 46,
    timpani: 47,
    'string ensemble 1': 48,
    'string ensemble 2': 49,
    'synth strings 1': 50,
    'synth strings 2': 51,
    'choir aahs': 52,
    'voice oohs': 53,
    'synth voice': 54,
    'orchestra hit': 55,
    trumpet: 56,
    trombone: 57,
    tuba: 58,
    'trumpet muted': 59,
    horn: 60,
    brass: 61,
    'synth brass 1': 62,
    'synth brass 2': 63,
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
    'blown bottle': 76,
    shakuhachi: 77,
    whistle: 78,
    ocarina: 79,
    sitar: 104,
    banjo: 105,
    shamisen: 106,
    koto: 107,
    kalimba: 108,
    bagpipe: 109,
    fiddle: 110,
    shanai: 111,
    'tinkle bell': 112,
    agogo: 113,
    'steel drums': 114,
    woodblock: 115,
    'taiko drum': 116,
    'melodic tom': 117,
    'synth drum': 118,
};

const PERCUSSION_INSTRUMENTS: { [k: string]: number } = {
    'high q': 27,
    'spal': 28,
    'scratch push': 29,
    'scratch pull': 30,
    'sticks': 31,
    'square click': 32,
    'metronome click': 33,
    'metronome bell': 34,
    'bass drum': 35,
    'bass drum 2': 36,
    'side drum': 37,
    'snare drum': 38,
    'hand clap': 39,
    'electric snare drum': 40,
    'low floor tom': 41,
    'closed hi-hat': 42,
    'high floor tom': 43,
    'pedal hi-hat': 44,
    'low tom': 45,
    'open hi-hat': 46,
    'low-mid tom': 47,
    'hi-mid tom': 48,
    'crash cymbal': 49,
    'high tom': 50,
    'ride cymbal': 51,
    'chinese cymbal': 52,
    'ride bell': 53,
    'tambourine': 54,
    'splash cymbal': 55,
    'cowbell': 56,
    'crash cymbal 2': 57,
    'vibraslap': 58,
    'ride cymbal 2': 59,
    'high bongo': 60,
    'low bongo': 61,
    'high conga': 62,
    'mid conga': 63,
    'low conga': 64,
    'high timbale': 65,
    'low timbale': 66,
    'high agogo': 67,
    'low agogo': 68,
    'cabasa': 69,
    'maracas': 70,
    'whistle': 71,
    'long whistle': 72,
    'guiro': 73,
    'long guiro': 74,
    'claves': 75,
    'high wood block': 76,
    'low wood block': 77,
    'mute cuica': 78,
    'open cuica': 79,
    'mute triangle': 80,
    'open triangle': 81,
    'shaker': 82,
    'jingle bell': 83,
    'belltree': 84,
    'castanets': 85,
    'mute surdo': 86,
    'open surdo': 87,
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
