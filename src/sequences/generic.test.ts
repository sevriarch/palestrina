import type { AnySeq, SeqMember, SeqMemberArgument, SeqIndices, NumSeq, NoteSeq, PitchArgument, MapperFn, FilterFn, ArrayFinderFn, PitchMapperFn, GamutOpts } from '../types';

import { intseq, floatseq, noteseq, chordseq, melody } from '../factory';

import NumSeqMember from './members/number';
import NoteSeqMember from './members/note';
import ChordSeqMember from './members/chord';

describe('Sequence.appendItems()', () => {
    const table: [ string, AnySeq, SeqMemberArgument[], AnySeq ][] = [
        [ 'appending NumSeqMembers to a NumSeq', intseq([ 1, 2, 3 ]), [ NumSeqMember.from(4), NumSeqMember.from(5) ], intseq([ 1, 2, 3, 4, 5 ]) ],
        [ 'appending chords to a ChordSeq', chordseq([ 1, 2, 3 ]), [ [ 4, 5 ], [], [ 6 ] ], chordseq([ 1, 2, 3, [ 4, 5 ], [], 6 ]) ],
        [ 'appending numbers to a Melody', melody([ 1, 2, 3 ]), [ 4, 5 ], melody([ 1, 2, 3, 4, 5 ]) ]
    ];

    test.each(table)('returns as expected when %s', (_, s, items, ret) => {
        expect(s.appendItems(...items)).toStrictEqual(ret);
    });
});

describe('Sequence.prependItems()', () => {
    const table: [ string, AnySeq, SeqMemberArgument[], AnySeq ][] = [
        [ 'prepending NumSeqMembers to a NumSeq', intseq([ 1, 2, 3 ]), [ NumSeqMember.from(4), NumSeqMember.from(5) ], intseq([ 4, 5, 1, 2, 3 ]) ],
        [ 'prepending chords to a ChordSeq', chordseq([ 1, 2, 3 ]), [ [ 4, 5 ], [], [ 6 ] ], chordseq([ [ 4, 5 ], [], 6, 1, 2, 3 ]) ],
        [ 'prepending numbers to a Melody', melody([ 1, 2, 3 ]), [ 4, 5 ], melody([ 4, 5, 1, 2, 3 ]) ]
    ];

    test.each(table)('returns as expected when %s', (_, s, items, ret) => {
        expect(s.prependItems(...items)).toStrictEqual(ret);
    });
});

describe('Sequence.toPitches()', () => {
    const table: [ string, AnySeq, number[][] ][] = [
        [ 'an empty sequence', intseq([]), [] ],
        [ 'a sequence of floats', floatseq([ 1.5, 3, -4.2 ]), [ [ 1.5 ], [ 3 ], [ -4.2 ] ] ],
        [ 'a noteseq', noteseq([ 6, 7, 8, 1, null, 3 ]), [ [ 6 ], [ 7 ], [ 8 ], [ 1, ], [], [ 3 ] ] ],
        [ 'a chordseq', chordseq([ [ 4 ], [ 7, 8 ], null, [ 6 ] ]), [ [ 4 ], [ 7, 8 ], [], [ 6 ] ] ],
        [ 'a melody', melody([ [ 4 ], [ 7, 8 ], null, [ 6 ] ]), [ [ 4 ], [ 7, 8 ], [], [ 6 ] ] ],
    ];

    test.each(table)('returns as expected for %s', (_, s, ret) => {
        expect(s.toPitches()).toStrictEqual(ret);
    });
});

describe('Sequence.toFlatPitches()', () => {
    const table: [ string, AnySeq, number[] ][] = [
        [ 'an empty sequence', intseq([]), [] ],
        [ 'a sequence of floats', floatseq([ 1.5, 3, -4.2 ]), [ 1.5, 3, -4.2 ] ],
        [ 'a noteseq', noteseq([ 6, 7, 8, 1, null, 3 ]), [ 6, 7, 8, 1, 3 ] ],
        [ 'a chordseq', chordseq([ [ 4 ], [ 7, 8 ], null, [ 6 ] ]), [ 4, 7, 8, 6 ] ],
        [ 'a melody', melody([ [ 4 ], [ 7, 8 ], null, [ 6 ] ]), [ 4, 7, 8, 6 ] ],
    ];

    test.each(table)('returns as expected for %s', (_, s, ret) => {
        expect(s.toFlatPitches()).toStrictEqual(ret);
    });
});

describe('Sequence.toNumericValues()', () => {
    const errortable: [ string, AnySeq ][] = [
        [ 'nulls are present', noteseq([ 5, null, 4 ]) ],
        [ 'chords are present', chordseq([ [ 5 ], [ 4 ], [ 6, 3 ] ]) ],
        [ 'empty chordseq members are present', chordseq([ [ 5 ], [], [ 3 ] ]) ],
        [ 'chords are present in a melody', melody([ [ 5 ], [ 4 ], [ 6, 3 ] ]) ],
    ];

    test.each(errortable)('throws if %s', (_, s) => {
        expect(() => s.toNumericValues()).toThrow();
    });

    const table: [ string, AnySeq, number[] ][] = [
        [ 'an empty sequence', intseq([]), [] ],
        [ 'a sequence of floats', floatseq([ 1.5, 3, -4.2 ]), [ 1.5, 3, -4.2 ] ],
        [ 'a noteseq without nulls', noteseq([ 6, 7, 8, 1, 2, 3 ]), [ 6, 7, 8, 1, 2, 3 ] ],
        [ 'a chordseq with only single pitches', chordseq([ [ 4 ], [ 8 ], [ 6 ] ]), [ 4, 8, 6 ] ],
        [ 'a melody with only single pitches', melody([ [ 4 ], [ 8 ], [ 6 ] ]), [ 4, 8, 6 ] ],
    ];

    test.each(table)('returns as expected for %s', (_, s, ret) => {
        expect(s.toNumericValues()).toStrictEqual(ret);
    });
});

describe('Sequence.toNullableNumericValues()', () => {
    const errortable: [ string, AnySeq ][] = [
        [ 'chords are present', chordseq([ [ 5 ], [ 4 ], [ 6, 3 ] ]) ],
        [ 'chords are present in a melody', melody([ [ 5 ], [ 4 ], [ 6, 3 ] ]) ],
    ];

    test.each(errortable)('throws if %s', (_, s) => {
        expect(() => s.toNullableNumericValues()).toThrow();
    });

    const table: [ string, AnySeq, (null | number)[] ][] = [
        [ 'an empty sequence', intseq([]), [] ],
        [ 'a sequence of floats', floatseq([ 1.5, 3, -4.2 ]), [ 1.5, 3, -4.2 ] ],
        [ 'a noteseq with nulls', noteseq([ 5, null, 4 ]), [ 5, null, 4 ] ],
        [ 'a noteseq without nulls', noteseq([ 6, 7, 8, 1, 2, 3 ]), [ 6, 7, 8, 1, 2, 3 ] ],
        [ 'a chordseq with only single pitches or silences', chordseq([ [ 4 ], [], [ 6 ] ]), [ 4, null, 6 ] ],
        [ 'a melody with only single pitches or silences', melody([ [ 4 ], [], [ 6 ] ]), [ 4, null, 6 ] ],
    ];

    test.each(table)('returns as expected for %s', (_, s, ret) => {
        expect(s.toNullableNumericValues()).toStrictEqual(ret);
    });
});

describe('Sequence.toPitchDistributionMap()', () => {
    const table: [ string, AnySeq, Map<number, number> ][] = [
        [
            'an empty intseq',
            intseq([]),
            new Map(),
        ],
        [
            'an intseq',
            intseq([ 1, 2, 3, 4, 1, 5, 4, 2, 8, 5 ]),
            new Map([ [ 1, 2 ], [ 2, 2 ], [ 3, 1 ], [ 4, 2 ], [ 5, 2 ], [ 8, 1 ] ]),
        ],
        [
            'a noteseq',
            noteseq([ 1, 2, null, 3, 4, 1, null, 5, 4, 2, 8, 5]),
            new Map([ [ 1, 2 ], [ 2, 2 ], [ 3, 1 ], [ 4, 2 ], [ 5, 2 ], [ 8, 1 ] ]),
        ],
        [
            'a chordseq',
            chordseq([ [ 1, 2 ], [], [ 3, 4, 1 ], [], [ 5 ], [ 4, 2, 8 ], [ 5 ] ]),
            new Map([ [ 1, 2 ], [ 2, 2 ], [ 3, 1 ], [ 4, 2 ], [ 5, 2 ], [ 8, 1 ] ]),
        ],
        [
            'a melody',
            melody([ [ 1, 2 ], [], [ 3, 4, 1 ], [], [ 5 ], [ 4, 2, 8 ], [ 5 ] ]),
            new Map([ [ 1, 2 ], [ 2, 2 ], [ 3, 1 ], [ 4, 2 ], [ 5, 2 ], [ 8, 1 ] ]),
        ],
    ];

    test.each(table)('returns the expected map for %s', (_, s, ret) => {
        expect(s.toPitchDistributionMap()).toStrictEqual(ret);
    });
});

describe('Sequence.toChordDistributionMap()', () => {
    const table: [ string, AnySeq, Map<number[], number> ][] = [
        [
            'an empty intseq',
            intseq([]),
            new Map(),
        ],
        [
            'an intseq',
            intseq([ 1, 2, 3, 4, 1, 5, 4, 2, 8, 5 ]),
            new Map([ [ [ 1 ], 2 ], [ [ 2 ], 2 ], [ [ 3 ], 1 ], [ [ 4 ], 2 ], [ [ 5 ], 2 ], [ [ 8 ], 1 ] ]),
        ],
        [
            'a noteseq',
            noteseq([ 1, 2, null, 3, 4, 1, null, 5, 4, 2, 8, 5]),
            new Map([ [ [ 1 ], 2 ], [ [ 2 ], 2 ], [ [ 3 ], 1 ], [ [ 4 ], 2 ], [ [ 5 ], 2 ], [ [ 8 ], 1 ], [ [], 2 ] ]),
        ],
        [
            'a chordseq',
            chordseq([ [ 1, 2 ], [], [ 3, 4, 1 ], [], [ 5 ], [ 4, 2, 8 ], [ 5 ] ]),
            new Map([ [ [ 1, 2 ], 1 ], [ [ 1, 3, 4 ], 1 ], [ [ 5 ], 2 ], [ [ 2, 4, 8 ], 1 ], [ [], 2 ] ]),
        ],
        [
            'a melody',
            melody([ [ 1, 2 ], [], [ 3, 4, 1 ], [], [ 5 ], [ 4, 2, 8 ], [ 5 ] ]),
            new Map([ [ [ 1, 2 ], 1 ], [ [ 1, 3, 4 ], 1 ], [ [ 5 ], 2 ], [ [ 2, 4, 8 ], 1 ], [ [], 2 ] ]),
        ],
    ];

    test.each(table)('returns the expected map for %s', (_, s, ret) => {
        expect(s.toChordDistributionMap()).toStrictEqual(ret);
    });
});

describe('Sequence.min()', () => {
    const table: [ string, AnySeq, null | number ][] = [
        [ 'an empty sequence', intseq([]), null ],
        [ 'a sequence of floats', floatseq([ 1.5, 3, -4.2 ]), -4.2 ],
        [ 'a noteseq', noteseq([ 6, 7, 8, 1, null, 3 ]), 1 ],
        [ 'a chordseq', chordseq([ [ 4 ], [ 7, 8 ], null, [ 6 ] ]), 4 ],
        [ 'a melody', melody([ [ 4 ], [ 7, 8 ], null, [ 6 ] ]), 4 ],
    ];

    test.each(table)('returns as expected for %s', (_, s, ret) => {
        expect(s.min()).toStrictEqual(ret);
    });
});

describe('Sequence.max()', () => {
    const table: [ string, AnySeq, null | number ][] = [
        [ 'an empty sequence', intseq([]), null ],
        [ 'a sequence of floats', floatseq([ 1.5, 3, -4.2 ]), 3 ],
        [ 'a noteseq', noteseq([ 6, 7, 8, 1, null, 3 ]), 8 ],
        [ 'a chordseq', chordseq([ [ 4 ], [ 7, 8 ], null, [ 6 ] ]), 8 ],
        [ 'a melody', melody([ [ 4 ], [ 7, 8 ], null, [ 6 ] ]), 8 ],
    ];

    test.each(table)('returns as expected for %s', (_, s, ret) => {
        expect(s.max()).toStrictEqual(ret);
    });
});

describe('Sequence.range()', () => {
    const table: [ string, AnySeq, number ][] = [
        [ 'an empty sequence', intseq([]), 0 ],
        [ 'a sequence of floats', floatseq([ 1.5, 3, -4.2 ]), 7.2 ],
        [ 'a noteseq', noteseq([ 6, 7, 8, 1, null, 3 ]), 7 ],
        [ 'a chordseq', chordseq([ [ 4 ], [ 7, 8 ], null, [ 6 ] ]), 4 ],
        [ 'a melody', melody([ [ 4 ], [ 7, 8 ], null, [ 6 ] ]), 4 ],
    ];

    test.each(table)('returns as expected for %s', (_, s, ret) => {
        expect(s.range()).toStrictEqual(ret);
    });
});

describe('Sequence.total()', () => {
    const table: [ string, AnySeq, number ][] = [
        [ 'an empty sequence', intseq([]), 0 ],
        [ 'a sequence of floats', floatseq([ 1.5, 3, -4.2 ]), 0.3 ],
        [ 'a noteseq', noteseq([ 6, 7, 8, 1, null, 3 ]), 25 ],
        [ 'a chordseq', chordseq([ [ 4 ], [ 7, 8 ], null, [ 6 ] ]), 25 ],
        [ 'a melody', melody([ [ 4 ], [ 7, 8 ], null, [ 6 ] ]), 25 ],
    ];

    test.each(table)('returns as expected for %s', (_, s, ret) => {
        expect(s.total()).toBeCloseTo(ret);
    });
});

describe('Sequence.mean()', () => {
    const table: [ string, AnySeq, number | null ][] = [
        [ 'an empty sequence', intseq([]), null ],
        [ 'a sequence of floats', floatseq([ 1.5, 3, -4.2 ]), 0.1 ],
        [ 'a noteseq', noteseq([ 6, 7, 8, 1, null, 3 ]), 5 ],
        [ 'a chordseq', chordseq([ [ 4 ], [ 7, 8 ], null, [ 6 ] ]), 6.25 ],
        [ 'a melody', melody([ [ 4 ], [ 7, 8 ], null, [ 6 ] ]), 6.25 ],
    ];

    test.each(table)('returns as expected for %s', (_, s, ret) => {
        if (ret === null) {
            expect(s.mean()).toStrictEqual(ret);
        } else {
            expect(s.mean()).toBeCloseTo(ret);
        }
    });
});

describe('Sequence.mins()', () => {
    const table: [ string, AnySeq, (number | null)[] ][] = [
        [ 'an empty sequence', intseq([]), [] ],
        [ 'a sequence of floats', floatseq([ 1.5, 3, -4.2 ]), [ 1.5, 3, -4.2 ] ],
        [ 'a noteseq', noteseq([ 6, 7, 8, 1, null, 3 ]), [ 6, 7, 8, 1, null, 3 ] ],
        [ 'a chordseq', chordseq([ [ 4 ], [ 7, 8 ], null, [ 6 ] ]), [ 4, 7, null, 6 ] ],
        [ 'a melody', melody([ [ 4 ], [ 7, 8 ], null, [ 6 ] ]), [ 4, 7, null, 6 ] ],
    ];

    test.each(table)('returns as expected for %s', (_, s, ret) => {
        expect(s.mins()).toStrictEqual(ret);
    });
});

describe('Sequence.maxes()', () => {
    const table: [ string, AnySeq, (number | null)[] ][] = [
        [ 'an empty sequence', intseq([]), [] ],
        [ 'a sequence of floats', floatseq([ 1.5, 3, -4.2 ]), [ 1.5, 3, -4.2 ] ],
        [ 'a noteseq', noteseq([ 6, 7, 8, 1, null, 3 ]), [ 6, 7, 8, 1, null, 3 ] ],
        [ 'a chordseq', chordseq([ [ 4 ], [ 7, 8 ], null, [ 6 ] ]), [ 4, 8, null, 6 ] ],
        [ 'a melody', melody([ [ 4 ], [ 7, 8 ], null, [ 6 ] ]), [ 4, 8, null, 6 ] ],
    ];

    test.each(table)('returns as expected for %s', (_, s, ret) => {
        expect(s.maxes()).toStrictEqual(ret);
    });
});

