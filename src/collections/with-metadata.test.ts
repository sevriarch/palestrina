import type { MetaEventArg } from '../types';

import Collection from './with-metadata';

import MetaList from '../meta-events/meta-list';
import MetaEvent from '../meta-events/meta-event';
import Metadata from '../metadata/metadata';

import NumericValidator from '../validation/numeric';
import { DEFAULTS } from '../constants';

/**
 * TESTING METADATA FUNCTIONALITY
 */
describe('Collection constructor tests', () => {
    test('constructing without metadata gives only default metadata values', () => {
        const m = new Collection([], Metadata.EMPTY_METADATA);

        expect(m.metadata.midichannel).toBe(1);
        expect(m.metadata.before).toBe(MetaList.EMPTY_META_LIST);
        expect(m.metadata.ticks_per_quarter).toBe(DEFAULTS.TICKS_PER_QUARTER);
        expect(m.metadata.validator).toBe(NumericValidator.INT_VALIDATOR);
        expect(m.metadata.tempo).toBe(undefined);
        expect(m.metadata.time_signature).toBe(undefined);
        expect(m.metadata.key_signature).toBe(undefined);
        expect(m.metadata.copyright).toBe(undefined);
        expect(m.metadata.trackname).toBe(undefined);
        expect(m.metadata.instrument).toBe(undefined);
    });

    const meta = {
        midichannel: 5,
        before: MetaList.from([ { event: 'end-track' } ]),
        ticks_per_quarter: 1200,
        tempo: 136,
        time_signature: '5/8',
        key_signature: 'E',
        copyright: 'test copyright',
        trackname: 'test trackname',
        instrument: 'test instrument',
        validator: NumericValidator.NOOP_VALIDATOR
    };

    test('constructing with much metadata works as expected', () => {
        const m = new Collection([], Metadata.from(meta));

        expect(m.metadata.midichannel).toBe(5);
        expect(m.metadata.before).toStrictEqual(MetaList.from([ { event: 'end-track' } ]));
        expect(m.metadata.ticks_per_quarter).toBe(1200);
        expect(m.metadata.validator).toBe(NumericValidator.NOOP_VALIDATOR);
        expect(m.metadata.tempo).toBe(136);
        expect(m.metadata.time_signature).toBe('5/8');
        expect(m.metadata.key_signature).toBe('E');
        expect(m.metadata.copyright).toBe('test copyright');
        expect(m.metadata.trackname).toBe('test trackname');
        expect(m.metadata.instrument).toBe('test instrument');
    });
});

describe('Collection.withCopyright() tests', () => {
    const meta = new Collection([], Metadata.EMPTY_METADATA);

    test('non-string copyright throws an error', () => {
        expect(() => meta.withCopyright(555 as unknown as string)).toThrow();
    });

    test('string copyright works correctly', () => {
        expect(meta.withCopyright('this is rubbish').metadata.copyright).toEqual('this is rubbish');
    });

    test('string copyright does not overwrite other metadata', () => {
        const meta2 = new Collection([], Metadata.from({ trackname: 'foobar', copyright: 'squelch' })).withCopyright('gazonk');

        expect(meta2.metadata.copyright).toEqual('gazonk');
        expect(meta2.metadata.trackname).toEqual('foobar');
    });
});

describe('Collection.withTrackName() tests', () => {
    const meta = new Collection([], Metadata.EMPTY_METADATA);

    test('non-string trackname throws an error', () => {
        expect(() => meta.withTrackName(555 as unknown as string)).toThrow();
    });

    test('string trackname works correctly', () => {
        expect(meta.withTrackName('this is rubbish').metadata.trackname).toEqual('this is rubbish');
    });

    test('string trackname does not overwrite other metadata', () => {
        const meta2 = new Collection([], Metadata.from({ copyright: 'foobar', trackname: 'xxx' })).withTrackName('gazonk');

        expect(meta2.metadata.copyright).toEqual('foobar');
        expect(meta2.metadata.trackname).toEqual('gazonk');
    });
});

