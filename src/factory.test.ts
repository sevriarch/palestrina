import type { SeqArgument } from './types';

import * as fs from 'fs';

import * as factory from './factory';

import type NumSeqMember from './sequences/members/number';
import type NoteSeqMember from './sequences/members/note';
import type ChordSeqMember from './sequences/members/chord';
import MelodyMember from './sequences/members/melody';

import NumSeq from './sequences/number';
import NoteSeq from './sequences/note';
import ChordSeq from './sequences/chord';
import Melody from './sequences/melody';
import Score from './scores/score';

import MetaList from './meta-events/meta-list';

// Mocking fs is ugly but without it jest.spyOn(fs, 'readFileSync') doesn't work
// in TypeScript, throwing: TypeError: Cannot redefine property: readFileSync
// See: https://github.com/aelbore/esbuild-jest/issues/26
jest.mock('fs', () => {
    const rawfs = jest.requireActual('fs');

    return {
        ...rawfs,
        readFileSync: jest.fn()
    };
});

describe('factory.intseq() tests', () => {
    test('throws when no arguments are passed', () => {
        expect(() => factory.intseq(undefined as unknown as SeqArgument)).toThrow();
    });

    test('throws when passed garbage', () => {
        expect(() => factory.intseq([ 'fard', 5 ] as SeqArgument)).toThrow();
    });

    test('correctly builds an empty intseq', () => {
        const seq = factory.intseq([]);

        expect(seq).toBeInstanceOf(NumSeq);
        expect(seq.val()).toStrictEqual([]);
    });

    test('correctly builds from an array of numbers, with metadata', () => {
        const seq = factory.intseq([ 4, 2, 3, 4 ], { copyright: 'test' });

        expect(seq).toBeInstanceOf(NumSeq);
        expect(seq.toNumericValues()).toStrictEqual([ 4, 2, 3, 4 ]);
        expect(seq.metadata.copyright).toEqual('test');
    });

    test('correctly builds from an array of arrays of numbers', () => {
        const seq = factory.intseq([ [ 4 ], [ 2 ], [ 3 ], [ 4 ] ]);

        expect(seq).toBeInstanceOf(NumSeq);
        expect(seq.toNumericValues()).toStrictEqual([ 4, 2, 3, 4 ]);
    });

    test('fails to build if value missing', () => {
        expect(() => factory.intseq([ [ 1 ], [ 2 ], [ 3 ], [] ])).toThrow();
    });

    test('fails to build if duplicate value exists', () => {
        expect(() => factory.intseq([ [ 1 ], [ 2, 3 ] ])).toThrow();
    });

    test('fails to build if non-int value exists', () => {
        expect(() => factory.intseq([ 1, 2, 3, 4.4 ])).toThrow();
    });

    test('builds from an intseq', () => {
        const seq = factory.intseq([ 4, 2, 3, 4 ]).toNumSeq();

        expect(seq).toBeInstanceOf(NumSeq);
        expect(seq.toNumericValues()).toStrictEqual([ 4, 2, 3, 4 ]);
    });

    test('builds from a floatseq', () => {
        const seq = factory.floatseq([ 4, 2, 3, 4 ]).toNumSeq();

        expect(seq).toBeInstanceOf(NumSeq);
        expect(seq.toNumericValues()).toStrictEqual([ 4, 2, 3, 4 ]);
    });

    test('builds from a noteseq', () => {
        const seq = factory.noteseq([ 4, 2, 3, 4 ]).toNumSeq();

        expect(seq).toBeInstanceOf(NumSeq);
        expect(seq.toNumericValues()).toStrictEqual([ 4, 2, 3, 4 ]);
    });

    test('builds from a chordseq', () => {
        const seq = factory.chordseq([ 4, 2, 3, 4 ]).toNumSeq();

        expect(seq).toBeInstanceOf(NumSeq);
        expect(seq.toNumericValues()).toStrictEqual([ 4, 2, 3, 4 ]);
    });

    test('builds from a melody', () => {
        const seq = factory.melody([ 4, 2, 3, 4 ]).toNumSeq();

        expect(seq).toBeInstanceOf(NumSeq);
        expect(seq.toNumericValues()).toStrictEqual([ 4, 2, 3, 4 ]);
    });

    test('builds through multiple conversions, with metadata', () => {
        const seq = factory.intseq([ 4, 2, 3, 4 ], { copyright: 'test' }).toNoteSeq().toChordSeq().toMelody().toNumSeq();

        expect(seq).toBeInstanceOf(NumSeq);
        expect(seq.toNumericValues()).toStrictEqual([ 4, 2, 3, 4 ]);
        expect(seq.metadata.copyright).toEqual('test');
    });

    test('contents are a copy of the passed argument', () => {
        const src: NumSeqMember[] = [];
        const seq = factory.intseq(src);

        expect(seq.contents).toStrictEqual(src);
        expect(seq.contents).not.toBe(src);
    });
});