describe('Sequence.means()', () => {
    const table: [ string, AnySeq, (number | null)[] ][] = [
        [ 'an empty sequence', intseq([]), [] ],
        [ 'a sequence of floats', floatseq([ 1.5, 3, -4.2 ]), [ 1.5, 3, -4.2 ] ],
        [ 'a noteseq', noteseq([ 6, 7, 8, 1, null, 3 ]), [ 6, 7, 8, 1, null, 3 ] ],
        [ 'a chordseq', chordseq([ [ 4 ], [ 7, 8 ], null, [ 6 ] ]), [ 4, 7.5, null, 6 ] ],
        [ 'a melody', melody([ [ 4 ], [ 7, 8 ], null, [ 6 ] ]), [ 4, 7.5, null, 6 ] ],
    ];

    test.each(table)('returns as expected for %s', (_, s, ret) => {
        expect(s.means()).toStrictEqual(ret);
    });
});

describe('Collection.isSameClassAndLengthAs()', () => {
    const c1 = intseq([ 1, 2, 3 ]);
    const c2 = noteseq([ 1, 2, 3 ]);
    const c3 = intseq([ 4 ]);
    const c4 = floatseq([ 1, 2, 3 ]);
    const c5 = intseq([ 3, 2, 1 ]);

    test('Returns true when nothing is passed', () => {
        expect(c1.isSameClassAndLengthAs()).toBe(true);
    });

    test('Comparing to non-Collection returns false', () => {
        expect(c1.isSameClassAndLengthAs([ 1, 2, 3 ])).toBe(false);
    });

    test('Different class, same length returns false', () => {
        expect(c1.isSameClassAndLengthAs(c2)).toBe(false);
    });

    test('Same class, different length returns false', () => {
        expect(c1.isSameClassAndLengthAs(c3)).toBe(false);
    });

    test('Same class and length returns true', () => {
        expect(c1.isSameClassAndLengthAs(c5)).toBe(true);
    });

    test('Different class, same length returns false when multiple args passed', () => {
        expect(c1.isSameClassAndLengthAs(c5, c5, c2, c5)).toBe(false);
    });

    test('Same class, different length returns false when multiple args passed', () => {
        expect(c1.isSameClassAndLengthAs(c5, c3, c5, c5)).toBe(false);
    });

    test('Same class and length returns true when multiple args passed', () => {
        expect(c1.isSameClassAndLengthAs(c1, c5, c5, c5)).toBe(true);
    });

    test('Same classes and length but different validators return false', () => {
        expect(c1.isSameClassAndLengthAs(c4)).toBe(false);
    });
});

describe('Sequence.equals()', () => {
    const c1 = intseq([ 1, 2, 3 ]);
    const c2 = noteseq([ 1, 2, 3 ]);
    const c3 = intseq([ 4 ]);
    const c4 = floatseq([ 1, 2, 3 ]);
    const c5 = intseq([ 1, 2, 1 ]);

    test('Returns true when nothing is passed', () => {
        expect(c1.equals()).toBe(true);
    });

    test('Comparing to non-Collection returns false', () => {
        expect(c1.equals([ 1, 2, 3 ] as unknown as NumSeq)).toBe(false);
    });

    test('Different class, same length returns false', () => {
        expect(c1.equals(c2 as unknown as NumSeq)).toBe(false);
    });

    test('Same class, different length returns false', () => {
        expect(c1.equals(c3)).toBe(false);
    });

    test('Same class and length but different values return false', () => {
        expect(c1.equals(c5)).toBe(false);
    });

    test('Different class, same length returns false when multiple args passed', () => {
        expect(c1.equals(c1, c1, c2 as unknown as NumSeq, c1)).toBe(false);
    });

    test('Same class and length returns true when multiple args passed', () => {
        expect(c1.equals(c1, c1, c1, c1)).toBe(true);
    });

    test('Same classes and length but different validators return false', () => {
        expect(c1.equals(c4)).toBe(false);
    });
});

describe('Sequence.isSubsetOf()', () => {
    const c0 = intseq([]);
    const c1 = intseq([ 1, 2, 3 ]);
    const c2 = intseq([ 0, 1, 2, 3, 4, 5 ]);
    const c3 = intseq([ 1, 3, 2, 4 ]);
    const c4 = floatseq([ 1, 2, 3 ]);
    const c5 = noteseq([ 1, 2, 3 ]);

    test('Returns false when compared to non-sequence', () => {
        expect(c1.isSubsetOf([ 1, 2, 3 ] as unknown as NumSeq));
    });

    test('Returns true when equal', () => {
        expect(c1.isSubsetOf(c2)).toBe(true);
    });

    test('Returns true when subset is empty', () => {
        expect(c0.isSubsetOf(c1)).toBe(true);
    });

    test('Returns false when superset is empty', () => {
        expect(c1.isSubsetOf(c0)).toBe(false);
    });

    test('Returns true when a subset', () => {
        expect(c1.isSubsetOf(c2)).toBe(true);
    });

    test('Returns false when a subset in different order', () => {
        expect(c1.isSubsetOf(c3)).toBe(false);
    });

    test('Returns true when subset but different validator', () => {
        expect(c1.isSubsetOf(c4)).toBe(true);
    });

    test('Returns false when sequence type is different', () => {
        expect(c1.isSubsetOf(c5 as unknown as NumSeq)).toBe(false);
    });
});

describe('Sequence.isSupersetOf()', () => {
    const c0 = intseq([]);
    const c1 = intseq([ 1, 2, 3 ]);
    const c2 = intseq([ 0, 1, 2, 3, 4, 5 ]);
    const c3 = intseq([ 1, 3, 2, 4 ]);
    const c4 = floatseq([ 1, 2, 3 ]);
    const c5 = noteseq([ 1, 2, 3 ]);

    test('Returns true when equal', () => {
        expect(c2.isSupersetOf(c1)).toBe(true);
    });

    test('Returns true when a superset', () => {
        expect(c2.isSupersetOf(c1)).toBe(true);
    });

    test('Returns true when subset is empty', () => {
        expect(c1.isSupersetOf(c0)).toBe(true);
    });

    test('Returns false when superset is empty', () => {
        expect(c0.isSupersetOf(c1)).toBe(false);
    });

    test('Returns false when a superset in different order', () => {
        expect(c3.isSupersetOf(c1)).toBe(false);
    });

    test('Returns true when superset but different validator', () => {
        expect(c4.isSupersetOf(c1)).toBe(true);
    });

    test('Returns false when sequence type is different', () => {
        expect(c5.isSupersetOf(c1 as unknown as NoteSeq)).toBe(false);
    });
});

describe('Sequence.isTransformationOf()', () => {
    const c_sum  = (a: number, b: number) => a + b;
    const c_diff = (a: number, b: number) => a - b;
    const c_div  = (a: number, b: number) => a / b;
    const c_one  = () => 1;

    const c0 = intseq([]);
    const c1 = intseq([ 1, 2, 4 ]);
    const c2 = chordseq([ [ 1, 2 ], [ 3, 4], [ 5 ]]);

    test('fails for invalid fn', () => {
        expect(() => c0.isTransformationOf(500 as unknown as (a: number, b: number) => number, c0)).toThrow();
    });

    test('succeeds for zero length', () => {
        expect(c0.isTransformationOf(c_sum, c0)).toBe(true);
    });

    test('fails for differently sized chords', () => {
        expect(c2.isTransformationOf(c_one, c2.retrograde())).toBe(false);
    });

    test('fails for different lengths', () => {
        expect(c1.isTransformationOf(c_one, c1.repeat())).toBe(false);
    });

    test('succeeds for augmentation despite zero values', () => {
        expect(intseq([ 1, 2, 0, 4 ]).isTransformationOf(c_div, intseq([ 4, 8, 0, 16 ]))).toBe(true);
    });

    test('correctly identifies transformation types for identical sequences', () => {
        expect(c1.isTransformationOf(c_sum, c1)).toBe(false);
        expect(c1.isTransformationOf(c_diff, c1)).toBe(true); // should always be 0
        expect(c1.isTransformationOf(c_div, c1)).toBe(true); // should always be 1
    });

    test('correctly identifies transformation types for transposed sequences', () => {
        const comp = c2.transpose(12);
        expect(c2.isTransformationOf(c_sum, comp)).toBe(false);
        expect(c2.isTransformationOf(c_diff, comp)).toBe(true);
        expect(c2.isTransformationOf(c_div, comp)).toBe(false);
    });

    test('correctly identifies transformation types for inverted sequences', () => {
        const comp = c1.invert(12);
        expect(c1.isTransformationOf(c_sum, comp)).toBe(true);
        expect(c1.isTransformationOf(c_diff, comp)).toBe(false);
        expect(c1.isTransformationOf(c_div, comp)).toBe(false);
    });

    test('correctly identifies transformation types for augmented sequences', () => {
        const comp = c2.augment(2);
        expect(c2.isTransformationOf(c_sum, comp)).toBe(false);
        expect(c2.isTransformationOf(c_diff, comp)).toBe(false);
        expect(c2.isTransformationOf(c_div, comp)).toBe(true);
    });
});

describe('Sequence.isTranspositionOf()', () => {
    const c0 = intseq([]);
    const c1 = intseq([ 1, 2, 4 ]);
    const c2 = chordseq([ [ 1, 2 ], [ 3, 4], [ 5 ]]);

    test('succeeds for zero length', () => {
        expect(c0.isTranspositionOf(c0)).toBe(true);
    });

    test('fails for different lengths', () => {
        expect(c1.isTranspositionOf(c1.repeat())).toBe(false);
    });

    test('succeeds for identical sequences', () => {
        expect(c1.isTranspositionOf(c1)).toBe(true);
    });

    test('succeeds for transpositions', () => {
        expect(c2.isTranspositionOf(c2.transpose(-8))).toBe(true);
    });

    test('fails for inversions', () => {
        expect(c1.isTranspositionOf(c1.invert(8))).toBe(false);
    });

    test('fails for augmentations', () => {
        expect(c1.isTranspositionOf(c1.augment(2))).toBe(false);
    });
});

describe('Sequence.isInversionOf()', () => {
    const c0 = intseq([]);
    const c1 = intseq([ 1, 2, 4 ]);
    const c2 = chordseq([ [ 1, 2 ], [ 3, 4], [ 5 ]]);

    test('succeeds for zero length', () => {
        expect(c0.isInversionOf(c0)).toBe(true);
    });

    test('fails for different lengths', () => {
        expect(c1.isInversionOf(c1.repeat())).toBe(false);
    });

    test('fails for identical sequences', () => {
        expect(c1.isInversionOf(c1)).toBe(false);
    });

    test('succeeds for transpositions', () => {
        expect(c2.isInversionOf(c2.transpose(-8))).toBe(false);
    });

    test('fails for inversions', () => {
        expect(c1.isInversionOf(c1.invert(8))).toBe(true);
    });

    test('fails for augmentations', () => {
        expect(c1.isInversionOf(c1.augment(2))).toBe(false);
    });
});

describe('Sequence.isRetrogradeOf()', () => {
    const c0 = intseq([]);
    const c1 = intseq([ 1, 2, 4 ]);
    const c2 = chordseq([ [ 1, 2 ], [ 3, 4], [ 5 ]]);

    test('succeeds for zero length', () => {
        expect(c0.isRetrogradeOf(c0)).toBe(true);
    });

    test('fails for different lengths', () => {
        expect(c1.isRetrogradeOf(c1.repeat())).toBe(false);
    });

    test('fails for identical sequences', () => {
        expect(c1.isRetrogradeOf(c1)).toBe(false);
    });

    test('succeeds for untransposed retrogrades', () => {
        expect(c2.isRetrogradeOf(c2.retrograde())).toBe(true);
    });

    test('succeeds for transposed retrogrades', () => {
        expect(c1.isRetrogradeOf(c1.retrograde().transpose(8))).toBe(true);
    });

    test('fails for retrograde inversions', () => {
        expect(c2.isRetrogradeOf(c2.retrograde().invert(8))).toBe(false);
    });

    test('fails for augmented retrogrades', () => {
        expect(c1.isRetrogradeOf(c1.retrograde().augment(2))).toBe(false);
    });
});

describe('Sequence.isRetrogradeInversionOf()', () => {
    const c0 = intseq([]);
    const c1 = intseq([ 1, 2, 4 ]);
    const c2 = chordseq([ [ 1, 2 ], [ 3, 4], [ 5 ]]);

    test('succeeds for zero length', () => {
        expect(c0.isRetrogradeInversionOf(c0)).toBe(true);
    });

    test('fails for different lengths', () => {
        expect(c1.isRetrogradeInversionOf(c1.repeat())).toBe(false);
    });

    test('fails for identical sequences', () => {
        expect(c1.isRetrogradeInversionOf(c1)).toBe(false);
    });

    test('fails for untransposed retrogrades', () => {
        expect(c2.isRetrogradeInversionOf(c2.retrograde())).toBe(false);
    });

    test('fails for transposed retrogrades', () => {
        expect(c1.isRetrogradeInversionOf(c1.retrograde().transpose(8))).toBe(false);
    });

    test('succeeds for retrograde inversions', () => {
        expect(c2.isRetrogradeInversionOf(c2.retrograde().invert(8))).toBe(true);
    });

    test('fails for augmented retrograde inversions', () => {
        expect(c1.isRetrogradeInversionOf(c1.retrograde().augment(2).invert(8))).toBe(false);
    });
});

describe('Sequence.hasPeriodicityOf()', () => {
    const c0 = intseq([]);
    const c1 = chordseq([ [ 5, 5 ], [ 5, 5 ], [ 5, 5 ], [ 5, 5 ] ]);
    const c2 = intseq([ 1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4 ]);

    test('fails with zero length', () => {
        expect(c0.hasPeriodicityOf(1)).toBe(false);
    });

    test('succeeds with periodicity of 1', () => {
        expect(c1.hasPeriodicityOf(1)).toBe(true);
        expect(c1.hasPeriodicityOf(2)).toBe(true);
        expect(c1.hasPeriodicityOf(3)).toBe(false);
        expect(c1.hasPeriodicityOf(4)).toBe(false);
    });

    test('succeeds with periodicity of 4', () => {
        expect(c2.hasPeriodicityOf(1)).toBe(false);
        expect(c2.hasPeriodicityOf(2)).toBe(false);
        expect(c2.hasPeriodicityOf(3)).toBe(false);
        expect(c2.hasPeriodicityOf(4)).toBe(true);
    });
});

describe('Sequence.hasPeriodicity()', () => {
    const c0 = intseq([]);
    const c1 = chordseq([ [ 5, 5 ], [ 5, 5 ], [ 5, 5 ], [ 5, 5 ] ]);
    const c2 = intseq([ 1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4 ]);

    const table: [ string, AnySeq, number ][] = [
        [ 'zero length', c0, 0 ],
        [ 'periodicity of 1', c1, 1 ],
        [ 'periodicity of 4', c2, 4 ],
    ];

    test.each(table)('returns expected value when %s', (_, s, ret) => {
        expect(s.hasPeriodicity()).toStrictEqual(ret);
    });
});

describe('Sequence.findIfWindow()', () => {
    const c1 = intseq([ 1, 4, 3, 2, 5, 6, 10, 9, 7, 8 ]);
    const c2 = noteseq([ 1, 4, null, 3, 2, 5, 6, null, 10, 9, 7, 8 ]);
    const c3 = chordseq([ [], [ 1, 2 ], [ 3, 4 ], [ 5 ], [], [ 6, 7, 8 ], [ 9, 10, 11 ], [ 12, 13 ], [ 14 ] ]);

    test('throws if function is not a function', () => {
        expect(() => c1.findIfWindow(1, 1, 0 as unknown as ArrayFinderFn<NumSeqMember>)).toThrow();
    });

    test('returns expected array value when size and step both one', () => {
        expect(c1.findIfWindow(1, 1, (e, i) => e[0].val() > i)).toStrictEqual([ 0, 1, 2, 4, 5, 6, 7 ]);
    });

    test('returns expected array value when size two and step one', () => {
        expect(c2.findIfWindow(2, 1, e => e.some(m => m.val() === null))).toStrictEqual([ 1, 2, 6, 7 ]);
    });

    test('returns expected array value when size two and step two', () => {
        expect(c3.findIfWindow(2, 2, e => e[1].len() > e[0].len())).toStrictEqual([ 0, 4 ]);
    });
});

