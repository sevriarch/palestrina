import type { SeqMemberArgument } from '../../types';

import type SeqMember from './generic';

import NumSeqMember from './number';
import NoteSeqMember from './note';
import ChordSeqMember from './chord';
import MelodyMember from './melody';

describe('NoteSeqMember.toPitch() static method tests', () => {
    const errortable: [ string, SeqMemberArgument ][] = [
        [ 'a string', 'foobar' as unknown as SeqMemberArgument ],
        [ 'an array with a string', [ 'foobar '] as unknown as SeqMemberArgument ],
        [ 'an array with two members', [ 1, 5 ] ],
        [ 'a ChordSeqMember with two members', ChordSeqMember.from([ 1, 5 ])],
        [ 'a MelodyMember with two members', MelodyMember.from([ 1, 5 ])],
        [ 'an object containing a ChordSeqMember with two members', { pitch: ChordSeqMember.from([ 1, 5 ]), duration: 64, velocity: 64 } ],
    ];

    test.each(errortable)('passing %s throws an error', (_, val) => {
        expect(() => NoteSeqMember.toPitch(val)).toThrow();
    });

    const table: [ string, SeqMemberArgument, null | number ][] = [
        [ 'a null', null, null ],
        [ 'an array with zero members', [], null ],
        [ 'a number', 5, 5 ],
        [ 'an array with one member', [ 5 ], 5 ],
        [ 'a NumSeqMember', NumSeqMember.from(15), 15 ],
        [ 'a silent NoteSeqMember', NoteSeqMember.from(null), null ],
        [ 'a non-silent NoteSeqMember', NoteSeqMember.from(5), 5 ],
        [ 'a silent ChordSeqMember', ChordSeqMember.from(null), null ],
        [ 'a ChordSeqMember with one member', ChordSeqMember.from([ 15 ]), 15 ],
        [ 'a silent MelodyMember', MelodyMember.from(null), null ],
        [ 'a MelodyMember with one member', MelodyMember.from([ 15 ]), 15 ],
        [ 'an object containing a valid pitch', { pitch: [ 15 ], duration: 64, velocity: 64 }, 15 ],
        [ 'an object containing a silent ChordSeqMember', { pitch: ChordSeqMember.from(null), duration: 64, velocity: 64 }, null ],
        [ 'an object containing a ChordSeqMember with one member', { pitch: ChordSeqMember.from([ 15 ]), duration: 64, velocity: 64 }, 15 ],
    ];

    test.each(table)('passing %s extracts expected value', (_, val, ret) => {
        expect(NoteSeqMember.toPitch(val)).toStrictEqual(ret);
    });
});

describe('NoteSeqMember.from() static method tests', () => {
    const errortable: [ string, SeqMemberArgument ][] = [
        [ 'a string', 'foobar' as unknown as SeqMemberArgument ],
        [ 'an array with a string', [ 'foobar '] as unknown as SeqMemberArgument ],
        [ 'an array with two members', [ 1, 5 ] ],
        [ 'a ChordSeqMember with two members', ChordSeqMember.from([ 1, 5 ])],
        [ 'a MelodyMember with two members', MelodyMember.from([ 1, 5 ]) ],
        [ 'an object containing an invalid pitch', { pitch: [ 'string' as unknown as number ], duration: 64, velocity: 64 }],
        [ 'an object containing a pitch array with two members', { pitch: ChordSeqMember.from([ 1, 5 ]), duration: 64, velocity: 64 } ],
        [ 'an object containing a ChordSeqMember with two members', { pitch: ChordSeqMember.from([ 1, 5 ]), duration: 64, velocity: 64 } ],
    ];

    test.each(errortable)('creating from %s throws an error', (_, val) => {
        expect(() => NoteSeqMember.from(val)).toThrow();
    });

    const table: [ string, SeqMemberArgument, null | number ][] = [
        [ 'a null', null, null ],
        [ 'a number', 5, 5 ],
        [ 'an array with zero members', [], null ],
        [ 'an array with one member', [ 5 ], 5 ],
        [ 'a NumSeqMember', NumSeqMember.from(15), 15 ],
        [ 'a silent NoteSeqMember', NoteSeqMember.from(null), null ],
        [ 'a non-silent NoteSeqMember', NoteSeqMember.from(5), 5 ],
        [ 'a silent ChordSeqMember', ChordSeqMember.from(null), null ],
        [ 'a ChordSeqMember with one member', ChordSeqMember.from([ 15 ]), 15 ],
        [ 'a silent MelodyMember', MelodyMember.from(null), null ],
        [ 'a MelodyMember with one member', MelodyMember.from([ 15 ]), 15 ],
        [ 'an object containing a pitch array with no members', { pitch: [], duration: 64, velocity: 64 }, null ],
        [ 'an object containing a pitch array with one member', { pitch: [ 15 ], duration: 64, velocity: 64 }, 15 ],
        [ 'an object containing a silent ChordSeqMember', { pitch: ChordSeqMember.from(null), duration: 64, velocity: 64 }, null ],
        [ 'an object containing a ChordSeqMember with one member', { pitch: ChordSeqMember.from([ 15 ]), duration: 64, velocity: 64 }, 15 ],
    ];

    test.each(table)('passing %s creates NoteSeqMember as expected', (_, val, ret) => {
        expect(NoteSeqMember.from(val)).toStrictEqual(new NoteSeqMember(ret));
    });
});

