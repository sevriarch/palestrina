import type { MetadataData, MetaEventArg } from '../types';

import Metadata from './metadata';
import MetaList from '../meta-events/meta-list';

import NumericValidator from '../validation/numeric';
import { DEFAULTS } from '../constants';

describe('Metadata.from() tests', () => {
    test('Metadata.from(metadata) returns passed argument', () => {
        const m = new Metadata({ tempo: 144 });

        expect(Metadata.from(m)).toBe(m);
    });

    test('Metadata.from(data) returns new Metadata object', () => {
        expect(Metadata.from({ tempo: 144 })).toStrictEqual(new Metadata({ tempo: 144 }));
    });

    test('Metadata.from() is same as Metadata.from({})', () => {
        expect(Metadata.from({})).toStrictEqual(Metadata.from());
    });
});

describe('MetaList.fromMetaEventArg()', () => {
    const EVT_SUS1: MetaEventArg = { event: 'sustain', value: 0 };
    const EVT_SUS2: MetaEventArg = { event: 'sustain', value: 1, offset: 32 }; 
    const EVT_NAME: MetaEventArg = { event: 'track-name', value: 'test' };
    const EVT_NAME_DELAYED: MetaEventArg = { event: 'track-name', value: 'west', at: 64 };
    const EVT_COPY: MetaEventArg = { event: 'copyright', value: 'best' };
    const EVT_COPY_DELAYED: MetaEventArg = { event: 'copyright', value: 'fest', at: 64 };
    const EVT_TSIG: MetaEventArg = { event: 'time-signature', value: '3/4' };
    const EVT_KSIG: MetaEventArg = { event: 'key-signature', value: 'E' };
    const EVT_TEMPO: MetaEventArg = { event: 'tempo', value: 152 };
    const EVT_INSTRUMENT: MetaEventArg = { event: 'instrument', value: 'viola' };

    const table: [ string, MetaEventArg[], MetadataData ][] = [
        [
            'empty MetaList',
            [],
            {},
        ],
        [
            'MetaList with no Metadata',
            [ EVT_SUS1, EVT_SUS2 ],
            { before: MetaList.from([ EVT_SUS1, EVT_SUS2 ]) },
        ],
        [
            'MetaList with only Netadata',
            [ EVT_NAME, EVT_COPY ],
            { trackname: 'test', copyright: 'best' },
        ],
        [
            'MetaList with only Metadata, but delayed',
            [ EVT_NAME_DELAYED, EVT_COPY_DELAYED ],
            { before: MetaList.from([ EVT_NAME_DELAYED, EVT_COPY_DELAYED ]) },
        ],
        [
            'MetaList with only Netadata, fresh and delayed',
            [ EVT_TSIG, EVT_KSIG, EVT_INSTRUMENT, EVT_NAME_DELAYED, EVT_TEMPO, EVT_COPY_DELAYED ],
            { time_signature: '3/4', key_signature: 'E', tempo: 152, instrument: 'viola', before: MetaList.from([ EVT_NAME_DELAYED, EVT_COPY_DELAYED ]) },
        ],
        [
            'MetaList with a wild mixture',
            [ EVT_SUS1, EVT_NAME, EVT_NAME_DELAYED, EVT_SUS2, EVT_COPY_DELAYED, EVT_COPY, EVT_INSTRUMENT ],
            { trackname: 'test', copyright: 'best', instrument: 'viola', before: MetaList.from([ EVT_SUS1, EVT_NAME_DELAYED, EVT_SUS2, EVT_COPY_DELAYED ]) },
        ],
    ];

    test.each(table)('works when MetaList has %s', (_, events, metadata) => {
        expect(Metadata.fromMetaEventArg(events)).toEqual(Metadata.from(metadata));
    });
});

