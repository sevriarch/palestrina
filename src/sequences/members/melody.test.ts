import type { SeqMemberArgument, MelodyMemberArg, PitchArgument, MetaEventArg, MetaEventValue, MetaEventOpts, MetaListArg } from '../../types';

import NumSeqMember from './number';
import NoteSeqMember from './note';
import ChordSeqMember from './chord';
import MelodyMember from './melody';

import MetaList from '../../meta-events/meta-list';
import MetaEvent from '../../meta-events/meta-event';
import Timing from '../../timing/timing';
import { fromMidiBytes } from '../../helpers/key-signature';

type MelodyMemberPatcher = {
    pitch?: ChordSeqMember | number[],
    duration?: number,
    velocity?: number,
    delay?: number,
    offset?: number,
    at?: number,
    before?: MetaListArg,
    after?: MetaListArg,
};

function makeEventWithDefaults(ob: MelodyMemberPatcher) {
    const DEFAULTS = { pitch: [ 60 ], duration: 8, velocity: 64 };

    return MelodyMember.from({ ...DEFAULTS, ...ob });
}

const SUSTAIN_OFF: MetaEventArg = { event: 'sustain', value: 0 };
const META_SUSTAIN_OFF = MetaEvent.from(SUSTAIN_OFF);
const SUSTAIN_ON: MetaEventArg = { event: 'sustain', value: 1 };
const META_SUSTAIN_ON = MetaEvent.from(SUSTAIN_ON);
const END_TRACK: MetaEventArg = { event: 'end-track' };
const META_END_TRACK = MetaEvent.from(END_TRACK);

describe('MelodyMember.from() static method tests', () => {
    const errortable: [ string, SeqMemberArgument ][] = [
        [ 'a string', 'foobar' as unknown as SeqMemberArgument ],
        [ 'an array with a string', [ 'foobar '] as unknown as SeqMemberArgument ],
        [ 'an object containing an invalid pitch', { pitch: [ 'string' as unknown as number ], duration: 64, velocity: 64 } ],
    ];

    test.each(errortable)('creating from %s throws an error', (_, val) => {
        expect(() => MelodyMember.from(val)).toThrow();
    });

    // TODO: Fix these to check specific values
    const table: [ string, SeqMemberArgument, number[] ][] = [
        [ 'a null', null, [] ],
        [ 'a number', 5, [ 5 ] ],
        [ 'an array with zero members', [], [] ],
        [ 'an array with one member', [ 5 ], [ 5 ] ],
        [ 'an array with two members', [ 1, 5 ], [ 1, 5 ] ],
        [ 'a NumSeqMember', NumSeqMember.from(15), [ 15 ] ],
        [ 'a silent NoteSeqMember', NoteSeqMember.from(null), [] ],
        [ 'a non-silent NoteSeqMember', NoteSeqMember.from(5), [ 5 ] ],
        [ 'a silent ChordSeqMember', ChordSeqMember.from(null), [] ],
        [ 'a ChordSeqMember with one member', ChordSeqMember.from([ 15 ]), [ 15 ] ],
        [ 'a ChordSeqMember with two members', ChordSeqMember.from([ 1, 5 ]), [ 1, 5 ] ],
        [ 'a silent MelodyMember', MelodyMember.from(null), [] ],
        [ 'a MelodyMember with one member', MelodyMember.from([ 15 ]), [ 15 ] ],
        [ 'a MelodyMember with two members', MelodyMember.from([ 1, 5 ]), [ 1, 5 ] ],
        [ 'an object containing a pitch array with no members', { pitch: [], duration: 16, velocity: 64 }, [] ],
        [ 'an object containing a pitch array with one member', { pitch: [ 15 ], duration: 16, velocity: 64 }, [ 15 ] ],
        [ 'an object containing a pitch array with two members', { pitch: ChordSeqMember.from([ 1, 5 ]), duration: 16, velocity: 64 }, [ 1, 5 ] ],
        [ 'an object containing a silent ChordSeqMember', { pitch: ChordSeqMember.from(null), duration: 16, velocity: 64 }, [] ],
        [ 'an object containing a ChordSeqMember with one member', { pitch: ChordSeqMember.from([ 15 ]), duration: 16, velocity: 64 }, [ 15 ] ],
        [ 'an object containing a ChordSeqMember with two members', { pitch: ChordSeqMember.from([ 1, 5 ]), duration: 16, velocity: 64 }, [ 1, 5 ] ],
    ];

    test.each(table)('passing %s creates frozen MelodyMember as expected', (_, val, ret) => {
        const mm = MelodyMember.from(val);
        const cmp = MelodyMember.from(ret);

        expect(Object.isFrozen(mm)).toBe(true);
        expect(Object.isFrozen(mm['_val'])).toBe(true);

        const fields: (keyof MelodyMember)[] = [ 'pitch', 'duration', 'velocity', 'offset', 'at', 'delay', 'before', 'after' ];

        fields.forEach(v => expect(mm[v]).toStrictEqual(cmp[v]));
    });

    test('all parameters are passed on', () => {
        const data = {
            pitch: [ 5, 6, 7 ],
            duration: 36,
            velocity: 24,
            offset: 50,
            at: 45,
            delay: 40,
            before: [ META_SUSTAIN_ON ],
            after: [ META_SUSTAIN_OFF, META_END_TRACK ]
        };

        const mm = MelodyMember.from(data);
        expect(mm.pitch).toStrictEqual(ChordSeqMember.from([ 5, 6, 7 ]));
        expect(mm.duration).toBe(36);
        expect(mm.velocity).toBe(24);
        expect(mm.offset).toBe(50);
        expect(mm.at).toBe(45);
        expect(mm.delay).toBe(40);
        expect(mm.before).toStrictEqual(MetaList.from([ META_SUSTAIN_ON ]));
        expect(mm.after).toStrictEqual(MetaList.from([ META_SUSTAIN_OFF, META_END_TRACK ]));

        expect(mm.val()).toStrictEqual({
            pitch: ChordSeqMember.from([ 5, 6, 7 ]),
            timing: new Timing(45, 50, 40, 36),
            velocity: 24,
            before: MetaList.from([ META_SUSTAIN_ON ]),
            after: MetaList.from([ META_SUSTAIN_OFF, META_END_TRACK ]),
        });
    });
});

