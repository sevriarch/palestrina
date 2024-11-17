import * as validation from './validation';

describe('validation.isNumber() tests', () => {
    const table: [ unknown, boolean ][] = [
        [ null, false ],
        [ 0, true ],
        [ 1, true ],
        [ -1, true ],
        [ 1.1, true ],
        [ '0', false ],
        [ [ 1 ], false ],
        [ NaN, false ],
        [ Infinity, false ],
        [ -Infinity, false ],
        [ { a: 1 }, false ]
    ];

    test.each(table)('isNumber(%j) is %j', (v, ret) => {
        expect(validation.isNumber(v)).toEqual(ret);
    });
});

describe('validation.isNonNegNumber() tests', () => {
    const table: [ unknown, boolean ][] = [
        [ null, false ],
        [ 0, true ],
        [ 0.1, true ],
        [ -0.1, false ],
        [ '0.1', false ],
        [ [ 1 ], false ],
        [ NaN, false ],
        [ Infinity, false ],
        [ -Infinity, false ],
        [ { a: 1 }, false ]
    ];

    test.each(table)('isNonNegNumber(%j) is %j', (v, ret) => {
        expect(validation.isNonNegNumber(v)).toEqual(ret);
    });
});

describe('validation.isPosNumber() tests', () => {
    const table: [ unknown, boolean ][] = [
        [ null, false ],
        [ 0, false ],
        [ 0.1, true ],
        [ -0.1, false ],
        [ '0.1', false ],
        [ [ 1 ], false ],
        [ NaN, false ],
        [ Infinity, false ],
        [ -Infinity, false ],
        [ { a: 1 }, false ]
    ];

    test.each(table)('isPosNumber(%j) is %j', (v, ret) => {
        expect(validation.isPosNumber(v)).toEqual(ret);
    });
});

describe('validation.isInt() tests', () => {
    const table: [ unknown, boolean ][] = [
        [ null, false ],
        [ 0, true ],
        [ 1, true ],
        [ -1, true ],
        [ 1.1, false ],
        [ '0', false ],
        [ [ 1 ], false ],
        [ NaN, false ],
        [ Infinity, false ],
        [ -Infinity, false ],
        [ { a: 1 }, false ]
    ];

    test.each(table)('isInt(%j) is %j', (v, ret) => {
        expect(validation.isInt(v)).toEqual(ret);
    });
});

describe('validation.isPosInt() tests', () => {
    const table: [ unknown, boolean ][] = [
        [ null, false ],
        [ 0, false ],
        [ 1, true ],
        [ -1, false ],
        [ 1.1, false ],
        [ '0', false ],
        [ NaN, false ],
        [ Infinity, false ],
        [ -Infinity, false ],
        [ [ 1 ], false ],
        [ { a: 1 }, false ]
    ];

    test.each(table)('isPosInt(%j) is %j', (v, ret) => {
        expect(validation.isPosInt(v)).toEqual(ret);
    });
});

describe('validation.isNonnegInt() tests', () => {
    const table: [ unknown, boolean ][] = [
        [ null, false ],
        [ 0, true ],
        [ 1, true ],
        [ -1, false ],
        [ 1.1, false ],
        [ '0', false ],
        [ NaN, false ],
        [ Infinity, false ],
        [ -Infinity, false ],
        [ [ 1 ], false ],
        [ { a: 1 }, false ]
    ];

    test.each(table)('isNonnegInt(%j) is %j', (v, ret) => {
        expect(validation.isNonnegInt(v)).toEqual(ret);
    });
});

describe('validation.isIntBetween() tests', () => {
    const table: [ unknown, number, number, boolean ][] = [
        [ null, -10, 10, false ],
        [ 1.1, -10, 10, false ],
        [ '0', -10, 10, false ],
        [ NaN, -10, 10, false ],
        [ Infinity, -10, 10, false ],
        [ -Infinity, -10, 10, false ],
        [ [ 1 ], -10, 10, false ],
        [ { a: 1 }, -10, 10, false ],
        [ 10, -10, 10, true ],
        [ 11, -10, 10, false ],
        [ -5, -5, 5, true ],
        [ -6, -5, 5, false ],
    ];

    test.each(table)('isIntBetween(%j,%j,%j) is %j', (v, min, max, ret) => {
        expect(validation.isIntBetween(v, min, max)).toEqual(ret);
    });
});

describe('validation.isNBitInt() tests', () => {
    const table: [ unknown, number, boolean ][] = [
        [ 0x00, 1, true ],
        [ 0x01, 1, true ],
        [ 0x02, 1, false ],
        [ 0x7f, 7, true ],
        [ 0x80, 7, false ],
        [ 0xffff, 16, true ],
        [ 0x010000, 16, false ],
        [ 0x0fffffff, 28, true ],
        [ 0x10000000, 28, false ],
        [ -1, 7, false ],
        [ 1.1, 7, false ],
        [ null, 7, false ],
        [ '0', 7, false ],
        [ NaN, 7, false ],
        [ Infinity, 7, false ],
    ];

    test.each(table)('%j being a %j-bit int is %j', (v, bits, ret) => {
        expect(validation.isNBitInt(v, bits)).toEqual(ret);
    });
});

describe('validation.is7BitInt() tests', () => {
    const table: [ unknown, boolean ][] = [
        [ null, false ],
        [ 0, true ],
        [ 1, true ],
        [ -1, false ],
        [ 1.1, false ],
        [ 127, true ],
        [ 128, false ],
        [ '0', false ],
        [ NaN, false ],
        [ Infinity, false ],
        [ -Infinity, false ],
        [ [ 1 ], false ],
        [ { a: 1 }, false ]
    ];

    test.each(table)('is7BitInt(%j) is %j', (v, ret) => {
        expect(validation.is7BitInt(v)).toEqual(ret);
    });
});

describe('validation.isMidiChannel()', () => {
    const table: [ number, boolean ][] = [
        [ 0, false ],
        [ 1, true ],
        [ 16, true ],
        [ 17, false ],
        [ 1.5, false ],
    ];

    test.each(table)('isMidiChannel(%p) is %p', (v, ret) => {
        expect(validation.isMidiChannel(v)).toBe(ret);
    });
});

describe('validation.invalidKeys() tests', () => {
    test('returns keys not in set', () => {
        expect(validation.invalidKeys({ foo: 55, gazonk: 66 }, new Set([ 'foo', 'bar' ]))).toStrictEqual([ 'gazonk' ]);
    });

    test('returns empty if object only contains values in set', () => {
        expect(validation.invalidKeys({ foo: 55, bar: 55 }, new Set([ 'foo', 'bar', 'gazonk' ]))).toStrictEqual([]);
    });
});

describe('validation.validateArray() tests', () => {
    test('throws if second argument is not a function', () => {
        expect(() => validation.validateArray([ 1, 2, 3 ], 55 as unknown as (val: number) => boolean)).toThrow();
    });

    test('returns an empty array for an empty array', () => {
        expect(validation.validateArray([], () => true)).toStrictEqual([]);
    });

    test('return indices and members that failed', () => {
        expect(validation.validateArray([ 1, 2, 3, 4, 5 ], v => v % 2 === 1)).toStrictEqual([ [ 1, 2 ], [ 3, 4 ] ]);
    });

    test('can use index in the validation indices and members that failed', () => {
        expect(validation.validateArray([ 5, 4, 3, 2, 1 ], (v, i) => v < i)).toStrictEqual([ [ 0, 5 ], [ 1, 4 ], [ 2, 3 ] ]);
    });
});