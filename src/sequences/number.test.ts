import { NumSeq, NoteSeq } from './sequences';

import NumericValidator from '../validation/numeric';

const MICROTONAL = { validator: NumericValidator.NOOP_VALIDATOR };

describe('NumSeq.from()', () => {
    const c = NumSeq.from([ 1, 2, 3 ]);

    test('NumSeq.from() with melody argument and same validator returns same object', () => {
        expect(NumSeq.from(c)).toBe(c);
    });

    test('NumSeq.from() with melody argument and different validator returns different object with same contents', () => {
        const c2 = NumSeq.from(c, MICROTONAL);

        expect(c2).not.toBe(c);
        expect(c2.contents).toStrictEqual(c.contents);
    });
});

describe('numseq.density() tests', () => {
    const SEED1 = undefined;
    const SEED2 = 0x174B92DB; 

    const s1 = NumSeq.from([ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ]);
    const s2 = s1.augment(10);

    const s3 = NumSeq.from([ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ], MICROTONAL);
    const s4 = s3.augment(10);

    const table: [ NumSeq, number, number, number | undefined, NumSeq ][] = [
        [ NumSeq.from([]), 0, 100, SEED1, NumSeq.from([]) ],
        [ s1, 0, 5, SEED1, NumSeq.from([ 0, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1 ]) ],
        [ s1, 10, 5, SEED1, NumSeq.from([ 1, 1, 1, 1, 1, 1, 0, 0, 1, 0, 0 ]) ],
        [ s1, 0, 5, SEED2, NumSeq.from([ 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1 ]) ],
        [ s1, 10, 5, SEED2, NumSeq.from([ 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0 ]) ],
        [ s1, 0, 10, SEED1, NumSeq.from([ 0, 0, 1, 0, 0, 0, 1, 1, 0, 1, 1 ]) ],
        [ s3, 10, 0, SEED1, NumSeq.from([ 1, 1, 0, 1, 1, 1, 0, 0, 1, 0, 0 ], MICROTONAL) ],
        [ s2, 0, 100, SEED2, NumSeq.from([ 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1 ]) ],
        [ s2, 0, 50, SEED2, NumSeq.from([ 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1 ]) ],
        [ s4, 50, 75, SEED2, NumSeq.from([ 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1 ], MICROTONAL) ],
    ];

    test.each(table)('density() %#', (s, zero, one, seed, ret) => {
        expect(s.density(zero, one, seed)).toStrictEqual(ret);
    });
});

describe('numseq.deltas() tests', () => {
    const table: [ string, NumSeq, NumSeq ][] = [
        [
            'when sequence length is 0',
            NumSeq.from([]),
            NumSeq.from([])
        ],
        [
            'when sequence length is 1',
            NumSeq.from([ 0 ]),
            NumSeq.from([])
        ],
        [
            'when sequence is longer',
            NumSeq.from([ 0, 1, 5, 3, 6, -1 ]),
            NumSeq.from([ 1, 4, -2, 3, -7, ])
        ],
        [
            'when sequence contains floats',
            NumSeq.from([ 0, 1.5, 5, 3.5, 6, -1.5, 7, 2.5 ], MICROTONAL),
            NumSeq.from([ 1.5, 3.5, -1.5, 2.5, -7.5, 8.5, -4.5 ], MICROTONAL)
        ],
    ];

    test.each(table)('%s', (_, s, ret) => {
        expect(s.deltas()).toEqual(ret);
    });
});

describe('numseq.runningTotal() tests', () => {
    const table: [ string, NumSeq, NumSeq ][] = [
        [
            'when sequence length is 0',
            NumSeq.from([]),
            NumSeq.from([])
        ],
        [
            'when sequence length is 1',
            NumSeq.from([ 1 ]),
            NumSeq.from([ 1 ])
        ],
        [
            'when sequence is longer',
            NumSeq.from([ -1, 1, -2, 2, 0, -3, 4 ]),
            NumSeq.from([ -1, 0, -2, 0, 0, -3, 1 ])
        ],
        [
            'when sequence contains floats',
            NumSeq.from([ -1, 1, -2.5, 2, 0.5, -3, 4 ], MICROTONAL),
            NumSeq.from([ -1, 0, -2.5, -0.5, 0, -3, 1 ], MICROTONAL)
        ],
    ];

    test.each(table)('runningTotal() %#', (_, s, ret) => {
        expect(s.runningTotal()).toStrictEqual(ret);
    });
});

