import {
    SeqIndices, Replacer, ReplacerVal, ReplacerFn,
    MapperFn, FlatMapperFn, FinderFn, FilterFn, GrouperFn, CtrlBoolFn, CtrlTypeFn,
    MetaEventKind, MetaEventValueMap, MetaListArg, EventTiming, MetaEventArg
} from '../types';

import Metadata from '../metadata/metadata';

import { isInt, isPosInt, isNonnegInt } from '../helpers/validation';
import { toInstrument, toPercussionInstrument } from '../helpers/instrument';
import { dumpOneLine, dumpMultiLine } from '../dump/dump';

type ControlFlow<T> = {
    do?: (fn: CtrlTypeFn<T>) => T,
    while?: (cond: CtrlBoolFn<T>) => T,
    then?: (fn: CtrlTypeFn<T>) => T,
    else?: (fn: CtrlTypeFn<T>) => T,
}

function seqIndicesToIndices(ix: SeqIndices): number[] {
    if (typeof ix === 'number') {
        return [ ix ];
    }

    if (Array.isArray(ix)) {
        return ix;
    }

    return ix.toNumericValues();
}

function index(i: number, len: number, max = len): number | undefined {
    if (isInt(i)) {
        const ix = i < 0 ? len + i : i;
    
        if (ix >= 0 && ix < max) {
            return ix;
        }
    }
}

/**
 * Class representing a Collection, which contains an ordered list of entities, plus Metadata,
 * and implements a variety of methods that may be used to manipulate those entities.
 */
export default class Collection<T> {
    readonly contents: T[];
    readonly length: number;
    readonly #control!: ControlFlow<this>;
    readonly metadata: Metadata;

    constructor(contents: T[], metadata = Metadata.EMPTY_METADATA) {
        this.contents = contents;
        this.length = contents.length;
        this.#control = {};
        this.metadata = metadata;

        Object.freeze(this.contents);
        Object.freeze(this.length);
        Object.freeze(this.metadata);
    }

    /**
     * Construct a new Collection from zero or more arrays of Collection contents.
     * Metadata is unchanged.
     */
    protected construct(...contents: T[][]): this {
        const Ctor = this.constructor as new (contents: T[], metadata: Metadata) => this;

        return new Ctor(contents.flat(1), this.metadata);
    }

    /**
     * Construct a new Collection with different metadata, but the same contents.
     */
    protected withMetadata(metadata: Metadata): this {
        const Ctor = this.constructor as new (contents: T[], metadata: Metadata) => this;

        return new Ctor(this.contents, metadata);
    }

    /**
     * Return a copy of this Collection with copyright metadata set to the passed value.
     */
    withCopyright(s: string): this {
        return this.withMetadata(this.metadata.withValues({ copyright: s }));
    }

    /**
     * Set a track name. Return a new entity.
     * Return a copy of this Collection with track name metadata set to the passed value.
     */
    withTrackName(s: string): this {
        return this.withMetadata(this.metadata.withValues({ trackname: s }));
    }

    /**
     * Set ticks per quarter. Return a new entity.
     * Return a copy of this Collection with MIDI ticks per quarter metadata set to the passed value.
     */
    withTicksPerQuarter(ticks: number): this {
        return this.withMetadata(this.metadata.withValues({ ticks_per_quarter: ticks }));
    }

    /**
     * Return a copy of this Collection with MIDI channel metadata set to the passed value.
     */
    withMidiChannel(n: number): this {
        return this.withMetadata(this.metadata.withValues({ midichannel: n }));
    }

    /**
     * Return a copy of this Collection with time signature metadata set to the passed value.
     */
    withTimeSignature(s: string): this {
        return this.withMetadata(this.metadata.withValues({ time_signature: s }));
    }

    /**
     * Return a copy of this Collection with time signature metadata set to the passed value.
     */
    withKeySignature(s: string): this {
        return this.withMetadata(this.metadata.withValues({ key_signature: s }));
    }

    /**
     * Return a copy of this Collection with the tempo metadata set to the passed value.
     */
    withTempo(t: number): this {
        return this.withMetadata(this.metadata.withValues({ tempo: t }));
    }

    /**
     * Return a copy of this Collection with the instrument metadata set to the passed value.
     */
    withInstrument(inst: string | number): this {
        if (typeof inst === 'string') {
            return this.withMetadata(this.metadata.withValues({ instrument: inst }));
        }

        const istr = this.metadata.midichannel === 10 ? toPercussionInstrument(inst) : toInstrument(inst);

        if (!istr) {
            throw new Error(`${this.constructor.name}.withInstrument(): invalid instrument: ${dumpOneLine(inst)}`);
        }

        return this.withMetadata(this.metadata.withValues({ instrument: istr }));
    }

    /**
     * Return a copy of this Collection with a new meta-event pushed onto its start.
     */
    withNewEvent<Event extends MetaEventKind>(event: Event | MetaEventArg, value?: MetaEventValueMap[Event], opts?: EventTiming): this {
        let newevent: MetaEventArg;
        if (typeof event === 'string') {
            if (value === undefined) {
                throw new Error(`${this.constructor.name}.withNewEvent(): event "${event}" missing a value`);
            }

            newevent = { event, value, ...opts };
        } else {
            newevent = event;
        }

        return this.withMetadata(this.metadata.withValues({ before: this.metadata.before.withNewEvent(newevent) }));
    }

    /**
     * Return a copy of this Collection with new meta-events added.
     */
    withNewEvents(events: MetaListArg): this {
        return this.withMetadata(this.metadata.withValues({ before: this.metadata.before.withNewEvents(events) }));
    }

    /**
     * Return a copy of this Collection with metadata ticks converted to exact ticks.
    */
    withMetadataTicksExact(): this {
        const m = this.metadata.withAllTicksExact();

        if (m === this.metadata) {
            return this;

        }
        return this.withMetadata(m);
    }

    /**
     * Merge in metadata from another entity, but only when this metadata value wasn't present.
     */
    mergeMetadataFrom(source: { metadata: Metadata }): this {
        return this.withMetadata(this.metadata.mergeFrom(source.metadata));
    }

    /**
     * Calculate a replacement value, return it as an array of Collection contents.
     */
    protected replacerValue(r: ReplacerVal<T>): T[] {
        if (typeof r === 'object') {
            if (Array.isArray(r)) {
                return r as T[];
            }

            if (r !== null && 'contents' in r) {
                return r.contents as T[];
            }
        }

        return [ r as T ];
    }

