import type { SeqIndices, MapperFn, FlatMapperFn, FilterFn, FinderFn, GrouperFn, CtrlTypeFn, CtrlBoolFn, Replacer } from '../types';

import Collection from './without-metadata';

import { intseq } from '../factory';

import type NumSeq from '../sequences/number';

describe('Collection.toString()', () => {
    class C1 extends Collection<unknown> {}

    test('returns as expected', () => {
        expect(new Collection([ 1, 3, 5 ]).toString()).toEqual('Collection(length=3)([0: 1,1: 3,2: 5,])');
    });

    test('More complex derived class returns as expected', () => {
        expect(new C1([ {a:1,b:[2,3]}, 'foo', null, true ]).toString()).toEqual('C1(length=4)([0: {"a":1,"b":[2,3]},1: "foo",2: null,3: true,])');
    });
});

describe('Collection.index()', () => {
    const c0 = new Collection([]);
    const c3 = new Collection([ 1, 2, 3 ]);

    const errortable: [ string, Collection<never> | Collection<number>, number ][] = [
        [ 'empty collection, index 0 errors', c0, 0 ],
        [ 'empty collection, index 1 errors', c0, 1 ],
        [ 'empty collection, index -1 errors', c0, -1 ],
        [ 'after last member of collection errors', c3, 3 ],
        [ 'before first member of collection errors', c3, -4 ],
        [ 'non-integer index errors', c3, 1.5 ],
    ];

    test.each(errortable)('%s', (_, c, ix) => {
        expect(() => c.index(ix)).toThrow();
    });

    const table: [ string, Collection<number>, number, number ][] = [
        [ 'first member of collection', c3, 0, 0 ],
        [ 'first member of collection, negative index', c3, -3, 0 ],
        [ 'last member of collection', c3, 2, 2 ],
        [ 'last member of collection, negative index', c3, -1, 2 ],
    ];

    test.each(table)('%s', (_, c, ix, ret) => {
        expect(c.index(ix)).toEqual(ret);
    });
});

describe('Collection.val()', () => {
    test('creates a copy of the contents of a sequence.', () => {
        const c = new Collection([ 1, 4, 5 ]);
        const v = c.val();

        expect(v).toStrictEqual(c.contents);
        expect(v).not.toBe(c.contents);
    });
});

describe('Collection.valAt()', () => {
    const c = new Collection([ 1, 4, 5 ]);

    test('works with non-negative index', () => {
        expect(c.valAt(2)).toEqual(5);
    });

    test('works with negative index', () => {
        expect(c.valAt(-3)).toEqual(1);
    });

    test('throws with index beyond end', () => {
        expect(() => c.valAt(3)).toThrow();
    });

    test('throws with index before start', () => {
        expect(() => c.valAt(-4)).toThrow();
    });
});

describe('Collection.isSameClassAs()', () => {
    class C1 extends Collection<number> {}
    class C2 extends Collection<number> {}

    const c1 = new C1([ 1, 2, 3 ]);
    const c2 = new C2([ 1, 2, 3 ]);
    const c3 = new C1([ 4 ]);

    test('Returns true when nothing is passed', () => {
        expect(c1.isSameClassAs()).toBe(true);
    });

    test('Comparing to non-Collection returns false', () => {
        expect(c1.isSameClassAs(68)).toBe(false);
    });

    test('Different classes return false', () => {
        expect(c1.isSameClassAs(c2)).toBe(false);
    });

    test('Same classes return true', () => {
        expect(c1.isSameClassAs(c3)).toBe(true);
    });

    test('Different classes return false when multiple args passed', () => {
        expect(c1.isSameClassAs(c3, c3, c2, c3)).toBe(false);
    });

    test('Same classes return true when multiple args passed', () => {
        expect(c1.isSameClassAs(c3, c3, c1, c3)).toBe(true);
    });
});

describe('Collection.indices()', () => {
    const c0 = new Collection([]);
    const c3 = new Collection([ 1, 2, 3 ]);

    const errortable: [ string, Collection<never> | Collection<number>, SeqIndices ][] = [
        [ 'empty collection', c0, [ 0 ] ],
        [ 'after last member of collection', c3, [ 3 ] ],
        [ 'before first member of collection', c3, [ -4 ] ],
    ];

    test.each(errortable)('errors when %s', (_, c, ix) => {
        expect(() => c.indices(ix)).toThrow();
    });

    const table: [ string, Collection<number>, SeqIndices, number[] ][] = [
        [ 'single member', c3, 1, [ 1 ] ],
        [ 'valid collection members', c3, [ 0, -3, 2, -1 ], [ 0, 0, 2, 2 ] ],
        [ 'valid collection members as intseq', c3, intseq([ 1, 2 ]), [ 1, 2 ] ],
    ];

    test.each(table)('%s', (_, c, ix, ret) => {
        expect(c.indices(ix)).toEqual(ret);
    });

    test('correctly uses optional second parameter', () => {
        expect(c3.indices([ 3 ], true)).toEqual([ 3 ]);
        expect(() => c0.indices([ 4 ], true)).toThrow();
    });
});

describe('Collection.findFirstIndex()', () => {
    const c0 = new Collection([]);
    const c6 = new Collection([ 1, 4, 6, 4, 5, 4 ]);

    test('fails when a non-function passed', () => {
        expect(() => c6.findFirstIndex(555 as unknown as FinderFn<number>)).toThrow();
    });

    const table: [ string, Collection<never> | Collection<number>, FinderFn<number>, number | null ][] = [
        [ 'nothing found in an empty collection', c0, v => v === 4, null ],
        [ 'nothing found when function does not match', c6, v => v === 3, null ],
        [ 'finds by index', c6, (_, i) => i === 4, 4 ],
        [ 'finds first matching item', c6, v => v === 4, 1 ]
    ];

    test.each(table)('%s', (_, c, fn, ret) => {
        expect(c.findFirstIndex(fn)).toStrictEqual(ret);
    });
});

describe('Collection.findLastIndex()', () => {
    const c0 = new Collection([]);
    const c6 = new Collection([ 1, 4, 6, 4, 5, 4 ]);

    test('fails when a non-function passed', () => {
        expect(() => c6.findLastIndex(555 as unknown as FinderFn<number>)).toThrow();
    });

    const table: [ string, Collection<never> | Collection<number>, FinderFn<number>, number | null ][] = [
        [ 'nothing found in an empty collection', c0, v => v === 4, null ],
        [ 'nothing found when function does not match', c6, v => v === 3, null ],
        [ 'finds by index', c6, (_, i) => i === 4, 4 ],
        [ 'finds last matching item', c6, v => v === 4, 5 ]
    ];

    test.each(table)('%s', (_, c, fn, ret) => {
        expect(c.findLastIndex(fn)).toStrictEqual(ret);
    });
});

describe('Collection.findIndices()', () => {
    const c0 = new Collection([]);
    const c6 = new Collection([ 1, 4, 6, 4, 5, 4 ]);

    test('fails when a non-function passed', () => {
        expect(() => c6.findIndices(555 as unknown as FinderFn<number>)).toThrow();
    });

    const table: [ string, Collection<never> | Collection<number>, FinderFn<number>, number[] ][] = [
        [ 'nothing found in an empty collection', c0, v => v === 4, [] ],
        [ 'nothing found when function does not match', c6, v => v === 3, [] ],
        [ 'finds by index', c6, (_, i) => i === 4, [ 4 ] ],
        [ 'finds all matching items', c6, v => v === 4, [ 1, 3, 5 ] ]
    ];

    test.each(table)('%s', (_, c, fn, ret) => {
        expect(c.findIndices(fn)).toStrictEqual(ret);
    });
});