describe('MelodyMember constructor/.val() tests', () => {
    const EVENT_GOOD: MetaEvent = MetaEvent.from({ event: 'sustain', value: 1, offset: 0 });
    const EVENT_BAD = { event: 'sustain', value: 1, banana: true } as unknown as MetaEvent;

    const table: [ MelodyMemberArg, boolean ][] = [
        // Invalid argument format
        [ [ { pitch: [ 60 ], duration: 16, velocity: 16 } ] as unknown as MelodyMemberArg, false ],
        [ undefined as unknown as MelodyMemberArg, false ],

        // Missing required parameter
        [ { velocity: 16, duration: 16 } as unknown as MelodyMemberArg, false ],

        // Extra parameter
        [ { pitch: [ 60 ], duration: 16, velocity: 16, foo: 55 } as unknown as MelodyMemberArg, false ],

        // Valid/invalid values for pitch
        [ { pitch: 60 as unknown as number[], duration: 16, velocity: 16 }, true ],
        [ { pitch: '60' as unknown as number[], duration: 16, velocity: 16 }, false ],
        [ { pitch: [ 60 ], duration: 16, velocity: 16 }, true ],
        [ { pitch: new ChordSeqMember([ 60 ]), duration: 16, velocity: 16 }, true ],
        [ { pitch: [], duration: 16, velocity: 16 }, true ],
        [ { pitch: [ -1, 61, 62 ], duration: 16, velocity: 16 }, true ],
        [ { pitch: [ 60, 61, 128 ], duration: 16, velocity: 16 }, true ],
        [ { pitch: [ 60.5, 61, 62 ], duration: 16, velocity: 16 }, true ],
        [ { pitch: [ 60, 61, '62' as unknown as number ], duration: 16, velocity: 16 }, false ],

        // Valid/invalid values for duration
        [ { pitch: [ 60 ], duration: 0, velocity: 16 }, true ],
        [ { pitch: [ 60 ], duration: -1, velocity: 16 }, false ],
        [ { pitch: [ 60 ], duration: 1.5, velocity: 16 }, false ],
        [ { pitch: [ 60 ], duration: '15' as unknown as number, velocity: 16 }, false ],

        // Valid/invalid values for velocity
        [ { pitch: [ 60 ], duration: 1, velocity: 0 }, true ],
        [ { pitch: [ 60 ], duration: 1, velocity: -1 }, false ],
        [ { pitch: [ 60 ], duration: 1, velocity: 128 }, true ],
        [ { pitch: [ 60 ], duration: 1, velocity: 1.5 }, false ],
        [ { pitch: [ 60 ], duration: 1, velocity: '15' as unknown as number }, false ],

        // Valid/invalid values for delay
        [ { pitch: [ 60 ], duration: 11, velocity: 127, delay: -50 }, true ],
        [ { pitch: [ 60 ], duration: 12, velocity: 127, delay: 50 }, true ],
        [ { pitch: [ 60 ], duration: 13, velocity: 127, delay: 50.5 }, false ],
        [ { pitch: [ 60 ], duration: 14, velocity: 127, delay: '50' as unknown as number }, false ],

        // Valid/invalid calues for offset
        [ { pitch: [ 60 ], duration: 21, velocity: 127, offset: -50 }, true ],
        [ { pitch: [ 60 ], duration: 22, velocity: 127, offset: 50 }, true ],
        [ { pitch: [ 60 ], duration: 23, velocity: 127, offset: 50.5 }, false ],
        [ { pitch: [ 60 ], duration: 24, velocity: 127, offset: '50' as unknown as number }, false ],

        // Valid/invalid calues for at
        [ { pitch: [ 60 ], duration: 31, velocity: 127, at: -50 }, false ],
        [ { pitch: [ 60 ], duration: 32, velocity: 127, at: 50 }, true ],
        [ { pitch: [ 60 ], duration: 33, velocity: 127, at: 50.5 }, false ],
        [ { pitch: [ 60 ], duration: 34, velocity: 127, at: '50' as unknown as number }, false ],

        // Valid/invalid values for before
        [ { pitch: [ 60 ], duration: 51, velocity: 127, before: EVENT_GOOD as unknown as MetaEvent[] }, false ],
        [ { pitch: [ 60 ], duration: 52, velocity: 127, before: [] }, true ],
        [ { pitch: [ 60 ], duration: 53, velocity: 127, before: [ 6 as unknown as MetaEvent ] }, false ],
        [ { pitch: [ 60 ], duration: 54, velocity: 127, before: [ null as unknown as MetaEvent ] }, false ],
        [ { pitch: [ 60 ], duration: 55, velocity: 127, before: [ {} as unknown as MetaEvent ] }, false ],
        [ { pitch: [ 60 ], duration: 56, velocity: 127, before: [ EVENT_GOOD ] }, true ],
        [ { pitch: [ 60 ], duration: 57, velocity: 127, before: [ EVENT_BAD ] }, false ],
        [ { pitch: [ 60 ], duration: 58, velocity: 127, before: [ EVENT_GOOD, EVENT_GOOD, EVENT_BAD ] }, false ],

        // Valid/invalid values for after
        [ { pitch: [ 60 ], duration: 61, velocity: 127, after: EVENT_GOOD as unknown as MetaEvent[] }, false ],
        [ { pitch: [ 60 ], duration: 62, velocity: 127, after: [] }, true ],
        [ { pitch: [ 60 ], duration: 63, velocity: 127, after: [ 6 as unknown as MetaEvent ] }, false ],
        [ { pitch: [ 60 ], duration: 64, velocity: 127, after: [ null as unknown as MetaEvent ] }, false ],
        [ { pitch: [ 60 ], duration: 65, velocity: 127, after: [ {} as unknown as MetaEvent ] }, false ],
        [ { pitch: [ 60 ], duration: 66, velocity: 127, after: [ EVENT_GOOD ] }, true ],
        [ { pitch: [ 60 ], duration: 67, velocity: 127, after: [ EVENT_BAD ] }, false ],
        [ { pitch: [ 60 ], duration: 68, velocity: 127, after: [ EVENT_GOOD, EVENT_GOOD, EVENT_BAD] }, false ],
    ];

    const DEF = {
        pitch: [],
        duration: 0,
        velocity: 0,
        delay: 0,
        offset: 0,
        at: undefined,
        before: [],
        after: [],
    };

    test.each(table)('constructor(%p) ok is %p', (v, ret) => {
        if (ret) {
            const fields: (keyof MelodyMember)[] = [ 'pitch', 'duration', 'velocity', 'offset', 'at', 'delay', 'before', 'after' ];

            const me1 = MelodyMember.from(v);
            const me2 = MelodyMember.from(me1);

            fields.forEach(v => expect(me1[v]).toStrictEqual(me2[v]));

            const cmp = { ...DEF, ...v };

            expect(me1.pitch).toStrictEqual(ChordSeqMember.from(cmp.pitch));
            expect(me1.duration).toStrictEqual(cmp.duration);
            expect(me1.velocity).toStrictEqual(cmp.velocity);
            expect(me1.delay).toStrictEqual(cmp.delay);
            expect(me1.offset).toStrictEqual(cmp.offset);
            expect(me1.at).toStrictEqual(cmp.at);
            expect(me1.before).toStrictEqual(MetaList.from(cmp.before));
            expect(me1.after).toStrictEqual(MetaList.from(cmp.after));
            
            expect(Object.isFrozen(me1)).toBe(true);
            expect(Object.isFrozen(me1.pitch)).toBe(true);
            expect(Object.isFrozen(me1.before)).toBe(true);
            expect(Object.isFrozen(me1.after)).toBe(true);
            expect(Object.isFrozen(me2)).toBe(true);
            expect(Object.isFrozen(me2.pitch)).toBe(true);
            expect(Object.isFrozen(me2.before)).toBe(true);
            expect(Object.isFrozen(me2.after)).toBe(true);
        } else {
            expect(() => MelodyMember.from(v)).toThrow();
        }
    });

    test('null event applies defaults', () => {
        expect(MelodyMember.from(null)).toStrictEqual(MelodyMember.from({ pitch: [], velocity: 64, duration: 16 }));
    });

    test('note event applies defaults', () => {
        expect(MelodyMember.from(55)).toStrictEqual(MelodyMember.from({ pitch: [ 55 ], velocity: 64, duration: 16 }));
    });

    test('array event applies defaults', () => {
        expect(MelodyMember.from([ 55, 66 ])).toStrictEqual(MelodyMember.from({ pitch: [ 55, 66 ], velocity: 64, duration: 16 }));
    });

    test('missing duration applies defaults', () => {
        expect(MelodyMember.from({ pitch: [ 60 ], velocity: 48 } as unknown as MelodyMemberArg))
            .toStrictEqual(MelodyMember.from({ pitch: [ 60 ], velocity: 48, duration: 16 }));
    });

    test('missing velocity applies defaults', () => {
        expect(MelodyMember.from({ pitch: [ 60 ], duration: 48 } as unknown as MelodyMemberArg))
            .toStrictEqual(MelodyMember.from({ pitch: [ 60 ], velocity: 64, duration: 48 }));
    });
});

