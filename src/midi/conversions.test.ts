import type { MetaEventArg, MidiTickAndBytes, MetaListArg, MetadataData, SeqMemberArgument } from '../types';

import MetaList from '../meta-events/meta-list';
import Metadata from '../metadata/metadata';
import MelodyMember from '../sequences/members/melody';
import Melody from '../sequences/melody';
import NumericValidator from '../validation/numeric';

import * as conversions from './conversions';

describe('conversions.numberToFixedBytes()', () => {
    const errortable: [ number, number ][] = [
        [ -1, 1 ],
        [ 0x00, 0 ],
        [ 0x100, 1 ],
        [ 0x10000, 2 ],
        [ 0x1000000, 3 ]
    ];

    test.each(errortable)('cannot pack %p into %p bytes', (v, len) => {
        expect(() => conversions.numberToFixedBytes(v, len)).toThrow();
    });

    const table: [ number, number, number[] ][] = [
        [ 0x00, 1, [ 0x00 ] ],
        [ 0xff, 1, [ 0xff ] ],
        [ 0xff, 2, [ 0x00, 0xff ] ],
        [ 0xff, 3, [ 0x00, 0x00, 0xff ] ],
        [ 0xff, 4, [ 0x00, 0x00, 0x00, 0xff ] ],
        [ 0x100, 2, [ 0x01, 0x00 ] ],
        [ 0x100, 3, [ 0x00, 0x01, 0x00 ] ],
        [ 0x100, 4, [ 0x00, 0x00, 0x01, 0x00 ] ],
        [ 0xffff, 2, [ 0xff, 0xff ] ],
        [ 0xffff, 3, [ 0x00, 0xff, 0xff ] ],
        [ 0xffff, 4, [ 0x00, 0x00, 0xff, 0xff ] ],
        [ 0x10000, 3, [ 0x01, 0x00, 0x00 ] ],
        [ 0x10000, 4, [ 0x00, 0x01, 0x00, 0x00 ] ],
        [ 0xffffff, 3, [ 0xff, 0xff, 0xff ] ],
        [ 0xffffff, 4, [ 0x00, 0xff, 0xff, 0xff ] ],
        [ 0x1000000, 4, [ 0x01, 0x00, 0x00, 0x00 ] ],
        [ 0xffffffff, 4, [ 0xff, 0xff, 0xff, 0xff ] ],
    ];

    test.each(table)('can %p into %p bytes', (v, len, ret) => {
        expect(conversions.numberToFixedBytes(v, len)).toEqual(ret);
    });
});

describe('conversions.fixedBytesToNumber()', () => {
    const table: [ string, number[], number ][] = [
        [ 'no bytes', [], 0x00 ],
        [ 'single zero byte', [ 0x00 ], 0x00 ],
        [ 'single non-zero byte', [ 0xff ], 0xff ],
        [ 'two bytes', [ 0x2c, 0x7f ], 0x2c7f ],
        [ 'three bytes', [ 0x17, 0x00, 0xfc ], 0x1700fc ],
        [ 'four bytes, the first two zero', [ 0x00, 0x00, 0x58, 0x1c ], 0x581c ],
        [ 'four bytes, the last two zero', [ 0x58, 0x1c, 0x00, 0x00 ], 0x581c0000 ],
    ];

    test.each(table)('%s', (_, arr, ret) => {
        expect(conversions.fixedBytesToNumber(arr)).toEqual(ret);
    });
});

describe('conversions.numberToVariableBytes()', () => {
    test('converting -1 to variable bytes fails', () => {
        expect(() => conversions.numberToVariableBytes(-1)).toThrow();
    });

    test('converting a 5-bytes number to variable bytes fails', () => {
        expect(() => conversions.numberToVariableBytes(0x10000000)).toThrow();
    });

    const table: [ number, number[] ][] = [
        [ 0x00, [ 0x00 ] ],
        [ 0x1e, [ 0x1e ] ],
        [ 0x7f, [ 0x7f ] ],
        [ 0x80, [ 0x81, 0x00 ] ],
        [ 0xff, [ 0x81, 0x7f ] ],
        [ 0x0100, [ 0x82, 0x00 ] ],
        [ 0x0d1e, [ 0x9a, 0x1e ] ],
        [ 0x3d1e, [ 0xfa, 0x1e ] ],
        [ 0x3fff, [ 0xff, 0x7f ] ],
        [ 0x4000, [ 0x81, 0x80, 0x00 ] ],
        [ 0x0c3d1e, [ 0xb0, 0xfa, 0x1e ] ],
        [ 0x1fffff, [ 0xff, 0xff, 0x7f ] ],
        [ 0x200000, [ 0x81, 0x80, 0x80, 0x00 ] ],
        [ 0x09c3d1e, [ 0x84, 0xf0, 0xfa, 0x1e ] ],
        [ 0xfffffff, [ 0xff, 0xff, 0xff, 0x7f ] ],
    ];

    test.each(table)('converting %p to %j', (v, ret) => {
        expect(conversions.numberToVariableBytes(v)).toEqual(ret);
    });
});

