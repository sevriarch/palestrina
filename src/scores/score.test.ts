import type { MapperFn, FilterFn, ScoreCanvasOpts } from '../types';

import type Melody from '../sequences/melody';

import Score from './score';

import * as fs from 'fs';

import { score, melody } from '../factory';

import MetaList from '../meta-events/meta-list';
import MetaEvent from '../meta-events/meta-event';

// Mocking fs is ugly but without it jest.spyOn(fs, 'writeFileSync') doesn't work
// in TypeScript, throwing: TypeError: Cannot redefine property: writeFileSync
// See: https://github.com/aelbore/esbuild-jest/issues/26
jest.mock('fs', () => {
    const rawfs = jest.requireActual('fs');

    return {
        ...rawfs,
        writeFileSync: jest.fn()
    };
});

const T0 = melody([]);
const T1 = melody([
    { pitch: [ 60 ], duration: 8, velocity: 50 }
]);
const T2 = melody([
    { pitch: [ 64 ], duration: 4, velocity: 45 },
    { pitch: [ 52 ], duration: 4, velocity: 40 },
]);
const T3 = melody([
    { pitch: [ 48 ], duration: 4, velocity: 44 },
    { pitch: [ 60 ], duration: 16, velocity: 46 },
    { pitch: [], duration: 8, velocity: 0 },
    { pitch: [ 63 ], duration: 16, velocity: 48 },
    { pitch: [ 60 ], duration: 8, velocity: 50 }
]);
const T4 = melody([
    { pitch: [ 54, 63 ], duration: 8, velocity: 63 },
    { pitch: [ 55, 60 ], duration: 4, velocity: 56 },
    { pitch: [ 52, 59 ], duration: 4, velocity: 58 },
    { pitch: [ 53, 65 ], duration: 8, velocity: 63 }
]);

describe('Score construction tests', () => {
    const table = [
        [ [] ], 
        [ [ T1 ] ], 
        [ [ T1, T2, T3, T4 ] ],
        [ [ T1, T1 ] ]
    ];

    describe.each(table)('constructor/appendItems() %#', trax => {
        test('constructor fails when invalid argument passed', () => {
            expect(() => score(0 as unknown as Melody[])).toThrow();
        });

        test('constructor fails with invalid member in array', () => {
            expect(() => score([ T1, 0 as unknown as Melody, T2 ])).toThrow();
        });

        test('constructor', () => {
            const sc = score(trax);

            expect(sc.contents).toStrictEqual(trax);
            expect(sc.contents).not.toBe(trax);
        });

        test('appendItems() (all at once)', () => {
            const sc = score().appendItems(...trax);

            expect(sc.contents).toStrictEqual(trax);
            expect(sc.contents).not.toBe(trax);
        });

        test('appendItems() (one at a time)', () => {
            let sc = score();

            trax.forEach(t => sc = sc.appendItems(t));

            expect(sc.contents).toStrictEqual(trax);
            expect(sc.contents).not.toBe(trax);
        });

        test('Score.from()', () => {
            const sc = Score.from(trax);

            expect(sc.contents).toStrictEqual(trax);
            expect(sc.contents).not.toBe(trax);
        });
    });

    test('expect Score.from() to throw when garbage supplied', () => {
        expect(() => Score.from(1 as unknown as Melody[])).toThrow();
    });

    test('expect score with no argument to be the same as score with an empty array', () => {
        const sc = score();

        expect(sc.contents).toStrictEqual([]);
        expect(sc.metadata.ticks_per_quarter).toEqual(192);
    });

    test('expect score with a {} second argument to take default ticks_per_quarter', () => {
        const sc = score(undefined, {});

        expect(sc.contents).toStrictEqual([]);
        expect(sc.metadata.ticks_per_quarter).toEqual(192);
    });

    test('expect score with defined metadata to use that metadata', () => {
        const sc = score(undefined, { ticks_per_quarter: 128, copyright: 'mine' });

        expect(sc.contents).toStrictEqual([]);
        expect(sc.metadata.ticks_per_quarter).toEqual(128);
        expect(sc.metadata.copyright).toEqual('mine');
    });

    test('expect score and tracks to be immutable', () => {
        const sc = score([ T1, T2, T3, T4 ]);

        expect(Object.isFrozen(sc)).toBeTruthy();
        expect(Object.isFrozen(sc.contents)).toBeTruthy();
    });
});

describe('Score.withNewEvent()', () => {
    const S0 = score([ T0 ]);

    test('adding two events using three-argument form works', () => {
        const S1 = S0.withNewEvent('sustain', 1)
            .withNewEvent('sustain', 0, { at: 2048 });
            
        expect(S1.metadata.before).toStrictEqual(
            MetaList.from([
                MetaEvent.from({ event: 'sustain', value: 1 }),
                MetaEvent.from({ event: 'sustain', value: 0, at: 2048 })
            ])
        );
    });

    test('adding two events using one-argument form once works', () => {
        const S1 = S0.withNewEvents([
            { event: 'sustain', value: 1 },
            { event: 'sustain', value: 0, offset: 2048 }
        ]);

        expect(S1.metadata.before).toStrictEqual(
            MetaList.from([
                MetaEvent.from({ event: 'sustain', value: 1 }),
                MetaEvent.from({ event: 'sustain', value: 0, offset: 2048 })
            ])
        );
    });

    // TODO: What is this attempting to test?
    test('adding metaevents for the score only includes them in first track', () => {
        const S1 = S0.withNewEvents([
            { event: 'sustain', value: 1 },
            { event: 'sustain', value: 0, offset: 2048 }
        ]).appendItems(T0);

        expect(S1.metadata.before).toStrictEqual(
            MetaList.from([
                MetaEvent.from({ event: 'sustain', value: 1 }),
                MetaEvent.from({ event: 'sustain', value: 0, offset: 2048 })
            ])
        );
    });
});

