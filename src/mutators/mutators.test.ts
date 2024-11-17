import type { ScaleDefinition, GamutOpts } from '../types';

import * as mutators from './mutators';

describe('pitch.getScale() tests', () => {
    const errortable: [ string, string | number[] ][] = [
        [ 'invalid scale name', 'invalid' ],
        [ 'empty array', [] ],
        [ 'array contains non-numeric value', [ 1, '4', 9, 16 ] as unknown as number[] ]
    ];

    test.each(errortable)('fails when %s', (_, scale) => {
        expect(() => mutators.getScale(scale)).toThrow();
    });

    const table: [ string | number[], number[] ][] = [
        [ [ 0, 2, 4, 6, 8, 10 ], [ 0, 2, 4, 6, 8, 10 ] ],
        [ 'chromatic', [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11 ] ],
        [ 'major', [ 0, 2, 4, 5, 7, 9, 11 ] ],
        [ 'lydian', [ 0, 2, 4, 6, 7, 9, 11 ] ],
    ];

    test.each(table)('getScale(%j) is %j', (scale, ret) => {
        expect(mutators.getScale(scale)).toStrictEqual(ret);
    });
});

describe('mutators.invertFn() tests', () => {
    test('throws an error if the argument is not a number', () => {
        expect(() => mutators.invertFn('555' as unknown as number)).toThrow();
    });

    const table = [
        [ 5, 10, 15 ],
        [ 3, 0, -3 ],
        [ 6, -0.25, -6.5 ],
        [ 8, 8, 8 ]
    ];

    test.each(table)('should invert correctly: test %#', (n: number, around: number, ret: number) => {
        expect(mutators.invertFn(around)(n)).toEqual(ret);
    });
});

describe('mutators.transposeFn() tests', () => {
    test('throws an error if the argument is not a number', () => {
        expect(() => mutators.transposeFn('555' as unknown as number)).toThrow();
    });

    const table = [
        [ 5, 0, 5 ],
        [ 3, -10, -7 ],
        [ 6, 0.25, 6.25 ]
    ];

    test.each(table)('should transpose correctly: test %#', (n: number, delta: number, ret: number) => {
        expect(mutators.transposeFn(delta)(n)).toEqual(ret);
    });
});

describe('mutators.augmentFn() tests', () => {
    test('throws an error if the argument is not a number', () => {
        expect(() => mutators.augmentFn('555' as unknown as number)).toThrow();
    });

    const table = [
        [ 5, 0, 0 ],
        [ -12.3, 0.5, -6.15  ],
        [ 0, 10, 0 ],
        [ 16, -4, -64 ]
    ];

    test.each(table)('should augment correctly: test %#', (n: number, mult: number, ret: number) => {
        expect(mutators.augmentFn(mult)(n)).toEqual(ret);
    });
});

describe('mutators.diminish() tests', () => {
    test('throws an error if the argument is not a number', () => {
        expect(() => mutators.diminishFn('555' as unknown as number)).toThrow();
    });

    const table = [
        [ 5, 0, Infinity ],
        [ -12.3, 0.5, -24.6 ],
        [ 0, 10, 0 ],
        [ 16, -4, -4 ]
    ];

    test.each(table)('should diminish correctly: test %#', (n: number, mult: number, ret: number) => {
        expect(mutators.diminishFn(mult)(n)).toEqual(ret);
    });
});

describe('mutators.modFn() tests', () => {
    test('throws an error if the argument is not a number', () => {
        expect(() => mutators.modFn('555' as unknown as number)).toThrow();
    });

    test('throws an error if the argument is not a positive number', () => {
        expect(() => mutators.modFn(0)).toThrow();
    });

    const table = [
        [ 31, 5, 1 ],
        [ -10, 8, 6 ],
        [ 5, 3.5, 1.5 ],
        [ 11.6, 4.2, 3.2 ]
    ];

    test.each(table)('should mod correctly: test %#', (n: number, modFn: number, ret: number) => {
        expect(mutators.modFn(modFn)(n)).toBeCloseTo(ret);
    });
});

describe('mutators.trimFn() tests', () => {
    test('throws an error if the first argument is not a number', () => {
        expect(() => mutators.trimFn('555' as unknown as number, 100)).toThrow();
    });

    test('throws an error if the second argument is not a number', () => {
        expect(() => mutators.trimFn(100, '555' as unknown as number)).toThrow();
    });

    test('throws an error if the first argument is higher than the second', () => {
        expect(() => mutators.trimFn(555, 100)).toThrow();
    });

    const table: [ number, number | null | undefined, number | null | undefined, number][] = [
        [ 5, null, null, 5 ],
        [ 5, null, 10, 5 ],
        [ 5, undefined, 10, 5 ],
        [ 15, null, 10, 10 ],
        [ -5, 0, null, 0 ],
        [ -5, 0, undefined, 0 ],
        [ 5, 0, null, 5 ],
        [ -5, 0, 10, 0 ],
        [ 5, 0, 10, 5 ],
        [ 15, 0, 10, 10 ],
    ];

    test.each(table)('should trim correctly: test %#', (n: number, min: number | null | undefined, max: number | null | undefined, ret: number) => {
        expect(mutators.trimFn(min, max)(n)).toEqual(ret);
    });
});