describe('Collection.withTimeSignature() tests', () => {
    const meta = new Collection([], Metadata.EMPTY_METADATA);

    test('non-string time signature throws an error', () => {
        expect(() => meta.withTrackName(555 as unknown as string)).toThrow();
    });

    test('string time signature works correctly', () => {
        expect(meta.withTimeSignature('9/8').metadata.time_signature).toEqual('9/8');
    });

    test('string trackname does not overwrite other metadata', () => {
        const meta2 = new Collection([], Metadata.from({ copyright: 'foobar', time_signature: '2/4' })).withTimeSignature('4/4');

        expect(meta2.metadata.copyright).toEqual('foobar');
        expect(meta2.metadata.time_signature).toEqual('4/4');
    });
});

describe('Collection.withKeySignature() tests', () => {
    const meta = new Collection([], Metadata.EMPTY_METADATA);

    test('non-string time signature throws an error', () => {
        expect(() => meta.withTrackName(555 as unknown as string)).toThrow();
    });

    test('string time signature works correctly', () => {
        expect(meta.withKeySignature('F').metadata.key_signature).toEqual('F');
    });

    test('string trackname does not overwrite other metadata', () => {
        const meta2 = new Collection([], Metadata.from({ copyright: 'foobar', key_signature: 'D' })).withKeySignature('E');

        expect(meta2.metadata.copyright).toEqual('foobar');
        expect(meta2.metadata.key_signature).toEqual('E');
    });
});

describe('Collection.withMidiChannel() tests', () => {
    const meta = new Collection([], Metadata.EMPTY_METADATA);

    test('non-numeric channel throws an error', () => {
        expect(() => meta.withMidiChannel('16' as unknown as number)).toThrow();
    });

    test('non-integer channel throws an error', () => {
        expect(() => meta.withMidiChannel(1.6)).toThrow();
    });

    test('too low channel throws an error', () => {
        expect(() => meta.withMidiChannel(0)).toThrow();
    });

    test('too high channel throws an error', () => {
        expect(() => meta.withMidiChannel(17)).toThrow();
    });

    test('valid channel works correctly', () => {
        expect(meta.withMidiChannel(16).metadata.midichannel).toEqual(16);
    });

    test('string trackname does not overwrite other metadata', () => {
        const meta2 = new Collection([], Metadata.from({ copyright: 'foobar'})).withTrackName('gazonk').withMidiChannel(16);

        expect(meta2.metadata.copyright).toEqual('foobar');
        expect(meta2.metadata.trackname).toEqual('gazonk');
        expect(meta2.metadata.midichannel).toEqual(16);
    });
});

describe('Collection.withTempo() tests', () => {
    const meta = new Collection([], Metadata.EMPTY_METADATA);

    test('invalid tempo throws an error', () => {
        expect(() => meta.withTempo('555' as unknown as number)).toThrow();
        expect(() => meta.withTempo(0)).toThrow();
    });

    test('valid tempo signature works correctly', () => {
        expect(meta.withTempo(144).metadata.tempo).toEqual(144);
    });

    test('string trackname does not overwrite other metadata', () => {
        const meta2 = new Collection([], Metadata.from({ copyright: 'foobar', tempo: 108 })).withTempo(120);

        expect(meta2.metadata.copyright).toEqual('foobar');
        expect(meta2.metadata.tempo).toEqual(120);
    });
});

describe('Collection.withInstrument() tests', () => {
    const meta = new Collection([], Metadata.EMPTY_METADATA);

    test('invalid instrument throws an error', () => {
        expect(() => meta.withInstrument(555 as unknown as string)).toThrow();
    });

    test('string instrument works correctly', () => {
        expect(meta.withInstrument('piano').metadata.instrument).toEqual('piano');
    });

    test('string trackname does not overwrite other metadata', () => {
        const meta2 = new Collection([], Metadata.from({ copyright: 'foobar', instrument: 'piano' })).withInstrument('violin');

        expect(meta2.metadata.copyright).toEqual('foobar');
        expect(meta2.metadata.instrument).toEqual('violin');
    });

    test('numeric non-percussion instrument works correctly', () => {
        expect(meta.withInstrument(60).metadata.instrument).toEqual('horn');
    });

    test('numeric non-percussion instrument works correctly', () => {
        expect(meta.withMidiChannel(10).withInstrument(60).metadata.instrument).toEqual('high bongo');
    });
});

