import type { Midifiable } from '../types';

import * as fs from 'fs';
import crypto from 'crypto';

import { dumpOneLine } from '../dump/dump';

/**
 * Write the contents of a Score or Melody to a file.
 * 
 * Second argument must be an object that implements the toMidiBytes() method.
 */
export function writeToFile(file: string, entity: Midifiable) {
    if (typeof file !== 'string') {
        throw new Error(`MidiWriter.writeMidi(): filename must be a file, was ${dumpOneLine(file)}`);
    }

    const bytes = entity.toMidiBytes();

    if (!Array.isArray(bytes)) {
        throw new Error(`MidiWriter.writeMidi(): ${entity.constructor.name}.toMidiBytes() did not return an array of bytes; returned ${dumpOneLine(bytes)}`);
    }

    fs.writeFileSync(file + '.mid', Buffer.from(bytes));
}

/**
 * Returns a hash of the MIDI bytes for this Score or Melody.
 */
export function toHash(entity: Midifiable): string {
    const arr = entity.toMidiBytes();
    const hash = crypto.createHash('md5');

    hash.update(Buffer.from(arr));

    return hash.digest('hex');
}
