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
 * The result is a tuple containing four members:
 * 
 * The first ("chunks") contains the chunks extracted from the array
 * 
 * The second ("remnants") contains those remnants not included in the chunks
 * 
 * The third ("head") contains any array members before the first chunk
 * 
 * The last ("tail") contains any array members left over after the final chunk/remnants extraction
 * 
 * The chunks and remnant arrays will always be of the same length.
 * 
 * To reconstruct the original array, create a result array containing the head, then loop through
 * the remnant and chunks arrays, appending each value in turn (chunks first, then remnants). Then
 * add the tail onto the end after the loop is completed.
 */
export function extractChunksFromArray<T>(arr: T[], size: number, step: number, offset = 0): [ T[][], T[][], T[], T[] ] {
    if (!isPosInt(size)) {
        throw new Error(`size must be a positive integer; was ${dumpOneLine(size)}`);
    }

    if (!isPosInt(step)) {
        throw new Error(`step must be a positive integer; was ${dumpOneLine(step)}`);
    }

    const first = getOffset(offset, arr.length);
    const laststart = arr.length - size;

    if (first > laststart) { // no full chunk extractable
        return [ [], [], arr.slice(), [] ];
    }

    const remnants = [];
    const chunks = [];

    let curr = first;
    do {
        chunks.push(arr.slice(curr, curr + size));
        remnants.push(arr.slice(curr + size, curr + step));

        curr += step;
    } while (curr <= laststart);

    const unused = size > step ? (curr - step + size) : curr;

    return [ chunks, remnants, arr.slice(0, first), arr.slice(unused) ];
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