describe('Score.keepSlice()', () => {
    // TODO: Do we need to keep this, since it is tested in collection.test.ts?
    const table: [ Score, number, number | undefined, Score ][] = [
        [
            score([ T0, T1, T2, T3, T4 ]),
            0,
            undefined,
            score([ T0, T1, T2, T3, T4 ])
        ],
        [
            score([ T0, T1, T2, T3, T4 ]),
            2,
            undefined,
            score([ T2, T3, T4 ])
        ],
        [
            score([ T0, T1, T2, T3, T4 ]).withTicksPerQuarter(64),
            5,
            undefined,
            score([ ]).withTicksPerQuarter(64)
        ],
        [
            score([ T0, T1, T2, T3, T4 ], { midichannel: 10 }),
            1,
            2,
            score([ T1 ], { midichannel: 10 })
        ],
        [
            score([ T0, T1, T2, T3, T4 ]),
            1,
            6,
            score([ T1, T2, T3, T4 ])
        ],
    ];

    test.each(table)('Score.keepSlice() %#', (s, from, to, ret) => {
        expect(s.keepSlice(from, to)).toStrictEqual(ret);
    });
});

describe('Score.dropSlice()', () => {
    // TODO: Do we need to keep this, since it is tested in collection.test.ts?
    const table: [ Score, number, number | undefined, Score ][] = [
        [
            score([ T0, T1, T2, T3, T4 ]),
            0,
            undefined,
            score([ ])
        ],
        [
            score([ T0, T1, T2, T3, T4 ]),
            2,
            undefined,
            score([ T0, T1 ])
        ],
        [
            score([ T0, T1, T2, T3, T4 ]).withTicksPerQuarter(64),
            5,
            undefined,
            score([ T0, T1, T2, T3, T4 ]).withTicksPerQuarter(64)
        ],
        [
            score([ T0, T1, T2, T3, T4 ], { midichannel: 10 }),
            1,
            2,
            score([ T0, T2, T3, T4 ], { midichannel: 10 })
        ],
        [
            score([ T0, T1, T2, T3, T4 ]),
            1,
            6,
            score([ T0 ])
        ],
    ];

    test.each(table)('Score.dropSlice() %#', (s, from, to, ret) => {
        expect(s.dropSlice(from, to)).toStrictEqual(ret);
    });
});

describe('Score.dropIndices()', () => {
    // TODO: Do we need to keep this, since it is tested in collection.test.ts?
    const table: [ Score, number[], Score ][] = [
        [
            score([ T0, T1, T2, T3, T4 ]),
            [],
            score([ T0, T1, T2, T3, T4 ])
        ],
        [
            score([ T0, T1, T2, T3, T4 ]),
            [ 2 ],
            score([ T0, T1, T3, T4 ])
        ],
        [
            score([ T0, T1, T2, T3, T4 ]).withTicksPerQuarter(64),
            [ 1, 2 ],
            score([ T0, T3, T4 ]).withTicksPerQuarter(64)
        ],
        [
            score([ T0, T1, T2, T3, T4 ], { midichannel: 10 }),
            [ 0, 1, 2 ],
            score([ T3, T4 ], { midichannel: 10 })
        ],
        [
            score([ T0, T1, T2, T3, T4 ]),
            [ 0, 1, 2, 3, 4 ],
            score([ ])
        ],
    ];

    test('Score.dropIndices() with non-array fails', () => {
        expect(() => score([]).dropIndices(0)).toThrow();
    });

    test.each(table)('Score.dropIndices() %#', (s, tracks, ret) => {
        expect(s.dropIndices(tracks)).toStrictEqual(ret);
    });
});

describe('Score.map()', () => {
    // TODO: Do we need to keep this, since it is tested in collection.test.ts?
    const table: [ Score, MapperFn<Melody>, Score ][] = [
        [
            score([]),
            m => m.repeat(),
            score([])
        ],
        [
            score([
                melody([ 60, 72, 84 ]),
                melody([ 56 ])
            ]),
            m => m.repeat(),
            score([
                melody([ 60, 72, 84, 60, 72, 84 ]),
                melody([ 56, 56 ])
            ])
        ]
    ];

    test('map() without a function fails', () => {
        expect(() => score([]).map(55 as unknown as MapperFn<Melody>)).toThrow();
    });

    test.each(table)('map() %# works', (score, fn, ret) => {
        expect(score.map(fn)).toStrictEqual(ret);
    });
});

describe('Score.filter()', () => {
    // TODO: Do we need to keep this, since it is tested in collection.test.ts?
    const table: [ Score, FilterFn<Melody>, Score ][] = [
        [
            score([]),
            m => m.length !== 1,
            score([])
        ],
        [
            score([
                melody([60, 72, 84 ]),
                melody([ 56 ])
            ]),
            m => m.length !== 1,
            score([
                melody([ 60, 72, 84 ]),
            ])
        ]
    ];

    test('filter() without a function fails', () => {
        expect(() => score([]).filter(55 as unknown as FilterFn<Melody>)).toThrow();
    });

    test.each(table)('filter() %# works', (score, fn, ret) => {
        expect(score.filter(fn)).toStrictEqual(ret);
    });
});

describe('Score.pitchRange() tests', () => {
    const table: [ Melody[], [ number, number ] ][] = [
        [ [ T1 ], [ 60, 60 ] ],
        [ [ T2 ], [ 52, 64 ] ],
        [ [ T3 ], [ 48, 63 ] ],
        [ [ T4 ], [ 52, 65 ] ],
        [ [ T1, T4 ], [ 52, 65 ] ],
        [ [ T2, T4 ], [ 52, 65 ] ],
        [ [ T3, T4 ], [ 48, 65 ] ],
        [ [ T0, T3, T4 ], [ 48, 65 ] ],
        [ [ T1, T2, T3, T4, T3, T2, T1 ], [ 48, 65 ] ]
    ];

    test.each(table)('pitchRange() %# is %p', (trax, ret) => {
        expect(score(trax).pitchRange()).toStrictEqual(ret);
    });
});

