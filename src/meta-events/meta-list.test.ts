import type { MetaEventArg, MetaEventOpts, MetaListArg } from '../types';

import MetaEvent from './meta-event';
import MetaList from './meta-list';

const EVT_VAL1: MetaEventArg = { event: 'sustain', value: 0 };             // Definition for MetaEvent 1
const EVT_VAL2: MetaEventArg = { event: 'sustain', value: 1, offset: 32 }; // Definition for MetaEvent 2
const EVT_VAL3: MetaEventArg = { event: 'end-track' };                     // Definition for MetaEvent 3
const EVT_OB1  = MetaEvent.from(EVT_VAL1);                    // MetaEvent 1
const EVT_OB2  = MetaEvent.from(EVT_VAL2);                    // MetaEvent 2
const EVT_OB3  = MetaEvent.from(EVT_VAL3);                    // MetaEvent 3
const ML_NULL  = MetaList.from([]);                           // Empty MetaList
const ML_1     = MetaList.from([ EVT_OB1 ]);                  // MetaList containing MetaEvent 1
const ML_23    = MetaList.from([ EVT_OB2, EVT_OB3 ]);         // MetaList containing MetaEvent 2 & 3

describe('MetaList.from() static method tests', () => {
    const errortable: [ string, unknown ][] = [
        [ 'numeric value', 55 ],
        [ 'meta event description', EVT_VAL1 ],
        [ 'meta event', EVT_OB1 ],
        [ 'array containing non-meta-events', [ EVT_OB1, 55, EVT_OB3 ] ],
    ];

    test.each(errortable)('constructing MetaList from %s should fail', (_, val) => {
        expect(() => MetaList.from(val as MetaEvent[])).toThrow();
    });

    test('return shared empty metalist when constructing empty MetaList', () => {
        expect(MetaList.from()).toBe(MetaList.EMPTY_META_LIST);
        expect(MetaList.from([])).toBe(MetaList.EMPTY_META_LIST);
    });

    test('returns argument passed if it is a MetaList', () => {
        expect(MetaList.from(ML_23)).toBe(ML_23);
    });

    test('returns new deep frozen MetaList if passed an array of MetaEvents and values', () => {
        const m = MetaList.from([ EVT_VAL1, EVT_OB2, EVT_VAL3, EVT_OB1 ]);

        expect(m.contents).toStrictEqual([ EVT_OB1, EVT_OB2, EVT_OB3, EVT_OB1 ]);
        expect(Object.isFrozen(m)).toBe(true);
        expect(Object.isFrozen(m.contents)).toBe(true);
    });
});

describe('MetaList.withNewEvent() tests', () => {
    const table3arg: [ string, MetaList, string | MetaEventArg, number | undefined, MetaEventOpts | undefined, MetaEvent[] ][] = [
        [
            'adding event without metadata to empty MetaList',
            ML_NULL,
            'sustain',
            1,
            undefined,
            [ MetaEvent.from({ event: 'sustain', value: 1 }) ]
        ],
        [
            'adding event with metadata to MetaList with one event',
            ML_1,
            'sustain',
            0,
            { offset: 64 },
            [ EVT_OB1, MetaEvent.from({ event: 'sustain', value: 0, offset: 64 }) ],
        ],
        [
            'adding event with no argument but with metadata to MetaList with two events',
            ML_23,
            'end-track',
            undefined,
            { at: 1024 },
            [ EVT_OB2, EVT_OB3, MetaEvent.from({ event: 'end-track', at: 1024 }) ],
        ],
        [
            'adding event with metadata in one-argument form',
            ML_1,
            { event: 'sustain', value: 0, offset: 64 },
            undefined,
            undefined,
            [ EVT_OB1, MetaEvent.from({ event: 'sustain', value: 0, offset: 64 }) ],
        ]
    ];

    test.each(table3arg)('withNewEvent() multiple argument: %s', (_, ml, me, val, meta, ret) => {
        expect(ml.withNewEvent(me, val, meta)).toEqual(MetaList.from(ret));
    });
});

