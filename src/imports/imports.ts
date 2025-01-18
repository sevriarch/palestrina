import { isNumber, isNonnegInt } from '../helpers/validation';

import { dumpOneLine } from '../dump/dump';

/**
 * A module exporting functions for generating numeric sequences.
 */

const cache: Record<string, number[]> = {};

/*
 * HELPERS
 */

function throwIfNotNumber(i: unknown, fn: string, key: string): void {
    if (!isNumber(i)) {
        throw new Error(`imports.${fn}(): ${key} must be a number, was ${dumpOneLine(i)}`);
    }
}

function throwIfNotNonnegInt(i: unknown, fn: string, key = 'argument'): void {
    if (!isNonnegInt(i)) {
        throw new Error(`imports.${fn}(): ${key} must be a non-negative integer, was ${dumpOneLine(i)}`);
    }
}

function isprime(n: number): boolean {
    const max = Math.sqrt(n);

    for (let i = 2; i <= max; i++) {
        if (!(n % i)) { return false; }
    }

    return n > 1;
}

function mapRange<T>(fn: (v: number) => T, n: number): T[] {
    const ret = new Array(n);

    for (let i = 0; i < n; i++) {
        ret[i] = fn(i);
    }

    return ret;
}

function sanitizeMinusZero(n: number): number {
    return Object.is(-0, n) ? 0 : n;
}

/**
 * Return a series, but with caching. Requires a function of arity 1.
 */
function withCache(fn: (n: number) => number[], n: number, name: string): number[] {
    if (cache[name] && n <= cache[name].length) {
        return cache[name].slice(0, n);
    }

    const ret = fn(n);

    cache[name] = ret;

    return ret;
}

/*
 * FIXED SERIES (those whose only argument is length)
 */

/**
 * Return the first n primes (OEIS A000040).
 */
export function primes(n: number): number[] {
    const primes = new Array(n);

    let count = 0;
    for (let curr = 2; count < n; curr++) {
        if (isprime(curr)) {
            primes[count] = curr;
            count++;
        }
    }

    return primes;
}

/**
 * Return the prime factors of the first n numbers.
 */
export function primefactors(n: number): number[][] {
    const pri = withCache(v => primes(v), n, 'primes');

    function valat(v: number): number[] {
        const ret: number[] = [];

        let num = v;
        for (let i = 0; i < v; i++) {
            if (num < pri[i]) { break; }

            while (num % pri[i] === 0) {
                ret.push(pri[i]);

                num /= pri[i];
            }
        }

        return ret;
    }

    return mapRange(valat, n);
}

/**
 * Return the first n primepis (OEIS A000720).
 */
export function primepi(n: number): number[] {
    const primepi = new Array(n);

    let count = 0;
    for (let curr = 0; curr < n; curr++) {
        if (isprime(curr)) {
            count++;
        }

        primepi[curr] = count;
    }

    return primepi;
}

/**
 * Return the squares of the first n integers (OEIS A000290).
 */
export function squares(n: number): number[] {
    throwIfNotNonnegInt(n, 'squares');

    return mapRange(v => v * v, n);
}

/**
 * Return the integer parts of the first n square roots (OEIS A000196).
 */
export function sqrt_floor(n: number): number[] {
    throwIfNotNonnegInt(n, 'sqrt_floor');

    return mapRange(v => Math.floor(Math.sqrt(v)), n);
}

/**
 * Return the nearest integer to the first n square roots (OEIS A000914).
 */
export function sqrt_round(n: number): number[] {
    throwIfNotNonnegInt(n, 'sqrt_round');

    return mapRange(v => Math.round(Math.sqrt(v)), n);
}

/**
 * Return the ceiling of the first n square roots (OEIS A135034).
 */
export function sqrt_ceil(n: number): number[] {
    throwIfNotNonnegInt(n, 'sqrt_ceil');

    return mapRange(v => Math.ceil(Math.sqrt(v)), n);
}

/**
 * Return the first n bigomegas (OEIS A001222).
 */
export function bigomega(n: number): number[] {
    throwIfNotNonnegInt(n, 'bigomega');

    return primefactors(n).map(v => v.length);
}

/**
 * Return the first n triangular numbers (OEIS A000217).
 */
export function triangular(n: number): number[] {
    throwIfNotNonnegInt(n, 'triangular');

    const ret = new Array(n);

    let curr = 0;
    for (let i = 0; i < n; i++) {
        curr += i;

        ret[i] = curr;
    }

    return ret;
}