describe('MelodyMember getter tests', () => {
    const e = MelodyMember.from({
        pitch: ChordSeqMember.from([ 40, 45, 50 ]),
        velocity: 61,
        duration: 45,
        delay: 16,
        at: 64,
        offset: 32,
        before: MetaList.from([ META_SUSTAIN_ON ]),
        after: MetaList.from([ META_SUSTAIN_OFF, META_END_TRACK ])
    });

    test('getter tests', () => {
        expect(e.pitch).toStrictEqual(ChordSeqMember.from([ 40, 45, 50 ]));
        expect(e.velocity).toEqual(61);
        expect(e.duration).toEqual(45);
        expect(e.delay).toEqual(16);
        expect(e.at).toEqual(64);
        expect(e.offset).toEqual(32);
        expect(e.before).toStrictEqual(MetaList.from([ META_SUSTAIN_ON ]));
        expect(e.after).toStrictEqual(MetaList.from([ META_SUSTAIN_OFF, META_END_TRACK ]));
    });
});

describe('MelodyMember.numericValue() tests', () => {
    test('MelodyMember.numericValue() for zero values throws', () => {
        expect(() => makeEventWithDefaults({ pitch: [] }).numericValue()).toThrow();
    });

    test('MelodyMember.numericValue() for one value works', () => {
        expect(makeEventWithDefaults({ pitch: [ 5 ] }).numericValue()).toEqual(5);
    });

    test('MelodyMember.numericValue() for two values throws', () => {
        expect(() => makeEventWithDefaults({ pitch: [ 5, 6 ]}).numericValue()).toThrow();
    });
});

describe('MelodyMember.nullableNumericValue() tests', () => {
    test('MelodyMember.nullableNumericValue() for zero values works', () => {
        expect(makeEventWithDefaults({ pitch: [] }).nullableNumericValue()).toEqual(null);
    });

    test('MelodyMember.nullableNumericValue() for one value works', () => {
        expect(makeEventWithDefaults({ pitch: [ 5 ] }).nullableNumericValue()).toEqual(5);
    });

    test('MelodyMember.nullableNumericValue() for two values throws', () => {
        expect(() => makeEventWithDefaults({ pitch: [ 5, 6 ] }).nullableNumericValue()).toThrow();
    });
});

describe('MelodyMember.pitches() tests', () => {
    const table = [
        [ [] ],
        [ [ 1 ] ],
        [ [ 17, 46, 59 ] ]
    ];

    test.each(table)('pitches(%p)', v => {
        expect(makeEventWithDefaults({ pitch: v }).pitches()).toStrictEqual(v);
    });
});

describe('MelodyMember.mapPitches() tests', () => {
    test('MelodyMember.mapPitches() non-empty', () => {
        expect(makeEventWithDefaults({ pitch: [ 17, 46, 59 ] }).mapPitches(v => v + 1).pitches())
            .toStrictEqual([ 18, 47, 60 ]);
    });

    test('MelodyMember.mapPitches() empty', () => {
        expect(makeEventWithDefaults({ pitch: [] }).mapPitches(v => v + 1).pitches())
            .toStrictEqual([]);
    });
});

