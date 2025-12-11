export type {
    ISequence, ISingleValuedSequence, ISeqMember, // interfaces
    JSONValue, TypeOrArray, // generic types
    Sequence, SeqMember, SeqArgument, SeqIndices, SeqMemberArgument, AnySeq, // generic sequence-related types
    NumSeqMember, // numeric sequence-related types
    NoteSeqMember, // note sequence-related types
    ChordSeqMember, // chord sequence-related types
    MelodyMember, MelodyMemberData, MelodyMemberArg, MelodySummary, // melody-related types
    Score, CanvasArg, CanvasArgOpts, ScoreCanvasOpts, // score-related types
    PitchArgument, PitchMutatorFn, PitchMapperFn, GamutOpts, NumericValidator, // pitch-related types
    Metadata, MetadataData, // metadata-related types
    MetaList, MetaListArg, // meta-list-related types
    MetaEvent, MetaEventArg, MetaEventOpts, // meta-event-related types
    Replacer, ReplacerFn, // replacer-related types
    CtrlTypeFn, CtrlBoolFn, // control-flow function types
    FilterFn, FinderFn, ArrayFinderFn, GrouperFn, MapperFn, FlatMapperFn, ValidatorFn, // general method types
} from './src/types';

import Registry from './src/registry/registry';
import { exportable as CONSTANTS } from './src/constants';

export { Registry, CONSTANTS };
export * as imports from './src/imports/imports';
export * as helpers from './src/helpers/pitch';
export * as transformations from './src/transformations/transformations';

export type { NumSeq, NoteSeq, ChordSeq, Melody } from './src/sequences/sequences';
export { numseq, noteseq, chordseq, melody } from './src/sequences/sequences';

import Score from './src/scores/score';
export const score = Score.from;