describe('Sequence.findIfReverseWindow()', () => {
    const c1 = intseq([ 1, 4, 3, 2, 5, 6, 10, 9, 7, 8 ]);
    const c2 = noteseq([ 1, 4, null, 3, 2, 5, 6, null, 10, 9, 7, 8 ]);
    const c3 = chordseq([ [], [ 1 ], [ 3, 4 ], [ 5 ], [], [ 6, 7, 8 ], [ 9, 10, 11 ], [ 12, 13 ], [ 14, 15, 16 ] ]);

    test('throws if function is not a function', () => {
        expect(() => c1.findIfReverseWindow(1, 1, 0 as unknown as ArrayFinderFn<NumSeqMember>)).toThrow();
    });

    test('returns expected array value when size and step both one', () => {
        expect(c1.findIfReverseWindow(1, 1, (e, i) => e[0].val() > i)).toStrictEqual([ 7, 6, 5, 4, 2, 1, 0 ]);
    });

    test('returns expected array value when size two and step one', () => {
        expect(c2.findIfReverseWindow(2, 1, e => e.some(m => m.val() === null))).toStrictEqual([ 7, 6, 2, 1 ]);
    });

    test('returns expected array value when size two and step two', () => {
        expect(c3.findIfReverseWindow(2, 2, e => e[1].len() > e[0].len())).toStrictEqual([ 7, 1 ]);
    });
});

describe('Sequence.replaceIfWindow()', () => {
    const c1 = intseq([ 1, 4, 3, 2, 5, 6, 10, 9, 7, 8 ]);
    const c2 = noteseq([ 1, 4, null, 3, 2, 5, 6, null, 10, 9, 7, 8 ]);
    const c3 = chordseq([ [], [ 1, 2 ], [ 3, 4 ], [ 5 ], [], [ 6, 7, 8 ], [ 9, 10, 11 ], [ 12, 13 ], [ 14 ] ]);

    test('throws if function is not a function', () => {
        expect(() => c1.replaceIfWindow(1, 1, 0 as unknown as ArrayFinderFn<NumSeqMember>, e => e[0].transpose(1))).toThrow();
    });

    test('returns expected value when size and step both one and replaced with a single value', () => {
        expect(c1.replaceIfWindow(1, 1, (e, i) => e[0].val() > i, e => e[0].transpose(1)))
            .toStrictEqual(intseq([ 2, 5, 4, 2, 6, 7, 11, 10, 7, 8 ]));
    });

    test('returns expected value when size and step both one and replaced with a number', () => {
        expect(c1.replaceIfWindow(1, 1, e => e[0].val() % 2 === 0, 0))
            .toStrictEqual(intseq([ 1, 0, 3, 0, 5, 0, 0, 9, 7, 0 ]));
    });

    test('returns expected value when size and step both one and replaced with the contents of the same kind of sequence', () => {
        expect(c1.replaceIfWindow(1, 1, e => e[0].val() % 2 === 0, intseq([ 11, 10 ])))
            .toStrictEqual(intseq([ 1, 11, 10, 3, 11, 10, 5, 11, 10, 11, 10, 9, 7, 11, 10 ]));
    });

    test('returns expected value when size and step both one and replaced with the contents of a different kind of sequence', () => {
        expect(c3.replaceIfWindow(1, 1, e => e[0].len() === 0, noteseq([ 11, null, 10 ])))
            .toStrictEqual(chordseq([ [ 11 ], [], [ 10 ], [ 1, 2 ], [ 3, 4 ], [ 5 ], [ 11 ], [], [ 10 ], [ 6, 7, 8 ], [ 9, 10, 11 ], [ 12, 13 ], [ 14 ] ]));
    });

    test('returns expected value when size two and step one and replaced with no values', () => {
        expect(c2.replaceIfWindow(2, 1, e => e.some(m => m.val() === null), []))
            .toStrictEqual(noteseq([ 1, 3, 2, 5, 10, 9, 7, 8 ])); // 3 and 10 appear because replace done before second find
    });

    // TODO: This behaviour seems anomalous
    test('handles when sequence truncated so much that the loop regresses before the start', () => {
        expect(c1.replaceIfWindow(4, 1, (_, i) => i < 4, e => e.slice(1, 3))).toStrictEqual(intseq([ 10, 7 ]));
    });

    test('returns expected value when size two and step two and replaced by duplicating first value', () => {
        expect(c3.replaceIfWindow(2, 2, e => e[1].len() > e[0].len(), e => [ e[0], e[1], e[0] ]))
            .toStrictEqual(chordseq([ [], [ 1, 2 ], [], [ 3, 4 ], [ 5 ], [], [ 6, 7, 8 ], [], [ 9, 10, 11 ], [ 12, 13 ], [ 14 ] ]));
    });

    test('adds multivalued members when size two and step two and replaced by number[]', () => {
        expect(c3.replaceIfWindow(3, 3, e => e[1].len() > e[0].len(), [ -1, -2, -3 ]))
            .toStrictEqual(chordseq([ [ -1 ], [ -2 ], [ -3 ], [ 5 ], [], [ 6, 7, 8 ], [ 9, 10, 11 ], [ 12, 13 ], [ 14 ] ]));
    });

    test('adds multivalued members when size two and step two and replaced by number[][]', () => {
        expect(c3.replaceIfWindow(3, 3, e => e[1].len() > e[0].len(), [ [ -1, -2, -3 ] ]))
            .toStrictEqual(chordseq([ [ -1, -2, -3 ], [ 5 ], [], [ 6, 7, 8 ], [ 9, 10, 11 ], [ 12, 13 ], [ 14 ] ]));
    });
});

describe('Sequence.replaceIfReverseWindow()', () => {
    const c1 = intseq([ 1, 4, 3, 2, 5, 6, 10, 9, 7, 8 ]);
    const c2 = noteseq([ 1, 4, null, 3, 2, 5, 6, null, 10, 9, 7, 8 ]);
    const c3 = chordseq([ [], [ 1 ], [ 3, 4 ], [ 5 ], [], [ 6, 7, 8 ], [ 9, 10, 11 ], [ 12, 13 ], [ 14, 15, 16 ] ]);

    test('throws if function is not a function', () => {
        expect(() => c1.replaceIfReverseWindow(1, 1, 0 as unknown as ArrayFinderFn<NumSeqMember>, e => e[0].transpose(1))).toThrow();
    });

    test('returns expected value when size and step both one and replaced with a single value', () => {
        expect(c1.replaceIfReverseWindow(1, 1, (e, i) => e[0].val() > i, e => e[0].transpose(1)))
            .toStrictEqual(intseq([ 2, 5, 4, 2, 6, 7, 11, 10, 7, 8 ]));
    });

    test('returns expected value when size and step both one and replaced with a number', () => {
        expect(c1.replaceIfReverseWindow(1, 1, e => e[0].val() % 2 === 0, 0))
            .toStrictEqual(intseq([ 1, 0, 3, 0, 5, 0, 0, 9, 7, 0 ]));
    });

    test('returns expected value when size and step both one and replaced with the contents of the same kind of sequence', () => {
        expect(c1.replaceIfReverseWindow(1, 1, e => e[0].val() % 2 === 0, intseq([ 11, 10 ])))
            .toStrictEqual(intseq([ 1, 11, 10, 3, 11, 10, 5, 11, 10, 11, 10, 9, 7, 11, 10 ]));
    });

    test('returns expected value when size and step both one and replaced with the contents of a different kind of sequence', () => {
        expect(c3.replaceIfReverseWindow(1, 1, e => e[0].len() === 0, noteseq([ 11, null, 10 ])))
            .toStrictEqual(chordseq([ [ 11 ], [], [ 10 ], [ 1 ], [ 3, 4 ], [ 5 ], [ 11 ], [], [ 10 ], [ 6, 7, 8 ], [ 9, 10, 11 ], [ 12, 13 ], [ 14, 15, 16 ] ]));
    });

    test('returns expected value when size two and step one and replaced with no values', () => {
        expect(c2.replaceIfWindow(2, 1, e => e.some(m => m.val() === null), []))
            .toStrictEqual(noteseq([ 1, 3, 2, 5, 10, 9, 7, 8 ])); // 3 and 10 appear because replace done before second find
    });

    test('returns expected array value when size two and step one and replaced with no values', () => {
        expect(c2.replaceIfReverseWindow(2, 1, e => e.some(m => m.val() === null), []))
            .toStrictEqual(noteseq([ 1, 4, 2, 5, 6, 9, 7, 8 ])); // 4 and 6 appear because replace done before second find
    });

    // TODO: This behaviour seems anomalous
    test('handles when sequence truncated so much that the loop regresses before the start', () => {
        expect(c1.replaceIfReverseWindow(5, 1, (_, i) => i < 4, e => e.slice(1, 3))).toStrictEqual(intseq([ 1, 4, 5, 6 ]));
    });

    test('returns expected array value when size two and step two and replaced by duplicating first value', () => {
        expect(c3.replaceIfReverseWindow(2, 2, e => e[1].len() > e[0].len(), e => [ e[0], e[1], e[0] ]))
            .toStrictEqual(chordseq([ [], [ 1 ], [ 3, 4 ], [ 1 ], [ 5 ], [], [ 6, 7, 8 ], [ 9, 10, 11 ], [ 12, 13 ], [ 14, 15, 16 ], [ 12, 13 ] ]));
    });

    test('adds multivalued members when size two and step two and replaced by number[]', () => {
        expect(c3.replaceIfReverseWindow(3, 3, e => e[1].len() > e[0].len(), [ -1, -2, -3 ]))
            .toStrictEqual(chordseq([ [ -1 ], [ -2 ], [ -3 ], [ 5 ], [], [ 6, 7, 8 ], [ 9, 10, 11 ], [ 12, 13 ], [ 14, 15, 16 ] ]));
    });

    test('adds multivalued members when size two and step two and replaced by number[][]', () => {
        expect(c3.replaceIfReverseWindow(3, 3, e => e[1].len() > e[0].len(), [ [ -1, -2, -3 ] ]))
            .toStrictEqual(chordseq([ [ -1, -2, -3 ], [ 5 ], [], [ 6, 7, 8 ], [ 9, 10, 11 ], [ 12, 13 ], [ 14, 15, 16 ] ]));
    });
});

describe('Sequence.setSlice()', () => {
    test('returns unchanged when slice length is 0', () => {
        expect(intseq([ 1, 2, 3, 4, 5 ]).setSlice(2, 2, new NumSeqMember(6))).toStrictEqual(intseq([ 1, 2, 3, 4, 5 ]));
    });

    test('returns changed value when slice length is defined in reverse order', () => {
        expect(intseq([ 1, 2, 3, 4, 5 ]).setSlice(3, 1, 6)).toStrictEqual(intseq([ 1, 6, 6, 4, 5 ]));
    });

    test('returns changed value when slice length is 1 with end defined using a negative index', () => {
        expect(noteseq([ 1, 2, 3, 4, 5 ]).setSlice(2, -2, [])).toStrictEqual(noteseq([ 1, 2, null, 4, 5 ]));
    });

    test('replaces to end when start defined using negative index and end undefined', () => {
        expect(chordseq([ 1, 2, 3, 4, 5, 6 ]).setSlice(-3, undefined, [ 4, 5 ])).toStrictEqual(chordseq([ [ 1 ], [ 2 ], [ 3 ], [ 4, 5 ], [ 4, 5 ], [ 4, 5 ]]));
    });

    test('replaces from start when start undefined and end defined', () => {
        expect(melody([ 1, 2, 3, 4 ]).setSlice(undefined, 3, new NumSeqMember(6))).toStrictEqual(melody([ 6, 6, 6, 4 ]));
    });
});

describe('Sequence.loop()', () => {
    test('throws when looping a zero-length sequence', () => {
        expect(() => intseq([]).loop(5)).toThrow();
    });

    test('throws when trying to loop with an out-of-range starting index', () => {
        expect(() => noteseq([ 1, 2, 3 ]).loop(8, 3)).toThrow();
    });

    test('loops a 1-length sequence correctly', () => {
        expect(chordseq([ [ 1, 2 ] ]).loop(4)).toStrictEqual(chordseq([ [ 1, 2 ], [ 1, 2 ], [ 1, 2 ], [ 1, 2 ] ]));
    });

    test('loops a 3-length sequence correctly', () => {
        expect(noteseq([ 1, 2, 3 ]).loop(8)).toStrictEqual(noteseq([ 1, 2, 3, 1, 2, 3, 1, 2 ]));
    });

    test('loops a 3-length sequence correctly when using a positive starting index', () => {
        expect(noteseq([ 1, 2, 3 ]).loop(8, 1)).toStrictEqual(noteseq([ 2, 3, 1, 2, 3, 1, 2, 3 ]));
    });

    test('loops a 3-length sequence correctly when using a negative starting index', () => {
        expect(noteseq([ 1, 2, 3 ]).loop(8, -1)).toStrictEqual(noteseq([ 3, 1, 2, 3, 1, 2, 3, 1 ]));
    });
});

describe('Sequence.repeat()', () => {
    test('repeating a zero-length sequence returns a zero-length sequence', () => {
        expect(intseq([]).repeat(250)).toStrictEqual(intseq([]));
    });

    test('repeating a 1-length sequence works', () => {
        expect(noteseq([ 5 ]).repeat(2)).toStrictEqual(noteseq([ 5, 5 ]));
    });

    test('repeating once by not passing an argument works', () => {
        expect(chordseq([ 1, 2, 3 ]).repeat()).toStrictEqual(chordseq([ 1, 2, 3, 1, 2, 3 ]));
    });

    test('repeating five times works', () => {
        expect(melody([ 1, 5, 9 ]).repeat(5)).toStrictEqual(melody([ 1, 5, 9, 1, 5, 9, 1, 5, 9, 1, 5, 9, 1, 5, 9 ]));
    });
});

describe('Sequence.dupe()', () => {
    test('duplicating a zero-length sequence returns a zero-length sequence', () => {
        expect(intseq([]).dupe(3)).toStrictEqual(intseq([]));
    });

    test('duplicating a one-length sequence works', () => {
        expect(noteseq([ 5 ]).dupe()).toStrictEqual(noteseq([ 5, 5 ]));
    });

    test('duplicating a longer sequence three times works', () => {
        expect(chordseq([ 1, 3, 4 ]).dupe(4)).toStrictEqual(chordseq([ 1, 1, 1, 1, 3, 3, 3, 3, 4, 4, 4, 4 ]));
    });
});

describe('Sequence.dedupe()', () => {
    test('does nothing to a zero-length sequence', () => {
        expect(intseq([]).dedupe()).toStrictEqual(intseq([]));
    });

    test('does nothing to a sequence without dupes', () => {
        expect(chordseq([ 1, 2, 4, 1 ]).dedupe()).toStrictEqual(chordseq([ 1, 2, 4, 1 ]));
    });

    test('removes all dupes', () => {
        expect(noteseq([ 1, 1, 2, null, null, null, 2, 3, 1, 1, 3, 3, 4, 1, 1, 1, 2, 2, null, null ]).dedupe())
            .toStrictEqual(noteseq([ 1, 2, null, 2, 3, 1, 3, 4, 1, 2, null ]));
    });
});

describe('Sequence.shuffle()', () => {
    const s1 = intseq([ 1, 2, 3, 4, 5, 6, 7, 8 ]);
    const s2 = noteseq([ 1, 2, 3, 4, 1, 2, 3, 4, 5 ]);
    const errortable: [ string, AnySeq, number[] ][] = [
        [ 'shuffle parameter is an array of length 1', s1, [ 0 ] ],
        [ 'shuffle parameter has a missing value', s2, [ 0, 1, 3 ] ],
        [ 'sequence length does not fit shuffle parameter', s1, [ 0, 2, 1 ] ],
    ];

    test.each(errortable)('throws error when %s', (_, s, arg) => {
        expect(() => s.shuffle(arg)).toThrow();
    });

    test('works when shuffle parameter is same length as sequence', () => {
        expect(s1.shuffle([ 0, 7, 1, 6, 2, 5, 3, 4 ])).toStrictEqual(intseq([ 1, 8, 2, 7, 3, 6, 4, 5 ]));
    });

    test('works when shuffle parameter is a fraction of sequence length', () => {
        expect(s2.shuffle([ 0, 2, 1 ])).toStrictEqual(noteseq([ 1, 3, 2, 4, 2, 1, 3, 5, 4 ]));
    });
});

describe('Sequence.pad()', () => {
    const s1 = intseq([ 1, 2, 3, 4, 5 ]);
    const s2 = noteseq([ 3, 4 ]);
    const s3 = chordseq([ [ 1, 2 ], [ 3 ], [] ]);
    const s4 = melody([ 1, 2, 3, 4, 5 ]);

    test('pad with invalid pad argument throws', () => {
        expect(() => s1.pad('0' as unknown as NumSeqMember)).toThrow();
    });

    test('pad with invalid length throws', () => {
        expect(() => s1.pad(new NumSeqMember(55), -1)).toThrow();
    });

    test('pad with one argument works', () => {
        expect(s2.pad(new NoteSeqMember(null))).toStrictEqual(noteseq([ null, 3, 4 ]));
    });

    test('pad with zero length returns same object', () => {
        expect(s2.pad(5, 0)).toBe(s2);
    });

    test('pad with two arguments works', () => {
        expect(s3.pad(new ChordSeqMember([]), 2)).toStrictEqual(chordseq([ [], [], [ 1, 2 ], [ 3 ], [] ]));
    });

    test('pad with event passed as event contents works', () => {
        expect(s4.pad([ 6 ], 2)).toStrictEqual(melody([ 6, 6, 1, 2, 3, 4, 5 ]));
    });
});