describe('Collection.withNewEvent() tests', () => {
    const meta = new Collection([], Metadata.EMPTY_METADATA);

    test('invalid arguments throw an error', () => {
        expect(() => meta.withNewEvent(5000 as unknown as MetaEventArg)).toThrow();
    });

    test('adding one event using two-argument form works', () => {
        expect(meta.withNewEvent('sustain', 1).metadata.before).toStrictEqual(
            MetaList.from([
                MetaEvent.from({ event: 'sustain', value: 1 })
            ])
        );
    });

    test('adding one event using three-argument form works', () => {
        expect(meta.withNewEvent('sustain', 1, { offset: 16 }).metadata.before).toStrictEqual(
            MetaList.from([
                MetaEvent.from({ event: 'sustain', value: 1, offset: 16 })
            ])
        );
    });

    test('adding two events using three-argument form works', () => {
        expect(meta.withNewEvent('sustain', 1)
            .withNewEvent('sustain', 0, { at: 2048 }).metadata.before).toStrictEqual(
            MetaList.from([
                MetaEvent.from({ event: 'sustain', value: 1 }),
                MetaEvent.from({ event: 'sustain', value: 0, at: 2048 }),
            ])
        );
    });

    test('adding one event using one-argument form once works', () => {
        expect(meta.withNewEvent({ event: 'sustain', value: 1 }).metadata.before).toStrictEqual(
            MetaList.from([
                MetaEvent.from({ event: 'sustain', value: 1 })
            ])
        );
    });
});

describe('Collection.withNewEvents()', () => {
    const meta = new Collection([], Metadata.EMPTY_METADATA);

    test('adding two events works', () => {
        expect(meta.withNewEvents([
            { event: 'sustain', value: 1 },
            { event: 'sustain', value: 0, offset: 2048 }
        ]).metadata.before).toStrictEqual(
            MetaList.from([
                MetaEvent.from({ event: 'sustain', value: 1 }),
                MetaEvent.from({ event: 'sustain', value: 0, offset: 2048 }),
            ])
        );
    });

    test('adding events with two calls works', () => {
        expect(meta.withNewEvents([
            { event: 'sustain', value: 1 },
            { event: 'sustain', value: 0, offset: 2048 }
        ]).withNewEvents([
            { event: 'time-signature', value: '3/4', at: 0 }
        ]).metadata.before).toStrictEqual(
            MetaList.from([
                MetaEvent.from({ event: 'sustain', value: 1 }),
                MetaEvent.from({ event: 'sustain', value: 0, offset: 2048 }),
                MetaEvent.from({ event: 'time-signature', value: '3/4', at: 0 })
            ])
        );
    });
});

describe('Collection.withMetadataTicksExact()', () => {
    test('no before', () => {
        const m = new Collection([ 1, 2, 3 ], Metadata.from({ ticks_per_quarter: 640 }));

        expect(m.withMetadataTicksExact()).toBe(m);
    });

    test('with before', () => {
        expect(new Collection([ 1, 2, 3 ], Metadata.from({
            before: MetaList.from([
                { event: 'text', value: 'test 1' },
                { event: 'text', value: 'test 2', offset: 64 },
                { event: 'text', value: 'test 3', at: 128, offset: 64 }
            ])
        }).withAllTicksExact())).toStrictEqual(new Collection([ 1, 2, 3 ], Metadata.from({
            before: MetaList.from([
                { event: 'text', value: 'test 1', at: 0 },
                { event: 'text', value: 'test 2', at: 64 },
                { event: 'text', value: 'test 3', at: 192 }
            ])
        })));
    });
});

