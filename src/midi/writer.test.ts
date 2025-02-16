import * as fs from 'fs';

import * as midiWriter from './writer';

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

describe('midiWriter.writeToFile() tests', () => {
    beforeAll(() => jest.spyOn(fs, 'writeFileSync').mockImplementation());
    afterAll(() => jest.restoreAllMocks());

    const entity = { toMidiBytes: () => [ 1, 2, 3 ] };
    const bad = { toMidiBytes: () => 123 as unknown as number[] };

    test('throws with a non-string filename', () => {
        expect(() => midiWriter.writeToFile(0 as unknown as string, entity)).toThrow();
    });

    test('throws when entity.toMidiBytes() does not return an Array', () => {
        expect(() => midiWriter.writeToFile('test', bad)).toThrow();
    });

    test('calls fs.writeFileSync() when supplied with correct arguments', () => {
        expect(() => midiWriter.writeToFile('test', entity)).not.toThrow();
        expect(fs.writeFileSync).toHaveBeenLastCalledWith('test.mid', Buffer.from([ 1, 2, 3 ]));
    });
});

describe('midiWriter.toDataURI()', () => {
    test('returns the expected data URI', () => {
        const entity = { toMidiBytes: () => [ 1, 2, 3 ] };

        expect(midiWriter.toDataURI(entity)).toBe('data:audio/midi;base64,AQID');
    });
});

describe('midiWriter.toHash() tests', () => {
    test('returns the expected hash value', () => {
        const entity = { toMidiBytes: () => [ 1, 2, 3 ] };

        expect(midiWriter.toHash(entity)).toBe('5289df737df57326fcdd22597afb1fac');
    });
});

describe('midiWriter.expectHash() tests', () => {
    const entity = { toMidiBytes: () => [ 1, 2, 3 ] };

    test('does nothing if expected hash value', () => {
        expect(() => midiWriter.expectHash(entity, '5289df737df57326fcdd22597afb1fac')).not.toThrow();
    });

    test('throws if unexpected hash value', () => {
        expect(() => midiWriter.expectHash(entity, '')).toThrow();
    });
});