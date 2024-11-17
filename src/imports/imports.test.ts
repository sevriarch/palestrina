import * as imports from './imports';

function order(len: number): number[] {
    // Repeat and order to test caching in series that implement this
    return [
        Math.floor(len / 4),
        Math.floor(3 * len / 4),
        Math.floor(3 * len / 4),
        0,
        len - 1,
        Math.floor(len / 2),
    ];
}

function testFixedSeries<T>(fn: (i: number) => T[], vals: T[]) {
    test('fails with negative integer argument', () => {
        expect(() => fn(-1)).toThrow();
    });

    test('fails with float argument', () => {
        expect(() => fn(1.5)).toThrow();
    });

    test.each(order(vals.length))(`${fn.name}(%p)`, len => {
        expect(fn(len)).toStrictEqual(vals.slice(0, len));
    });
}

describe('imports.primefactors() test', () => {
    const START = [ [], [], [ 2 ], [ 3 ], [ 2, 2 ], [ 5 ], [ 2, 3 ], [ 7 ], [ 2, 2, 2 ], [ 3, 3 ], [ 2, 5 ], [ 11 ], [ 2, 2, 3 ], [ 13 ], [ 2, 7 ], [ 3, 5 ], [ 2, 2, 2, 2 ], [ 17 ], [ 2, 3, 3 ], [ 19 ], [ 2, 2, 5 ], [ 3, 7 ], [ 2, 11 ], [ 23 ], [ 2, 2, 2, 3 ], [ 5, 5 ], [ 2, 13 ], [ 3, 3, 3 ], [ 2, 2, 7 ], [ 29 ], [ 2, 3, 5 ], [ 31 ], [ 2, 2, 2, 2, 2 ], [ 3, 11 ], [ 2, 17 ], [ 5, 7 ], [ 2, 2, 3, 3 ], [ 37 ], [ 2, 19 ], [ 3, 13 ], [ 2, 2, 2, 5 ], [ 41 ], [ 2, 3, 7 ], [ 43 ], [ 2, 2, 11 ], [ 3, 3, 5 ], [ 2, 23 ], [ 47 ], [ 2, 2, 2, 2, 3 ], [ 7, 7 ] ];

    testFixedSeries(imports.primefactors, START);
});

describe('imports.primes() tests', () => {
    const START = [	2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151, 157, 163, 167, 173, 179, 181, 191, 193, 197, 199, 211, 223, 227, 229, 233, 239, 241, 251, 257, 263, 269, 271 ];

    testFixedSeries(imports.primes, START);
});

describe('imports.primepi() tests', () => {
    const START = [ 0, 0, 1, 2, 2, 3, 3, 4, 4, 4, 4, 5, 5, 6, 6, 6, 6, 7, 7, 8, 8, 8, 8, 9, 9, 9, 9, 9, 9, 10, 10, 11, 11, 11, 11, 11, 11, 12, 12, 12, 12, 13, 13, 14, 14, 14, 14, 15, 15, 15, 15, 15, 15, 16, 16, 16, 16, 16, 16, 17, 17, 18, 18, 18, 18, 18, 18, 19, 19, 19, 19, 20, 20, 21, 21, 21, 21, 21, 21 ];

    testFixedSeries(imports.primepi, START);
});

describe('imports.squares() tests', () => {
    const START = [ 0, 1, 4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144, 169, 196, 225, 256, 289, 324, 361, 400, 441, 484, 529, 576, 625, 676, 729, 784, 841, 900, 961, 1024, 1089, 1156, 1225, 1296, 1369, 1444, 1521, 1600, 1681, 1764, 1849, 1936, 2025, 2116, 2209, 2304, 2401, 2500, 2601, 2704, 2809, 2916, 3025, 3136, 3249, 3364, 3481, 3600, 3721, 3844, 3969, 4096, 4225, 4356, 4489, 4624, 4761, 4900, 5041, 5184, 5329, 5476, 5625, 5776, 5929, 6084, 6241, 6400, 6561, 6724, 6889, 7056, 7225, 7396, 7569, 7744, 7921, 8100, 8281 ];

    testFixedSeries(imports.squares, START);
});

