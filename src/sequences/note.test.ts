import { NoteSeq, NumSeq } from './sequences';

import Metadata from '../metadata/metadata';
import NumericValidator from '../validation/numeric';

const MICROTONAL = Metadata.from({ validator: NumericValidator.NOOP_VALIDATOR });

describe('NoteSeq.from()', () => {
    const c = NoteSeq.from([ 1, 2, 3 ]);

    test('NoteSeq.from() with melody argument and same validator returns same object', () => {
        expect(NoteSeq.from(c)).toBe(c);
    });

    test('NoteSeq.from() with melody argument and different validator returns different object with same contents', () => {
        const c2 = NoteSeq.from(c, MICROTONAL);

        expect(c2).not.toBe(c);
        expect(c2.contents).toStrictEqual(c.contents);
    });
});

describe('NoteSeq.density() tests', () => {
    const SEED1 = undefined;
    const SEED2 = 0x174B92DB; 

    const s1 = NoteSeq.from([ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ]);
    const s2 = NoteSeq.from([ 0, null, 2, 3, null, 5, 6, null, 8, 9, null ]);
    const s3 = s1.augment(10);
    const s4 = NoteSeq.from([ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ], MICROTONAL);
    const s5 = s4.augment(10);

    const table: [ NoteSeq, number, number, number | undefined, NoteSeq ][] = [
        [ NoteSeq.from([]), 0, 100, SEED1, NoteSeq.from([]) ],
        [ s1, 0, 5, SEED1, NoteSeq.from([ 0, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1 ]) ],
        [ s1, 10, 5, SEED1, NoteSeq.from([ 1, 1, 1, 1, 1, 1, 0, 0, 1, 0, 0 ]) ],
        [ s1, 0, 5, SEED2, NoteSeq.from([ 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1 ]) ],
        [ s1, 10, 5, SEED2, NoteSeq.from([ 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0 ]) ],
        [ s1, 0, 10, SEED1, NoteSeq.from([ 0, 0, 1, 0, 0, 0, 1, 1, 0, 1, 1 ]) ],
        [ s2, 0, 10, SEED1, NoteSeq.from([ 0, null, 1, 0, null, 0, 1, null, 0, 1, null ]) ],
        [ s2, 10, 0, SEED1, NoteSeq.from([ 1, null, 0, 1, null, 1, 0, null, 1, 0, null ]) ],
        [ s4, 10, 0, SEED1, NoteSeq.from([ 1, 1, 0, 1, 1, 1, 0, 0, 1, 0, 0 ], MICROTONAL) ],
        [ s3, 0, 100, SEED2, NoteSeq.from([ 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1 ]) ],
        [ s3, 0, 50, SEED2, NoteSeq.from([ 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1 ]) ],
        [ s5, 50, 75, SEED2, NoteSeq.from([ 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1 ], MICROTONAL) ],
    ];

    test.each(table)('density() %#', (s, zero, one, seed, ret) => {
        expect(s.density(zero, one, seed)).toStrictEqual(ret);
    });
});

describe('noteseq.deltas() tests', () => {
    const table: [ string, NoteSeq, NoteSeq ][] = [
        [
            'when sequence length is 0',
            NoteSeq.from([]),
            NoteSeq.from([])
        ],
        [
            'when sequence length is 1',
            NoteSeq.from([ 0 ]),
            NoteSeq.from([])
        ],
        [
            'when sequence is longer and contains nulls',
            NoteSeq.from([ null, 1, 5, null, 6, -1, null ]),
            NoteSeq.from([ null, 4, null, null, -7, null ])
        ],
        [
            'when sequence contains floats',
            NoteSeq.from([ 0, 1.5, 5, 3.5, 6, -1.5, 7, 2.5 ], MICROTONAL),
            NoteSeq.from([ 1.5, 3.5, -1.5, 2.5, -7.5, 8.5, -4.5 ], MICROTONAL)
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
            NoteSeq.from([]),
            NoteSeq.from([])
        ],
        [
            'when sequence length is 1',
            NoteSeq.from([ 1 ]),
            NoteSeq.from([ 1 ])
        ],
        [
            'when sequence is longer',
            NoteSeq.from([ -1, 1, -2, 2, 0, -3, 4 ]),
            NoteSeq.from([ -1, 0, -2, 0, 0, -3, 1 ])
        ],
        [
            'when sequence contains nulls',
            NoteSeq.from([ null, 1, 2, null, null, 5, 6, null ]),
            NoteSeq.from([ 0, 1, 3, 3, 3, 8, 14, 14 ])
        ],
        [
            'when sequence contains floats',
            NoteSeq.from([ -1, 1, -2.5, 2, 0.5, -3, 4 ], MICROTONAL),
            NoteSeq.from([ -1, 0, -2.5, -0.5, 0, -3, 1 ], MICROTONAL)
        ],
    ];

    test.each(table)('runningTotal() %#', (_, s, ret) => {
        expect(s.runningTotal()).toStrictEqual(ret);
    });
});