describe('Score.volumeRange() tests', () => {
    const table: [ Melody[], [ number, number ] ][] = [
        [ [ T1 ], [ 50, 50 ] ],
        [ [ T2 ], [ 40, 45 ] ],
        [ [ T3 ], [ 44, 50 ] ],
        [ [ T4 ], [ 56, 63 ] ],
        [ [ T1, T4 ], [ 50, 63 ] ],
        [ [ T2, T4 ], [ 40, 63 ] ],
        [ [ T3, T4 ], [ 44, 63 ] ],
        [ [ T0, T3, T4 ], [ 44, 63 ] ],
        [ [ T1, T2, T3, T4, T3, T2, T1 ], [ 40, 63 ] ]
    ];

    test.each(table)('volumeRange() %# is %p', (trax, ret) => {
        expect(score(trax).volumeRange()).toStrictEqual(ret);
    });
});

describe('Score.lastTick() tests', () => {
    const table: [ Melody[], number ][] = [
        [ [ T1 ], 8 ],
        [ [ T2 ], 8 ],
        [ [ T3 ], 52 ],
        [ [ T4 ], 24 ],
        [ [ T1, T2 ], 8 ],
        [ [ T1, T2, T3 ], 52 ],
        [ [ T4, T1 ], 24 ],
        [ [ T0, T1 ], 8 ],
    ];

    test.each(table)('lastTick() %# is %p', (trax, ret) => {
        expect(score(trax).lastTick()).toStrictEqual(ret);
    });
});

// This test makes the assumption that melody.withAllTicksExact() works correctly and only 
// tests the most basic cases (simple melody data and metadata, score metadata)
describe('Score.withAllTicksExact() tests', () => {
    test('test that this does not create additional entities for an empty Score', () => {
        expect(Score.from([]).withAllTicksExact()).toStrictEqual(Score.from([]));
    });

    test('applies to metadata and all melodies', () => {
        expect(score([
            T0,
            melody([
                { pitch: [ 64 ], duration: 4, velocity: 45 },
                { pitch: [ 52 ], duration: 4, velocity: 40 },
            ], {
                before: MetaList.from([ { event: 'text', value: 'test', offset: 64 } ])
            })
        ], {
            before: MetaList.from([ { event: 'tempo', value: 144, offset: 512 } ])
        }).withAllTicksExact()).toStrictEqual(score([
            T0,
            melody([
                { pitch: [ 64 ], duration: 4, velocity: 45, at: 0 },
                { pitch: [ 52 ], duration: 4, velocity: 40, at: 4 },
            ], {
                before: MetaList.from([ { event: 'text', value: 'test', at: 64 } ])
            })
        ], {
            before: MetaList.from([ { event: 'tempo', value: 144, at: 512 } ])
        }));
    });
});

describe('Score.withChordsCombined()', () => {
    describe('does not fail if no tracks', () => {
        expect(score([]).withChordsCombined()).toStrictEqual(score([]));
    });

    describe('does not fail if no notes', () => {
        expect(score([ T0, T0 ]).withChordsCombined()).toStrictEqual(score([ T0 ]));
    });

    describe('combines only when all are equal', () => {
        expect(score([
            melody([
                { pitch: [ 60 ], duration: 16, velocity: 50 },
                { pitch: [ 64 ], duration: 16, velocity: 55 },
                { pitch: [ 67 ], duration: 32, velocity: 60 },
            ]),
            melody([
                { pitch: [ 52 ], duration: 8, velocity: 50 },
                { pitch: [ 54 ], duration: 8, velocity: 50 },
                { pitch: [ 56 ], duration: 16, velocity: 55 },
                { pitch: [ 58 ], duration: 32, velocity: 60 },
            ]),
            melody([
                { pitch: [ 48 ], duration: 32, velocity: 50 },
                { pitch: [ 41 ], duration: 32, velocity: 60 },
            ]),
            melody([
                { pitch: [ 36 ], duration: 32, velocity: 60 },
                { pitch: [ 48 ], duration: 32, velocity: 50 },
                { pitch: [ 54 ], duration: 32, velocity: 60, at: 0 }
            ]),
        ]).withChordsCombined()).toStrictEqual(score([
            melody([
                { pitch: [ 52 ], duration: 8, velocity: 50, at: 0 },
                { pitch: [ 60 ], duration: 16, velocity: 50, at: 0 },
                { pitch: [ 48 ], duration: 32, velocity: 50, at: 0 },
                { pitch: [ 36, 54 ], duration: 32, velocity: 60, at: 0 },
                { pitch: [ 54 ], duration: 8, velocity: 50, at: 8 },
                { pitch: [ 56, 64 ], duration: 16, velocity: 55, at: 16 },
                { pitch: [ 41, 58, 67 ], duration: 32, velocity: 60, at: 32 },
                { pitch: [ 48 ], duration: 32, velocity: 50, at: 32 },
            ])
        ]));
    });

    describe('does not eliminate duplicated notes', () => {
        expect(score([
            melody([ 54, 56, 58 ]),
            melody([ 54, 60, 58 ])
        ]).withChordsCombined()).toStrictEqual(score([
            melody([ 
                { pitch: [ 54, 54 ], duration: 16, velocity: 64, at: 0 },
                { pitch: [ 56, 60 ], duration: 16, velocity: 64, at: 16 },
                { pitch: [ 58, 58 ], duration: 16, velocity: 64, at: 32 }
            ])
        ]));
    });
});