    protected replacerFn<FromT>(r: ReplacerFn<FromT, T>, curr: FromT, i: number): T[] {
        return this.replacerValue(r(curr, i));
    }

    protected replacer<FromT>(r: Replacer<FromT, T>, curr: FromT, i: number): T[] {
        if (typeof r === 'function') {
            return this.replacerFn(r as ReplacerFn<FromT, T>, curr, i);
        }

        return this.replacerValue(r);
    }

    /*
     * UTILITY METHODS
     */

    /**
     * Return a string representation of this Collection.
     */
    toString(): string {
        return this.describe();
    }

    /**
     * Return an array containing the members of this Collection.
     */
    val(): T[] {
        return this.contents.slice();
    }

    /**
     * Return the member at the specified index. Negative indices are supported.
     */
    valAt(i: number): T {
        return this.contents[this.index(i)];
    }

    /**
     * Returns true if all passed values are of the same class as this one, else false.
     */
    isSameClassAs(...val: unknown[]): boolean {
        return !val.some(v => !(v instanceof Collection) || v.constructor !== this.constructor);
    }

    /**
     * FIND MATCHING INDICES WITHIN THIS COLLECTION
     */

    /**
     * Takes an index, converts negative to non-negative and throws an error if the index
     * does not fall within the Collection. Returns a non-negative index.
     */
    index(i: number): number {
        const ix = index(i, this.length);

        if (ix === undefined) {
            throw new Error(`${this.constructor.name}.index(): invalid index: ${dumpOneLine(i)}`);
        }

        return ix;
    }

    /**
     * Takes an index, an array of indices or a Sequence containing indices, converts
     * negative indices to non-negative ones, and throws an error if any index does not
     * fall within the Collection. Returns an array of indices.
     * 
     * If second argument is supplied and true, also allow a value equal to the length
     * of the Collection.
     */
    indices(i: SeqIndices, inclusive = false): number[] {
        const max = inclusive ? this.length + 1 : this.length;
        const ix = seqIndicesToIndices(i);
        const ret = ix.map(v => index(v, this.length, max));

        if (!ret.includes(undefined)) {
            return ret as number[];
        }

        const failed = [];
        for (let i = 0; i < ret.length; i++) {
            failed.push(`${i} (${dumpOneLine(ix[i])})`);
        }

        throw new Error(`${this.constructor.name}.indices(): ${failed.length} indices (${failed.join('; ')}) failed validation`);
    }

    /**
     * Find the index of the first member of this Collection which passes the
     * supplied function with arguments (value, index).
     * If none is found, return null.
     * 
     * @example
     * // returns 3
     * numseq([ 1, 2, 3, 4, 5 ]).findFirstIndex(v => v.val() > 3)
     */
    findFirstIndex(finder: FinderFn<T>): number | null {
        if (typeof finder !== 'function') {
            throw new Error(`${this.constructor.name}.findFirstIndex() requires a finder function`);
        }

        const ret = this.contents.findIndex(finder);

        return ret === -1 ? null : ret;
    }

    /**
     * Find the index of the last member of this Collection which passes the
     * supplied function with arguments (value, index).
     * If none is found, return null.
     * 
     * @example
     * // returns 4
     * numseq([ 1, 2, 3, 4, 5 ]).findLastIndex(v => v.val() > 3)
     */
    findLastIndex(finder: FinderFn<T>): number | null {
        if (typeof finder !== 'function') {
            throw new Error(`${this.constructor.name}.findLastIndex() requires a finder function`);
        }

        // This implementation because Array.findLastIndex() not yet supported in Typescript
        let i = this.length;

        while (i--) {
            if (finder(this.contents[i], i)) {
                return i;
            }
        }

        return null;
    }

    /**
     * Find the indices of all members of this Collection which pass the supplied
     * function with arguments (value, index).
     * If none are found, return an empty array.
     * 
     * @example
     * // returns [ 3, 4 ]
     * numseq([ 1, 2, 3, 4, 5 ]).findIndices(v => v.val() > 3)
     */
    findIndices(finder: FinderFn<T>): number[] {
        if (typeof finder !== 'function') {
            throw new Error(`${this.constructor.name}.findIndices() requires a finder function`);
        }

        const ret = [];

        for (let i = 0; i < this.length; i++) {
            if (finder(this.contents[i], i)) {
                ret.push(i);
            }
        }

        return ret;
    }

    /**
     * FILTER METHODS
     *
     * Methods in this section allow the creation of new Collections containing zero or more
     * members of this Collection.
     */

    /**
     * Return a new Collection with identical members.
     */
    clone(): this {
        return this.construct(this.contents);
    }

    /**
     * Return a new Collection that has no members.
     */
    empty(): this {
        return this.construct();
    }

    /**
     * Return a new Collection containing only those members which pass a filter function.
     *
     * @example
     * // returns numseq([ 1, 3, 5 ])
     * numseq([ 1, 2, 3, 4, 5 ]).filter(v => v % 2 === 0)
     */
    filter(fn: FilterFn<T>): this {
        if (typeof fn !== 'function') {
            throw new Error(`${this.constructor.name}.filter() requires a filter function`);
        }

        return this.construct(this.contents.filter(fn));
    }

    /**
     * Return a new Collection containing those members between the supplied indices.
     * Second index is optional, negative indices are indexed from the right hand side.
     *
     * @example
     * // returns numseq([ 3, 4 ])
     * numseq([ 1, 2, 3, 4, 5 ]).keepSlice(2, 4)
     * 
     * // returns numseq([ 3, 4, 5 ])
     * numseq([ 1, 2, 3, 4, 5 ]).keepSlice(2)
     */
    keepSlice(start: number, end?: number): this {
        return this.construct(this.contents.slice(start, end));
    }

    /**
     * Return a new Collection containing the first n members of this Collection.
     * Negative indices are indexed from the right hand side.
     * 
     * @example
     * // returns numseq([ 1, 2 ])
     * numseq([ 1, 2, 3, 4, 5 ]).keep(2)
     */
    keep(n = 1): this {
        return this.construct(this.contents.slice(0, n));
    }

    /**
     * Return a new Collection containing the last n members of this Collection.
     * Negative indices are indexed from the right hand side.
     * 
     * @example
     * // returns numseq([ 4, 5 ])
     * numseq([ 1, 2, 3, 4, 5 ]).keepRight(2)
     */
    keepRight(n = 1): this {
        const last = this.length - n;

        return this.construct(this.contents.slice(last < 0 ? 0 : last));
    }

