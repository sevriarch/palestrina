import ChordSeq from './chord';

import { chordseq, microtonalchordseq, intseq } from '../factory';

describe('ChordSeq creation', () => {
    const c = chordseq([ 1, 2, 3 ]);

    test('ChordSeq.from() with melody argument and same validator returns same object', () => {
        expect(ChordSeq.from(c)).toBe(c);
    });

    test('ChordSeq.from() with melody argument and different validator returns different object with same contents', () => {
        const c2 = microtonalchordseq(c);

        expect(c2).not.toBe(c);
        expect(c2.contents).toStrictEqual(c.contents);
    });

    test('ChordSeq.from() taking contents from an intseq via factory', () => {
        expect(chordseq(intseq([ 1, 2, 3 ]))).toStrictEqual(c);
    });
});

describe('ChordSeq.keepTopPitches()', () => {
    const s = chordseq([ [], [ 1 ], [ 2, 3 ], [ 4, 5, 6 ], [ 7, 8, 9, 10 ]]);

    test('throw if argument is not a non-negative integer', () => {
        expect(() => s.keepTopPitches(1.5)).toThrow();
        expect(() => s.keepTopPitches(-1)).toThrow();
        expect(() => s.keepTopPitches('-1' as unknown as number)).toThrow();
    });

    const table: [ string, ChordSeq, number, ChordSeq ][] = [
        [ 'empty sequence', chordseq([]), 1, chordseq([]) ],
        [ 'top zero pitches', s, 0, chordseq([ [], [], [], [], [] ]) ],
        [ 'top one pitch', s, 1, chordseq([ [], [ 1 ], [ 3 ], [ 6 ], [ 10 ] ]) ],
        [ 'top three pitches', s, 3, chordseq([ [], [ 1 ], [ 2, 3 ], [ 4, 5, 6 ], [ 8, 9, 10 ] ]) ],
        [ 'top five pitches', s, 5, s ],
    ];

    test.each(table)('works with %s', (_, s, n, ret) => {
        expect(s.keepTopPitches(n)).toStrictEqual(ret);
    });
});

describe('ChordSeq.keepBottomPitches()', () => {
    const s = chordseq([ [], [ 1 ], [ 2, 3 ], [ 4, 5, 6 ], [ 7, 8, 9, 10 ]]);

    test('throw if argument is not a non-negative integer', () => {
        expect(() => s.keepBottomPitches(1.5)).toThrow();
        expect(() => s.keepBottomPitches(-1)).toThrow();
        expect(() => s.keepBottomPitches('-1' as unknown as number)).toThrow();
    });

    const table: [ string, ChordSeq, number, ChordSeq ][] = [
        [ 'empty sequence', chordseq([]), 1, chordseq([]) ],
        [ 'bottom zero pitches', s, 0, chordseq([ [], [], [], [], [] ]) ],
        [ 'bottom one pitch', s, 1, chordseq([ [], [ 1 ], [ 2 ], [ 4 ], [ 7 ] ]) ],
        [ 'bottom three pitches', s, 3, chordseq([ [], [ 1 ], [ 2, 3 ], [ 4, 5, 6 ], [ 7, 8, 9 ] ]) ],
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