describe('noteseq.combineSum() tests', () => {
    test('throws when sequences are of different lengths', () => {
        expect(() => NoteSeq.from([ 1, 2 ]).combineSum(NoteSeq.from([ 3 ]))).toThrow();
    });

    test('throws when an integer sequence is summed with a float sequence', () => {
        expect(() => NoteSeq.from([ 1, 2 ]).combineSum(NoteSeq.from([ 3, 4 ], MICROTONAL))).toThrow();
    });

    const table: [ string, NoteSeq, NoteSeq[], NoteSeq ][] = [
        [ 'when sequence is empty', NoteSeq.from([]), [], NoteSeq.from([]) ],
        [
            'is a noop when an integer sequence is summed with nothing',
            NoteSeq.from([ 1, 2, -1, 3 ]),
            [],
            NoteSeq.from([ 1, 2, -1, 3 ]),
        ],
        [
            'when an integer sequence containing nulls is summed with an integer sequence containing nulls',
            NoteSeq.from([ 1, null, 3, 4, null, 6 ]),
            [
                NoteSeq.from([ -2, -1, null, 2, null, 3 ])
            ],
            NoteSeq.from([ -1, -1, 3, 6, null, 9 ]),
        ],
    ];

    test.each(table)('%s', (_, s1, s2, ret) => {
        expect(s1.combineSum(...s2)).toStrictEqual(ret);
    });
});