    /**
     * Return a new Collection containing only those members at the specified indices.
     * Negative indices are indexed from the right hand side.
     * 
     * @example
     * // returns numseq([ 1, 5 ])
     * numseq([ 1, 2, 3, 4, 5 ]).keepIndices([ 0, -1 ])
     */
    keepIndices(i: SeqIndices): this {
        const ix = this.indices(i);

        return this.construct(ix.map(v => this.contents[v]));
    }

    /**
     * Return a new Collection containing every nth member of this Collection.
     * If a second argument is passed, start from that index.
     * 
     * @example
     * // returns numseq([ 1, 4 ])
     * numseq([ 1, 2, 3, 4, 5 ]).keepNth(3)
     */
    keepNth(n: number, offset = 0): this {
        if (!isPosInt(n)) {
            throw new Error(`${this.constructor.name}.keepNth(): argument must be a positive integer`);
        }

        if (!isNonnegInt(offset)) {
            throw new Error(`${this.constructor.name}.keepNth(): offset must be a non-negative integer`);
        }

        return this.filter((_, i) => i >= offset && ((i - offset) % n) === 0);
    }

    /**
     * Return a new Collection containing those members not between the supplied indices.
     * Second index is optional, negative indices are indexed from the right hand side.
     *
     * @example
     * // returns numseq([ 1, 2, 5 ])
     * numseq([ 1, 2, 3, 4, 5 ]).dropSlice(2, 4)
     * 
     * // returns numseq([ 1, 2 ])
     * numseq([ 1, 2, 3, 4, 5 ]).dropSlice(2)
     */
    dropSlice(start: number, end = this.length + 1): this {
        return this.construct(this.contents.slice(0, start), this.contents.slice(end));
    }

    /**
     * Return a new Collection containing all members of this Collection except the first n.
     * Negative indices are indexed from the right hand side.
     * 
     * @example
     * // returns numseq([ 3, 4, 5 ])
     * numseq([ 1, 2, 3, 4, 5 ]).drop(2)
     */
    drop(n = 1): this {
        return this.construct(this.contents.slice(n));
    }

    /**
     * Return a new Collection containing those members including and after the supplied index.
     * Negative indices are indexed from the right hand side.
     * 
     * @example
     * // returns numseq([ 1, 2, 3 ])
     * numseq([ 1, 2, 3, 4, 5 ]).dropRight(2) 
     */
    dropRight(n = 1): this {
        const last = this.length - n;

        return this.construct(this.contents.slice(0, last < 0 ? 0 : last));
    }

    /**
     * Return a new Collection containing only those members at the specified indices.
     * Negative indices are indexed from the right hand side.
     * 
     * @example
     * // returns numseq([ 2, 3, 4 ])
     * numseq([ 1, 2, 3, 4, 5 ]).dropIndices([ 0, -1 ]) 
     */
    dropIndices(i: SeqIndices): this {
        const ix = this.indices(i);

        return this.construct(this.contents.filter((_, i) => !ix.includes(i)));
    }

    /**
     * Return a new Collection excluding every nth member of this Collection.
     * If a second argument is passed, begin excluding only from that index.
     * 
     * @example
     * // returns numseq([ 2, 3, 5 ])
     * numseq([ 1, 2, 3, 4, 5 ]).dropNth(3) 
     */
    dropNth(n: number, offset = 0): this {
        if (!isPosInt(n)) {
            throw new Error(`${this.constructor.name}.dropNth(): argument must be a positive integer`);
        }

        if (!isNonnegInt(offset)) {
            throw new Error(`${this.constructor.name}.dropNth(): offset must be a non-negative integer`);
        }

        return this.filter((_, i) => i < offset || ((i - offset) % n) !== 0);
    }

    /**
     * PATCHING VALUES INTO COLLECTIONS
     */

    protected replaceRelative(pos: SeqIndices, rep: ReplacerVal<T>, len: number, offset: number): this {
        const locs = this.indices(pos);

        if (!locs.length) {
            return this;
        }

        locs.sort((a, b) => b - a); // last to first order

        const contents = this.val(); // make a shallow copy for splicing

        for (const ix of locs) {
            contents.splice(ix + offset, len, ...this.replacerValue(rep));
        }

        return this.construct(contents);
    }

    /**
     * Insert new values before the specified index or indices in the Collection,
     * Indices can be a number, an array of numbers or a Sequence containing numbers.
     * New values can be a Collection, a Collection member, an array of Collection members,
     * or a function taking a Collection member and its position within the collection and
     * returning a Collection, a Collection member, an array of Collection members,
     * 
     * @example
     * // returns numseq([ 1, 6, 7, 2, 3, 6, 7, 4, 5 ])
     * numseq([ 1, 2, 3, 4, 5 ]).insertBefore([ 1, 3 ], numseq([ 6, 7 ])
     * 
     * // returns numseq([ 1, 2, 3, 4, 9, 5 ])
     * numseq([ 1, 2, 3, 4, 5 ]).insertBefore([ -1 ], 9)
     */
    insertBefore(pos: SeqIndices, rep: ReplacerVal<T>): this {
        return this.replaceRelative(pos, rep, 0, 0);
    }

    /**
     * Insert new values after the specified index or indices in the Collection,
     * Indices can be a number, an array of numbers or a Sequence containing numbers.
     * New values can be a Collection, a Collection member, an array of Collection members,
     * or a function taking a Collection member and its position within the collection and
     * returning a Collection, a Collection member, an array of Collection members,
     * 
     * @example
     * // returns numseq([ 1, 2, 6, 7, 3, 4, 6, 7, 5 ])
     * numseq([ 1, 2, 3, 4, 5 ]).insertAfter([ 1, 3 ], numseq([ 6, 7 ])
     * 
     * // returns numseq([ 1, 2, 3, 4, 5, 9 ])
     * numseq([ 1, 2, 3, 4, 5 ]).insertAfter([ -1 ], 9)
     */
    insertAfter(pos: SeqIndices, rep: ReplacerVal<T>): this {
        return this.replaceRelative(pos, rep, 0, 1);
    }

