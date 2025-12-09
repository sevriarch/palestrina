// Wrapper module around all types of Sequence that ensures they provide intra-Sequence
// conversion methods. If new types of Sequence are added, they must be inserted here too.
//
// This prevents issues with circular imports.

import { SeqArgument, Metadata } from '../types';

import NumSeq from './number';
import NoteSeq from './note';
import ChordSeq from './chord';
import Melody from './melody';

class Conversions {
    contents!: SeqArgument;
    metadata!: Metadata;

    toNumSeq(): NumSeq {
        return NumSeq.from(this.contents, this.metadata);
    }

    toNoteSeq(): NoteSeq {
        return NoteSeq.from(this.contents, this.metadata);
    }

    toChordSeq(): ChordSeq {
        return ChordSeq.from(this.contents, this.metadata);
    }

    toMelody(): Melody {
        return Melody.from(this.contents, this.metadata);
    }
}

function applyMixins(seqCtor: any[]) {
    seqCtor.forEach(ctor => {
        [ 'toNumSeq', 'toNoteSeq', 'toChordSeq', 'toMelody' ].forEach(name => {
            Object.defineProperty(ctor.prototype,
                name,
                Object.getOwnPropertyDescriptor(Conversions.prototype, name) as PropertyDescriptor
            );
        });
    });
}

applyMixins([ NumSeq, NoteSeq, ChordSeq, Melody ]);

export { NumSeq, NoteSeq, ChordSeq, Melody };