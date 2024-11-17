import type { SeqMemberArgument } from '../../types';

import NumSeqMember from './number';
import NoteSeqMember from './note';
import ChordSeqMember from './chord';
import MelodyMember from './melody';

describe('ChordSeqMember.toPitch()', () => {
    const errortable: [ string, SeqMemberArgument ][] = [
        [ 'a string', 'foobar' as unknown as SeqMemberArgument ],
        [ 'an array with a string', [ 'foobar '] as unknown as SeqMemberArgument ],
    ];

    test.each(errortable)('passing %s throws an error', (_, val) => {
        expect(() => ChordSeqMember.toPitch(val)).toThrow();
    });

    const table: [ string, SeqMemberArgument, number[] ][] = [
        [ 'a null', null, [] ],
        [ 'an array with zero members', [], [] ],
        [ 'a number', 5, [ 5 ] ],
        [ 'an array with one member', [ 5 ], [ 5 ] ],
        [ 'an array with two members', [ 1, 5 ], [ 1, 5 ] ],
        [ 'a NumSeqMember', NumSeqMember.from(15), [ 15 ] ],
        [ 'a silent NoteSeqMember', NoteSeqMember.from(null), [] ],
        [ 'a non-silent NoteSeqMember', NoteSeqMember.from(5), [ 5 ] ],
        [ 'a silent ChordSeqMember', ChordSeqMember.from(null), [] ],
        [ 'a ChordSeqMember with one member', ChordSeqMember.from([ 15 ]), [ 15 ] ],
        [ 'a ChordSeqMember with two members', ChordSeqMember.from([ 1, 5 ]), [ 1, 5 ] ],
        [ 'a silent MelodyMember', MelodyMember.from(null), [] ],
        [ 'a MelodyMember with one member', MelodyMember.from([ 15 ]), [ 15 ] ],
        [ 'a MelodyMember with two members', MelodyMember.from([ 1, 5 ]), [ 1, 5 ] ],
        [ 'an object containing a valid pitch with two members', { pitch: [ 1, 5 ], duration: 64, velocity: 64 }, [ 1, 5 ] ],
        [ 'an object containing a silent ChordSeqMember', { pitch: ChordSeqMember.from(null), duration: 64, velocity: 64 }, [] ],
        [ 'an object containing a ChordSeqMember with one member', { pitch: ChordSeqMember.from([ 15 ]), duration: 64, velocity: 64 }, [ 15 ] ],
    ];

    test.each(table)('passing %s extracts expected value', (_, val, ret) => {
        expect(ChordSeqMember.toPitch(val)).toStrictEqual(ret);
    });
});

