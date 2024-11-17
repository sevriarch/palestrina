import type { MetaEventArg } from '../types';

import MetaEvent from './meta-event';

describe('MetaEvent.from() tests', () => {
    const data: MetaEventArg = { event: 'tempo', value: 120, at: 300 };
    const me = MetaEvent.from(data);

    test('MetaEvent.from() with MetaEvent argument returns passed object', () => {
        expect(MetaEvent.from(me)).toBe(me);
    });

    test('MetaEvent.from() creates correctly', () => {
        expect(MetaEvent.from(data)).toStrictEqual(me);
    });
});

describe('MetaEvent constructor/.val() tests', () => {
    const table: [ MetaEventArg, boolean ][] = [
        // Invalid argument format
        [ null as unknown as MetaEventArg, false ],
        [ 55 as unknown as MetaEventArg , false ],
        [ [ { event: 'sustain' } ] as unknown as MetaEventArg, false ],

        // Missing required parameters
        [ {} as unknown as MetaEventArg, false ],

        // Extra parameter
        [ { event: 'sustain', foo: 55 } as unknown as MetaEventArg, false ],

        // All valid parameters
        [ { event: 'sustain', value: 0 }, true ],

        // Valid/invalid values for event
        [ { event: 'sustain' } as unknown as MetaEventArg, false ],
        [ { event: 500 } as unknown as MetaEventArg, false ],
        [ { event: [ 'sustain' ] } as unknown as MetaEventArg, false ],
        [ { event: 'meow' } as unknown as MetaEventArg, false ],

        // Valid/invalid values associated with event
        [ { event: 'sustain', value: 'meow' } as unknown as MetaEventArg, false ],
        [ { event: 'sustain', value: -1 }, false ],
        [ { event: 'sustain', value: 2 }, false ],
        [ { event: 'sustain', value: 0 }, true ],
        [ { event: 'sustain', value: 1 }, true ],
        [ { event: 'tempo', value: 'meow' } as unknown as MetaEventArg, false ],
        [ { event: 'tempo', value: 0 }, false ],
        [ { event: 'tempo', value: Infinity }, false ],
        [ { event: 'tempo', value: 0.5 }, true ],
        [ { event: 'tempo', value: 160 }, true ],
        [ { event: 'key-signature', value: 5000 as unknown as string }, false ],
        [ { event: 'key-signature', value: 'H' }, false ],
        [ { event: 'key-signature', value: 'fb' }, false ],
        [ { event: 'key-signature', value: 'C#' }, true ],
        [ { event: 'time-signature', value: 31 as unknown as string }, false ],
        [ { event: 'time-signature', value: '1/6' }, false ],
        [ { event: 'time-signature', value: '0/16' }, false ],
        [ { event: 'time-signature', value: '1/1' }, true ],
        [ { event: 'time-signature', value: '7/8' }, true ],
        [ { event: 'instrument', value: null as unknown as string }, false ],
        [ { event: 'instrument', value: 'meowphone' }, false ],
        [ { event: 'instrument', value: 'violin' }, true ],
        [ { event: 'instrument', value: -1 }, false ],
        [ { event: 'instrument', value: 0x100 }, false ],
        [ { event: 'text', value: null as unknown as string }, false ],
        [ { event: 'text', value: 'bar' }, true ],
        [ { event: 'lyric', value: null as unknown as string }, false ],
        [ { event: 'lyric', value: 'bar' }, true ],
        [ { event: 'marker', value: null as unknown as string }, false ],
        [ { event: 'marker', value: 'bar' }, true ],
        [ { event: 'cue-point', value: null as unknown as string }, false ],
        [ { event: 'cue-point', value: 'bar' }, true ],
        [ { event: 'copyright', value: null as unknown as string }, false ],
        [ { event: 'copyright', value: 'bar' }, true ],
        [ { event: 'track-name', value: null as unknown as string }, false ],
        [ { event: 'track-name', value: 'bar' }, true ],
        [ { event: 'volume', value: '0' as unknown as number }, false ],
        [ { event: 'volume', value: 0.5 }, false ],
        [ { event: 'volume', value: -1 }, false ],
        [ { event: 'volume', value: 128 }, false ],
        [ { event: 'volume', value: 0 }, true ],
        [ { event: 'volume', value: 127 }, true ],
        [ { event: 'pan', value: '0' as unknown as number }, false ],
        [ { event: 'pan', value: 0.5 }, false ],
        [ { event: 'pan', value: -1 }, false ],
        [ { event: 'pan', value: 128 }, false ],
        [ { event: 'pan', value: 0 }, true ],
        [ { event: 'pan', value: 127 }, true ],
        [ { event: 'balance', value: '0' as unknown as number }, false ],
        [ { event: 'balance', value: 0.5 }, false ],
        [ { event: 'balance', value: -1 }, false ],
        [ { event: 'balance', value: 128 }, false ],
        [ { event: 'balance', value: 0 }, true ],
        [ { event: 'balance', value: 127 }, true ],
        [ { event: 'pitch-bend', value: '0' as unknown as number }, false ],
        [ { event: 'pitch-bend', value: 0.5 }, false ],
        [ { event: 'pitch-bend', value: -16385 }, false ],
        [ { event: 'pitch-bend', value: 16384 }, false ],
        [ { event: 'pitch-bend', value: -16384 }, true ],
        [ { event: 'pitch-bend', value: 16383 }, true ],
        [ { event: 'end-track' }, true ],

        // Valid/invalid values for offset
        [ { event: 'sustain', value: 0, offset: 0 }, true ],
        [ { event: 'sustain', value: 0, offset: -64 }, true ],
        [ { event: 'sustain', value: 0, offset: 64 }, true ],
        [ { event: 'sustain', value: 0, offset: 64.5 }, false ],
        [ { event: 'sustain', value: 0, offset: '64' as unknown as number }, false ],

        // Valid/invalid values for at
        [ { event: 'sustain', value: 0, offset: 0, at: 0 }, true ],
        [ { event: 'sustain', value: 0, offset: 0, at: -64 }, false ],
        [ { event: 'sustain', value: 0, offset: 0, at: 64 }, true ],
        [ { event: 'sustain', value: 0, offset: 0, at: 64.5 }, false ],
        [ { event: 'sustain', value: 0, offset: 0, at: '64' as unknown as number }, false ],
    ];

    test('expect instrument meta-event with number passed to convert to a string', () => {
        expect(MetaEvent.from({ event: 'instrument', value: 0x39, at: 40 }))
            .toStrictEqual(MetaEvent.from({ event: 'instrument', value: 'trombone', at: 40 }));
    });

    test.each(table)('constructor(%p)', (meta, ret) => {
        if (!ret) {
            expect(() => MetaEvent.from(meta)).toThrow();
        } else {
            const m1 = MetaEvent.from(meta);

            const cmp = {
                value: undefined,
                offset: 0,
                at: undefined,
                ...meta
            };

            expect(m1.event).toEqual(cmp.event);
            expect(m1.value).toEqual(cmp.value);
            expect(m1.offset).toEqual(cmp.offset);
            expect(m1.at).toEqual(cmp.at);
            expect(Object.isFrozen(m1)).toBe(true);
        }
    });
});