describe('factory.floatseq() tests', () => {
    test('throws when no arguments are passed', () => {
        expect(() => factory.floatseq(undefined as unknown as SeqArgument)).toThrow();
    });

    test('throws when passed garbage', () => {
        expect(() => factory.floatseq([ 'fard', 5 ] as SeqArgument)).toThrow();
    });

    test('correctly builds an empty floatseq', () => {
        const seq = factory.floatseq([]);

        expect(seq).toBeInstanceOf(NumSeq);
        expect(seq.val()).toStrictEqual([]);
    });

    test('correctly builds from an array of numbers, with metadata', () => {
        const seq = factory.floatseq([ 4, 2, 3.6, 4 ], { copyright: 'test' });

        expect(seq).toBeInstanceOf(NumSeq);
        expect(seq.toNumericValues()).toStrictEqual([ 4, 2, 3.6, 4 ]);
        expect(seq.metadata.copyright).toEqual('test');
    });

    test('correctly builds from an array of arrays of numbers', () => {
        const seq = factory.floatseq([ [ 4 ], [ 2 ], [ 3.6 ], [ 4 ] ]);

        expect(seq).toBeInstanceOf(NumSeq);
        expect(seq.toNumericValues()).toStrictEqual([ 4, 2, 3.6, 4 ]);
    });

    test('fails to build if value missing', () => {
        expect(() => factory.floatseq([ [ 1 ], [ 2 ], [ 3.6 ], [] ])).toThrow();
    });

    test('fails to build if duplicate value exists', () => {
        expect(() => factory.floatseq([ [ 1 ], [ 2, 3.6 ] ])).toThrow();
    });

    test('builds from an intseq', () => {
        const seq = factory.intseq([ 4, 2, 3, 4 ]).toNumSeq();

        expect(seq).toBeInstanceOf(NumSeq);
        expect(seq.toNumericValues()).toStrictEqual([ 4, 2, 3, 4 ]);
    });

    test('builds from a floatseq', () => {
        const seq = factory.floatseq([ 4, 2, 3, 4 ]).toNumSeq();

        expect(seq).toBeInstanceOf(NumSeq);
        expect(seq.toNumericValues()).toStrictEqual([ 4, 2, 3, 4 ]);
    });

    test('builds from a noteseq', () => {
        const seq = factory.microtonalnoteseq([ 4, 2, 3.4, 4 ]).toNumSeq();

        expect(seq).toBeInstanceOf(NumSeq);
        expect(seq.toNumericValues()).toStrictEqual([ 4, 2, 3.4, 4 ]);
    });

    test('builds from a chordseq', () => {
        const seq = factory.microtonalchordseq([ 4, 2, 3.4, 4 ]).toNumSeq();

        expect(seq).toBeInstanceOf(NumSeq);
        expect(seq.toNumericValues()).toStrictEqual([ 4, 2, 3.4, 4 ]);
    });

    test('builds from a melody', () => {
        const seq = factory.microtonalmelody([ 4, 2, 3.4, 4 ]).toNumSeq();

        expect(seq).toBeInstanceOf(NumSeq);
        expect(seq.toNumericValues()).toStrictEqual([ 4, 2, 3.4, 4 ]);
    });

    test('builds through multiple conversions, with metadata', () => {
        const seq = factory.floatseq([ 4, 2, 3.4, 4 ], { copyright: 'test' }).toNoteSeq().toChordSeq().toMelody().toNumSeq();

        expect(seq).toBeInstanceOf(NumSeq);
        expect(seq.toNumericValues()).toStrictEqual([ 4, 2, 3.4, 4 ]);
        expect(seq.metadata.copyright).toEqual('test');
    });

    test('contents are a copy of the passed argument', () => {
        const src: NumSeqMember[] = [];
        const seq = factory.floatseq(src);

        expect(seq.contents).toStrictEqual(src);
        expect(seq.contents).not.toBe(src);
    });
});

