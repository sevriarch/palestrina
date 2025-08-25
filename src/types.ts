import type Collection from './collections/without-metadata';
import type CollectionWithMetadata from './collections/with-metadata';
import type Sequence from './sequences/generic';
import type NumSeq from './sequences/number';
import type NoteSeq from './sequences/note';
import type ChordSeq from './sequences/chord';
import type Melody from './sequences/melody';
import type Score from './scores/score';

export type { Sequence, NumSeq, NoteSeq, ChordSeq, Melody, Score };

import type SeqMember from './sequences/members/generic';
import type NumSeqMember from './sequences/members/number';
import type NoteSeqMember from './sequences/members/note';
import type ChordSeqMember from './sequences/members/chord';
import type MelodyMember from './sequences/members/melody';

export type { SeqMember, NumSeqMember, NoteSeqMember, ChordSeqMember, MelodyMember };

import type MetaEvent from './meta-events/meta-event';
import type MetaList from './meta-events/meta-list';
import type Metadata from './metadata/metadata';
import type NumericValidator from './validation/numeric';
import type Timing from './timing/timing';

export type { MetaEvent, MetaList, Metadata, NumericValidator };

// Type naming scheme:
// [Entity]Seq    - type of a specific Sequence
// [Entity]Member - type of the members of a Collection subclass
// [Entity]Opts   - type of that entity's options object
// [Entity]Arg    - type representing how an entity is passed to methods consuming it
// [Entity]Data   - type representing the internal data storage of that entity
// [Entity]Value  - type corresponding to the value of an entity
// [Action]Fn     - type corresponding to a function, named after the type of action it performs

/*
 * GENERIC TYPES
 */

/**
 * A JSON value
 */
export type JSONValue = string | number | boolean | null | JSONValue[] | { [k: string]: JSONValue };

/**
 * A type or an array of that type
 */
export type TypeOrArray<T> = T | T[];

/*
 * METADATA
 */

/**
 * Data within a Metadata object
 */
export type MetadataData = {
    copyright?: string,
    trackname?: string,
    time_signature?: string,
    key_signature?: string,
    tempo?: number,
    midichannel?: number,
    before?: MetaList,
    ticks_per_quarter?: number,
    instrument?: string,
    validator?: NumericValidator,
};

/*
 * META-EVENTS AND META-LISTS
 */

/**
 * Required contents of a MetaEvent object
 */
type MetaEventDef = {
    event: 'end-track',
} | {
    event: MetaEventNumericEvent,
    value: number,
} | {
    event: MetaEventStringEvent,
    value: string,
} | {
    event: 'instrument',
    value: number | string,
};

/**
 * Optional MetaEvent properties
 */
export type MetaEventOpts = {
    offset?: number,
    at?: number
};

/**
 * Permissible types for MetaEvent values
 */
export type MetaEventValue = number | string;

/**
 * Types of MetaEvent that contain a string value
 */
export type MetaEventStringEvent = 'time-signature' | 'key-signature' | 'text' | 'copyright' | 'track-name' | 'instrument-name' | 'lyric' | 'marker' | 'cue-point';

/**
 * Types of MetaEvent that contain a numeric value
 */
export type MetaEventNumericEvent = 'tempo' | 'sustain' | 'volume' | 'pan' | 'pitch-bend' | 'balance';

/**
 * The type used to pass the contents of a MetaEvent before the event has been created
 */
export type MetaEventArg = MetaEventDef & MetaEventOpts;

/**
 * How a MetaEvent is stored internally
 */
export type MetaEventData = MetaEventDef & { timing: Timing };

/**
 * The type used to pass multiple MetaEvents to Score, Melody, MelodyMember, Metadata and MetaList
 */
export type MetaListArg = MetaList | (MetaEvent | MetaEventArg)[];

/*
 * MIDI
 */

/**
 * An entity that can be converted to a string of MIDI bytes
 */
export type Midifiable = { toMidiBytes(): number[] };

/**
 * A tuple containing the exact tick at which a MIDI event occurs, and the bytes representing that event.
 */
