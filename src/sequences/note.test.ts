import NoteSeq from './note';

import { noteseq, microtonalnoteseq, intseq } from '../factory';

describe('NoteSeq.from() via factory', () => {
    const c = noteseq([ 1, 2, 3 ]);

    test('NoteSeq.from() with melody argument and same validator returns same object', () => {
        expect(NoteSeq.from(c)).toBe(c);
    });

    test('NoteSeq.from() with melody argument and different validator returns different object with same contents', () => {
        const c2 = microtonalnoteseq(c);

        expect(c2).not.toBe(c);
        expect(c2.contents).toStrictEqual(c.contents);
    });

    test('NoteSeq.from() taking contents from an intseq via factory', () => {
        expect(noteseq(intseq([ 1, 2, 3 ]))).toStrictEqual(c);
    });
});

describe('NoteSeq.density() tests', () => {
    const SEED1 = undefined;
    const SEED2 = 0x174B92DB; 

    const s1 = noteseq([ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ]);
    const s2 = noteseq([ 0, null, 2, 3, null, 5, 6, null, 8, 9, null ]);
    const s3 = s1.augment(10);

    const s4 = microtonalnoteseq([ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ]);
    const s5 = s4.augment(10);

    const table: [ NoteSeq, number, number, number | undefined, NoteSeq ][] = [
        [ noteseq([]), 0, 100, SEED1, noteseq([]) ],
        [ s1, 0, 5, SEED1, noteseq([ 0, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1 ]) ],
        [ s1, 10, 5, SEED1, noteseq([ 1, 1, 1, 1, 1, 1, 0, 0, 1, 0, 0 ]) ],
        [ s1, 0, 5, SEED2, noteseq([ 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1 ]) ],
        [ s1, 10, 5, SEED2, noteseq([ 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0 ]) ],
        [ s1, 0, 10, SEED1, noteseq([ 0, 0, 1, 0, 0, 0, 1, 1, 0, 1, 1 ]) ],
        [ s2, 0, 10, SEED1, noteseq([ 0, null, 1, 0, null, 0, 1, null, 0, 1, null ]) ],
        [ s2, 10, 0, SEED1, noteseq([ 1, null, 0, 1, null, 1, 0, null, 1, 0, null ]) ],
        [ s4, 10, 0, SEED1, microtonalnoteseq([ 1, 1, 0, 1, 1, 1, 0, 0, 1, 0, 0 ]) ],
        [ s3, 0, 100, SEED2, noteseq([ 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1 ]) ],
        [ s3, 0, 50, SEED2, noteseq([ 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1 ]) ],
        [ s5, 50, 75, SEED2, microtonalnoteseq([ 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1 ]) ],
    ];

    test.each(table)('density() %#', (s, zero, one, seed, ret) => {
        expect(s.density(zero, one, seed)).toStrictEqual(ret);
    });
});

describe('noteseq.deltas() tests', () => {
    const table: [ string, NoteSeq, NoteSeq ][] = [
        [
            'when sequence length is 0',
            noteseq([]),
            noteseq([])
        ],
        [
            'when sequence length is 1',
            noteseq([ 0 ]),
            noteseq([])
        ],
        [
            'when sequence is longer and contains nulls',
            noteseq([ null, 1, 5, null, 6, -1, null ]),
            noteseq([ null, 4, null, null, -7, null ])
        ],
        [
            'when sequence contains floats',
            microtonalnoteseq([ 0, 1.5, 5, 3.5, 6, -1.5, 7, 2.5 ]),
            microtonalnoteseq([ 1.5, 3.5, -1.5, 2.5, -7.5, 8.5, -4.5 ])
        ],
    ];

    test.each(table)('%s', (_, s, ret) => {
        expect(s.deltas()).toEqual(ret);
    });
});

describe('noteseq.runningTotal() tests', () => {
    const table: [ string, NoteSeq, NoteSeq ][] = [
        [
            'when sequence length is 0',
            noteseq([]),
            noteseq([])
        ],
        [
            'when sequence length is 1',
            noteseq([ 1 ]),
            noteseq([ 1 ])
        ],
        [
            'when sequence is longer',
            noteseq([ -1, 1, -2, 2, 0, -3, 4 ]),
            noteseq([ -1, 0, -2, 0, 0, -3, 1 ])
        ],
        [
            'when sequence contains nulls',
            noteseq([ null, 1, 2, null, null, 5, 6, null ]),
            noteseq([ 0, 1, 3, 3, 3, 8, 14, 14 ])
        ],
        [
            'when sequence contains floats',
            microtonalnoteseq([ -1, 1, -2.5, 2, 0.5, -3, 4 ]),
            microtonalnoteseq([ -1, 0, -2.5, -0.5, 0, -3, 1 ])
        ],
    ];

    test.each(table)('runningTotal() %#', (_, s, ret) => {
        expect(s.runningTotal()).toStrictEqual(ret);
    });
});