/**
 * Return the first members of the Fibonacci series (OEIS A000045).
 * Note that due to Javascript limitations, rounding errors will occur
 * once values exceed Number.MAX_SAFE_INTEGER (9007199254740991).
 */
export function fibonacci(n: number): number[] {
    throwIfNotNonnegInt(n, 'fibonacci');

    const ret = new Array(n);

    if (n > 0) { ret[0] = 0; }
    if (n > 1) { ret[1] = 1; }

    for (let i = 2; i < n; i++) {
        ret[i] = ret[i - 1] + ret[i - 2];
    }

    return ret;
}

/**
 * Return the number of runs in binary expansion (OEIS A005811).
 */
export function binary_runs(n: number): number[] {
    throwIfNotNonnegInt(n, 'binary_runs');

    function valat(v: number): number {
        let ct = 0;

        let last = (1 & v) === 1;
        for (let bit = 1; bit <= v; bit <<= 1) {
            const curr = (bit & v) === 0;

            if (last !== curr) {
                last = curr;
                ct++;
            }
        }

        return ct;
    }

    return mapRange(valat, n);
}

/**
 * Return the first n members of Per Nørgård's infinity series (OEIS A004718).
 */
export function infinity(n: number): number[] {
    throwIfNotNonnegInt(n, 'infinity');

    function valat(v: number): number {
        if (!v) { return 0; }

        return v % 2 ? valat((v - 1) / 2) + 1 : sanitizeMinusZero(-valat(v / 2));
    }

    return mapRange(valat, n);
}

/**
 * Return the first n members of Per Nørgård's rhythmic infinity series (OEIS A073334).
 */
export function infinity_rhythmic(n: number): number[] {
    throwIfNotNonnegInt(n, 'infinity_rhythmic');

    const fib = fibonacci(Math.ceil(Math.log2(n || 1)) + 5);

    return binary_runs(n).map(v => fib[v + 4]);
}

/**
 * Return the first n members of the first variant of Per Nørgård's infinity series (OEIS A256184).
 */
export function infinity_var1(n: number): number[] {
    throwIfNotNonnegInt(n, 'infinity_var1');

    function valat(v: number): number {
        if (!v) { return 0; }

        switch (v % 3) {
        case 0: return sanitizeMinusZero(-valat(v / 3));
        case 1: return valat((v - 1) / 3) - 2;
        default: return valat((v - 2) / 3) - 1;
        }
    }

    return mapRange(valat, n);
}

/**
 * Return the first n members of the second variant of Per Nørgård's infinity series (OEIS A256185).
 */
export function infinity_var2(n: number): number[] {
    throwIfNotNonnegInt(n, 'infinity_var2');

    function valat(v: number): number {
        if (!v) { return 0; }

        switch (v % 3) {
        case 0: return sanitizeMinusZero(-valat(v / 3));
        case 1: return valat((v - 1) / 3) - 3;
        default: return -2 - valat((v - 2) / 3);
        }
    }

    return mapRange(valat, n);
}

/**
 * Return the first n members of Karl Aage Rasmussen's series (OEIS A056239).
 */
export function rasmussen(n: number): number[] {
    throwIfNotNonnegInt(n, 'rasmussen');

    const ppi = withCache(v => primepi(v), n, 'primepi');

    return primefactors(n)
        .map(v => v.reduce((tot, val) => ppi[val] + tot, 0));
}

/**
 * Return the first n members of the series used in the 3rd movement of Triptych.
 */
export function my1(n: number): number[] {
    throwIfNotNonnegInt(n, 'my1');

    return triangular(n + 1)
        .map((v, i) => v % Math.floor(Math.sqrt(i)))
        .slice(1);
}

/**
 * Return the first n members of a series generated by taking the first
 * n numbers and reversing their bit order.
 */
export function bitrev(n: number): number[] {
    throwIfNotNonnegInt(n, 'bitrev');

    function valat(i: number): number {
        if (!i) { return 0; }

        let ret = 0;
        let bit1 = 1 << Math.floor(Math.log2(i));
        let bit2 = 1;

        while (bit1) {
            if (i & bit1) {
                ret |= bit2;
            }

            bit1 >>= 1;
            bit2 <<= 1;
        }

        return ret;
    }

    return mapRange(valat, n);
}

/**
 * Return the first n numbers, starting from 0.
 */
export function increment(n: number): number[] {
    throwIfNotNonnegInt(n, 'increment');

    return mapRange(v => v, n);
}

