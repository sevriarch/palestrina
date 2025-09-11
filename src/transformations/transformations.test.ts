import type Score from '../scores/score';

import NumericValidator from '../validation/numeric';
import Metadata from '../metadata/metadata';
import MetaList from '../meta-events/meta-list';
import MetaEvent from '../meta-events/meta-event';

import * as transformations from './transformations';
import * as factory from '../factory';

describe('transformations.notesToGamut()', () => {
    test('throws if not an array', () => {
        expect(() => transformations.notesToGamut(4 as unknown as number[])).toThrow();
    });

    test('works if empty array', () => {
        expect(transformations.notesToGamut([])).toStrictEqual([]);
    });

    test('returns an ordered gamut if non-empty array', () => {
        expect(transformations.notesToGamut([ 13, 21, 66 ])).toEqual([ 1, 6, 9 ]);
    });

    test('removes duplicates from the gamut', () => {
        expect(transformations.notesToGamut([ 54, 60, 75, 102 ])).toEqual([ 0, 3, 6 ]);
    });
});

describe('transformations.notesToIntervals()', () => {
    test('throws if not an array', () => {
        expect(() => transformations.notesToIntervals(4 as unknown as number[])).toThrow();
    });

    const table: [ number[], number[] ][] = [
        [ [], [] ],
        [ [ 1 ], [] ],
        [ [ 5, 16 ], [ 11 ] ],
        [ [ 38, 2, 23 ], [ 15, 21, 36 ] ],
        [ [ 11, 58, 23, 23, 46, 6 ], [ 0, 5, 12, 17, 23, 35, 40, 47, 52 ] ],
    ];

    test.each(table)('notesToIntervals(%j) is %j', (notes, ints) => {
        expect(transformations.notesToIntervals(notes)).toEqual(ints);
    });
});

describe('transformations.notesToPitchClass()', () => {
    test('throws if not an array', () => {
        expect(() => transformations.notesToPitchClass(4 as unknown as number[])).toThrow();
    });

    test('throws if non-integers passed', () => {
        expect(() => transformations.notesToPitchClass([ 55, 56.5, 58 ])).toThrow();
    });

    const table: [ number[], string ][] = [
        [ [], '0-1' ],
        [ [ 55 ], '1-1' ],
        [ [ 32, 56 ], '1-1' ],
        [ [ 25, 36 ], '2-1' ],
        [ [ 103, 14, 28 ], '3-7A' ],
        [ [ 29, 80, 57, 64 ], '4-7' ],
        [ [ 107, 9, 56, 67, 38 ], '5-Z36A' ],
        [ [ 0, 2, 6, 8, 9, 10 ], '6-21A' ],
        [ [ 0, 1, 2, 3, 7, 8, 9 ], '7-7B' ],
        [ [ 0, 2, 4, 6, 7, 8, 9, 10 ], '8-21' ],
        [ [ 0, 1, 2, 4, 5, 6, 8, 9, 10 ], '9-12' ],
        [ [ 0, 1, 3, 4, 5, 6, 7, 9, 10, 11 ], '10-6' ],
        [ [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11 ], '11-1' ],
        [ [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11 ], '12-1' ],
    ];

    test.each(table)('notesToPitchClass(%j) is %j', (notes, pc) => {
        expect(transformations.notesToPitchClass(notes)).toEqual(pc);
    });
});

describe('transformations.notesToIntervalGamut()', () => {
    test('throws if not an array', () => {
        expect(() => transformations.notesToIntervalGamut(4 as unknown as number[])).toThrow();
    });

    const table: [ number[], number[] ][] = [
        [ [], [] ],
        [ [ 1 ], [] ],
        [ [ 5, 16 ], [ 11 ] ],
        [ [ 38, 2, 23 ], [ 0, 3, 9 ] ],
        [ [ 11, 58, 23, 23, 46, 6 ], [ 0, 4, 5, 11 ] ],
    ];

    test.each(table)('notesToIntervalGamut(%j) is %j', (notes, ints) => {
        expect(transformations.notesToIntervalGamut(notes)).toEqual(ints);
    });
});

