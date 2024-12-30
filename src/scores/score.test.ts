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