describe('Score.toMidiBytes()/.writeMidi()/.toHash()/.expectHash()/.toDataURI() tests', () => {
    describe('should throw if ticks_per_quarter is invalid', () => {
        expect(() => score([], { ticks_per_quarter: 65536 }).toMidiBytes()).toThrow();
    });

    const table: [ string, Score, string, number[], string ][] = [
        [
            'a score with no tracks',
            score([]),
            '54494bd9650d7afe616cbe7c1a3ed0ff',
            [77,84,104,100,0,0,0,6,0,1,0,0,0,192],
            'data:audio/midi;base64,TVRoZAAAAAYAAQAAAMA='
        ],
        [
            'a score with no tracks and one MetaEvent ignores that MetaEvent',
            score([]).withNewEvent('sustain', 1),
            '54494bd9650d7afe616cbe7c1a3ed0ff',
            [77,84,104,100,0,0,0,6,0,1,0,0,0,192],
            'data:audio/midi;base64,TVRoZAAAAAYAAQAAAMA='
        ],
        [
            'a score with an empty track',
            score([ T0 ]),
            '6a614850f0493b0cbff25166f12dc7e2',
            [77,84,104,100,0,0,0,6,0,1,0,1,0,192,77,84,114,107,0,0,0,4,0,255,47,0],
            'data:audio/midi;base64,TVRoZAAAAAYAAQABAMBNVHJrAAAABAD/LwA='
        ],
        [
            'a score with an empty track and one MetaEvent, with a non-default ticks per quarter value',
            score([ T0 ], { ticks_per_quarter: 128 }).withNewEvent('sustain', 1),
            'b30e8fda9dcc60c8ca977933017b0724',
            [77,84,104,100,0,0,0,6,0,1,0,1,0,128,77,84,114,107,0,0,0,8,0,176,64,127,0,255,47,0],
            'data:audio/midi;base64,TVRoZAAAAAYAAQABAIBNVHJrAAAACACwQH8A/y8A'
        ],
        [
            'a score with an empty track and two MetaEvents',
            score([ T0 ]).withNewEvent('sustain', 1).withNewEvent('sustain', 0, { at: 64 }),
            '065893a83b030ef50680543703e037cb',
            [77,84,104,100,0,0,0,6,0,1,0,1,0,192,77,84,114,107,0,0,0,12,0,176,64,127,64,176,64,0,0,255,47,0],
            'data:audio/midi;base64,TVRoZAAAAAYAAQABAMBNVHJrAAAADACwQH9AsEAAAP8vAA=='
        ],
        [
            'a score with a non-empty track',
            score([ T1 ]),
            '8e83e4d241556f9e1cb17ac1599a7cc9',
            [77,84,104,100,0,0,0,6,0,1,0,1,0,192,77,84,114,107,0,0,0,12,0,144,60,50,8,128,60,50,0,255,47,0],
            'data:audio/midi;base64,TVRoZAAAAAYAAQABAMBNVHJrAAAADACQPDIIgDwyAP8vAA=='
        ],
        [
            'a score with a non-empty track and a MetaEvent',
            score([ T1 ]).withNewEvent('sustain', 1),
            '0805c67d36c396034e9aac911561059a',
            [77,84,104,100,0,0,0,6,0,1,0,1,0,192,77,84,114,107,0,0,0,16,0,176,64,127,0,144,60,50,8,128,60,50,0,255,47,0],
            'data:audio/midi;base64,TVRoZAAAAAYAAQABAMBNVHJrAAAAEACwQH8AkDwyCIA8MgD/LwA='
        ],
        [
            'a score with two non-empty tracks',
            score([ T1, T2 ]),
            'c4b66a0ff18e6dcdcfd63295d04b8d4f',
            [77,84,104,100,0,0,0,6,0,1,0,2,0,192,77,84,114,107,0,0,0,12,0,144,60,50,8,128,60,50,0,255,47,0,77,84,114,107,0,0,0,20,0,144,64,45,4,128,64,45,0,144,52,40,4,128,52,40,0,255,47,0],
            'data:audio/midi;base64,TVRoZAAAAAYAAQACAMBNVHJrAAAADACQPDIIgDwyAP8vAE1UcmsAAAAUAJBALQSAQC0AkDQoBIA0KAD/LwA='
        ],
        [
            'a score with two non-empty tracks and a MetaEvent',
            score([ T1, T2 ]).withNewEvent('sustain', 1),
            '388fd7d7de0515c5b0662e57014b5cfd',
            [77,84,104,100,0,0,0,6,0,1,0,2,0,192,77,84,114,107,0,0,0,16,0,176,64,127,0,144,60,50,8,128,60,50,0,255,47,0,77,84,114,107,0,0,0,20,0,144,64,45,4,128,64,45,0,144,52,40,4,128,52,40,0,255,47,0],
            'data:audio/midi;base64,TVRoZAAAAAYAAQACAMBNVHJrAAAAEACwQH8AkDwyCIA8MgD/LwBNVHJrAAAAFACQQC0EgEAtAJA0KASANCgA/y8A'
        ],
        [
            'a score with two empty tracks and metadata only applies metadata to first track',
            score([ T0, T0 ]).withCopyright('boop').withTrackName('test track').withKeySignature('C').withTimeSignature('9/8').withTempo(144),
            '0db8d161fdb51628ff490833615b2861',
            [77,84,104,100,0,0,0,6,0,1,0,2,0,192,77,84,114,107,0,0,0,47,0,255,2,4,98,111,111,112,0,255,3,10,116,101,115,116,32,116,114,97,99,107,0,255,88,4,9,3,24,8,0,255,89,2,0,0,0,255,81,3,6,91,155,0,255,47,0,77,84,114,107,0,0,0,4,0,255,47,0],
            'data:audio/midi;base64,TVRoZAAAAAYAAQACAMBNVHJrAAAALwD/AgRib29wAP8DCnRlc3QgdHJhY2sA/1gECQMYCAD/WQIAAAD/UQMGW5sA/y8ATVRyawAAAAQA/y8A'
        ],
        [
            'an identical case but with metadata applied to first track instead of score',
            score([ T0.withCopyright('boop').withTrackName('test track').withKeySignature('C').withTimeSignature('9/8').withTempo(144), T0 ]),
            '0db8d161fdb51628ff490833615b2861',
            [77,84,104,100,0,0,0,6,0,1,0,2,0,192,77,84,114,107,0,0,0,47,0,255,2,4,98,111,111,112,0,255,3,10,116,101,115,116,32,116,114,97,99,107,0,255,88,4,9,3,24,8,0,255,89,2,0,0,0,255,81,3,6,91,155,0,255,47,0,77,84,114,107,0,0,0,4,0,255,47,0],
            'data:audio/midi;base64,TVRoZAAAAAYAAQACAMBNVHJrAAAALwD/AgRib29wAP8DCnRlc3QgdHJhY2sA/1gECQMYCAD/WQIAAAD/UQMGW5sA/y8ATVRyawAAAAQA/y8A'
        ],
    ];

    beforeAll(() => jest.spyOn(fs, 'writeFileSync').mockImplementation());
    afterAll(() => jest.restoreAllMocks());

    describe.each(table)('%s', (_, score, hash, bytes, uri) => {
        test('toHash() returns correctly', () => {
            expect(score.toHash()).toStrictEqual(hash);
        });

        test('toMidiBytes() returns correctly', () => {
            expect(score.toMidiBytes()).toStrictEqual(bytes);
        });

        test('writeMidi() fails with invalid argument', () => {
            expect(() => score.writeMidi(60 as unknown as string)).toThrow();
        });

        test('toDataURI() returns correctly', () => {
            expect(score.toDataURI()).toStrictEqual(uri);
        });

        test('writeMidi() returns score and calls fs.writeFileSync() with expected arguments', () => {
            const base = __filename + Date.now();
            const midi = base + '.mid';

            expect(score.writeMidi(base)).toBe(score);
            expect(fs.writeFileSync).toHaveBeenLastCalledWith(midi, Buffer.from(bytes));
        });

        test('expectHash() does not throw with correct argument but does with wrong argument', () => {
            expect(() => score.expectHash(hash)).not.toThrow();
            expect(() => score.expectHash('1' + hash)).toThrow();
        });
    });
});