describe('Collection.clone()', () => {
    test('empties the collection', () => {
        const c = new Collection([ 1, 5, 4 ]);
        const copy = c.clone();

        expect(copy).toStrictEqual(c);
        expect(copy).not.toBe(c);
    });
});

describe('Collection.empty()', () => {
    test('empties the collection', () => {
        expect(new Collection([ 1, 5, 4 ]).empty()).toStrictEqual(new Collection([]));
    });
});

describe('Collection.filter()', () => {
    const c = new Collection([ 1, 5, 4, 2, 3, 6 ]);

    test('expects a function argument', () => {
        expect(() => c.filter('banana' as unknown as FilterFn<number>)).toThrow();
    });

    test('operates as expected with one argument in passed function', () => {
        expect(c.filter((n: number) => n % 2 !== 0)).toStrictEqual(new Collection([ 1, 5, 3 ]));
    });

    test('operates as expected with two arguments in passed function', () => {
        expect(c.filter((_: number, i: number) => i % 2 !== 0)).toStrictEqual(new Collection([ 5, 2, 6 ]));
    });
});

describe('Collection.keepSlice()', () => {
    const c = new Collection([ 1, 5, 4, 2, 3, 6 ]);

    const table: [ string, number, number | undefined, number[] ][] = [
        [ 'with one argument', 1, undefined, [ 5, 4, 2, 3, 6 ] ],
        [ 'with two arguments', 0, 3, [ 1, 5, 4 ] ],
        [ 'with two identical arguments', 0, 0, [] ],
        [ 'with two arguments, one negative start', -2, 5, [ 3 ] ],
        [ 'with two arguments, one beyond the end', 3, 7, [ 2, 3, 6 ] ],
        [ 'with two arguments, one beyond start and one beyond end', -7, 7, [ 1, 5, 4, 2, 3, 6 ] ],
    ];

    test.each(table)('%s', (_, start, end, ret) => {
        expect(c.keepSlice(start, end)).toStrictEqual(new Collection(ret));
    });
});

describe('Collection.keep()', () => {
    const c = new Collection([ 1, 5, 4, 2, 3, 6 ]);

    const table: [ string, number | undefined, number[] ][] = [
        [ 'with default value', undefined, [ 1 ]],
        [ 'ending at start', 0, [] ],
        [ 'ending in middle', 2, [ 1, 5 ] ],
        [ 'ending negative', -2, [ 1, 5, 4, 2 ] ],
        [ 'ending at end', 6, [ 1, 5, 4, 2, 3, 6 ] ],
        [ 'ending after end', 7, [ 1, 5, 4, 2, 3, 6 ] ],
    ];

    test.each(table)('%s', (_, start, ret) => {
        expect(c.keep(start)).toStrictEqual(new Collection(ret));
    });
});

describe('Collection.keepRight()', () => {
    const c = new Collection([ 1, 5, 4, 2, 3, 6 ]);

    const table: [ string, number | undefined, number[] ][] = [
        [ 'with default value', undefined, [ 6 ] ],
        [ 'starting before start', 7, [ 1, 5, 4, 2, 3, 6 ] ],
        [ 'starting at start', 6, [ 1, 5, 4, 2, 3, 6 ] ],
        [ 'starting in middle', 4, [ 4, 2, 3, 6 ] ],
        [ 'starting at end', 0, [] ],
    ];

    test.each(table)('%s', (_, start, ret) => {
        expect(c.keepRight(start)).toStrictEqual(new Collection(ret));
    });
});

describe('Collection.keepIndices()', () => {
    const c = new Collection([ 1, 5, 4, 2, 3, 6 ]);

    test('after last memeber of collection causes an error', () => {
        expect(() => c.keepIndices([ 6 ])).toThrow();
    });

    test('before first member of collection throws an error', () => {
        expect(() => c.keepIndices([ -5, -6, -7 ])).toThrow();
    });

    test('works with valid collection members', () => {
        expect(c.keepIndices([ 0, -4, 2, -1 ])).toStrictEqual(new Collection([ 1, 4, 4, 6 ]));
    });

    test('works with valid collection members, passed as an intseq', () => {
        expect(c.keepIndices(intseq([ 1, 2 ]))).toStrictEqual(new Collection([ 5, 4 ]));
    });
});

describe('Collection.keepNth()', () => {
    const c = new Collection([ 1, 5, 4, 2, 3, 6 ]);

    const errortable: [ string, number, number | undefined ][] = [
        [ 'non-integer argument', 0.5, undefined ],
        [ 'zero argument', 0, undefined ],
        [ 'non-integer offset', 1, 0.5 ],
        [ 'negative offset', 1, -1 ],
    ];

    test.each(errortable)('throws an error with a %s', (_, n, offset) => {
        expect(() => c.keepNth(n, offset)).toThrow();
    });

    const table: [ string, number, number | undefined, number[] ][] = [
        [ 'every member', 1, undefined, [ 1, 5, 4, 2, 3, 6 ] ],
        [ 'every member, with offset', 1, 3, [ 2, 3, 6 ] ],
        [ 'every second member', 2, undefined, [ 1, 4, 3 ] ],
        [ 'every third member, with offset', 3, 1, [ 5, 3 ] ],
        [ 'every 100th member', 100, 0, [ 1 ] ],
    ];

    test.each(table)('%s', (_, n, offset, ret) => {
        expect(c.keepNth(n, offset)).toStrictEqual(new Collection(ret));
    });
});

describe('Collection.dropSlice()', () => {
    const c = new Collection([ 1, 5, 4, 2, 3, 6 ]);

    const table: [ string, number, number | undefined, number[] ][] = [
        [ 'with one argument', 1, undefined, [ 1 ] ],
        [ 'with two arguments', 0, 3, [ 2, 3, 6 ] ],
        [ 'with two identical arguments', 0, 0, [ 1, 5, 4, 2, 3, 6 ] ],
        [ 'with two arguments, one negative start', -2, 5, [ 1, 5, 4, 2, 6 ] ],
        [ 'with two arguments, one beyond the end', 3, 7, [ 1, 5, 4 ] ],
        [ 'with two arguments, one beyond start and one beyond end', -7, 7, [] ],
    ];

    test.each(table)('%s', (_, start, end, ret) => {
        expect(c.dropSlice(start, end)).toStrictEqual(new Collection(ret));
    });
});

describe('Collection.drop()', () => {
    const c = new Collection([ 1, 5, 4, 2, 3, 6 ]);

    const table: [ string, number | undefined, number[] ][] = [
        [ 'with default value', undefined, [ 5, 4, 2, 3, 6 ] ],
        [ 'ending at start', 0, [ 1, 5, 4, 2, 3, 6 ] ],
        [ 'ending in middle', 2, [ 4, 2, 3, 6 ] ],
        [ 'ending negative', -2, [ 3, 6 ] ],
        [ 'ending at end', 6, [] ],
        [ 'ending after end', 7, [] ],
    ];

    test.each(table)('%s', (_, start, ret) => {
        expect(c.drop(start)).toStrictEqual(new Collection(ret));
    });
});

describe('Collection.dropRight()', () => {
    const c = new Collection([ 1, 5, 4, 2, 3, 6 ]);

    const table: [ string, number | undefined, number[] ][] = [
        [ 'with default value', undefined, [ 1, 5, 4, 2, 3 ] ],
        [ 'starting before start', 7, [], ],
        [ 'starting at start', 6, [] ],
        [ 'starting in middle', 4, [ 1, 5 ] ],
        [ 'starting at end', 0, [ 1, 5, 4, 2, 3, 6 ] ],
    ];

    test.each(table)('%s', (_, start, ret) => {
        expect(c.dropRight(start)).toStrictEqual(new Collection(ret));
    });
});

