import type { TimedEntity } from '../types';

import * as fs from 'fs';

import * as midiWriter from './writer';

import MelodyMember from '../sequences/members/melody';
import Metadata from '../metadata/metadata';

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

const BAD_ENTITY = {
    metadata: Metadata.from({ ticks_per_quarter: 128 }),
    toOrderedEntitiesWithMetadata: () => 123 as unknown as [ TimedEntity[], Metadata ][]
};

const VALID_ENTITY = {
    metadata: Metadata.from({ ticks_per_quarter: 96 }),
    toOrderedEntitiesWithMetadata: () => ([
        [
            [ MelodyMember.from({ pitch: [ 60 ], velocity: 64, duration: 32, at: 0 }) ], 
            Metadata.from({ ticks_per_quarter: 96 }),
        ]
    ] as [ TimedEntity[], Metadata ][])
};

describe('midiWriter.writeToFile() tests', () => {
    beforeAll(() => jest.spyOn(fs, 'writeFileSync').mockImplementation());
    afterAll(() => jest.restoreAllMocks());

    test('throws with a non-string filename', () => {
        expect(() => midiWriter.writeToFile(0 as unknown as string, VALID_ENTITY)).toThrow();
    });

    test('throws when entity.toOrderedEntitiesWithMetadata() returns invalid data', () => {
        expect(() => midiWriter.writeToFile('test', BAD_ENTITY)).toThrow();
    });

    test('calls fs.writeFileSync() when supplied with correct arguments', () => {
        expect(() => midiWriter.writeToFile('test', VALID_ENTITY)).not.toThrow();
        expect(fs.writeFileSync).toHaveBeenLastCalledWith('test.mid', Buffer.from([
            0x4d, 0x54, 0x68, 0x64, // file header
            0x00, 0x00, 0x00, 0x06, // header data length
            0x00, 0x01, 0x00, 0x01, 0x00, 0x60, // header data
            0x4d, 0x54, 0x72, 0x6b, // track header
            0x00, 0x00, 0x00, 0x0c, // track length
            0x00, 0x90, 0x3c, 0x40, // note on
            0x20, 0x80, 0x3c, 0x40, // note off
            0x00, 0xff, 0x2f, 0x00, // end-track
        ]));
    });
});

describe('midiWriter.toDataURI()', () => {
    test('returns the expected data URI', () => {
        expect(midiWriter.toDataURI(VALID_ENTITY)).toBe('data:audio/midi;base64,TVRoZAAAAAYAAQABAGBNVHJrAAAADACQPEAggDxAAP8vAA==');
    });
});

describe('midiWriter.toHash() tests', () => {
    test('returns the expected hash value', () => {
        expect(midiWriter.toHash(VALID_ENTITY)).toBe('b8a2e662f578e133b9fd2f91353ac349');
    });
});

describe('midiWriter.expectHash() tests', () => {
    test('does nothing if expected hash value', () => {
        expect(() => midiWriter.expectHash(VALID_ENTITY, 'b8a2e662f578e133b9fd2f91353ac349')).not.toThrow();
    });

    test('throws if unexpected hash value', () => {
        expect(() => midiWriter.expectHash(VALID_ENTITY, '')).toThrow();
    });
});