    /**
     * Replace the value at the specified index or indices in the Collection.
     * Indices can be a number, an array of numbers or a Sequence containing numbers.
     * New values can be a Collection, a Collection member or an array of Collection members.
     * 
     * @example
     * // returns numseq([ 1, 6, 7, 3, 6, 7, 5 ])
     * numseq([ 1, 2, 3, 4, 5 ]).replaceIndices([ 1, 3 ], numseq([ 6, 7 ])
     * 
     * // returns numseq([ 1, 2, 3, 4, 9 ])
     * numseq([ 1, 2, 3, 4, 5 ]).replaceIndices([ -1 ], 9)
     */
    replaceIndices(pos: SeqIndices, rep: ReplacerVal<T>): this {
        if (typeof rep === 'function') {
            const cname = this.constructor.name;

            throw new Error(`${cname}.replaceIndices(): replacer functions are no longer supported; use ${cname}.mapIndices() or ${cname}.flatMapIndices() instead`);
        }

        return this.replaceRelative(pos, rep, 1, 0);
    }

    /**
     * Return a new Collection, where the values at the specified index or indices have
     * been mapped through the supplied function. Other values are left unchanged.
     * 
     * @example
     * // returns numseq([ 1, 6, 3, 4, 9 ])
     * numseq([ 1, 2, 3, 4, 5 ]).mapIndices([ 1, -1 ], v => v.transpose(4))
     */
    mapIndices(pos: SeqIndices, fn: MapperFn<T>): this {
        if (typeof fn !== 'function') {
            throw new Error(`${this.constructor.name}.mapIndices() requires a mapper function`);
        }

        const locs = this.indices(pos);

        if (!locs.length) {
            return this;
        }

        locs.sort((a, b) => b - a); // last to first order

        const contents = this.val(); // make a shallow copy for splicing

        for (const ix of locs) {
            contents.splice(ix, 1, fn(this.contents[ix], ix));
        }

        return this.construct(contents);
    }

    /**
     * Return a new Collection, where the values at the specified index or indices have
     * been flat mapped through the supplied function. Other values are left unchanged.
     * 
     * @example
     * // returns numseq([ 1, 6, 3, 4, 9 ])
     * numseq([ 1, 2, 3, 4, 5 ]).mapIndices([ 1, -1 ], v => v.transpose(4))
     */
    flatMapIndices(pos: SeqIndices, fn: FlatMapperFn<T>): this {
        if (typeof fn !== 'function') {
            throw new Error(`${this.constructor.name}.mapIndices() requires a flat mapper function`);
        }

        const locs = this.indices(pos);

        if (!locs.length) {
            return this;
        }

        locs.sort((a, b) => b - a); // last to first order

        const contents = this.val(); // make a shallow copy for splicing

        for (const ix of locs) {
            const rep = fn(contents[ix], ix);

            if (Array.isArray(rep)) {
                contents.splice(ix, 1, ...rep);
            } else {
                contents.splice(ix, 1, rep);
            }
        }

        return this.construct(contents);
    }

    /**
     * Replace the first value in the Collection that matches the finder function.
     * New values can be a Collection, a Collection member or an array of Collection members.
     *
     * @example
     * // returns numseq([ 1, 6, 7, 3, 4, 5 ])
     * numseq([ 1, 2, 3, 4, 5 ]).replaceFirstIndex(v => v.val() % 2 === 0, numseq([ 6, 7 ])
     * 
     * // returns numseq([ 1, 6, 3, 4, 5 ])
     * numseq([ 1, 2, 3, 4, 5 ]).replaceFirstIndex(v => v.val() % 2 === 0, 6)
     */
    replaceFirstIndex(finder: FinderFn<T>, rep: ReplacerVal<T>): this {
        if (typeof finder !== 'function') {
            throw new Error(`${this.constructor.name}.replaceFirstIndex() requires a finder function`);
        }

        if (typeof rep === 'function') {
            const cname = this.constructor.name;

            throw new Error(`${cname}.replaceFirstIndex(): replacer functions are no longer supported; use ${cname}.mapFirstIndex() or ${cname}.flatMapFirstIndex() instead`);
        }

        const ix = this.findFirstIndex(finder);
 
        return ix === null ? this : this.replaceIndices(ix, rep);
    }

    /**
     * Return a new collection where the first value (if any) that matches the finder function
     * has been mapped through the mapper function.
     * 
     * @example
     * // returns numseq([ 1, 6, 3, 4, 5 ])
     * numseq([ 1, 2, 3, 4, 5 ]).mapFirstIndex(v => v.val() % 2 === 0, v => v.transpose(4))
     */
    mapFirstIndex(finder: FinderFn<T>, mapfn: MapperFn<T>): this {
        if (typeof finder !== 'function') {
            throw new Error(`${this.constructor.name}.mapFirstIndex() requires a finder function`);
        }

        if (typeof mapfn !== 'function') {
            throw new Error(`${this.constructor.name}.mapFirstIndex() requires a mapper function`);
        }

        const ix = this.findFirstIndex(finder);
 
        return ix === null ? this : this.mapIndices(ix, mapfn);
    }

    /**
     * Return a new collection where the first value (if any) that matches the finder function
     * has been flat mapped through the mapper function.
     * 
     * @example
     * // returns numseq([ 1, 2, 6, 2, 3, 4, 5 ])
     * numseq([ 1, 2, 3, 4, 5 ]).flatMapFirstIndex(v => v.val() % 2 === 0, v => [ v, v.transpose(4), v ])
     */
    flatMapFirstIndex(finder: FinderFn<T>, mapfn: FlatMapperFn<T>): this {
        if (typeof finder !== 'function') {
            throw new Error(`${this.constructor.name}.flatMapFirstIndex() requires a finder function`);
        }

        if (typeof mapfn !== 'function') {
            throw new Error(`${this.constructor.name}.flatMapFirstIndex() requires a mapper function`);
        }

        const ix = this.findFirstIndex(finder);
 
        return ix === null ? this : this.flatMapIndices(ix, mapfn);
    }