describe('noteseq.combineSum() tests', () => {
    test('throws when sequences are of different lengths', () => {
        expect(() => noteseq([ 1, 2 ]).combineSum(noteseq([ 3 ]))).toThrow();
    });

    test('throws when an integer sequence is summed with a float sequence', () => {
        expect(() => noteseq([ 1, 2 ]).combineSum(microtonalnoteseq([ 3, 4 ]))).toThrow();
    });

    const table: [ string, NoteSeq, NoteSeq[], NoteSeq ][] = [
        [ 'when sequence is empty', noteseq([]), [], noteseq([]) ],
        [
            'is a noop when an integer sequence is summed with nothing',
            noteseq([ 1, 2, -1, 3 ]),
            [],
            noteseq([ 1, 2, -1, 3 ]),
        ],
        [
            'when an integer sequence containing nulls is summed with an integer sequence containing nulls',
            noteseq([ 1, null, 3, 4, null, 6 ]),
            [
                noteseq([ -2, -1, null, 2, null, 3 ])
            ],
            noteseq([ -1, -1, 3, 6, null, 9 ]),
        ],
    ];

    test.each(table)('%s', (_, s1, s2, ret) => {
        expect(s1.combineSum(...s2)).toStrictEqual(ret);
    });
});

describe('noteseq.combineProduct() tests', () => {
    test('throws when sequences are of different lengths', () => {
        expect(() => noteseq([ 1, 2 ]).combineSum(noteseq([ 3 ]))).toThrow();
    });

    test('throws when an integer sequence is multiplied with a float sequence', () => {
        expect(() => noteseq([ 1, 2 ]).combineSum(microtonalnoteseq([ 3, 4 ]))).toThrow();
    });

    const table: [ string, NoteSeq, NoteSeq[], NoteSeq ][] = [
        [ 'when sequence is empty', noteseq([]), [], noteseq([]) ],
        [
            'is a noop when an integer sequence is multiplied with nothing',
            noteseq([ 1, 2, 3, 4, 5, 6 ]),
            [],
            noteseq([ 1, 2, 3, 4, 5, 6 ])
        ],
        [
            'when an int sequence containing nulls is multipled by an int sequence containing nulls',
            noteseq([ 1, null, 0, 4, null, 6, 7 ]),
            [
                noteseq([ -2, -1, null, 2, null, 3, 0 ])
            ],
            noteseq([ -2, -1, 0, 8, null, 18, 0 ])
        ],
        [
            'when a float sequence is multipled by multiple float sequences',
            microtonalnoteseq([ 1.5, 2, 3, 4, 5, 6 ]),
            [
                microtonalnoteseq([ -2.5, -1, 0.5, 1, 2, 3.5 ]),
                microtonalnoteseq([ -1.5, 2.5, 0.5, 3, 2, 1.5 ])
            ],
            microtonalnoteseq([ 5.625, -5, 0.75, 12, 20, 31.5 ])
        ],
    ];

    test.each(table)('%s', (_, s1, s2, ret) => {
        expect(s1.combineProduct(...s2)).toStrictEqual(ret);
    });
});