describe('transformations.scoreToNotes()', () => {
    const m1 = factory.melody([ 60, 62, 64, 68, 70, 72 ]).withDuration(64);
    const m2 = factory.melody([ 83, null, 77, 72 ]).withDuration(96);
    const m3 = factory.melody([ [ 71, 75 ], [], [], [ 72 ] ]).withDuration(96);
    const m4 = factory.melody([]);
    const sc = factory.score([ m1, m2, m3, m4 ]);

    test('throws if not a Score', () => {
        expect(() => transformations.scoreToNotes(m1 as unknown as Score)).toThrow();
    });

    test('returns empty arrays if an empty score passed', () => {
        expect(transformations.scoreToNotes(factory.score([]))).toStrictEqual([ [], [] ]);
    });

    test('returns empty array if a score with only empty tracks passed', () => {
        expect(transformations.scoreToNotes(factory.score([ m4, m4 ]))).toStrictEqual([ [], [] ]);
    });

    test('returns as expected if a score with one track passed', () => {
        expect(transformations.scoreToNotes(factory.score([ m3 ]))).toStrictEqual([
            [ 0, 96, 192, 288, 384 ],
            [ [ 71, 75 ], [], [], [ 72 ], [] ]
        ]);
    });

    test('returns expected timeline and intervals', () => {
        expect(transformations.scoreToNotes(sc)).toStrictEqual([
            [ 0, 64, 96, 128, 192, 256, 288, 320, 384 ],
            [ [ 60, 71, 75, 83 ], [ 62, 71, 75, 83 ], [ 62 ], [ 64 ], [ 68, 77 ], [ 70, 77 ], [ 70, 72, 72 ], [ 72, 72, 72 ], [] ]
        ]);
    });
});

describe('transformation.scoreToGamut()', () => {
    const m1 = factory.melody([ 60, 62, 64, 68, 70, 72 ]).withDuration(64);
    const m2 = factory.melody([ 83, null, 77, 72 ]).withDuration(96);
    const m3 = factory.melody([ [ 71, 75 ], [], [], [ 72 ] ]).withDuration(96);
    const m4 = factory.melody([]);
    const sc = factory.score([ m1, m2, m3, m4 ]);

    test('throws if not a Score', () => {
        expect(() => transformations.scoreToGamut(m1 as unknown as Score)).toThrow();
    });

    test('returns empty arrays if an empty score passed', () => {
        expect(transformations.scoreToGamut(factory.score([]))).toStrictEqual([ [], [] ]);
    });

    test('returns empty array if a score with only empty tracks passed', () => {
        expect(transformations.scoreToGamut(factory.score([ m4, m4 ]))).toStrictEqual([ [], [] ]);
    });

    test('returns as expected if a score with one track passed', () => {
        expect(transformations.scoreToGamut(factory.score([ m3 ]))).toStrictEqual([
            [ 0, 96, 192, 288, 384 ],
            [ [ 3, 11 ], [], [], [ 0 ], [] ]
        ]);
    });

    test('returns expected timeline and intervals', () => {
        expect(transformations.scoreToGamut(sc)).toStrictEqual([
            [ 0, 64, 96, 128, 192, 256, 288, 320, 384 ],
            [ [ 0, 3, 11 ], [ 2, 3, 11 ], [ 2 ], [ 4 ], [ 5, 8 ], [ 5, 10 ], [ 0, 10 ], [ 0 ], [] ]
        ]);
    });
});