    /**
     * Replace the last value in the Collection that matches the finder function.
     * New values can be a Collection, a Collection member or an array of Collection members.
     * 
     * @example
     * // returns numseq([ 1, 2, 3, 6, 7, 5 ])
     * numseq([ 1, 2, 3, 4, 5 ]).replaceLastIndex(v => v.val() % 2 === 0, numseq([ 6, 7 ])
     * 
     * // returns numseq([ 1, 2, 3, 8, 5 ])
     * numseq([ 1, 2, 3, 4, 5 ]).replaceLastIndex(v => v.val() % 2 === 0, 8)
     */
    replaceLastIndex(finder: FinderFn<T>, rep: ReplacerVal<T>): this {
        if (typeof finder !== 'function') {
            throw new Error(`${this.constructor.name}.replaceLastIndex() requires a finder function`);
        }

        if (typeof rep === 'function') {
            const cname = this.constructor.name;

            throw new Error(`${cname}.replaceLastIndex(): replacer functions are no longer supported; use ${cname}.mapLastIndex() or ${cname}.flatMapLastIndex() instead`);
        }

        const ix = this.findLastIndex(finder);
 
        return ix === null ? this : this.replaceIndices(ix, rep);
    }

    /**
     * Return a new collection where the last value (if any) that matches the finder function
     * has been mapped through the mapper function.
     * 
     * @example
     * // returns numseq([ 1, 2, 3, 8, 5 ])
     * numseq([ 1, 2, 3, 4, 5 ]).mapLastIndex(v => v.val() % 2 === 0, v => v.transpose(4))
     */
    mapLastIndex(finder: FinderFn<T>, mapfn: MapperFn<T>): this {
        if (typeof finder !== 'function') {
            throw new Error(`${this.constructor.name}.mapLastIndex() requires a finder function`);
        }

        if (typeof mapfn !== 'function') {
            throw new Error(`${this.constructor.name}.mapLastIndex() requires a mapper function`);
        }

        const ix = this.findLastIndex(finder);
 
        return ix === null ? this : this.mapIndices(ix, mapfn);
    }

    /**
     * Return a new collection where the last value (if any) that matches the finder function
     * has been flat mapped through the mapper function.
     * 
     * @example
     * // returns numseq([ 1, 2, 3, 4, 8, 4, 5 ])
     * numseq([ 1, 2, 3, 4, 5 ]).flatMapLastIndex(v => v.val() % 2 === 0, v => [ v, v.transpose(4), v ])
     */
    flatMapLastIndex(finder: FinderFn<T>, mapfn: FlatMapperFn<T>): this {
        if (typeof finder !== 'function') {
            throw new Error(`${this.constructor.name}.flatMapLastIndex() requires a finder function`);
        }

        if (typeof mapfn !== 'function') {
            throw new Error(`${this.constructor.name}.flatMapLastIndex() requires a mapper function`);
        }

        const ix = this.findLastIndex(finder);
 
        return ix === null ? this : this.flatMapIndices(ix, mapfn);
    }

    /**
     * Replace all values in the Collection that match the finder function.
     * New values can be a Collection, a Collection member or an array of Collection members.
     * 
     * @example
     * // returns numseq([ 1, 6, 7, 3, 6, 7, 5 ])
     * numseq([ 1, 2, 3, 4, 5 ]).replaceIf(v => v.val() % 2 === 0, numseq([ 6, 7 ])
     * 
     * // returns numseq([ 1, 4, 3, 4, 5 ])
     * numseq([ 1, 2, 3, 4, 5 ]).replaceIf(v => v.val() % 2 === 0, 4)
     */
    replaceIf(finder: FinderFn<T>, rep: ReplacerVal<T>): this {
        if (typeof finder !== 'function') {
            throw new Error(`${this.constructor.name}.replaceIf() requires a function`);
        }

        if (typeof rep === 'function') {
            const cname = this.constructor.name;

            throw new Error(`${cname}.replaceIf(): replacer functions are no longer supported; use ${cname}.mapIf() or ${cname}.flatMapIf() instead`);
        }

        return this.replaceIndices(this.findIndices(finder), rep);
    }

    /**
     * Create a new Collection where values that match the finder function have been mapped
     * through the mapper function.
     * 
     * @example
     * // returns numseq([ 1, 6, 3, 8, 5 ])
     * numseq([ 1, 2, 3, 4, 5 ]).mapIf(v => v.val() % 2 === 0, v => v.transpose(4))
     */
    mapIf(finder: FinderFn<T>, mapfn: MapperFn<T>): this {
        if (typeof finder !== 'function') {
            throw new Error(`${this.constructor.name}.mapIf() requires a finder function`);
        }

        if (typeof mapfn !== 'function') {
            throw new Error(`${this.constructor.name}.mapIf() requires a mapper function`);
        }

        return this.mapIndices(this.findIndices(finder), mapfn);
    }

    /**
     * Create a new Collection where values that match the finder function have been flat 
     * mapped through the mapper function.
     * 
     * @example
     * // returns numseq([ 1, 2, 6, 2, 3, 4, 8, 4, 5 ])
     * numseq([ 1, 2, 3, 4, 5 ]).flatMapIf(v => v.val() % 2 === 0, v => [ v, v.transpose(4), v ])
     */
    flatMapIf(finder: FinderFn<T>, mapfn: FlatMapperFn<T>): this {
        if (typeof finder !== 'function') {
            throw new Error(`${this.constructor.name}.flatMapIf() requires a finder function`);
        }

        if (typeof mapfn !== 'function') {
            throw new Error(`${this.constructor.name}.flatMapIf() requires a mapper function`);
        }

        return this.flatMapIndices(this.findIndices(finder), mapfn);
    }

    /**
     * Replace every nth values in the Collection, optionally starting after an offset.
     * New values can be a Collection, a Collection member, or an array of Collection members.
     * 
     * @example
     * // returns numseq([ 6, 7, 2, 3, 6, 7, 5 ])
     * numseq([ 1, 2, 3, 4, 5 ]).replaceNth(3, numseq([ 6, 7 ])
     * 
     * // returns numseq([ 8, 2, 3, 8, 5 ])
     * numseq([ 1, 2, 3, 4, 5 ]).replaceNth(3, 8)
     */
    replaceNth(n: number, rep: ReplacerVal<T>, offset = 0): this {
        if (!isPosInt(n)) {
            throw new Error(`${this.constructor.name}.replaceNth(): argument must be a positive integer`);
        }

        if (typeof rep === 'function') {
            const cname = this.constructor.name;

            throw new Error(`${cname}.replaceNth(): replacer functions are no longer supported; use ${cname}.mapNth() or ${cname}.flatMapNth() instead`);
        }

        if (!isNonnegInt(offset)) {
            throw new Error(`${this.constructor.name}.replaceNth(): offset must be a non-negative integer`);
        }

        return this.flatMap((v, i) => i >= offset && ((i - offset) % n) === 0 ? this.replacerValue(rep) : v);
    }

