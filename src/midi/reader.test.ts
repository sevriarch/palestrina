import type { MetaEventArg, MelodyMemberArg } from '../types';

import MidiReader from './reader';
import Melody from '../sequences/melody';
import MetaList from '../meta-events/meta-list';

import { MIDI } from '../constants';

import fs from 'fs';

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

describe('MidiReader creation', () => {
    let fn: typeof fs.readFileSync & { mockRestore(): void };

    const data = [
        0x4d, 0x54, 0x68, 0x64,
        0x00, 0x00, 0x00, 0x06,
        0x00, 0x01,
        0x00, 0x01,
        0x00, 0xc0,
        0x4d, 0x54, 0x72, 0x6b,
        0x00, 0x00, 0x00, 0x0c,
        0x00, 0x90, 0x40, 0x60,
        0x40, 0x80, 0x40, 0x60,
        0x10, 0xff, 0x2f, 0x00
    ];

    beforeAll(() => {
        jest.spyOn(fs, 'readFileSync').mockReturnValue(Buffer.from(data));

        fn = fs.readFileSync as (typeof fs.readFileSync & { mockRestore(): void });
    });

    test('fs.readFileSync was correctly mocked', () => {
        expect(fn).toBe(fs.readFileSync);
    });

    test('creating a new midi reader with an invalid argument throws an error', () => {
        expect(() => new MidiReader(undefined as unknown as string)).toThrow();
        expect(() => new MidiReader(1 as unknown as string)).toThrow();
        expect(() => new MidiReader([ 1, 5, 6, -1, 0 ])).toThrow('byte 3: -1');
        expect(() => new MidiReader([ 1, 5, 6, 256, -1 ])).toThrow('byte 3: 256; byte 4: -1');
    });

    test('creating a new midi reader with an array argument creates a functional midi reader with these bytes', () => {
        const reader = new MidiReader(data);
        const ret = reader.toScoreContents();

        expect(reader.contents).toStrictEqual(data);
        expect(ret).toStrictEqual([
            [
                Melody.from([ { pitch: [ 0x40 ], velocity: 0x60, duration: 0x40, at: 0x00, } ], {})
            ],
            192
        ]);
    });

    test('creating a new midi reader with a string argument reads a file successfully using a mock', () => {
        const reader = new MidiReader('test');
        const ret = reader.toScoreContents();

        expect(fn).toHaveBeenCalledWith('test');
        expect(reader.contents).toStrictEqual(data);
        expect(ret).toStrictEqual([
            [
                Melody.from([ { pitch: [ 0x40 ], velocity: 0x60, duration: 0x40, at: 0x00, } ], {})
            ],
            192
        ]);
    });

    afterAll(() => fn.mockRestore());
});

describe('slurp()/peek()', () => {
    const data = [
        0x4d, 0x54, 0x68, 0x64,
        0x00, 0x00, 0x00, 0x06,
        0x00, 0x01,
        0x00, 0x01,
        0x00, 0xc0,
        0x4d, 0x54, 0x72, 0x6b,
        0x00, 0x00, 0x00, 0x0c,
        0x00, 0x90, 0x40, 0x60,
        0x40, 0x80, 0x40, 0x60,
        0x10, 0xff, 0x2f, 0x00
    ];

    const reader = new MidiReader(data);

    test('slurping invalid length fails', () => {
        expect(() => reader.slurp(-1)).toThrow();
    });

    test('peeking empty midi reader fails', () => {
        expect(() => new MidiReader([]).peek()).toThrow();
    });

    test('peeking and slurping is as expected', () => {
        expect(reader.peek()).toStrictEqual(0x4d);
        expect(reader.slurp(4)).toStrictEqual([ 0x4d, 0x54, 0x68, 0x64 ]);
        expect(reader.peek()).toStrictEqual(0x00);
        expect(reader.slurp(4)).toStrictEqual([ 0x00, 0x00, 0x00, 0x06 ]);
    });
});

