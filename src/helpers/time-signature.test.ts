import * as timeSignature from './time-signature';

describe('timeSignature.validate()', () => {
    const table: [ string, boolean ][] = [
        [ '1/1', true ],
        [ '3/4', true ],
        [ '6/8', true ],
        [ '17/16', true ],
        [ '5/256', true ],
        [ '256/16', false ],
        [ '1/3', false ],
        [ '3:8', false ],
        [ '47', false ],
    ];

    test.each(table)('test %s', (t, ret) => {
        expect(timeSignature.validate(t)).toBe(ret);
    });
});

describe('timeSignature.toMidiBytes(), timeSignature.fromMidiBytes()', () => {
    test('expect invalid time signature to throw error', () => {
        expect(() => timeSignature.toMidiBytes('')).toThrow();
    });

    test('expect insufficient bytes to throw error', () => {
        expect(() => timeSignature.fromMidiBytes([ 0x1f, 0x08, 0x04 ])).toThrow();
    });

    test('expect wrong 4th byte to throw error', () => {
        expect(() => timeSignature.fromMidiBytes([ 0x1f, 0x08, 0x04, 0x07 ])).toThrow();
    });

    const table: [ string, number[] ][] = [
        [ '2/1', [ 0xff, 0x58, 0x04, 0x02, 0x00, 0x18, 0x08 ] ],
        [ '4/4', [ 0xff, 0x58, 0x04, 0x04, 0x02, 0x18, 0x08 ] ],
        [ '31/16', [ 0xff, 0x58, 0x04, 0x1f, 0x04, 0x18, 0x08 ] ],
    ];

    test.each(table)('convert %s', (ts, bytes) => {
        expect(timeSignature.toMidiBytes(ts)).toStrictEqual(bytes);
        expect(timeSignature.fromMidiBytes(bytes.slice(3))).toStrictEqual(ts);
    });
});

describe('timeSignature.toQuarterNotes()', () => {
    test('expect invalid time signature to throw error', () => {
        expect(() => timeSignature.toQuarterNotes('')).toThrow();
    });

    const table: [ string, number ][] = [
        [ '2/1', 8 ],
        [ '4/4', 4 ],
        [ '31/16', 7.75 ],
    ];

    test.each(table)('%s', (ts, notes) => {
        expect(timeSignature.toQuarterNotes(ts)).toStrictEqual(notes);
    });
});