describe('conversions.variableBytesToNumber()', () => {
    const errortable: [ string, number[] ][] = [
        [ 'no bytes', [] ],
        [ 'one byte with high bit on', [ 0x80 ] ],
        [ 'three bytes, each of which has a high bit on', [ 0xff, 0xff, 0xff ] ]
    ];

    test.each(errortable)('throws when %s', (_, bytes) => {
        expect(() => conversions.variableBytesToNumber(bytes)).toThrow();
    });

    const table: [ string, number[], [ number, number ] ][] = [
        [ 'a zero byte', [ 0x00 ], [ 0x00, 1 ] ],
        [ 'a non-zero byte', [ 0x7f ], [ 0x7f, 1 ] ],
        [ 'two bytes, the first used', [ 0x00, 0x01 ], [ 0, 1 ] ],
        [ 'two bytes, both used', [ 0xff, 0x7f], [ 0x3fff, 2 ] ],
        [ 'three bytes, all used', [ 0x81, 0x80, 0x40 ], [ 0x4040, 3 ] ],
        [ 'four bytes, the first two used', [ 0xff, 0x7f, 0x7e, 0x7d ], [ 0x3fff, 2 ] ],
    ];

    test.each(table)('%s', (_, bytes, ret) => {
        expect(conversions.variableBytesToNumber(bytes)).toStrictEqual(ret);
    });
});

describe('conversions.stringToVariableBytes()', () => {
    test('non-string argument fails', () => {
        expect(() => conversions.stringToVariableBytes(500 as unknown as string)).toThrow();
    });

    const table: [ string, string, number[] ][] = [
        [ 'empty string', '', [ 0x00 ] ],
        [ 'five-character string', 'Piano', [ 0x05, 0x50, 0x69, 0x61, 0x6e, 0x6f ] ],
        [ '200-character string', '1'.repeat(200), [ 0x81, 0x48, ...new Array(200).fill(0x31) ] ],
    ];

    test.each(table)('%s', (_, str, ret) => {
        expect(conversions.stringToVariableBytes(str)).toEqual(ret);
    });
});

describe('conversions.fixedBytesToString()', () => {
    const table: [ string, number[], string ][] = [
        [ 'no bytes', [], '' ],
        [ 'five bytes', [ 0x50, 0x69, 0x61, 0x6e, 0x6f ], 'Piano' ],
        [ 'four bytes', [ 0x4f, 0x62, 0x6f, 0x65 ], 'Oboe' ]
    ];

    test.each(table)('%s', (_, v, ret) => {
        expect(conversions.fixedBytesToString(v)).toEqual(ret);
    });
});