describe('extractNumberFromVariableBytes()', () => {
    const errortable: [ string, number[] ][] = [
        [ 'no bytes available', [] ],
        [ 'one byte >= 0x80', [ 0x80 ] ],
        [ 'two bytes >= 0x80', [ 0xff, 0xff ] ],
    ];

    test.each(errortable)('throws when %s', (_, bytes) => {
        expect(() => new MidiReader(bytes).extractNumberFromVariableBytes()).toThrow();
    });

    const table: [ string, number[], number, number ][] = [
        [ '0 from one byte', [ 0x00 ], 0, 1 ],
        [ '127 from one byte', [ 0x7f ], 0x7f, 1 ],
        [ '128 from two bytes', [ 0x00, 0x01 ], 0, 1 ],
        [ '16383 from two bytes', [ 0xff, 0x7f ], 0x3fff, 2 ],
        [ '16383 from four bytes', [ 0xff, 0x7f, 0x7e, 0x7d ], 0x3fff, 2 ],
        [ '16448 from three bytes', [ 0x81, 0x80, 0x40 ], 0x4040, 3 ],
    ];

    test.each(table)('extracts %s', (_, bytes, ret, curr) => {
        const reader = new MidiReader(bytes);

        expect(reader.extractNumberFromVariableBytes()).toStrictEqual(ret);
        expect(reader.currentbyte).toStrictEqual(curr);
    });
});

describe('extractMidiVersionFromHeader()', () => {
    const base = [ ...MIDI.HEADER_CHUNK, ...MIDI.HEADER_LENGTH, ...MIDI.HEADER_FORMAT, 0xff, 0x00 ];

    test('throws if incorrect value present in header chunk', () => {
        const arr = base.slice();
        arr[0] = 0x4f;

        expect(() => new MidiReader(arr).extractMidiVersionFromHeader()).toThrow();
    });

    test('throws if incorrect value present in header length', () => {
        const arr = base.slice();
        arr[7] = 0x07;

        expect(() => new MidiReader(arr).extractMidiVersionFromHeader()).toThrow();
    });

    test('returns 1 and the remaining bits if version 1', () => {
        const arr = base.slice();

        const reader = new MidiReader(arr);

        expect(reader.extractMidiVersionFromHeader()).toStrictEqual(1);
        expect(reader.currentbyte).toStrictEqual(10);
    });

    test('returns 2 and the remaining bits if version 2', () => {
        const arr = base.slice();
        arr[9] = 0x02;

        const reader = new MidiReader(arr);

        expect(reader.extractMidiVersionFromHeader()).toStrictEqual(2);
        expect(reader.currentbyte).toStrictEqual(10);
    });
});

describe('extractTwoByteNumber()', () => {
    test('throws if insufficient bytes are present', () => {
        expect(() => new MidiReader([ 0 ]).extractTwoByteNumber()).toThrow();
    });

    test('extracts 1 correctly', () => {
        const reader = new MidiReader([ 0, 1 ]);

        expect(reader.extractTwoByteNumber()).toStrictEqual(1);
        expect(reader.currentbyte).toStrictEqual(2);
    });

    test('extracts 258 correctly', () => {
        const reader = new MidiReader([ 1, 2, 3, 4, 5 ]);

        expect(reader.extractTwoByteNumber()).toStrictEqual(258);
        expect(reader.currentbyte).toStrictEqual(2);
    });
});

describe('extractTrackBytes()', () => {
    test('throws if insufficient bytes are present', () => {
        const arr = [ ...MIDI.TRACK_HEADER_CHUNK, 0, 0, 0, 0 ];

        expect(() => new MidiReader(arr.slice(0, 2)).extractTrackBytes()).toThrow();
        expect(() => new MidiReader(arr.slice(0, 6)).extractTrackBytes()).toThrow();
    });

    test('throws if a header byte is wrong', () => {
        const arr = [ ...MIDI.TRACK_HEADER_CHUNK, 0, 0, 0, 0 ];
        arr[3]--;

        expect(() => new MidiReader(arr).extractTrackBytes()).toThrow();
    });

    test('throws if insufficient track bytes are present', () => {
        const arr = [ ...MIDI.TRACK_HEADER_CHUNK, 0, 0, 0, 8, 0, 0, 1, 1, 2, 2, 3 ];

        expect(() => new MidiReader(arr).extractTrackBytes()).toThrow();
    });

    const table: [ string, number[], number[], number ][] = [
        [ 'if no tracks are present', [ 0, 0, 0, 0 ], [], 8 ],
        [ 'track is empty', [ 0, 0, 0, 0, 0, 0, 1, 1, 2, 2, 3 ], [], 8 ],
        [ 'only some bytes should be extracted', [ 0, 0, 0, 4, 0, 0, 1, 1, 2, 2, 3 ], [ 0, 0, 1, 1 ], 12 ],
        [ 'all bytes should be extracted', [ 0, 0, 0, 7, 0, 0, 1, 1, 2, 2, 3 ], [ 0, 0, 1, 1, 2, 2, 3 ], 15 ],
    ];

    test.each(table)('extracts correctly when %s', (_, arr, ret, curr) => {
        const reader = new MidiReader([ ...MIDI.TRACK_HEADER_CHUNK, ...arr ]);

        expect(reader.extractTrackBytes()).toStrictEqual(ret);
        expect(reader.currentbyte).toStrictEqual(curr);
    });
});