describe('factory.noteseq() tests', () => {
    test('throws when no arguments are passed', () => {
        expect(() => factory.noteseq(undefined as unknown as SeqArgument)).toThrow();
    });

    test('throws when passed garbage', () => {
        expect(() => factory.noteseq([ 'fard', 5 ] as unknown as SeqArgument));
    });

    test('correctly builds an empty noteseq', () => {
        const seq = factory.noteseq([]);

        expect(seq).toBeInstanceOf(NoteSeq);
        expect(seq.val()).toStrictEqual([]);
    });

    test('correctly builds from an array of numbers, with metadata', () => {
        const seq = factory.noteseq([ 4, null, 3, 4 ], { copyright: 'test' });

        expect(seq).toBeInstanceOf(NoteSeq);
        expect(seq.toNullableNumericValues()).toStrictEqual([ 4, null, 3, 4 ]);
        expect(seq.metadata.copyright).toEqual('test');
    });

    test('correctly builds from an array of arrays of numbers', () => {
        const seq = factory.noteseq([ [ 4 ], [], [ 3 ], [ 4 ] ]);

        expect(seq).toBeInstanceOf(NoteSeq);
        expect(seq.toNullableNumericValues()).toStrictEqual([ 4, null, 3, 4 ]);
    });

    test('fails to build if duplicate value exists', () => {
        expect(() => factory.noteseq([ [ 1 ], [ 2, 3 ] ])).toThrow();
    });

    test('fails to build if non-int value exists', () => {
        expect(() => factory.noteseq([ 1, null, 3, 4.4 ])).toThrow();
    });

    test('builds if non-int value exists, microtonal builder is used', () => {
        const seq = factory.microtonalnoteseq([ 1, null, 3, 4.4 ]);

        expect(seq).toBeInstanceOf(NoteSeq);
        expect(seq.toNullableNumericValues()).toStrictEqual([ 1, null, 3, 4.4 ]);
    });

    test('builds if non-int value exists, microtonal builder is used, with metadata', () => {
        const seq = factory.microtonalnoteseq([ 1, null, 3, 4.4 ], { copyright: 'test' });

        expect(seq).toBeInstanceOf(NoteSeq);
        expect(seq.toNullableNumericValues()).toStrictEqual([ 1, null, 3, 4.4 ]);
        expect(seq.metadata.copyright).toEqual('test');
    });

    test('builds from an intseq', () => {
        const seq = factory.intseq([ 4, 2, 3, 4 ]).toNoteSeq();

        expect(seq).toBeInstanceOf(NoteSeq);
        expect(seq.toNullableNumericValues()).toStrictEqual([ 4, 2, 3, 4 ]);
    });

    test('builds from a floatseq', () => {
        const seq = factory.floatseq([ 4, 2, 3, 4 ]).toNoteSeq();

        expect(seq).toBeInstanceOf(NoteSeq);
        expect(seq.toNullableNumericValues()).toStrictEqual([ 4, 2, 3, 4 ]);
    });

    test('builds from a noteseq', () => {
        const seq = factory.noteseq([ 4, null, 3, 4 ]).toNoteSeq();

        expect(seq).toBeInstanceOf(NoteSeq);
        expect(seq.toNullableNumericValues()).toStrictEqual([ 4, null, 3, 4 ]);
    });

    test('builds from a chordseq', () => {
        const seq = factory.chordseq([ 4, null, 3, 4 ]).toNoteSeq();

        expect(seq).toBeInstanceOf(NoteSeq);
        expect(seq.toNullableNumericValues()).toStrictEqual([ 4, null, 3, 4 ]);
    });

    test('builds from a melody', () => {
        const seq = factory.melody([ 4, null, 3, 4 ]).toNoteSeq();

        expect(seq).toBeInstanceOf(NoteSeq);
        expect(seq.toNullableNumericValues()).toStrictEqual([ 4, null, 3, 4 ]);
    });

    test('builds through multiple conversions, with metadata', () => {
        const seq = factory.noteseq([ 4, 2, 3, 4 ], { copyright: 'test' }).toMelody().toChordSeq().toNumSeq().toNoteSeq();

        expect(seq).toBeInstanceOf(NoteSeq);
        expect(seq.toNullableNumericValues()).toStrictEqual([ 4, 2, 3, 4 ]);
        expect(seq.metadata.copyright).toEqual('test');
    });

    test('contents are a copy of the passed argument', () => {
        const src: NoteSeqMember[] = [];
        const seq = factory.noteseq(src);

        expect(seq.contents).toStrictEqual(src);
        expect(seq.contents).not.toBe(src);
    });
});