describe('ChordSeqMember.from() static method tests', () => {
    const errortable: [ string, SeqMemberArgument ][] = [
        [ 'a string', 'foobar' as unknown as SeqMemberArgument ],
        [ 'an array with a string', [ 'foobar '] as unknown as SeqMemberArgument ],
        [ 'an object containing an invalid pitch', { pitch: [ 'string' as unknown as number ], duration: 64, velocity: 64 }],
    ];

    test.each(errortable)('creating from %s throws an error', (_, val) => {
        expect(() => ChordSeqMember.from(val)).toThrow();
    });

    const table: [ string, SeqMemberArgument, number[] ][] = [
        [ 'a null', null, [] ],
        [ 'a number', 5, [ 5 ] ],
        [ 'an array with zero members', [], [] ],
        [ 'an array with one member', [ 5 ], [ 5 ] ],
        [ 'an array with two members', [ 1, 5 ], [ 1, 5 ] ],
        [ 'a NumSeqMember', NumSeqMember.from(15), [ 15 ] ],
        [ 'a silent NoteSeqMember', NoteSeqMember.from(null), [] ],
        [ 'a non-silent NoteSeqMember', NoteSeqMember.from(5), [ 5 ] ],
        [ 'a silent ChordSeqMember', ChordSeqMember.from(null), [] ],
        [ 'a ChordSeqMember with one member', ChordSeqMember.from([ 15 ]), [ 15 ] ],
        [ 'a ChordSeqMember with two members', ChordSeqMember.from([ 1, 5 ]), [ 1, 5 ] ],
        [ 'a silent MelodyMember', MelodyMember.from(null), [] ],
        [ 'a MelodyMember with one member', MelodyMember.from([ 15 ]), [ 15 ] ],
        [ 'a MelodyMember with two members', MelodyMember.from([ 1, 5 ]), [ 1, 5 ] ],
        [ 'an object containing a pitch array with no members', { pitch: [], duration: 64, velocity: 64 }, [] ],
        [ 'an object containing a pitch array with one member', { pitch: [ 15 ], duration: 64, velocity: 64 }, [ 15 ] ],
        [ 'an object containing a pitch array with two members', { pitch: ChordSeqMember.from([ 1, 5 ]), duration: 64, velocity: 64 }, [ 1, 5 ] ],
        [ 'an object containing a silent ChordSeqMember', { pitch: ChordSeqMember.from(null), duration: 64, velocity: 64 }, [] ],
        [ 'an object containing a ChordSeqMember with one member', { pitch: ChordSeqMember.from([ 15 ]), duration: 64, velocity: 64 }, [ 15 ] ],
        [ 'an object containing a ChordSeqMember with two members', { pitch: ChordSeqMember.from([ 1, 5 ]), duration: 64, velocity: 64 }, [ 1, 5 ] ],
    ];

    test.each(table)('passing %s creates frozen ChordSeqMember as expected', (_, val, ret) => {
        const cm = ChordSeqMember.from(val);

        expect(cm).toStrictEqual(ChordSeqMember.from(ret));
        expect(Object.isFrozen(cm)).toBe(true);
        expect(Object.isFrozen(cm['_val'])).toBe(true);
    });
});

describe('ChordSeqMember constructor/.val()/.pitches()/.toJSON() tests', () => {
    const errortable: [ string, SeqMemberArgument, ][] = [
        [ 'undefined passed', undefined as unknown as SeqMemberArgument ],
        [ 'array containing a string passed', [ 1, '7' as unknown as number, 13 ] ],
        [ 'array containing an array passed', [ 1, 7, [ 13 ] as unknown as number ] ],
        [ 'string passed', '1' as unknown as number ],
        [ 'empty object passed', {} as SeqMemberArgument ],
        [ 'array containing an empty object passed', [ {} ] as SeqMemberArgument ],
    ];

    test.each(errortable)('fails to construct when %s', (_, val) => {
        expect(() => ChordSeqMember.from(val)).toThrow();
    });

    const table: [ string, SeqMemberArgument, number[]][] = [
        [ 'null is passed', null, [] ],
        [ 'a number is passed', -1, [ -1 ] ],
        [ 'an empty array is passed', [], [] ],
        [ 'float passed', 1.5, [ 1.5 ] ],
        [ 'array containing a float passed', [ 1.5, 7, 13 ], [ 1.5, 7, 13 ] ],
        [ 'ChordSeqMember passed', ChordSeqMember.from([ 3, 2 ]), [ 2, 3 ] ],
        [ 'NumSeqMember passed', new NumSeqMember(1), [ 1 ] ],
        [ 'array containing -0 passed', [ 0, -0, 1 ], [ 0, -0, 1 ] ],
    ];

    test.each(table)('constructs as expected when %s', (_, v, ret) => {
        const chord = ChordSeqMember.from(v);

        expect(chord.val()).toEqual(ret);
        expect(chord.pitches()).toEqual(ret);
        expect(chord.toJSON()).toEqual(ret);
        expect(Object.isFrozen(chord)).toBe(true);
    });
});

describe('ChordSeqMember.numericValue() tests', () => {
    test('ChordSeqMember.numericValue() for zero values throws', () => {
        expect(() => ChordSeqMember.from([]).numericValue()).toThrow();
    });

    test('ChordSeqMember.numericValue() for one value works', () => {
        expect(ChordSeqMember.from([ 5 ]).numericValue()).toEqual(5);
    });

    test('ChordSeqMember.numericValue() for two values throws', () => {
        expect(() => ChordSeqMember.from([ 5, 6 ]).numericValue()).toThrow();
    });
});