describe('conversions.metaEventToMidiBytes()', () => {
    const errortable: [ MetaEventArg, number? ][] = [
        [ { event: 'volume', value: 127 }, 0 ],
        [ { event: 'volume', value: 127 }, 17 ],
        [ { event: 'volume', value: -1 }, 16 ],
        [ { event: 'volume', value: 128 }, 16 ],
        [ { event: 'balance', value: 127 }, 0 ],
        [ { event: 'balance', value: 127 }, 17 ],
        [ { event: 'balance', value: -1 }, 16 ],
        [ { event: 'balance', value: 128 }, 16 ],
        [ { event: 'pan', value: 127 }, 0 ],
        [ { event: 'pan', value: 127 }, 17 ],
        [ { event: 'pan', value: -1 }, 16 ],
        [ { event: 'pan', value: 128 }, 16 ],
        [ { event: 'text', value: 555 as unknown as string }, undefined ],
        [ { event: 'copyright', value: 555 as unknown as string }, undefined ],
        [ { event: 'track-name', value: 555 as unknown as string }, undefined ],
        [ { event: 'instrument-name', value: 555 as unknown as string }, undefined ],
        [ { event: 'lyric', value: 555 as unknown as string }, undefined ],
        [ { event: 'marker', value: 555 as unknown as string }, undefined ],
        [ { event: 'cue-point', value: 555 as unknown as string }, undefined ],
        [ { event: 'tempo', value: '11' as unknown as number }, undefined ],
        [ { event: 'tempo', value: 0 }, undefined ],
        [ { event: 'time-signature', value: 5 as unknown as string }, undefined ],
        [ { event: 'time-signature', value: '3/3' }, undefined ],
        [ { event: 'time-signature', value: '2.5/4' }, undefined ],
        [ { event: 'time-signature', value: '256/4' }, undefined ],
        [ { event: 'key-signature', value: 555 as unknown as string }, undefined ],
        [ { event: 'key-signature', value: 'Q' }, undefined ],
        [ { event: 'key-signature', value: 'G#' }, undefined ],
        [ { event: 'key-signature', value: 'D#' }, undefined ],
        [ { event: 'key-signature', value: 'A#' }, undefined ],
        [ { event: 'key-signature', value: 'cb' }, undefined ],
        [ { event: 'key-signature', value: 'gb' }, undefined ],
        [ { event: 'key-signature', value: 'db' }, undefined ],
        [ { event: 'instrument', value: 0 }, 0 ],
        [ { event: 'instrument', value: 0 }, 17 ],
        [ { event: 'instrument', value: 256 }, 1 ],
        [ { event: 'instrument', value: 'theorbo' }, 1 ],
        [ { event: 'instrument', value: -1 }, 1 ],
        [ { event: 'pitch-bend', value: 0 }, 0 ],
        [ { event: 'pitch-bend', value: 0 }, 17 ],
        [ { event: 'pitch-bend', value: 8192 }, 1 ],
        [ { event: 'pitch-bend', value: -8193 }, 1 ],
        [ { event: 'does-not-exist', value: 16 } as unknown as MetaEventArg, 1 ],
    ];

    test.each(errortable)('%s', (e, chan) => {
        expect(() => conversions.metaEventToMidiBytes(e, chan)).toThrow();
    });

    const table: [ MetaEventArg, number | undefined, number[] ][] = [
        [ { event: 'sustain', value: 0 }, 1, [ 0xb0, 0x40, 0x00 ] ],
        [ { event: 'sustain', value: 0 }, 16, [ 0xbf, 0x40, 0x00 ] ],
        [ { event: 'sustain', value: 1 }, 1, [ 0xb0, 0x40, 0x7f ] ],
        [ { event: 'sustain', value: 1 }, 16, [ 0xbf, 0x40, 0x7f ] ],
        [ { event: 'volume', value: 1 }, 2, [ 0xb1, 0x07, 0x01 ] ],
        [ { event: 'volume', value: 64 }, 9, [ 0xb8, 0x07, 0x40 ] ],
        [ { event: 'volume', value: 127 }, 16, [ 0xbf, 0x07, 0x7f ] ],
        [ { event: 'balance', value: 0 }, 1, [ 0xb0, 0x08, 0x00 ] ],
        [ { event: 'balance', value: 64 }, 8, [ 0xb7, 0x08, 0x40 ] ],
        [ { event: 'balance', value: 127 }, 16, [ 0xbf, 0x08, 0x7f ] ],
        [ { event: 'pan', value: 0 }, 1, [ 0xb0, 0x0a, 0x00 ] ],
        [ { event: 'pan', value: 64 }, 8, [ 0xb7, 0x0a, 0x40 ] ],
        [ { event: 'pan', value: 127 }, 16, [ 0xbf, 0x0a, 0x7f ] ],
        [ { event: 'text', value: 'Piano' }, undefined, [ 0xff, 0x01, 0x05, 0x50, 0x69, 0x61, 0x6e, 0x6f ] ],
        [ { event: 'text', value: 'Oboe' }, undefined, [ 0xff, 0x01, 0x04, 0x4f, 0x62, 0x6f, 0x65 ] ],
        [ { event: 'copyright', value: 'Piano' }, undefined, [ 0xff, 0x02, 0x05, 0x50, 0x69, 0x61, 0x6e, 0x6f ] ],
        [ { event: 'copyright', value: 'Oboe' }, undefined, [ 0xff, 0x02, 0x04, 0x4f, 0x62, 0x6f, 0x65 ] ],
        [ { event: 'track-name', value: 'Piano' }, undefined, [ 0xff, 0x03, 0x05, 0x50, 0x69, 0x61, 0x6e, 0x6f ] ],
        [ { event: 'track-name', value: 'Oboe' }, undefined, [ 0xff, 0x03, 0x04, 0x4f, 0x62, 0x6f, 0x65 ] ],
        [ { event: 'instrument-name', value: 'Piano' }, undefined, [ 0xff, 0x04, 0x05, 0x50, 0x69, 0x61, 0x6e, 0x6f ] ],
        [ { event: 'instrument-name', value: 'Oboe' }, undefined, [ 0xff, 0x04, 0x04, 0x4f, 0x62, 0x6f, 0x65 ] ],
        [ { event: 'lyric', value: 'Piano' }, undefined, [ 0xff, 0x05, 0x05, 0x50, 0x69, 0x61, 0x6e, 0x6f ] ],
        [ { event: 'lyric', value: 'Oboe' }, undefined, [ 0xff, 0x05, 0x04, 0x4f, 0x62, 0x6f, 0x65 ] ],
        [ { event: 'marker', value: 'Piano' }, undefined, [ 0xff, 0x06, 0x05, 0x50, 0x69, 0x61, 0x6e, 0x6f ] ],
        [ { event: 'marker', value: 'Oboe' }, undefined, [ 0xff, 0x06, 0x04, 0x4f, 0x62, 0x6f, 0x65 ] ],
        [ { event: 'cue-point', value: 'Piano' }, undefined, [ 0xff, 0x07, 0x05, 0x50, 0x69, 0x61, 0x6e, 0x6f ] ],
        [ { event: 'cue-point', value: 'Oboe' }, undefined, [ 0xff, 0x07, 0x04, 0x4f, 0x62, 0x6f, 0x65 ] ],
        [ { event: 'tempo', value: 144 }, undefined, [ 0xff, 0x51, 0x03, 0x06, 0x5b, 0x9b ] ],
        [ { event: 'tempo', value: 60 }, undefined, [ 0xff, 0x51, 0x03, 0x0f, 0x42, 0x40 ] ],
        [ { event: 'time-signature', value: '2/4' }, undefined, [ 0xff, 0x58, 0x04, 0x02, 0x02, 0x18, 0x08 ] ],
        [ { event: 'time-signature', value: '9/16' }, undefined, [ 0xff, 0x58, 0x04, 0x09, 0x04, 0x18, 0x08 ] ],
        [ { event: 'key-signature', value: 'C' }, undefined, [ 0xff, 0x59, 0x02, 0x00, 0x00 ] ],
        [ { event: 'key-signature', value: 'G' }, undefined, [ 0xff, 0x59, 0x02, 0x01, 0x00 ] ],
        [ { event: 'key-signature', value: 'D' }, undefined, [ 0xff, 0x59, 0x02, 0x02, 0x00 ] ],
        [ { event: 'key-signature', value: 'A' }, undefined, [ 0xff, 0x59, 0x02, 0x03, 0x00 ] ],
        [ { event: 'key-signature', value: 'E' }, undefined, [ 0xff, 0x59, 0x02, 0x04, 0x00 ] ],
        [ { event: 'key-signature', value: 'B' }, undefined, [ 0xff, 0x59, 0x02, 0x05, 0x00 ] ],
        [ { event: 'key-signature', value: 'Cb' }, undefined, [ 0xff, 0x59, 0x02, 0xf9, 0x00 ] ],
        [ { event: 'key-signature', value: 'F#' }, undefined, [ 0xff, 0x59, 0x02, 0x06, 0x00 ] ],
        [ { event: 'key-signature', value: 'Gb' }, undefined, [ 0xff, 0x59, 0x02, 0xfa, 0x00 ] ],
        [ { event: 'key-signature', value: 'C#' }, undefined, [ 0xff, 0x59, 0x02, 0x07, 0x00 ] ],
        [ { event: 'key-signature', value: 'Db' }, undefined, [ 0xff, 0x59, 0x02, 0xfb, 0x00 ] ],
        [ { event: 'key-signature', value: 'Ab' }, undefined, [ 0xff, 0x59, 0x02, 0xfc, 0x00 ] ],
        [ { event: 'key-signature', value: 'Eb' }, undefined, [ 0xff, 0x59, 0x02, 0xfd, 0x00 ] ],
        [ { event: 'key-signature', value: 'Bb' }, undefined, [ 0xff, 0x59, 0x02, 0xfe, 0x00 ] ],
        [ { event: 'key-signature', value: 'F' }, undefined, [ 0xff, 0x59, 0x02, 0xff, 0x00 ] ],
        [ { event: 'key-signature', value: 'c' }, undefined, [ 0xff, 0x59, 0x02, 0xfd, 0x01 ] ],
        [ { event: 'key-signature', value: 'g' }, undefined, [ 0xff, 0x59, 0x02, 0xfe, 0x01 ] ],
        [ { event: 'key-signature', value: 'd' }, undefined, [ 0xff, 0x59, 0x02, 0xff, 0x01 ] ],
        [ { event: 'key-signature', value: 'a' }, undefined, [ 0xff, 0x59, 0x02, 0x00, 0x01 ] ],
        [ { event: 'key-signature', value: 'e' }, undefined, [ 0xff, 0x59, 0x02, 0x01, 0x01 ] ],
        [ { event: 'key-signature', value: 'b' }, undefined, [ 0xff, 0x59, 0x02, 0x02, 0x01 ] ],
        [ { event: 'key-signature', value: 'f#' }, undefined, [ 0xff, 0x59, 0x02, 0x03, 0x01 ] ],
        [ { event: 'key-signature', value: 'c#' }, undefined, [ 0xff, 0x59, 0x02, 0x04, 0x01 ] ],
        [ { event: 'key-signature', value: 'g#' }, undefined, [ 0xff, 0x59, 0x02, 0x05, 0x01 ] ],
        [ { event: 'key-signature', value: 'ab' }, undefined, [ 0xff, 0x59, 0x02, 0xf9, 0x01 ] ],
        [ { event: 'key-signature', value: 'd#' }, undefined, [ 0xff, 0x59, 0x02, 0x06, 0x01 ] ],
        [ { event: 'key-signature', value: 'eb' }, undefined, [ 0xff, 0x59, 0x02, 0xfa, 0x01 ] ],
        [ { event: 'key-signature', value: 'a#' }, undefined, [ 0xff, 0x59, 0x02, 0x07, 0x01 ] ],
        [ { event: 'key-signature', value: 'bb' }, undefined, [ 0xff, 0x59, 0x02, 0xfb, 0x01 ] ],
        [ { event: 'key-signature', value: 'f' }, undefined, [ 0xff, 0x59, 0x02, 0xfc, 0x01 ] ],
        [ { event: 'instrument', value: 0 }, undefined, [ 0xc0, 0x00 ] ],
        [ { event: 'instrument', value: 0 }, 1, [ 0xc0, 0x00 ] ],
        [ { event: 'instrument', value: 0 }, 16, [ 0xcf, 0x00 ] ],
        [ { event: 'instrument', value: 255 }, 1, [ 0xC0, 0xFF ] ],
        [ { event: 'instrument', value: 'piano' }, 1, [ 0xC0, 0x00 ] ],
        [ { event: 'instrument', value: 'violin' }, 1, [ 0xC0, 0x28 ] ],
        [ { event: 'pitch-bend', value: 0 }, undefined, [ 0xe0, 0x00, 0x40 ] ],
        [ { event: 'pitch-bend', value: 0 }, 1, [ 0xe0, 0x00, 0x40 ] ],
        [ { event: 'pitch-bend', value: 0 }, 16, [ 0xef, 0x00, 0x40 ] ],
        [ { event: 'pitch-bend', value: 127 }, 16, [ 0xef, 0x7f, 0x40 ] ],
        [ { event: 'pitch-bend', value: 128 }, 16, [ 0xef, 0x00, 0x41 ] ],
        [ { event: 'pitch-bend', value: -128 }, 16, [ 0xef, 0x00, 0x3f ] ],
        [ { event: 'pitch-bend', value: -129 }, 16, [ 0xef, 0x7f, 0x3e ] ],
        [ { event: 'pitch-bend', value: 2048 }, 1, [ 0xe0, 0x00, 0x50 ] ],
        [ { event: 'pitch-bend', value: -2048 }, 1, [ 0xe0, 0x00, 0x30 ] ],
        [ { event: 'pitch-bend', value: 8191 }, 1, [ 0xe0, 0x7f, 0x7f ] ],
        [ { event: 'pitch-bend', value: -8192 }, 1, [ 0xe0, 0x00, 0x00 ] ],
    ];

    test.each(table)('%j converts to correct midi bytes', (e, chan, ret) => {
        expect(conversions.metaEventToMidiBytes(e, chan)).toStrictEqual(ret);
    });
});

