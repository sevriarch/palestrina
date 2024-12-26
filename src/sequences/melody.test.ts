import type { MapperFn, SeqIndices, MetaEventOpts, MetaEventArg } from '../types';

import type MelodyMember from './members/melody';

import Melody from './melody';
import MetaList from '../meta-events/meta-list';

import { melody, intseq, microtonalmelody } from '../factory';

describe('Melody creation', () => {
    const m = melody([1, 2, 3]);

    test('Melody.from() with melody argument and same validator returns same object', () => {
        expect(Melody.from(m)).toBe(m);
    });

    test('Melody.from() with melody argument and different validator returns different object with same contents', () => {
        const m2 = microtonalmelody(m);

        expect(m2).not.toBe(m);
        expect(m2.contents).toStrictEqual(m.contents);
    });

    test('Melody.from() taking contents from an intseq via factory', () => {
        expect(melody(intseq([1, 2, 3]))).toStrictEqual(melody([1, 2, 3]));
    });
});

describe('Melody.mapEachPitch()', () => {
    const is = melody([[1], [4, 0], [2], [3], [], [6, 7, 8]]);
    const fs = microtonalmelody([1, [4, 0], 2, 3, [], [6, 7, 8]]);

    test('throws when non-function passed', () => {
        expect(() => is.mapEachPitch(555 as unknown as MapperFn<number | null>)).toThrow();
    });

    test('throws when function returns non-numeric, non-null value', () => {
        expect(() => is.mapEachPitch(((v: number) => v > 1 ? v : 'test') as unknown as MapperFn<number | null>)).toThrow();
    });

    const table: [string, Melody, MapperFn<number | null>, Melody][] = [
        [
            'maps according to a integer function for an non-microtonal sequence',
            is,
            (p, i) => p as number * i,
            melody([[0], [4, 0], [4], [9], [], [30, 35, 40]]),
        ],
        [
            'maps according to a function for a floatseq',
            fs,
            (p, i) => p as number * i / 2,
            microtonalmelody([[0], [2, 0], [2], [4.5], [], [15, 17.5, 20]]),
        ],
        [
            'filters out when function returns null and retains metadata',
            is.withCopyright('test'),
            (p) => p as number % 2 ? p : null,
            melody([[1], [], [], [3], [], [7]]).withCopyright('test')
        ]
    ];

    test.each(table)('%s', (_, s, fn, ret) => {
        expect(s.mapEachPitch(fn)).toStrictEqual(ret);
    });
});

describe('Melody.keepTopPitches()', () => {
    const s = melody([[], { pitch: [1], duration: 100, velocity: 80 }, [2, 3], [4, 5, 6], [7, 8, 9, 10]]);

    test('throw if argument is not a non-negative integer', () => {
        expect(() => s.keepTopPitches(1.5)).toThrow();
        expect(() => s.keepTopPitches(-1)).toThrow();
        expect(() => s.keepTopPitches('-1' as unknown as number)).toThrow();
    });

    const table: [string, Melody, number, Melody][] = [
        ['empty sequence', melody([]), 1, melody([])],
        ['top zero pitches', s, 0, melody([[], { pitch: [], duration: 100, velocity: 80 }, [], [], []])],
        ['top one pitch', s, 1, melody([[], { pitch: [1], duration: 100, velocity: 80 }, [3], [6], [10]])],
        ['top three pitches', s, 3, melody([[], { pitch: [1], duration: 100, velocity: 80 }, [2, 3], [4, 5, 6], [8, 9, 10]])],
        ['top five pitches', s, 5, s],
    ];

    test.each(table)('works with %s', (_, s, n, ret) => {
        expect(s.keepTopPitches(n)).toStrictEqual(ret);
    });
});

describe('Melody.keepBottomPitches()', () => {
    const s = melody([[], { pitch: [1], duration: 100, velocity: 80 }, [2, 3], [4, 5, 6], [7, 8, 9, 10]]);

    test('throw if argument is not a non-negative integer', () => {
        expect(() => s.keepBottomPitches(1.5)).toThrow();
        expect(() => s.keepBottomPitches(-1)).toThrow();
        expect(() => s.keepBottomPitches('-1' as unknown as number)).toThrow();
    });

    const table: [string, Melody, number, Melody][] = [
        ['empty sequence', melody([]), 1, melody([])],
        ['bottom zero pitches', s, 0, melody([[], { pitch: [], duration: 100, velocity: 80 }, [], [], []])],
        ['bottom one pitch', s, 1, melody([[], { pitch: [1], duration: 100, velocity: 80 }, [2], [4], [7,]])],
        ['bottom three pitches', s, 3, melody([[], { pitch: [1], duration: 100, velocity: 80 }, [2, 3], [4, 5, 6], [7, 8, 9]])],
        ['bottom five pitches', s, 5, s],
    ];

    test.each(table)('works with %s', (_, s, n, ret) => {
        expect(s.keepBottomPitches(n)).toStrictEqual(ret);
    });
});

describe('Melody.toDuration()', () => {
    test('returns list of volumes', () => {
        expect(melody([
            { pitch: [60], duration: 8, velocity: 50 },
            { pitch: [61], duration: 16, velocity: 51 },
            { pitch: [63], duration: 16, velocity: 52 },
            { pitch: [64], duration: 8, velocity: 53 },
        ]).toDuration()).toStrictEqual([8, 16, 16, 8]);
    });
});