describe('NoteSeqMember constructor/.val()/.pitches().toJSON() tests', () => {
    const errortable: [ string, null | number | number[] | SeqMember<unknown> ][] = [
        [ 'undefined', undefined as unknown as number ],
        [ 'string', '1' as unknown as number ],
        [ 'empty object', {} as unknown as number[] ],
        [ 'chord with two notes', ChordSeqMember.from([ 1, 5 ]) ],
        [ 'array containing a non-numeric value', [ '1' as unknown as number ] ],
    ];

    test.each(errortable)('NoteSeqMember constructor throws when passed %j', (_, v) => {
        expect(() => new NoteSeqMember(v)).toThrow();
    });

    const table: [ null | number | number[] | SeqMember<unknown>, null | number ][] = [
        [ null, null ],
        [ [], null ],
        [ -1, -1 ],
        [ -0, -0 ],
        [ NoteSeqMember.from(null), null ],
        [ NumSeqMember.from(1), 1 ],
        [ ChordSeqMember.from([ 1.5 ]), 1.5 ],
        [ [ 1 ], 1 ],
    ];

    describe.each(table)('NoteSeqMember constructor %# (%p)', (v, ret) => {
        const n = new NoteSeqMember(v);

        test('constructor works', () => {
            expect(Object.isFrozen(n)).toBe(true);
            expect(n.val()).toEqual(ret);
            expect(n.pitches()).toEqual(ret === null ? [] : [ ret ]);
            expect(n.toJSON()).toEqual(ret);
        });
    });
});

describe('NoteSeqMember.numericValue() tests', () => {
    test('NoteSeqMember.numericValue() for null throws', () => {
        expect(() => new NoteSeqMember(null).numericValue()).toThrow();
    });

    test('NoteSeqMember.numericValue() for one value works', () => {
        expect(new NoteSeqMember(5).numericValue()).toEqual(5);
    });
});

describe('NoteSeqMember.nullableNumericValue() tests', () => {
    test('NoteSeqMember.nullableNumericValue() for null works', () => {
        expect(new NoteSeqMember(null).nullableNumericValue()).toEqual(null);
    });

    test('NoteSeqMember.nullableNumericValue() for one value works', () => {
        expect(new NoteSeqMember(5).nullableNumericValue()).toEqual(5);
    });
});

describe('NoteSeqMember.mapPitches() tests', () => {
    test('mapPitches() non-null', () => {
        expect(new NoteSeqMember(1).mapPitches(v => v + 1)).toEqual(new NoteSeqMember(2));
    });

    test('mapPitches() null', () => {
        expect(new NoteSeqMember(null).mapPitches(v => v + 1)).toEqual(new NoteSeqMember(null));
    });
});

describe('NoteSeqMember.equals() tests', () => {
    const table: [ null | number, null | number, boolean ][] = [
        [ null, null, true ],
        [ null, 0, false ],
        [ 0, null, false ],
        [ 0, 0, true ],
        [ 1, -1, false ],
        [ 1, 1, true ]
    ];

    test.each(table)('%p.equals(NoteSeqMember(%p)) returns %p', (a, b, ret) => {
        expect(new NoteSeqMember(a).equals(NoteSeqMember.from(b))).toBe(ret);
    });

    test('NoteSeqMember.equals() non-NoteSeqMember return false', () => {
        expect(new NoteSeqMember(1).equals(1 as unknown as NoteSeqMember)).toBe(false);
        expect(new NoteSeqMember(1).equals(NumSeqMember.from(1))).toBe(false);
    });
});

describe('NoteSeqMember.validate() tests', () => {
    const fn = (v: number) => v !== 1;

    test('does not run test when value is null', () => {
        expect(new NoteSeqMember(0).validate(fn)).toBe(true);
    });

    test('passing test', () => {
        expect(new NoteSeqMember(0).validate(fn)).toBe(true);
    });

    test('failing test', () => {
        expect(new NoteSeqMember(1).validate(fn)).toBe(false);
    });
});

describe('NoteSeqMember.describe() tests', () => {
    test('describes correctly', () => {
        expect(NoteSeqMember.from(15).describe()).toStrictEqual('NoteSeqMember(15)');
        expect(NoteSeqMember.from(null).describe()).toStrictEqual('NoteSeqMember(null)');
    });
});