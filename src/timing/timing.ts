import { isNonNegNumber, isPosNumber, isInt, isNonnegInt } from '../helpers/validation';

import { dumpOneLine } from '../dump/dump';

/**
 * A class that handles timing of events (notes/chords/silences and meta-events).
 */

export default class Timing {
    exact?: number;
    offset?: number;
    delay?: number;
    duration?: number;

    static isDurationValid(i: unknown): boolean {
        return isNonnegInt(i);
    }

    static isDelayValid(i: unknown): boolean {
        return isInt(i);
    }

    static isOffsetValid(i: unknown): boolean {
        return isInt(i);
    }

    static isExactTickValid(i: unknown): boolean {
        return isNonnegInt(i);
    }

    constructor(exact?: number | undefined, offset?: number | undefined, delay?: number | undefined, duration?: number | undefined) {
        if (exact !== undefined) {
            this.exact = exact;
        }

        if (offset !== undefined) {
            this.offset = offset;
        }

        if (delay !== undefined) {
            this.delay = delay;
        }

        if (duration !== undefined) {
            this.duration = duration;
        }

        Object.freeze(this);
    }

    augment(n: number): Timing {
        if (!isNonNegNumber(n)) {
            throw new Error(`Timing.augment(): argument must be a non-negative number, was ${dumpOneLine(n)}`);
        }

        let exact, offset, delay, duration: number | undefined;
        if (this.exact !== undefined) {
            exact = this.exact * n;

            if (!Timing.isExactTickValid(exact)) {
                throw new Error(`Timing.augment(): calculated exact tick was not a non-negative integer, was ${dumpOneLine(exact)}`);
            }
        }

        if (this.offset !== undefined) {
            offset = this.offset * n;

            if (!Timing.isOffsetValid(offset)) {
                throw new Error(`Timing.augment(): calculated offset was not an integer, was ${dumpOneLine(offset)}`);
            }
        }

        if (this.delay !== undefined) {
            delay = this.delay * n;

            if (!Timing.isDelayValid(delay)) {
                throw new Error(`Timing.augment(): calculated delay was not a non-negative integer, was ${dumpOneLine(delay)}`);
            }
        }

        if (this.duration !== undefined) {
            duration = this.duration * n;

            if (!Timing.isDurationValid(duration)) {
                throw new Error(`Timing.augment(): calculated duration was not an integer, was ${dumpOneLine(duration)}`);
            }
        }

        return new Timing(exact, offset, delay, duration);
    }

    diminish(n: number): Timing {
        if (!isPosNumber(n)) {
            throw new Error(`Timing.diminish(): argument must be a positive number, was ${dumpOneLine(n)}`);
        }

        return this.augment(1 / n);
    }

    withExactTick(n: number): Timing {
        if (!Timing.isExactTickValid(n)) {
            throw new Error(`Timing.withExactTick(): argument must be a non-negative integer, was ${dumpOneLine(n)}`);
        }

        return new Timing(n, this.offset, this.delay, this.duration);
    }

    withOffset(n: number): Timing {
        if (!Timing.isOffsetValid(n)) {
            throw new Error(`Timing.withOffset(): argument must be an integer, was ${dumpOneLine(n)}`);
        }

        return new Timing(this.exact, n, this.delay, this.duration);
    }

    withDelay(n: number): Timing {
        if (!Timing.isDelayValid(n)) {
            throw new Error(`Timing.withDelay(): argument must be an integer, was ${dumpOneLine(n)}`);
        }

        return new Timing(this.exact, this.offset, n, this.duration);
    }

    withDuration(n: number): Timing {
        if (!Timing.isDurationValid(n)) {
            throw new Error(`Timing.withDuration(): argument must be a non-negative integer, was ${dumpOneLine(n)}`);
        }

        return new Timing(this.exact, this.offset, this.delay, n);
    }

    withAllTicksExact(curr: number): Timing {
        return new Timing(this.startTick(curr), 0, undefined, this.duration);
    }

    startTick(curr: number): number {
        return (this.exact ?? curr) + (this.delay ?? 0) + (this.offset ?? 0);
    }

    endTick(curr: number): number {
        return this.startTick(curr) + (this.duration ?? 0);
    }

    nextTick(curr: number): number {
        return (this.exact ?? curr) + (this.delay ?? 0) + (this.duration ?? 0);
    }

    equals(t: unknown): boolean {
        return t instanceof Timing
            && this.exact === t.exact
            && this.offset === t.offset
            && this.delay === t.delay
            && this.duration === t.duration;
    }
}