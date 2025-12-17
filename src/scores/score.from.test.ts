import * as fs from 'fs';

import Score from './score';

import Melody from '../sequences/melody';
import MetaList from '../meta-events/meta-list';
import Metadata from '../metadata/metadata';

// This needs to be in a separate file so that the readFileSync mock doesn't
// clobber the use of that method during canvas rendering
jest.mock('fs', () => {
    const mockfs = jest.requireActual('fs');

    return {
        ...mockfs,
        readFileSync: jest.fn(mockfs.writeFileSync),
    };
});

describe('Score.from() with file argument', () => {
    beforeAll(() => jest.spyOn(fs, 'readFileSync').mockReturnValue(Buffer.from([
        77,  84, 104, 100,   0,   0,  0,   6,  0,  1,  0,   1,
        0, 192,  77,  84, 114, 107,  0,   0,  0, 32,  0, 176,
        64, 127,   0, 144,  60,  64, 16, 128, 60, 64,  0, 144,
        67,  64,  16, 128,  67,  64,  0, 144, 72, 64, 16, 128,
        72,  64,   0, 255,  47,   0
    ])));
    afterAll(() => jest.restoreAllMocks());

    test('read file successfully using a mock', () => {
        expect(Score.from('test')).toStrictEqual(Score.from(
            [
                Melody.from([
                    { pitch: [ 0x3c ], velocity: 0x40, duration: 0x10, at: 0x00 },
                    { pitch: [ 0x43 ], velocity: 0x40, duration: 0x10, at: 0x10 },
                    { pitch: [ 0x48 ], velocity: 0x40, duration: 0x10, at: 0x20 }
                ], Metadata.from({ before: MetaList.from([ { event: 'sustain', value: 1, at: 0 } ]) }))
            ]
        ).withTicksPerQuarter(192));
    });
});