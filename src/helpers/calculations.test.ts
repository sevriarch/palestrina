import * as calculations from './calculations';

describe('calculations.sum()', () => {
    const table: [ (null | number)[], number ][] = [
        [ [], 0 ],
        [ [ null ], 0 ],
        [ [ 1 ], 1 ],
        [ [ 2, -3, 4, 0 ], 3 ],
        [ [ null, -5, -6, null, 7 ], -4 ]
    ];

    test.each(table)('sum(%j) is %j', (v, ret) => {
        expect(calculations.sum(v)).toEqual(ret);
    });
});

describe('calculations.min() tests', () => {
    const table: [ (null | number)[], null | number ][] = [
        [ [], null ],
        [ [ null ], null ],
        [ [ 5 ], 5 ],
        [ [ 1, 2, 3, 4 ], 1 ],
        [ [ 0, -1, 6, -1, 2 ], -1 ],
        [ [ 3, null, 4, 3, 2 ], 2 ],
        [ [ null, -1, -2, null ], -2 ],
        [ [ 5, 4, 3, 0 ], 0 ]
    ];

    test.each(table)('min(%j) is %j', (v, ret) => {
        expect(calculations.min(v)).toBe(ret);
    });
});

describe('calculations.max() tests', () => {
    const table: [ (null | number)[], null | number ][] = [
        [ [], null ],
        [ [ null ], null ],
        [ [ 5 ], 5 ],
        [ [ 1, 2, 3, 4 ], 4 ],
        [ [ 0, -1, 6, -1, 2 ], 6 ],
        [ [ 3, null ,4 ,3, 2 ], 4 ],
        [ [ null, -1, -2, null ], -1 ],
        [ [ 5, 4, 3, 0 ], 5 ]
    ];

    test.each(table)('max(%j) is %j', (v, ret) => {
        expect(calculations.max(v)).toBe(ret);
    });
});

describe('calculations.crossSum() tests', () => {
    const table: [ number[], number[], number[][] ][] = [
        [ [], [], [] ],
        [ [ 1 ], [], [ [] ] ],
        [ [], [ 1 ], [] ],
        [ [ 1 ], [ 1 ], [ [ 2 ] ] ],
        [ [ 1, 2, 3 ], [ 1 ], [ [ 2 ], [ 3 ], [ 4 ] ] ],
        [ [ 1 ], [ 1, 2, 3 ], [ [ 2, 3, 4 ] ] ],
        [ [ 1, 4, 7, 10 ], [ 2, 3, 4, 5 ], [ [ 3, 4, 5, 6 ], [ 6, 7, 8, 9 ], [ 9, 10, 11, 12 ], [ 12, 13, 14, 15 ] ] ]
    ];

    test.each(table)('crossSum(%j,%j) should be %j', (l1, l2, ret) => {
        expect(calculations.crossSum(l1, l2)).toStrictEqual(ret);
    });
});

describe('calculations.flatCrossSum() tests', () => {
    const table: [ number[], number[], number[] ][] = [
        [ [], [], [] ],
        [ [ 1 ], [], [] ],
        [ [], [ 1 ], [] ],
        [ [ 1 ], [ 1 ], [ 2 ] ],
        [ [ 1, 2, 3 ], [ 1 ], [ 2, 3, 4 ] ],
        [ [ 1 ], [ 1, 2, 3 ], [ 2, 3, 4 ] ],
        [ [ 1, 4, 7, 10 ], [ 2, 3, 4, 5 ], [ 3, 4, 5, 6, 6, 7, 8, 9, 9, 10, 11, 12, 12, 13, 14, 15 ] ]
    ];

    test.each(table)('flatCrossSum(%j,%j) should be %j', (l1, l2, ret) => {
        expect(calculations.flatCrossSum(l1, l2)).toStrictEqual(ret);
    });
});

describe('calculations.noteToFreq()/.freqToNote()', () => {
    const table: [ number, number ][] = [
        [ 21, 27.5 ],
        [ 29, 43.654 ],
        [ 45, 110.00 ],
        [ 58, 233.08 ],
        [ 69, 440.00 ],
        [ 75, 622.25 ],
        [ 93, 1760.0 ],
        [ 108, 4186.01 ],
    ];

    test.each(table)('noteToFreq(%p) ~= %p', (note, freq) => {
        expect(calculations.noteToFreq(note)).toBeCloseTo(freq, 2);
    });

    test.each(table)('freqToNote(%p) ~= %p', (note, freq) => {
        expect(calculations.freqToNote(freq)).toBeCloseTo(note, 3);
    });
});