describe('MetaList.withNewEvents() tests', () => {
    const errortable: [ string, MetaList, MetaListArg ][] = [
        [ 'adding array of MetaLists', ML_NULL, [ ML_1 ] as unknown as MetaListArg ],
        [ 'adding number', ML_1, 55 as unknown as MetaListArg ],
        [ 'adding array including event', ML_1, [ EVT_VAL1, EVT_VAL2, { event: 'cat', value: 'meow' } ] as unknown as MetaListArg ],
        [ 'adding event', ML_NULL, EVT_VAL1 as unknown as MetaListArg ],
    ];

    test.each(errortable)('throws when %s', (_, ml, me) => {
        expect(() => ml.withNewEvents(me)).toThrow();
    });

    const table1arg: [ string, MetaList, MetaListArg, MetaEvent[] ][] = [
        [ 'adding no events to MetaList without events', ML_NULL, [], [] ],
        [ 'adding array of one event description to MetaList without events', ML_NULL, [ EVT_VAL1 ], [ EVT_OB1 ] ],
        [ 'adding array of one event to MetaList without events', ML_NULL, [ EVT_OB1 ], [ EVT_OB1 ] ],
        [ 'adding one MetaList to MetaList without events', ML_NULL, ML_1, [ EVT_OB1 ] ],
        [ 'adding array of two event descriptions to MetaList with one event', ML_1, [ EVT_VAL2, EVT_VAL3 ], [ EVT_OB1, EVT_OB2, EVT_OB3 ] ],
        [ 'adding array of two events to MetaList with one event', ML_1, [ EVT_OB2, EVT_OB3 ], [ EVT_OB1, EVT_OB2, EVT_OB3 ] ],
        [ 'adding array of one event and one event description to MetaList with one event', ML_1, [ EVT_OB2, EVT_VAL3 ], [ EVT_OB1, EVT_OB2, EVT_OB3 ] ],
        [ 'adding one MetaList to MetaList with one event', ML_1, ML_23, [ EVT_OB1, EVT_OB2, EVT_OB3 ] ],
        [ 'adding empty array to MetaList with two events', ML_23, [], [ EVT_OB2, EVT_OB3 ] ],
        [ 'adding array with two events to MetaList with two events', ML_23, [ EVT_OB1, EVT_OB3 ], [ EVT_OB2, EVT_OB3, EVT_OB1, EVT_OB3 ] ],
    ];

    test.each(table1arg)('%s', (_, ml, me, ret) => {
        expect(ml.withNewEvents(me)).toEqual(MetaList.from(ret));
    });
});

describe('MetaList.equals() tests', () => {
    const table: [ string, MetaList, MetaList, boolean ][] = [
        [
            'empty metalists are identical',
            MetaList.from([]),
            MetaList.from([]),
            true
        ],
        [
            'MetaList is not equal to non-MetaList',
            MetaList.from([]),
            [] as unknown as MetaList,
            false
        ],
        [
            'MetaLists of different lengths are unequal',
            MetaList.from([]),
            MetaList.from([ EVT_OB1 ]),
            false
        ],
        [
            'MetaLists with identical content are equal',
            MetaList.from([ EVT_OB1, EVT_OB2 ]),
            MetaList.from([ EVT_OB1, EVT_OB2 ]),
            true
        ],
        [
            'MetaLists with identical content but reverse order are unequal',
            MetaList.from([ EVT_OB2, EVT_OB1 ]),
            MetaList.from([ EVT_OB1, EVT_OB2 ]),
            false
        ],
    ];

    test.each(table)('%s', (_, ML_1, ML_2, ret) => {
        expect(ML_1.equals(ML_2)).toStrictEqual(ret);
    });
});