describe('MelodyMember.equals() tests', () => {
    const B4_1: MetaEventArg = { event: 'sustain', value: 1 };
    const B4_2: MetaEventArg = { event: 'instrument', value: 32 };

    const table: [ MelodyMemberArg, MelodyMemberArg, boolean ][] = [
        [
            { pitch: [ 60, 64 ], duration: 60, velocity: 50 },
            { pitch: [ 60, 64 ], duration: 60, velocity: 50 },
            true
        ],
        [
            { pitch: [ 60, 64 ], duration: 60, velocity: 50 },
            { pitch: [ 64, 60 ], duration: 60, velocity: 50 },
            true
        ],
        [
            { pitch: [ 60, 64 ], duration: 60, velocity: 50 },
            { pitch: [ 60, 62 ], duration: 60, velocity: 50 },
            false
        ],
        [
            { pitch: [ 60, 64 ], duration: 60, velocity: 50 },
            { pitch: [ 60, 64 ], duration: 50, velocity: 50 },
            false
        ],
        [
            { pitch: [ 60, 64 ], duration: 60, velocity: 50 },
            { pitch: [ 60, 64 ], duration: 60, velocity: 40 },
            false
        ],
        [
            { pitch: [ 60, 64 ], duration: 60, velocity: 50, delay: 5 },
            { pitch: [ 60, 64 ], duration: 60, velocity: 50, delay: 5 },
            true
        ],
        [
            { pitch: [ 60, 64 ], duration: 60, velocity: 50, delay: 5 },
            { pitch: [ 60, 64 ], duration: 60, velocity: 50, delay: 1 },
            false
        ],
        [
            { pitch: [ 60, 64 ], duration: 60, velocity: 50, delay: 5 },
            { pitch: [ 60, 64 ], duration: 60, velocity: 50 },
            false
        ],
        [
            { pitch: [ 60, 64 ], duration: 60, velocity: 50, offset: 5 },
            { pitch: [ 60, 64 ], duration: 60, velocity: 50, offset: 5 },
            true
        ],
        [
            { pitch: [ 60, 64 ], duration: 60, velocity: 50, offset: 5 },
            { pitch: [ 60, 64 ], duration: 60, velocity: 50, offset: 1 },
            false
        ],
        [
            { pitch: [ 60, 64 ], duration: 60, velocity: 50, offset: 5 },
            { pitch: [ 60, 64 ], duration: 60, velocity: 50 },
            false
        ],
        [
            { pitch: [ 60, 64 ], duration: 60, velocity: 50, at: 5 },
            { pitch: [ 60, 64 ], duration: 60, velocity: 50, at: 5 },
            true
        ],
        [
            { pitch: [ 60, 64 ], duration: 60, velocity: 50, at: 5 },
            { pitch: [ 60, 64 ], duration: 60, velocity: 50, at: 1 },
            false
        ],
        [
            { pitch: [ 60, 64 ], duration: 60, velocity: 50, at: 5 },
            { pitch: [ 60, 64 ], duration: 60, velocity: 50 },
            false
        ],
        [
            { pitch: [ 60, 64 ], duration: 60, velocity: 50, before: [ B4_1, B4_2 ] },
            { pitch: [ 60, 64 ], duration: 60, velocity: 50, before: [ B4_1, B4_2 ] },
            true
        ],
        [
            { pitch: [ 60, 64 ], duration: 60, velocity: 50, before: [ B4_1, B4_2 ] },
            { pitch: [ 60, 64 ], duration: 60, velocity: 50, before: [ B4_2, B4_1 ] },
            false
        ],
        [
            { pitch: [ 60, 64 ], duration: 60, velocity: 50, before: [ B4_1 ] },
            { pitch: [ 60, 64 ], duration: 60, velocity: 50 },
            false
        ],
        [
            { pitch: [ 60, 64 ], duration: 60, velocity: 50, after: [ B4_1, B4_2 ] },
            { pitch: [ 60, 64 ], duration: 60, velocity: 50, after: [ B4_1, B4_2 ] },
            true
        ],
        [
            { pitch: [ 60, 64 ], duration: 60, velocity: 50, after: [ B4_1, B4_2 ] },
            { pitch: [ 60, 64 ], duration: 60, velocity: 50, after: [ B4_2, B4_1 ] },
            false
        ],
        [
            { pitch: [ 60, 64 ], duration: 60, velocity: 50, after: [ B4_1 ] },
            { pitch: [ 60, 64 ], duration: 60, velocity: 50 },
            false
        ],
        [
            { pitch: [ 60, 64 ], duration: 60, velocity: 50 },
            { pitch: [ 60, 64 ], duration: 60, velocity: 50 },
            true
        ],
        [
            { pitch: [ 60, 64 ], duration: 60, velocity: 50 },
            { pitch: [ 60, 64 ], duration: 60, velocity: 50 },
            true
        ],
        [
            { pitch: [ 60, 64 ], duration: 60, velocity: 50 },
            { pitch: [ 64, 60 ], duration: 60, velocity: 50 },
            true
        ],
        [
            { velocity: 50, pitch: [ 64, 60 ], duration: 60, before: [ B4_1 ], after: [ B4_2 ], delay: 50, offset: 5 },
            { pitch: [ 64, 60 ], delay: 50, offset: 5, after: [ B4_2 ], before: [ B4_1 ], duration: 60, velocity: 50 },
            true
        ],
    ];

    test.each(table)('%p.equals(%p) returns %p', (a, b, ret) => {
        expect(MelodyMember.from(a).equals(MelodyMember.from(b))).toBe(ret);
    });

    test('equals() non-MelodyMember return false', () => {
        const cmp = { pitch: [ 64 ], duration: 50, velocity: 60 };

        expect(MelodyMember.from(cmp).equals(cmp as unknown as MelodyMember)).toBe(false);
        expect(MelodyMember.from(cmp).equals(ChordSeqMember.from(64) as unknown as MelodyMember)).toBe(false);
        expect(MelodyMember.from(cmp).equals(64 as unknown as MelodyMember)).toBe(false);
    });
});

describe('MelodyMember.setPitches() tests', () => {
    const e = MelodyMember.from({ pitch: [ 64 ], duration: 50, velocity: 60 });

    test('throws when argument is of an invalid type', () => {
        expect(() => e.setPitches('1' as unknown as number)).toThrow();
    });

    const table: [ string, PitchArgument, number[] ][] = [
        [ 'length 0 passed as array', [], [] ],
        [ 'length 0 passed as null', null, [] ],
        [ 'length 1 passed as array', [ 5 ], [ 5 ] ],
        [ 'length 1 passed as value', 5, [ 5 ] ],
        [ 'length 2 passed as array', [ 2, 3 ], [ 2, 3 ] ],
    ];

    test.each(table)('works when %s', (_, arg, ret) => {
        expect(e.setPitches(arg)).toStrictEqual(MelodyMember.from({ pitch: new ChordSeqMember(ret), duration: 50, velocity: 60 }));
    });
});

describe('MelodyMember.withDuration() tests', () => {
    const e = makeEventWithDefaults({ pitch: [ 60 ], duration: 2 });

    const errortable: [ string, number ][] = [
        [ 'negative value', -1 ],
        [ 'non-integer value', 1.5 ],
        [ 'string value', '1' as unknown as number ],
    ];

    test.each(errortable)('throws when passed %s', (_, v) => {
        expect(() => e.withDuration(v)).toThrow();
    });

    test('allows zero duration', () => {
        expect(e.withDuration(0)).toStrictEqual(makeEventWithDefaults({ pitch: [ 60 ], duration: 0 }));
    });

    test('allows positive duration', () => {
        expect(e.withDuration(16)).toStrictEqual(makeEventWithDefaults({ pitch: [ 60 ], duration: 16 }));
    });
});

describe('MelodyMember.withVolume() tests', () => {
    const e = makeEventWithDefaults({ pitch: [ 60 ], velocity: 2 });

    const errortable: [ string, number ][] = [
        [ 'negative value', -1 ],
        [ 'non-integer value', 1.5 ],
        [ 'string value', '1' as unknown as number ],
    ];

    test.each(errortable)('throws when passed %s', (_, v) => {
        expect(() => e.withVolume(v)).toThrow();
    });

    test('allows zero velocity', () => {
        expect(e.withVolume(0)).toStrictEqual(makeEventWithDefaults({ pitch: [ 60 ], velocity: 0 }));
    });

    test('allows positive velocity', () => {
        expect(e.withVolume(16)).toStrictEqual(makeEventWithDefaults({ pitch: [ 60 ], velocity: 16 }));
    });
});

describe('MelodyMember.withExactTick() tests', () => {
    const e = makeEventWithDefaults({ pitch: [ 60 ] });

    const errortable: [ string, number ][] = [
        [ 'negative value', -1 ],
        [ 'non-integer value', 1.5 ],
        [ 'string value', '1' as unknown as number ],
    ];

    test.each(errortable)('throws when passed %s', (_, v) => {
        expect(() => e.withExactTick(v)).toThrow();
    });

    test('allows zero at', () => {
        expect(e.withExactTick(0)).toStrictEqual(makeEventWithDefaults({ pitch: [ 60 ], at: 0 }));
    });

    test('allows positive at', () => {
        expect(e.withExactTick(16)).toStrictEqual(makeEventWithDefaults({ pitch: [ 60 ], at: 16 }));
    });
});