describe('numseq.combineSum() tests', () => {
    test('throws when sequences are of different lengths', () => {
        expect(() => NumSeq.from([ 1, 2 ]).combineSum(NumSeq.from([ 3 ]))).toThrow();
    });

    test('throws when an integer sequence is summed with a float sequence', () => {
        expect(() => NumSeq.from([ 1, 2 ]).combineSum(NumSeq.from([ 3, 4 ], MICROTONAL))).toThrow();
    });

    const table: [ string, NumSeq, NumSeq[], NumSeq ][] = [
        [ 'when sequence is empty', NumSeq.from([]), [], NumSeq.from([]) ],
        [
            'is a noop when an integer sequence is summed with nothing',
            NumSeq.from([ 1, 2, -1, 3 ]),
            [],
            NumSeq.from([ 1, 2, -1, 3 ]),
        ],
        [
            'when an integer sequence is summed with an integer sequence',
            NumSeq.from([ 1, 2, 3, 4, 5, 6 ]),
            [
                NumSeq.from([ -2, -1, 0, 1, 2, 3 ])
            ],
            NumSeq.from([ -1, 1, 3, 5, 7, 9 ]),
        ],
    ];

    test.each(table)('%s', (_, s1, s2, ret) => {
        expect(s1.combineSum(...s2)).toStrictEqual(ret);
    });
});

describe('numseq.combineProduct() tests', () => {
    test('throws when sequences are of different lengths', () => {
        expect(() => NumSeq.from([ 1, 2 ]).combineSum(NumSeq.from([ 3 ]))).toThrow();
    });

    test('throws when an integer sequence is multiplied with a float sequence', () => {
        expect(() => NumSeq.from([ 1, 2 ]).combineSum(NumSeq.from([ 3, 4 ], MICROTONAL))).toThrow();
    });

    const table: [ string, NumSeq, NumSeq[], NumSeq ][] = [
        [ 'when sequence is empty', NumSeq.from([]), [], NumSeq.from([]) ],
        [
            'is a noop when an integer sequence is multiplied with nothing',
            NumSeq.from([ 1, 2, 3, 4, 5, 6 ]),
            [],
            NumSeq.from([ 1, 2, 3, 4, 5, 6 ])
        ],
        [
            'when an int sequence is multipled by an int sequence',
            NumSeq.from([ 1, 2, 3, 4, 5, 6 ]),
            [
                NumSeq.from([ -2, -1, 0, 1, 2, 3 ])
            ],
            NumSeq.from([ -2, -2, 0, 4, 10, 18 ])
        ],
        [
            'when a float sequence is multipled by multiple float sequences',
            NumSeq.from([ 1.5, 2, 3, 4, 5, 6 ], MICROTONAL),
            [
                NumSeq.from([ -2.5, -1, 0.5, 1, 2, 3.5 ], MICROTONAL),
                NumSeq.from([ -1.5, 2.5, 0.5, 3, 2, 1.5 ], MICROTONAL)
            ],
            NumSeq.from([ 5.625, -5, 0.75, 12, 20, 31.5 ], MICROTONAL)
        ],
    ];

    test.each(table)('%s', (_, s1, s2, ret) => {
        expect(s1.combineProduct(...s2)).toStrictEqual(ret);
    });
});