describe('imports.sqrt_floor() tests', () => {
    const START = [ 0, 1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9 ];

    testFixedSeries(imports.sqrt_floor, START);
});

describe('imports.sqrt_round() tests', () => {
    const START = [ 0, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 10 ];

    testFixedSeries(imports.sqrt_round, START);
});

describe('imports.sqrt_ceil() tests', () => {
    const START = [ 0, 1, 2, 2, 2, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10 ];

    testFixedSeries(imports.sqrt_ceil, START);
});

describe('imports.bigomega() tests', () => {
    const START = [ 0, 0, 1, 1, 2, 1, 2, 1, 3, 2, 2, 1, 3, 1, 2, 2, 4, 1, 3, 1, 3, 2, 2, 1, 4, 2, 2, 3, 3, 1, 3, 1, 5, 2, 2, 2, 4, 1, 2, 2, 4, 1, 3, 1, 3, 3, 2, 1, 5, 2, 3, 2, 3, 1, 4, 2, 4, 2, 2, 1, 4, 1, 2, 3, 6, 2, 3, 1, 3, 2, 3, 1, 5, 1, 2, 3, 3, 2, 3, 1, 5, 4, 2, 1, 4, 2, 2, 2, 4, 1, 4, 2, 3, 2, 2, 2, 6, 1, 3, 3, 4, 1, 3, 1, 4, 3, 2, 1, 5, 1, 3, 2 ];

    testFixedSeries(imports.bigomega, START);
});

describe('imports.triangular() tests', () => {
    const START = [ 0, 1, 3, 6, 10, 15, 21, 28, 36, 45, 55, 66, 78, 91, 105, 120, 136, 153, 171, 190, 210, 231, 253, 276, 300, 325, 351, 378, 406, 435, 465, 496, 528, 561, 595, 630, 666, 703, 741, 780, 820, 861, 903, 946, 990, 1035, 1081, 1128, 1176, 1225, 1275, 1326, 1378, 1431 ];

    testFixedSeries(imports.triangular, START);
});

describe('imports.fibonacci() tests', () => {
    const START = [ 0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987, 1597, 2584, 4181, 6765, 10946, 17711, 28657, 46368, 75025, 121393, 196418, 317811, 514229, 832040, 1346269, 2178309, 3524578, 5702887, 9227465, 14930352, 24157817, 39088169, 63245986, 102334155 ];

    testFixedSeries(imports.fibonacci, START);
});

describe('imports.binary_runs() tests', () => {
    const START = [ 0, 1, 2, 1, 2, 3, 2, 1, 2, 3, 4, 3, 2, 3, 2, 1, 2, 3, 4, 3, 4, 5, 4, 3, 2, 3, 4, 3, 2, 3, 2, 1, 2, 3, 4, 3, 4, 5, 4, 3, 4, 5, 6, 5, 4, 5, 4, 3, 2, 3, 4, 3, 4, 5, 4, 3, 2, 3, 4, 3, 2, 3, 2, 1, 2, 3, 4, 3, 4, 5, 4, 3, 4, 5, 6, 5, 4, 5, 4, 3, 4, 5, 6, 5, 6, 7, 6, 5, 4, 5, 6, 5, 4, 5 ];

    testFixedSeries(imports.binary_runs, START);
});

