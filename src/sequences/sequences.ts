// Wrapper module around all types of Sequence that applies mixins to provide intra-Sequence
// conversion methods. If new types of Sequence are added, they must be inserted here too.
//
// This prevents issues with circular imports.
//
// Also provides the lowercase method wrappers that are exported from the main module.

import { SeqArgument, ValidatorFn, ISequence } from '../types';

import NumSeq from './number';
import NoteSeq from './note';
import ChordSeq from './chord';
import Melody from './melody';
import Metadata from '../metadata/metadata';
import NumericValidator from '../validation/numeric';

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

function applyMixins<T extends ISequence<ET>, ET>(seqCtor: new (contents: ET[], metadata: Metadata) => T) {
    [ 'toNumSeq', 'toNoteSeq', 'toChordSeq', 'toMelody' ].forEach(name => 
        Object.defineProperty(seqCtor.prototype, name, Object.getOwnPropertyDescriptor(Conversions.prototype, name) as PropertyDescriptor)
    );
}

applyMixins(NumSeq);
applyMixins(NoteSeq);
applyMixins(ChordSeq);
applyMixins(Melody);

function getValidator(type: string, custom?: ValidatorFn): NumericValidator {
    switch (type) {
    case 'int':
    case 'semitone':
        return NumericValidator.INT_VALIDATOR;
    case 'none':
    case 'microtonal':
        return NumericValidator.NOOP_VALIDATOR;
    case 'quartertone':
        return new NumericValidator('fraction', 2);
    case 'sixthtone':
        return new NumericValidator('fraction', 3);
    case 'custom':
        if (typeof custom !== 'function') {
            throw new Error('custom validators must have a validation function supplied');
        }
        return new NumericValidator(custom);
    default:
        throw new Error(`invalid validator type: ${type}`);
    }
}

function getMetadata(type: string, custom?: ValidatorFn): Metadata {
    return Metadata.from({ validator: getValidator(type, custom) });
}

export function numseq(s: SeqArgument, type = 'int', custom?: ValidatorFn): NumSeq {
    return NumSeq.from(s, getMetadata(type, custom));
}

export function noteseq(s: SeqArgument, type = 'int', custom?: ValidatorFn): NoteSeq {
    return NoteSeq.from(s, getMetadata(type, custom));
}

export function chordseq(s: SeqArgument, type = 'int', custom?: ValidatorFn): ChordSeq {
    return ChordSeq.from(s, getMetadata(type, custom));
}

export function melody(s: SeqArgument, type = 'int', custom?: ValidatorFn): Melody {
    return Melody.from(s, getMetadata(type, custom));
}

export { NumSeq, NoteSeq, ChordSeq, Melody };