describe('Melody.withDuration()', () => {
    const m = melody([
        { pitch: [60], duration: 8, velocity: 50, },
        { pitch: [61], duration: 16, velocity: 51 },
        { pitch: [63], duration: 16, velocity: 52 },
        { pitch: [64], duration: 8, velocity: 53 },
    ]);

    test('fails if volume value invalid', () => {
        expect(() => m.withDuration(-1)).toThrow();
    });

    test('fails if length incorrect', () => {
        expect(() => m.withDuration([1, 2, 3])).toThrow();
        expect(() => m.withDuration(intseq([1, 2, 3, 4, 5]))).toThrow();
    });

    test('works for static volume value', () => {
        expect(m.withDuration(10)).toStrictEqual(melody([
            { pitch: [60], duration: 10, velocity: 50 },
            { pitch: [61], duration: 10, velocity: 51 },
            { pitch: [63], duration: 10, velocity: 52 },
            { pitch: [64], duration: 10, velocity: 53 },
        ]));
    });

    test('works for dynamic volume values', () => {
        expect(m.withDuration([4, 7, 10, 13])).toStrictEqual(melody([
            { pitch: [60], duration: 4, velocity: 50 },
            { pitch: [61], duration: 7, velocity: 51 },
            { pitch: [63], duration: 10, velocity: 52 },
            { pitch: [64], duration: 13, velocity: 53 },
        ]));
    });

    test('works with sequence passed as argument', () => {
        expect(m.withDuration([4, 7, 10, 13])).toStrictEqual(m.withDuration(intseq([4, 7, 10, 13])));
    });
});

describe('Melody.toVolume()', () => {
    test('returns list of volumes', () => {
        expect(melody([
            { pitch: [60], duration: 8, velocity: 50 },
            { pitch: [61], duration: 16, velocity: 51 },
            { pitch: [63], duration: 16, velocity: 52 },
            { pitch: [64], duration: 8, velocity: 53 },
        ]).toVolume()).toStrictEqual([50, 51, 52, 53]);
    });
});

describe('Melody.withVolume()', () => {
    const m = melody([
        { pitch: [60], duration: 8, velocity: 50, },
        { pitch: [61], duration: 16, velocity: 51 },
        { pitch: [63], duration: 16, velocity: 52 },
        { pitch: [64], duration: 8, velocity: 53 },
    ]);

    test('fails if volume value invalid', () => {
        expect(() => m.withVolume(-1)).toThrow();
    });

    test('fails if length incorrect', () => {
        expect(() => m.withVolume([1, 2, 3])).toThrow();
        expect(() => m.withVolume(intseq([1, 2, 3, 4, 5]))).toThrow();
    });

    test('works for static volume value', () => {
        expect(m.withVolume(10)).toStrictEqual(melody([
            { pitch: [60], duration: 8, velocity: 10 },
            { pitch: [61], duration: 16, velocity: 10 },
            { pitch: [63], duration: 16, velocity: 10 },
            { pitch: [64], duration: 8, velocity: 10 },
        ]));
    });

    test('works for dynamic volume values', () => {
        expect(m.withVolume([4, 7, 10, 13])).toStrictEqual(melody([
            { pitch: [60], duration: 8, velocity: 4 },
            { pitch: [61], duration: 16, velocity: 7 },
            { pitch: [63], duration: 16, velocity: 10 },
            { pitch: [64], duration: 8, velocity: 13 },
        ]));
    });

    test('works with sequence passed as argument', () => {
        expect(m.withVolume([4, 7, 10, 13])).toStrictEqual(m.withVolume(intseq([4, 7, 10, 13])));
    });
});

describe('Melody.toDelay()', () => {
    test('returns list of delays', () => {
        expect(melody([
            { pitch: [60], duration: 8, velocity: 50, delay: 4 },
            { pitch: [61], duration: 16, velocity: 51, delay: 7 },
            { pitch: [63], duration: 16, velocity: 52 },
            { pitch: [64], duration: 8, velocity: 53, delay: 13 },
        ]).toDelay()).toStrictEqual([4, 7, 0, 13]);
    });
});

describe('Melody.withDelay()', () => {
    const m = melody([
        { pitch: [60], duration: 8, velocity: 50, },
        { pitch: [61], duration: 16, velocity: 51 },
        { pitch: [63], delay: 64, duration: 16, velocity: 52 },
        { pitch: [64], duration: 8, velocity: 53 },
    ]);

    test('fails if delay value invalid', () => {
        expect(() => m.withDelay('-1' as unknown as number)).toThrow();
    });

    test('fails if length incorrect', () => {
        expect(() => m.withDelay([1, 2, 3])).toThrow();
        expect(() => m.withDelay(intseq([1, 2, 3, 4, 5]))).toThrow();
    });

    test('works for static delay value', () => {
        expect(m.withDelay(10)).toStrictEqual(melody([
            { pitch: [60], duration: 8, velocity: 50, delay: 10 },
            { pitch: [61], duration: 16, velocity: 51, delay: 10 },
            { pitch: [63], duration: 16, velocity: 52, delay: 10 },
            { pitch: [64], duration: 8, velocity: 53, delay: 10 },
        ]));
    });

    test('works for dynamic delay values', () => {
        expect(m.withDelay([4, 7, 10, 13])).toStrictEqual(melody([
            { pitch: [60], duration: 8, velocity: 50, delay: 4 },
            { pitch: [61], duration: 16, velocity: 51, delay: 7 },
            { pitch: [63], duration: 16, velocity: 52, delay: 10 },
            { pitch: [64], duration: 8, velocity: 53, delay: 13 },
        ]));
    });

    test('works with sequence passed as argument', () => {
        expect(m.withDelay([4, 7, 10, 13])).toStrictEqual(m.withDelay(intseq([4, 7, 10, 13])));
    });
});

describe('Melody.toOffset()', () => {
    test('returns list of offsets', () => {
        expect(melody([
            { pitch: [60], duration: 8, velocity: 50, offset: 4 },
            { pitch: [61], duration: 16, velocity: 51, offset: 7 },
            { pitch: [63], duration: 16, velocity: 52 },
            { pitch: [64], duration: 8, velocity: 53, offset: 13 },
        ]).toOffset()).toStrictEqual([4, 7, 0, 13]);
    });
});