describe('Collection.mergeMetadataFrom()', () => {
    const c = new Collection([ 1, 5, 4 ], Metadata.EMPTY_METADATA);

    test('merges empty metadata', () => {
        expect(c.mergeMetadataFrom(c)).toStrictEqual(c);
    });

    test('merges one item', () => {
        expect(c.mergeMetadataFrom(c.withCopyright('test'))).toStrictEqual(c.withCopyright('test'));
    });

    test('keeps metadata not merged in', () => {
        expect(c.withMidiChannel(10).mergeMetadataFrom(c.withCopyright('test'))).toStrictEqual(c.withMidiChannel(10).withCopyright('test'));
    });

    test('does not overwrite metadata', () => {
        expect(c.withMidiChannel(10).mergeMetadataFrom(c.withMidiChannel(1).withCopyright('test'))).toStrictEqual(c.withMidiChannel(10).withCopyright('test'));
    });

    test('merges befores as expected', () => {
        expect(c.withNewEvent({ event: 'sustain', value: 0, at: 128 }).mergeMetadataFrom(c.withNewEvent({ event: 'sustain', value: 1 })))
            .toStrictEqual(c.withNewEvents(MetaList.from([ { event: 'sustain', value: 1 }, { event: 'sustain', value: 0, at: 128 }])));
    });
});

/**
 * TESTING THAT METADATA FUNCTIONALITY APPLIES TO COLLECTION METHODS
 */
describe('Collection.clone()', () => {
    test('empties the collection without removing metadata', () => {
        const c = new Collection([ 1, 5, 4 ], Metadata.from({ copyright: 'test' }));
        const copy = c.clone();

        expect(copy).toStrictEqual(c);
        expect(copy).not.toBe(c);
    });
});

describe('Collection.empty()', () => {
    test('empties the collection without removing metadata', () => {
        expect(new Collection([ 1, 5, 4 ], Metadata.from({ copyright: 'test' })).empty())
            .toStrictEqual(new Collection([], Metadata.from({ copyright: 'test' })));
    });
});

describe('Collection.filter()', () => {
    test('does not affect metadata', () => {
        expect(new Collection([ 1, 2, 4, 5 ], Metadata.from({ copyright: 'test' })).filter(v => !(v % 2)))
            .toStrictEqual(new Collection([ 2, 4 ], Metadata.from({ copyright: 'test' })));
    });
});

describe('Collection.keepSlice()', () => {
    test('does not affect metadata', () => {
        expect(new Collection([ 1, 2, 4, 5 ], Metadata.from({ copyright: 'test' })).keepSlice(1, 3))
            .toStrictEqual(new Collection([ 2, 4 ], Metadata.from({ copyright: 'test' })));
    });
});

describe('Collection.keep()', () => {
    test('does not affect metadata', () => {
        expect(new Collection([ 1, 2, 4, 5 ], Metadata.from({ copyright: 'test' })).keep(3))
            .toStrictEqual(new Collection([ 1, 2, 4 ], Metadata.from({ copyright: 'test' })));
    });
});

describe('Collection.keepRight()', () => {
    test('does not affect metadata', () => {
        expect(new Collection([ 1, 2, 4, 5 ], Metadata.from({ copyright: 'test' })).keepRight(3))
            .toStrictEqual(new Collection([ 2, 4, 5 ], Metadata.from({ copyright: 'test' })));
    });
});

describe('Collection.keepIndices()', () => {
    test('does not affect metadata', () => {
        expect(new Collection([ 1, 2, 4, 5 ], Metadata.from({ copyright: 'test' })).keepIndices([ 1, 3 ]))
            .toStrictEqual(new Collection([ 2, 5 ], Metadata.from({ copyright: 'test' })));
    });
});

describe('Collection.keepNth()', () => {
    test('does not affect metadata', () => {
        expect(new Collection([ 1, 2, 4, 5 ], Metadata.from({ copyright: 'test' })).keepNth(3))
            .toStrictEqual(new Collection([ 1, 5 ], Metadata.from({ copyright: 'test' })));
    });
});

