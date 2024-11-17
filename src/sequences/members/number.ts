import type { SeqMemberArgument, JSONValue, ISeqMember, ValidatorFn } from '../../types';

import SeqMember from './generic';

import { isNumber } from '../../helpers/validation';
import { dumpOneLine } from '../../dump/dump';

/**
 * Class representing a member of a {@link NumSeq}, whose value is a number.
 */
export default class NumSeqMember extends SeqMember<number> implements ISeqMember<number> {
    /**
     * Extract a single pitch from a null, number, array of numbers, object or SeqMember.
     */
    static toPitch(val: SeqMemberArgument): number {
        if (isNumber(val)) {
            return val as number;
        }

        if (typeof val === 'object') {
            if (val instanceof SeqMember) {
                return val.numericValue();
            }

            if (val === null) {
                throw new Error('NumSeqMember.toPitch(): value was null but must contain a pitch');
            }

            if ('pitch' in val) {
                return NumSeqMember.toPitch(val.pitch);
            }

            if (Array.isArray(val) && val.length === 1 && isNumber(val[0])) {
                return val[0];
            }
        }

        throw new Error(`NumSeqMember.toPitch(): value must contain a single pitch; was ${dumpOneLine(val)}`);
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