describe('ChordSeqMember.nullableNumericValue() tests', () => {
    test('ChordSeqMember.nullableNumericValue() for zero values works', () => {
        expect(ChordSeqMember.from([]).nullableNumericValue()).toEqual(null);
    });

    test('ChordSeqMember.nullableNumericValue() for one value works', () => {
        expect(ChordSeqMember.from([ 5 ]).nullableNumericValue()).toEqual(5);
    });

    test('ChordSeqMember.nullableNumericValue() for two values throws', () => {
        expect(() => ChordSeqMember.from([ 5, 6 ]).nullableNumericValue()).toThrow();
    });
});

describe('ChordSeqMember.mapPitches() tests', () => {
    test('ChordSeqMember.mapPitches() handles empty chord events', () => {
        expect(ChordSeqMember.from([]).mapPitches(v => v + 1))
            .toEqual(ChordSeqMember.from([]));
    });

    test('ChordSeqMember.mapPitches() handles one-to-one functions', () => {
        expect(ChordSeqMember.from([ -1, 5, 7 ]).mapPitches(v => v + 1))
            .toEqual(ChordSeqMember.from([ 0, 6, 8 ]));
    });

    test('ChordSeqMember.mapPitches() handles one-to-none functions', () => {
        expect(ChordSeqMember.from([ -1, 5, 7 ]).mapPitches(v => v > 0 ? v + 1 : null))
            .toEqual(ChordSeqMember.from([ 6, 8 ]));
    });

    test('ChordSeqMember.mapPitches() handles one-to-many functions', () => {
        expect(ChordSeqMember.from([ 2, 3, 4 ]).mapPitches(v => [ v - 1, v, v + 1 ]))
            .toEqual(ChordSeqMember.from([ 1, 2, 3, 2, 3, 4, 3, 4, 5 ]));
    });

    test('ChordSeqMember.mapPitches() handles all types of values', () => {
        expect(ChordSeqMember.from([ 0, 1, 2 ]).mapPitches(v => {
            switch (v) {
            case 0: return 5;
            case 1: return null;
            default: return [ 4, 3, 2 ];
            }
        })).toEqual(ChordSeqMember.from([ 5, 4, 3, 2 ]));
    });
});

describe('ChordSeqMember.equals() tests', () => {
    const table: [ number[], number[], boolean ][] = [
        [ [], [], true ],
        [ [], [ 0 ], false ],
        [ [ 0 ], [ 0 ], true ],
        [ [ 0 ], [ 0, 0 ], false ],
        [ [ 1, 7, -1 ], [ 1, 7, -1 ], true ],
        [ [ 1, 7, -1 ], [ 7, 1, -1 ], true ],
        [ [ 1, 7, -1 ], [ 1, 7, 1 ], false ]
    ];

    test.each(table)('ChordSeqMember(%p).equals(ChordSeqMember(%p))', (a, b, ret) => {
        expect(ChordSeqMember.from(a).equals(new ChordSeqMember(b))).toBe(ret);
    });

    test('ChordSeqMember.equals() non-ChordSeqMember', () => {
        expect(ChordSeqMember.from([ 1 ]).equals([ 1 ] as unknown as ChordSeqMember)).toBe(false);
        expect(ChordSeqMember.from([ 1 ]).equals(new NumSeqMember(1))).toBe(false);
    });
});

describe('ChordSeqMember.validate() tests', () => {
    const fn = (v: number) => v !== 1;

    test('does not run test when values are empty', () => {
        expect(ChordSeqMember.from([]).validate(fn)).toBe(true);
    });

    test('passing test', () => {
        expect(ChordSeqMember.from([ 0, 3, 4 ]).validate(fn)).toBe(true);
    });

    test('failing test', () => {
        expect(ChordSeqMember.from([ 1, 2, 6 ]).validate(fn)).toBe(false);
    });
});

describe('ChordSeqMember.describe() tests', () => {
    test('describes correctly', () => {
        expect(ChordSeqMember.from([14,15,16]).describe()).toStrictEqual('ChordSeqMember([14,15,16])');
        expect(ChordSeqMember.from(null).describe()).toStrictEqual('ChordSeqMember([])');
    });
});