    /**
     * Create a new collection where every nth value has been mapped through the supplied
     * mapper function. If an offset is supplied, replacement will start at that index,
     * otherwise it starts at the first member of the collection.
     * 
     * @example
     * // returns numseq([ 5, 2, 3, 8, 5 ])
     * numseq([ 1, 2, 3, 4, 5 ]).mapNth(3, v => v.transpose(4))
     */
    mapNth(n: number, fn: MapperFn<T>, offset = 0): this {
        if (typeof fn !== 'function') {
            throw new Error(`${this.constructor.name}.mapNth() requires a function`);
        }

        if (!isPosInt(n)) {
            throw new Error(`${this.constructor.name}.mapNth(): argument must be a positive integer`);
        }

        if (!isNonnegInt(offset)) {
            throw new Error(`${this.constructor.name}.mapNth(): offset must be a non-negative integer`);
        }

        return this.map((v, i) => i >= offset && ((i - offset) % n) === 0 ? fn(v, i) : v);
    }

    /**
     * Create a new collection where every nth value has been mapped through the supplied
     * mapper function. If an offset is supplied, replacement will start at that index,
     * otherwise it starts at the first member of the collection.
     * 
     * @example
     * // returns numseq([ 1, 5, 1, 2, 3, 4, 8, 4, 5 ])
     * numseq([ 1, 2, 3, 4, 5 ]).mapNth(3, v => [ v, v.transpose(4), v ])
     */
    flatMapNth(n: number, fn: FlatMapperFn<T>, offset = 0): this {
        if (typeof fn !== 'function') {
            throw new Error(`${this.constructor.name}.flatMapNth() requires a function`);
        }

        if (!isPosInt(n)) {
            throw new Error(`${this.constructor.name}.flatMapNth(): argument must be a positive integer`);
        }

        if (!isNonnegInt(offset)) {
            throw new Error(`${this.constructor.name}.flatMapNth(): offset must be a non-negative integer`);
        }

        return this.flatMap((v, i) => i >= offset && ((i - offset) % n) === 0 ? fn(v, i) : v);
    }

    /**
     * Replace a slice of the Collection with a new Collection while retaining the rest of the
     * original Collection.
     * New values can be a Collection, a Collection member or an array of Collection members.
     * 
     * @example
     * // returns numseq([ 1, 6, 7, 5 ])
     * numseq([ 1, 2, 3, 4, 5 ]).replaceSlice(1, -1, numseq([ 6, 7 ])
     * 
     * // returns numseq([ 1, 4, 3, 2, 5 ])
     * numseq([ 1, 2, 3, 4, 5 ]).replaceSlice(1, -1, [ 4, 3, 2 ])
     */
    replaceSlice(start: number, finish: number, rep: ReplacerVal<T>): this {
        const p1 = this.keepSlice(0, start);
        const p3 = this.keepSlice(finish);

        if (typeof rep === 'function') {
            const cname = this.constructor.name;

            throw new Error(`${cname}.replaceSlice(): replacer functions are no longer supported; use ${cname}.modifySlice(), ${cname}.mapSlice() or ${cname}.flatMapSlice() instead`);
        }

        return p1.append(this.construct(this.replacerValue(rep)), p3);
    }

    /**
     * Replace a slice of the Collection with a new Collection while retaining the rest of the
     * original Collection.
     * 
     * The third argument to this method is a function that returns a Collection of the same
     * type as this one, and takes as first argument a Collection containing the slice to be
     * replaced, and as second argument the index in the original Collection that this slice
     * begins at.
     * 
     * @example
     * // returns numseq([ 1, 4, 3, 2, 5 ])
     * numseq([ 1, 2, 3, 4, 5 ]).modifySlice(1, -1, s => s.retrograde())
     */
    modifySlice(start: number, end: number, modifier: MapperFn<this>): this {
        const [ p1, p2, p3 ] = this.splitAt([ start, end ]);

        if (typeof modifier !== 'function') {
            throw new Error(`${this.constructor.name}.modifySlice(): must supply a modifier function`);
        }

        return p1.append(modifier(p2, p1.length), p3);
    }

    /**
     * Map a slice of the Collection through a mapper function while retaining the
     * values from the rest of the original Collection. Returns a new Collection.
     * 
     * @example
     * // returns numseq([ 1, 6, 5, 4, 5 ])
     * numseq([ 1, 2, 3, 4, 5 ]).mapSlice(1, -1, m => m.invert(4))
     */
    mapSlice(start: number, end: number, fn: MapperFn<T>): this {
        if (typeof fn !== 'function') {
            throw new Error(`${this.constructor.name}.mapSlice() requires a function`);
        }
    
        const [ p1, p2, p3 ] = this.splitAt([ start, end ]);
    
        return p1.append(p2.map(fn), p3);
    }

    /**
     * Flat map a slice of the Collection through a mapper function while retaining the
     * values from the rest of the original Collection. Return a new Collection.
     * 
     * @example
     * // returns numseq([ 1, 2, 6, 2, 3, 5, 3, 4, 4, 4, 5 ])
     * numseq([ 1, 2, 3, 4, 5 ]).flatMapSlice(1, -1, m => [ m, m.invert(4), m ])
     */
    flatMapSlice(start: number, end: number, fn: FlatMapperFn<T>): this {
        if (typeof fn !== 'function') {
            throw new Error(`${this.constructor.name}.flatMapSlice() requires a function`);
        }
    
        const [ p1, p2, p3 ] = this.splitAt([ start, end ]);
    
        return p1.append(p2.flatMap(fn), p3);
    }

    /**
     * METHODS FOR CREATING RELATED COLLECTIONS
     */

    /**
     * Return a new Collection containing the new contents passed to this method.
     */
    replace(vals: ReplacerVal<T>): this {
        return this.construct(this.replacerValue(vals));
    }

    /**
     * Return a new Collection containing the contents of this, passed through a mapper function.
     * 
     * @example
     * // returns numseq([ 9, 2, 7, 4, 5 ])
     * numseq([ 1, 2, 3, 4, 5 ]).map((m, i) => i % 2 === 0 ? m.invert(5) : m)
     */
    map(fn: MapperFn<T>): this {
        if (typeof fn !== 'function') {
            throw new Error(`${this.constructor.name}.map() requires a mapper function`);
        }

        return this.construct(this.contents.map(fn));
    }

