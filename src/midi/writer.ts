import * as fs from 'fs';

/**
 * Write a buffer to a file.
 */
export function writeBufferToFile(file: string, buf: Buffer): void {
    if (typeof file !== 'string') {
        throw new Error('file must be a string');
    }

    if (!(buf instanceof Buffer)) {
        throw new Error('buf must be a buffer');
    }

    fs.writeFileSync(file, buf);
}
