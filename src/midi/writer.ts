import type { Renderable } from '../types';

import { toMidiBytes}  from './conversions'; 

import * as fs from 'fs';
import crypto from 'crypto';

import { dumpOneLine } from '../dump/dump';

/**
 * Write the contents of a Score or Melody to a file.
 * 
 * Second argument must be an object that implements the toMidiBytes() method.
 */
export function writeToFile(file: string, entity: Renderable) {
    if (typeof file !== 'string') {
        throw new Error(`MidiWriter.writeMidi(): filename must be a file, was ${dumpOneLine(file)}`);
    }

    fs.writeFileSync(file + '.mid', Buffer.from(toMidiBytes(entity)));
}

/**
 * Returns the MIDI bytes of this Score or Melody in the form of a data URI.
 */
export function toDataURI(entity: Renderable): string {
    return 'data:audio/midi;base64,' + Buffer.from(toMidiBytes(entity)).toString('base64');
}

/**
 * Returns a hash of the MIDI bytes for this Score or Melody.
 */
export function toHash(entity: Renderable): string {
    const arr = toMidiBytes(entity);
    const hash = crypto.createHash('md5');

    hash.update(Buffer.from(arr));

    return hash.digest('hex');
}

/**
 * Throws unless the hash of the MIDI bytes for this Score or Melody is as expected.
 */
export function expectHash(entity: Renderable, expected: string) {
    const hash = toHash(entity);

    if (expected !== hash) {
        throw new Error(`${entity.constructor.name}.expectHash(): hash mismatch: expected ${expected}, got ${hash}`);
    }
}