describe('mutators.bounceFn() tests', () => {
    test('throws an error if the first argument is not a number', () => {
        expect(() => mutators.bounceFn('555' as unknown as number, 100)).toThrow();
    });

    test('throws an error if the second argument is not a number', () => {
        expect(() => mutators.bounceFn(100, '555' as unknown as number)).toThrow();
    });

    test('throws an error if the first argument is higher than the second', () => {
        expect(() => mutators.bounceFn(555, 100)).toThrow();
    });

    const table: [ number, number | null | undefined, number | null | undefined, number][] = [
        [ 10, null, null, 10 ],
        [ 10, 13, null, 16 ],
        [ 20, 13, null, 20 ],
        [ 20, 13, undefined, 20 ],
        [ 10, null, 19, 10 ],
        [ 20, null, 19, 18 ],
        [ 20, undefined, 19, 18 ],
        [ 0, 13, 19, 14 ],
        [ 5, 13, 19, 17 ],
        [ 10, 13, 19, 16 ],
        [ 15, 13, 19, 15 ],
        [ 20, 13, 19, 18 ],
        [ 25, 13, 19, 13 ],
        [ 30, 13, 19, 18 ],
        [ 35, 13, 19, 15 ],
    ];

    test.each(table)('should bounce correctly: test %#', (n: number, min: number | null | undefined, max: number | null | undefined, ret: number) => {
        expect(mutators.bounceFn(min, max)(n)).toEqual(ret);
    });
});

describe('mutators.scaleFn() tests', () => {
    const errortable: [ string, ScaleDefinition, number, number ][] = [
        [ 'throws an error if the first argument is of an invalid type', {} as unknown as ScaleDefinition, 0, 12 ],
        [ 'throws an error if the first argument is an empty array', [], 0, 12 ],
        [ 'throws an error if the first argument contains values that are not finite numbers', [ 1, 5, Infinity ], 0, 12 ],
        [ 'throws an error if the first argument is a non-existent scale name', 'absolutely not', Infinity, 12 ],
        [ 'throws an error if zero is not a finite number', 'lydian', Infinity, 12 ],
        [ 'throws an error if octave is not a finite number', 'lydian', 0, Infinity ],
    ];

    test.each(errortable)('%s', (_: string, scale: ScaleDefinition, zero, octave) => {
        expect(() => mutators.scaleFn(scale, zero, octave)).toThrow();
    });

    const table: [ number, ScaleDefinition, number, number | undefined, number ][] = [
        [ -8, 'lydian', 0, undefined, -13 ],
        [ 0, 'lydian', 0, undefined, 0 ],
        [ 8, 'lydian', 0, undefined, 14 ],
        [ -8, 'lydian', 10, undefined, -3 ],
        [ 0, 'lydian', 10, undefined, 10 ],
        [ 8, 'lydian', 10, undefined, 24 ],
        [ -5, [ 0, 2, 4.5, 6, 8, 10 ], 0, undefined, -10 ],
        [ -8, [ 0, 2, 4.5, 6, 8, 10 ], 0, undefined, -16 ],
        [ 5, [ 0, 2, 4.5, 6, 8, 10 ], 0, undefined, 10 ],
        [ 8, [ 0, 2, 4.5, 6, 8, 10 ], 0, undefined, 16.5 ],
        [ -5, [ 0, 2, 4.5, 6, 8, 10 ], 0, 8, -6 ],
        [ -8, [ 0, 2, 4.5, 6, 8, 10 ], 0, 8, -8 ],
        [ 5, [ 0, 2, 4.5, 6, 8, 10 ], 0, 8, 10 ],
        [ 8, [ 0, 2, 4.5, 6, 8, 10 ], 0, 8, 12.5 ],
        [ -5, [ 0, 2, 4.5, 6, 8, 10 ], 0, 18, -16 ],
        [ -8, [ 0, 2, 4.5, 6, 8, 10 ], 0, 18, -28 ],
        [ 5, [ 0, 2, 4.5, 6, 8, 10 ], 0, 18, 10 ],
        [ 8, [ 0, 2, 4.5, 6, 8, 10 ], 0, 18, 22.5 ],
        [ -5, [ 0, 2, 4.5, 6, 8, 10 ], -10.5, 18, -26.5 ],
        [ -8, [ 0, 2, 4.5, 6, 8, 10 ], -10.5, 18, -38.5 ],
        [ 5, [ 0, 2, 4.5, 6, 8, 10 ], -10.5, 18, -0.5 ],
        [ 8, [ 0, 2, 4.5, 6, 8, 10 ], -10.5, 18, 12 ],
    ];

    test.each(table)('should apply a scale correctly: test %#', (n: number, scale: ScaleDefinition, zero: number, octave: number | undefined, ret: number) => {
        expect(mutators.scaleFn(scale, zero, octave)(n)).toEqual(ret);
    });
});

