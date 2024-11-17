import type { PitchMutatorFn, GamutOpts } from '../types';

import { isInt, isPosInt, isNumber } from '../helpers/validation';

import { dumpOneLine} from '../dump/dump';

/**
 * A helper module containing pitch mutation functions.
 */

function nonnegMod(val: number, mod: number) {
    const ret = val % mod;

    return ret < 0 ? (ret + mod) : ret;
}

const SCALES: Record<string, number[]> = {
    chromatic:   [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11 ],
    octatonic12: [ 0, 1, 3, 4, 6, 7, 9, 10 ],
    octatonic21: [ 0, 2, 3, 5, 6, 8, 9, 11 ],
    wholetone:   [ 0, 2, 4, 6, 8, 10 ],
    major:       [ 0, 2, 4, 5, 7, 9, 11 ],
    minor:       [ 0, 2, 3, 5, 7, 8, 10 ],
    ionian:      [ 0, 2, 4, 5, 7, 9, 11 ],
    dorian:      [ 0, 2, 3, 5, 7, 9, 10 ],
    phrygian:    [ 0, 1, 3, 5, 7, 8, 10 ],
    lydian:      [ 0, 2, 4, 6, 7, 9, 11 ],
    mixolydian:  [ 0, 2, 4, 5, 7, 9, 10 ],
    aeolian:     [ 0, 2, 3, 5, 7, 8, 10 ],
    locrian:     [ 0, 1, 3, 5, 6, 8, 10 ],
    pentatonic:  [ 0, 2, 4, 7, 9 ],
    pentatonicc: [ 0, 2, 4, 7, 9 ],
    pentatonicd: [ 0, 2, 5, 7, 10 ],
    pentatonice: [ 0, 3, 5, 8, 10 ],
    pentatonicg: [ 0, 2, 5, 7, 9 ],
    pentatonica: [ 0, 3, 5, 7, 10 ],
};

/**
 * Return the notes in a scale. Argument passed can be either the name of
 * a scale (eg: "minor', "mixolydian") or an array of notes. If the input
 * is not valid, will throw an error.
 */
export function getScale(scale: string | number[]): number[] {
    if (typeof scale === 'string') {
        if (SCALES[scale]) {
            return SCALES[scale].slice();
        }

        throw new Error(`${dumpOneLine(scale)} is not a scale`);
    }

    if (!scale.length) {
        throw new Error('cannot supply an empty scale');
    }

    if (!scale.every(isNumber)) {
        throw new Error(`scale ${dumpOneLine(scale)} contains invalid value(s)`);
    }

    return scale;
}

/**
 * Return a function that inverts pitches by the passed number.
 */
export function invertFn(around: number): PitchMutatorFn {
    if (!isNumber(around)) {
        throw new Error(`mutators.invertFn(): first argument must be a number, was ${dumpOneLine(around)}`);
    }

    return (v: number) => 2 * around - v;
}

/**
 * Return a function that transposes pitches by the passed number.
 */
export function transposeFn(delta: number): PitchMutatorFn {
    if (!isNumber(delta)) {
        throw new Error(`mutators.transposeFn(): first argument must be a number, was ${dumpOneLine(delta)}`);
    }

    return (v: number) => delta + v;
}

/**
 * Return a function that augments pitches by the passed number.
 */
export function augmentFn(mult: number): PitchMutatorFn {
    if (!isNumber(mult)) {
        throw new Error(`mutators.augmentFn(): first argument must be a number, was ${dumpOneLine(mult)}`);
    }

    return (v: number) => mult * v;
}

/**
 * Return a function that diminishes pitches by the passed number.
 */
export function diminishFn(div: number): PitchMutatorFn {
    if (!isNumber(div)) {
        throw new Error(`mutators.diminishFn(): first argument must be a number, was ${dumpOneLine(div)}`);
    }

    return (v: number) => v / div;
}

/**
 * Return a function that applies a modulus operator to pitches.
 */
export function modFn(mod: number): PitchMutatorFn {
    if (!isNumber(mod) || mod <= 0) {
        throw new Error(`mutators.modFn(): first argument must be a positive number, was ${dumpOneLine(mod)}`);
    }

    return (val: number) => {
        const ret = val % mod;

        return ret < 0 ? (ret + mod) : ret;
    };
}

/**
 * Return a function that applies upper and lower limits to pitches.
 * Passing null as lower/higher limit means that no such limit will be applied.
 */
export function trimFn(min: number | null = null, max: number | null = null): PitchMutatorFn {
    if (max !== null && !isNumber(max)) {
        throw new Error(`mutators.trimFn(): second argument must be null or a number, was ${dumpOneLine(max)}`);
    }

    if (min !== null) {
        if (!isNumber(min)) {
            throw new Error(`mutators.trimFn(): second argument must be null or a number, was ${dumpOneLine(max)}`);
        }

        if (max !== null) {
            if (min > max) {
                throw new Error(`mutators.trimFn(): min ${min} is higher than max ${max}`);
            }

            return (v: number) => v < min ? min : v > max ? max : v;
        }

        return (v: number) => v < min ? min : v;
    }

    if (max !== null) {
        return (v: number) => v > max ? max : v;
    }

    return (v: number) => v;
}

