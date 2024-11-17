/**
 * A helper module exporting validation functions.
 */

/**
 * Return true if the passed argument is a finite number.
 */
export function isNumber(i: unknown): boolean {
    return typeof i === 'number' && isFinite(i);
}

/**
 * Return true if the passed argument is a non-negative number.
 */
export function isNonNegNumber(i: unknown) {
    return typeof i === 'number' && isFinite(i) && i >= 0;
}

/**
 * Return true if the passed argument is a non-negative number.
 */
export function isPosNumber(i: unknown) {
    return typeof i === 'number' && isFinite(i) && i > 0;
}

/**
 * Return true if the passed argument is an integer.
 */
export function isInt(i: unknown): boolean {
    return isNumber(i) && !(i as number % 1);
}

/**
 * Return true if the passed argument is a positive integer.
 */
export function isPosInt(i: unknown): boolean {
    return isInt(i) && (i as number) > 0;
}

/**
 * Return true if the passed argument is a non-negative integer.
 */
export function isNonnegInt(i: unknown): boolean {
    return isInt(i) && (i as number) >= 0;
}

/**
 * Return true if the passed argument is an integer between the passed values.
 */
export function isIntBetween(i: unknown, min: number, max: number) {
    return isInt(i) && (i as number) >= min && i as number <= max;
}

/**
 * Return true if the passed argument is a N-bit unsigned integer.
 */
export function isNBitInt(i: unknown, bits: number) {
    return isIntBetween(i, 0, Math.pow(2, bits) - 1);
}

/**
 * Return true if the passed argument is a 7-bit unsigned integer.
 */
export function is7BitInt(i: unknown): boolean {
    return isIntBetween(i, 0, 127);
}

/**
 * Return true if the passed argument is a valid MIDI channel.
 */
export function isMidiChannel(i: unknown): boolean {
    return isIntBetween(i, 1, 16);
}

/**
 * Return any keys in the object which are not within the OK list.
 */
export function invalidKeys(ob: object, ok: Set<string>): string[] {
    return Object.keys(ob).filter(k => !ok.has(k));
}

/**
 * Return any indices that fail the passed validation function.
 */
export function validateArray<T>(arr: T[], fn: (val: T, i: number) => boolean): [ number, T ][] {
    const failed: [ number, T ][] = [];

    for (let i = 0; i < arr.length; i++) {
        if (!fn(arr[i], i)) {
            failed.push([ i, arr[i] ]);
        }
    }

    return failed;
}