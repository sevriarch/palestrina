import { ChordSeq } from './sequences';

import NumericValidator from '../validation/numeric';

describe('ChordSeq.from()', () => {
    const c = ChordSeq.from([ 1, 2, 3 ]);

    test('ChordSeq.from() with melody argument and same validator returns same object', () => {
        expect(ChordSeq.from(c)).toBe(c);
    });

    test('ChordSeq.from() with melody argument and different validator returns different object with same contents', () => {
        const c2 = ChordSeq.from(c, { validator: NumericValidator.NOOP_VALIDATOR });

        expect(c2).not.toBe(c);
        expect(c2.contents).toStrictEqual(c.contents);
    });
});

describe('ChordSeq.keepTopPitches()', () => {
    const s = ChordSeq.from([ [], [ 1 ], [ 2, 3 ], [ 4, 5, 6 ], [ 7, 8, 9, 10 ]]);

    test('throw if argument is not a non-negative integer', () => {
        expect(() => s.keepTopPitches(1.5)).toThrow();
        expect(() => s.keepTopPitches(-1)).toThrow();
        expect(() => s.keepTopPitches('-1' as unknown as number)).toThrow();
    });

    const table: [ string, ChordSeq, number, ChordSeq ][] = [
        [ 'empty sequence', ChordSeq.from([]), 1, ChordSeq.from([]) ],
        [ 'top zero pitches', s, 0, ChordSeq.from([ [], [], [], [], [] ]) ],
        [ 'top one pitch', s, 1, ChordSeq.from([ [], [ 1 ], [ 3 ], [ 6 ], [ 10 ] ]) ],
        [ 'top three pitches', s, 3, ChordSeq.from([ [], [ 1 ], [ 2, 3 ], [ 4, 5, 6 ], [ 8, 9, 10 ] ]) ],
        [ 'top five pitches', s, 5, s ],
    ];

    test.each(table)('works with %s', (_, s, n, ret) => {
        expect(s.keepTopPitches(n)).toStrictEqual(ret);
    });
});

describe('ChordSeq.keepBottomPitches()', () => {
    const s = ChordSeq.from([ [], [ 1 ], [ 2, 3 ], [ 4, 5, 6 ], [ 7, 8, 9, 10 ]]);

    test('throw if argument is not a non-negative integer', () => {
        expect(() => s.keepBottomPitches(1.5)).toThrow();
        expect(() => s.keepBottomPitches(-1)).toThrow();
        expect(() => s.keepBottomPitches('-1' as unknown as number)).toThrow();
    });

    const table: [ string, ChordSeq, number, ChordSeq ][] = [
        [ 'empty sequence', ChordSeq.from([]), 1, ChordSeq.from([]) ],
        [ 'bottom zero pitches', s, 0, ChordSeq.from([ [], [], [], [], [] ]) ],
        [ 'bottom one pitch', s, 1, ChordSeq.from([ [], [ 1 ], [ 2 ], [ 4 ], [ 7 ] ]) ],
        [ 'bottom three pitches', s, 3, ChordSeq.from([ [], [ 1 ], [ 2, 3 ], [ 4, 5, 6 ], [ 7, 8, 9 ] ]) ],
        [ 'bottom five pitches', s, 5, s ],
    ];

    test.each(table)('works with %s', (_, s, n, ret) => {
        expect(s.keepBottomPitches(n)).toStrictEqual(ret);
    });
});

// inherited from CollectionWithMetadata
describe('ChordSeq.describe', () => {
    test('describes as expected', () => {
        expect(ChordSeq.from([ [ 1, 2 ], null ], { tempo: 144 }).describe())
            .toStrictEqual('ChordSeq(length=2,metadata=Metadata({tempo=144}))([\n    0: ChordSeqMember([1,2]),\n    1: ChordSeqMember([]),\n])');
    });
});