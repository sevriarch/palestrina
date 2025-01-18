import type { GamutOpts, Replacer, ReplacerFn, MapperFn, ArrayFinderFn, FilterFn, PitchMutatorFn, PitchMapperFn, AnySeq, NumSeq, NoteSeq, ChordSeq, Melody, SeqMemberArgument, PitchArgument, ISequence, SeqIndices, SeqArgument, MetadataData } from '../types';

import type SeqMember from './members/generic';
import Metadata from '../metadata/metadata';

import CollectionWithMetadata from '../collections/with-metadata';

import Registry from '../registry/registry';

import * as mutators from '../mutators/mutators';

import { isNumber, isNonnegInt, isPosInt } from '../helpers/validation';
import { sum, min, max } from '../helpers/calculations';
import { dedupe, arrayToWindows, zip, sanitizeToArray } from '../helpers/arrays';
import { dumpOneLine } from '../dump/dump';

function fillarray<T>(len: number, val: T) {
    return new Array(len).fill(val);
}

/**
 * Abstract class defining a generic Sequence. A variety of methods ae defined
 * here that can act on contents that implement the ISeqMember interface.
 * This class is inherited by derived classes: NumSeq, NoteSeq ChordSeq, Melody
 *
 * Sequence contents are an array of member class objects, which correspond to
 * the derived class: NumSeqMember, NoteSeqMember, ChordSeqMember, MelodyMember
 */

type SeqCtor<T, MT> = new (contents: MT[], metadata: Metadata) => T;
type MemberClass<MT> = { from: (val: SeqMemberArgument) => MT };
export default abstract class Sequence<ET extends SeqMember<unknown>> extends CollectionWithMetadata<ET> implements ISequence<ET> {
    /**
     * Return a Sequence of the specified class and member class.
     * @hidden
     */
    static build<T extends Sequence<MT>, MT extends SeqMember<unknown>>(SeqClass: SeqCtor<T, MT>, MemberClass: MemberClass<MT>, seq: SeqArgument, metadata?: MetadataData): T {
        let contents: SeqMemberArgument[];

        if (seq instanceof Sequence) {
            // Reuse existing object if same constructor and no metadata passed.
            if (seq instanceof SeqClass && !metadata) {
                return seq;
            }

            contents = seq.contents;
        } else {
            contents = seq;
        }

        return new SeqClass(contents.map(MemberClass.from), Metadata.from(metadata));
    }

    constructor(contents: ET[], metadata: Metadata) {
        super(contents, metadata);

        metadata.validator.validateContents(contents);

        Object.freeze(this);
    }

    protected abstract constructMember(v: SeqMemberArgument): ET;

    /*
     * OVERRIDES
     */

    protected override replacer<FromT>(r: Replacer<FromT, ET>, curr: FromT, i: number): ET[] {
        const retval = typeof r === 'function' ? r(curr, i) : r;
    
        if (retval instanceof Sequence) {
            // Avoid unnecessary calls if retval is the same type of Sequence
            if (this.constructor === retval.constructor) {
                return retval.contents as ET[];
            }

            return retval.contents.map(this.constructMember);
        }
    
        if (Array.isArray(retval)) {
            return retval.map(this.constructMember);
        }
    
        return [ this.constructMember(retval) ];
    }

    /**
     * Append zero or more items to this Sequence. Return the resulting Sequence.
     * 
     * @example
     * // returns intseq([ 1, 2, 3, 4, 5 ])
     * intseq([ 1, 2, 3 ]).appendItems(4, 5)
     */
    override appendItems(...items: SeqMemberArgument[]): this {
        return super.appendItems(...items.map(this.constructMember));
    }

    /**
     * Prepend zero or more items to this Sequence. Return the resulting Sequence.
     * 
     * @example
     * // returns intseq([ 4, 5, 1, 2, 3 ])
     * intseq([ 1, 2, 3 ]).prependItems(4, 5)
     */
    override prependItems(...items: SeqMemberArgument[]): this {
        return super.prependItems(...items.map(this.constructMember));
    }

    /*
     * CONVERSION FROM SEQUENCE TO ANOTHER TYPE
     */

    /**
     * Returns an array of all pitches in the Sequence.
     * 
     * @example
     * // returns [ [ 1 ], [ 2 ], [ 3 ], [ 4 ], [ 5 ] ])
     * intseq([ 1, 2, 3, 4, 5 ]).toPitches()
     * 
     * // returns [ [ 1, 2 ], [], [ 3 ], [ 4, 5 ] ]
     * chordseq([ [ 1, 2 ], [], 3, [ 4, 5 ]).toPitches()
     */
    toPitches(): number[][] {
        return this.contents.map(v => v.pitches());
    }

    /**
     * Returns a flattened array of all pitches in the Sequence.
     * 
     * @example
     * // returns [ 1, 2, 3, 4, 5 ])
     * intseq([ 1, 2, 3, 4, 5 ]).toFlatPitches()
     * 
     * // returns [ 1, 2, 3, 4, 5 ])
     * chordseq([ [ 1, 2 ], [], 3, [ 4, 5 ]).toFlatPitches()
     */
    /**
     * Returns a flattened array of all pitches in the Sequence
     */
    toFlatPitches(): number[] {
        return this.contents.flatMap(v => v.pitches());
    }

    /**
     * Returns an array containing numeric values in the Sequence. If the pitch of any 
     * member of the Sequence is empty/null or a chord, this will throw an error.
     * 
     * @example
     * // returns [ 1, 2, 3, 4, 5 ])
     * intseq([ 1, 2, 3, 4, 5 ]).toNumericValues()
     * 
     * // throws an error
     * chordseq([ [ 1, 2 ], [], 3, [ 4, 5 ]).toNumericValues()
     */
    toNumericValues(): number[] {
        return this.contents.map(e => e.numericValue());
    }

    /**
     * Returns an array containing nulls and numeric values in the Sequence. If the
     * pitch of any is a chord, this will throw an error.
     * 
     * @example
     * // returns [ 1, 2, null, 4, 5 ])
     * noteseq([ 1, 2, null, 4, 5 ]).toNullableNumericValues()
     * 
     * // throws an error
     * chordseq([ [ 1, 2 ], [], 3, [ 4, 5 ]).toNullableNumericValues()
     */
    toNullableNumericValues(): (null | number)[] {
        return this.contents.map(e => e.nullableNumericValue());
    }

    /**
     * Returns an array of tuples containing pitches and how often they appear in
     * the Sequence. This array will be ordered by first appearance in the Sequence.
     */

    /**
     * Returns a Map mapping pitches to how often they appear in the Sequence.
     */
    toPitchDistributionMap(): Map<number, number> {
        const map: Map<number, number> = new Map();

        this.toFlatPitches().forEach(v => {
            map.set(v, (map.get(v) ?? 0) + 1);
        });

        return map;
    }

    /*
     * INFORMATION ABOUT THIS SEQUENCE
     */