describe('conversions.metaListToTimedMidiBytes()', () => {
    const table: [ string, MetaListArg, number, number, MidiTickAndBytes[] ][] = [
        [
            'empty MetaList',
            [],
            0,
            1,
            []
        ],
        [
            'MetaList with one member (a)',
            [ { event: 'instrument', value: 'violin' } ],
            0,
            1,
            [ [ 0, [ 0xc0, 0x28 ] ] ]
        ],
        [
            'MetaList with one member (b)',
            [ { event: 'instrument', value: 'violin' } ],
            64,
            16,
            [ [ 64, [ 0xcf, 0x28 ] ] ]
        ],
        [
            'MetaList with one member with an offset (a)',
            [ { event: 'sustain', value: 1, offset: 32 } ],
            0,
            1,
            [ [ 32, [ 0xb0, 0x40, 0x7f ] ] ]
        ],
        [
            'MetaList with one member with an offset (b)',
            [ { event: 'sustain', value: 0, offset: 32 } ],
            64,
            16,
            [ [ 96, [ 0xbf, 0x40, 0x00 ] ] ]
        ],
        [
            'MetaList with one member with an exact tick',
            [ { event: 'pitch-bend', value: 2048, at: 64 } ],
            32,
            1,
            [ [ 64, [ 0xe0, 0x00, 0x50 ] ] ]
        ],
        [
            'MetaList with one member with an exact tick and an offset',
            [ { event: 'pitch-bend', value: 2048, at: 64, offset: 32 } ],
            0,
            1,
            [ [ 96, [ 0xe0, 0x00, 0x50 ] ] ]
        ],
        [
            'MetaList with all the other things (a)',
            [
                { event: 'tempo', value: 144 },
                { event: 'key-signature', value: 'Eb', at: 640 },
                { event: 'time-signature', value: '5/4' },
                { event: 'text', value: 'test text' },
                { event: 'lyric', value: 'test lyric', offset: 64 },
                { event: 'marker', value: 'test marker', at: 128 },
                { event: 'cue-point', value: 'test cue point' },
                { event: 'copyright', value: 'test copyright' },
                { event: 'track-name', value: 'test track name' },
                { event: 'volume', value: 100, offset: 128 },
                { event: 'pan', value: 64 },
                { event: 'balance', value: 64 }
            ],
            0,
            1,
            [
                [ 0, [ 0xff, 0x51, 0x3, 0x6, 0x5b, 0x9b ] ],
                [ 640, [ 0xff, 0x59, 0x2, 0xfd, 0x0 ] ],
                [ 0, [ 0xff, 0x58, 0x4, 0x5, 0x2, 0x18, 0x8 ] ],
                [ 0, [ 0xff, 0x1, 0x9, 0x74, 0x65, 0x73, 0x74, 0x20, 0x74, 0x65, 0x78, 0x74 ] ],
                [ 64, [ 0xff, 0x5, 0xa, 0x74, 0x65, 0x73, 0x74, 0x20, 0x6c, 0x79, 0x72, 0x69, 0x63 ] ],
                [ 128, [ 0xff, 0x6, 0xb, 0x74, 0x65, 0x73, 0x74, 0x20, 0x6d, 0x61, 0x72, 0x6b, 0x65, 0x72 ] ],
                [ 0, [ 0xff, 0x7, 0xe, 0x74, 0x65, 0x73, 0x74, 0x20, 0x63, 0x75, 0x65, 0x20, 0x70, 0x6f, 0x69, 0x6e, 0x74 ] ],
                [ 0, [ 0xff, 0x2, 0xe, 0x74, 0x65, 0x73, 0x74, 0x20, 0x63, 0x6f, 0x70, 0x79, 0x72, 0x69, 0x67, 0x68, 0x74 ] ],
                [ 0, [ 0xff, 0x3, 0xf, 0x74, 0x65, 0x73, 0x74, 0x20, 0x74, 0x72, 0x61, 0x63, 0x6b, 0x20, 0x6e, 0x61, 0x6d, 0x65 ] ],
                [ 128, [ 0xb0, 0x7, 0x64 ] ],
                [ 0, [ 0xb0, 0xa, 0x40 ] ],
                [ 0, [ 0xb0, 0x8, 0x40 ] ],
            ]
        ],
        [
            'MetaList with all the other things (b)',
            [
                { event: 'tempo', value: 144 },
                { event: 'key-signature', value: 'Eb', at: 640 },
                { event: 'time-signature', value: '5/4' },
                { event: 'text', value: 'test text' },
                { event: 'lyric', value: 'test lyric', offset: 64 },
                { event: 'marker', value: 'test marker', at: 128 },
                { event: 'cue-point', value: 'test cue point' },
                { event: 'copyright', value: 'test copyright' },
                { event: 'track-name', value: 'test track name' },
                { event: 'volume', value: 100, offset: 128 },
                { event: 'pan', value: 64 },
                { event: 'balance', value: 64 }
            ],
            64,
            16,
            [
                [ 64, [ 0xff, 0x51, 0x3, 0x6, 0x5b, 0x9b ] ],
                [ 640, [ 0xff, 0x59, 0x2, 0xfd, 0x0 ] ],
                [ 64, [ 0xff, 0x58, 0x4, 0x5, 0x2, 0x18, 0x8 ] ],
                [ 64, [ 0xff, 0x1, 0x9, 0x74, 0x65, 0x73, 0x74, 0x20, 0x74, 0x65, 0x78, 0x74 ] ],
                [ 128, [ 0xff, 0x5, 0xa, 0x74, 0x65, 0x73, 0x74, 0x20, 0x6c, 0x79, 0x72, 0x69, 0x63 ] ],
                [ 128, [ 0xff, 0x6, 0xb, 0x74, 0x65, 0x73, 0x74, 0x20, 0x6d, 0x61, 0x72, 0x6b, 0x65, 0x72 ] ],
                [ 64, [ 0xff, 0x7, 0xe, 0x74, 0x65, 0x73, 0x74, 0x20, 0x63, 0x75, 0x65, 0x20, 0x70, 0x6f, 0x69, 0x6e, 0x74 ] ],
                [ 64, [ 0xff, 0x2, 0xe, 0x74, 0x65, 0x73, 0x74, 0x20, 0x63, 0x6f, 0x70, 0x79, 0x72, 0x69, 0x67, 0x68, 0x74 ] ],
                [ 64, [ 0xff, 0x3, 0xf, 0x74, 0x65, 0x73, 0x74, 0x20, 0x74, 0x72, 0x61, 0x63, 0x6b, 0x20, 0x6e, 0x61, 0x6d, 0x65 ] ],
                [ 192, [ 0xbf, 0x7, 0x64 ] ],
                [ 64, [ 0xbf, 0xa, 0x40 ] ],
                [ 64, [ 0xbf, 0x8, 0x40 ] ],
            ]
        ],
    ];

    test.each(table)('%s', (_, data, curr, channel, ret) => {
        expect(conversions.metaListToTimedMidiBytes(MetaList.from(data), curr, channel)).toStrictEqual(ret);
    });
});