describe('Metadata constructor tests', () => {
    const table: [ string, MetadataData, boolean ][] = [
        [ 'fails if non-metadata passed', undefined as unknown as MetadataData, false ],
        [ 'fails if null passed', null as unknown as MetadataData, false ],
        [ 'ok if empty metadata', {}, true ],
        [ 'ok if one valid field', { copyright: 'foo' }, true ],
        [
            'ok if all valid fields',
            {
                midichannel: 1,
                before: MetaList.EMPTY_META_LIST,
                ticks_per_quarter: 192,
                validator: NumericValidator.INT_VALIDATOR,
                tempo: 144,
                time_signature: '4/4',
                key_signature: 'C#',
                copyright: 'mine',
                trackname: 'also mine',
                instrument: 'my instrument',
            },
            true
        ],
        [
            'fails if two fields, one which exists and one which does not',
            {
                copyright: 'foo',
                bopyright: 'goo',
            } as unknown as MetadataData,
            false,
        ],
        [
            'fails if invalid midichannel, valid before',
            {
                midichannel: 17,
                before: MetaList.EMPTY_META_LIST
            },
            false
        ],
        [ 'fails if invalid before', { before: 1 } as unknown as MetadataData, false ],
        [ 'fails if invalid ticks_per_quarter', { ticks_per_quarter: 0 }, false ],
        [ 'fails if invalid ticks_per_quarter', { ticks_per_quarter: 65536 }, false ],
        [ 'fails if invalid tempo', { tempo: -1 }, false ],
        [ 'fails if invalid time_signature', { time_signature: 1 } as unknown as MetadataData, false ],
        [ 'fails if invalid key_signature', { key_signature: 1 } as unknown as MetadataData, false ],
        [ 'fails if invalid copyright', { copyright: 1 } as unknown as MetadataData, false ],
        [ 'fails if invalid trackname', { trackname: 1 } as unknown as MetadataData, false ],
        [ 'fails if invalid instrument', { instrument: 1 } as unknown as MetadataData, false ],
        [ 'fails if invalid validator', { validator: 1 } as unknown as MetadataData, false ],
        [ 'fails if impossible key_signature value', { key_signature: 'H' }, false ],
        [ 'fails if impossible time_signature value', { time_signature: '1/6' }, false ],
    ];

    test.each(table)('%s', (_, ob, ret) => {
        if (ret) {
            expect(() => new Metadata(ob)).not.toThrow();
        } else {
            expect(() => new Metadata(ob)).toThrow();
        }
    });

    test('metadata is frozen', () => {
        expect(Object.isFrozen(new Metadata({}))).toBe(true);
    });
});

describe('Metadata getter tests', () => {
    test('test midichannel getter', () => {
        expect(new Metadata({}).midichannel).toBe(1);
        expect(new Metadata({ midichannel: 10 }).midichannel).toBe(10);
    });

    test('before midichannel getter', () => {
        expect(new Metadata({}).before).toBe(MetaList.EMPTY_META_LIST);
        expect(new Metadata({ before: MetaList.from([ { event: 'end-track'} ]) }).before).toStrictEqual(MetaList.from([ { event: 'end-track' } ]));
    });

    test('test ticks_per_quarter getter', () => {
        expect(new Metadata({}).ticks_per_quarter).toBe(DEFAULTS.TICKS_PER_QUARTER);
        expect(new Metadata({ ticks_per_quarter: 440 }).ticks_per_quarter).toBe(440);
    });

    test('test validator getter', () => {
        expect(new Metadata({}).validator).toBe(NumericValidator.INT_VALIDATOR);
        expect(new Metadata({ validator: NumericValidator.NOOP_VALIDATOR }).validator).toBe(NumericValidator.NOOP_VALIDATOR);
    });
});

