import type { SeqMemberArgument, JSONValue, ISeqMember, ValidatorFn } from '../../types';

import SeqMember from './generic';

import { isNumber } from '../../helpers/validation';
import { dumpOneLine } from '../../dump/dump';

/**
 * Class representing a member of a {@link NoteSeq}, whose value is a number or the absence of one.
 */
export default class NoteSeqMember extends SeqMember<number | null> implements ISeqMember<number | null> {
    /**
     * Extract a single pitch from a null, number, array of numbers, object or SeqMember.
     */
    static toPitch(val: SeqMemberArgument): null | number {
        if (isNumber(val)) {
            return val as number;
        }

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

            if (Array.isArray(val)) {
                switch (val.length) {
                case 0:
                    return null;
                case 1:
                    if (isNumber(val[0])) {
                        return val[0];
                    }
                    break;
                }
            }
        }

        throw new Error(`NoteSeqMember.toPitch(): value must contain a single pitch or a null; was ${dumpOneLine(val)}`);
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

        return this.construct(NoteSeqMember.toPitch(fn(this._val)));
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