export type MidiTickAndBytes = [ number, number[] ];

/*
 * PITCHES
 */

/**
 * How pitch values are passed to methods:
 * 
 * null indicates zero pitches
 * 
 * number indicates one pitch
 * 
 * number[] indicates zero or more pitches
 */
export type PitchArgument = null | number | number[];

/**
 * How a scale is passed to methods:
 * 
 * string indictes a scale with that name
 * 
 * number[] indicates the notes within that scale
 */
export type ScaleDefinition = string | number[];

/**
 * A type used to pass options for the gamut() method
 */
export type GamutOpts = {
    highVal?: number | null,
    lowVal?: number | null,
    zero?: number
};

/*
 * SEQUENCE MEMBERS
 */

/**
 * A type representing how data is passed to a sequence member's constructor function
 */
export type SeqMemberArgument = PitchArgument | MelodyMemberArg | SeqMember<unknown>;

/**
 * A type representing input required when constructing a MelodyMember
 */
export type MelodyMemberArg = {
    pitch: ChordSeqMember | PitchArgument,
    duration?: number,
    velocity?: number,
    delay?: number,
    offset?: number,
    at?: number,
    before?: MetaListArg,
    after?: MetaListArg,
    timing?: Timing,
};

/**
 * A type representing how data is represented within a MelodyMember
 */
export type MelodyMemberData = {
    pitch: ChordSeqMember,
    velocity: number,
    before: MetaList,
    after: MetaList,
    timing: Timing,
};

/**
 * A type representing a summary of a Melody, primarily used for visualizations
 */
export type MelodySummary = {
    tick: number,
    pitch: number[],
    duration: number,
    velocity: number,
}[];

/*
 * SEQUENCES
 */

/**
 * A type representing any type of Sequence
 */
// TODO: This probably should be cleaner
export type AnySeq = NumSeq | NoteSeq | ChordSeq | Melody;

/**
 * A type representing the data required to construct a Sequence through a factory
 */
export type SeqArgument = AnySeq | SeqMemberArgument[];

/**
 * A type representing methods to pass an index or indices to a Sequence method
 */
export type SeqIndices = NumSeq | number | number[];

/*
 * REPLACEMENTS
 */

/**
 * A type representing how we represent replacements for existing value(s) within Collections and Sequences
 */
export type ReplacerVal<T> = TypeOrArray<T> | (T extends SeqMember<unknown> ? (TypeOrArray<SeqMemberArgument> | AnySeq) : Collection<T>);

/**
 * A type representing how we convert existing value(s) within Collections and Sequences into their replacements
 */
export type ReplacerFn<TFrom, TTo> = (curr: TFrom, i: number) => ReplacerVal<TTo>;

/**
 * A type representing a replacement for existing value(s) within Collections and Sequences, or a function returning a replacement
 */
export type Replacer<TFrom, TTo> = ReplacerVal<TTo> | ReplacerFn<TFrom, TTo>;

/*
 * FUNCTIONS
 */

/**
 * A type representing a function used to validate pitches
 */
export type ValidatorFn = (val: number) => boolean;

/**
 * A type representing a function for matching against single values within a Collection
 */
export type FinderFn<T> = (val: T, index: number) => boolean;

/**
 * A type representing a function for matching against an array values within a Collection
 */
export type ArrayFinderFn<T> = (vals: T[], index: number) => boolean;

/**
 * A type representing a function that transforms Collection members in a one-to-one correspondance
 */
export type MapperFn<T> = (e: T, i: number) => T;

/**
 * A type representing a function that transforms Collection members in a one-to-many correspondance
 */
export type FlatMapperFn<T> = (e: T, i: number) => TypeOrArray<T>;

/**
 * A type representing a function that filters Collection members
 */
export type FilterFn<T> = (e: T, i: number) => boolean;

/**
 * A type representing a function used to group Collection members
 */
export type GrouperFn<T> = (e: T, i: number) => string | number;

/**
 * A type representing a pitch mutator function
 */
export type PitchMutatorFn = (v: number) => null | number;

/**
 * A type representing a pitch mapper function
 */