describe('Melody.withOffset()', () => {
    const m = melody([
        { pitch: [60], duration: 8, velocity: 50, },
        { pitch: [61], duration: 16, velocity: 51 },
        { pitch: [63], offset: 64, duration: 16, velocity: 52 },
        { pitch: [64], duration: 8, velocity: 53 },
    ]);

    test('fails if offset value invalid', () => {
        expect(() => m.withOffset('-1' as unknown as number)).toThrow();
    });

    test('fails if length incorrect', () => {
        expect(() => m.withOffset([1, 2, 3])).toThrow();
        expect(() => m.withOffset(intseq([1, 2, 3, 4, 5]))).toThrow();
    });

    test('works for static offset value', () => {
        expect(m.withOffset(10)).toStrictEqual(melody([
            { pitch: [60], duration: 8, velocity: 50, offset: 10 },
            { pitch: [61], duration: 16, velocity: 51, offset: 10 },
            { pitch: [63], duration: 16, velocity: 52, offset: 10 },
            { pitch: [64], duration: 8, velocity: 53, offset: 10 },
        ]));
    });

    test('works for dynamic offset values', () => {
        expect(m.withOffset([4, 7, 10, 13])).toStrictEqual(melody([
            { pitch: [60], duration: 8, velocity: 50, offset: 4 },
            { pitch: [61], duration: 16, velocity: 51, offset: 7 },
            { pitch: [63], duration: 16, velocity: 52, offset: 10 },
            { pitch: [64], duration: 8, velocity: 53, offset: 13 },
        ]));
    });

    test('works with sequence passed as argument', () => {
        expect(m.withOffset([4, 7, 10, 13])).toStrictEqual(m.withOffset(intseq([4, 7, 10, 13])));
    });
});

describe('Melody.toExactTick()', () => {
    test('returns list of ticks', () => {
        expect(melody([
            { pitch: [60], duration: 8, velocity: 50, at: 4 },
            { pitch: [61], duration: 16, velocity: 51, at: 7 },
            { pitch: [63], duration: 16, velocity: 52 },
            { pitch: [64], duration: 8, velocity: 53, at: 13 },
        ]).toExactTick()).toStrictEqual([4, 7, undefined, 13]);
    });
});

describe('Melody.withExactTick()', () => {
    const m = melody([
        { pitch: [60], duration: 8, velocity: 50, },
        { pitch: [61], duration: 16, velocity: 51 },
        { pitch: [63], at: 64, duration: 16, velocity: 52 },
        { pitch: [64], duration: 8, velocity: 53 },
    ]);

    test('fails if tick value invalid', () => {
        expect(() => m.withExactTick(-1)).toThrow();
    });

    test('fails if length incorrect', () => {
        expect(() => m.withExactTick([1, 2, 3])).toThrow();
        expect(() => m.withExactTick(intseq([1, 2, 3, 4, 5]))).toThrow();
    });

    test('works for static tick value', () => {
        expect(m.withExactTick(10)).toStrictEqual(melody([
            { pitch: [60], duration: 8, velocity: 50, at: 10 },
            { pitch: [61], duration: 16, velocity: 51, at: 10 },
            { pitch: [63], duration: 16, velocity: 52, at: 10 },
            { pitch: [64], duration: 8, velocity: 53, at: 10 },
        ]));
    });

    test('works for dynamic tick values', () => {
        expect(m.withExactTick([4, 7, 10, 13])).toStrictEqual(melody([
            { pitch: [60], duration: 8, velocity: 50, at: 4 },
            { pitch: [61], duration: 16, velocity: 51, at: 7 },
            { pitch: [63], duration: 16, velocity: 52, at: 10 },
            { pitch: [64], duration: 8, velocity: 53, at: 13 },
        ]));
    });

    test('works with sequence passed as argument', () => {
        expect(m.withExactTick([4, 7, 10, 13])).toStrictEqual(m.withExactTick(intseq([4, 7, 10, 13])));
    });
});

describe('Melody.lastTick()', () => {
    test('last tick is zero for empty melody', () => {
        expect(melody([]).lastTick()).toEqual(0);
    });

    test('last tick is as expected without meta-events', () => {
        expect(melody([
            { pitch: [60], duration: 8, velocity: 50, },
            { pitch: [61], duration: 16, velocity: 51 },
            { pitch: [63], at: 64, duration: 16, velocity: 52 },
            { pitch: [64], duration: 8, velocity: 53 },
            { pitch: [66], at: 48, duration: 16, velocity: 54 },
            { pitch: [66], duration: 16, velocity: 55 },
        ]).lastTick()).toEqual(88);
    });

    test('last tick is as expected with before meta-event', () => {
        expect(melody([
            { pitch: [60], duration: 8, velocity: 50, },
            { pitch: [61], duration: 16, velocity: 51 },
            { pitch: [63], at: 64, duration: 16, velocity: 52 },
            { pitch: [64], duration: 8, velocity: 53 },
            { pitch: [66], at: 48, duration: 16, velocity: 54 },
            { pitch: [66], duration: 16, velocity: 55, before: [{ event: 'sustain', value: 0, offset: 32 }] },
        ]).lastTick()).toEqual(96);
    });

    test('last tick is as expected with after meta-event', () => {
        expect(melody([
            { pitch: [60], duration: 8, velocity: 50, },
            { pitch: [61], duration: 16, velocity: 51 },
            { pitch: [63], at: 64, duration: 16, velocity: 52 },
            { pitch: [64], duration: 8, velocity: 53 },
            { pitch: [66], at: 48, duration: 16, velocity: 54 },
            { pitch: [66], duration: 16, velocity: 55, after: [{ event: 'sustain', value: 0, offset: 32 }] },
        ]).lastTick()).toEqual(112);
    });
});

describe('Melody.toTicks()', () => {
    test('produces list of ticks as expected', () => {
        expect(melody([
            { pitch: [60], duration: 8, velocity: 50, },
            { pitch: [61], duration: 16, velocity: 51 },
            { pitch: [63], at: 64, duration: 16, velocity: 52 },
            { pitch: [64], duration: 8, velocity: 53 },
            { pitch: [66], at: 48, duration: 16, velocity: 54 },
            { pitch: [66], duration: 16, velocity: 55 },
        ]).toTicks()).toStrictEqual([0, 8, 64, 80, 48, 64]);
    });
});