describe('Score.writeNotesSVG() tests', () => {
    beforeAll(() => jest.spyOn(fs, 'writeFileSync').mockImplementation());
    afterAll(() => jest.restoreAllMocks());

    const S0 = score([]);
    const S1 = score([ T2 ]);
    const S2 = score([
        melody([ { pitch: [ 64 ], duration: 32, velocity: 80 }, { pitch: [], duration: 32, velocity: 60 }, { pitch: [ 60, 68 ], duration: 64, velocity: 60, offset: 64 }]),
        melody([ { pitch: [ 26, 29 ], duration: 64, velocity: 80 }, { pitch: [ 33 ], duration: 64, velocity: 60 }, { pitch: [ 30, 32 ], duration: 96, velocity: 60 }]),
    ]).withTicksPerQuarter(128);

    const opts = { px_horiz: 24, px_vert: 12 };
    test('writeNotesSVG() fails with invalid argument', () => {
        expect(() => S0.writeNotesSVG(60 as unknown as string, opts)).toThrow();
    });

    test('generates appropriate canvas with empty score', () => {
        const base = __filename + Date.now();
        const filename = base + '.svg';

        expect(S0.writeNotesSVG(base, opts)).toBe(S0);
        expect(fs.writeFileSync).toHaveBeenLastCalledWith(filename, `<svg id="notes_svg" viewbox=\"0,0,0,0\" width=\"0\" height=\"0\" xmlns=\"http://www.w3.org/2000/svg\" style=\"border:1px solid black; background: black\">
  <style>
    text {
      font-family: \"Arial\";
      font-size: 12px;
    }

    line {
      stroke-width: 1;
      stroke: #404040;
    }
  </style>
</svg>
`);
    });

    test('writeNotesSVG() returns score and calls fs.writeFileSync() with expected arguments', () => {
        const base = __filename + Date.now();
        const filename = base + '.svg';

        expect(S1.writeNotesSVG(base, opts)).toBe(S1);
        expect(fs.writeFileSync).toHaveBeenLastCalledWith(filename, `<svg id="notes_svg" viewbox="0,0,240,166" width="240" height="166" xmlns="http://www.w3.org/2000/svg" style="border:1px solid black; background: black">
  <style>
    text {
      font-family: "Arial";
      font-size: 12px;
    }

    line {
      stroke-width: 1;
      stroke: #404040;
    }
  </style>
  <rect x="0" y="70" width="240" height="144" fill="#101010" />
  <rect x="0" y="214" width="240" height="144" fill="#000000" />
  <text x="2" y="165" fill="#E080E0">E₃</text>
  <text x="2" y="153" fill="#80E0E0">F₃</text>
  <text x="2" y="141" fill="#E02020">F#₃</text>
  <text x="2" y="129" fill="#20E080">G₃</text>
  <text x="2" y="117" fill="#2080E0">G#₃</text>
  <text x="2" y="105" fill="#E0E020">A₃</text>
  <text x="2" y="93" fill="#E020E0">A#₃</text>
  <text x="2" y="81" fill="#20E0E0">B₃</text>
  <text x="2" y="69" fill="#E08080">C₄</text>
  <text x="2" y="57" fill="#80E080">C#₄</text>
  <text x="2" y="45" fill="#8080E0">D₄</text>
  <text x="2" y="33" fill="#E0E080">D#₄</text>
  <text x="2" y="21" fill="#E080E0">E₄</text>
  <text x="0" y="10" fill="#C0C0C0">Notes</text>
  <rect x="16" y="10" width="96" height="12" fill="#E080E0" stroke="#E080E0" stroke-width="0" />
  <rect x="112" y="154" width="96" height="12" fill="#E080E0" stroke="#E080E0" stroke-width="0" />
</svg>
`);
    });

    test('generates SVG with fallback rules, defined pixels and padding', () => {
        const base = __filename + Date.now();
        const filename = base + '.svg';

        expect(S2.writeNotesSVG(base, { value_rule: 'default', color_rule: 'default', px_horiz: 2, px_vert: 12, leftpad: 26, rightpad: 16, header: 'fallback' })).toBe(S2);
        expect(fs.writeFileSync).toHaveBeenLastCalledWith(filename, `<svg id="notes_svg" viewbox=\"0,0,492,526\" width=\"492\" height=\"526\" xmlns=\"http://www.w3.org/2000/svg\" style=\"border:1px solid black; background: black\">
  <style>
    text {
      font-family: \"Arial\";
      font-size: 12px;
    }

    line {
      stroke-width: 1;
      stroke: #404040;
    }
  </style>
  <rect x="0" y="406" width="492" height="144" fill="#101010" />
  <rect x="0" y="550" width="492" height="144" fill="#000000" />
  <rect x="0" y="118" width="492" height="144" fill="#101010" />
  <rect x="0" y="262" width="492" height="144" fill="#000000" />
  <text x="2" y="525" fill="#C0C0C0">26</text>
  <text x="2" y="513" fill="#C0C0C0">27</text>
  <text x="2" y="501" fill="#C0C0C0">28</text>
  <text x="2" y="489" fill="#C0C0C0">29</text>
  <text x="2" y="477" fill="#C0C0C0">30</text>
  <text x="2" y="465" fill="#C0C0C0">31</text>
  <text x="2" y="453" fill="#C0C0C0">32</text>
  <text x="2" y="441" fill="#C0C0C0">33</text>
  <text x="2" y="429" fill="#C0C0C0">34</text>
  <text x="2" y="417" fill="#C0C0C0">35</text>
  <text x="2" y="405" fill="#C0C0C0">36</text>
  <text x="2" y="393" fill="#C0C0C0">37</text>
  <text x="2" y="381" fill="#C0C0C0">38</text>
  <text x="2" y="369" fill="#C0C0C0">39</text>
  <text x="2" y="357" fill="#C0C0C0">40</text>
  <text x="2" y="345" fill="#C0C0C0">41</text>
  <text x="2" y="333" fill="#C0C0C0">42</text>
  <text x="2" y="321" fill="#C0C0C0">43</text>
  <text x="2" y="309" fill="#C0C0C0">44</text>
  <text x="2" y="297" fill="#C0C0C0">45</text>
  <text x="2" y="285" fill="#C0C0C0">46</text>
  <text x="2" y="273" fill="#C0C0C0">47</text>
  <text x="2" y="261" fill="#C0C0C0">48</text>
  <text x="2" y="249" fill="#C0C0C0">49</text>
  <text x="2" y="237" fill="#C0C0C0">50</text>
  <text x="2" y="225" fill="#C0C0C0">51</text>
  <text x="2" y="213" fill="#C0C0C0">52</text>
  <text x="2" y="201" fill="#C0C0C0">53</text>
  <text x="2" y="189" fill="#C0C0C0">54</text>
  <text x="2" y="177" fill="#C0C0C0">55</text>
  <text x="2" y="165" fill="#C0C0C0">56</text>
  <text x="2" y="153" fill="#C0C0C0">57</text>
  <text x="2" y="141" fill="#C0C0C0">58</text>
  <text x="2" y="129" fill="#C0C0C0">59</text>
  <text x="2" y="117" fill="#C0C0C0">60</text>
  <text x="2" y="105" fill="#C0C0C0">61</text>
  <text x="2" y="93" fill="#C0C0C0">62</text>
  <text x="2" y="81" fill="#C0C0C0">63</text>
  <text x="2" y="69" fill="#C0C0C0">64</text>
  <text x="2" y="57" fill="#C0C0C0">65</text>
  <text x="2" y="45" fill="#C0C0C0">66</text>
  <text x="2" y="33" fill="#C0C0C0">67</text>
  <text x="2" y="21" fill="#C0C0C0">68</text>
  <text x="0" y="10" fill="#C0C0C0">fallback</text>
  <rect x="26" y="514" width="64" height="12" fill="#C0C0C0" stroke="#C0C0C0" stroke-width="0" />
  <rect x="26" y="478" width="64" height="12" fill="#C0C0C0" stroke="#C0C0C0" stroke-width="0" />
  <rect x="26" y="58" width="64" height="12" fill="#C0C0C0" stroke="#C0C0C0" stroke-width="0" />
  <rect x="90" y="514" width="64" height="12" fill="#C0C0C0" stroke="#C0C0C0" stroke-width="0" />
  <rect x="90" y="478" width="64" height="12" fill="#C0C0C0" stroke="#C0C0C0" stroke-width="0" />
  <rect x="154" y="430" width="128" height="12" fill="#C0C0C0" stroke="#C0C0C0" stroke-width="0" />
  <rect x="282" y="466" width="128" height="12" fill="#C0C0C0" stroke="#C0C0C0" stroke-width="0" />
  <rect x="282" y="442" width="128" height="12" fill="#C0C0C0" stroke="#C0C0C0" stroke-width="0" />
  <rect x="282" y="106" width="128" height="12" fill="#C0C0C0" stroke="#C0C0C0" stroke-width="0" />
  <rect x="282" y="10" width="128" height="12" fill="#C0C0C0" stroke="#C0C0C0" stroke-width="0" />
  <rect x="410" y="466" width="64" height="12" fill="#C0C0C0" stroke="#C0C0C0" stroke-width="0" />
  <rect x="410" y="442" width="64" height="12" fill="#C0C0C0" stroke="#C0C0C0" stroke-width="0" />
</svg>
`);
    });

    test('generates appropriate canvas with various options included', () => {
        const base = __filename + Date.now();
        const filename = base + '.svg';
        const modified = S2.withTicksPerQuarter(32).withTimeSignature('1/4');

        expect(modified.writeNotesSVG(base, { width: 640, height: 215, px_lines: 80, sub_lines: 2, value_rule: 'gamut', id: 'this1' })).toBe(modified);
        expect(fs.writeFileSync).toHaveBeenLastCalledWith(filename, `<svg id="this1" viewbox=\"0,0,664,235\" width=\"664\" height=\"235\" xmlns=\"http://www.w3.org/2000/svg\" style=\"border:1px solid black; background: black\">
  <style>
    text {
      font-family: \"Arial\";
      font-size: 12px;
    }

    line {
      stroke-width: 1;
      stroke: #404040;
    }
  </style>
  <rect x="0" y="175" width="664" height="60" fill="#101010" />
  <rect x="0" y="235" width="664" height="60" fill="#000000" />
  <rect x="0" y="55" width="664" height="60" fill="#101010" />
  <rect x="0" y="115" width="664" height="60" fill="#000000" />
  <text x="2" y="227.5" fill="#8080E0">D</text>
  <text x="642" y="227.5" fill="#8080E0">D</text>
  <text x="2" y="217.5" fill="#E080E0">E</text>
  <text x="642" y="217.5" fill="#E080E0">E</text>
  <text x="2" y="207.5" fill="#E02020">F#</text>
  <text x="642" y="207.5" fill="#E02020">F#</text>
  <text x="2" y="197.5" fill="#2080E0">G#</text>
  <text x="642" y="197.5" fill="#2080E0">G#</text>
  <text x="2" y="187.5" fill="#E020E0">A#</text>
  <text x="642" y="187.5" fill="#E020E0">A#</text>
  <text x="2" y="177.5" fill="#E08080">C</text>
  <text x="642" y="177.5" fill="#E08080">C</text>
  <text x="2" y="167.5" fill="#8080E0">D</text>
  <text x="642" y="167.5" fill="#8080E0">D</text>
  <text x="2" y="157.5" fill="#E080E0">E</text>
  <text x="642" y="157.5" fill="#E080E0">E</text>
  <text x="2" y="147.5" fill="#E02020">F#</text>
  <text x="642" y="147.5" fill="#E02020">F#</text>
  <text x="2" y="137.5" fill="#2080E0">G#</text>
  <text x="642" y="137.5" fill="#2080E0">G#</text>
  <text x="2" y="127.5" fill="#E020E0">A#</text>
  <text x="642" y="127.5" fill="#E020E0">A#</text>
  <text x="2" y="117.5" fill="#E08080">C</text>
  <text x="642" y="117.5" fill="#E08080">C</text>
  <text x="2" y="107.5" fill="#8080E0">D</text>
  <text x="642" y="107.5" fill="#8080E0">D</text>
  <text x="2" y="97.5" fill="#E080E0">E</text>
  <text x="642" y="97.5" fill="#E080E0">E</text>
  <text x="2" y="87.5" fill="#E02020">F#</text>
  <text x="642" y="87.5" fill="#E02020">F#</text>
  <text x="2" y="77.5" fill="#2080E0">G#</text>
  <text x="642" y="77.5" fill="#2080E0">G#</text>
  <text x="2" y="67.5" fill="#E020E0">A#</text>
  <text x="642" y="67.5" fill="#E020E0">A#</text>
  <text x="2" y="57.5" fill="#E08080">C</text>
  <text x="642" y="57.5" fill="#E08080">C</text>
  <text x="2" y="47.5" fill="#8080E0">D</text>
  <text x="642" y="47.5" fill="#8080E0">D</text>
  <text x="2" y="37.5" fill="#E080E0">E</text>
  <text x="642" y="37.5" fill="#E080E0">E</text>
  <text x="2" y="27.5" fill="#E02020">F#</text>
  <text x="642" y="27.5" fill="#E02020">F#</text>
  <text x="2" y="17.5" fill="#2080E0">G#</text>
  <text x="642" y="17.5" fill="#2080E0">G#</text>
  <line x1="57" y1="0" x2="57" y2="235" style="stroke:#202020" />
  <line x1="16" y1="0" x2="16" y2="235" />
  <text x="16" y="235" fill="#C0C0C0">1</text>
  <line x1="137" y1="0" x2="137" y2="235" style="stroke:#202020" />
  <line x1="96" y1="0" x2="96" y2="235" />
  <text x="96" y="235" fill="#C0C0C0">1</text>
  <text x="96" y="10" fill="#C0C0C0">1</text>
  <line x1="217" y1="0" x2="217" y2="235" style="stroke:#202020" />
  <line x1="176" y1="0" x2="176" y2="235" />
  <text x="176" y="235" fill="#C0C0C0">2</text>
  <text x="176" y="10" fill="#C0C0C0">2</text>
  <line x1="297" y1="0" x2="297" y2="235" style="stroke:#202020" />
  <line x1="256" y1="0" x2="256" y2="235" />
  <text x="256" y="235" fill="#C0C0C0">3</text>
  <text x="256" y="10" fill="#C0C0C0">3</text>
  <line x1="377" y1="0" x2="377" y2="235" style="stroke:#202020" />
  <line x1="336" y1="0" x2="336" y2="235" />
  <text x="336" y="235" fill="#C0C0C0">4</text>
  <text x="336" y="10" fill="#C0C0C0">4</text>
  <line x1="457" y1="0" x2="457" y2="235" style="stroke:#202020" />
  <line x1="416" y1="0" x2="416" y2="235" />
  <text x="416" y="235" fill="#C0C0C0">5</text>
  <text x="416" y="10" fill="#C0C0C0">5</text>
  <line x1="537" y1="0" x2="537" y2="235" style="stroke:#202020" />
  <line x1="496" y1="0" x2="496" y2="235" />
  <text x="496" y="235" fill="#C0C0C0">6</text>
  <text x="496" y="10" fill="#C0C0C0">6</text>
  <line x1="617" y1="0" x2="617" y2="235" style="stroke:#202020" />
  <line x1="576" y1="0" x2="576" y2="235" />
  <text x="576" y="235" fill="#C0C0C0"></text>
  <text x="576" y="10" fill="#C0C0C0"></text>
  <line x1="697" y1="0" x2="697" y2="235" style="stroke:#202020" />
  <line x1="656" y1="0" x2="656" y2="235" />
  <text x="656" y="235" fill="#C0C0C0"></text>
  <text x="656" y="10" fill="#C0C0C0"></text>
  <text x="0" y="10" fill="#C0C0C0">Notes</text>
  <rect x="16" y="220" width="92" height="5" fill="#8080E0" stroke="#8080E0" stroke-width="0" />
  <rect x="16" y="205" width="92" height="5" fill="#80E0E0" stroke="#80E0E0" stroke-width="0" />
  <rect x="16" y="30" width="92" height="5" fill="#E080E0" stroke="#E080E0" stroke-width="0" />
  <rect x="107" y="220" width="92" height="5" fill="#8080E0" stroke="#8080E0" stroke-width="0" />
  <rect x="107" y="205" width="92" height="5" fill="#80E0E0" stroke="#80E0E0" stroke-width="0" />
  <rect x="198" y="185" width="183" height="5" fill="#E0E020" stroke="#E0E020" stroke-width="0" />
  <rect x="380" y="200" width="183" height="5" fill="#E02020" stroke="#E02020" stroke-width="0" />
  <rect x="380" y="190" width="183" height="5" fill="#2080E0" stroke="#2080E0" stroke-width="0" />
  <rect x="380" y="50" width="183" height="5" fill="#E08080" stroke="#E08080" stroke-width="0" />
  <rect x="380" y="10" width="183" height="5" fill="#2080E0" stroke="#2080E0" stroke-width="0" />
  <rect x="562" y="200" width="92" height="5" fill="#E02020" stroke="#E02020" stroke-width="0" />
  <rect x="562" y="190" width="92" height="5" fill="#2080E0" stroke="#2080E0" stroke-width="0" />
</svg>
`);
    });
});