describe('noteseq.exchangeValuesDecreasing() tests', () => {
    const errortable: [ string, NoteSeq, NoteSeq ][] = [
        [
            'different lengths',
            noteseq([ 1, 5, 2 ]),
            noteseq([ 3, 0 ])
        ],
        [
            'are of different types',
            noteseq([ 1, 5, 2 ]),
            intseq([ 1, 5, 2 ]) as unknown as NoteSeq
        ],
        [
            'have different validators',
            noteseq([ 1, 5, 2 ]),
            microtonalnoteseq([ 1, 5, 2 ])
        ]
    ];

    test.each(errortable)('throws when %s', (_, s1, s2) => {
        expect(() => s1.exchangeValuesDecreasing(s2)).toThrow();
    });

    const table: [ string, NoteSeq, NoteSeq, NoteSeq, NoteSeq ][] = [
        [
            'exchanges correctly for noteseqs',
            noteseq([ 0, 1, 2, 3, 4, 5, -1, 6, 7 ]),
            noteseq([ -1, 2, 1, 0, -1, 5, 6, 7, 2 ]),
            noteseq([ 0, 2, 2, 3, 4, 5, 6, 7, 7 ]),
            noteseq([ -1, 1, 1, 0, -1, 5, -1, 6, 2 ]),
        ],
        [
            'exchanges correctly for microtonalnoteseqs',
            microtonalnoteseq([ 0, 1, 2, 3, 4, 5, -1, 6, 7 ]),
            microtonalnoteseq([ -1, 2, 1.5, 0, -1.5, 5, 6.5, 7, 2 ]),
            microtonalnoteseq([ 0, 2, 2, 3, 4, 5, 6.5, 7, 7 ]),
            microtonalnoteseq([ -1, 1, 1.5, 0, -1.5, 5, -1, 6, 2 ]),
        ],
        [
            'exchanges correctly when nulls are present',
            noteseq([ 0, null, 2, 3, 4, 5, -1, null, 7 ]),
            noteseq([ -1, 2, null, 0, -1, 5, 6, null, 2 ]),
            noteseq([ 0, null, 2, 3, 4, 5, 6, null, 7 ]),
            noteseq([ -1, 2, null, 0, -1, 5, -1, null, 2 ]),
        ],
    ];

    test.each(table)('%s', (_, s1, s2, r1, r2) => {
        expect(s1.exchangeValuesDecreasing(s2)).toStrictEqual([ r1, r2 ]);
    });
});

describe('noteseq.exchangeValuesIncreasing() tests', () => {
    const errortable: [ string, NoteSeq, NoteSeq ][] = [
        [
            'different lengths',
            noteseq([ 1, 5, 2 ]),
            noteseq([ 3, 0 ])
        ],
        [
            'are of different types',
            noteseq([ 1, 5, 2 ]),
            intseq([ 1, 5, 2 ]) as unknown as NoteSeq
        ],
        [
            'have different validators',
            noteseq([ 1, 5, 2 ]),
            microtonalnoteseq([ 1, 5, 2 ])
        ],
    ];

    test.each(errortable)('throws when %s', (_, s1, s2) => {
        expect(() => s1.exchangeValuesIncreasing(s2)).toThrow();
    });

    const table: [ string, NoteSeq, NoteSeq, NoteSeq, NoteSeq ][] = [
        [
            'exchanges correctly for noteseqs',
            noteseq([ 0, 1, 2, 3, 4, 5, -1, 6, 7 ]),
            noteseq([ -1, 2, 1, 0, -1, 5, 6, 7, 2 ]),
            noteseq([ -1, 1, 1, 0, -1, 5, -1, 6, 2 ]),
            noteseq([ 0, 2, 2, 3, 4, 5, 6, 7, 7 ]),
        ],
        [
            'exchanges correctly for microtonalnoteseqs',
            microtonalnoteseq([ 0, 1, 2, 3, 4, 5, -1, 6, 7 ]),
            microtonalnoteseq([ -1, 2, 1.5, 0, -1.5, 5, 6.5, 7, 2 ]),
            microtonalnoteseq([ -1, 1, 1.5, 0, -1.5, 5, -1, 6, 2 ]),
            microtonalnoteseq([ 0, 2, 2, 3, 4, 5, 6.5, 7, 7 ]),
        ],
        [
            'exchanges correctly when nulls are present',
            noteseq([ 0, null, 2, 3, 4, 5, -1, null, 7 ]),
            noteseq([ -1, 2, null, 0, -1, 5, 6, null, 2 ]),
            noteseq([ -1, null, 2, 0, -1, 5, -1, null, 2 ]),
            noteseq([ 0, 2, null, 3, 4, 5, 6, null, 7 ]),
        ],
    ];

    test.each(table)('%s', (_, s1, s2, r1, r2) => {
        expect(s1.exchangeValuesIncreasing(s2)).toStrictEqual([ r1, r2 ]);
    });
});

// inherited from CollectionWithMetadata
describe('NoteSeq.describe', () => {
    test('describes as expected', () => {
        expect(NoteSeq.from([ 1, null ], { tempo: 144 }).describe())
            .toStrictEqual('NoteSeq(length=2,metadata=Metadata({tempo=144}))([\n    0: NoteSeqMember(1),\n    1: NoteSeqMember(null),\n])');
    });
});