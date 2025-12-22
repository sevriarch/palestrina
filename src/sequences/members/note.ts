import type { SeqMemberArgument, PitchArgument, JSONValue, ISeqMember, ValidatorFn } from '../../types';

import SeqMember from './base';

import { isNumber } from '../../helpers/validation';
import { dumpOneLine } from '../../dump/dump';

/**
 * Return a numeric value or throw.
 */
export function nullableNumericValueOrThrow(arg: PitchArgument): number | null {
    if (isNumber(arg)) {
        return arg as number;
    }

    if (arg === null) {
        return null;
    }

    if (Array.isArray(arg)) {
        switch (arg.length) {
        case 0: return null;
        case 1:
            if (isNumber(arg[0])) {
                return arg[0];
            }
        }
    }

    throw new Error(`pitch must contain a single number or null, was ${dumpOneLine(arg)}`);
}

/**
 * Class representing a member of a {@link NoteSeq}, whose value is a number or the absence of one.
 */
export default class NoteSeqMember extends SeqMember<number | null> implements ISeqMember<number | null> {
    /**
     * Extract a single pitch from a null, number, array of numbers, object or SeqMember.
     */
    static toPitch(val: SeqMemberArgument): null | number {
        if (typeof val === 'object') {
            if (val === null) {
                return val;
            }

            if (val instanceof SeqMember) {
                return val.nullableNumericValue();
            }

            if ('pitch' in val) {
                return NoteSeqMember.toPitch(val.pitch);
            }
        }

        return nullableNumericValueOrThrow(val);
    }

    /**
     * Static method for creating a new NoteSeqMember.
     */
    static from(val: SeqMemberArgument): NoteSeqMember {
        if (val instanceof NoteSeqMember) {
            return val;
        }

        return new NoteSeqMember(val);
    }

    /**
     * Creates a new NoteSeqMember
     */
    constructor(val: SeqMemberArgument) {
        super(NoteSeqMember.toPitch(val));
    }

    val(): number | null {
        return this._val;
    }

    pitches(): number[] {
        return this._val === null ? [] : [ this._val ];
    }

    len(): number {
        return this._val === null ? 0 : 1;
    }

    numericValue(): number {
        if (this._val === null) {
            throw new Error('NoteSeqMember.numericValue(): value was null');
        }

        return this._val;
    }

    nullableNumericValue(): number | null {
        return this._val;
    }

    isSilent(): boolean {
        return this._val === null;
    }

    max(): number | null {
        return this._val;
    }

    min(): number | null {
        return this._val;
    }

    mean(): number | null {
        return this._val;
    }

    mapPitches(fn: (v: number) => number | null): this {
        if (this._val === null) {
            return this;
        }

        return this.construct(fn(this._val));
    }

    setPitches(p: PitchArgument): this {
        return this.construct(nullableNumericValueOrThrow(p));
    }

    toJSON(): JSONValue {
        return this._val;
    }

    equals(e: SeqMember<unknown>): boolean {
        return e instanceof NoteSeqMember && this._val === e._val;
    }

    validate(fn: ValidatorFn): boolean {
        return this._val === null || fn(this._val);
    }

    describe(): string {
        return `${this.constructor.name}(${this._val})`;
    }
}