describe('Collection.dropIndices()', () => {
    const c = new Collection([ 1, 5, 4, 2, 3, 6 ]);
    const e = new Error('');

    const table: [ string, number[] | NumSeq, number[] | Error ][] = [
        [ 'valid collection members', [ 0, -4, 2, -1 ], [ 5, 2, 3 ] ],
        [ 'valid collection members as intseq', intseq([ 1, 2 ]), [ 1, 2, 3, 6 ] ],
        [ 'after last member of collection errors', [ 6 ], e ],
        [ 'before first member of collection errors', [ -7 ], e ],
    ];

    test.each(table)('%s', (_, ix, ret) => {
        if (ret instanceof Error) {
            expect(() => c.dropIndices(ix)).toThrow();
        } else {
            expect(c.dropIndices(ix)).toStrictEqual(new Collection(ret));
        }
    });
});

describe('Collection.dropNth()', () => {
    const c = new Collection([ 1, 5, 4, 2, 3, 6 ]);

    const errortable: [ string, number, number | undefined ][] = [
        [ 'non-integer argument', 0.5, undefined ],
        [ 'zero argument', 0, undefined ],
        [ 'non-integer offset', 1, 0.5 ],
        [ 'negative offset', 1, -1 ],
    ];
 
    test.each(errortable)('throws an error with a %s', (_, n, offset) => {
        expect(() => c.dropNth(n, offset)).toThrow();
    });

    const table: [ string, number, number | undefined, number[] ][] = [
        [ 'every member', 1, undefined, [] ],
        [ 'every member, with offset', 1, 3, [ 1, 5, 4 ] ],
        [ 'every second member', 2, undefined, [ 5, 2, 6 ] ],
        [ 'every third member, with offset', 3, 1, [ 1, 4, 2, 6 ] ],
        [ 'every 100th member', 100, 0, [ 5, 4, 2, 3, 6 ] ],
    ];

    test.each(table)('dropping %s works', (_, n, offset, ret) => {
        expect(c.dropNth(n, offset)).toStrictEqual(new Collection(ret));
    });
});

describe('Collection.insertBefore()', () => {
    const c = new Collection([ 1, 2, 3, 4, 5, 6 ]);

    const table: [ string, SeqIndices, Replacer<number, number>, number[] ][] = [
        [
            'in no locations',
            [],
            c,
            [ 1, 2, 3, 4, 5, 6 ]
        ],
        [
            'an empty array before one location',
            2,
            [],
            [ 1, 2, 3, 4, 5, 6 ]
        ],
        [
            'one value before one location',
            0,
            8,
            [ 8, 1, 2, 3, 4, 5, 6 ]
        ],
        [
            'one value from a function with arity one before one location',
            -6,
            v => v + 8,
            [ 9, 1, 2, 3, 4, 5, 6 ]
        ],
        [
            'multiple values before one location',
            -1,
            [ 9, 8, 7 ],
            [ 1, 2, 3, 4, 5, 9, 8, 7, 6 ]
        ],
        [
            'a Collection before one location',
            -1,
            new Collection([ 9, 8, 7 ]),
            [ 1, 2, 3, 4, 5, 9, 8, 7, 6 ]
        ],
        [
            'multiple values from a function with arity two before one location',
            [ 5 ],
            (v, i) => [ v, i ],
            [ 1, 2, 3, 4, 5, 6, 5, 6 ]
        ],
        [
            'a Collection from a function with arity two before one location',
            [ 5 ],
            (v, i) => new Collection([ v + i, v - i ]),
            [ 1, 2, 3, 4, 5, 11, 1, 6 ]
        ],
        [
            'a collection before one location',
            [ 3 ],
            c,
            [ 1, 2, 3, 1, 2, 3, 4, 5, 6, 4, 5, 6 ]
        ],
        [
            'a collection from a function before multiple locations',
            [ 2, 4 ],
            () => c,
            [ 1, 2, 1, 2, 3, 4, 5, 6, 3, 4, 1, 2, 3, 4, 5, 6, 5, 6 ]
        ],
        [
            'one value before multiple locations',
            [ 1, 3, 5 ],
            10,
            [ 1, 10, 2, 3, 10, 4, 5, 10, 6 ]
        ],
        [
            'one value before multiple locations passed as a sequence',
            intseq([ 1, 3, 5 ]),
            10,
            [ 1, 10, 2, 3, 10, 4, 5, 10, 6 ]
        ],
        [
            'one value from a function with arity one before multiple locations',
            [ -5, -3, -3, -1 ],
            v => v + 8,
            [ 1, 10, 2, 3, 12, 12, 4, 5, 14, 6 ]
        ],
        [
            'multiple values from a function with arity two before multiple locations',
            [ -5, -3, -1 ],
            (v, i) => [ v, i ],
            [ 1, 2, 1, 2, 3, 4, 3, 4, 5, 6, 5, 6 ]
        ],
    ];

    test.each(table)('inserting %s', (_, ix, rep, ret) => {
        expect(c.insertBefore(ix, rep)).toStrictEqual(new Collection(ret));
    });
});

describe('Collection.insertAfter()', () => {
    const c = new Collection([ 1, 2, 3, 4, 5, 6 ]);

    const table: [ string, SeqIndices, Replacer<number, number>, number[] ][] = [
        [
            'in no locations',
            [],
            c,
            [ 1, 2, 3, 4, 5, 6 ]
        ],
        [
            'an empty array after one location',
            2,
            [],
            [ 1, 2, 3, 4, 5, 6 ]
        ],
        [
            'one value after one location',
            0,
            8,
            [ 1, 8, 2, 3, 4, 5, 6 ]
        ],
        [
            'one value from a function with arity one after one location',
            -6,
            v => v + 8,
            [ 1, 9, 2, 3, 4, 5, 6 ]
        ],
        [
            'multiple values after one location',
            -1,
            [ 9, 8, 7 ],
            [ 1, 2, 3, 4, 5, 6, 9, 8, 7 ]
        ],
        [
            'a Collection before one location',
            -1,
            new Collection([ 9, 8, 7 ]),
            [ 1, 2, 3, 4, 5, 6, 9, 8, 7 ]
        ],
        [
            'multiple values from a function with arity two before one location',
            [ 5 ],
            (v, i) => [ v, i ],
            [ 1, 2, 3, 4, 5, 6, 6, 5 ]
        ],
        [
            'a Collection from a function with arity two before one location',
            [ 5 ],
            (v, i) => new Collection([ v + i, v - i ]),
            [ 1, 2, 3, 4, 5, 6, 11, 1 ]
        ],
        [
            'a collection after one location',
            [ 3 ],
            c,
            [ 1, 2, 3, 4, 1, 2, 3, 4, 5, 6, 5, 6 ]
        ],
        [
            'a collection from a function after multiple locations',
            [ 2, 4 ],
            () => c,
            [ 1, 2, 3, 1, 2, 3, 4, 5, 6, 4, 5, 1, 2, 3, 4, 5, 6, 6 ]
        ],
        [
            'one value after multiple locations',
            [ 1, 3, 5 ],
            10,
            [ 1, 2, 10, 3, 4, 10, 5, 6, 10 ]
        ],
        [
            'one value after multiple locations passed as a sequence',
            intseq([ 1, 3, 5 ]),
            10,
            [ 1, 2, 10, 3, 4, 10, 5, 6, 10 ]
        ],
        [
            'one value from a function with arity one after multiple locations',
            [ -5, -3, -3, -1 ],
            v => v + 8,
            [ 1, 2, 10, 3, 4, 12, 12, 5, 6, 14 ]
        ],
        [
            'multiple values from a function with arity two after multiple locations',
            [ -5, -3, -1 ],
            (v, i) => [ v, i ],
            [ 1, 2, 2, 1, 3, 4, 4, 3, 5, 6, 6, 5 ]
        ],
    ];

    test.each(table)('inserting %s', (_, ix, rep, ret) => {
        expect(c.insertAfter(ix, rep)).toStrictEqual(new Collection(ret));
    });
});