describe('Melody.toSummary()', () => {
    test('produces summary as expected', () => {
        expect(melody([
            { pitch: [60], duration: 8, velocity: 50, },
            { pitch: [61], duration: 16, velocity: 51 },
            { pitch: [63], at: 64, duration: 16, velocity: 52 },
            { pitch: [64], duration: 8, velocity: 53 },
            { pitch: [66], at: 48, duration: 16, velocity: 54 },
            { pitch: [66], duration: 16, velocity: 55 },
        ]).toSummary()).toStrictEqual([
            { pitch: [60], tick: 0, duration: 8, velocity: 50, },
            { pitch: [61], tick: 8, duration: 16, velocity: 51 },
            { pitch: [63], tick: 64, duration: 16, velocity: 52 },
            { pitch: [64], tick: 80, duration: 8, velocity: 53 },
            { pitch: [66], tick: 48, duration: 16, velocity: 54 },
            { pitch: [66], tick: 64, duration: 16, velocity: 55 },
        ]);
    });
});

describe('Melody.toMidiTrack()', () => {
    const table: [string, Melody, number[]][] = [
        [
            'an empty melody',
            melody([]),
            [
                0x4d, 0x54, 0x72, 0x6b, // header
                0x00, 0x00, 0x00, 0x04, // length
                0x00, 0xff, 0x2f, 0x00 // end track
            ]
        ],
        [
            'a single note',
            melody([{ pitch: [64], duration: 128, velocity: 64 }]),
            [
                0x4d, 0x54, 0x72, 0x6b, // header
                0x00, 0x00, 0x00, 0x0d, // length
                0x00, 0x90, 0x40, 0x40, // note on
                0x81, 0x00, 0x80, 0x40, 0x40, // note off
                0x00, 0xff, 0x2f, 0x00 // end track
            ]
        ],
        [
            'a single note with two events before it',
            melody([
                {
                    pitch: [64],
                    duration: 128,
                    velocity: 64,
                    before: [{ event: 'tempo', value: 60 }, { event: 'time-signature', value: '2/4' }]
                }
            ]),
            [
                0x4d, 0x54, 0x72, 0x6b, // header
                0x00, 0x00, 0x00, 0x1c, // length
                0x00, 0xff, 0x51, 0x03, 0x0f, 0x42, 0x40, // time signature
                0x00, 0xff, 0x58, 0x04, 0x02, 0x02, 0x18, 0x08, // tempo
                0x00, 0x90, 0x40, 0x40, // note on
                0x81, 0x00, 0x80, 0x40, 0x40, // note off
                0x00, 0xff, 0x2f, 0x00 // end track
            ]
        ],
        [
            'a single note with an event after it',
            melody([{ pitch: [64], duration: 128, velocity: 64, after: [{ event: 'tempo', value: 60 }] }]),
            [
                0x4d, 0x54, 0x72, 0x6b, // header
                0x00, 0x00, 0x00, 0x14, // length
                0x00, 0x90, 0x40, 0x40, // note on
                0x81, 0x00, 0x80, 0x40, 0x40, // note off
                0x00, 0xff, 0x51, 0x03, 0x0f, 0x42, 0x40, // tempo
                0x00, 0xff, 0x2f, 0x00 // end track
            ]
        ],
        [
            'a chord with events before and after it',
            melody([
                {
                    pitch: [64, 68],
                    duration: 128,
                    velocity: 64,
                    before: [{ event: 'tempo', value: 144 }, { event: 'sustain', value: 1 }],
                    after: [{ event: 'tempo', value: 60 }, { event: 'sustain', value: 0 }]
                }
            ]),
            [
                0x4d, 0x54, 0x72, 0x6b, // header
                0x00, 0x00, 0x00, 0x2b, // length
                0x00, 0xff, 0x51, 0x03, 0x06, 0x5b, 0x9b, // tempo
                0x00, 0xb0, 0x40, 0x7f, // sustain on
                0x00, 0x90, 0x40, 0x40, // note on
                0x00, 0x90, 0x44, 0x40, // note on
                0x81, 0x00, 0x80, 0x40, 0x40, // note off
                0x00, 0x80, 0x44, 0x40, // note off
                0x00, 0xff, 0x51, 0x03, 0x0f, 0x42, 0x40, // tempo
                0x00, 0xb0, 0x40, 0x00, // sustain off
                0x00, 0xff, 0x2f, 0x00 // end track
            ]
        ],
        [
            'three notes with an event before the first and one after the last, both with an offset',
            melody([
                { pitch: [64], duration: 128, velocity: 64, before: [{ event: 'sustain', value: 1, offset: 32 }] },
                { pitch: [65], duration: 64, velocity: 63 },
                { pitch: [66], duration: 64, velocity: 62, after: [{ event: 'sustain', value: 0, offset: -32 }] },
            ]),
            [
                0x4d, 0x54, 0x72, 0x6b, // header
                0x00, 0x00, 0x00, 0x24, // length
                0x00, 0x90, 0x40, 0x40, // note on
                0x20, 0xb0, 0x40, 0x7f, // sustain on
                0x60, 0x80, 0x40, 0x40, // note off
                0x00, 0x90, 0x41, 0x3f, // note on
                0x40, 0x80, 0x41, 0x3f, // note off
                0x00, 0x90, 0x42, 0x3e, // note on
                0x20, 0xb0, 0x40, 0x00, // sustain off
                0x20, 0x80, 0x42, 0x3e, // note off
                0x00, 0xff, 0x2f, 0x00 // end track
            ]
        ],
        [
            'four notes, three of them microtonal',
            microtonalmelody([60.5, 59.75, 59, 58.25]),
            [
                0x4d, 0x54, 0x72, 0x6b, // header
                0x00, 0x00, 0x00, 0x3c, // length
                0x00, 0xe0, 0x00, 0x50, // pitch-bend
                0x00, 0x90, 0x3c, 0x40, // note-on
                0x0e, 0xe0, 0x00, 0x40, // undo pitch-bend
                0x02, 0x80, 0x3c, 0x40, // note-off
                0x00, 0xe0, 0x00, 0x58, // pitch-bend
                0x00, 0x90, 0x3b, 0x40, // note-on
                0x0e, 0xe0, 0x00, 0x40, // undo pitch-bend
                0x02, 0x80, 0x3b, 0x40, // note-off
                0x00, 0x90, 0x3b, 0x40, // note-on
                0x10, 0x80, 0x3b, 0x40, // note-off
                0x00, 0xe0, 0x00, 0x48, // pitch-bend
                0x00, 0x90, 0x3a, 0x40, // note-on
                0x0e, 0xe0, 0x00, 0x40, // undo pitch-bend
                0x02, 0x80, 0x3a, 0x40, // note-off
                0x00, 0xff, 0x2f, 0x00, // end-track
            ]
        ],
    ];

    test.each(table)('%s', (_, m, ret) => {
        expect(m.toMidiTrack()).toStrictEqual(ret);
    });
});