describe('Metadata.mergeFrom()', () => {
    const m_empty = new Metadata({});
    const m_channel = new Metadata({ tempo: 144, midichannel: 5 });
    const m_before_1 = new Metadata({ copyright: 'foobar', before: MetaList.from([ { event: 'sustain', value: 1 } ]) });
    const m_before_2 = new Metadata({ tempo: 160, copyright: 'xxx', before: MetaList.from([ { event: 'sustain', value: 0, at: 768 }, { event: 'end-track', at: 1024 } ]) });

    test('trying to merge from non-metadata throws an error', () => {
        expect(() => m_empty.mergeFrom({} as unknown as Metadata)).toThrow();
    });

    test('merging from empty returns copy of this metadata', () => {
        expect(m_before_1.mergeFrom(m_empty)).toStrictEqual(m_before_1);
    });

    test('merging to empty returns copy of passed metadata', () => {
        expect(m_empty.mergeFrom(m_before_2)).toStrictEqual(m_before_2);
    });

    test('merging from metadata with implicit defaults does not overwrite', () => {
        expect(m_channel.mergeFrom(m_before_1)).toStrictEqual(new Metadata({
            tempo: 144, 
            midichannel: 5,
            copyright: 'foobar',
            before: MetaList.from([ { event: 'sustain', value: 1 } ])
        }));
    });

    test('merging to metadata with implicit defaults does not overwrite', () => {
        expect(m_before_2.mergeFrom(m_channel)).toStrictEqual(new Metadata({
            tempo: 160, 
            midichannel: 5,
            copyright: 'xxx',
            before: MetaList.from([ { event: 'sustain', value: 0, at: 768 }, { event: 'end-track', at: 1024 } ])
        }));
    });

    test('merging two metadata objects with before fields concatenates those fields in the expected order', () => {
        expect(m_before_1.mergeFrom(m_before_2)).toStrictEqual(new Metadata({
            tempo: 160,
            copyright: 'foobar',
            before: MetaList.from([ { event: 'sustain', value: 0, at: 768 }, { event: 'end-track', at: 1024 }, { event: 'sustain', value: 1 } ])
        }));
    });
});

describe('Metadata.withValues()', () => {
    const m = new Metadata({ tempo: 144, key_signature: 'E', ticks_per_quarter: 240 });

    test('adding non-existent metadata field throws', () => {
        expect(() => m.withValues({ rempo: 140 } as unknown as MetadataData)).toThrow();
    });

    test('adding incorrect metadata value throws', () => {
        expect(() => m.withValues({ tempo: '3/8' } as unknown as MetadataData)).toThrow();
    });

    test('adding correct and incorrect metadata value throws', () => {
        expect(() => m.withValues({ tempo: 120, copyright: 8 } as unknown as MetadataData)).toThrow();
    });

    test('adding no metadata fields creates an identical object', () => {
        expect(m.withValues({})).toStrictEqual(m);
    });

    test('adding metadata fields overrides existing values and adds new ones', () => {
        expect(m.withValues({ tempo: 120, copyright: 'this' })).toStrictEqual(new Metadata({ tempo: 120, key_signature: 'E', ticks_per_quarter: 240, copyright: 'this' }));
    });
});

describe('Metadata.withoutValues()', () => {
    const m = new Metadata({ tempo: 144, key_signature: 'E', time_signature: '4/4' });

    test('removing field that is not present returns same values', () => {
        expect(m.withoutValues('midichannel')).toStrictEqual(m);
    });

    test('removing field that is not present returns without associated value', () => {
        expect(m.withoutValues('tempo')).toStrictEqual(new Metadata({ key_signature: 'E', time_signature: '4/4' }));
    });

    test('removing multiple fields, some of which are present, removes values for those that were present', () => {
        expect(m.withoutValues([ 'midichannel', 'key_signature', 'time_signature' ])).toStrictEqual(new Metadata({ tempo: 144 }));
    });
});

describe('Metadata.describe()', () => {
    test('empty metadata', () => {
        expect(new Metadata({}).describe()).toStrictEqual('Metadata({})');
    });

    test('single piece of metadata', () => {
        expect(new Metadata({ ticks_per_quarter: 640 }).describe()).toStrictEqual('Metadata({ticks_per_quarter=640})');
    });

    test('all the metadata fields', () => {
        expect(new Metadata({
            midichannel: 10,
            tempo: 144,
            ticks_per_quarter: 480,
            time_signature: '3/8',
            key_signature: 'C',
            copyright: 'test',
            trackname: 'track',
            instrument: 'violin',
            before: MetaList.EMPTY_META_LIST,
            validator: NumericValidator.NOOP_VALIDATOR,
        }).describe()).toStrictEqual('Metadata({midichannel=10,tempo=144,ticks_per_quarter=480,time_signature="3/8",key_signature="C",copyright="test",trackname="track",instrument="violin",before=MetaList(length=0)([]),validator=NumericValidator({type="noop"})})');
    });
});