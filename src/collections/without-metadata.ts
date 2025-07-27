import type { SeqIndices, MapperFn, FlatMapperFn, FinderFn, FilterFn, GrouperFn, CtrlBoolFn, CtrlTypeFn, ReplacerFn, Replacer } from '../types';

import { isInt, isPosInt, isNonnegInt } from '../helpers/validation';
import { sanitizeToArray } from '../helpers/arrays';
import { dumpOneLine } from '../dump/dump';

type ControlFlow<T> = {
    do?: (fn: CtrlTypeFn<T>) => T,
    while?: (cond: CtrlBoolFn<T>) => T,
    then_stack?: ((fn: CtrlTypeFn<T>) => T)[],
    else_stack?: ((fn: CtrlTypeFn<T>) => T)[],
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

export default class Collection<T> {
    readonly contents: T[];
    readonly length: number;
    private readonly _control!: ControlFlow<this>;

    constructor(contents: T[]) {
        this.contents = contents;
        this.length = contents.length;

        Object.defineProperty(this, '_control', {
            value: {},
            configurable: false,
            enumerable: false,
            writable: false
        });

        Object.freeze(this.contents);
        Object.freeze(this.length);
    }

    /**
     * Construct a new Collection from zero or more arrays of Collection contents.
     * Metadata is unchanged.
     */
    protected construct(...contents: T[][]): this {
        const Ctor = this.constructor as new (contents: T[]) => this;

        return new Ctor(contents.flat(1));
    }

    /**
     * Calculate a replacement value, return it as an array of Collection contents.
     */
    protected replacer<FromT>(r: Replacer<FromT, T>, curr: FromT, i: number): T[] {
        const retval = typeof r === 'function' ? (r as ReplacerFn<FromT, T>)(curr, i) : r;

        return (retval instanceof Collection ? retval.contents : sanitizeToArray(retval)) as T[];
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
     * intseq([ 1, 2, 3, 4, 5 ]).findFirstIndex(v => v.val() > 3)
     */
    findFirstIndex(fn: FinderFn<T>): number | null {
        if (typeof fn !== 'function') {
            throw new Error(`${this.constructor.name}.findFirstIndex() requires a function`);
        }

        const ret = this.contents.findIndex(fn);

        return ret === -1 ? null : ret;
    }

    /**
     * Find the index of the last member of this Collection which passes the
     * supplied function with arguments (value, index).
     * If none is found, return null.
     * 
     * @example
     * // returns 4
     * intseq([ 1, 2, 3, 4, 5 ]).findLastIndex(v => v.val() > 3)
     */
    findLastIndex(fn: FinderFn<T>): number | null {
        if (typeof fn !== 'function') {
            throw new Error(`${this.constructor.name}.findLastIndex() requires a function`);
        }

        // This implementation because Array.findLastIndex() not yet supported in Typescript
        let i = this.length;

        while (i--) {
            if (fn(this.contents[i], i)) {
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
     * intseq([ 1, 2, 3, 4, 5 ]).findIndices(v => v.val() > 3)
     */
    findIndices(fn: FinderFn<T>): number[] {
        if (typeof fn !== 'function') {
            throw new Error(`${this.constructor.name}.findIndices() requires a function`);
        }

        const ret = [];

        for (let i = 0; i < this.length; i++) {
            if (fn(this.contents[i], i)) {
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
     * // returns intseq([ 1, 3, 5 ])
     * intseq([ 1, 2, 3, 4, 5 ]).filter(v => v % 2 === 0)
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
     * // returns intseq([ 3, 4 ])
     * intseq([ 1, 2, 3, 4, 5 ]).keepSlice(2, 4)
     * 
     * // returns intseq([ 3, 4, 5 ])
     * intseq([ 1, 2, 3, 4, 5 ]).keepSlice(2)
     */
    keepSlice(start: number, end?: number): this {
        return this.construct(this.contents.slice(start, end));
    }

    /**
     * Return a new Collection containing the first n members of this Collection.
     * Negative indices are indexed from the right hand side.
     * 
     * @example
     * // returns intseq([ 1, 2 ])
     * intseq([ 1, 2, 3, 4, 5 ]).keep(2)
     */
    keep(n = 1): this {
        return this.construct(this.contents.slice(0, n));
    }

    /**
     * Return a new Collection containing the last n members of this Collection.
     * Negative indices are indexed from the right hand side.
     * 
     * @example
     * // returns intseq([ 4, 5 ])
     * intseq([ 1, 2, 3, 4, 5 ]).keepRight(2)
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
     * // returns intseq([ 1, 5 ])
     * intseq([ 1, 2, 3, 4, 5 ]).keepIndices([ 0, -1 ])
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
     * // returns intseq([ 1, 4 ])
     * intseq([ 1, 2, 3, 4, 5 ]).keepNth(3)
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
     * // returns intseq([ 1, 2, 5 ])
     * intseq([ 1, 2, 3, 4, 5 ]).dropSlice(2, 4)
     * 
     * // returns intseq([ 1, 2 ])
     * intseq([ 1, 2, 3, 4, 5 ]).dropSlice(2)
     */
    dropSlice(start: number, end = this.length + 1): this {
        return this.construct(this.contents.slice(0, start), this.contents.slice(end));
    }

    /**
     * Return a new Collection containing all members of this Collection except the first n.
     * Negative indices are indexed from the right hand side.
     * 
     * @example
     * // returns intseq([ 3, 4, 5 ])
     * intseq([ 1, 2, 3, 4, 5 ]).drop(2)
     */
    drop(n = 1): this {
        return this.construct(this.contents.slice(n));
    }

    /**
     * Return a new Collection containing those members including and after the supplied index.
     * Negative indices are indexed from the right hand side.
     * 
     * @example
     * // returns intseq([ 1, 2, 3 ])
     * intseq([ 1, 2, 3, 4, 5 ]).dropRight(2) 
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
     * // returns intseq([ 2, 3, 4 ])
     * intseq([ 1, 2, 3, 4, 5 ]).dropIndices([ 0, -1 ]) 
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
     * // returns intseq([ 2, 3, 5 ])
     * intseq([ 1, 2, 3, 4, 5 ]).dropNth(3) 
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

    protected replaceRelative(pos: SeqIndices, rep: Replacer<T, T>, len: number, offset: number): this {
        const locs = this.indices(pos);

        if (!locs.length) {
            return this;
        }

        locs.sort((a, b) => b - a); // last to first order

        const contents = this.val(); // make a shallow copy for splicing

        for (const ix of locs) {
            contents.splice(ix + offset, len, ...this.replacer(rep, this.contents[ix], ix));
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
     * // returns intseq([ 1, 6, 7, 2, 3, 6, 7, 4, 5 ])
     * intseq([ 1, 2, 3, 4, 5 ]).insertBefore([ 1, 3 ], intseq([ 6, 7 ])
     * 
     * // returns intseq([ 1, 2, 3, 4, 9, 5 ])
     * intseq([ 1, 2, 3, 4, 5 ]).insertBefore([ -1 ], v => v.transpose(4))
     */
    insertBefore(pos: SeqIndices, rep: Replacer<T, T>): this {
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
     * // returns intseq([ 1, 2, 6, 7, 3, 4, 6, 7, 5 ])
     * intseq([ 1, 2, 3, 4, 5 ]).insertAfter([ 1, 3 ], intseq([ 6, 7 ])
     * 
     * // returns intseq([ 1, 2, 3, 4, 5, 9 ])
     * intseq([ 1, 2, 3, 4, 5 ]).insertAfter([ -1 ], v => v.transpose(4))
     */
    insertAfter(pos: SeqIndices, rep: Replacer<T, T>): this {
        return this.replaceRelative(pos, rep, 0, 1);
    }

    /**
     * Replace the value at the specified index or indices in the Collection.
     * Indices can be a number, an array of numbers or a Sequence containing numbers.
     * New values can be a Collection, a Collection member, an array of Collection members,
     * or a function taking a Collection member and its position within the collection and
     * returning a Collection, a Collection member, an array of Collection members,
     * 
     * @example
     * // returns intseq([ 1, 6, 7, 3, 6, 7, 5 ])
     * intseq([ 1, 2, 3, 4, 5 ]).replaceIndices([ 1, 3 ], intseq([ 6, 7 ])
     * 
     * // returns intseq([ 1, 2, 3, 4, 9 ])
     * intseq([ 1, 2, 3, 4, 5 ]).replaceIndices([ -1 ], v => v.transpose(4))
     */
    replaceIndices(pos: SeqIndices, rep: Replacer<T, T>): this {
        return this.replaceRelative(pos, rep, 1, 0);
    }

    /**
     * Return a new Collection, where the values at the specified index or indices have
     * been mapped through the supplied function. Other values are left unchanged.
     * 
     * @example
     * // returns intseq([ 1, 6, 3, 4, 9 ])
     * intseq([ 1, 2, 3, 4, 5 ]).mapIndices([ 1, -1 ], v => v.transpose(4))
     */
    mapIndices(pos: SeqIndices, fn: MapperFn<T>): this {
        if (typeof fn !== 'function') {
            throw new Error(`${this.constructor.name}.mapIndices() requires a function`);
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
     * // returns intseq([ 1, 6, 3, 4, 9 ])
     * intseq([ 1, 2, 3, 4, 5 ]).mapIndices([ 1, -1 ], v => v.transpose(4))
     */
    flatMapIndices(pos: SeqIndices, fn: FlatMapperFn<T>): this {
        if (typeof fn !== 'function') {
            throw new Error(`${this.constructor.name}.mapIndices() requires a function`);
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
     * New values can be a Collection, a Collection member, an array of Collection members,
     * or a function taking a Collection member and its position within the collection and
     * returning a Collection, a Collection member, an array of Collection members,
     * 
     * @example
     * // returns intseq([ 1, 6, 7, 3, 4, 5 ])
     * intseq([ 1, 2, 3, 4, 5 ]).replaceFirstIndex(v => v.val() % 2 === 0, intseq([ 6, 7 ])
     * 
     * // returns intseq([ 1, 6, 3, 4, 5 ])
     * intseq([ 1, 2, 3, 4, 5 ]).replaceFirstIndex(v => v.val() % 2 === 0, v => v.transpose(4))
     */
    replaceFirstIndex(fn: FinderFn<T>, rep: Replacer<T, T>): this {
        if (typeof fn !== 'function') {
            throw new Error(`${this.constructor.name}.replaceFirstIndex() requires a function`);
        }

        const ix = this.findFirstIndex(fn);
 
        return ix === null ? this : this.replaceIndices(ix, rep);
    }

    /**
     * Return a new collection where the first value (if any) that matches the finder function
     * has been mapped through the mapper function.
     * 
     * @example
     * // returns intseq([ 1, 6, 3, 4, 5 ])
     * intseq([ 1, 2, 3, 4, 5 ]).mapFirstIndex(v => v.val() % 2 === 0, v => v.transpose(4))
     */
    mapFirstIndex(findfn: FinderFn<T>, mapfn: MapperFn<T>): this {
        if (typeof findfn !== 'function') {
            throw new Error(`${this.constructor.name}.mapFirstIndex() requires a finder function`);
        }

        if (typeof mapfn !== 'function') {
            throw new Error(`${this.constructor.name}.mapFirstIndex() requires a mapper function`);
        }

        const ix = this.findFirstIndex(findfn);
 
        return ix === null ? this : this.mapIndices(ix, mapfn);
    }

    /**
     * Return a new collection where the first value (if any) that matches the finder function
     * has been flat mapped through the mapper function.
     * 
     * @example
     * // returns intseq([ 1, 2, 6, 2, 3, 4, 5 ])
     * intseq([ 1, 2, 3, 4, 5 ]).flatMapFirstIndex(v => v.val() % 2 === 0, v => [ v, v.transpose(4), v ])
     */
    flatMapFirstIndex(findfn: FinderFn<T>, mapfn: FlatMapperFn<T>): this {
        if (typeof findfn !== 'function') {
            throw new Error(`${this.constructor.name}.flatMapFirstIndex() requires a finder function`);
        }

        if (typeof mapfn !== 'function') {
            throw new Error(`${this.constructor.name}.flatMapFirstIndex() requires a mapper function`);
        }

        const ix = this.findFirstIndex(findfn);
 
        return ix === null ? this : this.flatMapIndices(ix, mapfn);
    }

    /**
     * Replace the last value in the Collection that matches the finder function.
     * New values can be a Collection, a Collection member, an array of Collection members,
     * or a function taking a Collection member and its position within the collection and
     * returning a Collection, a Collection member, an array of Collection members,
     * 
     * @example
     * // returns intseq([ 1, 2, 3, 6, 7, 5 ])
     * intseq([ 1, 2, 3, 4, 5 ]).replaceLastIndex(v => v.val() % 2 === 0, intseq([ 6, 7 ])
     * 
     * // returns intseq([ 1, 2, 3, 8, 5 ])
     * intseq([ 1, 2, 3, 4, 5 ]).replaceLastIndex(v => v.val() % 2 === 0, v => v.transpose(4))
     */
    replaceLastIndex(fn: FinderFn<T>, rep: Replacer<T, T>): this {
        if (typeof fn !== 'function') {
            throw new Error(`${this.constructor.name}.replaceLastIndex() requires a function`);
        }

        const ix = this.findLastIndex(fn);
 
        return ix === null ? this : this.replaceIndices(ix, rep);
    }

    /**
     * Return a new collection where the last value (if any) that matches the finder function
     * has been mapped through the mapper function.
     * 
     * @example
     * // returns intseq([ 1, 2, 3, 8, 5 ])
     * intseq([ 1, 2, 3, 4, 5 ]).mapLastIndex(v => v.val() % 2 === 0, v => v.transpose(4))
     */
    mapLastIndex(findfn: FinderFn<T>, mapfn: MapperFn<T>): this {
        if (typeof findfn !== 'function') {
            throw new Error(`${this.constructor.name}.mapLastIndex() requires a finder function`);
        }

        if (typeof mapfn !== 'function') {
            throw new Error(`${this.constructor.name}.mapLastIndex() requires a mapper function`);
        }

        const ix = this.findLastIndex(findfn);
 
        return ix === null ? this : this.mapIndices(ix, mapfn);
    }

    /**
     * Return a new collection where the last value (if any) that matches the finder function
     * has been flat mapped through the mapper function.
     * 
     * @example
     * // returns intseq([ 1, 2, 3, 4, 8, 4, 5 ])
     * intseq([ 1, 2, 3, 4, 5 ]).flatMapLastIndex(v => v.val() % 2 === 0, v => [ v, v.transpose(4), v ])
     */
    flatMapLastIndex(findfn: FinderFn<T>, mapfn: FlatMapperFn<T>): this {
        if (typeof findfn !== 'function') {
            throw new Error(`${this.constructor.name}.flatMapLastIndex() requires a finder function`);
        }

        if (typeof mapfn !== 'function') {
            throw new Error(`${this.constructor.name}.flatMapLastIndex() requires a mapper function`);
        }

        const ix = this.findLastIndex(findfn);
 
        return ix === null ? this : this.flatMapIndices(ix, mapfn);
    }

    /**
     * Replace all values in the Collection that match the finder function.
     * New values can be a Collection, a Collection member, an array of Collection members,
     * or a function taking a Collection member and its position within the collection and
     * returning a Collection, a Collection member, an array of Collection members,
     * 
     * @example
     * // returns intseq([ 1, 6, 7, 3, 6, 7, 5 ])
     * intseq([ 1, 2, 3, 4, 5 ]).replaceIf(v => v.val() % 2 === 0, intseq([ 6, 7 ])
     * 
     * // returns intseq([ 1, 6, 3, 8, 5 ])
     * intseq([ 1, 2, 3, 4, 5 ]).replaceIf(v => v.val() % 2 === 0, v => v.transpose(4))
     */
    replaceIf(fn: FinderFn<T>, rep: Replacer<T, T>): this {
        if (typeof fn !== 'function') {
            throw new Error(`${this.constructor.name}.replaceIf() requires a function`);
        }

        return this.replaceIndices(this.findIndices(fn), rep);
    }

    /**
     * Create a new Collection where values that match the finder function have been mapped
     * through the mapper function.
     * 
     * @example
     * // returns intseq([ 1, 6, 3, 8, 5 ])
     * intseq([ 1, 2, 3, 4, 5 ]).mapIf(v => v.val() % 2 === 0, v => v.transpose(4))
     */
    mapIf(findfn: FinderFn<T>, mapfn: MapperFn<T>): this {
        if (typeof findfn !== 'function') {
            throw new Error(`${this.constructor.name}.mapIf() requires a finder function`);
        }

        if (typeof mapfn !== 'function') {
            throw new Error(`${this.constructor.name}.mapIf() requires a mapper function`);
        }

        return this.mapIndices(this.findIndices(findfn), mapfn);
    }

    /**
     * Create a new Collection where values that match the finder function have been flat 
     * mapped through the mapper function.
     * 
     * @example
     * // returns intseq([ 1, 2, 6, 2, 3, 4, 8, 4, 5 ])
     * intseq([ 1, 2, 3, 4, 5 ]).flatMapIf(v => v.val() % 2 === 0, v => [ v, v.transpose(4), v ])
     */
    flatMapIf(findfn: FinderFn<T>, mapfn: FlatMapperFn<T>): this {
        if (typeof findfn !== 'function') {
            throw new Error(`${this.constructor.name}.flatMapIf() requires a finder function`);
        }

        if (typeof mapfn !== 'function') {
            throw new Error(`${this.constructor.name}.flatMapIf() requires a mapper function`);
        }

        return this.flatMapIndices(this.findIndices(findfn), mapfn);
    }

    /**
     * Replace every nth values in the Collection, optionally starting after an offset.
     * New values can be a Collection, a Collection member, an array of Collection members,
     * or a function taking a Collection member and its position within the collection and
     * returning a Collection, a Collection member, an array of Collection members,
     * 
     * @example
     * // returns intseq([ 6, 7, 2, 3, 6, 7, 5 ])
     * intseq([ 1, 2, 3, 4, 5 ]).replaceNth(3, intseq([ 6, 7 ])
     * 
     * // returns intseq([ 5, 2, 3, 8, 5 ])
     * intseq([ 1, 2, 3, 4, 5 ]).replaceNth(3, v => v.transpose(4))
     */
    replaceNth(n: number, rep: Replacer<T, T>, offset = 0): this {
        if (!isPosInt(n)) {
            throw new Error(`${this.constructor.name}.replaceNth(): argument must be a positive integer`);
        }

        if (!isNonnegInt(offset)) {
            throw new Error(`${this.constructor.name}.replaceNth(): offset must be a non-negative integer`);
        }

        return this.flatMap((v, i) => i >= offset && ((i - offset) % n) === 0 ? this.replacer(rep, v, i) : v);
    }

    /**
     * Create a new collection where every nth value has been mapped through the supplied
     * mapper function. If an offset is supplied, replacement will start at that index,
     * otherwise it starts at the first member of the collection.
     * 
     * @example
     * // returns intseq([ 5, 2, 3, 8, 5 ])
     * intseq([ 1, 2, 3, 4, 5 ]).mapNth(3, v => v.transpose(4))
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
     * // returns intseq([ 1, 5, 1, 2, 3, 4, 8, 4, 5 ])
     * intseq([ 1, 2, 3, 4, 5 ]).mapNth(3, v => [ v, v.transpose(4), v ])
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
     * Replace a slice of the Collection with a new Collection while retaining the values
     * from the rest of the original Collection.
     * New values can be a Collection, a Collection member, an array of Collection members,
     * or a function taking a Collection member and its position within the collection and
     * returning a Collection, a Collection member, an array of Collection members,
     * 
     * @example
     * // returns intseq([ 1, 6, 7, 5 ])
     * intseq([ 1, 2, 3, 4, 5 ]).replaceSlice(1, -1, intseq([ 6, 7 ])
     * 
     * // returns intseq([ 1, 4, 3, 2, 5 ])
     * intseq([ 1, 2, 3, 4, 5 ]).replaceSlice(1, -1, s => s.retrograde(4))
     */
    replaceSlice(start: number, end: number, rep: Replacer<this, T>): this {
        const [ p1, p2, p3 ] = this.splitAt([ start, end ]);

        return p1.append(this.construct(this.replacer(rep, p2, p1.length)), p3);
    }

    /**
     * Map a slice of the Collection through a mapper function while retaining the
     * values from the rest of the original Collection. Returns a new Collection.
     * 
     * @example
     * // returns intseq([ 1, 6, 5, 4, 5 ])
     * intseq([ 1, 2, 3, 4, 5 ]).mapSlice(1, -1, m => m.invert(4))
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
     * // returns intseq([ 1, 2, 6, 2, 3, 5, 3, 4, 4, 4, 5 ])
     * intseq([ 1, 2, 3, 4, 5 ]).flatMapSlice(1, -1, [ m, m => m.invert(4), m ])
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
     * Return a new Collection containing the contents of this, passed through a mapper function.
     * 
     * @example
     * // returns intseq([ 9, 2, 7, 4, 5 ])
     * intseq([ 1, 2, 3, 4, 5 ]).map((m, i) => i % 2 === 0 ? m.invert(5) : m)
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
     * // returns intseq([ 1, 9, 2, 8, 3, 7, 4, 6, 5 ])
     * intseq([ 1, 2, 3, 4, 5 ]).flatMap(m => [ m, m.invert(5) ])
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
     * // returns intseq([ 1, 2, 3, 4, 5 ])
     * intseq([ 1 ]).append(intseq([ 2, 3, 4 ]), intseq([ 5 ]))
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
     * // returns intseq([ 2, 3, 4, 5, 1 ])
     * intseq([ 1 ]).prepend(intseq([ 2, 3, 4 ]), intseq([ 5 ]))
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
     * // returns intseq([ 5, 4, 3, 2, 1 ])
     * intseq([ 1, 2, 3, 4, 5 ]).retrograde();
     */
    retrograde(): this {
        return this.construct(this.val().reverse());
    }

    /**
     * Swap values at the passed location(s) in the Collection. Multiple
     * arguments are accepted and processed in order.
     * 
     * @example
     * // returns intseq([ 2, 1, 3, 5, 4 ])
     * intseq([ 1, 2, 3, 4, 5 ]).swapAt([ 0, 1 ], [ 3, 4 ]);
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
     * // returns [ intseq([]), intseq([ 1, 2, 3 ]), intseq([ 4, 5 ]) ]
     * intseq([ 1, 2, 3, 4, 5 ]).splitAt([ 0, 3 ]);
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
     * // returns [ intseq([ 1, 3, 5 ]), intseq([ 2, 4 ]) ],
     * intseq([ 1, 2, 3, 4, 5 ]).partition(v => v.val() % 2 === 1)
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
     * // returns { 1: intseq([ 1, 4 ]), 2: intseq([ 2, 5 ]), 0: intseq([ 3 ]) },
     * intseq([ 1, 2, 3, 4, 5 ]).groupBy(v => v.val() % 3)
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

        let thenstack: ((fn: CtrlTypeFn<this>) => this)[];
        let elsestack: ((fn: CtrlTypeFn<this>) => this)[];

        const yesfn: (fn: CtrlTypeFn<this>) => this = fn => {
            const ret = fn(me);

            ret._control.then_stack = thenstack.slice(0, -1);
            ret._control.else_stack = elsestack.slice(0, -1);

            return ret.if(yes);
        };

        const nofn: (fn: CtrlTypeFn<this>) => this = () => {
            const ret = me.clone();

            ret._control.then_stack = thenstack.slice(0, -1);
            ret._control.else_stack = elsestack.slice(0, -1);

            return ret.if(yes);
        };

        if (yes) {
            if (this._control.then_stack) {
                thenstack = [ ...this._control.then_stack, yesfn ];
            } else {
                thenstack = [ yesfn ];
            }

            if (this._control.else_stack) {
                elsestack = [ ...this._control.else_stack, nofn ];
            } else {
                elsestack = [ nofn ];
            }
        } else {
            if (this._control.then_stack) {
                thenstack = [ ...this._control.then_stack, nofn ];
            } else {
                thenstack = [ nofn ];
            }

            if (this._control.else_stack) {
                elsestack = [ ...this._control.else_stack, yesfn ];
            } else {
                elsestack = [ yesfn ];
            }
        }

        me._control.then_stack = thenstack;
        me._control.else_stack = elsestack;
        return me;
    }

    /**
     * End a conditional processing block.
     */
    endif(): this {
        const me = this.clone();

        if (this._control.then_stack && this._control.then_stack.length > 0) {
            me._control.then_stack = this._control.then_stack.slice(0, -1);
        }

        if (this._control.else_stack && this._control.else_stack.length > 0) {
            me._control.else_stack = this._control.else_stack.slice(0, -1);
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

        if (!this._control.then_stack || this._control.then_stack.length < 1) {
            throw new Error(`${this.constructor.name}.then() without an if condition`);
        }

        return this._control.then_stack[this._control.then_stack.length - 1](fn);
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

        if (!this._control.else_stack || this._control.else_stack.length < 1) {
            throw new Error(`${this.constructor.name}.else() without an if condition`);
        }

        return this._control.else_stack[this._control.else_stack.length - 1](fn);
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
     * .while() calls should not be directly nested. Use a .do() call to
     * separate them, eg:
     *
     * collection.while(first_condition)
     *     .do(
     *         c => c.while(second_condition)
     *              .do(action)
     *     )
     *
     * not:
     *
     * collection.while(first_condition).while(second_condition).do(action)
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

        if (this._control.while) {
            return this._control.while(cond);
        }

        const me = this.clone();

        if (cond(me)) {
            me._control.do = fn => fn(me).while(cond).do(fn);
        } else {
            me._control.do = () => me.clone();
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
     * Nested .do() calls do not work. Example of this:
     *
     * collection.do(
     *     c => c.while(first_condition)
     *        .do(action)
     * ).while(second_condition)
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

        if (this._control.do) {
            return this._control.do(fn);
        }

        const me = fn(this);

        me._control.while = cond => cond(me) ? me.do(fn).while(cond) : me;

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
     * intseq([ 1, 2, 3, 4, 5 ]).pipe(s => s.len())
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
     * // prints '5', returns intseq([ 1, 2, 3, 4, 5 ])
     * intseq([ 1, 2, 3, 4, 5 ]).tap(s => console.log(s.len())
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
     * // prints '1', '2', '3', '4', '5', returns intseq([ 1, 2, 3, 4, 5 ])
     * intseq([ 1, 2, 3, 4, 5 ]).tap(s => console.log(s.val())
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
    describe(): string {
        let ctdesc: string;

        if (this.length) {
            ctdesc = this.contents.map((c, i) => `${i}: ${dumpOneLine(c)},`).join('');
        } else {
            ctdesc = '';
        }

        return `${this.constructor.name}(length=${this.length})([${ctdesc}])`;
    }
}