describe('MetaList.augmentRhythm() tests', () => {
    test('throws if argument is non-numeric', () => {
        expect(() => MetaList.from([]).augmentRhythm('1' as unknown as number)).toThrow();
    });

    test('returns self if empty', () => {
        const empty = MetaList.from([]);

        expect(empty.augmentRhythm(4)).toBe(empty);
    });

    const table: [ string, MetaEvent[], number, MetaEvent[] ][] = [
        [
            'doubles all offsets',
            [
                MetaEvent.from({ event: 'sustain', value: 1 }),
                MetaEvent.from({ event: 'sustain', value: 0, offset: 16 }),
            ],
            2,
            [
                MetaEvent.from({ event: 'sustain', value: 1 }),
                MetaEvent.from({ event: 'sustain', value: 0, offset: 32 }),
            ],
        ],
        [
            'halves all offsets',
            [
                MetaEvent.from({ event: 'sustain', value: 1 }),
                MetaEvent.from({ event: 'sustain', value: 0, offset: 16 }),
                MetaEvent.from({ event: 'sustain', value: 1, offset: 64 }),
            ],
            0.5,
            [
                MetaEvent.from({ event: 'sustain', value: 1 }),
                MetaEvent.from({ event: 'sustain', value: 0, offset: 8 }),
                MetaEvent.from({ event: 'sustain', value: 1, offset: 32 }),
            ],
        ],
    ];

    test.each(table)('%s', (_, ml, v, ret) => {
        expect(MetaList.from(ml).augmentRhythm(v)).toStrictEqual(MetaList.from(ret));
    });
});

describe('MetaList.diminishRhythm() tests', () => {
    test('throws if argument is non-numeric', () => {
        expect(() => MetaList.from([]).diminishRhythm('1' as unknown as number)).toThrow();
    });

    test('returns self if empty', () => {
        const empty = MetaList.from([]);

        expect(empty.diminishRhythm(4)).toBe(empty);
    });

    const table: [ string, MetaEvent[], number, MetaEvent[] ][] = [
        [
            'halves all offsets',
            [
                MetaEvent.from({ event: 'sustain', value: 1 }),
                MetaEvent.from({ event: 'sustain', value: 0, offset: 16 }),
            ],
            2,
            [
                MetaEvent.from({ event: 'sustain', value: 1 }),
                MetaEvent.from({ event: 'sustain', value: 0, offset: 8 }),
            ],
        ],
        [
            'doubles all offsets',
            [
                MetaEvent.from({ event: 'sustain', value: 1 }),
                MetaEvent.from({ event: 'sustain', value: 0, offset: 16 }),
                MetaEvent.from({ event: 'sustain', value: 1, offset: 64 }),
            ],
            0.5,
            [
                MetaEvent.from({ event: 'sustain', value: 1 }),
                MetaEvent.from({ event: 'sustain', value: 0, offset: 32 }),
                MetaEvent.from({ event: 'sustain', value: 1, offset: 128 }),
            ],
        ],
    ];

    test.each(table)('%s', (_, ml, v, ret) => {
        expect(MetaList.from(ml).diminishRhythm(v)).toStrictEqual(MetaList.from(ret));
    });
});

describe('MetaList.withAllTicksExact()', () => {
    test('fails with non-integer argument', () => {
        expect(() => MetaList.from([]).withAllTicksExact(1.5)).toThrow();
    });

    test('returns self if empty', () => {
        const empty = MetaList.from([]);

        expect(empty.withAllTicksExact(0)).toBe(empty);
    });

    test('with all ticks converted to exact ones', () => {
        expect(MetaList.from([
            { event: 'text', value: 'test 1' },
            { event: 'text', value: 'test 2', offset: 64 },
            { event: 'text', value: 'test 3', at: 128, offset: 64 }
        ]).withAllTicksExact(200)).toStrictEqual(
            MetaList.from([
                { event: 'text', value: 'test 1', at: 200 },
                { event: 'text', value: 'test 2', at: 264 },
                { event: 'text', value: 'test 3', at: 192 }
            ])
        );
    });
});

// inherited from CollectionWithoutMetadata
describe('MetaList.describe()', () => {
    test('empty MetaList', () => {
        expect(MetaList.from([]).describe()).toStrictEqual('MetaList(length=0)([])');
    });

    test('non-empty MetaList', () => {
        expect(MetaList.from([
            { event: 'instrument', value: 'violin', at: 64, offset: 32 },
            { event: 'end-track' },
        ]).describe())
            .toStrictEqual('MetaList(length=2)([0: MetaEvent({event:"instrument",value:"violin",at:64,offset:32}),1: MetaEvent({event:"end-track",value:undefined,at:undefined,offset:undefined}),])');
    });
});