    /**
     * Returns the lowest pitch in the Sequence, and null if there are no pitches in the Sequence.
     * 
     * @example
     * // returns 1
     * chordseq([ [ 1, 2 ], [], 3, [ 4, 5 ]).min()
     */
    min(): number | null {
        const pitches = this.toFlatPitches();

        return pitches.length ? Math.min(...pitches) : null;
    }

    /**
     * Returns the highest pitch in the Sequence, and null if there are no pitches in the Sequence.
     * 
     * @example
     * // returns 5
     * chordseq([ [ 1, 2 ], [], 3, [ 4, 5 ]).max()
     */
    max(): number | null {
        const pitches = this.toFlatPitches();

        return pitches.length ? Math.max(...pitches) : null;
    }

    /**
     * Return the difference between the highest and lowest pitches in the Sequence, and zero if there
     * are no pitches in the Sequence.
     * 
     * @example
     * // returns 4
     * chordseq([ [ 1, 2 ], [], 3, [ 4, 5 ]).range()
     */
    range(): number {
        return (this.max() ?? 0) - (this.min() ?? 0);
    }

    /**
     * Return the sum of all pitches in the Sequence, and zero if there are no pitches in the Sequence.
     * 
     * @example
     * // returns 15
     * chordseq([ [ 1, 2 ], [], 3, [ 4, 5 ]).total()
     */
    total(): number {
        return sum(this.toFlatPitches());
    }

    /**
     * Return the mean pitch in the Sequence. Return null if there are no ptiches in the sequence.
     * 
     * @example
     * // returns 3
     * chordseq([ [ 1, 2 ], [], 3, [ 4, 5 ]).mean()
     */
    mean(): number | null {
        const pitches = this.toFlatPitches().filter(p => p !== null);

        return pitches.length ? sum(pitches) / pitches.length : null;
    }

    /**
     * For each member of the Sequence, return the minimum pitch.
     * 
     * @example
     * // returns [ 1, null, 3, 4 ]
     * chordseq([ [ 1, 2 ], [], 3, [ 4, 5 ]).mean()
     */
    mins(): (number | null)[] {
        return this.contents.map(v => v.min());
    }

    /**
     * For each member of the Sequence, return the maximum pitch.
     * 
     * @example
     * // returns [ 2, null, 3, 5 ]
     * chordseq([ [ 1, 2 ], [], 3, [ 4, 5 ]).mean()
     */
    maxes(): (number | null)[] {
        return this.contents.map(v => v.max());
    }

    /**
     * For each member of the Sequence, return the mean pitch.
     * 
     * @example
     * // returns [ 1.5, null, 3, 4.5 ]
     * chordseq([ [ 1, 2 ], [], 3, [ 4, 5 ]).mean()
     */
    means(): (number | null)[] {
        return this.contents.map(v => v.mean());
    }

    /*
     * COMPARISONS WITH OTHER SERIES (INCLUDING SELF)
     */

    /**
     * Returns true if all passed values are of the same type of Sequence as this one, else false.
     */
    isSameClassAndLengthAs(...seq: unknown[]): boolean {
        return seq.every(v => v instanceof Sequence
            && v.constructor === this.constructor
            && v.metadata.validator === this.metadata.validator
            && v.length === this.length
        );
    }

    /**
     * Tests if this Sequence is identical to the passed Sequences.
     */
    equals(...seq: this[]): boolean {
        if (!this.isSameClassAndLengthAs(...seq)) {
            return false;
        }

        return !seq.some(s => {
            for (let i = 0; i < this.length; i++) {
                if (!this.contents[i].equals(s.contents[i])) {
                    return true;
                }
            }
        });
    }

    /**
     * Test if this Sequence is a subset of the passed Sequence.
     *
     * @example
     * // returns true
     * intseq([ 0, 1, 2 ]).isSubsetOf(intseq([ 0, 1, 1, 0, 2 ]))
     *
     * // returns false
     * intseq([ 0, 1, 2 ]).isSubsetOf(intseq([ 0, 2, 1, 0, 1 ])
     */
    isSubsetOf(seq: this): boolean {
        if (!this.isSameClassAs(seq)) { return false; }

        const sub = this.contents;
        const sup = seq.contents;
        const sublen = sub.length;
        const suplen = sup.length;

        if (!sublen) { return true; }

        if (sublen > suplen) { return false; }

        let curr = 0;
        for (let i = 0; i < suplen; i++) {
            if (sub[curr].equals(sup[i])) {
                curr++;
                if (curr === sublen) { return true; }
            }
        }

        return false;
    }

    /**
     * Test if this Sequence is a superset of the passed Sequence.
     *
     * @example
     * // returns true
     * intseq([ 0, 1, 1, 0, 2 ]).isSupersetOf(intseq([ 0, 1, 2 ]))
     *
     * // returns false
     * intseq([ 0, 2, 1, 0, 1 ]).isSubsetOf(intseq([ 0, 1, 2 ]))
     */
    isSupersetOf(seq: this): boolean {
        return seq.isSubsetOf(this);
    }

    /**
     * Compare pitches in this Sequence one by one against a supplied
     * comparator function. If all return the same value, return true;
     * if any do not, return false.
     * Used to determine (for example), if a Sequence is an inversion,
     * transposition or augmentation of another Sequence.
     *
     * @example
     * // returns true
     * intseq([ 1, 2, 3, 4, 5 ]).isTransformationOf((a, b) => a + b, intseq([ 5, 4, 3, 2, 1 ])
     *
     * // returns false
     * intseq([ 1, 2, 3, 4, 5 ]).isTransformationOf((a, b) => a * b, intseq([ 5, 4, 3, 2, 1 ])
     */
    isTransformationOf(fn: (p1: number, p2: number) => number, seq: this): boolean {
        if (typeof fn !== 'function') {
            throw new Error(`${this.constructor.name}.isTransformationOf(): must supply function`);
        }

        const v1 = this.toPitches();
        const v2 = seq.toPitches();

        if (this.length !== v2.length) {
            return false;
        }

        if (this.length === 0) {
            return true;
        }

        // Compare number of notes in each member of the Sequences
        for (let i = 0; i < v1.length; i++) {
            if (v1[i].length !== v2[i].length) {
                return false;
            }
        }

        function comparePitches(p1: number[], p2: number[]): boolean {
            let val = null;

            for (let i = 0; i < p1.length; i++) {
                const cmp = fn(p1[i], p2[i]);

                if (!isFinite(cmp)) {
                    continue;
                }

                if (val === null) {
                    val = cmp;
                } else if (cmp !== val) {
                    return false;
                }
            }

            return true;
        }

        // Compare values with pitches in same order
        if (comparePitches(v1.flat(), v2.flat())) {
            return true;
        }

        // Compare values with pitches reversed in order
        const v2rev = v2.map(p => p.slice().reverse());

        return comparePitches(v1.flat(), v2rev.flat());
    }

    /**
     * Test if this Sequence is a transposition of the passed Sequence.
     * Test is based on pitches only.
     *
     * @example
     * // returns false
     * intseq([ 1, 2, 3, 4, 5 ]).isTranspositionOf(intseq([ 8, 7, 6, 5, 4 ])
     *
     * // returns true
     * intseq([ 1, 2, 3, 4, 5 ]).isTranspositionOf(intseq([ 4, 5, 6, 7, 8 ])
     */
    isTranspositionOf(seq: this): boolean {
        return this.isTransformationOf((a, b) => a - b, seq);
    }