describe('conversions.metadataToTimedMidiBytes()', () => {
    const table: [ string, MetadataData, MidiTickAndBytes[] ][] = [
        [
            'empty metadata',
            {},
            [],
        ],
        [
            'all metadata fields, channel 1',
            {
                copyright: 'test copyright',
                trackname: 'test trackname',
                time_signature: '5/16',
                key_signature: 'f',
                tempo: 100,
                instrument: 'oboe',
                midichannel: 1,
                ticks_per_quarter: 640,
                before: MetaList.from([ { event: 'sustain', value: 1 }, { event: 'sustain', value: 0, offset: 1024 } ]),
            },
            [
                [ 0, [ 0xff, 0x2, 0xe, 0x74, 0x65, 0x73, 0x74, 0x20, 0x63, 0x6f, 0x70, 0x79, 0x72, 0x69, 0x67, 0x68, 0x74 ] ],
                [ 0, [ 0xff, 0x3, 0xe, 0x74, 0x65, 0x73, 0x74, 0x20, 0x74, 0x72, 0x61, 0x63, 0x6b, 0x6e, 0x61, 0x6d, 0x65 ] ],
                [ 0, [ 0xff, 0x58, 0x4, 0x5, 0x4, 0x18, 0x8 ] ],
                [ 0, [ 0xff, 0x59, 0x2, 0xfc, 0x1 ] ],
                [ 0, [ 0xff, 0x51, 0x3, 0x9, 0x27, 0xc0 ] ],
                [ 0, [ 0xc0, 0x44 ] ],
                [ 0, [ 0xb0, 0x40, 0x7f ] ],
                [ 1024, [ 0xb0, 0x40, 0x0 ] ],
            ],
        ],
        [
            'all metadata fields, channel 16',
            {
                copyright: 'test copyright',
                trackname: 'test trackname',
                time_signature: '5/16',
                key_signature: 'f',
                tempo: 100,
                instrument: 'oboe',
                midichannel: 16,
                ticks_per_quarter: 240,
                before: MetaList.from([ { event: 'sustain', value: 1 }, { event: 'sustain', value: 0, offset: 1024 } ]),
            },
            [
                [ 0, [ 0xff, 0x2, 0xe, 0x74, 0x65, 0x73, 0x74, 0x20, 0x63, 0x6f, 0x70, 0x79, 0x72, 0x69, 0x67, 0x68, 0x74 ] ],
                [ 0, [ 0xff, 0x3, 0xe, 0x74, 0x65, 0x73, 0x74, 0x20, 0x74, 0x72, 0x61, 0x63, 0x6b, 0x6e, 0x61, 0x6d, 0x65 ] ],
                [ 0, [ 0xff, 0x58, 0x4, 0x5, 0x4, 0x18, 0x8 ] ],
                [ 0, [ 0xff, 0x59, 0x2, 0xfc, 0x1 ] ],
                [ 0, [ 0xff, 0x51, 0x3, 0x9, 0x27, 0xc0 ] ],
                [ 0, [ 0xcf, 0x44 ] ],
                [ 0, [ 0xbf, 0x40, 0x7f ] ],
                [ 1024, [ 0xbf, 0x40, 0x0 ] ],
            ],
        ],
    ];

    test.each(table)('%s', (_, data, ret) => {
        expect(conversions.metadataToTimedMidiBytes(Metadata.from(data))).toStrictEqual(ret);
    });
});

