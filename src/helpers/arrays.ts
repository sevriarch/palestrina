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

function getOffset(offset: number, len: number) {
    if (!isInt(offset)) {
        throw new Error(`offset must be an integer; was ${dumpOneLine(offset)}`);
    }

    if (offset < 0) {
        if (-offset > len) {
            throw new Error(`invalid offset ${offset} on length of ${len}`);
        }

        return len + offset;
    }

    return offset;
}

/**
 * Split an array into chunks defined by a size and step number, beginning at an offset.
 * The result is a tuple containing two arrays: the first contains the chunks extracted
 * from the array, the second contains those array members not included in the chunks.
 * 
 * The second array is always one longer than the first.
 * 
 * To reconstruct the original array, loop through through the result arrays, appending
 * each value in them to an initially empty array, alternating between the two result
 * arrays, starting with the second.
 */
export function extractChunksFromArray<T>(arr: T[], size: number, step: number, offset = 0): [ T[][], T[][] ] {
    if (!isPosInt(size)) {
        throw new Error(`size must be a positive integer; was ${dumpOneLine(size)}`);
    }

    if (!isPosInt(step)) {
        throw new Error(`step must be a positive integer; was ${dumpOneLine(step)}`);
    }

    const len = arr.length;
    const first = getOffset(offset, len);
    const laststart = len - size;

    if (first > laststart) { // no full chunk extractable
        return [ [], [ arr.slice() ] ];
    }

    const rest = [ arr.slice(0, first) ];
    const chunks: T[][] = [];

    let curr = first;
    while (curr <= laststart) {
        chunks.push(arr.slice(curr, curr + size));
        rest.push(arr.slice(curr + size, curr + step));

        curr += step;
    }

    // append anything at tail of array that was unused
    const unused = size > step ? (curr - step + size) : curr;
    rest[rest.length - 1].push(...arr.slice(unused));

    return [ chunks, rest ];
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