    /**
     * Test if this Sequence is an inverted transposition of the passed Sequence.
     * Test is based on pitches only.
     *
     * @example
     * // returns true
     * intseq([ 1, 2, 3, 4, 5 ]).isInversionOf(intseq([ 8, 7, 6, 5, 4 ])
     *
     * // returns false
     * intseq([ 1, 2, 3, 4, 5 ]).isInversionOf(intseq([ 4, 5, 6, 7, 8 ])
     */
    isInversionOf(seq: this): boolean {
        return this.isTransformationOf((a, b) => a + b, seq);
    }

    /**
     * Test if this Sequence is a transposed retrograde of the passed Sequence.
     * Test is based on pitches only, and allows transpositions.
     *
     * @example
     * // returns true
     * intseq([ 1, 2, 3, 4, 5 ]).isRetrogradeOf(intseq([ 8, 7, 6, 5, 4 ])
     *
     * // returns false
     * intseq([ 1, 2, 3, 4, 5 ]).isRetrogradeOf(intseq([ 4, 5, 6, 7, 8 ])
     */
    isRetrogradeOf(seq: this): boolean {
        return this.isTranspositionOf(seq.retrograde());
    }

    /**
     * Test if this Sequence is its own retrograde inversion.
     * Test is based on pitches only.
     * @example
     * // returns false
     * intseq([ 1, 2, 3, 4, 5 ]).isRetrogradeInversionOf(intseq([ 8, 7, 6, 5, 4 ])
     *
     * // returns true
     * intseq([ 1, 2, 3, 4, 5 ]).isRetrogradeInversionOf(intseq([ 4, 5, 6, 7, 8 ])
     */
    isRetrogradeInversionOf(seq: this): boolean {
        return this.isInversionOf(seq.retrograde());
    }