describe('conversions.melodyMemberToTimedMidiBytes()', () => {
    test('throws if invalid pitch', () => {
        const mm = MelodyMember.from(-1);

        expect(() => conversions.melodyMemberToTimedMidiBytes(mm, 0, 1)).toThrow();
    });

    const table: [ string, SeqMemberArgument, number, number, MidiTickAndBytes[] ][] = [
        [
            'curr 0, channel 1',
            {
                pitch: [ 60, 63.5, 67 ],
                velocity: 64,
                duration: 32,
                before: MetaList.from([ { event: 'sustain', value: 1, at: 32 }, { event: 'text', value: 'test text' } ]),
                after: MetaList.from([ { event: 'sustain', value: 0, offset: 64 } ])
            },
            0,
            1,
            [
                [ 32, [ 0xb0, 0x40, 0x7f ] ],
                [ 0, [ 0xff, 0x1, 0x9, 0x74, 0x65, 0x73, 0x74, 0x20, 0x74, 0x65, 0x78, 0x74 ] ],
                [ 0, [ 0x90, 0x3c, 0x40 ] ],
                [ 32, [ 0x80, 0x3c, 0x40 ] ],
                [ 0, [ 0xe0, 0x0, 0x50 ] ],
                [ 30, [ 0xe0, 0x0, 0x40 ] ],
                [ 0, [ 0x90, 0x3f, 0x40 ] ],
                [ 32, [ 0x80, 0x3f, 0x40 ] ],
                [ 0, [ 0x90, 0x43, 0x40 ] ],
                [ 32, [ 0x80, 0x43, 0x40 ] ],
                [ 96, [ 0xb0, 0x40, 0x0 ] ],
            ],
        ],
        [
            'curr 160, channel 16',
            {
                pitch: [ 60, 63.5, 67 ],
                velocity: 80,
                duration: 64,
                before: MetaList.from([ { event: 'sustain', value: 1, at: 32 }, { event: 'text', value: 'test text' } ]),
                after: MetaList.from([ { event: 'sustain', value: 0, offset: 64 } ])
            },
            160,
            16,
            [
                [ 32, [ 0xbf, 0x40, 0x7f ] ],
                [ 160, [ 0xff, 0x1, 0x9, 0x74, 0x65, 0x73, 0x74, 0x20, 0x74, 0x65, 0x78, 0x74 ] ],
                [ 160, [ 0x9f, 0x3c, 0x50 ] ],
                [ 224, [ 0x8f, 0x3c, 0x50 ] ],
                [ 160, [ 0xef, 0x0, 0x50 ] ],
                [ 222, [ 0xef, 0x0, 0x40 ] ],
                [ 160, [ 0x9f, 0x3f, 0x50 ] ],
                [ 224, [ 0x8f, 0x3f, 0x50 ] ],
                [ 160, [ 0x9f, 0x43, 0x50 ] ],
                [ 224, [ 0x8f, 0x43, 0x50 ] ],
                [ 288, [ 0xbf, 0x40, 0x0 ] ],
            ],
        ],
        [
            'exact tick supplied',
            {
                pitch: [ 60, 63.5, 67 ],
                velocity: 64,
                duration: 32,
                at: 64,
                before: MetaList.from([ { event: 'sustain', value: 1, at: 32 }, { event: 'text', value: 'test text' } ]),
                after: MetaList.from([ { event: 'sustain', value: 0, offset: 64 } ])
            },
            0,
            1,
            [
                [ 32, [ 0xb0, 0x40, 0x7f ] ],
                [ 64, [ 0xff, 0x1, 0x9, 0x74, 0x65, 0x73, 0x74, 0x20, 0x74, 0x65, 0x78, 0x74 ] ],
                [ 64, [ 0x90, 0x3c, 0x40 ] ],
                [ 96, [ 0x80, 0x3c, 0x40 ] ],
                [ 64, [ 0xe0, 0x0, 0x50 ] ],
                [ 94, [ 0xe0, 0x0, 0x40 ] ],
                [ 64, [ 0x90, 0x3f, 0x40 ] ],
                [ 96, [ 0x80, 0x3f, 0x40 ] ],
                [ 64, [ 0x90, 0x43, 0x40 ] ],
                [ 96, [ 0x80, 0x43, 0x40 ] ],
                [ 160, [ 0xb0, 0x40, 0x0 ] ],
            ],
        ],
        [
            'offset supplied',
            {
                pitch: [ 60, 63.5, 67 ],
                velocity: 64,
                duration: 32,
                offset: 64,
                before: MetaList.from([ { event: 'sustain', value: 1, at: 32 }, { event: 'text', value: 'test text' } ]),
                after: MetaList.from([ { event: 'sustain', value: 0, offset: 64 } ])
            },
            0,
            1,
            [
                [ 32, [ 0xb0, 0x40, 0x7f ] ],
                [ 64, [ 0xff, 0x1, 0x9, 0x74, 0x65, 0x73, 0x74, 0x20, 0x74, 0x65, 0x78, 0x74 ] ],
                [ 64, [ 0x90, 0x3c, 0x40 ] ],
                [ 96, [ 0x80, 0x3c, 0x40 ] ],
                [ 64, [ 0xe0, 0x0, 0x50 ] ],
                [ 94, [ 0xe0, 0x0, 0x40 ] ],
                [ 64, [ 0x90, 0x3f, 0x40 ] ],
                [ 96, [ 0x80, 0x3f, 0x40 ] ],
                [ 64, [ 0x90, 0x43, 0x40 ] ],
                [ 96, [ 0x80, 0x43, 0x40 ] ],
                [ 160, [ 0xb0, 0x40, 0x0 ] ],
            ],
        ],
        [
            'delay supplied',
            {
                pitch: [ 60, 63.5, 67 ],
                velocity: 64,
                duration: 32,
                delay: 64,
                before: MetaList.from([ { event: 'sustain', value: 1, at: 32 }, { event: 'text', value: 'test text' } ]),
                after: MetaList.from([ { event: 'sustain', value: 0, offset: 64 } ])
            },
            0,
            1,
            [
                [ 32, [ 0xb0, 0x40, 0x7f ] ],
                [ 64, [ 0xff, 0x1, 0x9, 0x74, 0x65, 0x73, 0x74, 0x20, 0x74, 0x65, 0x78, 0x74 ] ],
                [ 64, [ 0x90, 0x3c, 0x40 ] ],
                [ 96, [ 0x80, 0x3c, 0x40 ] ],
                [ 64, [ 0xe0, 0x0, 0x50 ] ],
                [ 94, [ 0xe0, 0x0, 0x40 ] ],
                [ 64, [ 0x90, 0x3f, 0x40 ] ],
                [ 96, [ 0x80, 0x3f, 0x40 ] ],
                [ 64, [ 0x90, 0x43, 0x40 ] ],
                [ 96, [ 0x80, 0x43, 0x40 ] ],
                [ 160, [ 0xb0, 0x40, 0x0 ] ],
            ],
        ],
    ];

    test.each(table)('%s', (_, data, curr, channel, ret) => {
        expect(conversions.melodyMemberToTimedMidiBytes(MelodyMember.from(data), curr, channel)).toStrictEqual(ret);
    });
});

