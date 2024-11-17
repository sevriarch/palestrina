import { isNumber } from './validation';
import { flatCrossSum } from './calculations';

/**
 * A helper module containing pitch-related functions.
 */

// TODO: Scordatura / 5-string bass options?
const VN_OPEN_STRINGS = [ 55, 62, 69, 76 ];
const VA_OPEN_STRINGS = [ 48, 55, 62, 69 ];
const VC_OPEN_STRINGS = [ 36, 43, 50, 57 ];
const DB_OPEN_STRINGS = [ 28, 33, 38, 43 ];

const OPEN_STRINGS: Record<string, number[]> = {
    violin: VN_OPEN_STRINGS,
    viola: VA_OPEN_STRINGS,
    cello: VC_OPEN_STRINGS,
    'double bass': DB_OPEN_STRINGS
};

const STR_NAT_HARMONICS = [ 19, 24, 28 ];

const VN_NAT_HARMONICS = flatCrossSum(VN_OPEN_STRINGS, STR_NAT_HARMONICS);
const VA_NAT_HARMONICS = flatCrossSum(VA_OPEN_STRINGS, STR_NAT_HARMONICS);
const VC_NAT_HARMONICS = flatCrossSum(VC_OPEN_STRINGS, STR_NAT_HARMONICS);
const DB_NAT_HARMONICS = flatCrossSum(DB_OPEN_STRINGS, STR_NAT_HARMONICS);

const NAT_HARMONICS: Record<string, number[]> = {
    violin: VN_NAT_HARMONICS,
    viola: VA_NAT_HARMONICS,
    cello: VC_NAT_HARMONICS,
    'double bass': DB_NAT_HARMONICS
};

function lookup(table: Record<string, number[]>, inst: string, pitch: number): boolean {
    if (!isNumber(pitch)) {
        throw new Error(`invalid pitch: ${pitch}`);
    }

    const vals = table[inst];

    if (!vals) {
        throw new Error(`invalid instrument: ${inst}`);
    }

    return vals.includes(pitch);
}

/**
 * Can this pitch be played on an open string on the specified string instrument?
 */
export function isOpenString(inst: string, pitch: number): boolean {
    return lookup(OPEN_STRINGS, inst, pitch);
}

/**
 * Can this pitch easily be played as a natural harmonic on the specified string instrument?
 * (Only includes natural harmonics at the 5th, 4th and major thirds).
 */
export function isNaturalHarmonic(inst: string, pitch: number): boolean {
    return lookup(NAT_HARMONICS, inst, pitch);
}