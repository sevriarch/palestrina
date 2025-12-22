import type { SeqMemberArgument, PitchArgument, JSONValue, ISeqMember, ValidatorFn } from '../../types';

import SeqMember from './base';

import { isNumber } from '../../helpers/validation';
import { dumpOneLine } from '../../dump/dump';

/**
 * Return a numeric value or throw.
 */
function toNumericValueOrThrow(arg: PitchArgument): number {
    if (isNumber(arg)) {
        return arg as number;
    }

    if (Array.isArray(arg) && arg.length === 1 && isNumber(arg[0])) {
        return arg[0];
    }

    throw new Error(`pitch must contain a single number, was: ${dumpOneLine(arg)}`);
}

/**
 * Class representing a member of a {@link NumSeq}, whose value is a number.
 */
export default class NumSeqMember extends SeqMember<number> implements ISeqMember<number> {
    /**
     * Extract a single pitch from a null, number, array of numbers, object or SeqMember.
     */
    static toPitch(val: SeqMemberArgument): number {
        if (typeof val === 'object') {
            if (val instanceof SeqMember) {
                return val.numericValue();
            }

            if (val === null) {
                throw new Error('value must contain a single number, was: null');
            }

            if ('pitch' in val) {
                return NumSeqMember.toPitch(val.pitch);
            }
        }

        return toNumericValueOrThrow(val);
    }

    /**
     * Static method for creating a new NumSeqMember.
     */
    static from(val: SeqMemberArgument): NumSeqMember {
        if (val instanceof NumSeqMember) {
            return val;
        }

        return new NumSeqMember(val);
    }

    /**
     * Creates a new NumSeqMember
     */
    constructor(val: SeqMemberArgument) {
        super(NumSeqMember.toPitch(val));
    }

    val(): number {
        return this._val;
    }

    pitches(): number[] {
        return [ this._val ];
    }

    len(): number {
        return 1;
    }

    numericValue(): number {
        return this._val;
    }

    nullableNumericValue(): number {
        return this._val;
    }

    isSilent(): boolean {
        return false;
    }

    max(): number {
        return this._val;
    }

    min(): number {
        return this._val;
    }

    mean(): number {
        return this._val;
    }

    mapPitches(fn: (v: number) => number): this {
        return this.construct(fn(this._val));
    }

    setPitches(p: PitchArgument): this {
        return this.construct(toNumericValueOrThrow(p));
    }

    toJSON(): JSONValue {
        return this._val;
    }

    equals(e: SeqMember<unknown>): boolean {
        return e instanceof NumSeqMember && this._val === e._val;
    }

    validate(fn: ValidatorFn) {
        return fn(this._val);
    }

    describe(): string {
        return `${this.constructor.name}(${this._val})`;
    }
}