describe('Collection.dropSlice()', () => {
    test('does not affect metadata', () => {
        expect(new Collection([ 1, 2, 4, 5 ], Metadata.from({ copyright: 'test' })).dropSlice(1, 3))
            .toStrictEqual(new Collection([ 1, 5 ], Metadata.from({ copyright: 'test' })));
    });
});

describe('Collection.drop()', () => {
    test('does not affect metadata', () => {
        expect(new Collection([ 1, 2, 4, 5 ], Metadata.from({ copyright: 'test' })).drop(3))
            .toStrictEqual(new Collection([ 5 ], Metadata.from({ copyright: 'test' })));
    });
});

describe('Collection.dropRight()', () => {
    test('does not affect metadata', () => {
        expect(new Collection([ 1, 2, 4, 5 ], Metadata.from({ copyright: 'test' })).dropRight(3))
            .toStrictEqual(new Collection([ 1 ], Metadata.from({ copyright: 'test' })));
    });
});

describe('Collection.dropIndices()', () => {
    test('does not affect metadata', () => {
        expect(new Collection([ 1, 2, 4, 5 ], Metadata.from({ copyright: 'test' })).dropIndices([ 1, 3 ]))
            .toStrictEqual(new Collection([ 1, 4 ], Metadata.from({ copyright: 'test' })));
    });
});

describe('Collection.dropNth()', () => {
    test('does not affect metadata', () => {
        expect(new Collection([ 1, 2, 4, 5 ], Metadata.from({ copyright: 'test' })).dropNth(3))
            .toStrictEqual(new Collection([ 2, 4 ], Metadata.from({ copyright: 'test' })));
    });
});

describe('Collection.insertBefore()', () => {
    test('does not affect metadata', () => {
        expect(new Collection([ 1, 2, 4, 5 ], Metadata.from({ copyright: 'test' })).insertBefore(3, 6))
            .toStrictEqual(new Collection([ 1, 2, 4, 6, 5 ], Metadata.from({ copyright: 'test' })));
    });
});

describe('Collection.insertAfter()', () => {
    test('does not affect metadata', () => {
        expect(new Collection([ 1, 2, 4, 5 ], Metadata.from({ copyright: 'test' })).insertAfter(3, 6))
            .toStrictEqual(new Collection([ 1, 2, 4, 5, 6 ], Metadata.from({ copyright: 'test' })));
    });
});

describe('Collection.replaceIndices()', () => {
    test('does not affect metadata', () => {
        expect(new Collection([ 1, 2, 4, 5 ], Metadata.from({ copyright: 'test' })).replaceIndices(3, 6))
            .toStrictEqual(new Collection([ 1, 2, 4, 6 ], Metadata.from({ copyright: 'test' })));
    });
});

describe('Collection.replaceFirstIndex()', () => {
    test('does not affect metadata', () => {
        expect(new Collection([ 1, 2, 4, 5, 4 ], Metadata.from({ copyright: 'test' })).replaceFirstIndex(v => v === 4, 6))
            .toStrictEqual(new Collection([ 1, 2, 6, 5, 4 ], Metadata.from({ copyright: 'test' })));
    });
});

describe('Collection.replaceLastIndex()', () => {
    test('does not affect metadata', () => {
        expect(new Collection([ 1, 2, 4, 5, 4 ], Metadata.from({ copyright: 'test' })).replaceLastIndex(v => v === 4, 6))
            .toStrictEqual(new Collection([ 1, 2, 4, 5, 6 ], Metadata.from({ copyright: 'test' })));
    });
});

describe('Collection.replaceIf()', () => {
    test('does not affect metadata', () => {
        expect(new Collection([ 1, 2, 4, 5, 4 ], Metadata.from({ copyright: 'test' })).replaceIf(v => v === 4, 6))
            .toStrictEqual(new Collection([ 1, 2, 6, 5, 6 ], Metadata.from({ copyright: 'test' })));
    });
});