describe('factory.chordseq() tests', () => {
    test('throws when no arguments are passed', () => {
        expect(() => factory.chordseq(undefined as unknown as SeqArgument)).toThrow();
    });

    test('throws when passed garbage', () => {
        expect(() => factory.chordseq([ 'fard', 5 ] as SeqArgument)).toThrow();
    });

    test('correctly builds an empty chordseq', () => {
        const seq = factory.chordseq([]);

        expect(seq).toBeInstanceOf(ChordSeq);
        expect(seq.val()).toStrictEqual([]);
    });

    test('correctly builds from an array of numbers, with metadata', () => {
        const seq = factory.chordseq([ 4, 2, 3, 4 ], { copyright: 'test' });

        expect(seq).toBeInstanceOf(ChordSeq);
        expect(seq.toPitches()).toStrictEqual([ [ 4 ], [ 2 ], [ 3 ], [ 4 ] ]);
        expect(seq.metadata.copyright).toEqual('test');
    });

    test('correctly builds from an array of arrays of numbers', () => {
        const seq = factory.chordseq([ [ 4 ], [], [ 2, 3 ], [ 4 ] ]);

        expect(seq).toBeInstanceOf(ChordSeq);
        expect(seq.toPitches()).toStrictEqual([ [ 4 ], [], [ 2, 3 ], [ 4 ] ]);
    });

    test('fails to build if non-int value exists', () => {
        expect(() => factory.chordseq([ 1, null, 3, 4.4 ])).toThrow();
    });

    test('builds if non-int value exists and microtonal builder is used', () => {
        const seq = factory.microtonalchordseq([ 1, null, 3, 4.4 ]);

        expect(seq).toBeInstanceOf(ChordSeq);
        expect(seq.toPitches()).toStrictEqual([ [ 1 ], [], [ 3 ], [ 4.4 ] ]);
    });

    test('builds if non-int value exists and microtonal builder is used, with metadata', () => {
        const seq = factory.microtonalchordseq([ 1, null, 3, 4.4 ], { copyright: 'test' });

        expect(seq).toBeInstanceOf(ChordSeq);
        expect(seq.toPitches()).toStrictEqual([ [ 1 ], [], [ 3 ], [ 4.4 ] ]);
        expect(seq.metadata.copyright).toEqual('test');
    });

    test('builds from an intseq', () => {
        const seq = factory.intseq([ 4, 2, 3, 4 ]).toChordSeq();

        expect(seq).toBeInstanceOf(ChordSeq);
        expect(seq.toPitches()).toStrictEqual([ [ 4 ], [ 2 ], [ 3 ], [ 4 ] ]);
    });

    test('builds from a floatseq', () => {
        const seq = factory.floatseq([ 4, 2, 3, 4 ]).toChordSeq();

        expect(seq).toBeInstanceOf(ChordSeq);
        expect(seq.toPitches()).toStrictEqual([ [ 4 ], [ 2 ], [ 3 ], [ 4 ] ]);
    });

    test('builds from a noteseq', () => {
        const seq = factory.noteseq([ 4, null, 3, 4 ]).toChordSeq();

        expect(seq).toBeInstanceOf(ChordSeq);
        expect(seq.toPitches()).toStrictEqual([ [ 4 ], [], [ 3 ], [ 4 ] ]);
    });

    test('builds from a chordseq', () => {
        const seq = factory.chordseq([ [ 4 ], [], [ 2, 3 ], [ 4 ] ]).toChordSeq();

        expect(seq).toBeInstanceOf(ChordSeq);
        expect(seq.toPitches()).toStrictEqual([ [ 4 ], [], [ 2, 3 ], [ 4 ] ]);
    });

    test('builds from a melody', () => {
        const seq = factory.melody([ [ 4 ], [], [ 2, 3 ], [ 4 ] ]).toChordSeq();

        expect(seq).toBeInstanceOf(ChordSeq);
        expect(seq.toPitches()).toStrictEqual([ [ 4 ], [], [ 2, 3 ], [ 4 ] ]);
    });

    test('builds through multiple conversions, with metadata', () => {
        const seq = factory.chordseq([ 4, 2, 3, 4 ], { copyright: 'test' }).toNoteSeq().toNumSeq().toMelody().toChordSeq();

        expect(seq).toBeInstanceOf(ChordSeq);
        expect(seq.toPitches()).toStrictEqual([ [ 4 ], [ 2 ], [ 3 ], [ 4 ] ]);
        expect(seq.metadata.copyright).toEqual('test');
    });

    test('contents are a copy of the passed argument', () => {
        const src: ChordSeqMember[] = [];
        const seq = factory.chordseq(src);

        expect(seq.contents).toStrictEqual(src);
        expect(seq.contents).not.toBe(src);
    });
});

