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

describe('arrays.extractChunksFromArray() tests', () => {
    const errortable: [ string, number[], number, number, number | undefined ][] = [
        [ 'zero size', [ 1, 2, 3 ], 0, 1, undefined ],
        [ 'zero step', [ 1, 2, 3 ], 1, 0, undefined ],
        [ 'non-integer offset', [ 1, 2, 3 ], 1, 1, 0.5 ],
        [ 'offset before start', [ 1, 2, 3 ], 1, 1, -4 ],
    ];

    test.each(errortable)('%s fails', (_, arr, size, step, offset) => {
        expect(() => arrays.extractChunksFromArray(arr, size, step, offset)).toThrow();
    });

    const table: [ string, number[], number, number, number | undefined, number[][], number[][], number[], number[] ][] = [
        [
            'empty array returns empty results',
            [],
            1,
            1,
            undefined,
            [],
            [],
            [],
            [],
        ],
        [
            'size 1 and step 1 returns individual members',
            [ 1, 2, 3, 4, 5 ],
            1,
            1,
            undefined,
            [ [ 1 ], [ 2 ], [ 3 ], [ 4 ], [ 5 ] ],
            [ [], [], [], [], [] ],
            [],
            [],
        ],
        [
            'size 1 and step 1 with explicit offset 0 returns individual members',
            [ 1, 2, 3, 4, 5 ],
            1,
            1,
            0,
            [ [ 1 ], [ 2 ], [ 3 ], [ 4 ], [ 5 ] ],
            [ [], [], [], [], [] ],
            [],
            [],
        ],
        [
            'size 1 and step 1 with negative offset at start returns individual members',
            [ 1, 2, 3, 4, 5 ],
            1,
            1,
            -5,
            [ [ 1 ], [ 2 ], [ 3 ], [ 4 ], [ 5 ] ],
            [ [], [], [], [], [] ],
            [],
            [],
        ],
        [
            'size 1 and step 1 with offset at last member returns only last member',
            [ 1, 2, 3, 4, 5 ],
            1,
            1,
            -1,
            [ [ 5 ] ],
            [ [] ],
            [ 1, 2, 3, 4 ],
            [],
        ],
        [
            'size 1 and step 1 with offset past last member returns empty results',
            [ 1, 2, 3, 4, 5 ],
            1,
            1,
            5,
            [],
            [],
            [ 1, 2, 3, 4, 5 ],
            [],
        ],
        [
            'size 2 and step 1 returns pairs',
            [ 1, 2, 3, 4, 5 ],
            2,
            1,
            undefined,
            [ [ 1, 2 ], [ 2, 3 ], [ 3, 4 ], [ 4, 5 ] ],
            [ [], [], [], [] ],
            [],
            [],
        ],
        [
            'size 5 and step 1 returns one quintet',
            [ 1, 2, 3, 4, 5 ],
            5,
            1,
            undefined,
            [ [ 1, 2, 3, 4, 5 ] ],
            [ [] ],
            [],
            [],
        ],
        [
            'size 6 and step 1 returns only incompletes',
            [ 1, 2, 3, 4, 5 ],
            6,
            1,
            undefined,
            [],
            [],
            [ 1, 2, 3, 4, 5 ],
            [],
        ],
        [
            'size 1 and step 2 returns every second member only',
            [ 1, 2, 3, 4, 5 ],
            1,
            2,
            undefined,
            [ [ 1 ], [ 3 ], [ 5 ] ],
            [ [ 2 ], [ 4 ], [] ],
            [],
            [],
        ],
        [
            'size 2 and step 4, length 8 returns two pairs',
            [ 1, 2, 3, 4, 5, 6, 7, 8 ],
            2,
            4,
            0,
            [ [ 1, 2 ], [ 5, 6 ] ],
            [ [ 3, 4 ], [ 7, 8 ] ],
            [],
            [],
        ],
        [
            'size 2 and step 4, length 9 returns two pairs and one incomplete',
            [ 1, 2, 3, 4, 5, 6, 7, 8, 9 ],
            2,
            4,
            0,
            [ [ 1, 2 ], [ 5, 6 ] ],
            [ [ 3, 4 ], [ 7, 8 ] ],
            [],
            [ 9 ],
        ],
        [
            'size 2 and step 4, length 10 returns three pairs',
            [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ],
            2,
            4,
            0,
            [ [ 1, 2 ], [ 5, 6 ], [ 9, 10 ] ],
            [ [ 3, 4 ], [ 7, 8 ], [] ],
            [],
            [],
        ],
        [
            'size 2 and step 4, length 11 returns three pairs and a leftover',
            [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11 ],
            2,
            4,
            0,
            [ [ 1, 2 ], [ 5, 6 ], [ 9, 10 ] ],
            [ [ 3, 4 ], [ 7, 8 ], [ 11 ] ],
            [],
            [],
        ],
        [
            'size 3 and step 2 returns two triplets and one incomplete',
            [ 1, 2, 3, 4, 5 ],
            3,
            2,
            undefined,
            [ [ 1, 2, 3 ], [ 3, 4, 5 ] ],
            [ [], [] ],
            [],
            [],
        ],
        [
            'size 3 and step 2 with offset 1 returns one triplet and one incomplete',
            [ 1, 2, 3, 4, 5 ],
            3,
            2,
            1,
            [ [ 2, 3, 4 ] ],
            [ [] ],
            [ 1 ],
            [ 5 ],
        ],
    ];

    test.each(table)('%s', (_, arr, size, step, offset, exchunks, exrest, exhead, extail) => {
        const [ chunks, rest, head, tail ] = arrays.extractChunksFromArray(arr, size, step, offset);

        expect(chunks).toStrictEqual(exchunks);
        expect(rest).toStrictEqual(exrest);
        expect(head).toStrictEqual(exhead);
        expect(tail).toStrictEqual(extail);
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