describe('Sequence.padTo()', () => {
    const s1 = intseq([ 1, 2, 3, 4, 5 ]);
    const s2 = noteseq([ 3, 4 ]);
    const s3 = chordseq([ [ 1, 2 ], [ 3 ], [] ]);
    const s4 = melody([ 1, 2, 3, 4, 5 ]);

    test('padding with invalid argument throws', () => {
        expect(() => s1.padTo('0' as unknown as NumSeqMember, 8)).toThrow();
    });

    test('padTo with invalid length throws', () => {
        expect(() => s1.padTo(new NumSeqMember(55), -1)).toThrow();
    });

    test('padTo works if now one longer than initial one argument works', () => {
        expect(s2.padTo(new NoteSeqMember(null), 3)).toStrictEqual(noteseq([ null, 3, 4 ]));
    });

    test('padTo works if now one longer than initial one argument works', () => {
        expect(s2.padTo(new NoteSeqMember(null), 4)).toStrictEqual(noteseq([ null, null, 3, 4 ]));
    });

    test('padTo does nothing if required length is same length as existing series', () => {
        expect(s3.padTo(new ChordSeqMember([]), 3)).toStrictEqual(chordseq([ [ 1, 2 ], [ 3 ], [] ]));
    });

    test('padTo does nothing if required length is shorter than existing series', () => {
        expect(s3.padTo(new ChordSeqMember([]), 3)).toStrictEqual(chordseq([ [ 1, 2 ], [ 3 ], [] ]));
    });

    test('padTo with event passed as event contents works', () => {
        expect(s4.padTo([ 6 ], 7)).toStrictEqual(melody([ 6, 6, 1, 2, 3, 4, 5 ]));
    });
});

describe('Sequence.padRight()', () => {
    const s1 = intseq([ 1, 2, 3, 4, 5 ]);
    const s2 = noteseq([ 3, 4 ]);
    const s3 = chordseq([ [ 1, 2 ], [ 3 ], [] ]);
    const s4 = melody([ 1, 2, 3, 4, 5 ]);

    test('padRight with invalid argument throws', () => {
        expect(() => s1.padRight('0' as unknown as NumSeqMember)).toThrow();
    });

    test('padRight with invalid length throws', () => {
        expect(() => s1.padRight(new NumSeqMember(55), -1)).toThrow();
    });

    test('padRight with zero length returns same object', () => {
        expect(s2.padRight(5, 0)).toBe(s2);
    });

    test('padRight with one argument works', () => {
        expect(s2.padRight(new NoteSeqMember(null))).toStrictEqual(noteseq([ 3, 4, null ]));
    });

    test('padRight with two arguments works', () => {
        expect(s3.padRight(new ChordSeqMember([]), 2)).toStrictEqual(chordseq([ [ 1, 2 ], [ 3 ], [], [], [] ]));
    });

    test('pad with event passed as event contents works', () => {
        expect(s4.padRight([ 6 ], 2)).toStrictEqual(melody([ 1, 2, 3, 4, 5, 6, 6 ]));
    });
});

describe('Sequence.padRightTo()', () => {
    const s1 = intseq([ 1, 2, 3, 4, 5 ]);
    const s2 = noteseq([ 3, 4 ]);
    const s3 = chordseq([ [ 1, 2 ], [ 3 ], [] ]);
    const s4 = melody([ 1, 2, 3, 4, 5 ]);

    test('padding with invalid argument throws', () => {
        expect(() => s1.padRightTo('0' as unknown as NumSeqMember, 8)).toThrow();
    });

    test('padRightTo with invalid length throws', () => {
        expect(() => s1.padRightTo(new NumSeqMember(55), -1)).toThrow();
    });

    test('padRightTo works if now one longer than initial one argument works', () => {
        expect(s2.padRightTo(new NoteSeqMember(null), 3)).toStrictEqual(noteseq([ 3, 4, null ]));
    });

    test('padRightTo works if now one longer than initial one argument works', () => {
        expect(s2.padRightTo(new NoteSeqMember(null), 4)).toStrictEqual(noteseq([ 3, 4, null, null ]));
    });

    test('padRightTo does nothing if required length is same length as existing series', () => {
        expect(s3.padRightTo(new ChordSeqMember([]), 3)).toStrictEqual(chordseq([ [ 1, 2 ], [ 3 ], [] ]));
    });

    test('padRightTo does nothing if required length is shorter than existing series', () => {
        expect(s3.padRightTo(new ChordSeqMember([]), 3)).toStrictEqual(chordseq([ [ 1, 2 ], [ 3 ], [] ]));
    });

    test('padRightTo with event passed as event contents works', () => {
        expect(s4.padRightTo([ 6 ], 7)).toStrictEqual(melody([ 1, 2, 3, 4, 5, 6, 6 ]));
    });
});

describe('Sequence.withPitch()', () => {
    const is = intseq([ 1, 4, 2 ]);
    const fs = floatseq([ 1, 4, 2 ]);
    const ns = noteseq([ 1, 4, 2 ]);
    const cs = chordseq([ 1, 4, 2 ]);
    const ms = melody([ 1, 4, 2 ]);

    const errortable: [ string, AnySeq, PitchArgument ][] = [
        [ 'null argument on NumSeq', is, null as unknown as number ],
        [ 'array argument with zero members on NumSeq', is, [] ],
        [ 'array argument with two members on NumSeq', is, [ 1, 4 ] ],
        [ 'float argument on integer NumSeq', is, 1.5 ],
        [ 'array argument with two members on NoteSeq', ns, [ 1, 4 ] ],
        [ 'invalid argument', cs, Infinity ],
    ];

    test.each(errortable)('throws when %s', (_, s, val) => {
        expect(() => s.withPitch(val)).toThrow();
    });

    const table: [ string, AnySeq, PitchArgument, AnySeq ][] = [
        [ 'a number on integer NumSeq', is, 1, intseq([ 1, 1, 1 ]) ],
        [ 'an array of length one on integer NumSeq', is, [ 1 ], intseq([ 1, 1, 1 ]) ],
        [ 'a float argument on float NumSeq', fs, 1.5, floatseq([ 1.5, 1.5, 1.5 ]) ],
        [ 'null argument on NoteSeq', ns, null, noteseq([ null, null, null ]) ],
        [ 'an array of length zero on NoteSeq', ns, [], noteseq([ null, null, null ]) ],
        [ 'an array of length one on NoteSeq', ns, [ 1 ], noteseq([ 1, 1, 1 ]) ],
        [ 'null argument on ChordSeq', cs, null, chordseq([ null, null, null ]) ],
        [ 'an array of length zero on ChordSeq', cs, [], chordseq([ null, null, null ]) ],
        [ 'an array of length one on ChordSeq', cs, [ 1 ], chordseq([ 1, 1, 1 ]) ],
        [ 'an array of length two on ChordSeq', cs, [ 1, 5 ], chordseq([ [ 1, 5 ], [ 1, 5 ], [ 1, 5 ] ]) ],
        [ 'null argument on Melody', ms, null, melody([ null, null, null ]) ],
        [ 'an array of length zero on Melody', ms, [], melody([ null, null, null ]) ],
        [ 'an array of length one on Melody', ms, [ 1 ], melody([ 1, 1, 1 ]) ],
        [ 'an array of length two on Melody', ms, [ 1, 5 ], melody([ [ 1, 5 ], [ 1, 5 ], [ 1, 5 ] ]) ],
    ];

    test.each(table)('works with %s', (_, s, val, ret) => {
        expect(s.withPitch(val)).toStrictEqual(ret);
    });
});

describe('Sequence.withPitches()', () => {
    const is = intseq([ 1, 4, 2 ]);
    const fs = floatseq([ 1, 4, 2 ]);
    const ns = noteseq([ 1, 4, 2 ]);
    const cs = chordseq([ 1, 4, 2 ]);
    const ms = melody([ 1, 4, 2 ]);

    const errortable: [ string, AnySeq, PitchArgument[] | AnySeq ][] = [
        [ 'argument neither an array nor a Sequence', is, null as unknown as PitchArgument[] ],
        [ 'array is too short', is, [ 1, 4 ] ],
        [ 'array is too long', is, [ 1, 4, 2, 3 ] ],
        [ 'NumSeq and array contains nulls', is, [ 1, null as unknown as number, 5 ] ],
        [ 'sequence is too short', ns, intseq([ 1, 4 ]) ],
        [ 'sequence is too long', is, intseq([ 1, 4, 2, 3 ]) ],
        [ 'NumSeq and sequence contains nulls', is, noteseq([ 3, null, 5 ]) ],
        [ 'integer NumSeq and array with a float member', is, [ 1, 1.5, 2 ] ],
        [ 'NumSeq and sequence contains chords', is, chordseq([ [ 3 ], [ 5 ], [ 6, 7 ] ]) ],
        [ 'NoteSeq and sequence contains chords', is, chordseq([ [ 3 ], [ 5 ], [ 6, 7 ] ]) ],
    ];

    test.each(errortable)('throws when %s', (_, s, val) => {
        expect(() => s.withPitches(val)).toThrow();
    });

    const table: [ string, AnySeq, number[] | AnySeq, AnySeq ][] = [
        [ 'a NumSeq taking an array', is, [ 1, 2, 3 ], intseq([ 1, 2, 3 ]) ],
        [ 'a float NumSeq taking an array with floats', fs, [ 1.5, 3.5, 2 ], floatseq([ 1.5, 3.5, 2 ]) ],
        [ 'a NumSeq taking another NumSeq', is, intseq([ 6, 5, 4 ]), intseq([ 6, 5, 4 ]) ],
        [ 'a NumSeq taking a NoteSeq', is, noteseq([ 6, 5, 4 ]), intseq([ 6, 5, 4 ]) ],
        [ 'a NoteSeq taking a ChordSeq', ns, chordseq([ [ 1 ], [], [ 3 ] ]), noteseq([ 1, null, 3 ]) ],
        [ 'a ChordSeq taking a Melody', cs, melody([ [ 6, 5, 4 ], [ 3, 2 ], [ 1 ] ]), chordseq([ [ 6, 5, 4 ], [ 3, 2 ], [ 1 ] ]) ],
        [ 'a Melody taking a NumSeq', ms, intseq([ 1, 5, 9 ]), melody([ 1, 5, 9 ]) ],
    ];

    test.each(table)('works with %s', (_, s, val, ret) => {
        expect(s.withPitches(val)).toStrictEqual(ret);
    });
});

describe('Sequence.withPitchesAt()', () => {
    const is = intseq([ 1, 2, 3, 4, 5 ]);
    const ns = noteseq([ 1, 2, 3, 4, 5 ]);
    const cs = chordseq([ 1, 2, 3, 4, 5 ]);

    const errortable: [ string, AnySeq, SeqIndices, PitchArgument | PitchMapperFn ][] = [
        [ 'replacing out of range', is, -7, 1 ],
        [ 'replacing with array containing out of range', is, [ 0, 1, 2, -7 ], 1 ],
        [ 'invalid replacement', is, 1, null ],
        [ 'invalid replacement via function', ns, 1, [ 2, 3 ] ],
    ];

    test.each(errortable)('%s', (_, s, ix, rep) => {
        expect(() => s.withPitchesAt(ix, rep)).toThrow();
    });

    const table: [ string, AnySeq, SeqIndices, PitchArgument | PitchMapperFn, AnySeq ][] = [
        [ 'replacing with single values', is, 1, -1, intseq([ 1, -1, 3, 4, 5 ]) ],
        [ 'replacing with nulls', ns, [ 0, -2 ], null, noteseq([ null, 2, 3, null, 5 ]) ],
        [ 'replacing with chords', cs, intseq([ 1, 2, 3 ]), [ 1, 2 ], chordseq([ 1, [ 1, 2 ], [ 1, 2 ], [ 1, 2 ], 5 ]) ],
        [ 'replacing with single values via function', is, [ 1, 3 ], (p, i) => p[0] + i, intseq([ 1, 3, 3, 7, 5 ]) ],
        [ 'replacing with multiple values via function', cs, [ -1, -2 ], (p, i) => [ ...p, i ], chordseq([ 1, 2, 3, [ 4, 3 ], [ 5, 4 ] ]) ],
    ];

    test.each(table)('%s', (_, s, ix, rep, ret) => {
        expect(s.withPitchesAt(ix, rep)).toStrictEqual(ret);
    });
});

// TODO: Sequence.mapPitches() [and possibly Sequence.mapPitch() etc as per discussion in notebook]
describe('Sequence.mapPitches()', () => {
    test('mapPitches() using a non-function throws an error', () => {
        expect(() => intseq([]).mapPitches(1 as unknown as MapperFn<number[]>)).toThrow();
    });

    test('throws when function returns non-numeric, non-null non-array value', () => {
        expect(() => noteseq([ 1, null, 3 ]).mapPitches(((v: number[]) => v.length ? v : 'test') as unknown as MapperFn<number[]>)).toThrow();
    });

    test('throws when function returns non-numeric value in array', () => {
        expect(() => chordseq([ 1, null, 3 ]).mapPitches(((v: number[]) => v.length ? v : [ null ]) as unknown as MapperFn<number[]>)).toThrow();
    });

    test('mapPitches() on intseq', () => {
        expect(intseq([ 1, 4, 2, 3, 5 ]).mapPitches((p, i) => [ p[0] + i ])).toStrictEqual(intseq([ 1, 5, 4, 6, 9 ]));
    });

    test('mapPitches() on noteseq, returning nulls and numbers', () => {
        expect(noteseq([ 1, 4, 2, 3, 5 ]).mapPitches((p, i) => p[0] > 3 ? null : p[0] + i)).toStrictEqual(noteseq([ 1, null, 4, 6, null ]));
    });

    test('mapPitches() on chordseq', () => {
        expect(chordseq([ [ 1, 2 ], [ 3 ], [ 4, 5, 6 ] ]).mapPitches(p => p.slice().reverse())).toStrictEqual(chordseq([ [ 2, 1 ], [ 3 ], [ 6, 5, 4 ] ]));
    });
});

describe('Sequence.mapPitch()', () => {
    const ns = noteseq([ 1, null, 2, 3, null, 6 ]);

    test('throws when non-function passed', () => {
        expect(() => ns.mapPitch(555 as unknown as MapperFn<number | null>)).toThrow();
    });

    test('throws when function returns non-numeric value', () => {
        expect(() => ns.mapPitch(() => 'test' as unknown as number)).toThrow();
    });

    test('maps pitches as expected', () => {
        expect(intseq([ 1, 5, 3, 4, 2 ]).mapPitch((v, i) => (v as number) + i)).toStrictEqual(intseq([ 1, 6, 5, 7, 6 ]));
    });

    test('converts numbers and nulls appropriately', () => {
        expect(ns.mapPitch((v, i) => v === null ? i : null)).toStrictEqual(noteseq([ null, 1, null, null, 4, null ]));
    });

    test('converts numbers and nulls appropriately even when multivalued', () => {
        expect(ns.toMelody().mapPitch((v, i) => v === null ? i : null)).toStrictEqual(melody([ null, 1, null, null, 4, null ]));
    });
});

describe('Sequence.mapEachPitch()', () => {
    const is = melody([ [ 1 ], [ 4, 0 ], [ 2 ], [ 3 ], [], [ 6, 7, 8 ] ]);

    test('throws when non-function passed', () => {
        expect(() => is.mapEachPitch(555 as unknown as (p: number, i: number) => number | null)).toThrow();
    });

    test('throws when function returns non-numeric, non-null value', () => {
        expect(() => is.mapEachPitch(((v: number) => v > 1 ? v : 'test') as unknown as (p: number, i: number) => number | null)).toThrow();
    });

    test('maps a noteseq and removes notes when returning nulls', () => {
        expect(noteseq([ 1, 2, 3, 4, 5 ]).mapEachPitch(p => p % 2 ? p + 1 : null))
            .toStrictEqual(noteseq([ 2, null, 4, null, 6 ]));
    });

    test('maps a melody as expected', () => {
        expect(is.mapEachPitch((p, i) => p as number * i))
            .toStrictEqual(melody([ [ 0 ], [ 4, 0 ], [ 4 ], [ 9 ], [], [ 30, 35, 40 ] ]));
    });
});

