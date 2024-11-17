import * as arrays from './arrays';

describe('arrays.dedupe() tests', () => {
    const ob = { a: 1 };
    const table: [ string, unknown[], unknown[] ][] = [
        [ 'empty array returns itself', [], [] ],
        [ 'duplicate numbers are removed', [ 1, 2, 1, 3, 3, 2, 3, 4 ], [ 1, 2, 3, 4 ] ],
        [ 'deep equal but different objects are not removed', [ 'foo', 'foo', ob, ob, 1, { a: 1 } ], [ 'foo', ob, 1, { a: 1 } ] ],
    ];

    test.each(table)('%s', (_, arr, ret) => {
        expect(arrays.dedupe(arr)).toStrictEqual(ret);
    });
});

describe('arrays.zip() tests', () => {
    const errortable = [
        [ [ 1 ], [] ],
        [ [ 2, 2 ], [ 2 ], [ 3 ], [ 3 ] ],
        [ [ 2 ], [ 2 ], [ 3 ], [ 3, 3 ] ],
    ];

    test.each(errortable)('fails when lengths inconsistent (%#)', (...arr) => {
        expect(() => arrays.zip(...arr)).toThrow();
    });

    const table: [ unknown[][], unknown[][] ][] = [
        [
            [],
            []
        ],
        [
            [ [ 1, 2, 3, 4 ] ],
            [ [ 1 ], [ 2 ], [ 3 ], [ 4 ] ]
        ],
        [
            [ [ 1 ], [ 2 ], [ 3 ], [ 4 ] ],
            [ [ 1, 2, 3, 4 ] ]
        ],
        [
            [ [], [], [] ],
            []
        ],
        [
            [ [ 1, 2, 3 ], [ 4, 5, 6 ] ],
            [ [ 1, 4, ], [ 2, 5 ], [ 3, 6 ] ]
        ],
        [
            [ [ 1, 4 ], [ 2, 5 ], [ 3, 6 ] ],
            [ [ 1, 2, 3 ], [ 4, 5, 6 ] ]
        ]
    ];

    test.each(table)('zip(%j) to be %j', (arr, ret) => {
        expect(arrays.zip(...arr)).toStrictEqual(ret);
    });
});

describe('arrays.arrayToWindows() tests', () => {
    const errortable: [ number[], number, number ][] = [
        [ [ 1, 2, 3 ], 0, 1 ],
        [ [ 1, 2, 3 ], 1, 0 ],
    ];

    test.each(errortable)('invalid arguments(%j) fail', (arr, size, step) => {
        expect(() => arrays.arrayToWindows(arr, size, step)).toThrow();
    });

    const table: [ number[], number, number, number[][], number[][] ][] = [
        [ [], 1, 1, [], [] ],
        [
            [ 1, 2, 3, 4, 5 ],
            1,
            1,
            [ [ 1 ], [ 2 ], [ 3 ], [ 4 ], [ 5 ] ],
            []
        ],
        [
            [ 1, 2, 3, 4, 5 ],
            2,
            1,
            [ [ 1, 2 ], [ 2, 3 ], [ 3, 4 ], [ 4, 5 ] ],
            [ [ 5 ] ]
        ],
        [
            [ 1, 2, 3, 4, 5 ],
            3,
            1,
            [ [ 1, 2, 3 ], [ 2, 3, 4 ], [ 3, 4, 5 ] ],
            [ [ 4, 5 ], [ 5 ] ]
        ],
        [
            [ 1, 2, 3, 4, 5 ],
            4,
            1,
            [ [ 1, 2, 3, 4 ], [ 2, 3, 4, 5 ] ],
            [ [ 3, 4, 5 ], [ 4, 5 ], [ 5 ] ]
        ],
        [
            [ 1, 2, 3, 4, 5 ],
            5,
            1,
            [ [ 1, 2, 3, 4, 5 ] ],
            [ [ 2, 3, 4, 5 ], [ 3, 4, 5 ], [ 4, 5 ], [ 5 ] ]
        ],
        [
            [ 1, 2, 3, 4, 5 ],
            6,
            1,
            [],
            [ [ 1, 2, 3, 4, 5 ], [ 2, 3, 4, 5 ], [ 3, 4, 5 ], [ 4, 5 ], [ 5 ] ]
        ],
        [
            [ 1, 2, 3, 4, 5 ],
            1,
            2,
            [ [ 1 ], [ 3 ], [ 5 ] ],
            []
        ],
        [
            [ 1, 2, 3, 4, 5 ],
            2,
            2,
            [ [ 1, 2 ], [ 3, 4 ] ],
            [ [ 5 ] ]
        ],
        [
            [ 1, 2, 3, 4, 5 ],
            3,
            2,
            [ [ 1, 2, 3 ], [ 3, 4, 5 ] ],
            [ [ 5 ] ]
        ],
        [
            [ 1, 2, 3, 4, 5 ],
            4,
            2,
            [ [ 1, 2, 3, 4 ] ],
            [ [ 3, 4, 5 ], [ 5 ] ]
        ],
        [
            [ 1, 2, 3, 4, 5 ],
            5,
            2,
            [ [ 1, 2, 3, 4, 5 ] ],
            [ [ 3, 4, 5 ], [ 5 ] ]
        ],
        [
            [ 1, 2, 3, 4, 5 ],
            6,
            2,
            [],
            [ [ 1, 2, 3, 4, 5 ], [ 3, 4, 5 ], [ 5 ] ]
        ],
        [
            [ 1, 2, 3, 4, 5 ],
            1,
            3,
            [ [ 1 ], [ 4 ] ],
            []
        ],
        [
            [ 1, 2, 3, 4, 5 ],
            1,
            4,
            [ [ 1 ], [ 5 ] ],
            []
        ],
        [
            [ 1, 2, 3, 4, 5 ],
            1,
            5,
            [ [ 1 ] ],
            []
        ],
        [
            [ 1, 2, 3, 4, 5 ],
            1,
            6,
            [ [ 1 ] ],
            []
        ],
    ];

    test.each(table)('arrayToWindows(%j,%j,%j) to be [%j,%j]', (arr, size, step, exfull, exrest) => {
        const [ full, rest ] = arrays.arrayToWindows(arr, size, step);

        expect(full).toStrictEqual(exfull);
        expect(rest).toStrictEqual(exrest);
    });
});