describe('Melody.joinRepeats()', () => {
    test('joins as expected', () => {
        expect(melody([
            { pitch: [60], duration: 8, velocity: 50 },
            { pitch: [61], duration: 16, velocity: 51 },
            { pitch: [63], duration: 16, velocity: 52 },
            { pitch: [64], duration: 8, velocity: 53 },
            { pitch: [66], duration: 16, velocity: 54 },
            { pitch: [66], duration: 16, velocity: 55 },
            { pitch: [66], duration: 8, velocity: 56 },
            { pitch: [65], duration: 8, velocity: 57 }
        ]).joinRepeats()).toStrictEqual(melody([
            { pitch: [60], duration: 8, velocity: 50 },
            { pitch: [61], duration: 16, velocity: 51 },
            { pitch: [63], duration: 16, velocity: 52 },
            { pitch: [64], duration: 8, velocity: 53 },
            { pitch: [66], duration: 40, velocity: 54 },
            { pitch: [65], duration: 8, velocity: 57 }
        ]));
    });
});

describe('Melody.joinIf()', () => {
    test('throws if function is not a function', () => {
        expect(() => melody([]).joinIf(0 as unknown as (a: MelodyMember, b: MelodyMember) => boolean)).toThrow();
    });

    test('joins as expected', () => {
        expect(melody([
            { pitch: [60], duration: 8, velocity: 50 },
            { pitch: [61], duration: 16, velocity: 51 },
            { pitch: [63], duration: 16, velocity: 52 },
            { pitch: [64], duration: 8, velocity: 53 },
            { pitch: [66], duration: 16, velocity: 54 },
            { pitch: [66], duration: 16, velocity: 55 },
            { pitch: [66], duration: 8, velocity: 56 },
            { pitch: [65], duration: 8, velocity: 57 }
        ]).joinIf((a, b) => a.pitch.equals(b.pitch) && a.duration === 16)).toStrictEqual(melody([
            { pitch: [60], duration: 8, velocity: 50 },
            { pitch: [61], duration: 16, velocity: 51 },
            { pitch: [63], duration: 16, velocity: 52 },
            { pitch: [64], duration: 8, velocity: 53 },
            { pitch: [66], duration: 32, velocity: 54 },
            { pitch: [66], duration: 8, velocity: 56 },
            { pitch: [65], duration: 8, velocity: 57 }
        ]));
    });
});

describe('Melody.augmentRhythm()', () => {
    const s = melody([
        { pitch: [60], duration: 100, velocity: 60, before: [{ event: 'sustain', value: 1, offset: 50 }] },
        { pitch: [61, 64], duration: 50, velocity: 50, at: 100 },
        { pitch: [66], duration: 50, velocity: 60, delay: 50 },
        { pitch: [69], duration: 150, velocity: 50, at: 40 },
        { pitch: [72], duration: 100, velocity: 60, after: [{ event: 'sustain', value: 0, at: 600 }] },
    ]);

    test('throws if argument is not a non-negative number', () => {
        expect(() => s.augmentRhythm(-1)).toThrow();
    });

    test('throws if would generate non-integer values', () => {
        expect(() => s.augmentRhythm(0.001)).toThrow();
    });

    test('reduces durations, offsets and delays', () => {
        expect(s.augmentRhythm(0.5)).toStrictEqual(melody([
            { pitch: [60], duration: 50, velocity: 60, before: [{ event: 'sustain', value: 1, offset: 25 }] },
            { pitch: [61, 64], duration: 25, velocity: 50, at: 50 },
            { pitch: [66], duration: 25, velocity: 60, delay: 25 },
            { pitch: [69], duration: 75, velocity: 50, at: 20 },
            { pitch: [72], duration: 50, velocity: 60, after: [{ event: 'sustain', value: 0, at: 300 }] },
        ]));
    });

    test('increases durations, offsets and delays', () => {
        expect(s.augmentRhythm(5)).toStrictEqual(melody([
            { pitch: [60], duration: 500, velocity: 60, before: [{ event: 'sustain', value: 1, offset: 250 }] },
            { pitch: [61, 64], duration: 250, velocity: 50, at: 500 },
            { pitch: [66], duration: 250, velocity: 60, delay: 250 },
            { pitch: [69], duration: 750, velocity: 50, at: 200 },
            { pitch: [72], duration: 500, velocity: 60, after: [{ event: 'sustain', value: 0, at: 3000 }] },
        ]));
    });
});

describe('Melody.diminishRhythm()', () => {
    const s = melody([
        { pitch: [60], duration: 100, velocity: 60, before: [{ event: 'sustain', value: 1, offset: 50 }] },
        { pitch: [61, 64], duration: 50, velocity: 50, at: 100 },
        { pitch: [66], duration: 50, velocity: 60, delay: 50 },
        { pitch: [69], duration: 150, velocity: 50, at: 40 },
        { pitch: [72], duration: 100, velocity: 60, after: [{ event: 'sustain', value: 0, at: 600 }] },
    ]);

    test('throws if argument is not a positive number', () => {
        expect(() => s.diminishRhythm(0)).toThrow();
    });

    test('throws if would generate non-integer values', () => {
        expect(() => s.diminishRhythm(1000)).toThrow();
    });

    test('reduces durations, offsets and delays', () => {
        expect(s.diminishRhythm(2)).toStrictEqual(melody([
            { pitch: [60], duration: 50, velocity: 60, before: [{ event: 'sustain', value: 1, offset: 25 }] },
            { pitch: [61, 64], duration: 25, velocity: 50, at: 50 },
            { pitch: [66], duration: 25, velocity: 60, delay: 25 },
            { pitch: [69], duration: 75, velocity: 50, at: 20 },
            { pitch: [72], duration: 50, velocity: 60, after: [{ event: 'sustain', value: 0, at: 300 }] },
        ]));
    });

    test('increases durations, offsets and delays', () => {
        expect(s.diminishRhythm(0.2)).toStrictEqual(melody([
            { pitch: [60], duration: 500, velocity: 60, before: [{ event: 'sustain', value: 1, offset: 250 }] },
            { pitch: [61, 64], duration: 250, velocity: 50, at: 500 },
            { pitch: [66], duration: 250, velocity: 60, delay: 250 },
            { pitch: [69], duration: 750, velocity: 50, at: 200 },
            { pitch: [72], duration: 500, velocity: 60, after: [{ event: 'sustain', value: 0, at: 3000 }] },
        ]));
    });
});

