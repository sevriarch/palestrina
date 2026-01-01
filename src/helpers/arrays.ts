/**
 * A helper module containing utility functions that act on arrays.
 */

import { isInt, isPosInt } from './validation';
import { dumpOneLine } from '../dump/dump';

function areArraysSameLengths<T>(...arr: T[][]): boolean {
    const s = new Set(arr.map(a => a.length));

    return s.size < 2;
}

/**
 * Return only the unique members of an array.
 */
export function dedupe<T>(arr: T[]): T[] {
    return Array.from(new Set(arr));
}

/**
 * Returns an array of arrays. the first array contains all first
 * members of the passed arrays; the second array contains all
 * second members of the passed arrays, etc.
 */
export function zip<T>(...arr: T[][]): T[][] {
    if (!areArraysSameLengths(...arr)) {
        throw new Error('all arguments to zip should be the same length');
    }

    if (!arr.length) { return []; }

    const len = arr[0].length;
    const ret = new Array(len);

    for (let i = 0; i < len; i++) {
        ret[i] = arr.map(a => a[i]);
    }

    return ret;
}

export function validateWindows(len: number, size: number, step: number, offset: number): void {
    if (!isPosInt(size)) {
        throw new Error(`size must be a positive integer; was ${dumpOneLine(size)}`);
    }

    if (!isPosInt(step)) {
        throw new Error(`step must be a positive integer; was ${dumpOneLine(step)}`);
    }

    if (!isInt(offset)) {
        throw new Error(`offset must be an integer; was ${dumpOneLine(offset)}`);
    }

    if (offset < 0 && -offset > len) {
        throw new Error(`invalid offset ${offset} on length of ${len}`);
    }
}

/**
 * Split an array into an array of sliding windows, moving left to right.
 * An tuple containing two arrays is returned; the first contains complete
 * windows; the second contains all incomplete windows.
 */
export function arrayToWindows<T>(arr: T[], size: number, step: number, offset = 0): [ T[][], T[][] ] {
    validateWindows(arr.length, size, step, offset);

    const first = offset < 0 ? arr.length + offset : offset;
    const max = arr.length - size;
    const full: T[][] = [];
    const rest: T[][] = [];

    for (let i = first; i < arr.length; i += step) {
        if (i > max) {
            rest.push(arr.slice(i, i + size));
        } else {
            full.push(arr.slice(i, i + size));
        }
    }

    return [ full, rest ];
}

/**
 * Make a copy of the first array. For each value in the second array, remove
 * the first instance of it from this copy. Return this modified copy.
 */
export function arraySubtract<T>(arr1: T[], arr2: T[]): T[] {
    const copy = arr1.slice();

    for (const v of arr2) {
        const ix = copy.indexOf(v);

        if (ix !== -1) {
            copy.splice(ix, 1);
        }
    }

    return copy;
}

/**
 * If passed value is not an array, return an array of length 1 containing it, otherwise return passed value.
 */
export function sanitizeToArray<T>(arr: T | T[]): T[] {
    return Array.isArray(arr) ? arr : [ arr ];
}