describe('Collection.replaceNth()', () => {
    test('does not affect metadata', () => {
        expect(new Collection([ 1, 2, 4, 5, 4 ], Metadata.from({ copyright: 'test' })).replaceNth(3, 6))
            .toStrictEqual(new Collection([ 6, 2, 4, 6, 4 ], Metadata.from({ copyright: 'test' })));
    });
});

describe('Collection.replaceSlice()', () => {
    test('does not affect metadata', () => {
        expect(new Collection([ 1, 2, 4, 5, 4 ], Metadata.from({ copyright: 'test' })).replaceSlice(1, 3, 6))
            .toStrictEqual(new Collection([ 1, 6, 5, 4 ], Metadata.from({ copyright: 'test' })));
    });
});

describe('Collection.mapSlice()', () => {
    test('does not affect metadata', () => {
        expect(new Collection([ 1, 2, 4, 5, 4 ], Metadata.from({ copyright: 'test' })).mapSlice(1, 3, v => v + 1))
            .toStrictEqual(new Collection([ 1, 3, 5, 5, 4 ], Metadata.from({ copyright: 'test' })));
    });
});

describe('Collection.append()', () => {
    test('does not affect metadata', () => {
        expect(new Collection([ 1, 2, 4, 5, 4 ], Metadata.from({ copyright: 'test' })).append(new Collection([ 7, 8 ], Metadata.EMPTY_METADATA)))
            .toStrictEqual(new Collection([ 1, 2, 4, 5, 4, 7, 8 ], Metadata.from({ copyright: 'test' })));
    });
});

describe('Collection.appendItems()', () => {
    test('does not affect metadata', () => {
        expect(new Collection([ 1, 2, 4, 5, 4 ], Metadata.from({ copyright: 'test' })).appendItems(7, 8))
            .toStrictEqual(new Collection([ 1, 2, 4, 5, 4, 7, 8 ], Metadata.from({ copyright: 'test' })));
    });
});

describe('Collection.prepend()', () => {
    test('does not affect metadata', () => {
        expect(new Collection([ 1, 2, 4, 5, 4 ], Metadata.from({ copyright: 'test' })).prepend(new Collection([ 7, 8 ], Metadata.EMPTY_METADATA)))
            .toStrictEqual(new Collection([ 7, 8, 1, 2, 4, 5, 4 ], Metadata.from({ copyright: 'test' })));
    });
});

describe('Collection.prependItems()', () => {
    test('does not affect metadata', () => {
        expect(new Collection([ 1, 2, 4, 5, 4 ], Metadata.from({ copyright: 'test' })).prependItems(7, 8))
            .toStrictEqual(new Collection([ 7, 8, 1, 2, 4, 5, 4 ], Metadata.from({ copyright: 'test' })));
    });
});

describe('Collection.map()', () => {
    test('does not affect metadata', () => {
        expect(new Collection([ 1, 2, 4, 5 ], Metadata.from({ copyright: 'test' })).map(v => v + 1))
            .toStrictEqual(new Collection([ 2, 3, 5, 6 ], Metadata.from({ copyright: 'test' })));
    });
});

describe('Collection.flatMap()', () => {
    test('does not affect metadata', () => {
        expect(new Collection([ 1, 2, 4, 5 ], Metadata.from({ copyright: 'test' })).flatMap(v => [ v - 1, v + 1 ]))
            .toStrictEqual(new Collection([ 0, 2, 1, 3, 3, 5, 4, 6 ], Metadata.from({ copyright: 'test' })));
    });
});

describe('Collection.retrograde()', () => {
    test('does not affect metadata', () => {
        expect(new Collection([ 1, 2, 4, 5 ], Metadata.from({ copyright: 'test' })).retrograde())
            .toStrictEqual(new Collection([ 5, 4, 2, 1 ], Metadata.from({ copyright: 'test' })));
    });
});

describe('Collection.swapAt()', () => {
    test('does not affect metadata', () => {
        expect(new Collection([ 1, 2, 4, 5 ], Metadata.from({ copyright: 'test' })).swapAt([ 0, 2 ]))
            .toStrictEqual(new Collection([ 4, 2, 1, 5 ], Metadata.from({ copyright: 'test' })));
    });
});