export type PitchMapperFn = (p: number[], i: number) => PitchArgument;

// Functions that can be used in control flow implementations
export type CtrlTypeFn<T> = (me: T) => T;
export type CtrlBoolFn<T> = (me: T) => boolean;

/*
 * CANVAS TYPES
 */

/**
 * A type representing arguments for standard canvases
 */
export type CanvasArg = {
    name: string,              // Name of the canvas
    timeline: number[],        // A timeline of events, in midi-ticks
    data: number[][],          // Array of same length as timeline, containing data points
    options?: CanvasArgOpts, // Options for canvas rendering
};

/**
 * A type representing available options for standard canvases
 */
export type CanvasArgOpts = {
    px_horiz?: number,   // Number of pixels per MIDI quarter note horizontally
    px_vert?: number,    // Number of pixels per unit value vertically
    height?: number,     // Exact height of canvas; overrides px_vert
    width?: number,      // Exact width of canvas; overrides px_horiz
    leftpad?: number,    // Pad canvas this many pixels on the left
    rightpad?: number,   // Pad canvas this many pixels on the right
    header?: string,     // A text header to display at the top left of the canvas
    textstyle?: string,  // RGB colour for displaying text
    color_rule?: string, // Rule for determining what colour to display items as
    value_rule?: string, // Rule for determining how values are displayed on the Y axis
    maxval?: number,     // Maximum value to show on Y axis
    minval?: number,     // Minimum value to show on Y axis
    barlines?: number,   // If supplied, show vertical lines every X beats
    value_bars?: number, // Show a vertical line every X bars, if passed
    beats?: number,      // Number of beats per bar
    beatstyle?: string,  // RGB colour for displaying beats
};

/**
 * A type representing available options for Score canvases
 */
export type ScoreCanvasOpts = {
    ht?: number,
    wd?: number,
    wd_quarter?: number,
    wd_scale?: number,
    wd_min?: number
};

/**
 * An interface for Sequence members
 */
export interface ISeqMember<T> {
    // Extract contents or information relating to contents
    val(): T;
    pitches(): number[];
    len(): number;
    numericValue(): number;
    nullableNumericValue(): null | number;
    isSilent(): boolean;
    max(): null | number;
    min(): null | number;
    mean(): null | number;
    toJSON(): JSONValue;

    // Transform one sequence member into a different sequence member
    setPitches(p: PitchArgument): this;
    silence(): this;
    invert(i: number): this;
    transpose(i: number): this;
    augment(i: number): this;
    diminish(i: number): this;
    mod(i: number): this;
    trim(min?: null | number, max?: null | number): this;
    bounce(min?: null | number, max?: null | number): this;
    scale(scale: string | number[], zero: number, octave: number): this;
    gamut(gamut: number[], opts: GamutOpts): this;

    validate(fn: (e: number) => boolean): boolean;
}

/**
 * An interface for Sequences
 */
export interface ISequence<T> extends CollectionWithMetadata<T> {
    // Extract contents or information relating to contents
    toPitches(): number[][];
    toFlatPitches(): number[];
    toNumericValues(): number[];
    toNullableNumericValues(): (number | null)[];
    min(): number | null;
    max(): number | null;
    range(): number;
    total(): number;
    mean(): number | null;
    mins(): (number | null)[];
    maxes(): (number | null)[];
    means(): (number | null)[];

    // Identify properties of sequence
    isSameClassAndLengthAs(...seq: unknown[]): boolean;
    equals(...seq: this[]): boolean;
    isSubsetOf(seq: this): boolean;
    isSupersetOf(seq: this): boolean;
    isTransformationOf(fn: (p1: number, p2: number) => number, seq: this): boolean;
    isTranspositionOf(seq: this): boolean;
    isInversionOf(seq: this): boolean;
    isRetrogradeOf(seq: this): boolean;
    isRetrogradeInversionOf(seq: this): boolean;
    hasPeriodicityOf(max: number): boolean;
    hasPeriodicity(): number;