describe('Sequence.filterPitches()', () => {
    const s = chordseq([ [], [ 1 ], [ 2, 3 ], [ 4, 5, 6 ], [ 7, 8, 9, 10 ]]);

    test('works on a noteseq', () => {
        expect(noteseq([ 1, 2, 3, 4, 5 ]).filterPitches(p => !(p % 2))).toStrictEqual(noteseq([ null, 2, null, 4, null ]));
    });

    test('works on a chordseq', () => {
        expect(s.filterPitches(p => !(p % 2))).toStrictEqual(chordseq([ [], [], [ 2 ], [ 4, 6 ], [ 8, 10 ] ]));
    });

    test('passes the correct second argument to the filter function', () => {
        expect(s.toMelody().filterPitches((p, i) => p !== i)).toStrictEqual(melody([ [], [], [ 3 ], [ 4, 5, 6 ], [ 7, 8, 9, 10 ] ]));
    });
});
// TODO: Sequence.filterPitches() [for similar reasons]

describe('Sequence.keepTopPitches()', () => {
    const errortable: [ string, AnySeq, number ][] = [
        [ 'a non-integer number of pitches', noteseq([]), 1.5 ],
        [ 'a negative number of pitches', chordseq([]), -1 ],
        [ 'zero pitches on a numseq', floatseq([ 0.5, 1.5, 2.5 ]), 0 ],
    ];

    test.each(errortable)('throws when %s', (_, s, num) => {
        expect(() => s.keepTopPitches(num)).toThrow();
    });

    const table: [ string, AnySeq, number, AnySeq ][] = [
        [ 'top zero pitches in a noteseq', noteseq([ 1, 2, null, 3 ]), 0, noteseq([ null, null, null, null ]) ],
        [ 'top zero pitches in a chordseq', chordseq([ [ 1, 2 ], [], [ 3 ] ]), 0, chordseq([ [], [], [] ])],
        [ 'top pitch in a numseq', intseq([ 1, 2, 3 ]), 1, intseq([ 1, 2, 3 ]) ],
        [ 'top pitch in a noteseq', noteseq([ 1, 2, null, 3 ]), 1, noteseq([ 1, 2, null, 3 ]) ],
        [ 'top pitch in a chordseq', chordseq([ [ 1, 2, 3 ], [], [ 2, 6 ] ]), 1, chordseq([ [ 3 ], [], [ 6 ] ])],
        [ 'top two pitches in a numseq', intseq([ 1, 2, 3 ]), 2, intseq([ 1, 2, 3 ]) ],
        [ 'top two pitches in a noteseq', noteseq([ 1, 2, null, 3 ]), 2, noteseq([ 1, 2, null, 3 ]) ],
        [ 'top two pitches in a chordseq', chordseq([ [ 1, 2, 3 ], [], [ 2, 6 ] ]), 2, chordseq([ [ 2, 3 ], [], [ 2, 6 ] ])],
        [ 'top four pitches in a chordseq', chordseq([ [ 1, 2, 3 ], [], [ 2, 6 ] ]), 4, chordseq([ [ 1, 2, 3 ], [], [ 2, 6 ] ])],
    ];

    test.each(table)('get expected results with %s', (_, s, num, ret) => {
        expect(s.keepTopPitches(num)).toStrictEqual(ret);
    });
});

describe('Sequence.keepBottomPitches()', () => {
    const errortable: [ string, AnySeq, number ][] = [
        [ 'a non-integer number of pitches', noteseq([]), 1.5 ],
        [ 'a negative number of pitches', chordseq([]), -1 ],
        [ 'zero pitches on a numseq', floatseq([ 0.5, 1.5, 2.5 ]), 0 ],
    ];

    test.each(errortable)('throws when %s', (_, s, num) => {
        expect(() => s.keepBottomPitches(num)).toThrow();
    });

    const table: [ string, AnySeq, number, AnySeq ][] = [
        [ 'top zero pitches in a noteseq', noteseq([ 1, 2, null, 3 ]), 0, noteseq([ null, null, null, null ]) ],
        [ 'top zero pitches in a chordseq', chordseq([ [ 1, 2 ], [], [ 3 ] ]), 0, chordseq([ [], [], [] ])],
        [ 'top pitch in a numseq', intseq([ 1, 2, 3 ]), 1, intseq([ 1, 2, 3 ]) ],
        [ 'top pitch in a noteseq', noteseq([ 1, 2, null, 3 ]), 1, noteseq([ 1, 2, null, 3 ]) ],
        [ 'top pitch in a chordseq', chordseq([ [ 1, 2, 3 ], [], [ 2, 6 ] ]), 1, chordseq([ [ 1 ], [], [ 2 ] ])],
        [ 'top two pitches in a numseq', intseq([ 1, 2, 3 ]), 2, intseq([ 1, 2, 3 ]) ],
        [ 'top two pitches in a noteseq', noteseq([ 1, 2, null, 3 ]), 2, noteseq([ 1, 2, null, 3 ]) ],
        [ 'top two pitches in a chordseq', chordseq([ [ 1, 2, 3 ], [], [ 2, 6 ] ]), 2, chordseq([ [ 1, 2 ], [], [ 2, 6 ] ])],
        [ 'top four pitches in a chordseq', chordseq([ [ 1, 2, 3 ], [], [ 2, 6 ] ]), 4, chordseq([ [ 1, 2, 3 ], [], [ 2, 6 ] ])],
    ];

    test.each(table)('get expected results with %s', (_, s, num, ret) => {
        expect(s.keepBottomPitches(num)).toStrictEqual(ret);
    });
});

describe('Sequence.transpose()', () => {
    const s1 = intseq([ -1, 0, 3, 2, 6, 4 ]);
    const s2 = floatseq([ 2.5, 3, 4.5 ]);
    const s3 = chordseq([ [ 1, 2 ], [], [ 3, 4, 6 ]]);

    test('fails when non-numeric value passed', () => {
        expect(() => s3.transpose('1' as unknown as number)).toThrow();
    });

    test('fails when non-integer value passed for intseq', () => {
        expect(() => s1.transpose(1.5)).toThrow();
    });

    test('succeeds with positive transpostion', () => {
        expect(s1.transpose(5)).toStrictEqual(intseq([ 4, 5, 8, 7, 11, 9 ]));
    });

    test('succeeds for float transposition', () => {
        expect(s2.transpose(1.2)).toStrictEqual(floatseq([ 3.7, 4.2, 5.7 ]));
    });

    test('succeeds with negative transposition', () => {
        expect(s3.transpose(-4)).toStrictEqual(chordseq([ [ -3, -2, ], [], [ -1, 0, 2 ] ]));
    });
});

describe('Sequence.transposeToMax()', () => {
    const s0 = noteseq([ null, null, null ]);
    const s1 = intseq([ -1, 0, 3, 2, 6, 4 ]);
    const s2 = floatseq([ 2.5, 3, 4.5 ]);
    const s3 = chordseq([ [ 1, 2 ], [], [ 3, 4, 6 ]]);

    test('fails when non-numeric value passed', () => {
        expect(() => s3.transposeToMax('1' as unknown as number)).toThrow();
    });

    test('fails when non-integer value passed for intseq', () => {
        expect(() => s1.transposeToMax(1.5)).toThrow();
    });

    test('returns self when there are no notes in the sequence', () => {
        expect(s0.transposeToMax(12)).toBe(s0);
    });

    test('succeeds with positive transpostion', () => {
        expect(s1.transposeToMax(11)).toStrictEqual(intseq([ 4, 5, 8, 7, 11, 9 ]));
    });

    test('succeeds for float transposition', () => {
        expect(s2.transposeToMax(5.7)).toStrictEqual(floatseq([ 3.7, 4.2, 5.7 ]));
    });

    test('succeeds with negative transposition', () => {
        expect(s3.transposeToMax(2)).toStrictEqual(chordseq([ [ -3, -2, ], [], [ -1, 0, 2 ] ]));
    });
});

describe('Sequence.transposeToMin()', () => {
    const s0 = noteseq([ null, null, null ]);
    const s1 = intseq([ -1, 0, 3, 2, 6, 4 ]);
    const s2 = floatseq([ 2.5, 3, 4.5 ]);
    const s3 = chordseq([ [ 1, 2 ], [], [ 3, 4, 6 ]]);

    test('fails when non-numeric value passed', () => {
        expect(() => s3.transposeToMin('1' as unknown as number)).toThrow();
    });

    test('fails when non-integer value passed for intseq', () => {
        expect(() => s1.transposeToMin(1.5)).toThrow();
    });

    test('returns self when there are no notes in the sequence', () => {
        expect(s0.transposeToMin(12)).toBe(s0);
    });

    test('succeeds with positive transpostion', () => {
        expect(s1.transposeToMin(4)).toStrictEqual(intseq([ 4, 5, 8, 7, 11, 9 ]));
    });

    test('succeeds for float transposition', () => {
        expect(s2.transposeToMin(3.7)).toStrictEqual(floatseq([ 3.7, 4.2, 5.7 ]));
    });

    test('succeeds with negative transposition', () => {
        expect(s3.transposeToMin(-3)).toStrictEqual(chordseq([ [ -3, -2, ], [], [ -1, 0, 2 ] ]));
    });
});

describe('Sequence.invert()', () => {
    const s1 = intseq([ -2, 0, 3, 2, 6, 4 ]);
    const s2 = floatseq([ 2.5, 3, 4.2 ]);
    const s3 = chordseq([ [ 1, 2 ], [], [ 3, 4, 6 ]]);

    test('fails when non-numeric value passed', () => {
        expect(() => s3.invert('1' as unknown as number)).toThrow();
    });

    test('fails when non-integer values generated for intseq', () => {
        expect(() => s1.invert(1.25)).toThrow();
    });

    test('succeeds with int inversion', () => {
        expect(s1.invert(-0.5)).toStrictEqual(intseq([ 1, -1, -4, -3, -7, -5 ]));
    });

    test('succeeds for float inversion', () => {
        expect(s2.invert(3.7)).toStrictEqual(floatseq([ 4.9, 4.4, 3.2 ]));
    });

    test('succeeds with chord inversion', () => {
        expect(s3.invert(2)).toStrictEqual(chordseq([ [ 3, 2 ], [], [ 1, 0, -2 ] ]));
    });
});

describe('Sequence.augment()', () => {
    const s1 = intseq([ -2, 0, 2, 2, 6, 4 ]);
    const s2 = floatseq([ 2.5, 3, 4.5 ]);
    const s3 = chordseq([ [ 1, 2 ], [], [ 3, 4, 6 ]]);

    test('fails when non-numeric value passed', () => {
        expect(() => s3.augment('1' as unknown as number)).toThrow();
    });

    test('fails when non-integer values generated for intseq', () => {
        expect(() => s1.augment(1.25)).toThrow();
    });

    test('succeeds with int augmentation', () => {
        expect(s1.augment(-0.5)).toStrictEqual(intseq([ 1, -0, -1, -1, -3, -2 ]));
    });

    test('succeeds for float augmentation', () => {
        expect(s2.augment(1.5)).toStrictEqual(floatseq([ 3.75, 4.5, 6.75 ]));
    });

    test('succeeds with chord augmentation', () => {
        expect(s3.augment(2)).toStrictEqual(chordseq([ [ 2, 4 ], [], [ 6, 8, 12 ] ]));
    });
});

describe('Sequence.diminish()', () => {
    const s1 = intseq([ -2, 0, 2, 2, 6, 4 ]);
    const s2 = floatseq([ 2.5, 3, 4.5 ]);
    const s3 = chordseq([ [ 1, 2 ], [], [ 3, 4, 6 ]]);

    test('fails when non-numeric value passed', () => {
        expect(() => s3.diminish('1' as unknown as number)).toThrow();
    });

    test('fails when non-integer values generated for intseq', () => {
        expect(() => s1.diminish(0.8)).toThrow();
    });

    test('succeeds with int diminish', () => {
        expect(s1.diminish(-2)).toStrictEqual(intseq([ 1, -0, -1, -1, -3, -2 ]));
    });

    test('succeeds for float diminish', () => {
        expect(s2.diminish(2 / 3)).toStrictEqual(floatseq([ 3.75, 4.5, 6.75 ]));
    });

    test('succeeds with chord diminish', () => {
        expect(s3.diminish(0.5)).toStrictEqual(chordseq([ [ 2, 4 ], [], [ 6, 8, 12 ] ]));
    });
});

describe('Sequence.mod()', () => {
    const s1 = intseq([ -14, -12, -7, -1, 0, 2, 3, 6, 4 ]);
    const s2 = floatseq([ 2.5, -3, 4.5 ]);
    const s3 = chordseq([ [ 1, 22 ], [], [ -3, 4, 6 ]]);

    test('fails when non-numeric value passed', () => {
        expect(() => s3.mod('1' as unknown as number)).toThrow();
    });

    test('succeeds with int mod', () => {
        expect(s1.mod(4)).toStrictEqual(intseq([ 2, -0, 1, 3, 0, 2, 3, 2, 0 ]));
    });

    test('succeeds for float mod', () => {
        expect(s2.mod(2.5)).toStrictEqual(floatseq([ 0, 2, 2 ]));
    });

    test('succeeds with chord mod', () => {
        expect(s3.mod(10)).toStrictEqual(chordseq([ [ 1, 2 ], [], [ 7, 4, 6 ] ]));
    });
});

describe('Sequence.trim()', () => {
    const s1 = intseq([ -10, 10, 0, 4, 18 ]);
    const s2 = floatseq([ 2.2, 3.3, -1.1 ]);
    const s3 = chordseq([ [ 1, 22 ], [], [ -3, 4, 6 ]]);

    test('fails when non-numeric value passed as first argument', () => {
        expect(() => s1.trim('1' as unknown as number, 10)).toThrow();
    });

    test('fails when non-numeric value passed as first argument', () => {
        expect(() => s2.trim(10, '1' as unknown as number)).toThrow();
    });

    test('fails when non-integer value used', () => {
        expect(() => s3.trim(1, 17.2)).toThrow();
    });

    test('succeeds as expected for ints', () => {
        expect(s1.trim(-5, 5)).toStrictEqual(intseq([ -5, 5, 0, 4, 5 ]));
    });

    test('succeeds with first value null', () => {
        expect(s1.trim(null, 5)).toStrictEqual(intseq([ -10, 5, 0, 4, 5 ]));
    });

    test('succeeds with second value null', () => {
        expect(s1.trim(-5, null)).toStrictEqual(intseq([ -5, 10, 0, 4, 18 ]));
    });

    test('succeeds as expected for floats', () => {
        expect(s2.trim(-0.5, 3)).toStrictEqual(floatseq([ 2.2, 3, -0.5 ]));
    });

    test('succeeds as expected for chords', () => {
        expect(s3.trim(-2, 13)).toStrictEqual(chordseq([ [ 1, 13 ], [], [ -2, 4, 6 ] ]));
    });
});

describe('Sequence.bounce()', () => {
    const s1 = intseq([ -10, 10, 0, 4, 18 ]);
    const s2 = floatseq([ 2.2, 3.3, -1.1 ]);
    const s3 = chordseq([ [ 1, 22 ], [], [ -3, 4, 6 ]]);

    test('fails when non-numeric value passed as first argument', () => {
        expect(() => s1.bounce('1' as unknown as number, 10)).toThrow();
    });

    test('fails when non-numeric value passed as first argument', () => {
        expect(() => s2.bounce(10, '1' as unknown as number)).toThrow();
    });

    test('fails when non-integer value used', () => {
        expect(() => s3.bounce(1, 17.2)).toThrow();
    });

    test('succeeds as expected for ints', () => {
        expect(s1.bounce(-5, 5)).toStrictEqual(intseq([ 0, 0, 0, 4, -2 ]));
    });

    test('succeeds with first value null', () => {
        expect(s1.bounce(null, 5)).toStrictEqual(intseq([ -10, 0, 0, 4, -8 ]));
    });

    test('succeeds with second value null', () => {
        expect(s1.bounce(5, null)).toStrictEqual(intseq([ 20, 10, 10, 6, 18 ]));
    });

    test('succeeds as expected for floats', () => {
        const ret = s2.bounce(-0.4, 1);

        expect(ret.valAt(0).val()).toBeCloseTo(-0.2);
        expect(ret.valAt(1).val()).toBeCloseTo(0.5);
        expect(ret.valAt(2).val()).toBeCloseTo(0.3);
    });

    test('succeeds as expected for chords', () => {
        expect(s3.bounce(-2, 5)).toStrictEqual(chordseq([ [ 1, 2 ], [], [ -1, 4, 4 ] ]));
    });
});