    /**
     * Return a new Collection containing the contents of this, passed through a mapper function
     * and with the result flattened.
     * 
     * @example
     * // returns numseq([ 1, 9, 2, 8, 3, 7, 4, 6, 5 ])
     * numseq([ 1, 2, 3, 4, 5 ]).flatMap(m => [ m, m.invert(5) ])
     */
    flatMap(fn: FlatMapperFn<T>): this {
        if (typeof fn !== 'function') {
            throw new Error(`${this.constructor.name}.flatMap() requires a mapper function`);
        }

        return this.construct(this.contents.flatMap(fn));
    }

    /**
     * Append zero or more Collections to this one. Return the resulting Collection.
     * 
     * @example
     * // returns numseq([ 1, 2, 3, 4, 5 ])
     * numseq([ 1 ]).append(numseq([ 2, 3, 4 ]), numseq([ 5 ]))
     */
    append(...coll: this[]): this {
        if (!this.isSameClassAs(...coll)) {
            throw new Error(`${this.constructor.name}.append(): can only append other ${this.constructor.name}s`);
        }

        return this.construct(this.contents, ...coll.map(c => c.contents));
    }

    /**
     * Append zero or more items to this Collection. Return the resulting Collection.
     */
    appendItems(...items: T[]): this {
        return this.construct(this.contents, items);
    }

    /**
     * Prepend zero or more Collections to this one. Return the resulting Collection.
     * 
     * @example
     * // returns numseq([ 2, 3, 4, 5, 1 ])
     * numseq([ 1 ]).prepend(numseq([ 2, 3, 4 ]), numseq([ 5 ]))
     */
    prepend(...coll: this[]): this {
        if (!this.isSameClassAs(...coll)) {
            throw new Error(`${this.constructor.name}.prepend(): can only prepend other ${this.constructor.name}s`);
        }

        return this.construct(...coll.map(c => c.contents), this.contents);
    }

    /**
     * Append zero or more items to this Collection. Return the resulting Collection.
     */
    prependItems(...items: T[]): this {
        return this.construct(items, this.contents);
    }

    /**
     * REORDERING A COLLECTION
     */

    /**
     * Return a Sequence that is the retrograde of this one.
     * 
     * @example
     * // returns numseq([ 5, 4, 3, 2, 1 ])
     * numseq([ 1, 2, 3, 4, 5 ]).retrograde();
     */
    retrograde(): this {
        return this.construct(this.val().reverse());
    }

    /**
     * Swap values at the passed location(s) in the Collection. Multiple
     * arguments are accepted and processed in order.
     * 
     * @example
     * // returns numseq([ 2, 1, 3, 5, 4 ])
     * numseq([ 1, 2, 3, 4, 5 ]).swapAt([ 0, 1 ], [ 3, 4 ]);
     */
    swapAt(...swap: [ number, number ][]): this {
        const vals = this.val();

        swap.forEach(([ from, to ]) => {
            const f = this.index(from);
            const t = this.index(to);

            [ vals[f], vals[t] ] = [ vals[t], vals[f] ];
        });

        return this.construct(vals);
    }

    /*
     * ONE COLLECTION -> MULTIPLE COLLECTIONS
     */

    /**
     * Split this Collection into chunks delimited by the indices passed.
     * Return an array of Collection, one for each chunk.
     * 
     * @example
     * // returns [ numseq([]), numseq([ 1, 2, 3 ]), numseq([ 4, 5 ]) ]
     * numseq([ 1, 2, 3, 4, 5 ]).splitAt([ 0, 3 ]);
     */
    splitAt(pos: SeqIndices): this[] {
        const ix = this.indices(pos, true).sort((a, b) => a - b);
        const ret = [];

        let last = 0;

        for (const curr of ix) {
            ret.push(this.contents.slice(last, curr));

            last = curr;
        }

        ret.push(this.contents.slice(last));

        return ret.map(v => this.construct(v));
    }

    /**
     * Creates two new Collections based on the return value of the function passed.
     * The first Collection contains all members for which the function returned true.
     * The second Collection contains all members for which the function returned false.
     * 
     * @example
     * // returns [ numseq([ 1, 3, 5 ]), numseq([ 2, 4 ]) ],
     * numseq([ 1, 2, 3, 4, 5 ]).partition(v => v.val() % 2 === 1)
     */
    partition(fn: FilterFn<T>): [ this, this ] {
        if (typeof fn !== 'function') {
            throw new Error(`${this.constructor.name}.partition() requires a function`);
        }

        const ret: T[][] = [ [], [] ];

        this.contents.forEach((v, i) => ret[fn(v, i) ? 0 : 1].push(v));

        return [ this.construct(ret[0]), this.construct(ret[1]) ];
    }

    /**
     * Creates an object containing new Collections bassed on the return value of the
     * function passed.
     * Each Collection contains all members for which the function returned a specific value.
     * 
     * @example
     * // returns { 1: numseq([ 1, 4 ]), 2: numseq([ 2, 5 ]), 0: numseq([ 3 ]) },
     * numseq([ 1, 2, 3, 4, 5 ]).groupBy(v => v.val() % 3)
     */
    groupBy(fn: GrouperFn<T>): Record<string, this> {
        if (typeof fn !== 'function') {
            throw new Error(`${this.constructor.name}.groupBy() requires a function`);
        }

        const vals: Record<string, T[]> = {};

        this.contents.forEach((v, i) => {
            const val: string | number = fn(v, i);

            if (!vals[val]) {
                vals[val] = [];
            }

            vals[val].push(v);
        });

        const ret: Record<string, this> = {};

        Object.keys(vals).forEach(k => ret[k] = this.construct(vals[k]));

        return ret;
    }

    /*
     * CONDITIONAL PROCESSING
     */

    /**
     * Begin a conditional processing block.
     *
     * Until the next pipeline call that is not either .else() or .then(),
     *
     * If the passed condition was truthy:
     *
     * calls to .then() will return the return value of the callback passed.
     *
     * calls to .else() will return a copy of this.
     *
     * If this condition was falsy:
     *
     * calls to .then() will return a copy of this.
     *
     * calls to .else() will return the return value of the callback passed.
     *
     * After the first non-.then()/.else() call, calls to .then() and .else()
     * will throw exceptions until the next .if() call.
     *
     * The condition may be passed as a value to be evaluated for truthiness,
     * or a function (in which case it will be executed and the return value
     * of the function will be used as the condition.
     *
     * @example
     * // Returns Collection([ 3 ]) if function evaluates to truthy value
     * // Returns Collection([ 1, 2 ]) if function evaluates to falsy value
     * Collection([ 1, 2, 3 ])
     *     .if(somefunction)
     *         .then(s => s.drop())
     *         .then(s => s.drop())
     *         .else(s => s.dropRight())
     */
    if(cond: boolean | CtrlBoolFn<this>): this {
        const me = this.clone();
        const yes = typeof cond === 'function' ? cond(me) : cond;

        if (yes) {
            me.#control.then = fn => fn(me).if(yes);
            me.#control.else = () => me.if(yes);
        } else {
            me.#control.then = () => me.if(yes);
            me.#control.else = fn => fn(me).if(yes);
        }

        return me;
    }