describe('transformations.scoreToIntervals()', () => {
    const m1 = factory.melody([ 60, 62, 64, 68, 70, 72 ]).withDuration(64);
    const m2 = factory.melody([ 83, null, 77, 72 ]).withDuration(96);
    const m3 = factory.melody([ [ 71, 75 ], [], [], [ 72 ] ]).withDuration(96);
    const m4 = factory.melody([]);
    const sc = factory.score([ m1, m2, m3, m4 ]);

    test('throws if not a Score', () => {
        expect(() => transformations.scoreToIntervals(m1 as unknown as Score)).toThrow();
    });

    test('returns empty arrays if an empty score passed', () => {
        expect(transformations.scoreToIntervals(factory.score([]))).toStrictEqual([ [], [] ]);
    });

    test('returns empty array if a score with only empty tracks passed', () => {
        expect(transformations.scoreToIntervals(factory.score([ m4, m4 ]))).toStrictEqual([ [], [] ]);
    });

    test('returns as expected if a score with one track passed', () => {
        expect(transformations.scoreToIntervals(factory.score([ m3 ]))).toStrictEqual([
            [ 0, 96, 192, 288, 384 ],
            [ [ 4 ], [], [], [], [] ]
        ]);
    });

    test('returns expected timeline and intervals', () => {
        expect(transformations.scoreToIntervals(sc)).toStrictEqual([
            [ 0, 64, 96, 128, 192, 256, 288, 320, 384 ],
            [ [ 4, 8, 11, 12, 15, 23 ], [ 4, 8, 9, 12, 13, 21 ], [], [], [ 9 ], [ 7 ], [ 0, 2 ], [ 0 ], [] ]
        ]);
    });
});

describe('transformations.scoreToIntervalGamut()', () => {
    const m1 = factory.melody([ 60, 62, 64, 68, 70, 72 ]).withDuration(64);
    const m2 = factory.melody([ 83, null, 77, 72 ]).withDuration(96);
    const m3 = factory.melody([ [ 71, 75 ], [], [], [ 72 ] ]).withDuration(96);
    const m4 = factory.melody([]);
    const sc = factory.score([ m1, m2, m3, m4 ]);

    test('throws if not a Score', () => {
        expect(() => transformations.scoreToIntervalGamut(m1 as unknown as Score)).toThrow();
    });

    test('returns empty arrays if an empty score passed', () => {
        expect(transformations.scoreToIntervalGamut(factory.score([]))).toStrictEqual([ [], [] ]);
    });

    test('returns empty array if a score with only empty tracks passed', () => {
        expect(transformations.scoreToIntervalGamut(factory.score([ m4, m4 ]))).toStrictEqual([ [], [] ]);
    });

    test('returns as expected if a score with one track passed', () => {
        expect(transformations.scoreToIntervalGamut(factory.score([ m3 ]))).toStrictEqual([
            [ 0, 96, 192, 288, 384 ],
            [ [ 4 ], [], [], [], [] ]
        ]);
    });

    test('returns expected timeline and intervals', () => {
        expect(transformations.scoreToIntervalGamut(sc)).toStrictEqual([
            [ 0, 64, 96, 128, 192, 256, 288, 320, 384 ],
            [ [ 0, 3, 4, 8, 11 ], [ 0, 1, 4, 8, 9 ], [], [], [ 9 ], [ 7 ], [ 0, 2 ], [ 0 ], [] ]
        ]);
    });
});

describe('transformations.scoreToPitchClasses()', () => {
    const m1 = factory.melody([ 60, 62, 64, 68, 70, 72 ]).withDuration(64);
    const m2 = factory.melody([ 83, null, 77, 72 ]).withDuration(96);
    const m3 = factory.melody([ [ 71, 75 ], [], [], [ 72 ] ]).withDuration(96);
    const m4 = factory.melody([]);
    const sc = factory.score([ m1, m2, m3, m4 ]);

    test('throws if not a Score', () => {
        expect(() => transformations.scoreToPitchClasses(m1 as unknown as Score)).toThrow();
    });

    test('returns empty arrays if an empty score passed', () => {
        expect(transformations.scoreToPitchClasses(factory.score([]))).toStrictEqual([ [], [] ]);
    });

    test('returns empty array if a score with only empty tracks passed', () => {
        expect(transformations.scoreToPitchClasses(factory.score([ m4, m4 ]))).toStrictEqual([ [], [] ]);
    });

    test('returns as expected if a score with one track passed', () => {
        expect(transformations.scoreToPitchClasses(factory.score([ m3 ]))).toStrictEqual([
            [ 0, 96, 192, 288, 384 ],
            [ '2-4', '0-1', '0-1', '1-1', '0-1' ]
        ]);
    });

    test('returns expected timeline and intervals', () => {
        expect(transformations.scoreToPitchClasses(sc)).toStrictEqual([
            [ 0, 64, 96, 128, 192, 256, 288, 320, 384 ],
            [ '3-3A', '3-3B', '1-1', '1-1', '2-3', '2-5', '2-2', '1-1', '0-1' ]
        ]);
    });
});