    // Find matching members of the sequence
    findIfWindow(size: number, step: number, fn: ArrayFinderFn<T>): number[];
    findIfReverseWindow(size: number, step: number, fn: ArrayFinderFn<T>): number[];

    // Transform one sequence into another sequence
    replaceIfWindow(size: number, step: number, fn: ArrayFinderFn<T>, replacer: Replacer<T[], T>): this;
    replaceIfReverseWindow(size: number, step: number, fn: ArrayFinderFn<T>, replacer: Replacer<T[], T>): this;
    setSlice(start: number | undefined, end: number | undefined, val: T): this;
    loop(n: number): this;
    repeat(n: number): this;
    dupe(n: number): this;
    dedupe(): this;
    shuffle(order: number[]): this;
    pad(v: SeqMemberArgument, ct: number): this;
    padTo(v: SeqMemberArgument, ct: number): this;
    padRight(v: SeqMemberArgument, ct: number): this;
    padRightTo(v: SeqMemberArgument, ct: number): this;
    withPitch(pitch: PitchArgument): this;
    withPitches(pitch: PitchArgument[] | AnySeq): this;
    mapPitches(fn: (p: number[], i: number) => PitchArgument): this;
    mapPitch(fn: MapperFn<number | null>): this;
    mapEachPitch(fn: (p: number, i: number) => number | null): this;
    filterPitches(fn: FilterFn<number>): this;
    keepTopPitches(n: number): this;
    keepBottomPitches(n: number): this;
    transpose(i: number): this;
    transposeToMin(i: number): this;
    transposeToMax(i: number): this;
    invert(i: number): this;
    augment(i: number): this;
    diminish(i: number): this;
    mod(i: number): this;
    trim(min: number | null, max: number | null): this;
    bounce(min: number | null, max: number | null): this;
    scale(scale: string | number[], zero: number, octave: number): this;
    gamut(gamut: number[], opts: GamutOpts): this;
    filterInPosition(fn: FilterFn<T>, nullval: SeqMemberArgument): this;
    mapWindow(size: number, step: number, fn: MapperFn<T[]>): this;
    filterWindow(size: number, step: number, fn: FilterFn<T[]>): this;
    sort(fn: (a: T, b: T) => number, filter?: FilterFn<T>): this;

    // Transform one sequence into one or more sequences
    chop(n: number): this[];
    partitionInPosition(fn: FilterFn<T>, nullval: SeqMemberArgument): [ this, this ];
    groupByInPosition(fn: (e: T, i?: number) => string, nullval: SeqMemberArgument): Record<string, this>
    untwine(n: number): this[];

    // Transform one or more sequences into one sequence
    twine(...seq: this[]): this;
    combine(fn: (...e: T[]) => T, ...seq: this[]): this;
    flatCombine(fn: (...e: T[]) => T, ...seq: this[]): this;
    combineMin(...seq: this[]): this;
    combineMax(...seq: this[]): this;
    combineOr(...seq: this[]): this;
    combineAnd(...seq: this[]): this;

    // Transform one or more sequences into one or more sequences
    zipWith(...seq: this[]): this[];
    mapWith(fn: (vals: T[], i?: number) => T[] | T, ...seq: this[]): this[];
    filterWith(fn: (vals: T[], i?: number) => boolean, ...seq: this[]): this[];
    exchangeValuesIf(fn: (s1: T, s2: T, i?: number) => boolean, seq: this): [ this, this ];

    // Transform this sequence into a different type of sequence
    toNumSeq(): NumSeq;
    toNoteSeq(): NoteSeq;
    toChordSeq(): ChordSeq;
    toMelody(): Melody;
}

/**
 * An interface for Sequences that contain only single values
 */
export interface ISingleValuedSequence<T> extends ISequence<T> {
    density(zeroval: number, oneval: number, seed?: number): this;
    deltas(): this;
    runningTotal(): this;
    combineSum(...seq: this[]): this;
    combineProduct(...seq: this[]): this;
    combineDiff(...seq: this[]): this;
    exchangeValuesIncreasing(seq: this): [ this, this ];
    exchangeValuesDecreasing(seq: this): [ this, this ];
}