describe('imports.infinity() tests', () => {
    const START = [ 0, 1, -1, 2, 1, 0, -2, 3, -1, 2, 0, 1, 2, -1, -3, 4, 1, 0, -2, 3, 0, 1, -1, 2, -2, 3, 1, 0, 3, -2, -4, 5, -1, 2, 0, 1, 2, -1, -3, 4, 0, 1, -1, 2, 1, 0, -2, 3, 2, -1, -3, 4, -1, 2, 0, 1, -3, 4, 2, -1, 4, -3, -5, 6, 1, 0, -2, 3, 0, 1, -1, 2, -2, 3, 1, 0, 3, -2, -4, 5, 0, 1, -1, 2, 1, 0 ];

    testFixedSeries(imports.infinity, START);
});

describe('imports.infinity_rhythmic() tests', () => {
    const START = [ 3, 5, 8, 5, 8, 13, 8, 5, 8, 13, 21, 13, 8, 13, 8, 5, 8, 13, 21, 13, 21, 34, 21, 13, 8, 13, 21, 13, 8, 13, 8, 5, 8, 13, 21, 13, 21, 34, 21, 13, 21, 34, 55, 34, 21, 34, 21, 13, 8, 13, 21, 13, 21, 34, 21, 13, 8, 13, 21, 13, 8, 13, 8, 5, 8, 13, 21, 13, 21, 34, 21, 13, 21, 34, 55, 34, 21 ];

    testFixedSeries(imports.infinity_rhythmic, START);
});

describe('imports.infinity_var1() tests', () => {
    const START = [ 0, -2, -1, 2, -4, -3, 1, -3, -2, -2, 0, 1, 4, -6, -5, 3, -5, -4, -1, -1, 0, 3, -5, -4, 2, -4, -3, 2, -4, -3, 0, -2, -1, -1, -1, 0, -4, 2, 3, 6, -8, -7, 5, -7, -6, -3, 1, 2, 5, -7, -6, 4, -6, -5, 1, -3, -2, 1, -3, -2, 0, -2, -1, -3, 1, 2, 5, -7, -6, 4, -6, -5 ];

    testFixedSeries(imports.infinity_var1, START);
});

describe('imports.infinity_var2() tests', () => {
    const START = [ 0, -3, -2, 3, -6, 1, 2, -5, 0, -3, 0, -5, 6, -9, 4, -1, -2, -3, -2, -1, -4, 5, -8, 3, 0, -3, -2, 3, -6, 1, 0, -3, -2, 5, -8, 3, -6, 3, -8, 9, -12, 7, -4, 1, -6, 1, -4, -1, 2, -5, 0, 3, -6, 1, 2, -5, 0, 1, -4, -1, 4, -7, 2, -5, 2, -7, 8, -11, 6, -3, 0, -5, 0 ];

    testFixedSeries(imports.infinity_var2, START);
});

describe('imports.rasmussen() tests', () => {
    const START = [ 0, 0, 1, 2, 2, 3, 3, 4, 3, 4, 4, 5, 4, 6, 5, 5, 4, 7, 5, 8, 5, 6, 6, 9, 5, 6, 7, 6, 6, 10, 6, 11, 5, 7, 8, 7, 6, 12, 9, 8, 6, 13, 7, 14, 7, 7, 10, 15, 6, 8, 7, 9, 8, 16, 7, 8, 7, 10, 11, 17, 7, 18, 12, 8, 6, 9, 8, 19, 9, 11, 8, 20, 7, 21, 13, 8, 10, 9, 9, 22, 7, 8, 14, 23, 8, 10, 15, 12, 8, 24, 8, 10 ];

    testFixedSeries(imports.rasmussen, START);
});

describe('imports.my1() tests', () => {
    const START = [ 0, 0, 0, 0, 1, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 3, 2, 2, 3, 1, 0, 0, 0, 1, 3, 1, 0, 0, 1, 3, 1, 0, 0, 0, 1, 3, 0, 4, 3, 3, 4, 0, 3, 1, 0, 0, 0, 1, 3, 6, 3, 1, 0, 0, 1, 3, 6, 3, 1, 0, 0, 0 ];

    testFixedSeries(imports.my1, START);
});