describe('factory.melody() tests', () => {
    test('throws when no arguments are passed', () => {
        expect(() => factory.melody(undefined as unknown as SeqArgument)).toThrow();
    });

    test('throws when passed garbage', () => {
        expect(() => factory.melody([ 'fard', 5 ] as SeqArgument)).toThrow();
    });

    test('correctly builds an empty melody', () => {
        const seq = factory.melody([]);

        expect(seq).toBeInstanceOf(Melody);
        expect(seq.val()).toStrictEqual([]);
    });

    test('correctly builds from an array of numbers, with metadata', () => {
        const seq = factory.melody([ 4, 2, 3, 4 ], { copyright: 'test' });

        expect(seq).toBeInstanceOf(Melody);
        expect(seq.toPitches()).toStrictEqual([ [ 4 ], [ 2 ], [ 3 ], [ 4 ] ]);
        expect(seq.metadata.copyright).toEqual('test');
    });

    test('correctly builds from an array of arrays of numbers', () => {
        const seq = factory.melody([ [ 4 ], [], [ 2, 3 ], [ 4 ] ]);

        expect(seq).toBeInstanceOf(Melody);
        expect(seq.toPitches()).toStrictEqual([ [ 4 ], [], [ 2, 3 ], [ 4 ] ]);
    });

    test('fails to build if non-int value exists', () => {
        expect(() => factory.melody([ 1, null, 3, 4.4 ])).toThrow();
    });

    test('builds if non-int value exists and microtonal builder is used', () => {
        const seq = factory.microtonalmelody([ 1, null, 3, 4.4 ]);

        expect(seq).toBeInstanceOf(Melody);
        expect(seq.toPitches()).toStrictEqual([ [ 1 ], [], [ 3 ], [ 4.4 ] ]);
    });

    test('builds if non-int value exists and microtonal builder is used, with metadata', () => {
        const seq = factory.microtonalmelody([ 1, null, 3, 4.4 ], { copyright: 'text' });

        expect(seq).toBeInstanceOf(Melody);
        expect(seq.toPitches()).toStrictEqual([ [ 1 ], [], [ 3 ], [ 4.4 ] ]);
        expect(seq.metadata.copyright);
    });

    test('builds from an intseq', () => {
        const seq = factory.intseq([ 4, 2, 3, 4 ]).toMelody();

        expect(seq).toBeInstanceOf(Melody);
        expect(seq.toPitches()).toStrictEqual([ [ 4 ], [ 2 ], [ 3 ], [ 4 ] ]);
    });

    test('builds from a floatseq', () => {
        const seq = factory.floatseq([ 4, 2, 3, 4 ]).toMelody();

        expect(seq).toBeInstanceOf(Melody);
        expect(seq.toPitches()).toStrictEqual([ [ 4 ], [ 2 ], [ 3 ], [ 4 ] ]);
    });

    test('builds from a noteseq', () => {
        const seq = factory.noteseq([ 4, null, 3, 4 ]).toMelody();

        expect(seq).toBeInstanceOf(Melody);
        expect(seq.toPitches()).toStrictEqual([ [ 4 ], [], [ 3 ], [ 4 ] ]);
    });

    test('builds from a melody', () => {
        const seq = factory.chordseq([ [ 4 ], [], [ 2, 3 ], [ 4 ] ]).toMelody();

        expect(seq).toBeInstanceOf(Melody);
        expect(seq.toPitches()).toStrictEqual([ [ 4 ], [], [ 2, 3 ], [ 4 ] ]);
    });

    test('builds from a melody', () => {
        const seq = factory.melody([ [ 4 ], [], [ 2, 3 ], [ 4 ] ]).toMelody();

        expect(seq).toBeInstanceOf(Melody);
        expect(seq.toPitches()).toStrictEqual([ [ 4 ], [], [ 2, 3 ], [ 4 ] ]);
    });

    test('applies defaults correctly', () => {
        const seq = factory.melody([ [ 4 ], [], [ 2, 3 ], [ 4 ] ]);

        expect(seq).toBeInstanceOf(Melody);
        expect(seq.val()).toStrictEqual([
            MelodyMember.from({ pitch: [ 4 ], velocity: 64, duration: 16 }),
            MelodyMember.from({ pitch: [], velocity: 64, duration: 16 }),
            MelodyMember.from({ pitch: [ 2, 3 ], velocity: 64, duration: 16 }),
            MelodyMember.from({ pitch: [ 4 ], velocity: 64, duration: 16 }),
        ]);
    });

    test('keeps non-pitch data when a melody is passed', () => {
        const seq1 = factory.melody([ 4, [], [ 2, 3 ], [ 4 ] ])
            .withVolume([ 50, 55, 60, 65 ])
            .withDuration([ 8, 24, 8, 24 ])
            .withDelay([ 10, -10, 10, -10 ]);

        const ret = factory.melody(seq1);

        expect(ret).toBeInstanceOf(Melody);
        expect(ret.val()).toStrictEqual([
            MelodyMember.from({ pitch: [ 4 ], velocity: 50, duration: 8, delay: 10 }),
            MelodyMember.from({ pitch: [], velocity: 55, duration: 24, delay: -10 }),
            MelodyMember.from({ pitch: [ 2, 3 ], velocity: 60, duration: 8, delay: 10 }),
            MelodyMember.from({ pitch: [ 4 ], velocity: 65, duration: 24, delay: -10 }),
        ]);
    });

    test('builds through multiple conversions, with metadata', () => {
        const seq = factory.melody([ 4, 2, 3, 4 ], { copyright: 'test' }).toChordSeq().toNoteSeq().toNumSeq().toMelody();

        expect(seq).toBeInstanceOf(Melody);
        expect(seq.toPitches()).toStrictEqual([ [ 4 ], [ 2 ], [ 3 ], [ 4 ] ]);
        expect(seq.metadata.copyright).toEqual('test');
    });

    test('contents are a copy of the passed argument', () => {
        const src: MelodyMember[] = [];
        const seq = factory.melody(src);

        expect(seq.contents).toStrictEqual(src);
        expect(seq.contents).not.toBe(src);
    });
});