/*
 * MULTIVARIANT FUNCTIONS
 */

/**
 * Return a series of length n where all values are val.
 */
export function constant<T>(n: number, val: T): T[] {
    throwIfNotNonnegInt(n, 'constant', 'first argument');

    return new Array(n).fill(val);
}

/**
 * Return a floored linear series based on length and first and last values.
 */
export function linear(n: number, first: number, last: number): number[] {
    throwIfNotNonnegInt(n, 'linear', 'first argument');
    throwIfNotNumber(first, 'linear', 'second argument');
    throwIfNotNumber(last, 'linear', 'third argument');

    const grad = (last - first) / (n - 1);

    return mapRange(i => sanitizeMinusZero(Math.floor(first + grad * i)), n);
}

/**
 * Return a step function series whose first value is start. The value increments
 * by inc for each and ends as soon as the stop value has been passed.
 */
export function step(start: number, stop: number, inc: number): number[] {
    throwIfNotNumber(start, 'step', 'first argument');
    throwIfNotNumber(stop, 'step', 'second argument');
    throwIfNotNumber(inc, 'step', 'third argument');

    if (!inc) {
        throw new Error('imports.step(): Cannot step with zero increment.');
    }

    const cmpfn = inc > 0 ? (x: number) => x <= stop : (x: number) => x >= stop;
    const ret: number[] = [];

    for (let curr = start; cmpfn(curr); curr += inc) {
        ret.push(curr);
    }

    return ret;
}

/**
 * Return the first n non-negative integers from a pseudorandom sequence.
 * The maximum value allowed is one less than max.
 * The pseudorandom seed can be passed if desired, otherwise a default is used.
 */
export function xorshift(n: number, max: number, seed = 0x57B37C1E): number[] {
    throwIfNotNonnegInt(n, 'xorshift', 'first argument');
    throwIfNotNonnegInt(max, 'xorshift', 'second argument');
    throwIfNotNonnegInt(seed, 'xorshift', 'third argument');

    const ret = new Array(n);

    let val = seed;
    for (let i = 0; i < n; i++) {
        val ^= val << 13;
        val ^= val >> 17;
        val ^= val << 5;

        ret[i] = sanitizeMinusZero(Math.abs(val) % max);
    }

    return ret;
}

/**
 * Return the first n members of a sinusoidal sequence.
 * The difference between maximum and minimum possible values is width.
 * The angle corresponding to the first member of the sequence is start.
 * The angle corresponding to the last member of the sequence is stop.
 */
export function sinusoidal(n: number, width: number, firstAngle: number, lastAngle: number): number[] {
    throwIfNotNonnegInt(n, 'sinusoidal', 'first argument');
    throwIfNotNumber(width, 'sinusoidal', 'second argument');
    throwIfNotNumber(firstAngle, 'sinusoidal', 'third argument');
    throwIfNotNumber(lastAngle, 'sinusoidal', 'fourth argument');

    const grad = (lastAngle - firstAngle) / (n - 1);
    const PI180 = Math.PI / 180;

    return mapRange(i => {
        const angle = PI180 * (firstAngle + (i * grad));

        return sanitizeMinusZero(Math.floor(0.5 + width * Math.sin(angle)));
    }, n);
}

/**
 * Convert text to numbers 0-25; the characters in the second argument map to nulls.
 * Any non-letter characters not in the second argument are ignored.
 */
export function text(text: string, nulls = ''): (null | number)[] {
    if (typeof text !== 'string') {
        throw new Error(`imports.text(): first argument must be a string; was ${dumpOneLine(text)}`);
    }

    if (typeof nulls !== 'string') {
        throw new Error(`imports.text(): first argument must be a string; was ${dumpOneLine(nulls)}`);
    }

    const nv = nulls.split('');
    const chars = text.toLowerCase().split('');
    const ret: (null | number)[] = [];

    for (let i = 0; i < chars.length; i++) {
        if (nv.includes(chars[i])) {
            ret.push(null);
            continue;
        }

        const ch = chars[i].charCodeAt(0);

        if (ch >= 97 && ch <= 122) {
            ret.push(ch - 97);
        }
    }

    return ret;
}

/**
 * Return the first n numbers, starting from 0, mapped through a mapper function.
 */
export function func(n: number, fn: (i: number) => number): number[] {
    if (typeof fn !== 'function') {
        throw new Error('imports.func(): second argument must be a function');
    }

    throwIfNotNonnegInt(n, 'func', 'first argument');

    return mapRange(fn, n);
}