describe('MelodyMember.withOffset() tests', () => {
    const e = makeEventWithDefaults({ pitch: [ 60 ] });

    const errortable: [ string, number ][] = [
        [ 'non-integer value', 1.5 ],
        [ 'string value', '1' as unknown as number ],
    ];

    test.each(errortable)('throws when passed %s', (_, v) => {
        expect(() => e.withOffset(v)).toThrow();
    });

    test('allows zero offset', () => {
        expect(e.withOffset(0)).toStrictEqual(makeEventWithDefaults({ pitch: [ 60 ], offset: 0 }));
    });

    test('allows positive offset', () => {
        expect(e.withOffset(16)).toStrictEqual(makeEventWithDefaults({ pitch: [ 60 ], offset: 16 }));
    });

    test('allows negative offset', () => {
        expect(e.withOffset(-16)).toStrictEqual(makeEventWithDefaults({ pitch: [ 60 ], offset: -16 }));
    });
});

describe('MelodyMember.addOffset() tests', () => {
    const e = makeEventWithDefaults({ offset: 0 });

    const errortable: [ string, number ][] = [
        [ 'non-integer value', 1.5 ],
        [ 'string value', '1' as unknown as number ],
    ];

    test.each(errortable)('throws when passed %s', (_, v) => {
        expect(() => e.addOffset(v)).toThrow();
    });

    const table: [ string, number, number, number ][] = [
        [ 'adding to zero offset', 0, 100, 100 ],
        [ 'adding to non-zero offset', 100, 200, 300 ],
        [ 'adding negative offset', 100, -200, -100 ]
    ];

    describe.each(table)('%p + %p = %p', (_, old, v, ret) => {
        test('addOffset()', () => {
            expect(makeEventWithDefaults({ offset: old }).addOffset(v)).toStrictEqual(makeEventWithDefaults({ offset: ret }));
        });
    });
});

describe('MelodyMember.withDelay() tests', () => {
    const e = makeEventWithDefaults({ pitch: [ 60 ] });

    const errortable: [ string, number ][] = [
        [ 'non-integer value', 1.5 ],
        [ 'string value', '1' as unknown as number ],
    ];

    test.each(errortable)('throws when passed %s', (_, v) => {
        expect(() => e.withDelay(v)).toThrow();
    });

    test('allows zero delay', () => {
        expect(e.withDelay(0)).toStrictEqual(makeEventWithDefaults({ pitch: [ 60 ], delay: 0 }));
    });

    test('allows positive delay', () => {
        expect(e.withDelay(16)).toStrictEqual(makeEventWithDefaults({ pitch: [ 60 ], delay: 16 }));
    });

    test('allows negative delay', () => {
        expect(e.withDelay(-16)).toStrictEqual(makeEventWithDefaults({ pitch: [ 60 ], delay: -16 }));
    });
});

describe('MelodyMember.addDelay() tests', () => {
    const e = makeEventWithDefaults({ delay: 0 });

    const errortable: [ string, number ][] = [
        [ 'non-integer value', 1.5 ],
        [ 'string value', '1' as unknown as number ],
    ];

    test.each(errortable)('throws when passed %s', (_, v) => {
        expect(() => e.addDelay(v)).toThrow();
    });

    const table: [ string, number, number, number ][] = [
        [ 'adding to zero delay', 0, 100, 100 ],
        [ 'adding to non-zero delay', 100, 200, 300 ],
        [ 'adding negative delay', 100, -200, -100 ]
    ];

    describe.each(table)('%p + %p = %p', (_, old, v, ret) => {
        test('addDelay()', () => {
            expect(makeEventWithDefaults({ delay: old }).addDelay(v)).toStrictEqual(makeEventWithDefaults({ delay: ret }));
        });
    });
});

describe('MelodyMember.withAllTicksExact()', () => {
    test('with invalid argumnent', () => {
        expect(() => MelodyMember.from({ pitch: [ 66 ] }).withAllTicksExact(1.5)).toThrow();
    });

    test('with no temporal parameters', () => {
        expect(MelodyMember.from({ pitch: [ 66 ] }).withAllTicksExact(8))
            .toStrictEqual(MelodyMember.from({ pitch: [ 66 ], at: 8 }));
    });

    test('with offset and delay', () => {
        expect(MelodyMember.from({ pitch: [ 66 ], offset: 32, delay: 16 }).withAllTicksExact(8))
            .toStrictEqual(MelodyMember.from({ pitch: [ 66 ], at: 56 }));
    });

    test('with all temporal parameters', () => {
        expect(MelodyMember.from({ pitch: [ 66 ], at: 64, offset: 32, delay: 16 }).withAllTicksExact(8))
            .toStrictEqual(MelodyMember.from({ pitch: [ 66 ], at: 112 }));
    });

    test('with no temporal parameters, but before and after', () => {
        expect(MelodyMember.from({
            pitch: [ 66 ],
            duration: 128,
            before: MetaList.from([
                { event: 'text', value: 'text 0' },
                { event: 'text', value: 'text 1', offset: 16 },
                { event: 'text', value: 'text 2', at: 32 },
                { event: 'text', value: 'text 3', at: 32, offset: 16 },
            ]),
            after: MetaList.from([
                { event: 'text', value: 'text 0' },
                { event: 'text', value: 'text 1', offset: 16 },
                { event: 'text', value: 'text 2', at: 32 },
                { event: 'text', value: 'text 3', at: 32, offset: 16 },
            ]),
        }).withAllTicksExact(8))
            .toStrictEqual(MelodyMember.from({
                pitch: [ 66 ],
                duration: 128,
                at: 8,
                before: MetaList.from([
                { event: 'text', value: 'text 0', at: 8 },
                { event: 'text', value: 'text 1', at: 24 },
                { event: 'text', value: 'text 2', at: 32 },
                { event: 'text', value: 'text 3', at: 48 },
            ]),
            after: MetaList.from([
                { event: 'text', value: 'text 0', at: 136 },
                { event: 'text', value: 'text 1', at: 152 },
                { event: 'text', value: 'text 2', at: 32 },
                { event: 'text', value: 'text 3', at: 48 },
            ]),
        }));
    });

    test('with delay and offset, before and after', () => {
        expect(MelodyMember.from({
            pitch: [ 66 ],
            duration: 128,
            delay: 36,
            offset: 18,
            before: MetaList.from([
                { event: 'text', value: 'text 0' },
                { event: 'text', value: 'text 1', offset: 16 },
                { event: 'text', value: 'text 2', at: 32 },
                { event: 'text', value: 'text 3', at: 32, offset: 16 },
            ]),
            after: MetaList.from([
                { event: 'text', value: 'text 0' },
                { event: 'text', value: 'text 1', offset: 16 },
                { event: 'text', value: 'text 2', at: 32 },
                { event: 'text', value: 'text 3', at: 32, offset: 16 },
            ]),
        }).withAllTicksExact(8))
            .toStrictEqual(MelodyMember.from({
                pitch: [ 66 ],
                duration: 128,
                at: 62,
                before: MetaList.from([
                { event: 'text', value: 'text 0', at: 62 },
                { event: 'text', value: 'text 1', at: 78 },
                { event: 'text', value: 'text 2', at: 32 },
                { event: 'text', value: 'text 3', at: 48 },
            ]),
            after: MetaList.from([
                { event: 'text', value: 'text 0', at: 190 },
                { event: 'text', value: 'text 1', at: 206 },
                { event: 'text', value: 'text 2', at: 32 },
                { event: 'text', value: 'text 3', at: 48 },
            ]),
        }));
    });

    test('with all temporal parameters, before and after', () => {
        expect(MelodyMember.from({
            pitch: [ 66 ],
            duration: 128,
            at: 72,
            delay: 36,
            offset: 18,
            before: MetaList.from([
                { event: 'text', value: 'text 0' },
                { event: 'text', value: 'text 1', offset: 16 },
                { event: 'text', value: 'text 2', at: 32 },
                { event: 'text', value: 'text 3', at: 32, offset: 16 },
            ]),
            after: MetaList.from([
                { event: 'text', value: 'text 0' },
                { event: 'text', value: 'text 1', offset: 16 },
                { event: 'text', value: 'text 2', at: 32 },
                { event: 'text', value: 'text 3', at: 32, offset: 16 },
            ]),
        }).withAllTicksExact(8))
            .toStrictEqual(MelodyMember.from({
                pitch: [ 66 ],
                duration: 128,
                at: 126,
                before: MetaList.from([
                { event: 'text', value: 'text 0', at: 126 },
                { event: 'text', value: 'text 1', at: 142 },
                { event: 'text', value: 'text 2', at: 32 },
                { event: 'text', value: 'text 3', at: 48 },
            ]),
            after: MetaList.from([
                { event: 'text', value: 'text 0', at: 254 },
                { event: 'text', value: 'text 1', at: 270 },
                { event: 'text', value: 'text 2', at: 32 },
                { event: 'text', value: 'text 3', at: 48 },
            ]),
        }));
    });
});