describe('Melody.withEventsBefore()', () => {
    test('adding two events using one-argument array form', () => {
        const s = melody([
            { pitch: [50], duration: 100, velocity: 80 },
            { pitch: [60], duration: 50, velocity: 80, delay: 50, before: [{ event: 'text', value: 'sustain down' }] },
            { pitch: [70], duration: 100, velocity: 80, delay: -50 },
            { pitch: [80], duration: 50, velocity: 80 }
        ]);
        const before: MetaEventArg[] = [{ event: 'sustain', value: 1 }, { event: 'sustain', value: 0, offset: 250 }];

        expect(s.withEventsBefore([1, -2], before)).toStrictEqual(melody([
            { pitch: [50], duration: 100, velocity: 80 },
            {
                pitch: [60], duration: 50, velocity: 80, delay: 50, before: [
                    { event: 'text', value: 'sustain down' },
                    { event: 'sustain', value: 1 },
                    { event: 'sustain', value: 0, offset: 250 },
                ]
            },
            {
                pitch: [70], duration: 100, velocity: 80, delay: -50, before: [
                    { event: 'sustain', value: 1 },
                    { event: 'sustain', value: 0, offset: 250 },
                ]
            },
            { pitch: [80], duration: 50, velocity: 80 },
        ]));
    });
});

describe('Melody.withEventsAfter()', () => {
    test('adding two events using one-argument array form', () => {
        const s = melody([
            { pitch: [50], duration: 100, velocity: 80 },
            { pitch: [60], duration: 50, velocity: 80, delay: 50, after: [{ event: 'text', value: 'sustain down' }] },
            { pitch: [70], duration: 100, velocity: 80, delay: -50 },
            { pitch: [80], duration: 50, velocity: 80 }
        ]);
        const after: MetaEventArg[] = [{ event: 'sustain', value: 1 }, { event: 'sustain', value: 0, offset: 250 }];

        expect(s.withEventsAfter([1, -2], after)).toStrictEqual(melody([
            { pitch: [50], duration: 100, velocity: 80 },
            {
                pitch: [60], duration: 50, velocity: 80, delay: 50, after: [
                    { event: 'text', value: 'sustain down' },
                    { event: 'sustain', value: 1 },
                    { event: 'sustain', value: 0, offset: 250 },
                ]
            },
            {
                pitch: [70], duration: 100, velocity: 80, delay: -50, after: [
                    { event: 'sustain', value: 1 },
                    { event: 'sustain', value: 0, offset: 250 },
                ]
            },
            { pitch: [80], duration: 50, velocity: 80 },
        ]));
    });
});

describe('Melody.withEventBefore()', () => {
    test('adding event using one-argument form', () => {
        const s = melody([
            { pitch: [50], duration: 100, velocity: 80 },
            { pitch: [60], duration: 50, velocity: 80, delay: 50 },
            { pitch: [70], duration: 100, velocity: 80, delay: -50 },
            { pitch: [80], duration: 50, velocity: 80 }
        ]);
        const before: MetaEventArg = { event: 'sustain', value: 1 };

        expect(s.withEventBefore(-1, before)).toStrictEqual(melody([
            { pitch: [50], duration: 100, velocity: 80 },
            { pitch: [60], duration: 50, velocity: 80, delay: 50 },
            { pitch: [70], duration: 100, velocity: 80, delay: -50 },
            { pitch: [80], duration: 50, velocity: 80, before: [before] },
        ]));
    });

    test('adding event using three-argument form', () => {
        const s = melody([
            { pitch: [50], duration: 100, velocity: 80 },
            { pitch: [60], duration: 50, velocity: 80, delay: 50 },
            { pitch: [70], duration: 100, velocity: 80, delay: -50 },
            { pitch: [80], duration: 50, velocity: 80 }
        ]);

        expect(s.withEventBefore(-1, 'sustain', 1, { offset: 100 })).toStrictEqual(melody([
            { pitch: [50], duration: 100, velocity: 80 },
            { pitch: [60], duration: 50, velocity: 80, delay: 50 },
            { pitch: [70], duration: 100, velocity: 80, delay: -50 },
            { pitch: [80], duration: 50, velocity: 80, before: [{ event: 'sustain', value: 1, offset: 100 }] },
        ]));
    });
});

describe('Melody.withEventAfter()', () => {
    test('adding event using one-argument form', () => {
        const s = melody([
            { pitch: [50], duration: 100, velocity: 80 },
            { pitch: [60], duration: 50, velocity: 80, delay: 50 },
            { pitch: [70], duration: 100, velocity: 80, delay: -50 },
            { pitch: [80], duration: 50, velocity: 80 }
        ]);
        const after: MetaEventArg = { event: 'sustain', value: 1 };

        expect(s.withEventAfter(-1, after)).toStrictEqual(melody([
            { pitch: [50], duration: 100, velocity: 80 },
            { pitch: [60], duration: 50, velocity: 80, delay: 50 },
            { pitch: [70], duration: 100, velocity: 80, delay: -50 },
            { pitch: [80], duration: 50, velocity: 80, after: [after] },
        ]));
    });

    test('adding event using three-argument form', () => {
        const s = melody([
            { pitch: [50], duration: 100, velocity: 80 },
            { pitch: [60], duration: 50, velocity: 80, delay: 50 },
            { pitch: [70], duration: 100, velocity: 80, delay: -50 },
            { pitch: [80], duration: 50, velocity: 80 }
        ]);

        expect(s.withEventAfter(-1, 'sustain', 1, { offset: 100 })).toStrictEqual(melody([
            { pitch: [50], duration: 100, velocity: 80 },
            { pitch: [60], duration: 50, velocity: 80, delay: 50 },
            { pitch: [70], duration: 100, velocity: 80, delay: -50 },
            { pitch: [80], duration: 50, velocity: 80, after: [{ event: 'sustain', value: 1, offset: 100 }] },
        ]));
    });
});

