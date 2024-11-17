import type { SeqMemberArgument, PitchArgument, JSONValue, ISeqMember, ValidatorFn } from '../../types';

import SeqMember from './generic';

import { isNumber } from '../../helpers/validation';
import { sum } from '../../helpers/calculations';
import { dumpOneLine } from '../../dump/dump';

/**
 * Class representing a member of a {@link ChordSeq}, whose value is an array of zero or more numbers.
 */
export default class ChordSeqMember extends SeqMember<number[]> implements ISeqMember<number[]> {
    /**
     * Extract an array of pitches from a null, number, array of numbers, object or SeqMember.
     */
    static toPitch(val: SeqMemberArgument): number[] {
        if (typeof val === 'object') {
            if (Array.isArray(val)) {
                if (!val.every(isNumber)) {
                    throw new Error(`ChordSeqMember.toPitch(): value must not contain non-numeric values; was ${dumpOneLine(val)}`);
                }

                return val.slice().sort((a, b) => a - b);
            }

            if (val === null) {
                return [];
            }

            if (val instanceof SeqMember) {
                return val.pitches();
            }

            if ('pitch' in val) {
                return ChordSeqMember.toPitch(val.pitch);
            }
        }

        if (isNumber(val)) {
            return [ val as number ];
        }

        throw new Error(`ChordSeqMember.toPitch(): value must contain zero or more pitches or a null; was ${dumpOneLine(val)}`);
    }

    /**
     * Static method for creating a new ChordSeqMember.
     */
    static from(val: SeqMemberArgument): ChordSeqMember {
        if (val instanceof ChordSeqMember) {
            return val;
        }

        return new ChordSeqMember(val);
    }

    constructor(val: SeqMemberArgument) {
        super(ChordSeqMember.toPitch(val));

        Object.freeze(this._val);
    }

    val(): number[] {
        return this._val.slice();
    }

    pitches(): number[] {
        return this._val;
    }
    
    len(): number {
        return this._val.length;
    }

    numericValue(): number {
        if (this._val.length !== 1) {
            throw new Error(`ChordSeqMember.numericValue(): cannot extract single numeric value from ${dumpOneLine(this._val)}`);
        }

        return this._val[0];
    }

    nullableNumericValue(): number | null {
        switch (this._val.length) {
        case 0: return null;
        case 1: return this._val[0];
        default: throw new Error(`ChordSeqMember.nullableNumericValue(): cannot extract nullable numeric value from ${dumpOneLine(this._val)}`);
        }
    }

    isSilent(): boolean {
        return !this._val.length;
    }

    max(): number | null {
        if (this._val.length) {
            return this._val[this._val.length - 1];
        }

        return null;
    }

    min(): number | null {
        if (this._val.length) {
            return this._val[0];
        }

        return null;
    }

    mean(): number | null {
        if (this._val.length) {
            return sum(this._val) / this._val.length;
        }

        return null;
    }

    mapPitches(fn: (v: number) => PitchArgument): this {
        if (this._val.length === 0) {
            return this;
        }

        // In most cases, this is more performant than using .flatMap() and filtering for nulls
        const ret = [];
        for (const pitch of this._val) {
            const next = fn(pitch);

            if (Array.isArray(next)) {
                ret.push(...next);
            } else if (next !== null) {
                ret.push(next);
            }
        }

        return this.setPitches(ret);
    }

    toJSON(): JSONValue {
        return this.pitches();
    }

    equals(e: SeqMember<unknown>): boolean {
        if (!(e instanceof ChordSeqMember)) { return false; }

        const len = this.len();
        const evals = e.pitches();

        if (len !== evals.length) { return false; }

        for (let i = 0; i < len; i++) {
            if (this._val[i] !== evals[i]) { return false; }
        }

        return true;
    }

    validate(fn: ValidatorFn): boolean {
        for (const v of this._val) {
            if (!fn(v)) {
                return false;
            }
        }

        return true;
    }

    describe(): string {
        return `${this.constructor.name}(${dumpOneLine(this._val)})`;
    }
}