    /**
     * Test if this sequence repeats every n values.
     *
     * @example
     * // returns true
     * intseq([ 1, 2, 3, 1, 2, 3, 1, 2, 3, 1, 2, 3 ]).hasPeriodicityOf(3)
     */
    hasPeriodicityOf(max: number): boolean {
        if (max * 2 > this.length) { return false; }

        for (let i = 0; i < max; i++) {
            const cmp = this.contents[i];

            for (let j = i + max; j < this.length; j += max) {
                if (!this.contents[j].equals(cmp)) {
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * Test if this sequence repeats, and if so, return the length of the
     * repeating subsequence (or 0 if the sequence does not repeat).
     *
     * @example
     * // returns 3
     * intseq([ 1, 2, 3, 1, 2, 3, 1, 2, 3, 1, 2, 3 ]).hasPeriodicity()
     */
    hasPeriodicity(): number {
        const max = Math.floor(this.length / 2);

        for (let i = 1; i <= max; i++) {
            if (this.hasPeriodicityOf(i)) { return i; }
        }

        return 0;
    }

    /*
     * FIND INDICES WITHIN SERIES
     */

    /**
     * Find the indices of all members of this sequence which pass the supplied
     * function with arguments ([ value, next value, ... ], index).
     * If none are found, return an empty array.
     * This function uses a sliding window with step sizes and starts from the
     * first member of the series.
     *
     * @example
     * // returns [ 1, 4 ]
     * intseq([ 1, 2, 2, 3, 4, 4, 5 ]).findIfWindow(2, 1, m => m[0].val() === m[1].val())
     */
    findIfWindow(size: number, step: number, fn: ArrayFinderFn<ET>): number[] {
        if (typeof fn !== 'function') {
            throw new Error(`${this.constructor.name}.findIfWindow(): requires a function`);
        }

        const max = this.length - size + 1;
        const ret = [];

        for (let i = 0; i < max; i += step) {
            if (fn(this.contents.slice(i, i + size), i)) {
                ret.push(i);
            }
        }

        return ret;
    }

    /**
     * Find the indices of all members of this sequence which pass the supplied
     * function with arguments ([ value, next value, ... ], index).
     * If none are found, return an empty array.
     * This function uses a sliding window with step sizes and starts from the
     * last member of the series.
     *
     * @example
     * // returns [ 5, 2 ]
     * intseq([ 1, 2, 2, 3, 4, 4, 5 ]).findIfReverseWindow(2, 1, m => m[0].val() === m[1].val())
     */
    findIfReverseWindow(size: number, step: number, fn: ArrayFinderFn<ET>): number[] {
        if (typeof fn !== 'function') {
            throw new Error(`${this.constructor.name}.findIfReverseWindow(): requires a function`);
        }

        const vals = this.val();
        const ret = [];

        for (let i = this.length - size; i >= 0; i -= step) {
            const slice = vals.slice(i, i + size);

            if (fn(slice, i)) {
                ret.push(i);
            }
        }

        return ret;
    }

    /*
     * PATCHING NEW VALUES INTO A SERIES
     */

    /**
     * Remove all values that pass the supplied function with arguments
     * ([ value1, value2, ... ], index), and insert new values in their place.
     * New values can be a Sequence, a valid Sequence member, an array of 
     * valid Sequence members, or a function that will return one of these.
     *
     * This function uses a sliding window with step sizes and starts from the
     * first member of the series.
     *
     * @example
     * // returns intseq([ 1, 8, 3, 6, 5 ])
     * intseq([ 1, 2, 2, 3, 4, 4, 5 ]).replaceIfWindow(2, 1,
     *     m => m[0].val() === m[1].val(),
     *     m => m[0].invert(5)
     * )
     */
    replaceIfWindow(size: number, step: number, fn: ArrayFinderFn<ET>, rep: Replacer<ET[], ET>): this {
        if (typeof fn !== 'function') {
            throw new Error(`${this.constructor.name}.replaceIfWindow(): requires a function`);
        }

        const vals = this.val();

        for (let i = this.length - size; i >= 0; i -= step) {
            const loc = vals.length - i;

            // If we have regressed before the start of the sequence, try again
            if (loc < size) { continue; }

            const slice = vals.slice(loc - size, loc);
            if (fn(slice, loc - size)) {
                vals.splice(loc - size, size, ...this.replacer(rep, slice, loc));
            }
        }

        return this.construct(vals);
    }

    /**
     * Remove all values that pass the supplied function with arguments
     * ([ value1, value2, ... ], index), and insert new values in their place.
     * New values can be a Sequence, a valid Sequence member, an array of 
     * valid Sequence members, or a function that will return one of these.
     *
     * This function uses a sliding window with step sizes and starts from the
     * last member of the series.
     *
     * @example
     * // returns intseq([ 1, 8, 3, 6, 5 ])
     * intseq([ 1, 2, 2, 3, 4, 4, 5 ]).replaceIfReverseWindow(2, 1,
     *     m => m[0].val() === m[1].val(),
     *     m => m[0].invert(5)
     * )
     */
    replaceIfReverseWindow(size: number, step: number, fn: ArrayFinderFn<ET>, rep: Replacer<ET[], ET>): this {
        if (typeof fn !== 'function') {
            throw new Error(`${this.constructor.name}.replaceIfReverseWindow(): requires a function`);
        }

        const vals = this.val();

        for (let i = this.length - size; i >= 0; i -= step) {

            // If the slice is too short, try again
            if (i + size > vals.length) { continue; }

            const slice = vals.slice(i, i + size);
            if (fn(slice, i)) {
                vals.splice(i, size, ...this.replacer(rep, slice, i));
            }
        }

        return this.construct(vals);
    }

    /**
     * Replace a slice of the Sequence with a set of static values
     * retaining the values from the rest of the original Sequence.
     * Returns a new Sequence.
     *
     * @example
     * // returns intseq([ 1, 0, 0, 0, 5 ])
     * intseq.setSlice(1, -1, 0)
     */
    setSlice(start: number | undefined, end: number | undefined, val: SeqMemberArgument): this {
        const [ p1, p2, p3 ] = this.splitAt([ start ?? 0, end ?? this.length ]);

        return p1.append(this.construct(fillarray(p2.length, this.constructMember(val))), p3);
    }

    /*
     * CREATION OF RELATED SERIES
     */

    /**
     * Return a Sequence containing a loop of the values in this Sequence.
     * First argument determines the length of the returned loop, second optional
     * zero-indexed argument determines which member of the Sequence to start with.
     *
     * @example
     * // returns intseq([ 2, 3, 1, 2, 3, 1, 2, 3 ])
     * intseq([ 1, 2, 3 ]).loop(8, 1)
     */
    loop(n: number, start = 0): this {
        if (!this.length) {
            throw new Error(`${this.constructor.name}.loop(): cannot loop a zero-length Sequence`);
        }
 
        const need = n + this.index(start);

        return this.repeat(Math.ceil(need / this.length))
            .prepend(this.drop(start))
            .keep(n);
    }

    /**
     * Return a Sequence containing n copies of the values in this one.
     *
     * @example
     * // returns intseq([ 1, 2, 3, 1, 2, 3 ])
     * intseq([ 1, 2, 3 ]).repeat()
     */
    repeat(n = 2): this {
        return this.construct(...fillarray(n, this.contents));
    }

    /**
     * Return a new Sequence that contains all values repeated n times.
     *
     * @example
     * // returns intseq([ 1, 1, 1, 2, 2, 2, 3, 3, 3 ])
     * intseq([ 1, 2, 3 ]).dupe(3)
     */
    dupe(ct = 2): this {
        return this.flatMap(e => fillarray(ct, e));
    }

    /**
     * Return a new Sequence that contains all repeated values deduplicated.
     *
     * @example
     * // returns intseq([ 1, 2, 3, 2, 1 ])
     * intseq([ 1, 2, 2, 3, 3, 2, 2, 1 ]).dedupe()
     */
    dedupe(): this {
        const vals = this.contents.slice(0, 1);

        for (let i = 1; i < this.length; i++) {
            if (!this.contents[i].equals(this.contents[i - 1])) {
                vals.push(this.contents[i]);
            }
        }

        return this.construct(vals);
    }

    /**
     * Shuffle this sequence in a consistent manner. Break it into subsequences
     * with the length of the passed argument and shuffle all of these according
     * to the order in the passed argument.
     *
     * @example
     * // returns intseq([ 2, 3, 1, 5, 6, 4, 8, 9, 7 ])
     * intseq([ 1, 2, 3, 4, 5, 6, 7, 8, 9 ]).shuffle([ 0, 2, 1 ])
     */
    shuffle(order: number[]): this {
        const olen = order.length;
        const len = this.length;

        if (olen < 2) {
            throw new Error(`${this.constructor.name}.shuffle(): order ${order} needs to be at least two long`);
        }

        if (len % olen) {
            throw new Error(`${this.constructor.name}.shuffle(): sequence length ${len} is not a multiple of ${olen}`);
        }

        if (order.slice().sort((a, b) => a - b).some((v, i) => v !== i)) {
            throw new Error(`${this.constructor.name}.shuffle(): order ${order} needs to contain all integers from 0 to ${olen - 1}`);
        }

        const ret = new Array(len);

        for (let i = 0; i < len; i += olen) {
            for (let j = 0; j < olen; j++) {
                ret[i + j] = this.contents[i + order[j]];
            }
        }

        return this.construct(ret);
    }

    /**
     * Return a new Sequence containing ct instances of v, followed by this
     * Sequence.
     *
     * @example
     * // returns intseq([ 1, 1, 1, 2, 3 ])
     * intseq([ 1, 2, 3 ]).pad(1, 2);
     */
    pad(v: SeqMemberArgument, ct = 1): this {
        if (!isNonnegInt(ct)) {
            throw new Error(`${this.constructor.name}.pad(): count must be a non-negative integer`);
        }

        if (ct === 0) {
            return this;
        }

        const ev = this.constructMember(v);

        return this.construct(fillarray(ct, ev), this.contents);
    }

    /**
     * Return a new Sequence padded to a length of ct by adding the value v
     * at the start until this length is reached. If the Sequence is already
     * ct or longer in length, no action is taken.
     *
     * @example
     * // returns intseq([ 1, 1, 1, 2, 3 ])
     * intseq([ 1, 2, 3 ]).padTo(1, 5);
     *
     * // returns intseq([ 1, 2, 3 ])
     * intseq([ 1, 2, 3 ]).padTo(1, 3);
     */
    padTo(v: SeqMemberArgument, ct: number): this {
        if (!isNonnegInt(ct)) {
            throw new Error(`${this.constructor.name}.padTo(): count must be a non-negative integer`);
        }

        const len = this.length;

        return len < ct ? this.pad(v, ct - len) : this;
    }

    /**
     * Return a new Sequence containing this Sequence, followed by ct
     * instances of v.
     *
     * @example
     * // returns intseq([ 1, 2, 3, 1, 1 ])
     * intseq([ 1, 2, 3 ]).pad(1, 2);
     */
    padRight(v: SeqMemberArgument, ct = 1): this {
        if (!isNonnegInt(ct)) {
            throw new Error(`${this.constructor.name}.padTo(): count must be a non-negative integer`);
        }

        if (ct === 0) {
            return this;
        }

        const ev = this.constructMember(v);

        return this.construct(this.contents, fillarray(ct, ev));
    }

    /**
     * Return a new Sequence padded to a length of ct by adding the value v
     * at the end until this length is reached. If the Sequence is already
     * ct or longer in length, no action is taken.
     *
     * @example
     * // returns intseq([ 1, 2, 3, 1, 1 ])
     * intseq([ 1, 2, 3 ]).padRightTo(1, 5);
     *
     * // returns intseq([ 1, 2, 3 ])
     * intseq([ 1, 2, 3 ]).padRightTo(1, 3);
     */
    padRightTo(v: SeqMemberArgument, ct: number): this {
        if (!isNonnegInt(ct)) {
            throw new Error(`${this.constructor.name}.padRightTo(): count must be a non-negative integer`);
        }

        const len = this.length;

        return len < ct ? this.padRight(v, ct - len) : this;
    }

    /*
     * TRANSFORMING EACH MEMBER OF A SEQUENCE
     */

    /**
     * General pitch mutator function.
     */
    protected mutatePitches(fn: PitchMutatorFn): this {
        return this.map(e => e.mapPitches(fn));
    }

    /**
     * Change all pitches in this Sequence to the pitch supplied.
     *
     * @example
     * // returns intseq([ 0, 0, 0 ])
     * intseq([ 1, 2, 3]).withPitch(0);
     */
    withPitch(pitch: PitchArgument): this {
        return this.map(e => e.setPitches(pitch));
    }

    /**
     * Change all pitches in this Sequence to the values supplied.
     * Argument must have the same length as this Sequence.
     * Return a Sequence with the required changes.
     *
     * @example
     * // returns intseq([ 4, 5, 6 ])
     * intseq([ 1, 2, 3]).withPitch([ 4, 5, 6 ]);
     */
    withPitches(pitches: PitchArgument[] | AnySeq): this {
        if (pitches instanceof Sequence) {
            return this.withPitches(pitches.toPitches());
        }

        if (Array.isArray(pitches)) {
            if (pitches.length !== this.length) {
                throw new Error(`${this.constructor.name}.withPitches(): argument length should be ${this.length}, was ${pitches.length}`);
            }

            return this.map((e, i) => e.setPitches(pitches[i]));
        }

        throw new Error(`${this.constructor.name}.withPitches(): invalid argument: ${dumpOneLine(pitches)}; should be (null | number)[] or Sequence`);
    }

    /**
     * Change pitches in specific locations to value supplied. Value can be a pitch definition,
     * or a method that takes in an array of pitches and their location in the Sequence, and 
     * returns a pitch definition.
     *
     * @example
     * // returns intseq([ 1, 2, 0 ])
     * intseq([ 1, 2, 3]).withPitchesAt([ -1 ], 0)
     */
    withPitchesAt(pos: SeqIndices, rep: PitchArgument | PitchMapperFn): this {
        let replacement: ReplacerFn<ET, ET>;

        if (typeof rep === 'function') {
            replacement = (e, i) => e.setPitches(rep(e.pitches(), i));
        } else {
            replacement = e => e.setPitches(rep);
        }

        return this.replaceIndices(pos, replacement);
    }

    /**
     * Return a Sequence where arrays of pitches have been mapped through a mapper function
     *
     * @example
     * // returns chordseq([ 2, 0, 3 ])
     * chordseq([ [ 1, 2 ], [], [ 3, 4, 5 ]).mapPitches(p => p.len())
     */
    mapPitches(fn: PitchMapperFn): this {
        if (typeof fn !== 'function') {
            throw new Error(`${this.constructor.name}.mapPitches(): requires a mapper function`);
        }

        return this.map((e, i) => e.setPitches(fn(e.pitches(), i)));
    }

    /**
     * Return a NoteSeq where individual non-chord pitches have been mapped through a mapper function
     *
     * @example
     * // returns numseq([ 4, 3, 5, 1, 0 ])
     * numseq([ 1, 2, null, 4, 5 ]).mapPitch(p => p === null ? 5 : 5 - p)
     */
    mapPitch(fn: MapperFn<number | null>): this {
        return this.map((e, i) => e.setPitches(fn(e.nullableNumericValue(), i)));
    }

    /**
     * Return a Sequence where individual pitches have been mapped through a mapper function
     *
     * @example
     * // returns chordseq([ [ 1, 4 ], [], [ 9, 16, 25 ] ])
     * chordseq([ [ 1, 2 ], [], [ 3, 4, 5 ]).mapPitches(p => p * p)
     */
    mapEachPitch(fn: (p: number, i: number) => number | null): this {
        return this.map((e, i) => e.setPitches(e.pitches().map(p => fn(p, i)).filter(v => v !== null) as number[]));
    }

    /**
     * Return a Sequence where all pitches have been filtered by the results of a filter function.
     *
     * @example
     * // returns chordseq([ [ 1 ], [], [ 3, 5 ] ])
     * chordseq([ [ 1, 2 ], [], [ 3, 4, 5 ]).filterPitches(p => p % 2 === 1)
     */
    filterPitches(fn: FilterFn<number>): this {
        return this.mapPitches((p, i) => p.filter(v => fn(v, i)));
    }

    /**
     * Return a Sequence where all chords have been trimmed to the top n values (if present).
     *
     * @example
     * // returns chordseq([ [ 1, 2 ], [], [ 4, 5 ] ])
     * chordseq([ [ 1, 2 ], [], [ 3, 4, 5 ]).keepTopPitches(2)
     */
    keepTopPitches(n: number): this {
        if (!isNonnegInt(n)) {
            throw new Error(`${this.constructor.name}.keepTopPitches(): invalid argument: ${n}; should be a non-negative integer`);
        }

        return this.map(e => {
            const p = e.pitches();

            return p.length > n ? e.setPitches(p.slice(p.length - n)) : e;
        });
    }

    /**
     * Return a Sequence where all chords have been trimmed to the bottom n values (if present).
     *
     * @example
     * // returns chordseq([ [ 1, 2 ], [], [ 3, 4 ] ])
     * chordseq([ [ 1, 2 ], [], [ 3, 4, 5 ]).keepBottomPitches(2)
     */
    keepBottomPitches(n: number): this {
        if (!isNonnegInt(n)) {
            throw new Error(`${this.constructor.name}.keepBottomPitches(): invalid argument: ${n}; should be a non-negative integer`);
        }

        return this.map(e => {
            const p = e.pitches();

            return p.length > n ? e.setPitches(p.slice(0, n)) : e;
        });
    }

    /**
     * Return a new Sequence transposed by the passed value.
     *
     * @example
     * // returns intseq([ 11, 12, 13, 14, 15 ])
     * intseq([ 1, 2, 3, 4, 5 ]).transpose(10)
     */
    transpose(i: number): this {
        return this.mutatePitches(mutators.transposeFn(i));
    }

    /**
     * Return a new Sequence transposed so the lowest value is the passed one.
     *
     * @example
     * // returns intseq([ 11, 12, 13, 14, 15 ])
     * intseq([ 1, 2, 3, 4, 5 ]).transposeToMin(11)
     */
    transposeToMin(i: number): this {
        if (!isNumber(i)) {
            throw new Error(`${this.constructor.name}.transposeToMin(): invalid argument: ${i}, should be numeric`);
        }

        const min = this.min();

        return min === null ? this : this.transpose(i - min);
    }

    /**
     * Return a new Sequence transposed so the highest value is the passed one.
     *
     * @example
     * // returns intseq([ 11, 12, 13, 14, 15 ])
     * intseq([ 1, 2, 3, 4, 5 ]).transposeToMax(15)
     */
    transposeToMax(i: number): this {
        if (!isNumber(i)) {
            throw new Error(`${this.constructor.name}.transposeToMax(): invalid argument: ${i}, should be numeric`);
        }

        const max = this.max();

        return max === null ? this : this.transpose(i - max);
    }

    /**
     * Return a new Sequence inverted around the passed value.
     *
     * @example
     * // returns intseq([ 9, 8, 7, 6, 5 ])
     * intseq([ 1, 2, 3, 4, 5 ]).invert(5)
     */
    invert(i: number): this {
        return this.mutatePitches(mutators.invertFn(i));
    }

    /**
     * Return a new Sequence augmented by the passed value.
     *
     * @example
     * // returns intseq([ 2, 4, 6, 8, 10 ])
     * intseq([ 1, 2, 3, 4, 5 ]).augment(2)
     */
    augment(i: number): this {
        return this.mutatePitches(mutators.augmentFn(i));
    }

    /**
     * Return a new Sequence diminished by the passed value.
     *
     * @example
     * // returns intseq([ 1, 2, 3, 4, 5 ])
     * intseq([ 2, 4, 6, 8, 10 ]).augment(2)
     */
    diminish(i: number): this {
        return this.mutatePitches(mutators.diminishFn(i));
    }

    /**
     * Return a new Sequence with a modulus operator applied.
     *
     * @example
     * // returns intseq([ 1, 2, 0, 1, 2 ])
     * intseq([ 1, 2, 3, 4, 5 ]).mod(3))
     */
    mod(i: number): this {
        return this.mutatePitches(mutators.modFn(i));
    }

    /**
     * Return a new Sequence with upper and lower pitch limits applied.
     *
     * @example
     * // returns intseq([ 2, 2, 3, 4, 4 ])
     * intseq([ 1, 2, 3, 4, 5 ]).trim(2, 4)
     */
    trim(min: number | null, max: number | null): this {
        return this.mutatePitches(mutators.trimFn(min, max));
    }

    /**
     * Return a new Sequence bounced between the min and max values passed.
     *
     * @example
     * // returns intseq([ 3, 2, 3, 4, 3 ])
     * intseq([ 1, 2, 3, 4, 5 ]).trim(2, 4)
     */
    bounce(min: number | null, max: number | null): this {
        return this.mutatePitches(mutators.bounceFn(min, max));
    }

    /**
     * Map this Sequence onto a scale. Scale can be a predefined string, or an
     * array of numbers. A pitch for zero values to map to must be supplied.
     * A new Sequence is returned.
     *
     * @example
     * // returns intseq([ 62, 64, 66, 67, 69 ])
     * intseq([ 1, 2, 3, 4, 5 ]).scale('lydian', 60)
     */
    scale(scale: string | number[], zero: number, octave = 12): this {
        return this.mutatePitches(mutators.scaleFn(scale, zero, octave));
    }

    /**
     * Map this Sequence onto a gamut. Gamut is an array of values; options
     * can be used to configure which gamut member is mapped to by zero in
     * the soure sequences.
     * By default, the gamut is wrapped an infinite number of times (so that,
     * for example, a pitch of 8 in a gamut of length 5 maps to gamut[3], but
     * options are available to replace this with static values.
     * A value of null represents a pitch being mapped to silence.
     *
     * A new Sequence is returned.
     *
     * @example
     * // returns intseq([ 0, 20, 5, 0, 20 ])
     * intseq([ 1, 2, 3, 4, 5 ]).gamut([ 5, 0, 20 ])
     */
    gamut(gamut: number[], opts: GamutOpts = {}): this {
        return this.mutatePitches(mutators.gamutFn(gamut, opts));
    }

    /**
     * Return a new Sequence containing the members of this Sequence which
     * pass a filter function in the positions they held before the filter
     * operations. Members of the sequence that do not pass the filter
     * function will be filled with the null value passed as the second
     * argument.
     *
     * @example
     * // returns intseq([ 1, 8, 3, 8, 5 ])
     * intseq([ 1, 2, 3, 4, 5 ]).filterInPosition(p => p.val() % 2 === 1, 8)
     */
    filterInPosition(fn: FilterFn<ET>, nullval: SeqMemberArgument = null): this {
        if (typeof fn !== 'function') {
            throw new Error(`${this.constructor.name}.filterInPosition(): requires a filter function`);
        }

        const nv = this.constructMember(nullval);

        return this.map((v, i) => fn(v, i) ? v : nv);
    }

    /**
     * Apply a mapper function to sliding windows within the Sequence, then
     * create a new Sequence from the results. Flattens array results one
     * level. Incomplete windows are discarded.
     *
     * @example
     * // returns intseq([ 3, 7 ])
     * intseq([ 1, 2, 3, 4, 5 ]).mapWindow(2, 2, p => p[0].transpose(p[1].val()))
     */
    mapWindow(size: number, step: number, fn: MapperFn<ET[]>): this {
        const [ windows ] = arrayToWindows(this.contents, size, step);

        return this.construct(windows.flatMap(fn));
    }

    /**
     * Apply a filter function to sliding windows within the Sequence, then
     * create a new Sequence from the results. Flattens array results one
     * level. Incomplete windows are discarded.
     *
     * @example
     * // returns intseq([ 3, 4 ])
     * intseq([ 1, 2, 3, 4, 5 ]).filterWindow(2, 2, p => p[0].val() !== 1)
     */
    filterWindow(size: number, step: number, fn: FilterFn<ET[]>): this {
        const [ windows ] = arrayToWindows(this.contents, size, step);

        return this.construct(...windows.filter(fn));
    }

    /**
     * Return a new Sequence containing the members of this Sequence sorted
     * using the passed function. If a second function is passed, this is
     * a filter function where any value not passing this function remains
     * in place during the sort.
     *
     * @example
     * // returns intseq([ 1, 2, 3, 4, 5 ])
     * intseq([ 2, 1, 4, 3, 5 ]).sort((a, b) => a.val() - b.val())
     */
    sort(fn: (a: ET, b: ET) => number, filter?: FilterFn<ET>): this {
        if (typeof fn !== 'function') {
            throw new Error(`${this.constructor.name}.sort(): requires a sort function`);
        }

        if (filter === undefined) {
            return this.construct(this.val().sort(fn));
        }

        if (typeof filter !== 'function') {
            throw new Error(`${this.constructor.name}.sort(): filter, if passed, must be a function`);
        }

        const len = this.length;
        const ret = this.val();
        const indices = [];
        const sortable = [];

        for (let i = 0; i < len; i++) {
            if (filter(ret[i], i)) {
                indices.push(i);
                sortable.push(ret[i]);
            }
        }

        sortable.sort(fn);

        for (let i = 0; i < indices.length; i++) {
            ret[indices[i]] = sortable[i];
        }

        return this.construct(ret);
    }

    /*
     * SPLITTING ONE SERIES INTO MANY
     */

    /**
     * Chop this Sequence into slices of length n. If the last slice is incomplete, discard it.
     *
     * @example
     * // returns [ intseq([ 1, 2 ]), intseq([ 3, 4 ]) ]
     * intseq([ 1, 2, 3, 4, 5 ]).chop(2)
     */
    chop(n: number): this[] {
        if (!isPosInt(n)) {
            throw new Error(`${this.constructor.name}.chop(): invalid argument ${n}, must be a positive int`);
        }

        const [ windows ] = arrayToWindows(this.contents, n, n);

        return windows.map(v => this.construct(v));
    }

    /**
     * Creates two new Sequences, the first containing all members of this
     * Sequence which pass the function supplied, the second containing all
     * members of this Sequence which do not pass the function supplied.
     * Unlike partition(), this function leaves values in the same position
     * as in the original Sequence, and unfilled positions are left as the
     * nullval supplied.
     *
     * @example
     * // returns [ intseq([ 1, 8, 3, 8, 5 ]), intseq([ 8, 2, 8, 4, 8 ]) ]
     * intseq([ 1, 2, 3, 4, 5 ]).partitionInPosition(m => m.val() % 2 === 1)
     */
    partitionInPosition(fn: FilterFn<ET>, nullval: SeqMemberArgument = null): [ this, this ] {
        if (typeof fn !== 'function') {
            throw new Error(`${this.constructor.name}.partitionInPosition(): requires a filter function`);
        }

        const r1 = fillarray(this.length, this.constructMember(nullval));
        const r2 = r1.slice();

        this.contents.forEach((v, i) => {
            if (fn(v, i)) {
                r1[i] = v;
            } else {
                r2[i] = v;
            }
        });

        return [ this.construct(r1), this.construct(r2) ];
    }

    /**
     * Creates new Sequences depending on the value returned by a function
     * supplied. Each new Sequence contains values from the original Sequence
     * for which the function returns the same value.
     * Unlike groupBy(), this function leaves values in the same position as
     * in the original Sequence, and unfilled positions are filled with the
     * nullval supplied.
     *
     * @example
     * // returns { 1: intseq([ 1, 8, 8, 4, 8 ]), 2: intseq([ 8, 2, 8, 8, 5 ]), 0: intseq([ 8, 8, 3, 8, 8 ]) }
     * intseq([ 1, 2, 3, 4, 5 ]).groupByInPosition(m => m.val() % 3)
     */
    groupByInPosition(fn: (e: ET, i?: number) => string, nullval: SeqMemberArgument = null): Record<string, this> {
        if (typeof fn !== 'function') {
            throw new Error(`${this.constructor.name}.groupByInPosition(): requires a grouper function`);
        }

        const vals: Record<string, ET[]> = {};
        const nv = this.constructMember(nullval);

        this.contents.forEach((v, i) => {
            const val = fn(v, i);

            if (!vals[val]) {
                vals[val] = fillarray(this.length, nv);
            }

            vals[val][i] = v;
        });

        const ret: Record<string, this> = {};

        Object.keys(vals).forEach(k => ret[k] = this.construct(vals[k]));

        return ret;
    }

    /**
     * Split this Sequence into n different Sequences, each taking every nth
     * member of this Sequence. Returns an array of n different Sequences,
     * the first starting from index 0, the second from index 1, up to index
     * (n - 1). Throws an exception if this Sequence's length is not a multiple
     * of n.
     *
     * @example
     * // returns [ intseq([ 1, 4 ]), intseq([ 2, 5 ]), intseq([ 3, 6 ]) ]
     * intseq([ 1, 2, 3, 4, 5, 6 ]).twine(3)
     */
    untwine(n: number): this[] {
        if (!isPosInt(n)) {
            throw new Error(`${this.constructor.name}.untwine(): invalid argument ${n}, must be a positive integer`);
        }

        if (this.length % n) {
            throw new Error(`${this.constructor.name}.untwine(): must untwine to equal lengths`);
        }

        const max = this.length / n;
        const ret = fillarray(n, 0).map(() => new Array(max));

        let ct = 0;

        for (let i = 0; i < max; i++) {
            for (let j = 0; j < n; j++) {
                ret[j][i] = this.contents[ct];
                ct++;
            }
        }

        return ret.map(v => this.construct(v));
    }

    /*
     * COMBINING MANY SERIES INTO ONE
     */

    /**
     * Takes an array of Sequences and turns them into one Sequence, one
     * value at a time, starting from the first member of the array. Throws
     * an exception unless all Sequences are of the same length.
     *
     * @example
     * // returns intseq([ 1, 4, 7, 2, 5, 8, 3, 6, 9 ])
     * intseq([ 1, 2, 3 ]).twine(intseq([ 4, 5, 6 ]), intseq([ 7, 8, 9 ]));
     */
    twine(...seq: this[]): this {
        return this.construct(...this.zipSequenceValues(...seq));
    }

    /**
     * Combines this Sequence with the passed Sequences by taking values from
     * each Sequence and applying the supplied combiner function.
     * Throws an exception if the Sequences are not the same length.
     *
     * @example
     * // returns intseq([ 7, 8, 5 ])
     * intseq([ 1, 2, 3 ]).combine((m1, m2) => m1.invert(m2.val()), intseq([ 4, 5, 4 ])
     */
    combine(fn: (...e: ET[]) => ET, ...seq: this[]): this {
        if (typeof fn !== 'function') {
            throw new Error(`${this.constructor.name}.combine(): requires a combiner function`);
        }

        return this.construct(this.zipSequenceValues(...seq).map(vals => fn(...vals)));
    }

    /**
     * Combines this Sequence with the passed Sequences by taking values from
     * each Sequence and applying the supplied combinator function, then
     * flattening the result one level.
     * Throws an exception if the Sequences are not the same length.
     *
     * @example
     * // returns intseq([ 1, 4, 1, 2, 5, 2, 3, 4, 3 ])
     * intseq([ 1, 2, 3 ]).flatCombine((m1, m2) => [ m1, m2, m3 ], intseq([ 4, 5, 4 ])
     */
    flatCombine(fn: (...e: ET[]) => ET[] | ET, ...seq: this[]): this {
        if (typeof fn !== 'function') {
            throw new Error(`${this.constructor.name}.flatCombine(): requires a combiner function`);
        }

        return this.construct(this.zipSequenceValues(...seq).flatMap(vals => fn(...vals)));
    }

    /**
     * Combines this Sequence with the passed Sequences by taking values from
     * each Sequence and taking the lowest pitch (if any) in each position.
     *
     * Any non-pitch information is taken from this Sequence.
     *
     * @example
     * // returns intseq([ 1, 0, 3, 0, 1 ])
     * intseq([ 1, 2, 3, 4, 5 ]).combineMin(intseq([ 5, 4, 3, 2, 1 ]), intseq([ 10, 0, 10, 0, 10 ])
     */
    combineMin(...seq: this[]): this {
        return this.combine((...vals) => {
            return vals[0].setPitches(min(vals.map(e => e.min())));
        }, ...seq);
    }

    /**
     * Combines this Sequence with the passed Sequences by taking values from
     * each Sequence and taking the highest pitch (if any) in each position.
     *
     * Any non-pitch information is taken from this Sequence.
     *
     * @example
     * // returns intseq([ 10, 4, 10, 4, 10 ])
     * intseq([ 1, 2, 3, 4, 5 ]).combineMax(intseq([ 5, 4, 3, 2, 1 ]), intseq([ 10, 0, 10, 0, 10 ])
     */
    combineMax(...seq: this[]): this {
        return this.combine((...vals) => {
            return vals[0].setPitches(max(vals.map(e => e.max())));
        }, ...seq);
    }

    /**
     * Combines this Sequence with the passed Sequence by taking values from
     * each Sequence and taking all pitches (if any) in each position.
     * Duplicate pitches are removed.
     *
     * Any non-pitch information is taken from this Sequence.
     *
     * @example
     * // returns chordseq([ [ 1, 2 ], [ 2, 3 ], [ 3, 4, 5 ], [ 5 ] ])
     * chordseq([ [ 1, 2 ], [], [ 3, 4 ], [ 5 ] ]).combineOr([ 1 ], [ 2, 3 ], [ 4, 5 ], [])
     */
    combineOr(...seq: this[]): this {
        return this.combine((...vals) => {
            return vals[0].setPitches(dedupe(vals.flatMap(e => e.pitches())));
        }, ...seq);
    }

    /**
     * Combines this Sequence with the passed Sequence by taking values from
     * each Sequence and taking only pitches that appear in each position in
     * all the Sequences
     *
     * Any non-pitch information is taken from this Sequence.
     *
     * @example
     * // returns chordseq([ [ 1 ], [], [ 4 ], [] ])
     * chordseq([ [ 1, 2 ], [], [ 3, 4 ], [ 5 ] ]).combineAnd([ 1 ], [ 2, 3 ], [ 4, 5 ], [])
     */
    combineAnd(...seq: this[]): this {
        return this.combine((...vals) => {
            const first = vals.shift() as ET; // vals.length >= 1 as first member is this Sequence
            const pitch = vals.map(e => e.pitches());

            return first.mapPitches(v => pitch.every(p => p.includes(v)) ? v : null);
        }, ...seq);
    }

    /*
     * TAKING MULTIPLE SERIES, RETURNING MULTIPLE SERIES
     */

    /**
     * Takes an array of Sequences and zips values from this sequence and
     * the passed sequences.
     */
    private zipSequenceValues(...seq: this[]): ET[][] {
        if (!this.isSameClassAndLengthAs(...seq)) {
            const err = [ this, ...seq ].map(s => `${s.constructor.name}[${s.length}]`);
            throw new Error(`${this.constructor.name}.zipSequenceValues(): must be Sequences of the same length and type, but were: ${err.join(',')}`);
        }
    
        const vals = [ this, ...seq ].map(s => s.contents);

        return zip(...vals);
    }

    /**
     * Zip this and other sequences of the same length into an array of new
     * Sequences.
     *
     * @example
     * //returns [ intseq([ 1, 5 ]), intseq([ 2, 4 ]), intseq([ 3, 3 ]) ]
     * intseq([ 1, 2, 3 ]).zipWith(intseq([ 5, 4, 3 ]))
     */
    zipWith(...seq: this[]): this[] {
        return this.zipSequenceValues(...seq).map(s => this.construct(s));
    }

    /**
     * Take multiple Sequences of the same length, and apply a mapper function
     * to the values in each, one index at a time.
     * Return the resulting Sequences.
     *
     * @example
     * // returns [ intseq([ 5, 8, 9 ]), intseq([ -3, 0, 3 ]) ]
     * intseq([ 1, 2, 3 ]).mapWith(m => [ m[0].augment(m[1].val()), m[1].invert(m[0].val()) ], intseq([ 5, 4, 3 ]))
     */
    mapWith(fn: (vals: ET[], i?: number) => ET[] | ET, ...seq: this[]): this[] {
        if (typeof fn !== 'function') {
            throw new Error(`${this.constructor.name}.mapWith(): requires a mapper function`);
        }

        const vals = this.zipSequenceValues(...seq);

        // Retain correct length when all sequences are of zero length
        if (!this.length) {
            return fillarray(seq.length + 1, this.empty());
        }

        const rets = vals.map((v, i) => sanitizeToArray(fn(v, i)));

        return zip(...rets).map(v => this.construct(v));
    }

    /**
     * Take multiple Sequences of the same length, and apply a filter function
     * to the values in each, one index at a time.
     * Return the resulting Sequences.
     *
     * @example
     * // returns [ intseq([ 1, 2 ]), intseq([ 5, 4 ]) ]
     * intseq([ 1, 2, 3 ]).filterWith(m => m[0].val() !== m[1].val(), intseq([ 5, 4, 3 ]))
     */
    filterWith(fn: (vals: ET[], i?: number) => boolean, ...seq: this[]): this[] {
        if (typeof fn !== 'function') {
            throw new Error(`${this.constructor.name}.filterWith(): requires a filter function`);
        }

        const vals = this.zipSequenceValues(...seq);
        const rets = vals.filter(fn);

        // Retain correct length when all values were filtered out
        if (!rets.length) {
            return fillarray(seq.length + 1, this.empty());
        }

        return zip(...rets).map(v => this.construct(v));
    }

    /**
     * Swap values between the this Sequence and the passed one, according to
     * the supplied function. Returns two new Sequences.
     * Throws an exception if the two Sequences are not the same length.
     *
     * @example
     * // returns [ intseq([ 5, 4, 3, 4, 5 ]), intseq([ 1, 2, 3, 2, 1 ]) ]
     * intseq([ 1, 2, 3, 4, 5 ]).exchangeValuesIf((m1, m2) => m1.val() < m2.val(), intseq([ 5, 4, 3, 2, 1 ])
     */
    exchangeValuesIf(fn: (s1: ET, s2: ET, i?: number) => boolean, seq: this): [ this, this ] {
        if (typeof fn !== 'function') {
            throw new Error(`${this.constructor.name}.exchangeValuesIf(): requires a comparator function`);
        }

        if (!this.isSameClassAndLengthAs(seq)) {
            throw new Error(`${this.constructor.name}.exchangeValuesIf(): both sequences must be the same length and type`);
        }

        const s1 = this.val();
        const s2 = seq.val();

        for (let i = 0; i < this.length; i++) {
            if (fn(s1[i], s2[i], i)) {
                [ s1[i], s2[i] ] = [ s2[i], s1[i] ];
            }
        }

        return [ this.construct(s1), seq.construct(s2) ];
    }

    /**
     * Convert this Sequence to a NumSeq.
     */
    toNumSeq(): NumSeq {
        return Registry.numseq_from_method(this.contents, this.metadata);
    }

    /**
     * Convert this Sequence to a NoteSeq.
     */
    toNoteSeq(): NoteSeq {
        return Registry.noteseq_from_method(this.contents, this.metadata);
    }

    /**
     * Convert this Sequence to a ChordSeq.
     */
    toChordSeq(): ChordSeq {
        return Registry.chordseq_from_method(this.contents, this.metadata);
    }

    /**
     * Convert this Sequence to a Melody.
     */
    toMelody(): Melody {
        return Registry.melody_from_method(this.contents, this.metadata);
    }
}