/**
 * Return a function that bounces pitches between upper and lower limits.
 * Passing null as lower/higher limit means that no such limit will be applied.
 */
export function bounceFn(min: number | null = null, max: number | null = null): PitchMutatorFn {
    if (max !== null && !isNumber(max)) {
        throw new Error(`mutators.bounceFn(): second argument must be null or a number, was ${dumpOneLine(max)}`);
    }

    if (min !== null) {
        if (!isNumber(min)) {
            throw new Error(`mutators.bounceFn(): second argument must be null or a number, was ${dumpOneLine(max)}`);
        }

        if (max !== null) {
            if (min > max) {
                throw new Error(`mutators.bounceFn(): min ${min} is higher than max ${max}`);
            }

            const diff = max - min;

            return (v: number) => {
                if (v < min) {
                    let mod = (min - v) % (diff * 2);

                    if (mod > diff) { mod = 2 * diff - mod; }

                    return min + mod;
                }

                if (v > max) {
                    let mod = (v - max) % (diff * 2);

                    if (mod > diff) { mod = 2 * diff - mod; }

                    return max - mod;
                }

                return v;
            };
        }

        return (v: number) => v < min ? (2 * min - v) : v;
    }

    if (max !== null) {
        return (v: number) => v > max ? (2 * max - v) : v;
    }

    return (v: number) => v;
}

/**
 * Return a function that applies a scale to pitches.
 * The first argument is the scale, which can be passed as a string name or an array of notes.
 * The second argument is the pitch that a value of zero in the sequence corresponds to.
 * The third optional argument is the length of an octave in this scale.
 */
export function scaleFn(scale: string | number[], zero: number, octave = 12): PitchMutatorFn {
    const pitches = getScale(scale);
    const modulus = pitches.length;

    if (!isNumber(zero)) {
        throw new Error(`mutators.scaleFn(): second argument must be a number, wwas ${dumpOneLine(zero)}`);
    }

    if (!isPosInt(octave)) {
        throw new Error(`mutators.scaleFn(): third argument is not a positive integer, was ${dumpOneLine(octave)}`);
    }

    return (v: number) => {
        const octaves = Math.floor(v / modulus);

        return zero + pitches[v - octaves * modulus] + octaves * octave;
    };
}

/**
 * Return a function that applies a gamut to pitches.
 * The second argument is a set of optional options:
 *  - opts.highVal is a value to use for pitches above the top of the gamut.
 *  - opts.lowVal is a value to use for pitches below the bottom of the gamut.
 *  - opts.zero is the pitch in the gamut to map a pitch of 0 to.
 */
export function gamutFn(gamut: number[], opts: GamutOpts = {}): PitchMutatorFn {
    if (!Array.isArray(gamut)) {
        throw new Error(`mutators.gamutFn(): first argument must be an array: was ${dumpOneLine(gamut)}`);
    }

    const gsize = gamut.length;

    if (!gsize) {
        throw new Error('mutators.gamutFn(): gamut cannot be empty');
    }

    if (gamut.some(v => !isNumber(v))) {
        throw new Error('mutators.gamutFn(): all members of the gamut must be numbers');
    }

    if (typeof opts !== 'object' || opts === null) {
        throw new Error(`mutators.gamutFn(): second argument must be an object, was ${dumpOneLine(opts)}`);
    }

    let zero: number;
    if (opts.zero) {
        zero = gamut.indexOf(opts.zero);

        if (zero === -1) {
            throw new Error('mutators.gamutFn(): opts.zero must be in the gamut');
        }
    } else {
        zero = 0;
    }

    if (opts.lowVal !== undefined && opts.lowVal !== null && !isNumber(opts.lowVal)) {
        throw new Error(`mutators.gamutFn(): opts.lowVal, if supplied, must be a number, was ${dumpOneLine(opts.lowVal)}`);
    }

    if (opts.highVal !== undefined && opts.highVal !== null && !isNumber(opts.highVal)) {
        throw new Error(`mutators.gamutFn(): opts.highVal, if supplied, must be a number, was ${dumpOneLine(opts.highVal)}`);
    }

    return (v: number) => {
        if (!isInt(v)) {
            throw new Error(`gamuts can only be applied to integer pitches; was ${dumpOneLine(v)}`);
        }

        const val = v + zero;

        if (opts.highVal !== undefined && val >= gsize) {
            return opts.highVal;
        }

        if (opts.lowVal !== undefined && val < 0) {
            return opts.lowVal;
        }

        return gamut[nonnegMod(val, gsize)];
    };
}