describe('Collection.replaceIndices()', () => {
    const c = new Collection([ 1, 2, 3, 4, 5, 6 ]);

    const table: [ string, SeqIndices, Replacer<number, number>, number[] ][] = [
        [
            'with one value in no locations',
            [],
            c,
            [ 1, 2, 3, 4, 5, 6 ]
        ],
        [
            'with an empty array at one location',
            2,
            [],
            [ 1, 2, 4, 5, 6 ]
        ],
        [
            'with one value at one location',
            0,
            8,
            [ 8, 2, 3, 4, 5, 6 ]
        ],
        [
            'with one value from a function with arity one at one location',
            -6,
            v => v + 8,
            [ 9, 2, 3, 4, 5, 6 ]
        ],
        [
            'with multiple values at one location',
            -1,
            [ 9, 8, 7 ],
            [ 1, 2, 3, 4, 5, 9, 8, 7 ]
        ],
        [
            'multiple values from a function with arity two at one location',
            [ 5 ],
            (v, i) => [ v, i ],
            [ 1, 2, 3, 4, 5, 6, 5 ]
        ],
        [
            'with a collection at one location',
            [ 3 ],
            c,
            [ 1, 2, 3, 1, 2, 3, 4, 5, 6, 5, 6 ]
        ],
        [
            'with a collection from a function at multiple locations',
            [ 2, 4 ],
            () => c,
            [ 1, 2, 1, 2, 3, 4, 5, 6, 4, 1, 2, 3, 4, 5, 6, 6 ]
        ],
        [
            'with one value at multiple locations',
            [ 1, 3, 5 ],
            10,
            [ 1, 10, 3, 10, 5, 10 ]
        ],
        [
            'with one value after multiple locations passed as a sequence',
            intseq([ 1, 3, 5 ]),
            10,
            [ 1, 10, 3, 10, 5, 10 ]
        ],
        [
            'with one value from a function with arity one at multiple locations',
            [ -5, -3, -3, -1 ],
            v => v + 8,
            [ 1, 10, 3, 12, 5, 14 ]
        ],
        [
            'with multiple values from a function with arity two at multiple locations',
            [ -5, -3, -1 ],
            (v, i) => [ v, i ],
            [ 1, 2, 1, 3, 4, 3, 5, 6, 5 ]
        ],
    ];

    test.each(table)('replacing %s', (_, ix, rep, ret) => {
        expect(c.replaceIndices(ix, rep)).toStrictEqual(new Collection(ret));
    });
});

describe('Collection.mapIndices()', () => {
    const c = new Collection([ 1, 2, 3, 4, 5, 6 ]);

    test('fails when a non-function passed as mapper function', () => {
        expect(() => c.mapIndices([ 1, 2, 3 ], 55 as unknown as MapperFn<number>)).toThrow();
    });

    const table: [ string, number[], MapperFn<number>, number[] ][] = [
        [
            'with a value from a function with arity one at multiple locations',
            [ -5, -3, -3, -1 ],
            v => v + 8,
            [ 1, 10, 3, 12, 5, 14 ]
        ],
        [
            'with a value from a function with arity two at multiple locations',
            [ -5, -3, -1 ],
            (v, i) => v + i,
            [ 1, 3, 3, 7, 5, 11 ]
        ],
    ];

    test.each(table)('replacing %s', (_, ix, fn, ret) => {
        expect(c.mapIndices(ix, fn)).toStrictEqual(new Collection(ret));
    });
});

describe('Collection.replaceFirstIndex()', () => {
    const c = new Collection([ 1, 4, 6, 4, 5, 4 ]);

    test('fails when a non-function passed as finder function', () => {
        expect(() => c.replaceFirstIndex(555 as unknown as FinderFn<number>, 1)).toThrow();
    });

    test('nothing found or replaced when function never matches', () => {
        expect(c.replaceFirstIndex(v => v === 3, 10)).toBe(c);
    });

    const table: [ string, FinderFn<number>, Replacer<number, number>, number[] ][] = [
        [ 'finds by index and replaces with zero items', (_, i) => i === 4, [], [ 1, 4, 6, 4, 4 ] ],
        [ 'finds first matching item and replaces with one item', v => v === 4, 10, [ 1, 10, 6, 4, 5, 4 ] ],
        [ 'finds first matching item and replaces with two items from function of arity two', v => v === 4, (v, i) => [ -v, -i ], [ 1, -4, -1, 6, 4, 5, 4 ] ],
        [ 'finds only matching item and replaces with a collection', v => v < 3, c, [ 1, 4, 6, 4, 5, 4, 4, 6, 4, 5, 4 ] ],
    ];

    test.each(table)('%s', (_, fn, rep, ret) => {
        expect(c.replaceFirstIndex(fn, rep)).toStrictEqual(new Collection(ret));
    });
});

describe('Collection.mapFirstIndex()', () => {
    const c = new Collection([ 1, 4, 6, 4, 5, 4 ]);

    test('fails when a non-function passed as finder function', () => {
        expect(() => c.mapFirstIndex(555 as unknown as FinderFn<number>, v => v + 4)).toThrow();
    });

    test('fails when a non-function passed as mapper function', () => {
        expect(() => c.mapFirstIndex(v => v === 3, 555 as unknown as MapperFn<number>)).toThrow();
    });

    test('nothing found or replaced when function never matches', () => {
        expect(c.mapFirstIndex(v => v > 10, v => v + 4)).toBe(c);
    });

    test('finds first matching item by value and maps it by value', () => {
        expect(c.mapFirstIndex(v => v === 4, v => v + 4)).toStrictEqual(new Collection([ 1, 8, 6, 4, 5, 4 ]));
    });

    test('finds first matching item by value and index and maps it by value and index', () => {
        expect(c.mapFirstIndex((_, i) => i % 2 == 1, (v, i) => v + i)).toStrictEqual(new Collection([ 1, 5, 6, 4, 5, 4 ]));
    });
});

describe('Collection.replaceLastIndex()', () => {
    const c = new Collection([ 1, 4, 6, 4, 5, 4 ]);

    test('fails when a non-function passed as finder function', () => {
        expect(() => c.replaceLastIndex(555 as unknown as FinderFn<number>, 1)).toThrow();
    });

    test('nothing found or replaced when function never matches', () => {
        expect(c.replaceLastIndex(v => v === 3, 10)).toBe(c);
    });

    const table: [ string, FinderFn<number>, Replacer<number, number>, number[] ][] = [
        [ 'finds by index and replaces with zero items', (_, i) => i === 4, [], [ 1, 4, 6, 4, 4 ] ],
        [ 'finds last matching item and replaces with one item', v => v === 4, 10, [ 1, 4, 6, 4, 5, 10 ] ],
        [ 'finds last matching item and replaces with two items from function of arity two', v => v === 4, (v, i) => [ -v, -i ], [ 1, 4, 6, 4, 5, -4, -5 ] ],
        [ 'finds only matching item and replaces with a collection', v => v < 3, c, [ 1, 4, 6, 4, 5, 4, 4, 6, 4, 5, 4 ] ],
    ];

    test.each(table)('%s', (_, fn, rep, ret) => {
        expect(c.replaceLastIndex(fn, rep)).toStrictEqual(new Collection(ret));
    });
});