describe('Sequence.scale()', () => {
    const s1 = intseq([ -7, -2, 5, 0, 2, 8, 13 ]);
    const s2 = chordseq([ [ 1, 22 ], [], [ -3, 4, 6 ]]);

    const errortable: [ string, string | number[], number, number | undefined ][] = [
        [ 'scale with a name that doesn\'t exist', 'imaginary', 0, 12 ],
        [ 'non-numeric, non-string scale', 500 as unknown as number[], 0, 12 ],
        [ 'scale with no notes in it', [], 0, 12 ],
        [ 'non-numeric zero value', 'chromatic', '0' as unknown as number, 12 ],
        [ 'non-numeric octave length', 'chromatic', 0, '0' as unknown as number ],
    ];

    test.each(errortable)('fails when %s', (_, scale, zero, octave) => {
        expect(() => s1.scale(scale, zero, octave)).toThrow();
    });

    const table: [ string, AnySeq, string | number[], number, number | undefined, AnySeq ][] = [
        [ 'lydian scale', s2, 'lydian', 60, undefined, chordseq([ [ 62, 98 ], [], [ 55, 67, 71 ] ]) ],
        [ 'chromatic scale but 24-note octave', s2, 'chromatic', 60, 24, chordseq([ [ 61, 94 ], [], [ 45, 64, 66 ] ]) ],
        [ 'whole tone scale', s1, [ 0, 2, 4, 6, 8, 10 ], 72, 12, intseq([ 58, 68, 82, 72, 76, 88, 98 ]) ],
    ];

    test.each(table)('gives expected result when %s', (_, seq, scale, zero, octave, ret) => {
        expect(seq.scale(scale, zero, octave)).toStrictEqual(ret);
    });
});

describe('Sequence.gamut()', () => {
    const s1 = intseq([ 0, -2, 1, 3, 2, 4, 5, -7, 6, 14 ]);
    const s2 = chordseq([ [ 1, 22 ], [], [ -3, 4, 6 ]]);
    const s3 = floatseq([ 0, -2, 1, 3, 2, 4, 5, -7, 6, 14 ]);

    const errortable: [ string, number[], GamutOpts | undefined ][] = [
        [ 'gamut is not an array', 500 as unknown as number[], {} ],
        [ 'gamut contains an invalid value', [ 0, 1, '2' as unknown as number, 3 ], {} ],
        [ 'options contains a zero value that\'s not in the gamut', [ 0, 1, 2, 3 ], { zero: 7 } ],
        [ 'options contains a non-numeric lowVal', [ 0, 1, 2, 3 ], { lowVal: '0' as unknown as number } ],
        [ 'options contains a non-numeric highVal', [ 0, 1, 2, 3 ], { highVal: '0' as unknown as number } ],
    ];

    test.each(errortable)('fails when %s', (_, gamut, opts) => {
        expect(() => s2.gamut(gamut, opts)).toThrow();
    });

    const table: [ string, AnySeq, number[], GamutOpts | undefined, AnySeq ][] = [
        [ 'no options passed', s1, [ 2, 1, 0, 5, 4, 3 ], undefined, intseq([ 2, 4, 1, 5, 0, 4, 3, 3, 2, 0 ]) ],
        [ 'empty options passed', s1, [ 2, 1, 0, 5, 4, 3 ], {}, intseq([ 2, 4, 1, 5, 0, 4, 3, 3, 2, 0 ]) ],
        [ 'zero-value passed', s1, [ 2, 1, 0, 5, 4, 3 ], { zero: 4 }, intseq([ 4, 0, 3, 1, 2, 0, 5, 5, 4, 2 ]) ],
        [ 'low-value passed', s2, [ 5, 4, 3, 2, 1, 0 ], { lowVal: 10 }, chordseq([ [ 4, 1 ], [], [ 10, 1, 5 ] ]) ],
        [ 'high-value passed', s2, [ 5, 4, 3, 2, 1, 0 ], { highVal: 10 }, chordseq([ [ 4, 10 ], [], [ 2, 1, 10 ] ]) ],
        [ 'all options passed', s3, [ 10, -10, 6.5, -6.5, 0 ], { zero: 6.5, lowVal: -16, highVal: 16 }, floatseq([ 6.5, 10, -6.5, 16, 0, 16, 16, -16, 16, 16 ]) ],
    ];

    test.each(table)('gives expected result when %s', (_, seq, gamut, opts, ret) => {
        expect(seq.gamut(gamut, opts)).toStrictEqual(ret);
    });
});

describe('Sequence.filterInPosition()', () => {
    const s1 = intseq([ 0, -2, 5, 2, 4, 5 ]);
    const s2 = chordseq([ [ 1, 22 ], [], [ -3, 4, 6 ]]);

    test('throws if function passed is not a function', () => {
        expect(() => s1.filterInPosition(1 as unknown as FilterFn<NumSeqMember>, new NumSeqMember(1))).toThrow();
    });

    test('throws if nullval passed is not valid', () => {
        expect(() => s2.filterInPosition((_, i) => i % 2 === 0, '1' as unknown as ChordSeqMember)).toThrow();
    });

    test('fails when nullval not passed and numeric sequence', () => {
        expect(() => s1.partitionInPosition(e => e.val() > 2)).toThrow();
    });

    test('works as expected on intseq', () => {
        expect(s1.filterInPosition(e => e.val() < 5, new NumSeqMember(3))).toStrictEqual(intseq([ 0, -2, 3, 2, 4, 3 ]));
    });

    test('works as expected on chordseq with nullval passed as array value', () => {
        expect(s2.filterInPosition((_, i) => i % 2 === 0, [ 7, 8 ])).toStrictEqual(chordseq([ [ 1, 22 ], [ 7, 8 ], [ -3, 4, 6 ] ]));
    });

    test('works as expected on chordseq with nullval not passed', () => {
        expect(s2.filterInPosition((_, i) => i % 2 === 0)).toStrictEqual(chordseq([ [ 1, 22 ], [], [ -3, 4, 6 ] ]));
    });
});

describe('Sequence.mapWindow()', () => {
    const s1 = intseq([ 0, -2, 1, 3, 2, 4, 5, -7, 6, 14 ]);
    const s2 = chordseq([ [ 1, 22 ], [ -3, 4, 6 ], [], [ 2 ], [ 11 ] ]);
    const s3 = floatseq([ 0, -2, 1, 3, 2, 4, 5, -7, 6, 14 ]);

    const errortable: [ string, number, number, MapperFn<NumSeqMember[]> ][] = [
        [ 'mapper function is not a function', 5, 5, 0 as unknown as MapperFn<NumSeqMember[]> ],
        [ 'size is not a positive integer', 0, 5, (e: NumSeqMember[]) => e ],
        [ 'step is not a positive integer', 5, 0, (e: NumSeqMember[]) => e ],
    ];

    test.each(errortable)('fails when %s', (_, size, step, fn) => {
        expect(() => s1.mapWindow(size, step, fn)).toThrow();
    });

    test('size and step one, result length one', () => {
        expect(s1.mapWindow(1, 1, ((a, i) => a.map(e => e.transpose(i)))))
            .toStrictEqual(intseq([ 0, -1, 3, 6, 6, 9, 11, 0, 14, 23 ]));
    });

    test('size and step one, result length varied', () => {
        expect(s2.mapWindow(1, 1, ((a, i) => i % 2 ? [ ...a, ...a ] : [])))
            .toStrictEqual(chordseq([ [ -3, 4, 6 ], [ -3, 4, 6 ], [ 2 ], [ 2 ] ]));
    });

    test('size more than one, step one', () => {
        expect(s3.mapWindow(2, 1, a => a.reverse()))
            .toStrictEqual(floatseq([ -2, 0, 1, -2, 3, 1, 2, 3, 4, 2, 5, 4, -7, 5, 6, -7, 14, 6 ]));
    });

    test('size one, step more than one but a subdivision of sequence length', () => {
        expect(s3.mapWindow(1, 2, (a, i) => a.map(e => e.transpose(i / 2))))
            .toStrictEqual(floatseq([ 0, 1.5, 3, 6.5, 8 ]));
    });

    test('size and step more than one', () => {
        expect(s1.mapWindow(3, 2, a => a.reverse()))
            .toStrictEqual(intseq([ 1, -2, 0, 2, 3, 1, 5, 4, 2, 6, -7, 5 ]));
    });
});

describe('Sequence.filterWindow()', () => {
    const s1 = intseq([ 0, -2, 1, 3, 2, 4, 5, -7, 6, 14 ]);
    const s2 = chordseq([ [ 1, 22 ], [ -3, 4, 6 ], [], [ 2 ], [ 11 ] ]);
    const s3 = floatseq([ 0, -2, 1, 3, 2, 4, 5, -7, 6, 14 ]);

    const errortable: [ string, number, number, FilterFn<NumSeqMember[]> ][] = [
        [ 'filter function is not a function', 5, 5, 0 as unknown as FilterFn<NumSeqMember[]> ],
        [ 'size is not a positive integer', 0, 5, () => true ],
        [ 'step is not a positive integer', 5, 0, () => true ],
    ];

    test.each(errortable)('fails when %s', (_, size, step, fn) => {
        expect(() => s1.filterWindow(size, step, fn)).toThrow();
    });

    test('size and step one', () => {
        expect(s1.filterWindow(1, 1, (a, i) => a[0].val() > i))
            .toStrictEqual(intseq([ 14 ]));
    });

    test('size more than one, step one', () => {
        expect(s3.filterWindow(2, 1, a => a[0].val() < a[1].val()))
            .toStrictEqual(floatseq([ -2, 1, 1, 3, 2, 4, 4, 5, -7, 6, 6, 14 ]));
    });

    test('size one, step more than one but a subdivision of sequence length', () => {
        expect(s2.filterWindow(1, 2, a => a[0].len() > 0))
            .toStrictEqual(chordseq([ [ 1, 22 ], [ 11 ] ]));
    });

    test('size and step more than one', () => {
        expect(s1.filterWindow(3, 2, a => a[0].val() < a[1].val()))
            .toStrictEqual(intseq([ 1, 3, 2, 2, 4, 5 ]));
    });
});

describe('Sequence.sort()', () => {
    const s1 = intseq([ 0, -2, 1, 3, 2, 4, 5, -7, 6, 14 ]);
    const s2 = chordseq([ [ 1, 22 ], [ -3, 4, 6 ], [], [ 2 ], [ 11 ] ]);

    test('fails when sort function is not a function', () => {
        expect(() => s2.sort(0 as unknown as (a: ChordSeqMember, b: ChordSeqMember) => number)).toThrow();
    });

    test('fails when filter function is not a function', () => {
        expect(() => s1.sort((a, b) => a.val() - b.val(), 0 as unknown as FilterFn<NumSeqMember>)).toThrow();
    });

    test('sorts as expected without filter function', () => {
        expect(s2.sort((a, b) => a.len() - b.len()))
            .toStrictEqual(chordseq([ [], [ 2 ], [ 11 ], [ 1, 22 ], [ -3, 4, 6 ] ]));
    });

    test('sorts as expected with filter function', () => {
        expect(s1.sort((a, b) => a.val() - b.val(), e => e.val() % 3 !== 0))
            .toStrictEqual(intseq([ 0, -7, -2, 3, 1, 2, 4, 5, 6, 14 ]));
    });
});

describe('Sequence.chop()', () => {
    const s1 = intseq([ 0, -2, 1, 3, 2, 4, 5, -7, 6, 14 ]);
    const s2 = chordseq([ [ 1, 22 ], [ -3, 4, 6 ], [], [ 2 ], [ 11 ] ]);

    test('fails when length is not a positive integer', () => {
        expect(() => s1.chop(0)).toThrow();
    });

    test('chops at length 1', () => {
        expect(s2.chop(1)).toStrictEqual([
            chordseq([ [ 1, 22 ] ]), chordseq([ [ -3, 4, 6 ] ]), chordseq([ [] ]), chordseq([ [ 2 ] ]), chordseq([ [ 11 ] ]) 
        ]);
    });

    test('truncates incomplete slice', () => {
        expect(s1.chop(3)).toStrictEqual([
            intseq([ 0, -2, 1 ]), intseq([ 3, 2, 4 ]), intseq([ 5, -7, 6 ])
        ]);
    });
});

describe('Sequence.partitionInPosition()', () => {
    const s1 = intseq([ 0, -2, 1, 3, 2, 4, 5, -7, 6, 14 ]);
    const s2 = chordseq([ [ 1, 22 ], [ -3, 4, 6 ], [], [ 2 ], [ 11 ] ]);

    test('fails when partition function is not a function', () => {
        expect(() => s2.partitionInPosition(0 as unknown as FilterFn<ChordSeqMember>, new ChordSeqMember([ -5 ]))).toThrow();
    });

    test('fails when nullval cannot be valid', () => {
        expect(() => s1.partitionInPosition(e => e.val() > 2, new ChordSeqMember([ 1, 2 ]) as unknown as NumSeqMember)).toThrow();
    });

    test('fails when nullval not passed and numeric sequence', () => {
        expect(() => s1.partitionInPosition(e => e.val() > 2)).toThrow();
    });

    test('partitions as expected with event as nullval', () => {
        expect(s1.partitionInPosition(e => e.val() > 2, new NumSeqMember(-5))).toStrictEqual([
            intseq([ -5, -5, -5, 3, -5, 4, 5, -5, 6, 14 ]),
            intseq([ 0, -2, 1, -5, 2, -5, -5, -7, -5, -5 ]),
        ]);
    });

    test('partitions chordseq as expected with array as nullval', () => {
        expect(s2.partitionInPosition(e => e.len() > 1, [ -5, 2 ])).toStrictEqual([
            chordseq([ [ 1, 22 ], [ -3, 4, 6 ], [ -5, 2 ], [ -5, 2 ], [ -5, 2 ] ]),
            chordseq([ [ -5, 2 ], [ -5, 2 ], [], [ 2 ], [ 11 ] ]),
        ]);
    });

    test('partitions chordseq as expected with nullval not passed', () => {
        expect(s2.partitionInPosition(e => e.len() > 1, null)).toStrictEqual([
            chordseq([ [ 1, 22 ], [ -3, 4, 6 ], [], [], [] ]),
            chordseq([ [], [], [], [ 2 ], [ 11 ] ]),
        ]);
    });
});

describe('Sequence.groupByInPosition()', () => {
    const s1 = intseq([ 0, 8, 1, 3, 2, 4, 5, 17, 6, 14 ]);
    const s2 = chordseq([ [ 1, 22 ], [ -3, 4, 6 ], [], [ 2 ], [ 11 ] ]);

    test('fails when group function is not a function', () => {
        expect(() => s2.groupByInPosition(0 as unknown as (e: ChordSeqMember, i?: number) => string, new ChordSeqMember([ 0 ]))).toThrow();
    });

    test('fails when nullval cannot be valid', () => {
        expect(() => s1.groupByInPosition(e => String(e.val() % 3), new ChordSeqMember([ 1, 2 ]) as unknown as NumSeqMember)).toThrow();
    });

    test('fails when nullval not passed and numeric sequence', () => {
        expect(() => s1.groupByInPosition(e => String(e.val() % 3))).toThrow();
    });

    test('groups as expected with event as nullval', () => {
        expect(s1.groupByInPosition(e => String(e.val() % 3), new NumSeqMember(-5))).toStrictEqual({
            '0': intseq([ 0, -5, -5, 3, -5, -5, -5, -5, 6, -5 ]),
            '1': intseq([ -5, -5, 1, -5, -5, 4, -5, -5, -5, -5 ]),
            '2': intseq([ -5, 8, -5, -5, 2, -5, 5, 17, -5, 14 ])
        });
    });

    test('groups chordseq as expected with array value as nullval', () => {
        expect(s2.groupByInPosition(e => String(e.len()), [ -5, 6 ])).toStrictEqual({
            '0': chordseq([ [ -5, 6 ], [ -5, 6 ], [], [ -5, 6 ], [ -5, 6 ] ]),
            '1': chordseq([ [ -5, 6 ], [ -5, 6 ], [ -5, 6 ], [ 2 ], [ 11 ] ]),
            '2': chordseq([ [ 1, 22 ], [ -5, 6 ], [ -5, 6 ], [ -5, 6 ], [ -5, 6 ] ]),
            '3': chordseq([ [ -5, 6 ], [ -3, 4, 6 ], [ -5, 6 ], [ -5, 6 ], [ -5, 6 ] ]),
        });
    });

    test('groups chordseq as expected with nullval not passed', () => {
        expect(s2.groupByInPosition(e => String(e.len()))).toStrictEqual({
            '0': chordseq([ [], [], [], [], [] ]),
            '1': chordseq([ [], [], [], [ 2 ], [ 11 ] ]),
            '2': chordseq([ [ 1, 22 ], [], [], [], [] ]),
            '3': chordseq([ [], [ -3, 4, 6 ], [], [], [] ]),
        });
    });
});