describe('Melody.addDelayAt()', () => {
    test('adding delays works whether or not there was one already present', () => {
        const s = melody([
            { pitch: [50], duration: 100, velocity: 80 },
            { pitch: [60], duration: 50, velocity: 80, delay: 50 },
            { pitch: [70], duration: 100, velocity: 80, delay: -50 },
            { pitch: [80], duration: 50, velocity: 80 }
        ]);

        expect(s.addDelayAt([1, -1], 100)).toStrictEqual(melody([
            { pitch: [50], duration: 100, velocity: 80 },
            { pitch: [60], duration: 50, velocity: 80, delay: 150 },
            { pitch: [70], duration: 100, velocity: 80, delay: -50 },
            { pitch: [80], duration: 50, velocity: 80, delay: 100 }
        ]));
    });
});

describe('Melody.addOffsetAt()', () => {
    test('adding offsets works whether or not there was one already present', () => {
        const s = melody([
            { pitch: [50], duration: 100, velocity: 80 },
            { pitch: [60], duration: 50, velocity: 80, offset: 50 },
            { pitch: [70], duration: 100, velocity: 80, offset: -50 },
            { pitch: [80], duration: 50, velocity: 80 }
        ]);

        expect(s.addOffsetAt([1, -1], 100)).toStrictEqual(melody([
            { pitch: [50], duration: 100, velocity: 80 },
            { pitch: [60], duration: 50, velocity: 80, offset: 150 },
            { pitch: [70], duration: 100, velocity: 80, offset: -50 },
            { pitch: [80], duration: 50, velocity: 80, offset: 100 }
        ]));
    });
});

describe('Melody.withExactTickAt()', () => {
    test('sets exact ticks works whether or not there was one already present', () => {
        const s = melody([
            { pitch: [50], duration: 100, velocity: 80 },
            { pitch: [60], duration: 50, velocity: 80, at: 50 },
            { pitch: [70], duration: 100, velocity: 80, at: 50 },
            { pitch: [80], duration: 50, velocity: 80 }
        ]);

        expect(s.withExactTickAt([1, -1], 100)).toStrictEqual(melody([
            { pitch: [50], duration: 100, velocity: 80 },
            { pitch: [60], duration: 50, velocity: 80, at: 100 },
            { pitch: [70], duration: 100, velocity: 80, at: 50 },
            { pitch: [80], duration: 50, velocity: 80, at: 100 }
        ]));
    });
});

describe('Melody.withDelayAt()', () => {
    test('adding delays works whether or not there was one already present', () => {
        const s = melody([
            { pitch: [50], duration: 100, velocity: 80 },
            { pitch: [60], duration: 50, velocity: 80, delay: 50 },
            { pitch: [70], duration: 100, velocity: 80, delay: -50 },
            { pitch: [80], duration: 50, velocity: 80 }
        ]);

        expect(s.withDelayAt([1, -1], 100)).toStrictEqual(melody([
            { pitch: [50], duration: 100, velocity: 80 },
            { pitch: [60], duration: 50, velocity: 80, delay: 100 },
            { pitch: [70], duration: 100, velocity: 80, delay: -50 },
            { pitch: [80], duration: 50, velocity: 80, delay: 100 }
        ]));
    });
});

describe('Melody.withOffsetAt()', () => {
    test('adding offsets works whether or not there was one already present', () => {
        const s = melody([
            { pitch: [50], duration: 100, velocity: 80 },
            { pitch: [60], duration: 50, velocity: 80, offset: 50 },
            { pitch: [70], duration: 100, velocity: 80, offset: -50 },
            { pitch: [80], duration: 50, velocity: 80 }
        ]);

        expect(s.withOffsetAt([1, -1], 100)).toStrictEqual(melody([
            { pitch: [50], duration: 100, velocity: 80 },
            { pitch: [60], duration: 50, velocity: 80, offset: 100 },
            { pitch: [70], duration: 100, velocity: 80, offset: -50 },
            { pitch: [80], duration: 50, velocity: 80, offset: 100 }
        ]));
    });
});

describe('Melody.withDurationAt()', () => {
    test('sets exact durations', () => {
        const s = melody([
            { pitch: [50], duration: 100, velocity: 80 },
            { pitch: [60], duration: 50, velocity: 80, at: 50 },
            { pitch: [70], duration: 100, velocity: 80, at: 50 },
            { pitch: [80], duration: 50, velocity: 80 }
        ]);

        expect(s.withDurationAt([1, -1], 150)).toStrictEqual(melody([
            { pitch: [50], duration: 100, velocity: 80 },
            { pitch: [60], duration: 150, velocity: 80, at: 50 },
            { pitch: [70], duration: 100, velocity: 80, at: 50 },
            { pitch: [80], duration: 150, velocity: 80 }
        ]));
    });
});

describe('Melody.withVolumeAt()', () => {
    test('sets exact volumes', () => {
        const s = melody([
            { pitch: [50], duration: 100, velocity: 80 },
            { pitch: [60], duration: 50, velocity: 80, at: 50 },
            { pitch: [70], duration: 100, velocity: 80, at: 50 },
            { pitch: [80], duration: 50, velocity: 80 }
        ]);

        expect(s.withVolumeAt([1, -1], 60)).toStrictEqual(melody([
            { pitch: [50], duration: 100, velocity: 80 },
            { pitch: [60], duration: 50, velocity: 60, at: 50 },
            { pitch: [70], duration: 100, velocity: 80, at: 50 },
            { pitch: [80], duration: 50, velocity: 60 }
        ]));
    });
});