describe('extractMidiTrackEvents()', () => {
    const errortable: [ string, number[], string ][] = [
        [ 'controller number is out of range', [ 0x00, 0xb0, 0x80, 0x00 ], 'controller number out of range' ],
        [ 'controller value is out of range', [ 0x00, 0xb0, 0x00, 0x80 ], 'controller value out of range' ],
        [ 'an instrument value is out of range', [ 0x00, 0xc0, 0x80 ], 'instrument out of range' ],
        [ 'insufficient bytes are present in a meta-event', [ 0x00, 0xff ], 'tried to slurp' ],
        [ 'end track event occurs before the end', [ 0x00, 0xff, 0x2f, 0x00, 0xff, 0x2f, 0x00 ], 'end track event with 3 bytes remaining' ],
        [ 'end track event has length greater than 0', [ 0x00, 0xff, 0x2f, 0x01, 0x01 ], 'wrong number of bytes in end track event' ],
        [ 'tempo event has wrong numeric length', [ 0x00, 0xff, 0x51, 0x04, 0x06, 0x5b, 0x9b, 0x00 ], 'wrong number of bytes in tempo event' ],
        [ 'an 0x58 in an event is not followed by 0x04', [ 0x00, 0xff, 0x58, 0x05, 0x09, 0x03, 0x18, 0x08, 0x22, 0x7f ], 'wrong number of bytes in time signature event'],
        [ 'a time signature event has the wrong 4th byte', [ 0x00, 0xff, 0x58, 0x04, 0x03, 0x02, 0x18, 0x03 ], 'fourth byte of time signature event should be 0x04' ],
        [ 'a key signature has the wrong 1st byte', [ 0x00, 0xff, 0x59, 0x01, 0x00, 0x08 ], 'wrong number of bytes in key signature event' ],
        [ 'throws if a key signature has a too-high 2nd byte',[ 0x00, 0xff, 0x59, 0x02, 0x08, 0x00 ], 'invalid first byte of key signature event' ],
        [ 'throws if a key signature has a too-low 2nd byte', [ 0x00, 0xff, 0x59, 0x02, 0xf8, 0x00 ], 'invalid first byte of key signature event' ],
        [ 'throws if a key signature has a too-high 3rd byte', [ 0x00, 0xff, 0x59, 0x02, 0x00, 0x02 ], 'second byte of key signature event must be 0x00 or 0x01' ],
    ];

    test.each(errortable)('throws if %s', (_, bytes, errmsg) => {
        const reader = new MidiReader(bytes);

        expect(() => reader.extractMidiTrackEvents()).toThrow(errmsg);
    });

    const table: [ string, number[], MelodyMemberArg[], MetaEventArg[], number ][] = [
        [
            'discards byte that implies a non-existent running status',
            [ 0x00, 0x20 ],
            [],
            [],
            1,
        ],
        [
            'note off event without note on event',
            [ 0x00, 0x80, 0x30, 0x20 ],
            [],
            [],
            1
        ],
        [
            'note on event without note off event',
            [ 0x00, 0x90, 0x30, 0x20 ],
            [],
            [],
            1
        ], 
        [
            'note events discarded if pitch is out of range',
            [ 0x00, 0x90, 0x80, 0x20, 0x20, 0x80, 0x80, 0x20 ],
            [],
            [],
            1
        ],
        [
            'note events discarde if velocity is out of range',
            [ 0x40, 0x80, 0x20, 0x80, 0x20, 0x80, 0x20, 0x80 ],
            [],
            [],
            1
        ],
        [
            'note events on channel 1',
            [ 0x00, 0x90, 0x30, 0x20, 0x20, 0x80, 0x30, 0x20 ],
            [ { pitch: 0x30, velocity: 0x20, at: 0x00, duration: 0x20 } ],
            [],
            1
        ],
        [
            'note events on channel 16',
            [ 0x81, 0x00, 0x9f, 0x40, 0x30, 0x40, 0x8f, 0x40, 0x30 ],
            [ { pitch: 0x40, velocity: 0x30, at: 0x80, duration: 0x40 } ],
            [],
            16
        ],
        [
            'overlapping note events, two with identical pitch and velocity',
            [
                0x00, 0x90, 0x30, 0x20,
                0x10, 0x90, 0x34, 0x24,
                0x20, 0x90, 0x30, 0x20,
                0x10, 0x80, 0x30, 0x20,
                0x10, 0x80, 0x30, 0x20,
                0x20, 0x80, 0x34, 0x24
            ],
            [
                { pitch: 0x30, velocity: 0x20, at: 0x00, duration: 0x40 },
                { pitch: 0x30, velocity: 0x20, at: 0x30, duration: 0x20 },
                { pitch: 0x34, velocity: 0x24, at: 0x10, duration: 0x60 },
            ],
            [],
            1
        ],
        [
            'unsupported polyphonic key press event',
            [ 0x00, 0xa0, 0x00, 0x00 ],
            [],
            [],
            1
        ],
        [
            'an instrument event on channel 4',
            [ 0x00, 0xc3, 0x48 ],
            [],
            [ { event: 'instrument', value: 0x48, at: 0x00 } ],
            4
        ],
        [
            'an instrument event on channel 9',
            [ 0x88, 0x81, 0x00, 0xc8, 0x32 ],
            [],
            [ { event: 'instrument', value: 0x32, at: 0x20080 } ],
            9
        ],
        [
            'unsupported channel aftertouch event',
            [ 0x00, 0xd0, 0x00 ],
            [],
            [],
            1
        ],
        [
            'a pitch bend event on channel 1',
            [ 0x00, 0xe0, 0x02, 0x00 ],
            [],
            [ { event: 'pitch-bend', value: 256, at: 0x00 } ],
            1
        ],
        [
            'a pitch bend event on channel 16',
            [ 0x00, 0xef, 0x40, 0x80 ],
            [],
            [ { event: 'pitch-bend', value: 8320, at: 0x00 } ],
            16
        ],
        [
            'a generic unsupported event',
            [ 0x00, 0xf0 ],
            [],
            [],
            1
        ],
        [
            'a text event',
            [ 0x00, 0xff, 0x01, 0x03, 0x68, 0x69, 0x21 ],
            [],
            [ { event: 'text', value: 'hi!', at: 0x00 } ],
            1
        ],
        [
            'a copyright event',
            [ 0x00, 0xff, 0x02, 0x03, 0x68, 0x69, 0x21 ],
            [],
            [ { event: 'copyright', value: 'hi!', at: 0x00 } ],
            1
        ],
        [
            'a track name event',
            [ 0x00, 0xff, 0x03, 0x03, 0x68, 0x69, 0x21 ],
            [],
            [ { event: 'track-name', value: 'hi!', at: 0x00 } ],
            1
        ],
        [
            'an instrument name event',
            [ 0x60, 0xff, 0x04, 0x03, 0x68, 0x69, 0x21 ],
            [],
            [ { event: 'instrument-name', value: 'hi!', at: 0x60 } ],
            1
        ],
        [
            'a lyric event',
            [ 0x00, 0xff, 0x05, 0x03, 0x68, 0x69, 0x21 ],
            [],
            [ { event: 'lyric', value: 'hi!', at: 0x00 } ],
            1
        ],
        [
            'a marker event',
            [ 0x00, 0xff, 0x06, 0x03, 0x68, 0x69, 0x21 ],
            [],
            [ { event: 'marker', value: 'hi!', at: 0x00 } ],
            1
        ],
        [
            'a cue point event',
            [ 0x00, 0xff, 0x07, 0x03, 0x68, 0x69, 0x21 ],
            [],
            [ { event: 'cue-point', value: 'hi!', at: 0x00 } ],
            1
        ],
        [
            'an end track event',
            [ 0x84, 0x40, 0xff, 0x2f, 0x00 ],
            [],
            [ { event: 'end-track', at: 0x240 } ],
            1
        ],
        [
            'a tempo of 144',
            [ 0x00, 0xff, 0x51, 0x03, 0x06, 0x5b, 0x9b ],
            [],
            [ { event: 'tempo', value: 144, at: 0x00 } ],
            1
        ],
        [
            'a tempo of 60',
            [ 0x82, 0x02, 0xff, 0x51, 0x03, 0x0f, 0x42, 0x40 ],
            [],
            [ { event: 'tempo', value: 60, at: 0x102 } ],
            1
        ],
        [
            'a 2/1 time signature',
            [ 0x00, 0xff, 0x58, 0x04, 0x02, 0x00, 0x18, 0x08 ],
            [],
            [ { event: 'time-signature', value: '2/1', at: 0x00 } ],
            1
        ],
        [
            'a 9/8 time signature',
            [ 0x81, 0x40, 0xff, 0x58, 0x04, 0x09, 0x03, 0x18, 0x08 ],
            [],
            [ { event: 'time-signature', value: '9/8', at: 0xc0 } ],
            1
        ],
        [
            'an unsupported meta-event',
            [ 0x00, 0xff, 0x54, 0x05, 0x10, 0x00, 0x00, 0x18, 0x00 ],
            [],
            [],
            1
        ],
    ];

    test.each(table)('extracts %s as expected', (_, bytes, notes, otherEvents, channel) => {
        const reader = new MidiReader(bytes);

        reader.extractMidiTrackEvents();

        expect(reader.notes).toStrictEqual(notes);
        expect(reader.otherEvents).toStrictEqual(otherEvents);
        expect(reader.channel).toStrictEqual(channel);
    });

    const chandata: [ number[], undefined | MetaEventArg[] ][] = [
        [
            [ 0xb0, MIDI.SUSTAIN_CONTROLLER, MIDI.EVENT_ON_VALUE ],
            [ { event: 'sustain', value: 1, at: 0 } ],
        ],
        [
            [ 0xb1, MIDI.SUSTAIN_CONTROLLER, MIDI.EVENT_OFF_VALUE ],
            [ { event: 'sustain', value: 0, at: 0 } ],
        ],
        [
            [ 0xb2, MIDI.VOLUME_CONTROLLER, 0x00 ],
            [ { event: 'volume', value: 0, at: 0 } ],
        ],
        [
            [ 0xb3, MIDI.VOLUME_CONTROLLER, 0x7f ],
            [ { event: 'volume', value: 127, at: 0 } ],
        ],
        [
            [ 0xb4, MIDI.PAN_CONTROLLER, 0x00 ],
            [ { event: 'pan', value: 0, at: 0 } ],
        ],
        [
            [ 0xb5, MIDI.PAN_CONTROLLER, 0x7f ],
            [ { event: 'pan', value: 127, at: 0 } ],
        ],
        [
            [ 0xb6, MIDI.BALANCE_CONTROLLER, 0x00 ],
            [ { event: 'balance', value: 0, at: 0 } ],
        ],
        [
            [ 0xb7, MIDI.BALANCE_CONTROLLER, 0x7f ],
            [ { event: 'balance', value: 127, at: 0 } ],
        ],
        [
            [ 0xb0, 0x09, 0x00 ],
            [],
        ]
    ];

    test.each(chandata)('decode controller event %j to %j', (bytes, ret) => {
        const channel = bytes[0] & 0x0f;
        const reader = new MidiReader([ 0x00, ...bytes ]);

        reader.extractMidiTrackEvents();

        expect(reader.notes).toStrictEqual([]);
        expect(reader.otherEvents).toStrictEqual(ret);
        expect(reader.channel).toStrictEqual(channel + 1);
    });

    const maj: [ number, string ][] = [
        [ 0xf9, 'Cb' ],
        [ 0xfa, 'Gb' ],
        [ 0xfb, 'Db' ],
        [ 0xfc, 'Ab' ],
        [ 0xfd, 'Eb' ],
        [ 0xfe, 'Bb' ],
        [ 0xff, 'F' ],
        [ 0x00, 'C' ],
        [ 0x01, 'G' ],
        [ 0x02, 'D' ],
        [ 0x03, 'A' ],
        [ 0x04, 'E' ],
        [ 0x05, 'B' ],
        [ 0x06, 'F#' ],
        [ 0x07, 'C#' ]
    ];

    test.each(maj)('extracting minor keys: byte %i gives key %s', (byte, key) => {
        const arr = [ 0x00, 0xff, 0x59, 0x02, byte, 0x00 ];

        const reader = new MidiReader(arr);
        reader.extractMidiTrackEvents();

        expect(reader.notes).toStrictEqual([]);
        expect(reader.otherEvents).toEqual([ { event: 'key-signature', value: key, at: 0x00 } ]);
        expect(reader.channel).toStrictEqual(1);
    });

    const min: [ number, string ][] = [
        [ 0xf9, 'ab' ],
        [ 0xfa, 'eb' ],
        [ 0xfb, 'bb' ],
        [ 0xfc, 'f' ],
        [ 0xfd, 'c' ],
        [ 0xfe, 'g' ],
        [ 0xff, 'd' ],
        [ 0x00, 'a' ],
        [ 0x01, 'e' ],
        [ 0x02, 'b' ],
        [ 0x03, 'f#' ],
        [ 0x04, 'c#' ],
        [ 0x05, 'g#' ],
        [ 0x06, 'd#' ],
        [ 0x07, 'a#' ],
    ];

    test.each(min)('extracting minor keys: byte %i gives key %s', (byte, key) => {
        const arr = [ 0x00, 0xff, 0x59, 0x02, byte, 0x01 ];

        const reader = new MidiReader(arr);
        reader.extractMidiTrackEvents();

        expect(reader.notes).toStrictEqual([]);
        expect(reader.otherEvents).toEqual([ { event: 'key-signature', value: key, at: 0x00 } ]);
        expect(reader.channel).toStrictEqual(1);
    });

    const combined: [ string, number[], MelodyMemberArg[], MetaEventArg[], number ][] = [
        [
            'an empty track successfully',
            [],
            [],
            [],
            1
        ],
        [
            'a track containing only an end track event at tick 64',
            [ 0x40, 0xff, 0x2f, 0x00 ],
            [],
            [ { event: 'end-track', at: 0x40 } ],
            1
        ],
        [
            'a track containing only an end track event at tick 192',
            [ 0x81, 0x40, 0xff, 0x2f, 0x00 ],
            [],
            [ { event: 'end-track', at: 0xc0 } ],
            1
        ],
        [
            'a track containing three events',
            [
                0x00, 0x90, 0x40, 0x60, // note on on channel 1
                0x40, 0x80, 0x40, 0x60, // note off on channel 1
                0x10, 0xff, 0x2f, 0x00, // end track
            ],
            [
                { pitch: 0x40, velocity: 0x60, at: 0x00, duration: 0x40 },
            ],
            [ { event: 'end-track', at: 0x50 } ],
            1,
        ],
        [
            'a track containing seven events on multiple channels both using and not using running status',
            [
                0x00, 0x92, 0x40, 0x60, // note on on channel 3
                0x00, 0x50, 0x60, // note on on channel 3 (using running status)
                0x00, 0x91, 0x60, 0x60, // note on on channel 2 (not using running status)
                0x40, 0x82, 0x40, 0x60, // note off on channel 3
                0x00, 0x50, 0x60, // note off on channel 3 (using running status)
                0x00, 0x81, 0x60, 0x60, // note off on channel 2 (not using running status)
                0x10, 0xff, 0x2f, 0x00, // end track
            ],
            [
                { pitch: 0x40, velocity: 0x60, at: 0x00, duration: 0x40 },
                { pitch: 0x50, velocity: 0x60, at: 0x00, duration: 0x40 },
                { pitch: 0x60, velocity: 0x60, at: 0x00, duration: 0x40 },
            ],
            [ { event: 'end-track', at: 0x50 } ],
            1,
        ],
        [
            'extract a track containing more events on channel 5',
            [
                0x00, 0xff, 0x02, 0x04, 0x54, 0x65, 0x73, 0x74, // Copyright: "Test"
                0x00, 0xc4, 0x32, // Instrument 0x32 on channel 5
                0x00, 0x94, 0x30, 0x30, // Note on on channel 5
                0x82, 0x00, 0x84, 0x30, 0x30, // Note off on channel 5
                0x00, 0xff, 0x2f, 0x00
            ],
            [
                { pitch: 0x30, velocity: 0x30, at: 0x00, duration: 0x100 },
            ],
            [
                { event: 'copyright', value: 'Test', at: 0 },
                { event: 'instrument', value: 0x32, at: 0 },
                { event: 'end-track', at: 0x100 }
            ],
            5
        ],
    ];

    test.each(combined)('extract %s', (_, bytes, notes, otherEvents, channel) => {
        const reader = new MidiReader(bytes);

        reader.extractMidiTrackEvents();

        expect(reader.notes).toStrictEqual(notes);
        expect(reader.otherEvents).toStrictEqual(otherEvents);
        expect(reader.channel).toStrictEqual(channel);
    });
});