describe('factory.score() tests', () => {
    test('generates an empty score', () => {
        const s = factory.score(undefined as unknown as Melody[]);

        expect(s).toBeInstanceOf(Score);
        expect(s.contents).toStrictEqual([]);
        expect(s.metadata.ticks_per_quarter).toStrictEqual(192);
    });

    test('generates a score and a non-default ticks-per-quarter', () => {
        const m1 = factory.melody([ 5, 1, 2, 4 ]);

        const s = factory.score([ m1 ], { ticks_per_quarter: 960 });

        expect(s).toBeInstanceOf(Score);
        expect(s.contents).toStrictEqual([ m1 ]);
        expect(s.metadata.ticks_per_quarter).toStrictEqual(960);
    });

    test('generates a score with melody tracks', () => {
        const m1 = factory.melody([ 5, 1, 2, 4 ]);
        const m2 = factory.melody([ 1, 3, 4, 6 ]);
        const m3 = factory.melody([ 4, 2, 6, 1 ]);

        const s = factory.score([ m1, m2, m3 ]);

        expect(s).toBeInstanceOf(Score);
        expect(s.contents).toStrictEqual([ m1, m2, m3 ]);
        expect(s.metadata.ticks_per_quarter).toStrictEqual(192);
    });

    test('contents are a copy of the passed argument', () => {
        const src: Melody[] = [];
        const seq = factory.score(src);

        expect(seq.contents).toStrictEqual(src);
        expect(seq.contents).not.toBe(src);
    });
});

