import type { SeqArgument, MetadataData } from './types';

import NumericValidator from './validation/numeric';

import NumSeq from './sequences/number';
import NoteSeq from './sequences/note';
import ChordSeq from './sequences/chord';
import Melody from './sequences/melody';
import Score from './scores/score';
import Registry from './registry/registry';

Registry.set_numseq_from_method(NumSeq.from);
Registry.set_noteseq_from_method(NoteSeq.from);
Registry.set_chordseq_from_method(ChordSeq.from);
Registry.set_melody_from_method(Melody.from);

/**
 * A factory module for creating various entities used in Palestrina.
 */
function applyMetadataFloatDefaults(m: MetadataData = {}): MetadataData {
    if (!('validator' in m)) {
        m.validator = NumericValidator.NOOP_VALIDATOR;
    }

    return m;
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