describe('Collection.splitAt()', () => {
    test('propagates metadata to all children', () => {
        expect(new Collection([ 1, 5, 4, 2, 3, 6 ], Metadata.from({ copyright: 'test' })).splitAt([ 2, 2 ]))
            .toStrictEqual([
                new Collection([ 1, 5 ], Metadata.from({ copyright: 'test' })),
                new Collection([], Metadata.from({ copyright: 'test' })),
                new Collection([ 4, 2, 3, 6 ], Metadata.from({ copyright: 'test' }))
            ]);
    });
});

describe('Collection.partition()', () => {
    test('propagates metadata to all children', () => {
        expect(new Collection([ 1, 5, 4, 2, 3, 6 ], Metadata.from({ copyright: 'test' })).partition(v => v > 3))
            .toStrictEqual([
                new Collection([ 5, 4, 6 ], Metadata.from({ copyright: 'test' })),
                new Collection([ 1, 2, 3 ], Metadata.from({ copyright: 'test' }))
            ]);
    });
});

describe('Collection.groupBy()', () => {
    test('propagates metadata to all children', () => {
        expect(new Collection([ 1, 5, 4, 2, 3, 6 ], Metadata.from({ copyright: 'test' })).groupBy(v => v % 3))
            .toStrictEqual({
                1: new Collection([ 1, 4 ], Metadata.from({ copyright: 'test' })),
                2: new Collection([ 5, 2 ], Metadata.from({ copyright: 'test' })),
                0: new Collection([ 3, 6 ], Metadata.from({ copyright: 'test' })),
            });
    });
});

describe('Collection.if()/Collection.then()/Collection.else()', () => {
    test('does not affect metadata', () => {
        expect(new Collection([ 1, 2, 4 ], Metadata.from({ copyright: 'test' }))
            .if(c => c.length < 4)
            .then(c => c.appendItems(6))
            .then(c => c.appendItems(7))
            .else(c => c.dropRight())
            .if(c => c.length < 4)
            .then(c => c.appendItems(6))
            .then(c => c.appendItems(7))
            .else(c => c.dropRight())
        ).toStrictEqual(new Collection([ 1, 2, 4, 6 ], Metadata.from({ copyright: 'test' })));
    });
});

describe('Collection.while()/Collection.do()', () => {
    test('does not affect metadata', () => {
        expect(new Collection([ 1, 5, 4, 2, 3, 6 ], Metadata.from({ copyright: 'test' }))
            .while(v => v.length > 4)
            .do(v => v.drop())
            .do(v => v.appendItems(v.valAt(0)))
            .while(v => v.length < 4)
        ).toStrictEqual(new Collection([ 4, 2, 3, 6, 4 ], Metadata.from({ copyright: 'test' })));
    });
});

describe('Collection.tap()', () => {
    const c = new Collection([ 1, 5, 4 ], Metadata.from({ copyright: 'test' }));
    
    test('does not affect metadata', () => {
        let len;
 
        expect(c.tap(coll => len = coll.length )).toBe(c);
        expect(len).toEqual(3);
    });
});

describe('Collection.describe()', () => {
    test('empty collection', () => {
        expect(new Collection([], Metadata.from({})).describe()).toStrictEqual('CollectionWithMetadata(length=0,metadata=Metadata({}))([])');
    });

    test('collection with mixed members', () => {
        expect(new Collection([ 5, [ 6, 7 ], { describe: 'cat', clearly: 'not cat' }, { describe: () => 'ObjectWithDescribe()' } ], Metadata.from({ trackname: 'test', tempo: 144 })).describe())
            .toStrictEqual(`CollectionWithMetadata(length=4,metadata=Metadata({tempo=144,trackname="test"}))([
    0: 5,
    1: Array(len=2)[
      0: 6
      1: 7
    ],
    2: {
      "describe": "cat"
      "clearly": "not cat"
    },
    3: ObjectWithDescribe(),
])`);
    });
});