describe('extractMidiTrack()', () => {
    test('extract an empty track successfully', () => {
        expect(new MidiReader([]).extractMidiTrack()).toStrictEqual(Melody.from([], {}));
    });

    test('extracting a track containing only an end track event removes that event', () => {
        const arr = [ 0x40, 0xff, 0x2f, 0x00 ];

        expect(new MidiReader(arr).extractMidiTrack()).toStrictEqual(Melody.from([], {}));
    });

    test('extract a track containing note on and off events but with end track event missing', () => {
        const arr = [
            0x00, 0x95, 0x40, 0x60, // Note on, channel 6
            0x40, 0x85, 0x40, 0x60, // Note off, channel 6
        ];

        expect(new MidiReader(arr).extractMidiTrack()).toStrictEqual(Melody.from([
            { pitch: [ 0x40 ], velocity: 0x60, at: 0x00, duration: 0x40 }
        ], { midichannel: 6 }));
    });

    test('extract a track containing note on and off events on two channels, keeps events and does not set track channel', () => {
        const arr = [
            0x00, 0x93, 0x40, 0x60, // Note on, channel 4
            0x40, 0x83, 0x40, 0x60, // Note off, channel 4
            0x00, 0x91, 0x4c, 0x60, // Note on, channel 2
            0x00, 0x91, 0x50, 0x60, // Note on, channel 2
            0x81, 0x00, 0x81, 0x4c, 0x60, // Note off, channel 2
            0x00, 0x81, 0x50, 0x60, // Note off channel 2
            0x10, 0xff, 0x2f, 0x00 // End track
        ];

        expect(new MidiReader(arr).extractMidiTrack()).toStrictEqual(Melody.from([
            { pitch: [ 0x40 ], velocity: 0x60, at: 0x00, duration: 0x40 },
            { pitch: [ 0x4c ], velocity: 0x60, at: 0x40, duration: 0x80 },
            { pitch: [ 0x50 ], velocity: 0x60, at: 0x40, duration: 0x80 }
        ], {}));
    });

    test('extract a track containing more events', () => {
        const arr = [
            0x00, 0xff, 0x02, 0x04, 0x54, 0x65, 0x73, 0x74, // Copyright: "Test"
            0x00, 0xc4, 0x38, // Instrument 0x38 on channel 5 (= trumpet)
            0x00, 0x94, 0x30, 0x30, // Note on on channel 5
            0x82, 0x00, 0x84, 0x30, 0x30, // Note off on channel 5
            0x00, 0xff, 0x2f, 0x00 // End track
        ];

        expect(new MidiReader(arr).extractMidiTrack()).toStrictEqual(Melody.from([
            { pitch: [ 0x30 ], velocity: 0x30, at: 0x00, duration: 0x100 },
        ], {
            midichannel: 5,
            copyright: 'Test',
            instrument: 'trumpet'
        }));
    });
});

