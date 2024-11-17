/**
 * A helper module exporting functions that perform calculations.
 */

function filterNulls<T>(arr: (T | null)[]): T[] {
    return arr.filter(v => v !== null) as T[];
}

/**
 * Return the sum of all non-null members of an array.
 */
export function sum(arr: (number | null)[]): number {
    return filterNulls(arr).reduce((tot, val) => tot + val, 0);
}

/**
 * Return the lowest non-null value in the array.
 */
export function min(arr: (number | null)[]): number | null {
    const a = filterNulls(arr);

    return a.length ? Math.min(...a) : null;
}

/**
 * Return the highest non-null value in the array.
 */
export function max(arr: (number | null)[]): number | null {
    const a = filterNulls(arr);

    return a.length ? Math.max(...a) : null;
}

/**
 * Create a matrix from two arrays based on sums of the values in the two arrays.
 */
export function crossSum(a1: number[], a2: number[]): number[][] {
    return a1.map((v1: number) => a2.map((v2: number) => v1 + v2));
}

/**
 * Create a matrix from two arrays based on sums of the values in the two arrays,
 * then flatten it.
 */
export function flatCrossSum(a1: number[], a2: number[]): number[] {
    return a1.flatMap((v1: number) => a2.map((v2: number) => v1 + v2));
}

/*
 * Convert a MIDI note to its frequency in Hz.
 */
export function noteToFreq(note: number): number {
    return Math.pow(2, (note - 69) / 12) * 440;
}

/**
 * Convert a frequency in Hz to its MIDI note.
 */
export function freqToNote(freq: number): number {
    return 69 + 12 * Math.log2(freq / 440);
}