describe('MetaEvent.withOffset() tests', () => {
    test('sets offset when was not previously set', () => {
        expect(MetaEvent.from({ event: 'sustain', value: 0 }).withOffset(5))
            .toStrictEqual(MetaEvent.from({ event: 'sustain', value: 0, offset: 5 }));
    });

    test('sets offset when was previously set', () => {
        expect(MetaEvent.from({ event: 'sustain', value: 0, offset: 3 }).withOffset(5))
            .toStrictEqual(MetaEvent.from({ event: 'sustain', value: 0, offset: 5 }));
    });
});

describe('MetaEvent.equals() tests', () => {
    const DEF: MetaEventArg = { event: 'sustain', value: 0, offset: 0 };

    function make(v: Record<string, unknown>): MetaEvent {
        return MetaEvent.from({ ...DEF, ...v });
    }

    const table: [ MetaEvent, boolean ][] = [
        [ DEF as MetaEvent, false ],
        [ make({}), true ],
        [ make({ event: 'balance' }), false ],
        [ make({ value: 1 }), false ],
        [ make({ offset: -60 }), false ],
        [ make({ at: 0 }), false ],
    ];

    const e1 = make({});

    test.each(table)('equals() %#', (e2, ret) => {
        expect(e1.equals(e2)).toStrictEqual(ret);
    });
});

describe('MetaEvent.describe() tests', () => {
    test('describes correctly', () => {
        expect(MetaEvent.from({ event: 'end-track' }).describe())
            .toStrictEqual('MetaEvent({event:"end-track",value:undefined,at:undefined,offset:0})');

        expect(MetaEvent.from({ event: 'instrument', value: 'violin', offset: 64, at: 64 }).describe())
            .toStrictEqual('MetaEvent({event:"instrument",value:"violin",at:64,offset:64})');

        expect(MetaEvent.from({ event: 'sustain', value: 0, at: 0 }).describe())
            .toStrictEqual('MetaEvent({event:"sustain",value:0,at:0,offset:0})');
    });
});