describe('MelodyMember.withTextBefore()', () => {
    const e1 = makeEventWithDefaults({});
    const e2 = makeEventWithDefaults({
        before: MetaList.from([ { event: 'text', value: 'test text' }]),
        after: MetaList.from([ { event: 'time-signature', value: '3/4' } ])
    });
    const e3 = makeEventWithDefaults({
        before: MetaList.from([ { event: 'sustain', value: 0 }])
    });

    const errortable: [ string, string, string | MetaEventOpts | undefined, MetaEventOpts | undefined ][] = [
        [ 'value not a string', 5000 as unknown as string, undefined, undefined ],
        [ 'invalid text type passed', 'testing', 'tempo', undefined ],
        [ 'invalid options passed in 2nd arg', '3/4', 'foo' as unknown as MetaEventOpts, undefined ],
        [ 'non-existent option passed in 2nd arg', '3/4', { cat: 555 } as unknown as MetaEventOpts, undefined ],
        [ 'invalid option value passed in 2nd arg', '3/4', { at: '555' as unknown as number }, undefined ],
        [ 'invalid options passed in 3rd arg', '3/4', undefined, 'foo' as unknown as MetaEventOpts ],
        [ 'non-existent option passed in 3rd arg', '3/4', undefined, { cat: 555 } as unknown as MetaEventOpts ],
        [ 'invalid option value passed in 3rd arg', '3/4', undefined, { at: '555' as unknown as number } ],
    ];

    test.each(errortable)('throws when %s', (_, val, arg2, arg3) => {
        expect(() => e1.withTextBefore(val, arg2, arg3)).toThrow();
    });

    const table: [ string, MelodyMember, string, string | MetaEventOpts | undefined, MetaEventOpts | undefined, MelodyMember ][] = [
        [
            'with default type and no options',
            e1,
            '3/4',
            undefined,
            undefined,
            makeEventWithDefaults({ before: MetaList.from([ { event: 'text', value: '3/4' } ]) }),
        ],
        [
            'with non-default type and no options',
            e1,
            '3/4',
            'lyric',
            undefined,
            makeEventWithDefaults({ before: MetaList.from([ { event: 'lyric', value: '3/4' } ]) }),
        ],
        [
            'with at set in 2nd arg',
            e2,
            'other text',
            { at: 32 },
            undefined,
            makeEventWithDefaults({
                before: MetaList.from([ { event: 'text', value: 'test text' }, { event: 'text', value: 'other text', at: 32 } ]),
                after: MetaList.from([ { event: 'time-signature', value: '3/4'}])
            })
        ],
        [
            'with offset set in 2nd arg',
            e3,
            'other text',
            { offset: 32 },
            undefined,
            makeEventWithDefaults({
                before: MetaList.from([ { event: 'sustain', value: 0 }, { event: 'text', value: 'other text', offset: 32 } ]),
            })
        ],
        [
            'with at set in 3rd arg',
            e2,
            'other text',
            'lyric',
            { at: 32 },
            makeEventWithDefaults({
                before: MetaList.from([ { event: 'text', value: 'test text' }, { event: 'lyric', value: 'other text', at: 32 } ]),
                after: MetaList.from([ { event: 'time-signature', value: '3/4'}])
            })
        ],
        [
            'with offset set in 2nd arg',
            e3,
            'other text',
            'text',
            { offset: 32 },
            makeEventWithDefaults({
                before: MetaList.from([ { event: 'sustain', value: 0 }, { event: 'text', value: 'other text', offset: 32 } ]),
            })
        ],
    ];

    test.each(table)('adds event as expected when %s', (_, e, val, arg2, arg3, ret) => {
        expect(e.withTextBefore(val, arg2, arg3)).toStrictEqual(ret);
    });
});