describe('mutators.gamutFn() tests', () => {
    const errortable: [ string, number[], GamutOpts ][] = [
        [ 'throws an error if the first argument is not an array', 555 as unknown as number[], {} ],
        [ 'throws an error if the first argument is an empty array', [], {} ],
        [ 'throws an error if the first argument contains invalid values', [ 1, 5, Infinity ], {} ],
        [ 'throws an error if the second argument is not an object', [ 1, 5, 2 ], 555 as unknown as GamutOpts ],
        [ 'throws an error if the second argument is null', [ 1, 5, 2 ], null as unknown as GamutOpts ],
        [ 'throws an error if zero option is set and not in gamutFn', [ 1, 5, 2 ], { zero: 3 }, ],
        [ 'throws an error if lowVal option is not a finite number', [ 1, 5, 2 ], { lowVal: Infinity } ],
        [ 'throws an error if highVal option is not a finite number', [ 1, 5, 2 ], { highVal: Infinity } ],
    ];

    test.each(errortable)('%s', (_: string, gamut: number[], opts: GamutOpts) => {
        expect(() => mutators.gamutFn(gamut, opts)).toThrow();
    });

    test('should fail for non-integer mutatorses', () => {
        expect(() => mutators.gamutFn([ 1, 2, 3 ])(0.5)).toThrow();
    });

    const table: [ number, number[], GamutOpts | undefined, number | null][] = [
        [ -101, [ 1, 5, 2, 6 ], undefined, 6 ],
        [ -1, [ 1, 5, 2, 6 ], undefined, 6 ],
        [ 0, [ 1, 5, 2, 6 ], undefined, 1 ],
        [ 3, [ 1, 5, 2, 6 ], undefined, 6 ],
        [ 4, [ 1, 5, 2, 6 ], undefined, 1 ],
        [ 104, [ 1, 5, 2, 6 ], undefined, 1 ],
        [ -1, [ 1, 5, 2, 6 ], {}, 6 ],
        [ 0, [ 1, 5, 2, 6 ], {}, 1 ],
        [ 3, [ 1, 5, 2, 6 ], {}, 6 ],
        [ 4, [ 1, 5, 2, 6 ], {}, 1 ],
        [ -2, [ 1, 5, 2, 6 ], { zero: 5 }, 6 ],
        [ -1, [ 1, 5, 2, 6 ], { zero: 5 }, 1 ],
        [ 2, [ 1, 5, 2, 6 ], { zero: 5 }, 6 ],
        [ 3, [ 1, 5, 2, 6 ], { zero: 5 }, 1 ],
        [ -1, [ 1, 5, 2, 6 ], { lowVal: -5 }, -5 ],
        [ 0, [ 1, 5, 2, 6 ], { lowVal: -5 }, 1 ],
        [ 3, [ 1, 5, 2, 6 ], { lowVal: -5 }, 6 ],
        [ 4, [ 1, 5, 2, 6 ], { lowVal: -5 }, 1 ],
        [ -1, [ 1, 5, 2, 6 ], { lowVal: null }, null ],
        [ -1, [ 1, 5, 2, 6 ], { highVal: 15 }, 6 ],
        [ 0, [ 1, 5, 2, 6 ], { highVal: 15 }, 1 ],
        [ 3, [ 1, 5, 2, 6 ], { highVal: 15 }, 6 ],
        [ 4, [ 1, 5, 2, 6 ], { highVal: 15 }, 15 ],
        [ 4, [ 1, 5, 2, 6 ], { highVal: null }, null ],
        [ -2, [ 1, 5, 2, 6 ], { zero: 5, lowVal: -5, highVal: 15 }, -5 ],
        [ -1, [ 1, 5, 2, 6 ], { zero: 5, lowVal: -5, highVal: 15 }, 1 ],
        [ 2, [ 1, 5, 2, 6 ], { zero: 5, lowVal: -5, highVal: 15 }, 6 ],
        [ 3, [ 1, 5, 2, 6 ], { zero: 5, lowVal: -5, highVal: 15 }, 15 ],
    ];

    test.each(table)('should correctly apply gamut %#', (n: number, gamut: number[], opts: GamutOpts | undefined, ret: number | null) => {
        expect(mutators.gamutFn(gamut, opts)(n)).toEqual(ret);
    });
});