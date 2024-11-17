import type { SeqMemberArgument } from '../../types';

import type SeqMember from './generic';

import NumSeqMember from './number';
import NoteSeqMember from './note';
import ChordSeqMember from './chord';
import MelodyMember from './melody';

describe('NumSeqMember.toPitch() static method tests', () => {
    const errortable: [ string, SeqMemberArgument ][] = [
        [ 'a null', null ],
        [ 'a string', 'foobar' as unknown as SeqMemberArgument ],
        [ 'an array with zero members', [] ],
        [ 'an array with a string', [ 'foobar '] as unknown as SeqMemberArgument ],
        [ 'an array with two members', [ 1, 5 ] ],
        [ 'a silent NoteSeqMember', NoteSeqMember.from(null) ],
        [ 'a silent ChordSeqMember', ChordSeqMember.from(null) ],
        [ 'a ChordSeqMember with two members', ChordSeqMember.from([ 1, 5 ])],
        [ 'a silent MelodyMember', MelodyMember.from(null) ],
        [ 'a MelodyMember with two members', MelodyMember.from([ 1, 5 ])],
        [ 'an object containing an invalid pitch', { pitch: [ 'string' as unknown as number ], duration: 64, velocity: 64 }],
        [ 'an object containing a silent ChordSeqMember', { pitch: ChordSeqMember.from(null), duration: 64, velocity: 64 } ],
    ];

    test.each(errortable)('passing %s throws an error', (_, val) => {
        expect(() => NumSeqMember.toPitch(val)).toThrow();
    });

    const table: [ string, SeqMemberArgument, number ][] = [
        [ 'a number', 5, 5 ],
        [ 'an array with one member', [ 5 ], 5 ],
        [ 'a NumSeqMember', NumSeqMember.from(15), 15 ],
        [ 'a non-silent NoteSeqMember', NoteSeqMember.from(5), 5 ],
        [ 'a ChordSeqMember with one member', ChordSeqMember.from([ 15 ]), 15 ],
        [ 'a MelodyMember with one member', MelodyMember.from([ 15 ]), 15 ],
        [ 'an object containing a valid pitch', { pitch: [ 15 ], duration: 64, velocity: 64 }, 15 ],
        [ 'an object containing a ChordSeqMember with one member', { pitch: ChordSeqMember.from([ 15 ]), duration: 64, velocity: 64 }, 15 ],
    ];

    test.each(table)('passing %s extracts expected value', (_, val, ret) => {
        expect(NumSeqMember.toPitch(val)).toStrictEqual(ret);
    });
});

describe('NumSeqMember.from() static method tests', () => {
    const errortable: [ string, SeqMemberArgument ][] = [
        [ 'a null', null ],
        [ 'a string', 'foobar' as unknown as SeqMemberArgument ],
        [ 'an array with zero members', [] ],
        [ 'an array with a string', [ 'foobar '] as unknown as SeqMemberArgument ],
        [ 'an array with two members', [ 1, 5 ] ],
        [ 'a silent NoteSeqMember', NoteSeqMember.from(null) ],
        [ 'a silent ChordSeqMember', ChordSeqMember.from(null) ],
        [ 'a ChordSeqMember with two members', ChordSeqMember.from([ 1, 5 ])],
        [ 'a silent MelodyMember', MelodyMember.from(null) ],
        [ 'a MelodyMember with two members', MelodyMember.from([ 1, 5 ]) ],
        [ 'an object containing an invalid pitch', { pitch: [ 'string' as unknown as number ], duration: 64, velocity: 64 }],
        [ 'an object containing a pitch array with no members', { pitch: [ ], duration: 64, velocity: 64 } ],
        [ 'an object containing a pitch array with two members', { pitch: [ 1, 5 ], duration: 64, velocity: 64 } ],
        [ 'an object containing a silent ChordSeqMember', { pitch: ChordSeqMember.from(null), duration: 64, velocity: 64 } ],
        [ 'an object containing a ChordSeqMember with two members', { pitch: ChordSeqMember.from([ 1, 5 ]), duration: 64, velocity: 64 } ],
    ];

    test.each(errortable)('creating from %s throws an error', (_, val) => {
        expect(() => NumSeqMember.from(val)).toThrow();
    });

    const table: [ string, SeqMemberArgument, number ][] = [
        [ 'a number', 5, 5 ],
        [ 'an array with one member', [ 5 ], 5 ],
        [ 'a NumSeqMember', NumSeqMember.from(15), 15 ],
        [ 'a non-silent NoteSeqMember', NoteSeqMember.from(5), 5 ],
        [ 'a ChordSeqMember with one member', ChordSeqMember.from([ 15 ]), 15 ],
        [ 'a MelodyMember with one member', MelodyMember.from([ 15 ]), 15 ],
        [ 'an object containing a pitch array with one member', { pitch: [ 15 ], duration: 64, velocity: 64 }, 15 ],
        [ 'an object containing a ChordSeqMember with one member', { pitch: ChordSeqMember.from([ 15 ]), duration: 64, velocity: 64 }, 15 ],
    ];

    test.each(table)('passing %s creates NumSeqMember as expected', (_, val, ret) => {
        expect(NumSeqMember.from(val)).toStrictEqual(new NumSeqMember(ret));
    });
});