describe('arrays.arraySubtract() tests', () => {
    test('throws if first value is not an array', () => {
        expect(() => arrays.arraySubtract(5 as unknown as number[], [])).toThrow();
    });

    test('throws if second value is not an array', () => {
        expect(() => arrays.arraySubtract([], 5 as unknown as number[])).toThrow();
    });

    test('both arrays empty', () => {
        expect(arrays.arraySubtract([], [])).toStrictEqual([]);
    });

    test('first array empty', () => {
        expect(arrays.arraySubtract([], [ 2, 5, 0, 8 ])).toStrictEqual([]);
    });

    test('second array empty', () => {
        expect(arrays.arraySubtract([ 1, 3, 4, 7 ], [])).toStrictEqual([ 1, 3, 4, 7 ]);
    });

    test('second array contains members not in first', () => {
        expect(arrays.arraySubtract([ 1, 3, 4, 7 ], [ 2, 5, 0, 8 ])).toStrictEqual([ 1, 3, 4, 7 ]);
    });

    test('removes only first instance of a value', () => {
        expect(arrays.arraySubtract([ 2, 1, 4, 1, 5 ], [ 1 ])).toStrictEqual([ 2, 4, 1, 5 ]);
    });

    test('removes both instances of a value', () => {
        expect(arrays.arraySubtract([ 2, 1, 4, 1, 5 ], [ 1, 1 ])).toStrictEqual([ 2, 4, 5 ]);
    });

    test('removes both instances of a value', () => {
        expect(arrays.arraySubtract([ 2, 1, 4, 1, 5 ], [ 1, 1, 1 ])).toStrictEqual([ 2, 4, 5 ]);
    });

    test('removes entire array', () => {
        expect(arrays.arraySubtract([ 2, 1, 4, 1, 5 ], [ 1, 4, 3, 2, 5, 1, 6 ])).toStrictEqual([]);
    });
});

describe('arrays.sanitizeToArray() tests', () => {
    test('returns passed value when an array', () => {
        const arr = [ 1, 5 ];

        expect(arrays.sanitizeToArray(arr)).toBe(arr);
    });

    test('returns array when passed a primitive', () => {
        expect(arrays.sanitizeToArray(1)).toStrictEqual([ 1 ]);
    });

    test('returns array containing passed object', () => {
        const ob = { a: 1, b: [ 2, 3 ] };
        const ret = arrays.sanitizeToArray(ob);

        expect(ret).toStrictEqual([ ob ]);
        expect(ret[0]).toBe(ob);
    });
});