describe('factory.score()', () => {
    beforeAll(() => jest.spyOn(fs, 'readFileSync').mockReturnValue(Buffer.from([
        0x4d, 0x54, 0x68, 0x64,
        0x00, 0x00, 0x00, 0x06,
        0x00, 0x01,
        0x00, 0x01,
        0x00, 0xc0,
        0x4d, 0x54, 0x72, 0x6b,
        0x00, 0x00, 0x00, 0x0c,
        0x00, 0x90, 0x40, 0x60,
        0x40, 0x80, 0x40, 0x60,
        0x10, 0xff, 0x2f, 0x00
    ])));

    afterAll(() => jest.restoreAllMocks());

    test('read file successfully using a mock', () => {
        expect(factory.score('test')).toStrictEqual(Score.from(
            [ factory.melody([ { pitch: [ 0x40 ], velocity: 0x60, duration: 0x40, at: 0x00 } ]) ],
            { ticks_per_quarter: 192 }
        ));
    });
});

describe('factory.score()', () => {
    beforeAll(() => jest.spyOn(fs, 'readFileSync').mockReturnValue(Buffer.from([
        77,  84, 104, 100,   0,   0,  0,   6,  0,  1,  0,   1,
        0, 192,  77,  84, 114, 107,  0,   0,  0, 32,  0, 176,
        64, 127,   0, 144,  60,  64, 16, 128, 60, 64,  0, 144,
        67,  64,  16, 128,  67,  64,  0, 144, 72, 64, 16, 128,
        72,  64,   0, 255,  47,   0
    ])));

    afterAll(() => jest.restoreAllMocks());

    test('read file successfully using a mock', () => {
        expect(factory.score('test')).toStrictEqual(Score.from(
            [
                factory.melody([
                    { pitch: [ 0x3c ], velocity: 0x40, duration: 0x10, at: 0x00 },
                    { pitch: [ 0x43 ], velocity: 0x40, duration: 0x10, at: 0x10 },
                    { pitch: [ 0x48 ], velocity: 0x40, duration: 0x10, at: 0x20 }
                ], { before: MetaList.from([ { event: 'sustain', value: 1, at: 0 } ]) })
            ],
            { ticks_per_quarter: 192 }
        ));
    });
});