describe('transformations.scoreToNoteCount()', () => {
    const m1 = factory.melody([ 60, 62, 64, 68, 70, 72 ]).withDuration(64);
    const m2 = factory.melody([ 83, null, 77, 72 ]).withDuration(96);
    const m3 = factory.melody([ [ 71, 75 ], [], [], [ 72 ] ]).withDuration(96);
    const m4 = factory.melody([]);
    const sc = factory.score([ m1, m2, m3, m4 ]);

    test('throws if not a Score', () => {
        expect(() => transformations.scoreToNoteCount(m1 as unknown as Score, 50)).toThrow();
    });

    test('throws if granularity is not a positive integer', () => {
        expect(() => transformations.scoreToNoteCount(sc, 0)).toThrow();
        expect(() => transformations.scoreToNoteCount(sc, 54.5)).toThrow();
        expect(() => transformations.scoreToNoteCount(sc, '4' as unknown as number)).toThrow();
    });

    test('returns empty array if an empty score passed', () => {
        expect(transformations.scoreToNoteCount(factory.score([]), 50)).toStrictEqual([]);
    });

    test('returns empty array if a score with only empty tracks passed', () => {
        expect(transformations.scoreToNoteCount(factory.score([ m4, m4 ]), 50)).toStrictEqual([]);
    });

    test('returns expected values (increment is a factor of the length)', () => {
        expect(transformations.scoreToNoteCount(sc, 32)).toStrictEqual([ 4, 0, 1, 0, 1, 0, 2, 0, 1, 2, 1, 0, 0 ]);
    });

    test('returns expected values (increment is not a factor of the length)', () => {
        expect(transformations.scoreToNoteCount(sc, 50)).toStrictEqual([ 4, 1, 1, 2, 0, 3, 1, 0 ]);
    });
});