describe('Collection.mapLastIndex()', () => {
    const c = new Collection([ 1, 4, 6, 4, 5, 4 ]);

    test('fails when a non-function passed as finder function', () => {
        expect(() => c.mapLastIndex(555 as unknown as FinderFn<number>, v => v + 4)).toThrow();
    });

    test('fails when a non-function passed as mapper function', () => {
        expect(() => c.mapLastIndex(v => v === 3, 555 as unknown as MapperFn<number>)).toThrow();
    });

    test('nothing found or replaced when function never matches', () => {
        expect(c.mapLastIndex(v => v > 10, v => v + 4)).toBe(c);
    });

    test('finds last matching item by value and maps it by value', () => {
        expect(c.mapLastIndex(v => v === 4, v => v + 4)).toStrictEqual(new Collection([ 1, 4, 6, 4, 5, 8 ]));
    });

    test('finds last matching item by value and index and maps it by value and index', () => {
        expect(c.mapLastIndex((_, i) => i % 2 == 1, (v, i) => v + i)).toStrictEqual(new Collection([ 1, 4, 6, 4, 5, 9 ]));
    });
});

describe('Collection.replaceIf()', () => {
    const c = new Collection([ 1, 4, 6, 4, 5, 4 ]);

    test('fails when a non-function passed as finder function', () => {
        expect(() => c.replaceIf(555 as unknown as FinderFn<number>, 1)).toThrow();
    });

    test('nothing found or replaced when function never matches', () => {
        expect(c.replaceIf(v => v > 10, v => v + 4)).toBe(c);
    });

    const table: [ string, FinderFn<number>, Replacer<number, number>, number[] ][] = [
        [ 'finds by index and replaces with zero items', (_, i) => i === 4, [], [ 1, 4, 6, 4, 4 ] ],
        [ 'finds matching items and replaces each with one item', v => v === 4, 10, [ 1, 10, 6, 10, 5, 10 ] ],
        [ 'finds matching items and replaces with two items from function of arity two', v => v === 4, (v, i) => [ -v, -i ], [ 1, -4, -1, 6, -4, -3, 5, -4, -5 ] ],
        [ 'finds only matching item and replaces with a collection', v => v < 3, c, [ 1, 4, 6, 4, 5, 4, 4, 6, 4, 5, 4 ] ],
    ];

    test.each(table)('%s', (_, fn, rep, ret) => {
        expect(c.replaceIf(fn, rep)).toStrictEqual(new Collection(ret));
    });
});

describe('Collection.mapIf()', () => {
    const c = new Collection([ 1, 4, 6, 4, 5, 4 ]);

    test('fails when a non-function passed as finder function', () => {
        expect(() => c.mapIf(555 as unknown as FinderFn<number>, v => v + 4)).toThrow();
    });

    test('fails when a non-function passed as mapper function', () => {
        expect(() => c.mapIf(v => v === 3, 555 as unknown as MapperFn<number>)).toThrow();
    });

    test('nothing found or replaced when function never matches', () => {
        expect(c.mapIf(v => v === 3, v => v + 4)).toBe(c);
    });

    test('finds all matching items by value and maps them by value', () => {
        expect(c.mapIf(v => v === 4, v => v + 4)).toStrictEqual(new Collection([ 1, 8, 6, 8, 5, 8 ]));
    });

    test('finds all matching items by value and index and maps them by value and index', () => {
        expect(c.mapIf((_, i) => i % 2 == 1, (v, i) => v + i)).toStrictEqual(new Collection([ 1, 5, 6, 7, 5, 9 ]));
    });
});

describe('Collection.replaceNth()', () => {
    const c = new Collection([ 1, 5, 4, 2, 3, 6 ]);

    const errortable: [ string, number, number | undefined ][] = [
        [ 'non-integer argument', 0.5, undefined ],
        [ 'zero argument', 0, undefined ],
        [ 'non-integer offset', 1, 0.5 ],
        [ 'negative offset', 1, -1 ],
    ];

    test.each(errortable)('throws an error with a %s', (_, n, offset) => {
        expect(() => c.replaceNth(n, 5, offset)).toThrow();
    });

    const table: [ string, number, Replacer<number, number>, number | undefined, number[] ][] = [
        [ 'member with one item from function', 1, v => -v, undefined, [ -1, -5, -4, -2, -3, -6 ] ],
        [ 'member, with offset, with zero items', 1, [], 3, [ 1, 5, 4 ] ],
        [ 'second member with single item', 2, 10, undefined, [ 10, 5, 10, 2, 10, 6 ] ],
        [ 'third member, with offset, with two items from function of arity two', 3, (v, i) => [ -v, -i ], 1, [ 1, -5, -1, 4, 2, -3, -4, 6] ],
        [ '100th member with a collection', 100, c, 0, [ 1, 5, 4, 2, 3, 6, 5, 4, 2, 3, 6 ] ],
    ];

    test.each(table)('replacing every %s', (_, fn, rep, offset, ret) => {
        expect(c.replaceNth(fn, rep, offset)).toStrictEqual(new Collection(ret));
    });
});

describe('Collection.mapNth()', () => {
    const c = new Collection([ 1, 5, 4, 2, 3, 6 ]);

    const errortable: [ string, number, MapperFn<number>, number | undefined ][] = [
        [ 'non-integer argument', 0.5, v => v, undefined ],
        [ 'zero argument', 0, v => v, undefined ],
        [ 'non-integer offset', 1, v => v, 0.5 ],
        [ 'negative offset', 1, v => v, -1 ],
        [ 'non-function mapper', 1, 5 as unknown as MapperFn<number>, 1 ],
    ];

    test.each(errortable)('throws an error with a %s', (_, n, fn, offset) => {
        expect(() => c.mapNth(n, fn, offset)).toThrow();
    });

    const table: [ string, number, MapperFn<number>, number | undefined, number[] ][] = [
        [ 'member', 1, v => -v, undefined, [ -1, -5, -4, -2, -3, -6 ] ],
        [ 'member, with offset, with its index', 1, (_, i) => i, 3, [ 1, 5, 4, 3, 4, 5 ] ],
        [ 'third member, with offset', 3, (v, i) => v + i, 1, [ 1, 6, 4, 2, 7, 6] ],
    ];

    test.each(table)('replacing every %s', (_, fn, rep, offset, ret) => {
        expect(c.mapNth(fn, rep, offset)).toStrictEqual(new Collection(ret));
    });
});

describe('Collection.replaceSlice()', () => {
    const c = new Collection([ 1, 5, 4, 2, 3, 6 ]);

    const table: [ string, number, number, Replacer<Collection<number>, number>, number[] ][] = [
        [ 'first three members with empty array', 0, 3, [], [ 2, 3, 6 ] ],
        [ 'last three members with one item', 3, 6, 7, [ 1, 5, 4, 7 ] ],
        [ 'empty slice with an array of one item', 3, -3, [ 8 ], [ 1, 5, 4, 8, 2, 3, 6 ] ],
        [ 'entire collection with an array of two items', 0, 6, [ 10, 11 ], [ 10, 11 ] ],
        [ 'middle two members with items from a function of arity two', 2, 4, (v, i) => [ i, ...v.contents, i ], [ 1, 5, 2, 4, 2, 2, 3, 6 ] ],
        [ 'four members with the same collection', 1, -1, c, [ 1, 1, 5, 4, 2, 3, 6, 6 ] ],
    ];

    test.each(table)('replacing %s', (_, start, end, rep, ret) => {
        expect(c.replaceSlice(start, end, rep)).toStrictEqual(new Collection(ret));
    });
});