describe('melodyToTimedMidiBytes()', () => {
    test('testing complete Melody, midichannel 1', () => {
        const m = Melody.from([
            {
                pitch: [ 60 ],
                velocity: 42,
                duration: 64,
                before: MetaList.from([ { event: 'sustain', value: 1 }, { event: 'text', value: 'test text', at: 64 }]),
            },
            {
                pitch: [ 64.5 ],
                velocity: 46,
                duration: 48,
                at: 32,
            },
            {
                pitch: [ 66, 67 ],
                velocity: 50,
                duration: 16,
                delay: 24
            },
            {
                pitch: [ 71 ],
                velocity: 54,
                duration: 32,
            },
            {
                pitch: [ 72 ],
                velocity: 58,
                duration: 64,
                offset: 32,
                after: MetaList.from([ { event: 'cue-point', value: 'test cue point' }, { event: 'sustain', value: 0, offset: 32 } ])
            }
        ], {
            time_signature: '3/4',
            instrument: 'viola',
            validator: NumericValidator.NOOP_VALIDATOR
        });
        
        expect(conversions.melodyToTimedMidiBytes(m)).toStrictEqual([
            [ 0, [ 0xff, 0x58, 0x4, 0x3, 0x2, 0x18, 0x8 ] ],
            [ 0, [ 0xc0, 0x29 ] ],
            [ 0, [ 0xb0, 0x40, 0x7f ] ],
            [ 0, [ 0x90, 0x3c, 0x2a ] ],
            [ 32, [ 0xe0, 0x0, 0x50 ] ],
            [ 32, [ 0x90, 0x40, 0x2e ] ],
            [ 64, [ 0xff, 0x1, 0x9, 0x74, 0x65, 0x73, 0x74, 0x20, 0x74, 0x65, 0x78, 0x74 ] ],
            [ 64, [ 0x80, 0x3c, 0x2a ] ],
            [ 78, [ 0xe0, 0x0, 0x40 ] ],
            [ 80, [ 0x80, 0x40, 0x2e ] ],
            [ 104, [ 0x90, 0x42, 0x32 ] ],
            [ 104, [ 0x90, 0x43, 0x32 ] ],
            [ 120, [ 0x80, 0x42, 0x32 ] ],
            [ 120, [ 0x80, 0x43, 0x32 ] ],
            [ 120, [ 0x90, 0x47, 0x36 ] ],
            [ 152, [ 0x80, 0x47, 0x36 ] ],
            [ 184, [ 0x90, 0x48, 0x3a ] ],
            [ 248, [ 0x80, 0x48, 0x3a ] ],
            [ 248, [ 0xff, 0x7, 0xe, 0x74, 0x65, 0x73, 0x74, 0x20, 0x63, 0x75, 0x65, 0x20, 0x70, 0x6f, 0x69, 0x6e, 0x74 ] ],
            [ 280, [ 0xb0, 0x40, 0x0 ] ],
        ]);
    });

    test('testing complete Melody, midichannel 16', () => {
        const m = Melody.from([
            {
                pitch: [ 60 ],
                velocity: 42,
                duration: 64,
                before: MetaList.from([ { event: 'sustain', value: 1 }, { event: 'text', value: 'test text', at: 64 }]),
            },
            {
                pitch: [ 64.5 ],
                velocity: 46,
                duration: 48,
                at: 32,
            },
            {
                pitch: [ 66, 67 ],
                velocity: 50,
                duration: 16,
                delay: 24
            },
            {
                pitch: [ 71 ],
                velocity: 54,
                duration: 32,
            },
            {
                pitch: [ 72 ],
                velocity: 58,
                duration: 64,
                offset: 32,
                after: MetaList.from([ { event: 'cue-point', value: 'test cue point' }, { event: 'sustain', value: 0, offset: 32 } ])
            }
        ], {
            time_signature: '3/4',
            instrument: 'viola',
            midichannel: 16,
            validator: NumericValidator.NOOP_VALIDATOR
        });
        
        expect(conversions.melodyToTimedMidiBytes(m)).toStrictEqual([
            [ 0, [ 0xff, 0x58, 0x4, 0x3, 0x2, 0x18, 0x8 ] ],
            [ 0, [ 0xcf, 0x29 ] ],
            [ 0, [ 0xbf, 0x40, 0x7f ] ],
            [ 0, [ 0x9f, 0x3c, 0x2a ] ],
            [ 32, [ 0xef, 0x0, 0x50 ] ],
            [ 32, [ 0x9f, 0x40, 0x2e ] ],
            [ 64, [ 0xff, 0x1, 0x9, 0x74, 0x65, 0x73, 0x74, 0x20, 0x74, 0x65, 0x78, 0x74 ] ],
            [ 64, [ 0x8f, 0x3c, 0x2a ] ],
            [ 78, [ 0xef, 0x0, 0x40 ] ],
            [ 80, [ 0x8f, 0x40, 0x2e ] ],
            [ 104, [ 0x9f, 0x42, 0x32 ] ],
            [ 104, [ 0x9f, 0x43, 0x32 ] ],
            [ 120, [ 0x8f, 0x42, 0x32 ] ],
            [ 120, [ 0x8f, 0x43, 0x32 ] ],
            [ 120, [ 0x9f, 0x47, 0x36 ] ],
            [ 152, [ 0x8f, 0x47, 0x36 ] ],
            [ 184, [ 0x9f, 0x48, 0x3a ] ],
            [ 248, [ 0x8f, 0x48, 0x3a ] ],
            [ 248, [ 0xff, 0x7, 0xe, 0x74, 0x65, 0x73, 0x74, 0x20, 0x63, 0x75, 0x65, 0x20, 0x70, 0x6f, 0x69, 0x6e, 0x74 ] ],
            [ 280, [ 0xbf, 0x40, 0x0 ] ],
        ]);
    });
});