describe('transformations.scoreToMatchingTimedEvents()', () => {
    test('no events if no tracks', () => {
        expect(transformations.scoreToMatchingTimedEvents(factory.score([]), () => true)).toStrictEqual([]);
    });

    test('extracts from score metadata', () => {
        expect(transformations.scoreToMatchingTimedEvents(factory.score([],
            Metadata.from({
                before: MetaList.from([
                    {
                        event: 'time-signature',
                        value: '4/4',
                        at: 0
                    },
                    {
                        event: 'time-signature',
                        value: '3/4',
                        at: 1024 
                    },
                ])
            })
        ), () => true)).toStrictEqual([
            MetaEvent.from({ event: 'time-signature', value: '4/4', at: 0 }),
            MetaEvent.from({ event: 'time-signature', value: '3/4', at: 1024 }),
        ]);
    });

    test('filters from score metadata', () => {
        expect(transformations.scoreToMatchingTimedEvents(factory.score([],
            Metadata.from({
                before: MetaList.from([
                    {
                        event: 'time-signature',
                        value: '4/4',
                        at: 0
                    },
                    {
                        event: 'time-signature',
                        value: '3/4',
                        at: 1024 
                    },
                ])
            })
        ), (ev) => ev.value !== '4/4')).toStrictEqual([
            MetaEvent.from({ event: 'time-signature', value: '3/4', at: 1024 }),
        ]);
    });

    test('extracts from notes and metadata', () => {
        expect(transformations.scoreToMatchingTimedEvents(factory.score([
            factory.melody([
                {
                    pitch: [ 60 ],
                    duration: 32,
                    before: [ { event: 'time-signature', value: '4/4' } ]
                },
                {
                    pitch: [ 62 ],
                    duration: 32,
                    after: [ { event: 'time-signature', value: '2/4' } ]
                },
                {
                    pitch: [ 64 ],
                    duration: 32,
                    before: [ { event: 'time-signature', value: '7/8', offset: 48 } ]
                },
                {
                    pitch: [ 66 ],
                    duration: 32,
                    after: [ { event: 'time-signature', value: '3/4', offset: -48 } ]
                },
                {
                    pitch: [ 68 ],
                    duration: 32,
                    before: [ { event: 'time-signature', value: '5/8', at: 180 } ]
                },
                {
                    pitch: [ 72 ],
                    duration: 32,
                    after: [ { event: 'time-signature', value: '3/8', at: 120 } ]
                },
            ]),
            factory.melody([], 
                Metadata.from({
                    before: MetaList.from([
                        {
                            event: 'key-signature',
                            value: 'F',
                            at: 0
                        },
                        {
                            event: 'key-signature',
                            value: 'F#',
                            at: 512 
                        },
                    ])
                })
            )
        ],
        Metadata.from({
            before: MetaList.from([
                { event: 'copyright', value: 'this test suite' },
            ])
        })), () => true)).toStrictEqual([
            MetaEvent.from({ event: 'copyright', value: 'this test suite', at: 0 }),
            MetaEvent.from({ event: 'time-signature', value: '4/4', at: 0 }),
            MetaEvent.from({ event: 'key-signature', value: 'F', at: 0 }),
            MetaEvent.from({ event: 'time-signature', value: '2/4', at: 64 }),
            MetaEvent.from({ event: 'time-signature', value: '3/4', at: 80 }),
            MetaEvent.from({ event: 'time-signature', value: '7/8', at: 112 }),
            MetaEvent.from({ event: 'time-signature', value: '3/8', at: 120 }),
            MetaEvent.from({ event: 'time-signature', value: '5/8', at: 180 }),
            MetaEvent.from({ event: 'key-signature', value: 'F#', at: 512 }),
        ]);
    });

    test('filters from notes and metadata', () => {
        expect(transformations.scoreToMatchingTimedEvents(factory.score([
            factory.melody([
                {
                    pitch: [ 60 ],
                    duration: 32,
                    before: [ { event: 'time-signature', value: '4/4' } ]
                },
                {
                    pitch: [ 62 ],
                    duration: 32,
                    after: [ { event: 'time-signature', value: '2/4' } ]
                },
                {
                    pitch: [ 64 ],
                    duration: 32,
                    before: [ { event: 'time-signature', value: '7/8', offset: 48 } ]
                },
                {
                    pitch: [ 66 ],
                    duration: 32,
                    after: [ { event: 'time-signature', value: '3/4', offset: -48 } ]
                },
                {
                    pitch: [ 68 ],
                    duration: 32,
                    before: [ { event: 'time-signature', value: '5/8', at: 180 } ]
                },
                {
                    pitch: [ 72 ],
                    duration: 32,
                    after: [ { event: 'time-signature', value: '3/8', at: 120 } ]
                },
            ]),
            factory.melody([], 
                Metadata.from({
                    before: MetaList.from([
                        {
                            event: 'key-signature',
                            value: 'F',
                            at: 0
                        },
                        {
                            event: 'key-signature',
                            value: 'F#',
                            at: 512 
                        },
                    ])
                })
            )
        ],
        Metadata.from({
            before: MetaList.from([
                { event: 'copyright', value: 'this test suite' },
            ])
        })), e => e.at as number < 96)).toStrictEqual([
            MetaEvent.from({ event: 'copyright', value: 'this test suite', at: 0 }),
            MetaEvent.from({ event: 'time-signature', value: '4/4', at: 0 }),
            MetaEvent.from({ event: 'key-signature', value: 'F', at: 0 }),
            MetaEvent.from({ event: 'time-signature', value: '2/4', at: 64 }),
            MetaEvent.from({ event: 'time-signature', value: '3/4', at: 80 }),
        ]);
    });
});

