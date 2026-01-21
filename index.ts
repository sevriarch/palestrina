export type {
    ISequence, ISingleValuedSequence, ISeqMember, // interfaces
    JSONValue, Renderable, EventTiming, // general types
    Sequence, SeqMember, SeqArgument, SeqIndices, SeqMemberArgument, // generic sequence-related types
    NumSeq, NumSeqMember, // numeric sequence-related types
    NoteSeq, NoteSeqMember, // note sequence-related types
    ChordSeq, ChordSeqMember, // chord sequence-related types
    Melody, MelodyMember, MelodyMemberArg, // melody-related types
    Score, ScoreCanvasOpts, // score-related types
    PitchArgument, PitchMutatorFn, PitchMapperFn, GamutOpts, NumericValidator, // pitch-related types
    Metadata, // metadata-related types
    MetaList, MetaListArg, // meta-list-related types
    MetaEvent, MetaEventArg, // meta-event-related types
    ReplacerFn, ReplacerVal, // replacer-related types
    CtrlTypeFn, CtrlBoolFn, // control-flow function types
    FilterFn, FinderFn, ArrayFinderFn, GrouperFn, MapperFn, FlatMapperFn, ValidatorFn, // general method types
} from './src/types';

export { exportable as CONSTANTS } from './src/constants';

export * as imports from './src/imports/imports';
export * as helpers from './src/helpers/pitch';
export * as transformations from './src/transformations/transformations';

export { numseq, noteseq, chordseq, melody } from './src/sequences/sequences';

import Score from './src/scores/score';
export const score = Score.from;