describe('noteseq.combineProduct() tests', () => {
    test('throws when sequences are of different lengths', () => {
        expect(() => NoteSeq.from([ 1, 2 ]).combineSum(NoteSeq.from([ 3 ]))).toThrow();
    });

    test('throws when an integer sequence is multiplied with a float sequence', () => {
        expect(() => NoteSeq.from([ 1, 2 ]).combineSum(NoteSeq.from([ 3, 4 ], MICROTONAL))).toThrow();
    });

    const table: [ string, NoteSeq, NoteSeq[], NoteSeq ][] = [
        [ 'when sequence is empty', NoteSeq.from([]), [], NoteSeq.from([]) ],
        [
            'is a noop when an integer sequence is multiplied with nothing',
            NoteSeq.from([ 1, 2, 3, 4, 5, 6 ]),
            [],
            NoteSeq.from([ 1, 2, 3, 4, 5, 6 ])
        ],
        [
            'when an int sequence containing nulls is multipled by an int sequence containing nulls',
            NoteSeq.from([ 1, null, 0, 4, null, 6, 7 ]),
            [
                NoteSeq.from([ -2, -1, null, 2, null, 3, 0 ])
            ],
            NoteSeq.from([ -2, -1, 0, 8, null, 18, 0 ])
        ],
        [
            'when a float sequence is multipled by multiple float sequences',
            NoteSeq.from([ 1.5, 2, 3, 4, 5, 6 ], MICROTONAL),
            [
                NoteSeq.from([ -2.5, -1, 0.5, 1, 2, 3.5 ], MICROTONAL),
                NoteSeq.from([ -1.5, 2.5, 0.5, 3, 2, 1.5 ], MICROTONAL)
            ],
            NoteSeq.from([ 5.625, -5, 0.75, 12, 20, 31.5 ], MICROTONAL)
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
            NoteSeq.from([ 1, 5, 2 ]),
            NoteSeq.from([ 3, 0 ])
        ],
        [
            'are of different types',
            NoteSeq.from([ 1, 5, 2 ]),
            NumSeq.from([ 1, 5, 2 ]) as unknown as NoteSeq
        ],
        [
            'have different validators',
            NoteSeq.from([ 1, 5, 2 ]),
            NoteSeq.from([ 1, 5, 2 ], MICROTONAL)
        ]
    ];

    test.each(errortable)('throws when %s', (_, s1, s2) => {
        expect(() => s1.exchangeValuesDecreasing(s2)).toThrow();
    });

    const table: [ string, NoteSeq, NoteSeq, NoteSeq, NoteSeq ][] = [
        [
            'exchanges correctly for noteseqs',
            NoteSeq.from([ 0, 1, 2, 3, 4, 5, -1, 6, 7 ]),
            NoteSeq.from([ -1, 2, 1, 0, -1, 5, 6, 7, 2 ]),
            NoteSeq.from([ 0, 2, 2, 3, 4, 5, 6, 7, 7 ]),
            NoteSeq.from([ -1, 1, 1, 0, -1, 5, -1, 6, 2 ]),
        ],
        [
            'exchanges correctly for Noteseqs',
            NoteSeq.from([ 0, 1, 2, 3, 4, 5, -1, 6, 7 ], MICROTONAL),
            NoteSeq.from([ -1, 2, 1.5, 0, -1.5, 5, 6.5, 7, 2 ], MICROTONAL),
            NoteSeq.from([ 0, 2, 2, 3, 4, 5, 6.5, 7, 7 ], MICROTONAL),
            NoteSeq.from([ -1, 1, 1.5, 0, -1.5, 5, -1, 6, 2 ], MICROTONAL),
        ],
        [
            'exchanges correctly when nulls are present',
            NoteSeq.from([ 0, null, 2, 3, 4, 5, -1, null, 7 ]),
            NoteSeq.from([ -1, 2, null, 0, -1, 5, 6, null, 2 ]),
            NoteSeq.from([ 0, null, 2, 3, 4, 5, 6, null, 7 ]),
            NoteSeq.from([ -1, 2, null, 0, -1, 5, -1, null, 2 ]),
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
            NoteSeq.from([ 1, 5, 2 ]),
            NoteSeq.from([ 3, 0 ])
        ],
        [
            'are of different types',
            NoteSeq.from([ 1, 5, 2 ]),
            NumSeq.from([ 1, 5, 2 ]) as unknown as NoteSeq
        ],
        [
            'have different validators',
            NoteSeq.from([ 1, 5, 2 ]),
            NoteSeq.from([ 1, 5, 2 ], MICROTONAL)
        ],
    ];

    test.each(errortable)('throws when %s', (_, s1, s2) => {
        expect(() => s1.exchangeValuesIncreasing(s2)).toThrow();
    });

    const table: [ string, NoteSeq, NoteSeq, NoteSeq, NoteSeq ][] = [
        [
            'exchanges correctly for noteseqs',
            NoteSeq.from([ 0, 1, 2, 3, 4, 5, -1, 6, 7 ]),
            NoteSeq.from([ -1, 2, 1, 0, -1, 5, 6, 7, 2 ]),
            NoteSeq.from([ -1, 1, 1, 0, -1, 5, -1, 6, 2 ]),
            NoteSeq.from([ 0, 2, 2, 3, 4, 5, 6, 7, 7 ]),
        ],
        [
            'exchanges correctly for microtonal noteseqs',
            NoteSeq.from([ 0, 1, 2, 3, 4, 5, -1, 6, 7 ], MICROTONAL),
            NoteSeq.from([ -1, 2, 1.5, 0, -1.5, 5, 6.5, 7, 2 ], MICROTONAL),
            NoteSeq.from([ -1, 1, 1.5, 0, -1.5, 5, -1, 6, 2 ], MICROTONAL),
            NoteSeq.from([ 0, 2, 2, 3, 4, 5, 6.5, 7, 7 ], MICROTONAL),
        ],
        [
            'exchanges correctly when nulls are present',
            NoteSeq.from([ 0, null, 2, 3, 4, 5, -1, null, 7 ]),
            NoteSeq.from([ -1, 2, null, 0, -1, 5, 6, null, 2 ]),
            NoteSeq.from([ -1, null, 2, 0, -1, 5, -1, null, 2 ]),
            NoteSeq.from([ 0, 2, null, 3, 4, 5, 6, null, 7 ]),
        ],
    ];

    test.each(table)('%s', (_, s1, s2, r1, r2) => {
        expect(s1.exchangeValuesIncreasing(s2)).toStrictEqual([ r1, r2 ]);
    });
});

// inherited from CollectionWithMetadata
describe('NoteSeq.describe', () => {
    test('describes as expected', () => {
        expect(NoteSeq.from([ 1, null ], Metadata.from({ tempo: 144 })).describe())
            .toStrictEqual('NoteSeq(length=2,metadata=Metadata({tempo=144}))([\n    0: NoteSeqMember(1),\n    1: NoteSeqMember(null),\n])');
    });
});