describe('transformations.scoreToBarTimeline', () => {
    test('empty score', () => {
        expect(transformations.scoreToBarTimeline(factory.score([]))).toStrictEqual([]);
    });

    test('empty score with adjusted last tick', () => {
        expect(transformations.scoreToBarTimeline(
            factory.score([
                factory.melody([]).withNewEvent('sustain', 0, { at: 4096 })
            ])
        )).toStrictEqual([ 0, 768, 1536, 2304, 3072, 3840 ]);
    });

    test('empty score with adjusted ticks per quarter and last tick', () => {
        expect(transformations.scoreToBarTimeline(
            factory.score([
                factory.melody([]).withNewEvent('sustain', 0, { at: 4096 })
            ]).withTicksPerQuarter(256)
        )).toStrictEqual([ 0, 1024, 2048, 3072 ]);
    });

    test('empty score with time signature and adjusted last tick', () => {
        expect(transformations.scoreToBarTimeline(
            factory.score([
                factory.melody([]).withNewEvent('sustain', 0, { at: 4096 })
            ]).withTimeSignature('3/4')
        )).toStrictEqual([ 0, 576, 1152, 1728, 2304, 2880, 3456, 4032 ]);
    });

    test('empty score with time signatures in score and melody and adjusted last tick', () => {
        expect(transformations.scoreToBarTimeline(
            factory.score([
                factory.melody([]).withNewEvent('sustain', 0, { at: 4096 }).withTimeSignature('3/4')
            ]).withTimeSignature('3/2')
        )).toStrictEqual([ 0, 1152, 2304, 3456 ]);
    });

    test('score with no initial time signature but adjusted time signature later on', () => {
        expect(transformations.scoreToBarTimeline(
            factory.score([
                factory.melody([ 60, 61, 62, { pitch: [ 63 ], after: [ { event: 'time-signature', value: '3/4' } ] }, 64, 65, 66, 67, 68, 69, 70 ]).withDuration(192)
            ])
        )).toStrictEqual([ 0, 768, 1344, 1920 ]);
    });

    test('score with no initial time signature but multiple adjusted time signatures later on', () => {
        expect(transformations.scoreToBarTimeline(
            factory.score([
                factory.melody([
                    60, 61, 62,
                    { pitch: [ 63 ], after: [ { event: 'time-signature', value: '3/4' } ] }, 
                    { pitch: [ 64 ], before: [ { event: 'time-signature', value: '2/4' } ] },
                    65, 66,
                    { pitch: [ 67 ], before: [ { event: 'time-signature', value: '1/4' } ] },
                    68, 69, 70
                ]).withDuration(192)
            ])
        )).toStrictEqual([ 0, 768, 1152, 1536, 1728, 1920 ]);
    });
});

describe('transformations.melodyFromTimeline()', () => {
    const TIMELINE = [ 0, 64, 96, 160 ];
    const NOTES = [ [ 60.5 ], [], [ 58, 62 ], [ 63.5 ]];

    test('generates an empty melody from an empty timeline', () => {
        expect(transformations.melodyFromTimeline([], [])).toStrictEqual(factory.melody([]));
    });

    test('generates a non-microtonal melody from timeline and notes', () => {
        expect(transformations.melodyFromTimeline([ 0, 64, 96 ], [ [ 60 ], [ 61, 62 ], [ 63 ] ]))
            .toStrictEqual(factory.melody([
                { pitch: [ 60 ], at: 0, duration: 64, velocity: 64 },
                { pitch: [ 61, 62 ], at: 64, duration: 32, velocity: 64 },
                { pitch: [ 63 ], at: 96, duration: 240, velocity: 64 },
            ]));
    });

    test('throws when generating a microtonal melody with a non-microtonal validator', () => {
        expect(() => transformations.melodyFromTimeline(TIMELINE, NOTES)).toThrow();
    });

    test('generates the correct melody when all parameters are valid', () => {
        expect(transformations.melodyFromTimeline(TIMELINE, NOTES, NumericValidator.NOOP_VALIDATOR))
            .toStrictEqual(factory.microtonalmelody([
                { pitch: [ 60.5 ], at: 0, duration: 64, velocity: 64 },
                { pitch: [], at: 64, duration: 32, velocity: 64 },
                { pitch: [ 58, 62 ], at: 96, duration: 64, velocity: 64 },
                { pitch: [ 63.5 ], at: 160, duration: 240, velocity: 64 },
            ]));
    });
});