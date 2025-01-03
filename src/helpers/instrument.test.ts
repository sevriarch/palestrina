import * as instrument from './instrument';

describe('instrument.toInstrument()', () => {
    test('expect wrongly typed instrument to return undefined', () => {
        expect(instrument.toInstrument([] as unknown as string)).toBe(undefined);
    });

    test('expect out of range instrument numbers to return undefined', () => {
        expect(instrument.toInstrument(-1)).toBe(undefined);
        expect(instrument.toInstrument(256)).toBe(undefined);
    });

    test('expect invalid instrument name to return undefined', () => {
        expect(instrument.toInstrument('meowphone')).toBe(undefined);
    });

    test('expect valid instrument name to return itself', () => {
        expect(instrument.toInstrument('viola')).toBe('viola');
    });

    test('expect some common instruments to be correctly converted', () => {
        expect(instrument.toInstrument(0x00)).toBe('piano');
        expect(instrument.toInstrument(0x28)).toBe('violin');
        expect(instrument.toInstrument(0x08)).toBe('celesta');
        expect(instrument.toInstrument(0x44)).toBe('oboe');
        expect(instrument.toInstrument(0x39)).toBe('trombone');
    });
});

describe('instrument.toPercussionInstrument()', () => {
    test('expect wrongly typed instrument to return undefined', () => {
        expect(instrument.toPercussionInstrument([] as unknown as string)).toBe(undefined);
    });

    test('expect out of range instrument numbers to return undefined', () => {
        expect(instrument.toPercussionInstrument(-1)).toBe(undefined);
        expect(instrument.toPercussionInstrument(256)).toBe(undefined);
    });

    test('expect invalid instrument name to return undefined', () => {
        expect(instrument.toPercussionInstrument('meowphone')).toBe(undefined);
    });

    test('expect valid instrument name to return itself', () => {
        expect(instrument.toPercussionInstrument('maracas')).toBe('maracas');
    });

    test('expect some common instruments to be correctly converted', () => {
        expect(instrument.toPercussionInstrument(0x40)).toBe('low conga');
        expect(instrument.toPercussionInstrument(0x47)).toBe('whistle');
        expect(instrument.toPercussionInstrument(0x26)).toBe('snare drum');
    });
});

describe('instrument.toMidiByte()', () => {
    test('expect invalid instrument name to throw', () => {
        expect(() => instrument.toMidiByte('meowphone')).toThrow();
    });

    test('expect out of range instrument numbers to throw', () => {
        expect(() => instrument.toMidiByte(-1)).toThrow();
        expect(() => instrument.toMidiByte(256)).toThrow();
    });

    test('expect valid instrument numbers to pass', () => {
        expect(instrument.toMidiByte(0)).toBe(0);
        expect(instrument.toMidiByte(255)).toBe(255);
    });

    test('expect some common instruments to be correctly converted', () => {
        expect(instrument.toMidiByte('piano')).toBe(0x00);
        expect(instrument.toMidiByte('violin')).toBe(0x28);
        expect(instrument.toMidiByte('celesta')).toBe(0x08);
        expect(instrument.toMidiByte('oboe')).toBe(0x44);
        expect(instrument.toMidiByte('trombone')).toBe(0x39);
        expect(instrument.toMidiByte('bass drum')).toBe(0x23);
        expect(instrument.toMidiByte('claves')).toBe(0x4b);
    });
});