describe('Melody.withStartTick()', () => {
    test('changing start tick changes undefined ticks in sequence', () => {
        const s = melody([{ pitch: [50], duration: 100, velocity: 80 }, { pitch: [60], duration: 50, velocity: 80, at: 50 }]);

        expect(s.withStartTick(100)).toStrictEqual(
            melody([{ pitch: [50], duration: 100, velocity: 80, at: 100 }, { pitch: [60], duration: 50, velocity: 80, at: 50 }])
        );
    });
});

describe('Melody.withTextBefore()', () => {
    const m = melody([60, 64, 67, 72]);

    const errortable: [string, SeqIndices, string, string | MetaEventOpts | undefined, MetaEventOpts | undefined][] = [
        ['invalid indices passed', '55' as unknown as SeqIndices, 'test text', 'text', undefined],
        ['invalid text passed', 0, 0 as unknown as string, 'text', undefined],
        ['invalid event type passed', 0, 'test text', 'test event', undefined],
        ['invalid opts in 2nd arg', 0, 'test text', { foo: 'bar' } as unknown as MetaEventOpts, undefined],
        ['invalid opts in 3rd arg', 0, 'test text', 'text', { foo: 'bar' } as unknown as MetaEventOpts],
    ];

    test.each(errortable)('throws when %s', (_, ix, txt, arg2, arg3) => {
        expect(() => m.withTextBefore(ix, txt, arg2, arg3)).toThrow();
    });

    const table: [string, SeqIndices, string, string | MetaEventOpts | undefined, MetaEventOpts | undefined, Melody][] = [
        [
            'single index passed with default text type and no options',
            0,
            'test text',
            undefined,
            undefined,
            melody([{ pitch: [60], before: MetaList.from([{ event: 'text', value: 'test text' }]) }, 64, 67, 72])
        ],
        [
            'default text type, options passed',
            [-1],
            'test text',
            { offset: 64 },
            undefined,
            melody([60, 64, 67, { pitch: [72], before: MetaList.from([{ event: 'text', value: 'test text', offset: 64 }]) }]),
        ],
        [
            'non default text type, no options passed',
            [-1, -2],
            'test text',
            'lyric',
            undefined,
            melody([
                60,
                64,
                { pitch: [67], before: MetaList.from([{ event: 'lyric', value: 'test text' }]) },
                { pitch: [72], before: MetaList.from([{ event: 'lyric', value: 'test text' }]) }
            ]),
        ],
        [
            'non default text type, options passed',
            intseq([-1]),
            'test text',
            'lyric',
            { at: 64 },
            melody([60, 64, 67, { pitch: [72], before: MetaList.from([{ event: 'lyric', value: 'test text', at: 64 }]) }]),
        ],
    ];

    test.each(table)('gives expecteed results when %s', (_, ix, txt, arg2, arg3, ret) => {
        expect(m.withTextBefore(ix, txt, arg2, arg3)).toStrictEqual(ret);
    });
});

describe('Melody.withTextAfter()', () => {
    const m = melody([60, 64, 67, 72]);

    const errortable: [string, SeqIndices, string, string | MetaEventOpts | undefined, MetaEventOpts | undefined][] = [
        ['invalid indices passed', '55' as unknown as SeqIndices, 'test text', 'text', undefined],
        ['invalid text passed', 0, 0 as unknown as string, 'text', undefined],
        ['invalid event type passed', 0, 'test text', 'test event', undefined],
        ['invalid opts in 2nd arg', 0, 'test text', { foo: 'bar' } as unknown as MetaEventOpts, undefined],
        ['invalid opts in 3rd arg', 0, 'test text', 'text', { foo: 'bar' } as unknown as MetaEventOpts],
    ];

    test.each(errortable)('throws when %s', (_, ix, txt, arg2, arg3) => {
        expect(() => m.withTextAfter(ix, txt, arg2, arg3)).toThrow();
    });

    const table: [string, SeqIndices, string, string | MetaEventOpts | undefined, MetaEventOpts | undefined, Melody][] = [
        [
            'single index passed with default text type and no options',
            0,
            'test text',
            undefined,
            undefined,
            melody([{ pitch: [60], after: MetaList.from([{ event: 'text', value: 'test text' }]) }, 64, 67, 72])
        ],
        [
            'default text type, options passed',
            [-1],
            'test text',
            { offset: 64 },
            undefined,
            melody([60, 64, 67, { pitch: [72], after: MetaList.from([{ event: 'text', value: 'test text', offset: 64 }]) }]),
        ],
        [
            'non default text type, no options passed',
            [-1, -2],
            'test text',
            'lyric',
            undefined,
            melody([
                60,
                64,
                { pitch: [67], after: MetaList.from([{ event: 'lyric', value: 'test text' }]) },
                { pitch: [72], after: MetaList.from([{ event: 'lyric', value: 'test text' }]) }
            ]),
        ],
        [
            'non default text type, options passed',
            intseq([-1]),
            'test text',
            'lyric',
            { at: 64 },
            melody([60, 64, 67, { pitch: [72], after: MetaList.from([{ event: 'lyric', value: 'test text', at: 64 }]) }]),
        ],
    ];

    test.each(table)('gives expecteed results when %s', (_, ix, txt, arg2, arg3, ret) => {
        expect(m.withTextAfter(ix, txt, arg2, arg3)).toStrictEqual(ret);
    });
});

// inherited from CollectionWithMetadata
describe('Melody.describe', () => {
    test('describes as expected', () => {
        expect(Melody.from([1, [2, 3]], { tempo: 144 }).describe())
            .toStrictEqual(`Melody(length=2,metadata=Metadata({tempo=144}))([
    0: MelodyMember({pitch:ChordSeqMember([1]),velocity:64,duration:16,at:undefined,offset:0,delay:0,before:MetaList(length=0)([]),after:MetaList(length=0)([])}),
    1: MelodyMember({pitch:ChordSeqMember([2,3]),velocity:64,duration:16,at:undefined,offset:0,delay:0,before:MetaList(length=0)([]),after:MetaList(length=0)([])}),
])`);
    });
});