describe('Sequence.untwine()', () => {
    const s1 = intseq([ 0, 8, 1, 3, 2, 4, 5, 17, 6 ]);
    const s2 = chordseq([ [], [ 1, 22 ], [ -3, 4, 6 ], [], [ 2 ], [ 11 ] ]);

    test('fails when argument is not a positive integer', () => {
        expect(() => s1.untwine(0)).toThrow();
    });

    test('fails when argument is not a factor of the sequence length', () => {
        expect(() => s2.untwine(5)).toThrow();
    });

    test('succeeds on an intseq', () => {
        expect(s1.untwine(3)).toStrictEqual([
            intseq([ 0, 3, 5 ]), intseq([ 8, 2, 17 ]), intseq([ 1, 4, 6 ]),
        ]);
    });

    test('succeeds on a chordseq', () => {
        expect(s2.untwine(2)).toStrictEqual([
            chordseq([ [], [ -3, 4, 6 ], [ 2 ] ]), chordseq([ [ 1, 22 ], [], [ 11 ] ]) 
        ]);
    });
});

describe('Sequence.twine()', () => {
    test('fails when one of the sequences is not a sequence', () => {
        expect(() => intseq([ 1, 2, 3 ]).twine(intseq([ 4, 5, 6 ]), 0 as unknown as NumSeq)).toThrow();
    });

    test('fails when one of the sequences is of a different length', () => {
        expect(() => chordseq([ 1, 2, 3 ]).twine(chordseq([ 4, 5, 6 ]), chordseq([ 7, 8 ]))).toThrow();
    });

    test('does nothing when twwining itself', () => {
        expect(intseq([ 1, 2, 3 ]).twine()).toStrictEqual(intseq([ 1, 2, 3 ]));
    });

    test('twines multiple sequences', () => {
        expect(intseq([ 1, 2, 3 ]).twine(intseq([ 4, 5, 6 ]), intseq([ 7, 8, 9 ]), intseq([ 10, 11, 12 ])))
            .toStrictEqual(intseq([ 1, 4, 7, 10, 2, 5, 8, 11, 3, 6, 9, 12 ]));
    });
});

describe('Sequence.combine()', () => {
    test('fails when passed function is not a function', () => {
        expect(() => intseq([ 1, 2, 3 ]).combine(0 as unknown as (...a: NumSeqMember[]) => NumSeqMember, intseq([ 4, 5, 6 ])))
            .toThrow();
    });

    test('fails when sequences are of different lengths', () => {
        expect(() => intseq([ 1, 2, 3 ]).combine((...a: NumSeqMember[]) => a[0], intseq([ 4, 5, 6 ]), intseq([ 7, 8 ])))
            .toThrow();
    });

    test('works when nothing is passed', () => {
        expect(chordseq([ [ 1 ], [ 2, 3 ], [ 4 ]]).combine((...a: ChordSeqMember[]) => a[0]))
            .toStrictEqual(chordseq([ [ 1 ], [ 2, 3, ], [ 4 ] ]));
    });

    test('works to sum all series', () => {
        expect(intseq([ 1, 2, 3 ]).combine(
            (...a: NumSeqMember[]) => new NumSeqMember(a[0].val() + a[1].val() + a[2].val()), intseq([ 4, 5, 6 ]), intseq([ 7, 8, 9 ]))
        ).toStrictEqual(intseq([ 12, 15, 18 ]));
    });
});

describe('Sequence.flatCombine()', () => {
    test('fails when passed function is not a function', () => {
        expect(() => intseq([ 1, 2, 3 ]).flatCombine(0 as unknown as (...a: NumSeqMember[]) => NumSeqMember, intseq([ 4, 5, 6 ])))
            .toThrow();
    });

    test('fails when sequences are of different lengths', () => {
        expect(() => intseq([ 1, 2, 3 ]).flatCombine((...a: NumSeqMember[]) => a[0], intseq([ 4, 5, 6 ]), intseq([ 7, 8 ])))
            .toThrow();
    });

    test('works when nothing is passed', () => {
        expect(chordseq([ [ 1 ], [ 2, 3 ], [ 4 ]]).flatCombine((...a: ChordSeqMember[]) => a[0]))
            .toStrictEqual(chordseq([ [ 1 ], [ 2, 3, ], [ 4 ] ]));
    });

    test('works with different length results', () => {
        function combiner(...a: NumSeqMember[]) {
            switch (a[0].val()) {
            case 0: return [];
            case 1: return [ a[0] ];
            case 2: return [ a[0], a[1] ];
            default: return a;
            }
        }

        expect(intseq([ 0, 1, 2, 3 ]).flatCombine(combiner, intseq([ 3, 4, 5, 6 ]), intseq([ 6, 7, 8, 9 ])))
            .toStrictEqual(intseq([ 1, 2, 5, 3, 6, 9 ]));
    });
});

describe('Sequence.combineMin()', () => {
    test('fails when sequences are of different lengths', () => {
        expect(() => intseq([ 1, 2, 3 ]).combineMin(intseq([ 4, 5, 6 ]), intseq([ 7, 8 ])));
    });

    test('fails when sequences are of different types', () => {
        expect(() => intseq([ 1, 2, 3 ]).combineMin(intseq([ 4, 5, 6 ]), chordseq([ 7, 8, 9 ]) as unknown as NumSeq));
    });

    test('takes minima when nothing is passed', () => {
        expect(chordseq([ [ 1 ], [ 2, 3 ], [ 4 ]]).combineMin()).toStrictEqual(chordseq([ [ 1 ], [ 2 ], [ 4 ] ]));
    });

    test('works with multiple series', () => {
        expect(intseq([ 1, 6, 9 ]).combineMin(intseq([ 0, 11, 4 ]), intseq([ 6, 7, 8 ]), intseq([ 3, -1, 5 ]))).toStrictEqual(intseq([ 0, -1, 4 ]));
    });
});

describe('Sequence.combineMax()', () => {
    test('fails when sequences are of different lengths', () => {
        expect(() => intseq([ 1, 2, 3 ]).combineMax(intseq([ 4, 5, 6 ]), intseq([ 7, 8 ])));
    });

    test('fails when sequences are of different types', () => {
        expect(() => intseq([ 1, 2, 3 ]).combineMax(intseq([ 4, 5, 6 ]), chordseq([ 7, 8, 9 ]) as unknown as NumSeq));
    });

    test('takes maxima when nothing is passed', () => {
        expect(chordseq([ [ 1 ], [ 2, 3 ], [ 4 ]]).combineMax()).toStrictEqual(chordseq([ [ 1 ], [ 3 ], [ 4 ] ]));
    });

    test('works with multiple series', () => {
        expect(intseq([ 1, 6, 9 ]).combineMax(intseq([ 0, 11, 4 ]), intseq([ 6, 7, 8 ]), intseq([ 3, -1, 5 ]))).toStrictEqual(intseq([ 6, 11, 9 ]));
    });
});

describe('Sequence.combineOr()', () => {
    test('fails when sequences are of different lengths', () => {
        expect(() => intseq([ 1, 2, 3 ]).combineOr(intseq([ 4, 5, 6 ]), intseq([ 7, 8 ])));
    });

    test('fails when sequences are of different types', () => {
        expect(() => intseq([ 1, 2, 3 ]).combineOr(intseq([ 4, 5, 6 ]), chordseq([ 7, 8, 9 ]) as unknown as NumSeq));
    });

    test('takes existing values when nothing is passed', () => {
        expect(intseq([ 1, 2, 3, 4 ]).combineOr()).toStrictEqual(intseq([ 1, 2, 3, 4 ]));
    });

    test('works as expected with multiple series', () => {
        expect(chordseq([ [ 1, 4 ], [ 2, 3 ], [ 4 ]]).combineOr(
            chordseq([ [ 1, 4, 6 ], [ 2, 4 ], [ 3, 5 ] ]),
            chordseq([ [ 1, 2, 4 ], [ 1, 2, 3 ], [] ])
        )).toStrictEqual(chordseq([ [ 1, 2, 4, 6 ], [ 1, 2, 3, 4 ], [ 3, 4, 5 ] ]));
    });
});

describe('Sequence.combineAnd()', () => {
    test('fails when sequences are of different lengths', () => {
        expect(() => intseq([ 1, 2, 3 ]).combineAnd(intseq([ 4, 5, 6 ]), intseq([ 7, 8 ])));
    });

    test('fails when sequences are of different types', () => {
        expect(() => intseq([ 1, 2, 3 ]).combineAnd(intseq([ 4, 5, 6 ]), chordseq([ 7, 8, 9 ]) as unknown as NumSeq));
    });

    test('takes existing values when nothing is passed', () => {
        expect(intseq([ 1, 2, 3, 4 ]).combineAnd()).toStrictEqual(intseq([ 1, 2, 3, 4 ]));
    });

    test('works as expected with multiple series', () => {
        expect(chordseq([ [ 1, 4 ], [ 2, 3 ], [ 4 ]]).combineAnd(
            chordseq([ [ 1, 4, 6 ], [ 2, 4 ], [ 3, 5 ] ]),
            chordseq([ [ 1, 2, 4 ], [ 1, 2, 3 ], [] ])
        )).toStrictEqual(chordseq([ [ 1, 4 ], [ 2 ], [] ]));
    });
});

describe('Sequence.zipWith()', () => {
    test('fails when sequences are of different lengths', () => {
        expect(() => intseq([ 1, 2, 3 ]).zipWith(intseq([ 4, 5, 6 ]), intseq([ 7, 8 ])));
    });

    test('fails when sequences are of different types', () => {
        expect(() => intseq([ 1, 2, 3 ]).zipWith(intseq([ 4, 5, 6 ]), chordseq([ 7, 8, 9 ]) as unknown as NumSeq));
    });

    test('takes existing values when nothing is passed', () => {
        expect(chordseq([ 1, 2, 3, 4 ]).zipWith())
            .toStrictEqual([ chordseq([ 1 ]), chordseq([ 2 ]), chordseq([ 3 ]), chordseq([ 4 ]) ]);
    });

    test('zips multiple sequences as expected', () => {
        expect(intseq([ 1, 2, 3 ]).zipWith(intseq([ 4, 5, 6 ]), intseq([ 7, 8, 9 ]), intseq([ 10, 11, 12 ])))
            .toStrictEqual([ intseq([ 1, 4, 7, 10 ]), intseq([ 2, 5, 8, 11 ]), intseq([ 3, 6, 9, 12 ]) ]);
    });
});

describe('Sequence.mapWith()', () => {
    test('fails when function is not a function', () => {
        expect(() => chordseq([]).mapWith(
            0 as unknown as (vals: ChordSeqMember[], i?: number) => ChordSeqMember[] | ChordSeqMember,
            chordseq([])
        )).toThrow();
    });

    test('fails when sequences are of different lengths', () => {
        expect(() => intseq([ 1, 2, 3 ]).mapWith((a: NumSeqMember[]) => a[0], intseq([ 4, 5, 6 ]), intseq([ 7, 8 ])));
    });

    test('fails when sequences are of different types', () => {
        expect(() => intseq([ 1, 2, 3 ]).mapWith((a: NumSeqMember[]) => a[0], intseq([ 4, 5, 6 ]), chordseq([ 7, 8, 9 ]) as unknown as NumSeq));
    });

    test('returns empty arrays when sequences are empty', () => {
        expect(chordseq([]).mapWith((a: ChordSeqMember[]) => a.reverse(), chordseq([]), chordseq([])))
            .toStrictEqual([ chordseq([]), chordseq([]), chordseq([]) ]);
    });

    test('works on existing values when nothing is passed', () => {
        expect(chordseq([ 1, 2, 3, 4 ]).mapWith((a: ChordSeqMember[]) => a[0].transpose(1))).toStrictEqual([ chordseq([ 2, 3, 4, 5 ]) ]);
    });

    test('maps multiple sequences as expected', () => {
        expect(intseq([ 1, 2, 3 ]).mapWith(
            (a: NumSeqMember[]) => a.reverse().map(e => e.transpose(1)),
            intseq([ 4, 5, 6 ]), intseq([ 7, 8, 9 ]), intseq([ 10, 11, 12 ]))
        ).toStrictEqual([ intseq([ 11, 12, 13 ]), intseq([ 8, 9, 10 ]), intseq([ 5, 6, 7 ]), intseq([ 2, 3, 4 ]) ]);
    });
});

describe('Sequence.filterWith()', () => {
    test('fails when function is not a function', () => {
        expect(() => chordseq([]).filterWith(
            0 as unknown as (vals: ChordSeqMember[], i?: number) => boolean,
            chordseq([])
        )).toThrow();
    });

    test('fails when sequences are of different lengths', () => {
        expect(() => intseq([ 1, 2, 3 ]).filterWith(() => true, intseq([ 4, 5, 6 ]), intseq([ 7, 8 ])));
    });

    test('fails when sequences are of different types', () => {
        expect(() => intseq([ 1, 2, 3 ]).filterWith(() => true, intseq([ 4, 5, 6 ]), chordseq([ 7, 8, 9 ]) as unknown as NumSeq));
    });

    test('returns empty sequences when sequences are empty', () => {
        expect(chordseq([]).filterWith(() => true, chordseq([]), chordseq([])))
            .toStrictEqual([ chordseq([]), chordseq([]), chordseq([]) ]);
    });

    test('works on existing values when nothing is passed', () => {
        expect(chordseq([ 1, 2, 3, 4 ]).filterWith(() => true)).toStrictEqual([ chordseq([ 1, 2, 3, 4 ]) ]);
    });

    test('works correctly when everything is filtered out', () => {
        expect(intseq([ 1, 2, 3 ]).filterWith( () => false,
            intseq([ 4, 5, 6 ]), intseq([ 7, 8, 9 ]), intseq([ 10, 11, 12 ]))
        ).toStrictEqual([ intseq([]), intseq([]), intseq([]), intseq([]) ]);
    });

    test('filters multiple sequences as expected', () => {
        expect(intseq([ 1, 2, 3 ]).filterWith(
            (a: NumSeqMember[]) => a[0].val() % 2 !== 0,
            intseq([ 4, 5, 6 ]), intseq([ 7, 8, 9 ]), intseq([ 10, 11, 12 ]))
        ).toStrictEqual([ intseq([ 1, 3 ]), intseq([ 4, 6 ]), intseq([ 7, 9 ]), intseq([ 10, 12 ]) ]);
    });
});

describe('Sequence.exchangeValuesIf()', () => {
    test('fails when comparator is not a function', () => {
        expect(() => intseq([ 1, 2, 3 ]).exchangeValuesIf(0 as unknown as () => boolean, intseq([ 7, 8, 9 ]))).toThrow();
    });

    test('fails when sequences are of different lengths', () => {
        expect(() => intseq([ 1, 2, 3 ]).exchangeValuesIf(() => true, intseq([ 7, 8 ]))).toThrow();
    });

    test('fails when sequences are of different types', () => {
        expect(() => intseq([ 1, 2, 3 ]).exchangeValuesIf(() => true, chordseq([ 7, 8, 9 ]) as unknown as NumSeq)).toThrow();
    });

    test('works when sequences are empty', () => {
        expect(chordseq([]).exchangeValuesIf(() => true, chordseq([]))).toStrictEqual([ chordseq([]), chordseq([]) ]);
    });

    test('exchanges when expected', () => {
        expect(intseq([ 1, 2, 3, 4, 5, 6 ]).exchangeValuesIf(
            (e1: NumSeqMember, e2: NumSeqMember, i?: number) => e1.val() === 2 || e2.val() === 2 || i === 2,
            intseq([ 6, 5, 4, 3, 2, 1 ])
        )).toStrictEqual([ intseq([ 1, 5, 4, 4, 2, 6 ]), intseq([ 6, 2, 3, 3, 5, 1 ]) ]);
    });
});

describe('Sequence.toNumSeq()', () => {
    test('fails when non-numeric values included', () => {
        expect(() => noteseq([ 4, null, 2 ]).toNumSeq()).toThrow();
    });

    test('succeeds when values are appropriate', () => {
        expect(noteseq([ 1, 2, 3 ]).withTrackName('testing').toNumSeq())
            .toStrictEqual(intseq([ 1, 2, 3 ]).withTrackName('testing'));

        expect(chordseq([ [ 1 ], [ 2 ], [ 3 ] ]).withTrackName('testing').toNumSeq())
            .toStrictEqual(intseq([ 1, 2, 3 ]).withTrackName('testing'));

        expect(melody([ [ 1 ], [ 2 ], [ 3 ] ]).withTrackName('testing').toNumSeq())
            .toStrictEqual(intseq([ 1, 2, 3 ]).withTrackName('testing'));
    });
});