    /**
     * If part of a true if condition, return the return value of the passed
     * function when called with this Collection as an argument.
     *
     * If part of a false if condition, return this Collection.
     *
     * If not part of an if condition, throw an exception.
     */
    then(fn: CtrlTypeFn<this>): this {
        if (typeof fn !== 'function') {
            throw new Error(`${this.constructor.name}.then() requires a function`);
        }

        if (!this.#control.then) {
            throw new Error(`${this.constructor.name}.then() without an if condition`);
        }

        return this.#control.then(fn);
    }

    /**
     * If part of a false if condition, return the return value of the passed
     * function when called with this Collection as an argument.
     *
     * If part of a true if condition, return this Collection.
     *
     * If not part of an if condition, throw an exception.
     */
    else(fn: CtrlTypeFn<this>): this {
        if (typeof fn !== 'function') {
            throw new Error(`${this.constructor.name}.else() requires a function`);
        }

        if (!this.#control.else) {
            throw new Error(`${this.constructor.name}.else() without an if condition`);
        }

        return this.#control.else(fn);
    }

    /**
     * Begin a conditional processing block.
     *
     * Call the function passed to this .while() call, with this Collection
     * as the argument to it.
     *
     * If this function is immediately followed by a .do() call:
     *
     * If the function passed to the .while() call returns a falsy value,
     * return a copy of this Collection.
     *
     * If the function passed to the .while() call returns a truthy value,
     * call the function passed to the .do() call, with a copy of this
     * Collection as the argument to it. Then repeat the whole process from
     * the original .while() call, using the return value from the .do()
     * call as the argument to the new .while() call, until the .while()
     * call returns a falsy value, at which point return the result of the
     * last .do() call.
     *
     * Do not use .while() inside a .do() block as this is not supported.
     *
     * @example
     * // Returns Collection([ 1, 2, 3 ])
     * Collection([ 1, 2, 3, 4, 5, 6 ])
     *     .while(s => s.length > 3)
     *     .do(s => s.drop());
     */
    while(cond: CtrlBoolFn<this>): this {
        if (typeof cond !== 'function') {
            throw new Error(`${this.constructor.name}.while() requires a function`);
        }

        if (this.#control.while) {
            return this.#control.while(cond);
        }

        const me = this.clone();

        if (cond(me)) {
            me.#control.do = fn => fn(me).while(cond).do(fn);
        } else {
            me.#control.do = () => me.clone();
        }

        return me;
    }

    /**
     * Begin a conditional processing block.
     *
     * Call the function passed to this .do() call, passing this Collection
     * as the argument to it, and returning the value returned by that
     * function.
     *
     * If immediately followed by a .while() call, call the function passed
     * to that .while() call, with the result of the .do() call as the
     * argument to it.
     *
     * If the .while() call returns a truthy value, repeat the whole process
     * from the original .do() call, using the return value from the original
     * .do() call as the argument to the new .do() call.
     *
     * If the .while() call returns a falsy value, return the return value
     * from the original .do() call.
     *
     * Do not use .while() inside a .do() block as this is not supported.
     *
     * @example
     * // Returns Collection([ 1, 2, 3 ])
     * Collection([ 1, 2, 3, 4, 5, 6 ])
     *     .do(s => s.dropRight())
     *     .while(s => s.length > 3)
     */
    do(fn: CtrlTypeFn<this>): this {
        if (typeof fn !== 'function') {
            throw new Error(`${this.constructor.name}.do() requires a function`);
        }

        if (this.#control.do) {
            return this.#control.do(fn);
        }

        const me = fn(this);

        me.#control.while = cond => cond(me) ? me.do(fn).while(cond) : me.clone();

        return me;
    }

    /**
     * MISCELLANEOUS METHODS
     */

    /**
     * Pass this Collection to a function, and return the return value of that function.
     * 
     * @example
     * // returns 5
     * numseq([ 1, 2, 3, 4, 5 ]).pipe(s => s.len())
     */
    pipe<TPipe>(fn: (coll: this) => TPipe): TPipe {
        if (typeof fn !== 'function') {
            throw new Error(`${this.constructor.name}.pipe() requires a pipe function`);
        }

        return fn(this);
    }

    /**
     * Pass this Collection to a function. Return this Collection.
     * 
     * @example
     * // prints '5', returns numseq([ 1, 2, 3, 4, 5 ])
     * numseq([ 1, 2, 3, 4, 5 ]).tap(s => console.log(s.len())
     */
    tap(fn: (coll: this) => void): this {
        if (typeof fn !== 'function') {
            throw new Error(`${this.constructor.name}.tap() requires a tap function`);
        }

        fn(this);

        return this;
    }

    /**
     * Call the passed function for every member of this Collection. Return this Collection.
     * 
     * @example
     * // prints '1', '2', '3', '4', '5', returns numseq([ 1, 2, 3, 4, 5 ])
     * numseq([ 1, 2, 3, 4, 5 ]).tap(s => console.log(s.val())
     */
    each(fn: (event: T) => void): this {
        if (typeof fn !== 'function') {
            throw new Error(`${this.constructor.name}.each() requires an each function`);
        }

        this.contents.forEach(fn);

        return this;
    }

    /**
     * Return a string description of this Collection.
     */
    describe(indent = 0): string {
        const pad = ''.padStart(indent, ' ');

        let ctdesc: string;
        if (this.length) {
            ctdesc = '\n' + this.contents.map((c, i) => `    ${pad}${i}: ${dumpMultiLine(c, indent + 4)},\n`).join('') + pad;
        } else {
            ctdesc = '';
        }

        return `${this.constructor.name}(length=${this.length},metadata=${this.metadata.describe()})([${ctdesc}])`;
    }
}
