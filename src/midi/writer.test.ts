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

describe('midiWriter.writeBufferToFile() tests', () => {
    beforeAll(() => jest.spyOn(fs, 'writeFileSync').mockImplementation());
    afterAll(() => jest.restoreAllMocks());

    const buf = Buffer.from([ 1, 2, 3 ]);

    test('throws with a non-string filename', () => {
        expect(() => midiWriter.writeBufferToFile(0 as unknown as string, buf)).toThrow();
    });

    test('throws with a non-buffer buffer', () => {
        expect(() => midiWriter.writeBufferToFile('test', [ 1, 2, 3 ] as unknown as Buffer)).toThrow();
    });

    test('calls fs.writeFileSync() when supplied with correct arguments', () => {
        expect(() => midiWriter.writeBufferToFile('test', buf)).not.toThrow();
        expect(fs.writeFileSync).toHaveBeenLastCalledWith('test', buf);
    });
});