describe('Sequence.toNoteSeq()', () => {
    test('fails when non-numeric values included', () => {
        expect(() => chordseq([ [ 4 ], [], [ 2, 3 ] ]).toNoteSeq()).toThrow();
    });

    test('succeeds when values are appropriate', () => {
        expect(intseq([ 1, 2, 3 ]).withTrackName('testing').toNoteSeq())
            .toStrictEqual(noteseq([ 1, 2, 3 ]).withTrackName('testing'));

        expect(chordseq([ [ 1 ], [], [ 3 ] ]).withTrackName('testing').toNoteSeq())
            .toStrictEqual(noteseq([ 1, null, 3 ]).withTrackName('testing'));

        expect(melody([ [ 1 ], [], [ 3 ] ]).withTrackName('testing').toNoteSeq())
            .toStrictEqual(noteseq([ 1, null, 3 ]).withTrackName('testing'));
    });
});

describe('Sequence.toChordSeq()', () => {
    test('succeeds when values are appropriate', () => {
        expect(intseq([ 1, 2, 3 ]).withTrackName('testing').toChordSeq())
            .toStrictEqual(chordseq([ [ 1 ], [ 2 ] , [ 3 ] ]).withTrackName('testing'));

        expect(noteseq([ 1, null, 3 ]).withTrackName('testing').toChordSeq())
            .toStrictEqual(chordseq([ [ 1 ], [] , [ 3 ] ]).withTrackName('testing'));

        expect(melody([ 1, [ 0, 2 ], 3 ]).withTrackName('testing').toChordSeq())
            .toStrictEqual(chordseq([ [ 1 ], [ 0, 2 ] , [ 3 ] ]).withTrackName('testing'));
    });
});

describe('Sequence.toMelody()', () => {
    test('succeeds when values are appropriate', () => {
        expect(intseq([ 1, 2, 3 ]).withTrackName('testing').toMelody())
            .toStrictEqual(melody([ [ 1 ], [ 2 ] , [ 3 ] ]).withTrackName('testing'));

        expect(noteseq([ 1, null, 3 ]).withTrackName('testing').toMelody())
            .toStrictEqual(melody([ [ 1 ], [] , [ 3 ] ]).withTrackName('testing'));

        expect(chordseq([ [ 1 ], [ 0, 2 ], [ 3 ] ]).withTrackName('testing').toMelody())
            .toStrictEqual(melody([ [ 1 ], [ 0, 2 ] , [ 3 ] ]).withTrackName('testing'));
    });
});

// Tests for functionality affected by the overriding of replacer()
describe('Sequence.insertBefore()', () => {
    test('works when inserting a number', () => {
        expect(intseq([ 1, 2, 3 ]).insertBefore(1, 5)).toStrictEqual(intseq([ 1, 5, 2, 3 ]));
    });

    test('works when inserting a number via a function', () => {
        expect(intseq([ 1, 2, 3 ]).insertBefore(1, e => e.val() - 4)).toStrictEqual(intseq([ 1, -2, 2, 3 ]));
    });

    test('inserting number[] inserts multiple single values', () => {
        expect(chordseq([ [ 1, 2 ], [ 3 ]]).insertBefore(0, [ 4, 5 ])).toStrictEqual(chordseq([ [ 4 ], [ 5 ], [ 1, 2 ], [ 3 ] ]));
    });

    test('inserting number[] via a function inserts multiple single values', () => {
        expect(chordseq([ [ 1, 2 ], [ 3 ]]).insertBefore(0, e => [ e.val()[0] + 4, e.val()[1] - 5 ])).toStrictEqual(chordseq([ [ 5 ], [ -3 ], [ 1, 2 ], [ 3 ] ]));
    });

    test('inserting number[][] inserts multivalued members', () => {
        expect(melody([ [ 1, 2 ], [ 3 ]]).insertBefore(0, [ [ 4, 5 ], [ 6, 7 ] ] )).toStrictEqual(melody([ [ 4, 5 ], [ 6, 7 ], [ 1, 2 ], [ 3 ] ]));
    });

    test('inserting number[][] via a function inserts multivalued members', () => {
        expect(melody([ [ 1, 2 ], [ 3 ]]).insertBefore(0, e => [ [ e.pitches()[0] + 4, e.pitches()[1] - 5 ] ])).toStrictEqual(melody([ [ 5, -3 ], [ 1, 2 ], [ 3 ] ]));
    });
});

describe('Sequence.insertAfter()', () => {
    test('works when inserting a number', () => {
        expect(intseq([ 1, 2, 3 ]).insertAfter(1, 5)).toStrictEqual(intseq([ 1, 2, 5, 3 ]));
    });

    test('works when inserting a number via a function', () => {
        expect(intseq([ 1, 2, 3 ]).insertAfter(1, e => e.val() - 4)).toStrictEqual(intseq([ 1, 2, -2, 3 ]));
    });

    test('inserting number[] inserts multiple single values', () => {
        expect(chordseq([ [ 1, 2 ], [ 3 ]]).insertAfter(0, [ 4, 5 ])).toStrictEqual(chordseq([ [ 1, 2 ], [ 4 ], [ 5 ], [ 3 ] ]));
    });

    test('inserting number[] via a function inserts multiple single values', () => {
        expect(chordseq([ [ 1, 2 ], [ 3 ]]).insertAfter(0, e => [ e.val()[0] + 4, e.val()[1] - 5 ])).toStrictEqual(chordseq([ [ 1, 2 ], [ 5 ], [ -3 ], [ 3 ] ]));
    });

    test('inserting number[][] inserts multivalued members', () => {
        expect(melody([ [ 1, 2 ], [ 3 ]]).insertAfter(0, [ [ 4, 5 ], [ 6, 7 ] ] )).toStrictEqual(melody([ [ 1, 2 ], [ 4, 5 ], [ 6, 7 ], [ 3 ] ]));
    });

    test('inserting number[][] via a function inserts multivalued members', () => {
        expect(melody([ [ 1, 2 ], [ 3 ]]).insertAfter(0, e => [ [ e.pitches()[0] + 4, e.pitches()[1] - 5 ] ])).toStrictEqual(melody([ [ 1, 2 ], [ -3, 5 ], [ 3 ] ]));
    });
});

describe('Sequence.replaceIndices()', () => {
    test('replaces with a number', () => {
        expect(intseq([ 1, 2, 3, 4 ]).replaceIndices([ 1, 2 ], 0)).toStrictEqual(intseq([ 1, 0, 0, 4 ]));
    });

    test('replaces with a number via a function', () => {
        expect(intseq([ 1, 2, 3, 4 ]).replaceIndices([ 1, 2 ], e => e.val() + 3)).toStrictEqual(intseq([ 1, 5, 6, 4 ]));
    });

    test('replacing with a number[] inserts multiple single values', () => {
        expect(chordseq([ 1, 2, 3, 4 ]).replaceIndices([ 1, 2 ], [ 4, 5 ])).toStrictEqual(chordseq([ 1, 4, 5, 4, 5, 4 ]));
    });

    test('replacing with a number[] via a function inserts multiple single values', () => {
        expect(chordseq([ 1, 2, 3, 4 ]).replaceIndices([ 1, 2 ], e => [ e.val()[0] + 3, e.val()[0] - 4 ])).toStrictEqual(chordseq([ 1, 5, -2, 6, -1, 4 ]));
    });

    test('replacing with number[][] inserts multivalued members', () => {
        expect(melody([ 1, 2, 3, 4 ]).replaceIndices([ 1, 2 ], [ [ 4, 5 ], [ 6, 7 ] ])).toStrictEqual(melody([ 1, [ 4, 5 ], [ 6, 7 ], [ 4, 5 ], [ 6, 7 ], 4 ]));
    });

    test('replacing with a number[][] via a function inserts multiple single values', () => {
        expect(melody([ 1, 2, 3, 4 ]).replaceIndices([ 1, 2 ], e => [ [ e.pitches()[0] + 3, e.pitches()[0] - 4 ] ])).toStrictEqual(melody([ 1, [ -2, 5 ], [ -1, 6 ], 4 ]));
    });
});

describe('Sequence.replaceFirstIndex()', () => {
    const fn = (e: SeqMember<unknown>) => (e.min() as number) > 2;

    test('replaces with a number', () => {
        expect(intseq([ 1, 2, 3, 4 ]).replaceFirstIndex(fn, 0)).toStrictEqual(intseq([ 1, 2, 0, 4 ]));
    });

    test('replaces with a number via a function', () => {
        expect(intseq([ 4, 3, 2, 1 ]).replaceFirstIndex(fn, e => e.val() + 3)).toStrictEqual(intseq([ 7, 3, 2, 1 ]));
    });

    test('replacing with a number[] inserts multiple single values', () => {
        expect(chordseq([ 1, 2, 3, 4 ]).replaceFirstIndex(fn, [ 4, 5 ])).toStrictEqual(chordseq([ 1, 2, 4, 5, 4 ]));
    });

    test('replacing with a number[] via a function inserts multiple single values', () => {
        expect(chordseq([ 4, 3, 2, 1 ]).replaceFirstIndex(fn, e => [ e.val()[0] + 3, e.val()[0] - 4 ])).toStrictEqual(chordseq([ 7, 0, 3, 2, 1 ]));
    });

    test('replacing with number[][] inserts multivalued members', () => {
        expect(melody([ 1, 2, 3, 4 ]).replaceFirstIndex(fn, [ [ 4, 5 ], [ 6, 7 ] ])).toStrictEqual(melody([ 1, 2, [ 4, 5 ], [ 6, 7 ], 4 ]));
    });

    test('replacing with a number[][] via a function inserts multiple single values', () => {
        expect(melody([ 4, 3, 2, 1 ]).replaceFirstIndex(fn, e => [ [ e.pitches()[0] + 3, e.pitches()[0] - 4 ] ])).toStrictEqual(melody([ [ 0, 7 ], 3, 2, 1 ]));
    });
});

describe('Sequence.replaceLastIndex()', () => {
    const fn = (e: SeqMember<unknown>) => (e.min() as number) > 2;

    test('replaces with a number', () => {
        expect(intseq([ 1, 2, 3, 4 ]).replaceLastIndex(fn, 0)).toStrictEqual(intseq([ 1, 2, 3, 0 ]));
    });

    test('replaces with a number via a function', () => {
        expect(intseq([ 4, 3, 2, 1 ]).replaceLastIndex(fn, e => e.val() + 3)).toStrictEqual(intseq([ 4, 6, 2, 1 ]));
    });

    test('replacing with a number[] inserts multiple single values', () => {
        expect(chordseq([ 1, 2, 3, 4 ]).replaceLastIndex(fn, [ 4, 5 ])).toStrictEqual(chordseq([ 1, 2, 3, 4, 5 ]));
    });

    test('replacing with a number[] via a function inserts multiple single values', () => {
        expect(chordseq([ 4, 3, 2, 1 ]).replaceLastIndex(fn, e => [ e.val()[0] + 3, e.val()[0] - 4 ])).toStrictEqual(chordseq([ 4, 6, -1, 2, 1 ]));
    });

    test('replacing with number[][] inserts multivalued members', () => {
        expect(melody([ 1, 2, 3, 4 ]).replaceLastIndex(fn, [ [ 4, 5 ], [ 6, 7 ] ])).toStrictEqual(melody([ 1, 2, 3, [ 4, 5 ], [ 6, 7 ] ]));
    });

    test('replacing with a number[][] via a function inserts multiple single values', () => {
        expect(melody([ 4, 3, 2, 1 ]).replaceLastIndex(fn, e => [ [ e.pitches()[0] + 3, e.pitches()[0] - 4 ] ])).toStrictEqual(melody([ 4, [ -1, 6 ], 2, 1 ]));
    });
});

describe('Sequence.replaceIf()', () => {
    const fn = (e: SeqMember<unknown>) => (e.min() as number) % 2 === 0;

    test('replaces with a number', () => {
        expect(intseq([ 1, 2, 3, 4 ]).replaceIf(fn, 0)).toStrictEqual(intseq([ 1, 0, 3, 0 ]));
    });

    test('replaces with a number via a function', () => {
        expect(intseq([ 4, 3, 2, 1 ]).replaceIf(fn, e => e.val() + 3)).toStrictEqual(intseq([ 7, 3, 5, 1 ]));
    });

    test('replacing with a number[] inserts multiple single values', () => {
        expect(chordseq([ 1, 2, 3, 4 ]).replaceIf(fn, [ 4, 5 ])).toStrictEqual(chordseq([ 1, 4, 5, 3, 4, 5 ]));
    });

    test('replacing with a number[] via a function inserts multiple single values', () => {
        expect(chordseq([ 4, 3, 2, 1 ]).replaceIf(fn, e => [ e.val()[0] + 3, e.val()[0] - 4 ])).toStrictEqual(chordseq([ 7, 0, 3, 5, -2, 1 ]));
    });

    test('replacing with number[][] inserts multivalued members', () => {
        expect(melody([ 1, 2, 3, 4 ]).replaceIf(fn, [ [ 4, 5 ], [ 6, 7 ] ])).toStrictEqual(melody([ 1, [ 4, 5 ], [ 6, 7 ], 3, [ 4, 5 ], [ 6, 7 ] ]));
    });

    test('replacing with a number[][] via a function inserts multiple single values', () => {
        expect(melody([ 4, 3, 2, 1 ]).replaceIf(fn, e => [ [ e.pitches()[0] + 3, e.pitches()[0] - 4 ] ])).toStrictEqual(melody([ [ 0, 7 ], 3, [ -2, 5 ], 1 ]));
    });
});

describe('Sequence.replaceNth()', () => {
    test('replaces with a number', () => {
        expect(intseq([ 1, 2, 3, 4 ]).replaceNth(2, 0)).toStrictEqual(intseq([ 0, 2, 0, 4 ]));
    });

    test('replaces with a number via a function', () => {
        expect(intseq([ 4, 3, 2, 1 ]).replaceNth(2, e => e.val() + 3)).toStrictEqual(intseq([ 7, 3, 5, 1 ]));
    });

    test('replacing with a number[] inserts multiple single values', () => {
        expect(chordseq([ 1, 2, 3, 4 ]).replaceNth(2, [ 4, 5 ])).toStrictEqual(chordseq([ 4, 5, 2, 4, 5, 4 ]));
    });

    test('replacing with a number[] via a function inserts multiple single values', () => {
        expect(chordseq([ 4, 3, 2, 1 ]).replaceNth(2, e => [ e.val()[0] + 3, e.val()[0] - 4 ])).toStrictEqual(chordseq([ 7, 0, 3, 5, -2, 1 ]));
    });

    test('replacing with number[][] inserts multivalued members', () => {
        expect(melody([ 1, 2, 3, 4 ]).replaceNth(2, [ [ 4, 5 ], [ 6, 7 ] ])).toStrictEqual(melody([ [ 4, 5 ], [ 6, 7 ], 2, [ 4, 5 ], [ 6, 7 ], 4 ]));
    });

    test('replacing with a number[][] via a function inserts multiple single values', () => {
        expect(melody([ 4, 3, 2, 1 ]).replaceNth(2, e => [ [ e.pitches()[0] + 3, e.pitches()[0] - 4 ] ])).toStrictEqual(melody([ [ 0, 7 ], 3, [ -2, 5 ], 1 ]));
    });
});

describe('Sequence.replaceSlice()', () => {
    test('replaces with a number', () => {
        expect(intseq([ 1, 2, 3, 4 ]).replaceSlice(1, 3, 0)).toStrictEqual(intseq([ 1, 0, 4 ]));
    });

    test('replaces with a number via a function', () => {
        expect(intseq([ 4, 3, 2, 1 ]).replaceSlice(1, 3, s => s.length)).toStrictEqual(intseq([ 4, 2, 1 ]));
    });

    test('replacing with a number[] inserts multiple single values', () => {
        expect(chordseq([ 1, 2, 3, 4 ]).replaceSlice(1, 3, [ 4, 5 ])).toStrictEqual(chordseq([ 1, 4, 5, 4 ]));
    });

    test('replacing with a number[] via a function inserts multiple single values', () => {
        expect(chordseq([ 4, 3, 2, 1 ]).replaceSlice(1, 3, s => [ s.min(), s.max() ])).toStrictEqual(chordseq([ 4, 2, 3, 1 ]));
    });

    test('replacing with number[][] inserts multivalued members', () => {
        expect(melody([ 1, 2, 3, 4 ]).replaceSlice(1, 3, [ [ 4, 5 ], [ 6, 7 ] ])).toStrictEqual(melody([ 1, [ 4, 5 ], [ 6, 7 ], 4 ]));
    });

    // TODO: Figure out typing issues with .replaceSlice() and determine if this particular example should be permitted
    //test('replacing with a number[][] via a function inserts multiple single values', () => {
    //    expect(melody([ 4, 3, 2, 1 ]).replaceSlice(1, 3, s => [ [ s.min(), s.max() ] ])).toStrictEqual(melody([ 4, [ 2, 3 ], 1 ]));
    //});
});