describe('Collection.mapSlice()', () => {
    const c = new Collection([ 1, 5, 4, 2, 3, 6 ]);

    test('throws an error if a function is not passed', () => {
        expect(() => c.mapSlice(1, 2, 555 as unknown as MapperFn<number>)).toThrow();
    });

    const table: [ string, number, number, MapperFn<number>, number[] ][] = [
        [ 'adding one to the first three members', 0, 3, v => v + 1, [ 2, 6, 5, 2, 3, 6 ] ],
        [ 'replacing the last three members with their index within that slice', 3, 6, (_, i) => i, [ 1, 5, 4, 0, 1, 2 ] ],
        [ 'mapping an empty slice does nothing', 2, 2, () => 55, [ 1, 5, 4, 2, 3, 6 ] ],
    ];

    test.each(table)('%s', (_, start, end, fn, ret) => {
        expect(c.mapSlice(start, end, fn)).toStrictEqual(new Collection(ret));
    });
});

describe('Collection.append()', () => {
    class CX extends Collection<number> {}

    const c = new Collection([ 1, 4, 3 ]);
    const c1 = new Collection([ 9, 0 ]);
    const c2 = new Collection([ 7 ]);
    const cx = new CX([ 5, 6 ]);

    test('with no arguments returns identical Collection', () => {
        expect(c.append()).toStrictEqual(c);
    });

    test('with a different class argument fails', () => {
        expect(() => c.append(c1, cx)).toThrow();
    });

    test('with one argument succeeds', () => {
        expect(c.append(c1)).toStrictEqual(new Collection([ 1, 4, 3, 9, 0 ]));
    });

    test('with multiple arguments succeeds', () => {
        expect(c.append(c2, c1, c2)).toStrictEqual(new Collection([ 1, 4, 3, 7, 9, 0, 7 ]));
    });
});

describe('Collection.appendItems()', () => {
    const c = new Collection([ 1, 4, 3 ]);

    test('with no arguments returns identical Collection', () => {
        expect(c.appendItems()).toStrictEqual(c);
    });

    test('with one argument succeeds', () => {
        expect(c.appendItems(5)).toStrictEqual(new Collection([ 1, 4, 3, 5 ]));
    });

    test('with multiple arguments succeeds', () => {
        expect(c.appendItems(5, 2, 6)).toStrictEqual(new Collection([ 1, 4, 3, 5, 2, 6 ]));
    });
});

describe('Collection.prepend()', () => {
    class CX extends Collection<number> {}

    const c = new Collection([ 1, 4, 3 ]);
    const c1 = new Collection([ 9, 0 ]);
    const c2 = new Collection([ 7 ]);
    const cx = new CX([ 5, 6 ]);

    test('with no arguments returns identical Collection', () => {
        expect(c.prepend()).toStrictEqual(c);
    });

    test('with a different class argument fails', () => {
        expect(() => c.prepend(c1, cx)).toThrow();
    });

    test('with one argument succeeds', () => {
        expect(c.prepend(c1)).toStrictEqual(new Collection([ 9, 0, 1, 4, 3 ]));
    });

    test('with multiple arguments succeeds', () => {
        expect(c.prepend(c2, c1, c2)).toStrictEqual(new Collection([ 7, 9, 0, 7, 1, 4, 3 ]));
    });
});

describe('Collection.prependItems()', () => {
    const c = new Collection([ 1, 4, 3 ]);

    test('with no arguments returns identical Collection', () => {
        expect(c.prependItems()).toStrictEqual(c);
    });

    test('with one argument succeeds', () => {
        expect(c.prependItems(5)).toStrictEqual(new Collection([ 5, 1, 4, 3 ]));
    });

    test('with multiple arguments succeeds', () => {
        expect(c.prependItems(5, 2, 6)).toStrictEqual(new Collection([ 5, 2, 6, 1, 4, 3 ]));
    });
});

describe('Collection.map()', () => {
    const c = new Collection([ 1, 5, 4, 2, 3, 6 ]);

    test('expects a function argument', () => {
        expect(() => c.map('banana' as unknown as MapperFn<number>)).toThrow();
    });

    test('operates as expected with one argument in passed function', () => {
        expect(c.map((n: number) => n + 1)).toStrictEqual(new Collection([ 2, 6, 5, 3, 4, 7 ]));
    });

    test('operates as expected with two arguments in passed function', () => {
        expect(c.map((n: number, i: number) => n + i)).toStrictEqual(new Collection([ 1, 6, 6, 5, 7, 11 ]));
    });
});

describe('Collection.flatMap()', () => {
    const c = new Collection([ 1, 5, 4, 2, 3, 6 ]);

    test('expects a function argument', () => {
        expect(() => c.flatMap('banana' as unknown as FlatMapperFn<number>)).toThrow();
    });

    test('operates as expected with one argument in passed function and non-array function return', () => {
        expect(c.flatMap((n: number) => n + 1)).toStrictEqual(new Collection([ 2, 6, 5, 3, 4, 7 ]));
    });

    test('operates as expected with one argument in passed function and array function return', () => {
        expect(c.flatMap((n: number) => [ n - 1, n + 1 ])).toStrictEqual(new Collection([ 0, 2, 4, 6, 3, 5, 1, 3, 2, 4, 5, 7 ]));
    });

    test('operates as expected with two arguments in passed function and a mix of array/non-array function return', () => {
        expect(c.flatMap((n: number, i: number) => i % 2 ? n : [ n, n ])).toStrictEqual(new Collection([ 1, 1, 5, 4, 4, 2, 3, 3, 6 ]));
    });

    test('operates as expected with two arguments in passed function and a mix of empty array/non-array function returns', () => {
        expect(c.flatMap((n: number, i: number) => i % 3 ? n : [])).toStrictEqual(new Collection([ 5, 4, 3, 6 ]));
    });
});

describe('Collection.retrograde()', () => {
    test('works with empty Collection', () => {
        expect(new Collection([]).retrograde()).toStrictEqual(new Collection([]));
    });
});

describe('Collection.swapAt()', () => {
    const c = new Collection([ 1, 5, 4, 2, 3, 6 ]);

    test('throws an error when first index out of range', () => {
        expect(() => c.swapAt([ 6, 0 ])).toThrow();
    });

    test('throws an error when second index out of range', () => {
        expect(() => c.swapAt([ 0, 1 ], [ 2, 3 ], [ 4, -7 ])).toThrow();
    });

    test('does nothing when no arguments are passed', () => {
        expect(c.swapAt()).toStrictEqual(c);
    });

    test('swaps a single pair', () => {
        expect(c.swapAt([ -6, -1 ])).toStrictEqual(new Collection([ 6, 5, 4, 2, 3, 1 ]));
    });

    test('swaps pairs in the order specified', () => {
        expect(c.swapAt([ 0, 1 ], [ 1, 2 ], [ 2, 3 ])).toStrictEqual(new Collection([ 5, 4, 2, 1, 3, 6 ]));
    });
});