describe('numseq.exchangeValuesDecreasing() tests', () => {
    const errortable: [ string, NumSeq, NumSeq ][] = [
        [
            'different lengths',
            NumSeq.from([ 1, 5, 2 ]),
            NumSeq.from([ 3, 0 ])
        ],
        [
            'are of different types',
            NumSeq.from([ 1, 5, 2 ]),
            NoteSeq.from([ 1, 5, 2 ]) as unknown as NumSeq
        ],
        [
            'have different validators',
            NumSeq.from([ 1, 5, 2 ]),
            NumSeq.from([ 1, 5, 2 ], MICROTONAL)
        ],
    ];

    test.each(errortable)('throws when %s', (_, s1, s2) => {
        expect(() => s1.exchangeValuesDecreasing(s2)).toThrow();
    });

    const table: [ string, NumSeq, NumSeq, NumSeq, NumSeq ][] = [
        [
            'exchanges correctly for intseqs',
            NumSeq.from([ 0, 1, 2, 3, 4, 5, -1, 6, 7 ]),
            NumSeq.from([ -1, 2, 1, 0, -1, 5, 6, 7, 2 ]),
            NumSeq.from([ 0, 2, 2, 3, 4, 5, 6, 7, 7 ]),
            NumSeq.from([ -1, 1, 1, 0, -1, 5, -1, 6, 2 ]),
        ],
        [
            'exchanges correctly for NumSeq.froms',
            NumSeq.from([ 0, 1, 2, 3, 4, 5, -1, 6, 7 ], MICROTONAL),
            NumSeq.from([ -1, 2, 1.5, 0, -1.5, 5, 6.5, 7, 2 ], MICROTONAL),
            NumSeq.from([ 0, 2, 2, 3, 4, 5, 6.5, 7, 7 ], MICROTONAL),
            NumSeq.from([ -1, 1, 1.5, 0, -1.5, 5, -1, 6, 2 ], MICROTONAL),
        ],
    ];

    test.each(table)('%s', (_, s1, s2, r1, r2) => {
        expect(s1.exchangeValuesDecreasing(s2)).toStrictEqual([ r1, r2 ]);
    });
});

describe('numseq.exchangeValuesIncreasing() tests', () => {
    const errortable: [ string, NumSeq, NumSeq ][] = [
        [
            'different lengths',
            NumSeq.from([ 1, 5, 2 ]),
            NumSeq.from([ 3, 0 ])
        ],
        [
            'are of different types',
            NumSeq.from([ 1, 5, 2 ]),
            NoteSeq.from([ 1, 5, 2 ]) as unknown as NumSeq
        ],
        [
            'have different validators',
            NumSeq.from([ 1, 5, 2 ]),
            NumSeq.from([ 1, 5, 2 ], MICROTONAL)
        ]
    ];

    test.each(errortable)('throws when %s', (_, s1, s2) => {
        expect(() => s1.exchangeValuesIncreasing(s2)).toThrow();
    });

    const table: [ string, NumSeq, NumSeq, NumSeq, NumSeq ][] = [
        [
            'intseqs',
            NumSeq.from([ 0, 1, 2, 3, 4, 5, -1, 6, 7 ]),
            NumSeq.from([ -1, 2, 1, 0, -1, 5, 6, 7, 2 ]),
            NumSeq.from([ -1, 1, 1, 0, -1, 5, -1, 6, 2 ]),
            NumSeq.from([ 0, 2, 2, 3, 4, 5, 6, 7, 7 ]),
        ],
        [
            'NumSeq.froms',
            NumSeq.from([ 0, 1, 2, 3, 4, 5, -1, 6, 7 ], MICROTONAL),
            NumSeq.from([ -1, 2, 1.5, 0, -1.5, 5, 6.5, 7, 2 ], MICROTONAL),
            NumSeq.from([ -1, 1, 1.5, 0, -1.5, 5, -1, 6, 2 ], MICROTONAL),
            NumSeq.from([ 0, 2, 2, 3, 4, 5, 6.5, 7, 7 ], MICROTONAL),
        ],
    ];

    test.each(table)('exchanges correctly for %s', (_, s1, s2, r1, r2) => {
        expect(s1.exchangeValuesIncreasing(s2)).toStrictEqual([ r1, r2 ]);
    });
});

// inherited from CollectionWithMetadata
describe('NumSeq.describe()', () => {
    test('describes as expected', () => {
        expect(NumSeq.from([ 1, 2 ], { tempo: 144 }).describe())
            .toStrictEqual('NumSeq(length=2,metadata=Metadata({tempo=144}))([\n    0: NumSeqMember(1),\n    1: NumSeqMember(2),\n])');
    });
});