describe('Score.toCanvas()/.writeCanvas() tests', () => {
    const RENDER_T1 = 'tracks = [[{"tick":0,"pitch":[60],"duration":8,"velocity":50}]];';
    const RENDER_T2 = 'tracks = [[{"tick":0,"pitch":[64],"duration":4,"velocity":45},{"tick":4,"pitch":[52],"duration":4,"velocity":40}]];';
    const RENDER_T3 = 'tracks = [[{"tick":0,"pitch":[48],"duration":4,"velocity":44},{"tick":4,"pitch":[60],"duration":16,"velocity":46},{"tick":28,"pitch":[63],"duration":16,"velocity":48},{"tick":44,"pitch":[60],"duration":8,"velocity":50}]];';
    const RENDER_T12 = 'tracks = [[{"tick":0,"pitch":[60],"duration":8,"velocity":50}],[{"tick":0,"pitch":[64],"duration":4,"velocity":45},{"tick":4,"pitch":[52],"duration":4,"velocity":40}]];';
    const RENDER_T234 = 'tracks = [[],[{"tick":0,"pitch":[64],"duration":4,"velocity":45},{"tick":4,"pitch":[52],"duration":4,"velocity":40}],[{"tick":0,"pitch":[48],"duration":4,"velocity":44},{"tick":4,"pitch":[60],"duration":16,"velocity":46},{"tick":28,"pitch":[63],"duration":16,"velocity":48},{"tick":44,"pitch":[60],"duration":8,"velocity":50}],[{"tick":0,"pitch":[54,63],"duration":8,"velocity":63},{"tick":8,"pitch":[55,60],"duration":4,"velocity":56},{"tick":12,"pitch":[52,59],"duration":4,"velocity":58},{"tick":16,"pitch":[53,65],"duration":8,"velocity":63}]];';

    const table: [ string, Score, ScoreCanvasOpts | undefined, string[] ][] = [
        [
            'one track, no options passed',
            score([ T1 ]),
            undefined,
            [
                RENDER_T1,
                'min_p = 60;',
                'max_p = 60;',
                'end = 8;',
                'tgt_ht = 750',
                'min_wd = 2',
                'tgt_wd = 2500',
            ]
        ],
        [
            'one track, width option passed',
            score([ T2 ]),
            { wd: 5000 },
            [
                RENDER_T2,
                'min_p = 52;',
                'max_p = 64;',
                'end = 8;',
                'tgt_ht = 750',
                'tgt_wd = 5000',
                'min_wd = 2',
                'ticks_px = 0',
            ],
        ],
        [
            'one track, height and width per quarter options passed',
            score([ T3 ]),
            { ht: 500, wd_quarter: 8 },
            [
                RENDER_T3,
                'min_p = 48;',
                'max_p = 63;',
                'end = 52;',
                'tgt_ht = 500',
                'tgt_wd = 2500',
                'min_wd = 2',
                'ticks_px = 24',
                'ticks_sc = 192',
            ]
        ],
        [
            'one track, ticks per quarter set, height, width per quarter and width scale passed',
            score([ T3 ]).withTicksPerQuarter(128),
            { ht: 500, wd_quarter: 8, wd_scale: 4 },
            [
                RENDER_T3,
                'min_p = 48;',
                'max_p = 63;',
                'end = 52;',
                'tgt_ht = 500',
                'tgt_wd = 2500',
                'ticks_px = 16',
                'ticks_sc = 512',
            ]
        ],
        [
            'two tracks, minimum width passed',
            score([ T1, T2 ]),
            { wd_min: 4 },
            [
                RENDER_T12,
                'min_p = 52;',
                'max_p = 64;',
                'end = 8;',
                'tgt_ht = 750',
                'tgt_wd = 2500',
                'min_wd = 4',
                'ticks_px = 0',
            ]
        ],
        [
            'four tracks, height and width passed',
            score([ T0, T2, T3, T4 ]),
            { ht: 500, wd: 5000 },
            [
                RENDER_T234,
                'min_p = 48;',
                'max_p = 65;',
                'end = 52;',
                'tgt_ht = 500;',
                'tgt_wd = 5000',
                'min_wd = 2',
                'ticks_px = 0',
            ]
        ]
    ];

    beforeAll(() => jest.spyOn(fs, 'writeFileSync').mockImplementation());
    afterAll(() => jest.restoreAllMocks());

    describe.each(table)('%s', (_, score, opts, ret) => {
        const canvas = score.toCanvas(opts);

        test.each(ret)('canvas contains %s', s => {
            expect(canvas).toEqual(expect.stringContaining(s));
        });

        test('writeCanvas() fails with invalid argument', () => {
            expect(() => score.writeCanvas(60 as unknown as string)).toThrow();
        });

        test('writeCanvas() returns score and calls fs.writeFileSync() with expected arguments', () => {
            const base = __filename + Date.now();
            const html = base + '.html';

            expect(score.writeCanvas(base, opts)).toBe(score);
            expect(fs.writeFileSync).toHaveBeenLastCalledWith(html, score.toCanvas(opts));
        });
    });
});

// inherited from CollectionWithMetadata
describe('Score.describe', () => {
    test('describes as expected', () => {
        expect(score([ melody([ 1, [ 2, 3 ] ]) ], { tempo: 144 }).describe())
            .toStrictEqual(`Score(length=1,metadata=Metadata({tempo=144}))([
    0: Melody(length=2,metadata=Metadata({}))([
        0: MelodyMember({pitch:ChordSeqMember([1]),velocity:64,duration:16,at:undefined,offset:0,delay:0,before:MetaList(length=0)([]),after:MetaList(length=0)([])}),
        1: MelodyMember({pitch:ChordSeqMember([2,3]),velocity:64,duration:16,at:undefined,offset:0,delay:0,before:MetaList(length=0)([]),after:MetaList(length=0)([])}),
    ]),
])`);
    });
});