describe('Collection.splitAt()', () => {
    const c = new Collection([ 1, 5, 4, 2, 3, 6 ]);

    test('with too high index throws an error', () => {
        expect(() => c.splitAt(7)).toThrow();
    });

    test('with too low index throws an error', () => {
        expect(() => c.splitAt([ 1, -8 ])).toThrow();
    });

    const table: [ SeqIndices, number[][] ][] = [
        [ [], [ [ 1, 5, 4, 2, 3, 6 ] ] ],
        [ [ 1 ], [ [ 1 ], [ 5, 4, 2, 3, 6, ] ] ],
        [ [ -2 ], [ [ 1, 5, 4, 2 ], [ 3, 6 ] ] ],
        [ [ 2, 2, 2, 6, 6 ], [ [ 1, 5 ], [], [], [ 4, 2, 3, 6 ], [], [] ] ],
        [ intseq([ 3, 6, 4 ]), [ [ 1, 5, 4 ], [ 2 ], [ 3, 6 ], [] ] ],
        [ [ 6, 2, 0, -1, -3, -5, 4 ], [ [], [ 1 ], [ 5 ], [ 4 ], [ 2 ], [ 3 ], [ 6 ], [] ] ]
    ];

    test.each(table)('split by %s returns expected values', (split, ret) => {
        expect(c.splitAt(split)).toStrictEqual(ret.map(r => new Collection(r)));
    });
});

describe('Collection.partition()', () => {
    const c = new Collection([ 1, 5, 4, 2, 3, 6 ]);

    test('throws when a non-function is passed', () => {
        expect(() => c.partition(500 as unknown as FilterFn<number>)).toThrow();
    });

    const table: [ string, FilterFn<number>, number[], number[] ][] = [
        [ 'all in second collection when function always returns false', v => v > 10, [], [ 1, 5, 4, 2, 3, 6 ] ],
        [ 'all in first collection when function always returns true', () => true, [ 1, 5, 4, 2, 3, 6 ], [] ],
        [ 'mixed collections when function sometimes returns true', (v, i) => v > i, [ 1, 5, 4, 6 ], [ 2, 3 ] ]
    ];

    test.each(table)('%s', (_, fn, ret1, ret2) => {
        const cmp = c.partition(fn);

        expect(cmp[0]).toStrictEqual(new Collection(ret1));
        expect(cmp[1]).toStrictEqual(new Collection(ret2));
    });
});

describe('Collection.groupBy()', () => {
    const c = new Collection([ 1, 5, 4, 2, 3, 6 ]);

    test('throws when a non-function is passed', () => {
        expect(() => c.groupBy(500 as unknown as GrouperFn<number>)).toThrow();
    });

    const table: [ string, GrouperFn<number>, { [k: string]: Collection<number> } ][] = [
        [
            'all in one group when function always returns the same',
            v => v > 10 ? 'pass' : 'fail',
            {
                fail: new Collection([ 1, 5, 4, 2, 3, 6 ]),
            },
        ],
        [
            'works with numeric return values too',
            v => v % 3,
            {
                0: new Collection([ 3, 6 ]),
                1: new Collection([ 1, 4 ]),
                2: new Collection([ 5, 2 ]),
            },
        ],
        [
            'works when using both value and index',
            (v, i) => `value ${(v % 2 ? 'odd' : 'even')}, index ${(i % 2 ? 'odd' : 'even')}`,
            {
                'value odd, index even': new Collection([ 1, 3 ]),
                'value odd, index odd': new Collection([ 5 ]),
                'value even, index even': new Collection([ 4 ]),
                'value even, index odd': new Collection([ 2, 6 ]),
            }
        ]
    ];

    test.each(table)('%s', (_, fn, ret) => {
        expect(c.groupBy(fn)).toStrictEqual(ret);
    });
});

describe('Collection.if()/Collection.then()/Collection.else()', () => {
    const c = new Collection([ 1, 2, 3, 4, 5, 6 ]);

    const errortable = [
        [
            'then() without if()',
            () => c.then(v => v.retrograde()),
        ],
        [
            'else() without if()',
            () => c.else(v => v.retrograde()),
        ],
        [
            'then() after if() ended',
            () => c.if(true)
                .else(v => v.retrograde())
                .clone()
                .then(v => v.retrograde()),
        ],
        [
            'else() after if() ended',
            () => c.if(true)
                .then(v => v.retrograde())
                .clone()
                .else(v => v.retrograde()),
        ],
        [
            'then() with non-function argument',
            () => c.if(true).then(5 as unknown as CtrlTypeFn<Collection<number>>),
        ],
        [
            'else() with non-function argument',
            () => c.if(true).else(5 as unknown as CtrlTypeFn<Collection<number>>),
        ]
    ];

    test.each(errortable)('%s', (_, fn) => {
        expect(fn).toThrow();
    });

    const table: [ string, () => Collection<number>, Collection<number> ][] = [
        [
            'if(false) alone does not change values',
            () => c.if(false),
            c
        ],
        [
            'if(true) alone does not change values',
            () => c.if(true),
            c
        ],
        [
            'if(false) does not execute .then() condition',
            () => c.if(false).then(v => v.swapAt([ 0, 1 ])),
            c
        ],
        [
            'if(false) executes .else() condition',
            () => c.if(false).else(v => v.swapAt([ 0, 1 ])),
            new Collection([ 2, 1, 3, 4, 5, 6 ])
        ],
        [
            'if(true) executes .then() condition',
            () => c.if(true).then(v => v.swapAt([ 0, 1 ])),
            new Collection([ 2, 1, 3, 4, 5, 6 ])
        ],
        [
            'if(true) does not execute .else() condition',
            () => c.if(true).else(v => v.swapAt([ 0, 1 ])),
            c
        ],
        [
            'if(() => false) does not execute .then() condition',
            () => c.if(() => false).then(v => v.swapAt([ 0, 1 ])),
            c
        ],
        [
            'if(() => false) executes .else() condition',
            () => c.if(() => false).else(v => v.swapAt([ 0, 1 ])),
            new Collection([ 2, 1, 3, 4, 5, 6 ])
        ],
        [
            'if(() => true) executes .then() condition',
            () => c.if(() => true).then(v => v.swapAt([ 0, 1 ])),
            new Collection([ 2, 1, 3, 4, 5, 6 ])
        ],
        [
            'if(() => true) does not execute .else() condition',
            () => c.if(() => true).else(v => v.swapAt([ 0, 1 ])),
            c
        ],
        [
            'if().then().else() works as expected #1',
            () => c.if(true)
                .then(v => v.swapAt([ 0, 1 ]))
                .else(v => v.swapAt([ 4, 5 ])),
            new Collection([ 2, 1, 3, 4, 5, 6 ])
        ],
        [
            'if().then().else() works as expected #2',
            () => c.if(() => false)
                .then(v => v.swapAt([ 0, 1 ]))
                .else(v => v.swapAt([ 4, 5 ])),
            new Collection([ 1, 2, 3, 4, 6, 5 ])
        ],
        [
            'if().then().else() works as expected with chained .then()s and else()s #1',
            () => c.if(() => true)
                .then(v => v.swapAt([ 0, 1 ]))
                .else(v => v.swapAt([ 4, 5 ]))
                .then(v => v.swapAt([ 1, 2 ]))
                .else(v => v.swapAt([ 3, 4 ])),
            new Collection([ 2, 3, 1, 4, 5, 6 ])
        ],
        [
            'if().then().else() works as expected with chained .then()s and else()s #2',
            () => c.if(false)
                .then(v => v.swapAt([ 0, 1 ]))
                .else(v => v.swapAt([ 4, 5 ]))
                .then(v => v.swapAt([ 1, 2 ]))
                .else(v => v.swapAt([ 3, 4 ])),
            new Collection([ 1, 2, 3, 6, 4, 5 ])
        ],
        [
            'nested conditions work as expected #1',
            () => c.if(true)
                .then(
                    v => v.if(v => v.length === 6)
                        .then(v => v.swapAt([ 0, 1 ]))
                        .then(v => v.swapAt([ 1, 2 ]))
                        .else(v => v.swapAt([ 4, 5 ]))
                        .retrograde()
                ).else(
                    v => v.if(v => v.length === 6)
                        .then(v => v.swapAt([ 0, 5 ]))
                        .else(v => v.swapAt([ 2, 3 ]))
                        .else(v => v.drop())
                ),
            new Collection([ 6, 5, 4, 1, 3, 2 ]),
        ],
        [
            'nested conditions work as expected #2',
            () => c.if(() => false)
                .then(
                    v => v.if(true)
                        .then(v => v.swapAt([ 0, 1 ]))
                        .then(v => v.swapAt([ 1, 2 ]))
                        .else(v => v.swapAt([ 4, 5 ]))
                        .retrograde()
                ).else(
                    v => v.if(true)
                        .then(v => v.swapAt([ 0, 5 ]))
                        .else(v => v.swapAt([ 2, 3 ]))
                        .else(v => v.drop())
                ),
            new Collection([ 6, 2, 3, 4, 5, 1 ]),
        ],
        [
            'nested conditions work as expected #3',
            () => c.if(() => true)
                .then(
                    v => v.if(v => v.length !== 6)
                        .then(v => v.swapAt([ 0, 1 ]))
                        .then(v => v.swapAt([ 1, 2 ]))
                        .else(v => v.swapAt([ 4, 5 ]))
                        .retrograde()
                ).else(
                    v => v.if(v => v.length !== 6)
                        .then(v => v.swapAt([ 0, 5 ]))
                        .else(v => v.swapAt([ 2, 3 ]))
                        .else(v => v.drop())
                ),
            new Collection([ 5, 6, 4, 3, 2, 1 ]),
        ],
        [
            'nested conditions work as expected #4',
            () => c.if(false)
                .then(
                    v => v.if(false)
                        .then(v => v.swapAt([ 0, 1 ]))
                        .then(v => v.swapAt([ 1, 2 ]))
                        .else(v => v.swapAt([ 4, 5 ]))
                        .retrograde()
                ).else(
                    v => v.if(false)
                        .then(v => v.swapAt([ 0, 5 ]))
                        .else(v => v.swapAt([ 2, 3 ]))
                        .else(v => v.drop())
                ),
            new Collection([ 2, 4, 3, 5, 6 ]),
        ],
    ];

    test.each(table)('%s', (_, fn, ret) => {
        expect(fn()).toStrictEqual(ret);
    });
});