describe('toScoreContents()', () => {
    test('throws if MIDI version is not 0 or 1', () => {
        const arr = [
            0x4d, 0x54, 0x68, 0x64,
            0x00, 0x00, 0x00, 0x06,
            0x00, 0x02,
            0x00, 0x00,
            0x00, 0xc0,
        ];

        expect(() => new MidiReader(arr).toScoreContents()).toThrow();
    });

    test('extract zero tracks', () => {
        const arr = [
            0x4d, 0x54, 0x68, 0x64,
            0x00, 0x00, 0x00, 0x06,
            0x00, 0x01,
            0x00, 0x00,
            0x00, 0xc0,
        ];

        expect(new MidiReader(arr).toScoreContents()).toStrictEqual([ [], 192 ]);
    });

    test('throws if ticks per quarter is zero', () => {
        const arr = [
            0x4d, 0x54, 0x68, 0x64,
            0x00, 0x00, 0x00, 0x06,
            0x00, 0x01,
            0x00, 0x00,
            0x00, 0x00,
        ];

        expect(() => new MidiReader(arr).toScoreContents()).toThrow();
    });

    test('extract a single track containing four events, one unsupported', () => {
        const arr = [
            0x4d, 0x54, 0x68, 0x64,
            0x00, 0x00, 0x00, 0x06,
            0x00, 0x01,
            0x00, 0x01,
            0x01, 0x80,
            0x4d, 0x54, 0x72, 0x6b,
            0x00, 0x00, 0x00, 0x10,
            0x00, 0x90, 0x40, 0x60,
            0x00, 0xb0, 0x09, 0x00,
            0x40, 0x80, 0x40, 0x60,
            0x10, 0xff, 0x2f, 0x00
        ];

        expect(new MidiReader(arr).toScoreContents()).toStrictEqual([
            [
                Melody.from([ { pitch: [ 0x40 ], velocity: 0x60, duration: 0x40, at: 0x00, } ], {})
            ],
            384
        ]);
    });

    test('throw when bytes claiming to contain two tracks actually contain one', () => {
        const arr = [
            0x4d, 0x54, 0x68, 0x64,
            0x00, 0x00, 0x00, 0x06,
            0x00, 0x01,
            0x00, 0x02,
            0x00, 0xc0,
            0x4d, 0x54, 0x72, 0x6b,
            0x00, 0x00, 0x00, 0x0c,
            0x00, 0x90, 0x40, 0x60,
            0x40, 0x80, 0x40, 0x60,
            0x10, 0xff, 0x2f, 0x00
        ];

        expect(() => new MidiReader(arr).toScoreContents()).toThrow();
    });

    test('extract three tracks, one with no notes', () => {
        const arr = [
            0x4d, 0x54, 0x68, 0x64,
            0x00, 0x00, 0x00, 0x06,
            0x00, 0x01,
            0x00, 0x03,
            0x00, 0xc0,
            0x4d, 0x54, 0x72, 0x6b,
            0x00, 0x00, 0x00, 0x14,
            0x00, 0xb0, 0x40, 0x7f,
            0x00, 0x90, 0x40, 0x60,
            0x40, 0x80, 0x40, 0x60,
            0x40, 0xb0, 0x40, 0x00,
            0x10, 0xff, 0x2f, 0x00,
            0x4d, 0x54, 0x72, 0x6b,
            0x00, 0x00, 0x00, 0x0c,
            0x00, 0x91, 0x50, 0x40,
            0x40, 0x81, 0x50, 0x40,
            0x10, 0xff, 0x2f, 0x00,
            0x4d, 0x54, 0x72, 0x6b,
            0x00, 0x00, 0x00, 0x04,
            0x50, 0xff, 0x2f, 0x00
        ];

        expect(new MidiReader(arr).toScoreContents()).toStrictEqual([
            [
                Melody.from([ { pitch: [ 0x40 ], velocity: 0x60, duration: 0x40, at: 0x00 } ],
                    {
                        before: MetaList.from([
                            { event: 'sustain', value: 1, at: 0x00 },
                            { event: 'sustain', value: 0, at: 0x80 },
                        ])
                    }),
                Melody.from([ { pitch: [ 0x50 ], velocity: 0x40, duration: 0x40, at: 0x00 } ], { midichannel: 2 }),
                Melody.from([], {}),
            ],
            192
        ]);
    });
});