describe('NumSeqMember constructor/.val()/.pitches().toJSON() tests', () => {
    const errortable: [ string, null | number | number[] | SeqMember<unknown> ][] = [
        [ 'undefined', undefined as unknown as number ],
        [ 'null', null ],
        [ 'empty array', [] ],
        [ 'string', '1' as unknown as number ],
        [ 'empty object', {} as unknown as number[] ],
        [ 'silent note-event', NoteSeqMember.from(null) ],
        [ 'chord with two notes', ChordSeqMember.from([ 1, 5 ]) ],
        [ 'array containing a non-numeric value', [ '1' as unknown as number ] ],
    ];

    test.each(errortable)('NumSeqMember constructor throws when passed %j', (_, v) => {
        expect(() => new NumSeqMember(v)).toThrow();
    });

    const table: [ number | number[] | SeqMember<unknown>, number ][] = [
        [ -1, -1 ],
        [ -0, -0 ],
        [ 1.5, 1.5 ],
        [ NumSeqMember.from(1), 1 ],
        [ ChordSeqMember.from([ 1.5 ]), 1.5 ],
        [ [ 1 ], 1 ],
    ];

    describe.each(table)('NumSeqMember constructor %# (%p)', (v, ret) => {
        const n = new NumSeqMember(v);

        test('constructor works', () => {
            expect(Object.isFrozen(n)).toBe(true);
            expect(n.val()).toEqual(ret);
            expect(n.pitches()).toEqual([ ret ]);
            expect(n.toJSON()).toEqual(ret);
        });
    });
});

describe('NumSeqMember.numericValue() tests', () => {
    test('NumSeqMember.numericValue() for one value works', () => {
        expect(new NumSeqMember(5).numericValue()).toEqual(5);
    });
});

describe('NumSeqMember.nullableNumericValue() tests', () => {
    test('NumSeqMember.nullableNumericValue() for one value works', () => {
        expect(new NumSeqMember(5).nullableNumericValue()).toEqual(5);
    });
});

describe('NumSeqMember.mapPitches() tests', () => {
    test('mapPitches()', () => {
        expect(new NumSeqMember(1).mapPitches(v => v + 1)).toEqual(new NumSeqMember(2));
    });
});

describe('NumSeqMember.equals() tests', () => {
    test('NumSeqMember.equals() same value NumSeqMember', () => {
        expect(new NumSeqMember(0).equals(new NumSeqMember(0))).toBe(true);
        expect(new NumSeqMember(0).equals(NumSeqMember.from(-0))).toBe(true);
    });

    test('NumSeqMember.equals() different value NumSeqMember returns false', () => {
        expect(new NumSeqMember(1).equals(new NumSeqMember(-1))).toBe(false);
    });

    test('NumSeqMember.equals() non-NumSeqMember returns false', () => {
        expect(new NumSeqMember(1).equals(1 as unknown as NumSeqMember)).toBe(false);
        expect(new NumSeqMember(1).equals(NoteSeqMember.from(1))).toBe(false);
    });
});

describe('NumSeqMember.validate() tests', () => {
    const fn = (v: number) => v !== 1;

    test('passing test', () => {
        expect(new NumSeqMember(0).validate(fn)).toBe(true);
    });

    test('failing test', () => {
        expect(new NumSeqMember(1).validate(fn)).toBe(false);
    });
});

describe('NumSeqMember.describe() tests', () => {
    test('describes correctly', () => {
        expect(NumSeqMember.from(15).describe()).toStrictEqual('NumSeqMember(15)');
    });
});