describe('imports.bitrev() tests', () => {
    const START = [ 0, 1, 1, 3, 1, 5, 3, 7, 1, 9, 5, 13, 3, 11, 7, 15, 1, 17, 9, 25, 5, 21, 13, 29, 3, 19, 11, 27, 7, 23, 15, 31, 1, 33, 17, 49, 9, 41, 25, 57, 5, 37, 21, 53, 13, 45, 29, 61, 3, 35, 19, 51, 11, 43, 27, 59, 7, 39, 23, 55, 15, 47, 31, 63, 1, 65, 33, 97, 17, 81, 49, 113, 9, 73, 41, 105, 25, 89, 57, 121, 5, 69, 37, 101, 21, 85, 53, 117, 13, 77, 45, 109 ];

    testFixedSeries(imports.bitrev, START);
});

describe('imports.increment() tests', () => {
    test('fails with negative integer argument', () => {
        expect(() => imports.increment(-1)).toThrow();
    });

    test('fails with float argument', () => {
        expect(() => imports.increment(1.5)).toThrow();
    });

    const table: [ number, number[] ][] = [
        [ 0, [] ],
        [ 1, [ 0 ] ],
        [ 3, [ 0, 1, 2 ] ],
        [ 8, [ 0, 1, 2, 3, 4, 5, 6, 7 ] ],
    ];

    test.each(table)('increment(%p,%p)', (len, ret) => {
        expect(imports.increment(len)).toStrictEqual(ret);
    });
});

describe('imports.constant() tests', () => {
    test('fails with negative integer argument', () => {
        expect(() => imports.constant(-1, 1)).toThrow();
    });

    test('fails with float argument', () => {
        expect(() => imports.constant(1.5, 1)).toThrow();
    });

    const table: [ number, number, number[] ][] = [
        [ 0, 1, [] ],
        [ 1, 2, [ 2 ] ],
        [ 2, 3, [ 3, 3 ] ],
        [ 4, 5, [ 5, 5, 5, 5 ] ],
    ];

    test.each(table)('constant(%p,%p)', (len, val, ret) => {
        expect(imports.constant(len, val)).toStrictEqual(ret);
    });
});

describe('imports.linear() tests', () => {
    const errortable: [ string, number, number, number ][] = [
        [ 'length is negative', -1, 1, 1, ],
        [ 'length is a float', 1.5, 1, 1 ],
        [ 'first value is not a number', 2, Infinity, 1 ],
        [ 'last value is not a number', 2, 1, Infinity ],
    ];

    test.each(errortable)('throws when %s', (_, first, last, len) => {
        expect(() => imports.linear(first, last, len)).toThrow();
    });

    const table: [ number, number, number, number[] ][] = [
        [ 2, 1, 1, [ 1, 1 ] ],
        [ 2, 1, 2, [ 1, 2 ] ],
        [ 3, 1, 0, [ 1, 0, 0 ] ],
        [ 3, 0, 1, [ 0, 0, 1 ] ],
        [ 3, 1, 0, [ 1, 0, 0 ] ],
        [ 3, -1, 0, [ -1, -1, 0 ] ],
        [ 11, 10, 25, [ 10, 11, 13, 14, 16, 17, 19, 20, 22, 23, 25 ] ],
    ];

    test.each(table)('linear(%p,%p,%p)', (first, last, len, ret) => {
        expect(imports.linear(first, last, len)).toStrictEqual(ret);
    });
});

