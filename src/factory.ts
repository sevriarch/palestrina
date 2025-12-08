import type { ValidatorFn, SeqArgument, MetadataData } from './types';

import NumericValidator from './validation/numeric';
import NumSeq from './sequences/number';
import NoteSeq from './sequences/note';
import ChordSeq from './sequences/chord';
import Melody from './sequences/melody';
import Score from './scores/score';
import Registry from './registry/registry';

import { dumpOneLine } from './dump/dump';

Registry.set_numseq_from_method(NumSeq.from);
Registry.set_noteseq_from_method(NoteSeq.from);
Registry.set_chordseq_from_method(ChordSeq.from);
Registry.set_melody_from_method(Melody.from);

/**
 * A factory module for creating various entities used in Palestrina.
 */
function applyMetadataFloatDefaults(m: MetadataData = {}): MetadataData {
    if ('validator' in m) {
        return m;
    }

    return { ...m, validator: NumericValidator.NOOP_VALIDATOR };
}

/**
 * Create a custom validator to be used by a sequence.
 * All values within the entities using this validator must pass the validator or an error will be thrown.
 */
export function validator(type = 'semitone', arg2?: ValidatorFn | number): NumericValidator {
    switch (type) {
    case 'semitone': return new NumericValidator('int');
    case 'quartertone': return new NumericValidator('fraction', 2);
    case 'sixthtone': return new NumericValidator('fraction', 3);
    case 'none': return NumericValidator.NOOP_VALIDATOR;
    case 'fraction':
        if (typeof arg2 !== 'number' || !isFinite(arg2) || arg2 <= 0) {
            throw new Error(`fraction passed in second argument must be a number greater than zero; was ${dumpOneLine(arg2)}`);
        }

        return new NumericValidator('fraction', arg2);
    case 'custom':
        if (typeof arg2 !== 'function') {
            throw new Error(`custom validator function must be passed in second argument; got ${dumpOneLine(arg2)}`);
        }

        return new NumericValidator(arg2);
    default: throw new Error(`unknown validator type: ${type}`);
    }
}

/**
 * Create a new integer sequence from one or more sequences, arrays of numbers or arrays of arrays of numbers.
 */
export function intseq(seq: SeqArgument, m?: MetadataData): NumSeq {
    return NumSeq.from(seq, m);
}

/**
 * Create a new float sequence from one or more sequences, arrays of numbers or arrays of arrays of numbers.
 */
export function floatseq(seq: SeqArgument, m?: MetadataData): NumSeq {
    return NumSeq.from(seq, applyMetadataFloatDefaults(m));
}

/**
 * Create a new note sequence from one or more sequences, arrays of numbers or arrays of arrays of numbers.
 */
export function noteseq(seq: SeqArgument, m?: MetadataData): NoteSeq {
    return NoteSeq.from(seq, m);
}

/**
 * Create a new note sequence from one or more sequences, arrays of numbers or arrays of arrays of numbers.
 */
export function microtonalnoteseq(seq: SeqArgument, m?: MetadataData): NoteSeq {
    return NoteSeq.from(seq, applyMetadataFloatDefaults(m));
}

/**
 * Create a new chord sequence from one or more sequences, arrays of numbers or arrays of arrays of numbers.
 */
export function chordseq(seq: SeqArgument, m?: MetadataData): ChordSeq {
    return ChordSeq.from(seq, m);
}

/**
 * Create a new chord sequence from one or more sequences, arrays of numbers or arrays of arrays of numbers.
 */
export function microtonalchordseq(seq: SeqArgument, m?: MetadataData): ChordSeq {
    return ChordSeq.from(seq, applyMetadataFloatDefaults(m));
}

/**
 * Create a new melody from one or more sequences, arrays of numbers or arrays of arrays of numbers.
 */
export function melody(seq: SeqArgument, m?: MetadataData): Melody {
    return Melody.from(seq, m);
}

/**
 * Create a new melody from one or more sequences, arrays of numbers or arrays of arrays of numbers.
 */
export function microtonalmelody(seq: SeqArgument, m?: MetadataData): Melody {
    return Melody.from(seq, applyMetadataFloatDefaults(m));
}

/**
 * Create a new Score from one or more Melodies, or a midi file.
 */
export function score(seq: Melody[] | string = [], opts: MetadataData = {}): Score {
    return Score.from(seq, opts);
}