describe('MelodyMember.withTextAfter()', () => {
    const e1 = makeEventWithDefaults({});
    const e2 = makeEventWithDefaults({
        before: MetaList.from([ { event: 'time-signature', value: '3/4' } ]),
        after: MetaList.from([ { event: 'text', value: 'test text' }]),
    });
    const e3 = makeEventWithDefaults({
        after: MetaList.from([ { event: 'sustain', value: 0 }])
    });

    const errortable: [ string, string, string | MetaEventOpts | undefined, MetaEventOpts | undefined ][] = [
        [ 'value not a string', 5000 as unknown as string, undefined, undefined ],
        [ 'invalid text type passed', 'testing', 'tempo', undefined ],
        [ 'invalid options passed in 2nd arg', '3/4', 'foo' as unknown as MetaEventOpts, undefined ],
        [ 'non-existent option passed in 2nd arg', '3/4', { cat: 555 } as unknown as MetaEventOpts, undefined ],
        [ 'invalid option value passed in 2nd arg', '3/4', { at: '555' as unknown as number }, undefined ],
        [ 'invalid options passed in 3rd arg', '3/4', undefined, 'foo' as unknown as MetaEventOpts ],
        [ 'non-existent option passed in 3rd arg', '3/4', undefined, { cat: 555 } as unknown as MetaEventOpts ],
        [ 'invalid option value passed in 3rd arg', '3/4', undefined, { at: '555' as unknown as number } ],
    ];

    test.each(errortable)('throws when %s', (_, val, arg2, arg3) => {
        expect(() => e1.withTextAfter(val, arg2, arg3)).toThrow();
    });

    const table: [ string, MelodyMember, string, string | MetaEventOpts | undefined, MetaEventOpts | undefined, MelodyMember ][] = [
        [
            'with default type and no options',
            e1,
            '3/4',
            undefined,
            undefined,
            makeEventWithDefaults({ after: MetaList.from([ { event: 'text', value: '3/4' } ]) }),
        ],
        [
            'with non-default type and no options',
            e1,
            '3/4',
            'lyric',
            undefined,
            makeEventWithDefaults({ after: MetaList.from([ { event: 'lyric', value: '3/4' } ]) }),
        ],
        [
            'with at set in 2nd arg',
            e2,
            'other text',
            { at: 32 },
            undefined,
            makeEventWithDefaults({
                before: MetaList.from([ { event: 'time-signature', value: '3/4'}]),
                after: MetaList.from([ { event: 'text', value: 'test text' }, { event: 'text', value: 'other text', at: 32 } ]),
            })
        ],
        [
            'with offset set in 2nd arg',
            e3,
            'other text',
            { offset: 32 },
            undefined,
            makeEventWithDefaults({
                after: MetaList.from([ { event: 'sustain', value: 0 }, { event: 'text', value: 'other text', offset: 32 } ]),
            })
        ],
        [
            'with at set in 3rd arg',
            e2,
            'other text',
            'lyric',
            { at: 32 },
            makeEventWithDefaults({
                before: MetaList.from([ { event: 'time-signature', value: '3/4'}]),
                after: MetaList.from([ { event: 'text', value: 'test text' }, { event: 'lyric', value: 'other text', at: 32 } ]),
            })
        ],
        [
            'with offset set in 2nd arg',
            e3,
            'other text',
            'text',
            { offset: 32 },
            makeEventWithDefaults({
                after: MetaList.from([ { event: 'sustain', value: 0 }, { event: 'text', value: 'other text', offset: 32 } ]),
            })
        ],
    ];

    test.each(table)('adds event as expected when %s', (_, e, val, arg2, arg3, ret) => {
        expect(e.withTextAfter(val, arg2, arg3)).toStrictEqual(ret);
    });
});

describe('MelodyMember.withEventsBefore() tests', () => {
    const e1 = makeEventWithDefaults({});
    const e2 = makeEventWithDefaults({ before: [ META_SUSTAIN_ON ] });

    const errortable: [ string, MelodyMember, MetaEventArg[] ][] = [
        [
            'adding an invalid MetaEvent',
            e1,
            [ {} as unknown as MetaEventArg ],
        ],
        [
            'adding an array containing an invalid MetaEvent',
            e2,
            [ { event: 'sustain', value: 0 }, {} as unknown as MetaEventArg ],
        ],
    ];

    describe('MelodyMember.withEventsBefore()', () => {
        test.each(errortable)('%s', (_, m, ev) => {
            expect(() => m.withEventsBefore(ev)).toThrow();
        });
    });

    const table: [ string, MelodyMember, MetaEventArg[], MetaEventArg[] ][] = [
        [
            'adding no MetaEvents to a member without MetaEvents',
            e1,
            [],
            []
        ],
        [
            'adding one MetaEvent to a member without MetaEvents',
            e1,
            [ SUSTAIN_OFF ],
            [ SUSTAIN_OFF ],
        ],
        [
            'adding two MetaEvents to a member without MetaEvents',
            e1,
            [ { event: 'sustain', value: 0 }, { event: 'end-track' } ],
            [ SUSTAIN_OFF, END_TRACK ],
        ],
        [
            'adding no MetaEvents to a member with one MetaEvent',
            e2,
            [],
            [ SUSTAIN_ON ],
        ],
        [
            'adding two MetaEvents to an event with one MetaEvent',
            e2,
            [ { event: 'sustain', value: 0 }, { event: 'end-track' } ],
            [ SUSTAIN_ON, SUSTAIN_OFF, END_TRACK ],
        ],
    ];

    describe('MelodyMember.withEventsBefore()', () => {
        test.each(table)('%s', (_, m, ev, ret) => {
            expect(m.withEventsBefore(ev)).toStrictEqual(makeEventWithDefaults({ before: ret }));
        });
    });
});

describe('MelodyMember.withEventsAfter() tests', () => {
    const e1 = makeEventWithDefaults({});
    const e2 = makeEventWithDefaults({ after: [ META_SUSTAIN_ON ] });

    const errortable: [ string, MelodyMember, MetaEventArg[] ][] = [
        [
            'adding an invalid MetaEvent',
            e1,
            [ {} as unknown as MetaEventArg ],
        ],
        [
            'adding an array containing an invalid MetaEvent',
            e2,
            [ { event: 'sustain', value: 0 }, {} as unknown as MetaEventArg ],
        ],
    ];

    describe('MelodyMember.withEventsAfter()', () => {
        test.each(errortable)('%s', (_, m, ev) => {
            expect(() => m.withEventsAfter(ev)).toThrow();
        });
    });

    const table: [ string, MelodyMember, MetaEventArg[], MetaEventArg[] ][] = [
        [
            'adding no MetaEvents to a member without MetaEvents',
            e1,
            [],
            []
        ],
        [
            'adding one MetaEvent to a member without MetaEvents',
            e1,
            [ SUSTAIN_OFF ],
            [ SUSTAIN_OFF ],
        ],
        [
            'adding two MetaEvents to a member without MetaEvents',
            e1,
            [ { event: 'sustain', value: 0 }, { event: 'end-track' } ],
            [ SUSTAIN_OFF, END_TRACK ],
        ],
        [
            'adding no MetaEvents to a member with one MetaEvent',
            e2,
            [],
            [ SUSTAIN_ON ],
        ],
        [
            'adding two MetaEvents to an event with one MetaEvent',
            e2,
            [ { event: 'sustain', value: 0 }, { event: 'end-track' } ],
            [ SUSTAIN_ON, SUSTAIN_OFF, END_TRACK ],
        ],
    ];

    describe('MelodyMember.withEventsAfter()', () => {
        test.each(table)('%s', (_, m, ev, ret) => {
            expect(m.withEventsAfter(ev)).toStrictEqual(makeEventWithDefaults({ after: ret }));
        });
    });
});

