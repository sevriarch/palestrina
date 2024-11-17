import NumSeq from './number';

import { intseq, floatseq, noteseq } from '../factory';

describe('NumSeq.from() via factory', () => {
    const c = intseq([ 1, 2, 3 ]);

    test('NumSeq.from() with melody argument and same validator returns same object', () => {
        expect(NumSeq.from(c)).toBe(c);
    });

    test('NumSeq.from() with melody argument and different validator returns different object with same contents', () => {
        const c2 = floatseq(c);

        expect(c2).not.toBe(c);
        expect(c2.contents).toStrictEqual(c.contents);
    });

    test('NumSeq.from() taking contents from an intseq via factory', () => {
        expect(intseq(intseq([ 1, 2, 3 ]))).toStrictEqual(c);
    });
});

describe('numseq.density() tests', () => {
    const SEED1 = undefined;
    const SEED2 = 0x174B92DB; 

    const s1 = intseq([ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ]);
    const s2 = s1.augment(10);

    const s3 = floatseq([ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ]);
    const s4 = s3.augment(10);

    const table: [ NumSeq, number, number, number | undefined, NumSeq ][] = [
        [ intseq([]), 0, 100, SEED1, intseq([]) ],
        [ s1, 0, 5, SEED1, intseq([ 0, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1 ]) ],
        [ s1, 10, 5, SEED1, intseq([ 1, 1, 1, 1, 1, 1, 0, 0, 1, 0, 0 ]) ],
        [ s1, 0, 5, SEED2, intseq([ 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1 ]) ],
        [ s1, 10, 5, SEED2, intseq([ 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0 ]) ],
        [ s1, 0, 10, SEED1, intseq([ 0, 0, 1, 0, 0, 0, 1, 1, 0, 1, 1 ]) ],
        [ s3, 10, 0, SEED1, floatseq([ 1, 1, 0, 1, 1, 1, 0, 0, 1, 0, 0 ]) ],
        [ s2, 0, 100, SEED2, intseq([ 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1 ]) ],
        [ s2, 0, 50, SEED2, intseq([ 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1 ]) ],
        [ s4, 50, 75, SEED2, floatseq([ 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1 ]) ],
    ];

    test.each(table)('density() %#', (s, zero, one, seed, ret) => {
        expect(s.density(zero, one, seed)).toStrictEqual(ret);
    });
});

describe('numseq.deltas() tests', () => {
    const table: [ string, NumSeq, NumSeq ][] = [
        [
            'when sequence length is 0',
            intseq([]),
            intseq([])
        ],
        [
            'when sequence length is 1',
            intseq([ 0 ]),
            intseq([])
        ],
        [
            'when sequence is longer',
            intseq([ 0, 1, 5, 3, 6, -1 ]),
            intseq([ 1, 4, -2, 3, -7, ])
        ],
        [
            'when sequence contains floats',
            floatseq([ 0, 1.5, 5, 3.5, 6, -1.5, 7, 2.5 ]),
            floatseq([ 1.5, 3.5, -1.5, 2.5, -7.5, 8.5, -4.5 ])
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
            intseq([]),
            intseq([])
        ],
        [
            'when sequence length is 1',
            intseq([ 1 ]),
            intseq([ 1 ])
        ],
        [
            'when sequence is longer',
            intseq([ -1, 1, -2, 2, 0, -3, 4 ]),
            intseq([ -1, 0, -2, 0, 0, -3, 1 ])
        ],
        [
            'when sequence contains floats',
            floatseq([ -1, 1, -2.5, 2, 0.5, -3, 4 ]),
            floatseq([ -1, 0, -2.5, -0.5, 0, -3, 1 ])
        ],
    ];

    test.each(table)('runningTotal() %#', (_, s, ret) => {
        expect(s.runningTotal()).toStrictEqual(ret);
    });
});

describe('numseq.combineSum() tests', () => {
    test('throws when sequences are of different lengths', () => {
        expect(() => intseq([ 1, 2 ]).combineSum(intseq([ 3 ]))).toThrow();
    });

    test('throws when an integer sequence is summed with a float sequence', () => {
        expect(() => intseq([ 1, 2 ]).combineSum(floatseq([ 3, 4 ]))).toThrow();
    });

    const table: [ string, NumSeq, NumSeq[], NumSeq ][] = [
        [ 'when sequence is empty', intseq([]), [], intseq([]) ],
        [
            'is a noop when an integer sequence is summed with nothing',
            intseq([ 1, 2, -1, 3 ]),
            [],
            intseq([ 1, 2, -1, 3 ]),
        ],
        [
            'when an integer sequence is summed with an integer sequence',
            intseq([ 1, 2, 3, 4, 5, 6 ]),
            [
                intseq([ -2, -1, 0, 1, 2, 3 ])
            ],
            intseq([ -1, 1, 3, 5, 7, 9 ]),
        ],
    ];

    test.each(table)('%s', (_, s1, s2, ret) => {
        expect(s1.combineSum(...s2)).toStrictEqual(ret);
    });
});

