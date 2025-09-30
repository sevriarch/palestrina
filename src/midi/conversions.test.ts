import type { MetaEventArg } from '../types';

import MetaEvent from '../meta-events/meta-event';
import MelodyMember from '../sequences/members/melody';

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

describe('orderedEntitiesToTimedMidiBytes()', () => {
    test('empty array should return empty array', () => {
        expect(conversions.orderedEntitiesToTimedMidiBytes([], 1)).toStrictEqual([]);
    });

    test('invalid pitch should throw', () => {
        expect(() => conversions.orderedEntitiesToTimedMidiBytes([
            MelodyMember.from({ pitch: [ 4, 256 ], at: 0, duration: 128, velocity: 96 })
        ], 1)).toThrow();
    });

    test('note and meta-event succeed on channel 1', () => {
        expect(conversions.orderedEntitiesToTimedMidiBytes([
            MelodyMember.from({ pitch: [ 64 ], at: 0, duration: 128, velocity: 96 }),
            MetaEvent.from({ event: 'instrument', value: 'piano', at: 0 }),
        ], 1)).toStrictEqual([
            [ 0, [ 0x90, 0x40, 0x60 ] ],
            [ 0, [ 0xc0, 0x00 ] ],
            [ 128, [ 0x80, 0x40, 0x60 ] ],
        ]);
    });

    test('note and meta-event succeed on channel 1', () => {
        expect(conversions.orderedEntitiesToTimedMidiBytes([
            MelodyMember.from({ pitch: [ 64 ], at: 0, duration: 128, velocity: 96 }),
            MetaEvent.from({ event: 'instrument', value: 'piano', at: 0 }),
        ], 16)).toStrictEqual([
            [ 0, [ 0x9f, 0x40, 0x60 ] ],
            [ 0, [ 0xcf, 0x00 ] ],
            [ 128, [ 0x8f, 0x40, 0x60 ] ],
        ]);
    });
});