describe('MelodyMember.withEventAfter/MelodyMember.withEventAfter() tests', () => {
    const e1 = makeEventWithDefaults({});
    const e2 = makeEventWithDefaults({ before: [ META_SUSTAIN_ON ], after: [ META_SUSTAIN_ON ] });

    const errortable: [ string, MelodyMember, string | MetaEventArg, MetaEventValue | undefined, MetaEventOpts | undefined ][] = [
        [
            'adding an invalid MetaEvent',
            e1,
            {} as unknown as MetaEventArg,
            undefined,
            undefined,
        ],
        [
            'adding a non-existent MetaEvent',
            e2,
            'meow',
            1,
            undefined,
        ],
    ];

    describe('MelodyMember.withEventBefore()', () => {
        test.each(errortable)('%s', (_, e, ev, value, meta) => {
            expect(() => e.withEventBefore(ev, value, meta)).toThrow();
        });
    });

    describe('MelodyMember.withEventAfter()', () => {
        test.each(errortable)('%s', (_, e, ev, value, meta) => {
            expect(() => e.withEventAfter(ev, value, meta)).toThrow();
        });
    });

    const table: [ string, MelodyMember, string | MetaEventArg, MetaEventValue | undefined, MetaEventOpts | undefined, MetaEvent[] ][] = [
        [
            'adding one MetaEvent using three-argument form to an event without MetaEvents',
            e1,
            'sustain',
            0,
            undefined,
            [ META_SUSTAIN_OFF ],
        ],
        [
            'adding one MetaEvent using one-argument form to an event without MetaEvents',
            e1,
            SUSTAIN_OFF,
            undefined,
            undefined,
            [ META_SUSTAIN_OFF ],
        ],
        [
            'adding one MetaEvent using three-argument form to an event with one MetaEvent',
            e2,
            'sustain',
            0,
            { at: 64 },
            [ META_SUSTAIN_ON, MetaEvent.from({ event: 'sustain', value: 0, at: 64 }) ],
        ],
    ];

    describe('MelodyMember.withEventBefore()', () => {
        test.each(table)('%s', (_, e, ev, value, meta, ret) => {
            const expected = e === e2 ? makeEventWithDefaults({ before: ret, after: [ META_SUSTAIN_ON ] }) : makeEventWithDefaults({ before: ret });

            expect(e.withEventBefore(ev, value, meta)).toStrictEqual(expected);
        });
    });

    describe('MelodyMember.withEventAfter()', () => {
        test.each(table)('%s', (_, e, ev, value, meta, ret) => {
            const expected = e === e2 ? makeEventWithDefaults({ before: [ META_SUSTAIN_ON ], after: ret }) : makeEventWithDefaults({ after: ret });

            expect(e.withEventAfter(ev, value, meta)).toStrictEqual(expected);
        });
    });
});

describe('MelodyMember.augmentRhythm() tests', () => {
    const e = MelodyMember.from({
        pitch: [ 60 ],
        duration: 12,
        velocity: 32,
        delay: 50,
        before: [ { event: 'sustain', value: 1, offset: 100 } ],
        after: [ { event: 'end-track', offset: 200 } ],
    });

    test('augmenting rhythm by a value not a finite non-negative number fails', () => {
        expect(() => e.augmentRhythm('1' as unknown as number)).toThrow();
        expect(() => e.augmentRhythm(-1)).toThrow();
        expect(() => e.augmentRhythm(0)).not.toThrow();
        expect(() => e.augmentRhythm(Infinity)).toThrow();
    });

    const table: [ string, number, number, number, number, number ][] = [
        [ '0.5 halves values', 0.5, 6, 25, 50, 100 ],
        [ '1 leaves same duration', 1, 12, 50, 100, 200 ],
        [ '2.5 increases duration by 2.5', 2.5, 30, 125, 250, 500 ],
    ];

    test.each(table)('%s', (_, n, newDuration, newDelay, newBeforeOffset, newAfterOffset) => {
        expect(e.augmentRhythm(n)).toStrictEqual(MelodyMember.from({
            pitch: [ 60 ],
            duration: newDuration,
            velocity: 32,
            delay: newDelay,
            before: [ { event: 'sustain', value: 1, offset: newBeforeOffset } ],
            after: [ { event: 'end-track', offset: newAfterOffset } ],
        }));
    });
});

describe('MelodyMember.diminishRhythm() tests', () => {
    const e = MelodyMember.from({
        pitch: [ 60 ],
        duration: 12,
        velocity: 32,
        delay: 50,
        before: [ { event: 'sustain', value: 1, offset: 100 } ],
        after: [ { event: 'end-track', offset: 200 } ],
    });

    test('diminishing rhythm by a value not a finite positive number fails', () => {
        expect(() => e.diminishRhythm('1' as unknown as number)).toThrow();
        expect(() => e.diminishRhythm(-1)).toThrow();
        expect(() => e.diminishRhythm(0)).toThrow();
        expect(() => e.diminishRhythm(Infinity)).toThrow();
    });

    const table: [ string, number, number, number, number, number ][] = [
        [ '0.4 increases duration by 2.5', 0.4, 30, 125, 250, 500 ],
        [ '1 leaves same values', 1, 12, 50, 100, 200 ],
        [ '2 halves values', 2, 6, 25, 50, 100 ],
    ];

    test.each(table)('%s', (_, n, newDuration, newDelay, newBeforeOffset, newAfterOffset) => {
        expect(e.diminishRhythm(n)).toStrictEqual(MelodyMember.from({
            pitch: [ 60 ],
            duration: newDuration,
            velocity: 32,
            delay: newDelay,
            before: [ { event: 'sustain', value: 1, offset: newBeforeOffset } ],
            after: [ { event: 'end-track', offset: newAfterOffset } ],
        }));
    });
});

describe('MelodyMember.validate() tests', () => {
    const fn = (v: number) => v !== 1;

    test('does not run test when values are empty', () => {
        expect(MelodyMember.from([]).validate(fn)).toBe(true);
    });

    test('passing test', () => {
        expect(MelodyMember.from([ 0, 3, 4 ]).validate(fn)).toBe(true);
    });

    test('failing test', () => {
        expect(MelodyMember.from([ 1, 2, 6 ]).validate(fn)).toBe(false);
    });
});

describe('MelodyMember.describe() tests', () => {
    test('describes correctly', () => {
        expect(MelodyMember.from([14,15,16]).describe())
            .toStrictEqual('MelodyMember({pitch:ChordSeqMember([14,15,16]),velocity:64,duration:16,at:undefined,offset:0,delay:0,before:MetaList(length=0)([]),after:MetaList(length=0)([])})');
        expect(MelodyMember.from({
            pitch: [],
            velocity: 32,
            duration: 48,
            at: 0,
            offset: 80,
            delay: 96,
            before: MetaList.from([ { event: 'sustain', value: 1 } ]),
            after: MetaList.from([ { event: 'sustain', value: 0 } ]),
        }).describe())
            .toStrictEqual('MelodyMember({pitch:ChordSeqMember([]),velocity:32,duration:48,at:0,offset:80,delay:96,before:MetaList(length=1)([0: MetaEvent({event:"sustain",value:1,at:undefined,offset:undefined}),]),after:MetaList(length=1)([0: MetaEvent({event:"sustain",value:0,at:undefined,offset:undefined}),])})');
    });
});