describe('numseq.combineProduct() tests', () => {
    test('throws when sequences are of different lengths', () => {
        expect(() => intseq([ 1, 2 ]).combineSum(intseq([ 3 ]))).toThrow();
    });

    test('throws when an integer sequence is multiplied with a float sequence', () => {
        expect(() => intseq([ 1, 2 ]).combineSum(floatseq([ 3, 4 ]))).toThrow();
    });

    const table: [ string, NumSeq, NumSeq[], NumSeq ][] = [
        [ 'when sequence is empty', intseq([]), [], intseq([]) ],
        [
            'is a noop when an integer sequence is multiplied with nothing',
            intseq([ 1, 2, 3, 4, 5, 6 ]),
            [],
            intseq([ 1, 2, 3, 4, 5, 6 ])
        ],
        [
            'when an int sequence is multipled by an int sequence',
            intseq([ 1, 2, 3, 4, 5, 6 ]),
            [
                intseq([ -2, -1, 0, 1, 2, 3 ])
            ],
            intseq([ -2, -2, 0, 4, 10, 18 ])
        ],
        [
            'when a float sequence is multipled by multiple float sequences',
            floatseq([ 1.5, 2, 3, 4, 5, 6 ]),
            [
                floatseq([ -2.5, -1, 0.5, 1, 2, 3.5 ]),
                floatseq([ -1.5, 2.5, 0.5, 3, 2, 1.5 ])
            ],
            floatseq([ 5.625, -5, 0.75, 12, 20, 31.5 ])
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
            intseq([ 1, 5, 2 ]),
            intseq([ 3, 0 ])
        ],
        [
            'are of different types',
            intseq([ 1, 5, 2 ]),
            noteseq([ 1, 5, 2 ]) as unknown as NumSeq
        ],
        [
            'have different validators',
            intseq([ 1, 5, 2 ]),
            floatseq([ 1, 5, 2 ])
        ],
    ];

    test.each(errortable)('throws when %s', (_, s1, s2) => {
        expect(() => s1.exchangeValuesDecreasing(s2)).toThrow();
    });

    const table: [ string, NumSeq, NumSeq, NumSeq, NumSeq ][] = [
        [
            'exchanges correctly for intseqs',
            intseq([ 0, 1, 2, 3, 4, 5, -1, 6, 7 ]),
            intseq([ -1, 2, 1, 0, -1, 5, 6, 7, 2 ]),
            intseq([ 0, 2, 2, 3, 4, 5, 6, 7, 7 ]),
            intseq([ -1, 1, 1, 0, -1, 5, -1, 6, 2 ]),
        ],
        [
            'exchanges correctly for floatseqs',
            floatseq([ 0, 1, 2, 3, 4, 5, -1, 6, 7 ]),
            floatseq([ -1, 2, 1.5, 0, -1.5, 5, 6.5, 7, 2 ]),
            floatseq([ 0, 2, 2, 3, 4, 5, 6.5, 7, 7 ]),
            floatseq([ -1, 1, 1.5, 0, -1.5, 5, -1, 6, 2 ]),
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
            intseq([ 1, 5, 2 ]),
            intseq([ 3, 0 ])
        ],
        [
            'are of different types',
            intseq([ 1, 5, 2 ]),
            noteseq([ 1, 5, 2 ]) as unknown as NumSeq
        ],
        [
            'have different validators',
            intseq([ 1, 5, 2 ]),
            floatseq([ 1, 5, 2 ])
        ]
    ];

    test.each(errortable)('throws when %s', (_, s1, s2) => {
        expect(() => s1.exchangeValuesIncreasing(s2)).toThrow();
    });

    const table: [ string, NumSeq, NumSeq, NumSeq, NumSeq ][] = [
        [
            'intseqs',
            intseq([ 0, 1, 2, 3, 4, 5, -1, 6, 7 ]),
            intseq([ -1, 2, 1, 0, -1, 5, 6, 7, 2 ]),
            intseq([ -1, 1, 1, 0, -1, 5, -1, 6, 2 ]),
            intseq([ 0, 2, 2, 3, 4, 5, 6, 7, 7 ]),
        ],
        [
            'floatseqs',
            floatseq([ 0, 1, 2, 3, 4, 5, -1, 6, 7 ]),
            floatseq([ -1, 2, 1.5, 0, -1.5, 5, 6.5, 7, 2 ]),
            floatseq([ -1, 1, 1.5, 0, -1.5, 5, -1, 6, 2 ]),
            floatseq([ 0, 2, 2, 3, 4, 5, 6.5, 7, 7 ]),
        ],
    ];

    test.each(table)('exchanges correctly for %s', (_, s1, s2, r1, r2) => {
        expect(s1.exchangeValuesIncreasing(s2)).toStrictEqual([ r1, r2 ]);
    });
});

// inherited from CollectionWithMetadata
describe('NumSeq.describe', () => {
    test('describes as expected', () => {
        expect(NumSeq.from([ 1, 2 ], { tempo: 144 }).describe())
            .toStrictEqual('NumSeq(length=2,metadata=Metadata({tempo=144}))([\n    0: NumSeqMember(1),\n    1: NumSeqMember(2),\n])');
    });
});