describe('imports.step() test', () => {
    const errortable: [ string, number, number, number ][] = [
        [ 'start value is not a number', Infinity, 10, 2 ],
        [ 'stop value is not a number', 0, Infinity, 2 ],
        [ 'step value is not a number', 0, 10, Infinity ],
        [ 'step value is zero', 0, 10, 0 ],
    ];

    test.each(errortable)('throws when %s', (_, first, last, len) => {
        expect(() => imports.step(first, last, len)).toThrow();
    });

    const table: [ number, number, number, number[] ][] = [
        [ 0, 10, 2, [ 0, 2, 4, 6, 8, 10 ] ],
        [ 0, 10, -2, [] ],
        [ 10, 0, -2, [ 10, 8, 6, 4, 2, 0 ] ],
        [ 10, 0, 2, [] ],
        [ 50, 100, 9, [ 50, 59, 68, 77, 86, 95 ] ],
        [ -50, -100, -9, [ -50, -59, -68, -77, -86, -95 ] ],
    ];

    test.each(table)('step(%p,%p,%p)', (start, stop, inc, ret) => {
        expect(imports.step(start, stop, inc)).toStrictEqual(ret);
    });
});

describe('imports.xorshift() tests', () => {
    const SEED1 = undefined;
    const SEED2 = 0x174B92DB;

    const errortable: [ string, number, number, number | undefined ][] = [
        [ 'length is negative', -1, 10, SEED1, ],
        [ 'length is a float', 1.5, 10, SEED1 ],
        [ 'max value is negative', 5, 1.5, SEED1, ],
        [ 'max value is a float', 5, 1.5, SEED1, ],
        [ 'seed is negative', 5, 10, -1 ],
        [ 'seed is a float', 5, 10, 1.5 ],
    ];

    test.each(errortable)('throws when %s', (_, n, max, seed) => {
        expect(() => imports.xorshift(n, max, seed)).toThrow();
    });

    const table: [ number, number, number | undefined, number[] ][] = [
        [ 5, 2, SEED1, [ 0, 0, 1, 0, 0 ] ],
        [ 10, 2, SEED1, [ 0, 0, 1, 0, 0, 0, 1, 0, 0, 1 ] ],
        [ 5, 10, SEED1, [ 6, 8, 9, 2, 0 ] ],
        [ 10, 10, SEED1, [ 6, 8, 9, 2, 0, 0, 9, 8, 0, 3 ] ],
        [ 5, 16, SEED1, [ 6, 8, 1, 10, 12 ] ],
        [ 10, 16, SEED1, [ 6, 8, 1, 10, 12, 14, 11, 2, 0, 3 ] ],
        [ 5, 100, SEED1, [ 46, 88, 69, 22, 80 ] ],
        [ 10, 100, SEED1, [ 46, 88, 69, 22, 80, 70, 19, 58, 20, 43 ] ],
        [ 5, 256, SEED1, [ 198, 40, 241, 202, 28 ] ],
        [ 10, 256, SEED1, [ 198, 40, 241, 202, 28, 158, 43, 18, 0, 19 ] ],
        [ 5, 25600, SEED1, [ 2246, 8488, 9969, 24522, 10780 ] ],
        [ 10, 25600, SEED1, [ 2246, 8488, 9969, 24522, 10780, 13470, 11819, 16658, 17920, 7443 ] ],

        [ 5, 2, SEED2, [ 1, 0, 1, 1, 0 ] ],
        [ 10, 2, SEED2, [ 1, 0, 1, 1, 0, 1, 0, 1, 1, 0 ] ],
        [ 5, 10, SEED2, [ 1, 0, 5, 1, 0 ] ],
        [ 10, 10, SEED2, [ 1, 0, 5, 1, 0, 9, 2, 3, 7, 4 ] ],
        [ 5, 16, SEED2, [ 13, 4, 1, 13, 0 ] ],
        [ 10, 16, SEED2, [ 13, 4, 1, 13, 0, 15, 2, 11, 15, 10 ] ],
        [ 5, 100, SEED2, [ 61, 60, 25, 1, 20 ] ],
        [ 10, 100, SEED2, [ 61, 60, 25, 1, 20, 19, 42, 83, 27, 94 ] ],
        [ 5, 256, SEED2, [ 205, 148, 1, 253, 112 ] ],
        [ 10, 256, SEED2, [ 205, 148, 1, 253, 112, 239, 162, 251, 47, 234 ] ],
        [ 5, 25600, SEED2, [ 461, 7060, 13825, 8701, 23920 ] ],
        [ 10, 25600, SEED2, [ 461, 7060, 13825, 8701, 23920, 14319, 20642, 25083, 14127, 2794 ] ],
    ];

    test.each(table)('xorshift(%p,%p,%p)', (max, len, seed, ret) => {
        expect(imports.xorshift(max, len, seed)).toStrictEqual(ret);
    });
});