describe('Collection.while()/.do() tests', () => {
    const c = new Collection([ 1, 2, 3, 4, 5, 6 ]);

    test('while() with non-function argument fails', () => {
        expect(() => c.while(555 as unknown as CtrlBoolFn<Collection<number>>)).toThrow();
    });

    test('do() with non-function argument fails', () => {
        expect(() => c.do(555 as unknown as CtrlTypeFn<Collection<number>>)).toThrow();
    });

    const table: [ string, () => Collection<number>, Collection<number> ][] = [
        [
            'while() without do() does not change values',
            () => c.while(v => v.length > 3),
            c
        ],
        [
            'while() with do() that evaluates to false does not change values',
            () => c.while(v => v.length > 6).do(v => v.drop()),
            c
        ],
        [
            'while() with do() works as expected',
            () => c.while(v => v.length > 3).do(v => v.drop()),
            new Collection([ 4, 5, 6 ])
        ],
        [
            'while() applies only to the next do()',
            () => c.while(v => v.length > 3)
                .do(v => v.drop())
                .do(v => v.dropRight()),
            new Collection([ 4, 5 ])
        ],
        [
            'nested while().do() works as expected',
            () => c.while(v => v.valAt(0) < 3)
                .do(
                    v => v.while(v => v.length < 10)
                        .do(v => v.appendItems(v.valAt(0)))
                        .drop()
                ),
            new Collection([ 3, 4, 5, 6, 1, 1, 1, 1, 2 ])
        ],
        [
            'do() without while() executes once only',
            () => c.do(v => v.drop()),
            new Collection([ 2, 3, 4, 5, 6 ])
        ],
        [
            'do() with while() that evaluates to false executes once only',
            () => c.do(v => v.drop()).while(v => v.length > 6),
            new Collection([ 2, 3, 4, 5, 6 ])
        ],
        [
            'do() with while() works as expected',
            () => c.do(v => v.drop()).while(v => v.length > 3),
            new Collection([ 4, 5, 6 ])
        ],
        [
            'while() only applies to the most recent do()',
            () => c.do(v => v.dropRight())
                .do(v => v.drop())
                .while(v => v.length > 3),
            new Collection([ 3, 4, 5 ])
        ],
        [
            'while().do().do().while() works as expected',
            () => c.while(v => v.length > 4)
                .do(v => v.drop())
                .do(v => v.appendItems(v.valAt(0)))
                .while(v => v.length < 2),
            new Collection([ 3, 4, 5, 6, 3 ])
        ],
        [
            'while().do().while().do() works as expected',
            () => c.while(v => v.length > 4)
                .do(v => v.drop())
                .while(v => v.length < 6)
                .do(v => v.appendItems(v.valAt(0))),
            new Collection([ 3, 4, 5, 6, 3, 3 ])
        ],
        [
            'do().while().do().while() works as expected',
            () => c.do(v => v.drop())
                .while(v => v.length > 4)
                .do(v => v.appendItems(v.valAt(0)))
                .while(v => v.length < 2),
            new Collection([ 3, 4, 5, 6, 3 ])
        ],
    ];

    test.each(table)('%s', (_, fn, ret) => {
        expect(fn()).toStrictEqual(ret);
    });
});

describe('Collection.pipe()', () => {
    const c = new Collection([ 1, 5, 4 ]);

    test('pipe() with non-Function passed fails', () => {
        expect(() => c.pipe(500 as unknown as ((coll: Collection<number>) => number))).toThrow();
    });

    test('pipe() should return the function return value', () => {
        expect(c.pipe(coll => coll.length)).toEqual(3);
    });
});

describe('Collection.tap()', () => {
    const c = new Collection([ 1, 5, 4 ]);

    test('with non-Function passed fails', () => {
        expect(() => c.tap(500 as unknown as ((coll: Collection<number>) => number))).toThrow();
    });

    test('should run the function and return itself', () => {
        let len;

        expect(c.tap(coll => len = coll.length )).toBe(c);
        expect(len).toEqual(3);
    });
});

describe('Collection.each()', () => {
    const c = new Collection([ 1, 5, 4 ]);

    test('with non-Function passed fails', () => {
        expect(() => c.each((500 as unknown as (e: unknown) => void))).toThrow();
    });

    test('should run the function and return itself', () => {
        let total = 0;

        expect(c.each((e: number) => total += e )).toBe(c);
        expect(total).toEqual(10);
    });
});

describe('Collection.describe()', () => {
    test('empty collection', () => {
        expect(new Collection([]).describe()).toStrictEqual('Collection(length=0)([])');
    });

    test('collection with mixed members', () => {
        expect(new Collection([ 5, [ 6, 7 ], { describe: 'cat', clearly: 'not cat' }, { describe: () => 'ObjectWithDescribe()' } ]).describe())
            .toStrictEqual('Collection(length=4)([0: 5,1: [6,7],2: {"describe":"cat","clearly":"not cat"},3: ObjectWithDescribe(),])');
    });
});