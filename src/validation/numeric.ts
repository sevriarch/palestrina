import type { ISeqMember, ValidatorFn } from '../types';

import { validateArray, isNumber } from '../helpers/validation';
import { dumpOneLine } from '../dump/dump';

const DEFAULT_CLOSENESS = 5e-6;

function mustBeInteger(closeness: number): ValidatorFn {
    closeness = getCloseness(closeness);

    return (val: number): boolean => {
        if (!isNumber(val)) {
            return false;
        }

        return Math.abs(val - Math.round(val)) <= closeness;
    };
}

function mustBeFraction(closeness: number, fraction: number): ValidatorFn {
    closeness = getCloseness(closeness);

    const trueRounding = closeness * fraction;

    return (val: number): boolean => {
        if (!isNumber(val)) {
            return false;
        }

        const num = val * fraction;
        const rounded = Math.round(num);

        return Math.abs(num - rounded) <= trueRounding;
    };
}

function getCloseness(n?: number) {
    if (n === undefined) {
        return DEFAULT_CLOSENESS;
    }

    if (typeof n !== 'number' || !isFinite(n) || n < 0) {
        throw new Error(`closeness must be a non-negative number; was ${dumpOneLine(n)}`);
    }

    return n;
}

/**
 * A Class providing validation for numeric Sequence values.
 */
export default class NumericValidator {
    readonly noop: boolean;
    readonly fn: ValidatorFn;

    private readonly type: string;

    /**
     * A validator that validates numbers are within 5e-6 of the closest integer.
     */
    static INT_VALIDATOR = new NumericValidator('int');

    /**
     * A validator that does not validate anything.
     */
    static NOOP_VALIDATOR = new NumericValidator('noop');

    /**
     * A validator that validates numbers are within 5e-6% of the supplied subdivision of a semitone.
     * 
     * @example
     * // returns a validator that validates numbers are close to 0, 0.25, 0.5, 0.75, 1, 1.25, etc...
     * NumericValidator.FRACTION_VALIDATOR(4)
     */
    static FRACTION_VALIDATOR(fraction: number, closeness?: number): NumericValidator {
        return new NumericValidator('fraction', fraction, closeness);
    }

    /**
     * A validator that validates numbers pass the supplied validation function.
     * 
     * @example
     * // returns a validator that validates numbers are even integers
     * NumericValidator.CUSTOM_VALIDATOR(v => v % 2 === 0)
     */
    static CUSTOM_VALIDATOR(fn: ValidatorFn): NumericValidator {
        if (typeof fn !== 'function') {
            throw new Error(`NumericValidator.CUSTOM_VALIDATOR(): fn must be a function; was ${dumpOneLine(fn)}`);
        }

        return new NumericValidator(fn);
    }

    constructor(type: string | ValidatorFn, arg2?: number, arg3?: number) {
        if (typeof type === 'function') {
            this.fn = type;
            this.type = 'custom';
            this.noop = false;
        } else if (typeof type === 'string') {
            let close;

            switch (type) {
            case 'int':
                close = getCloseness(arg2);

                this.noop = false;
                this.type = `int(${close})`;
                this.fn = mustBeInteger(getCloseness(close));
                break;
            case 'noop':
                this.noop = true;
                this.type = 'noop';
                this.fn = () => true;
                break;
            case 'fraction':
                if (typeof arg2 !== 'number' || !isFinite(arg2) || arg2 <= 0) {
                    throw new Error(`fraction must be a number greater than zero; was ${dumpOneLine(arg2)}`);
                }

                close = getCloseness(arg3);

                this.fn = mustBeFraction(close, arg2);
                this.type = `fraction(${arg2},${close})`;
                this.noop = false;
                break;
            default:
                throw new Error(`invalid validator type: "${dumpOneLine(type)}"`);
            }
        } else {
            throw new Error(`invalid validator type: ${dumpOneLine(type)}`);
        }

        Object.freeze(this);
    }

    validateContents(contents: ISeqMember<unknown>[]): void {
        if (this.noop) { return; }

        const failed = validateArray(contents, m => m.validate(this.fn));

        if (failed.length) {
            const details = failed.map(m => `${m[0]} ${dumpOneLine(m[1].pitches())}`);

            throw new Error(`NumericValidator.validateContents(): contents indices ${details.join(', ')} failed validation`);
        }
    }

    validate(val: number): boolean {
        return this.fn(val);
    }

    describe() {
        return `NumericValidator({type="${this.type}"})`;
    }
}