describe('imports.sinusoidal() tests', () => {

    const errortable: [ string, number, number, number, number ][] = [
        [ 'length is negative', -1, 4, 0, 360 ],
        [ 'length is a float', 1.5, 4, 0, 360 ],
        [ 'width is not a number', 9, Infinity, 0, 360 ],
        [ 'start is not a number', 9, 4, Infinity, 360 ],
        [ 'stop is not a number', 9, 4, 0, Infinity ],
    ];

    test.each(errortable)('throws when %s', (_, n, width, start, stop) => {
        expect(() => imports.sinusoidal(n, width, start, stop)).toThrow();
    });

    const table: [ number, number, number, number, number[] ][] = [
        [ 2, 1, 0, 0, [ 0, 0 ] ],
        [ 2, 1, 0, 180, [ 0, 0 ] ],
        [ 3, 1, 0, 180, [ 0, 1, 0 ] ],
        [ 5, 1, 0, 360, [ 0, 1, 0, -1, 0 ] ],
        [ 5, 1, 90, 450, [ 1, 0, -1, 0, 1 ] ],
        [ 9, 4, 0, 360, [ 0, 3, 4, 3, 0, -3, -4, -3, 0 ] ],
        [ 9, 4, 45, 225, [ 3, 4, 4, 4, 3, 2, 0, -2, -3 ] ],
        [ 9, 4, 225, 45, [ -3, -2, 0, 2, 3, 4, 4, 4, 3 ] ],
    ];

    test.each(table)('sinusoidal(%p,%p,%p,%p)', (width, len, start, end, ret) => {
        expect(imports.sinusoidal(width, len, start, end)).toStrictEqual(ret);
    });
});

describe('imports.text() tests', () => {
    test('invalid arguments', () => {
        expect(() => imports.text(1 as unknown as string, '1234567890')).toThrow();
        expect(() => imports.text('1234567890', 1 as unknown as string)).toThrow();
    });

    const table: [ string, string | undefined, (number | null)[] ][] = [ 
        [ '', undefined, [] ],
        [ '`Cat{', undefined, [ 2, 0, 19 ] ],
        [ 'I\'m a dog', 'o ', [ 8, 12, null, 0, null, 3, null, 6 ] ]
    ];

    test.each(table)('text(%p,%p)', (text, nulls, ret) => {
        expect(imports.text(text, nulls)).toStrictEqual(ret);
    });
});

describe('imports.func() tests', () => {
    const errortable: [ string, number, (x: number) => number ][] = [
        [ 'passing an invalid function', 1, 55 as unknown as (x: number) => number ],
        [ 'given a negative length', -1, x => x ],
        [ 'given a non-integer length', 0.5, x => x ],
    ];

    test.each(errortable)('throws when %s', (_, fn, num) => {
        expect(() => imports.func(fn, num)).toThrow();
    });

    const table: [ string, number, (x: number) => number, number[] ][] = [
        [ 'zero length', 0, x => x, [] ],
        [ '5 length, mapping to self', 5, x => x, [ 0, 1, 2, 3, 4 ] ],
        [ '5 length, mapping to mod 3', 5, x => x % 3, [ 0, 1, 2, 0, 1 ] ]
    ];

    test.each(table)('%s', (_, fn, num, ret) => {
        expect(imports.func(fn, num)).toStrictEqual(ret);
    });
});
