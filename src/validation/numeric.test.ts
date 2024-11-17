import type { ValidatorFn, ISeqMember } from '../types';

import NumericValidator from './numeric';

import { floatseq, microtonalchordseq } from '../factory';

class MockMember {
    val: number;

    constructor(v: number) {
        this.val = v;
    }

    pitches(): number[] {
        return [ this.val ];
    }

    validate(fn: ValidatorFn): boolean {
        return fn(this.val);
    }
}

const MOCK_MEMBER_VALID = new MockMember(1) as unknown as ISeqMember<unknown>;
const MOCK_MEMBER_INVALID = new MockMember('1' as unknown as number) as unknown as ISeqMember<unknown>;
const MOCK_VALID = [ MOCK_MEMBER_VALID ];
const MOCK_INVALID = [ MOCK_MEMBER_VALID, MOCK_MEMBER_INVALID, MOCK_MEMBER_VALID ];

describe('NumericValidator configuration failure tests', () => {
    test('fails on invalid config', () => {
        expect(() => new NumericValidator('int', Infinity)).toThrow();
        expect(() => new NumericValidator('int', '5' as unknown as number)).toThrow();
        expect(() => new NumericValidator('carp')).toThrow();
        expect(() => new NumericValidator(1 as unknown as string)).toThrow();
    });
});

describe('Validator.INT_VALIDATOR', () => {
    test('validates as expected', () => {
        const val = NumericValidator.INT_VALIDATOR;

        expect(val.validate(-0)).toEqual(true);
        expect(val.validate(60)).toEqual(true);
        expect(val.validate(60.000001)).toEqual(true);
        expect(val.validate(59.999999)).toEqual(true);
        expect(val.validate(60.01)).toEqual(false);
        expect(val.validate(59.99)).toEqual(false);
        expect(val.validate('60' as unknown as number)).toEqual(false);

        expect(() => val.validateContents(floatseq([ 1, 60.000001, 59.999999 ]).contents)).not.toThrow();
        expect(() => val.validateContents(floatseq([ 1, 60.000001, 59.99 ]).contents)).toThrow('indices 2 [59.99] failed');
        expect(() => val.validateContents(microtonalchordseq([ [ 1, 60 ], [], 60.01, 59.999999, [ 59.99, 59.99 ] ]).contents)).toThrow('indices 2 [60.01], 4 [59.99,59.99] failed');

        expect(() => val.validateContents(MOCK_VALID)).not.toThrow();
        expect(() => val.validateContents(MOCK_INVALID)).toThrow('indices 1 ["1"] failed');
    });
});

describe('Validator.NOOP_VALIDATOR', () => {
    test('validates as expected', () => {
        const val = NumericValidator.NOOP_VALIDATOR;

        expect(Object.isFrozen(val)).toBeTruthy();
        expect(val.validate(-0)).toEqual(true);
        expect(val.validate(60)).toEqual(true);
        expect(val.validate(60.01)).toEqual(true);
        expect(val.validate(59.99)).toEqual(true);
        expect(val.validate('60' as unknown as number)).toEqual(true);

        expect(() => val.validateContents(floatseq([ 1, 60.000001, 59.999999 ]).contents)).not.toThrow();
        expect(() => val.validateContents(floatseq([ 1, 60.000001, 59.99 ]).contents)).not.toThrow();
        expect(() => val.validateContents(microtonalchordseq([ [ 1, 60 ], [], 60.01, 59.999999, [ 59.99, 59.99 ] ]).contents)).not.toThrow();

        expect(() => val.validateContents(MOCK_VALID)).not.toThrow();
        expect(() => val.validateContents(MOCK_INVALID)).not.toThrow();
    });
});

describe('Validator.FRACTION_VALIDATOR()', () => {
    test('invalid validator creation fails', () => {
        expect(() => NumericValidator.FRACTION_VALIDATOR('4' as unknown as number)).toThrow();
        expect(() => NumericValidator.FRACTION_VALIDATOR(0)).toThrow();
    });

    test('validates as expected (eighth-tones)', () => {
        const val = NumericValidator.FRACTION_VALIDATOR(4);

        expect(Object.isFrozen(val)).toBeTruthy();
        expect(val.validate(60)).toEqual(true);
        expect(val.validate(59.75)).toEqual(true);
        expect(val.validate(60.25)).toEqual(true);
        expect(val.validate(59.74999999)).toEqual(true);
        expect(val.validate(60.25000001)).toEqual(true);
        expect(val.validate(59.749)).toEqual(false);
        expect(val.validate(60.251)).toEqual(false);
        expect(val.validate('60' as unknown as number)).toEqual(false);

        expect(() => val.validateContents(floatseq([ 1, 60.25000001, 59.74999999 ]).contents)).not.toThrow();
        expect(() => val.validateContents(floatseq([ 1, 60.251, 59.74999999 ]).contents)).toThrow('indices 1 [60.251] failed');
        expect(() => val.validateContents(microtonalchordseq([ [ 1, 60 ], [], 60.25000001, 59.749, [ 60.251, 60.251 ] ]).contents))
            .toThrow('indices 3 [59.749], 4 [60.251,60.251] failed');

        expect(() => val.validateContents(MOCK_VALID)).not.toThrow();
        expect(() => val.validateContents(MOCK_INVALID)).toThrow('indices 1 ["1"] failed');
    });

    test('validates as expected (within 0.001 of eighth-tones)', () => {
        const val = NumericValidator.FRACTION_VALIDATOR(4, 0.001);

        expect(Object.isFrozen(val)).toBeTruthy();
        expect(val.validate(60)).toEqual(true);
        expect(val.validate(59.75)).toEqual(true);
        expect(val.validate(60.25)).toEqual(true);
        expect(val.validate(60.251)).toEqual(true);
        expect(val.validate(59.749)).toEqual(true);
        expect(val.validate(59.7489)).toEqual(false);
        expect(val.validate(60.2511)).toEqual(false);
        expect(val.validate('60' as unknown as number)).toEqual(false);

        expect(() => val.validateContents(floatseq([ 1, 59.749, 60.251 ]).contents)).not.toThrow();
        expect(() => val.validateContents(floatseq([ 1, 59.7489, 60.25 ]).contents)).toThrow('indices 1 [59.7489] failed');
        expect(() => val.validateContents(microtonalchordseq([ [ 1, 60 ], [], 59.749, 60.2511, [ 59.7489, 59.7489 ] ]).contents))
            .toThrow('indices 3 [60.2511], 4 [59.7489,59.7489] failed');

        expect(() => val.validateContents(MOCK_VALID)).not.toThrow();
        expect(() => val.validateContents(MOCK_INVALID)).toThrow('indices 1 ["1"] failed');
    });
});

describe('Validator.CUSTOM_VALIDATOR()', () => {
    test('invalid validator creation fails', () => {
        expect(() => NumericValidator.CUSTOM_VALIDATOR('4' as unknown as (val: number) => boolean)).toThrow();
    });

    test('validates as expected (eighth-tones)', () => {
        const val = NumericValidator.CUSTOM_VALIDATOR((val: number) => {
            return val % 1 < 0.2;
        });

        expect(Object.isFrozen(val)).toBeTruthy();
        expect(val.validate(59.99)).toEqual(false);
        expect(val.validate(60)).toEqual(true);
        expect(val.validate(60.19)).toEqual(true);
        expect(val.validate(60.2)).toEqual(false);
        expect(val.validate('60' as unknown as number)).toEqual(true); // because this custom validator does not test type

        expect(() => val.validateContents(floatseq([ 1, 59.19, 60.19 ]).contents)).not.toThrow();
        expect(() => val.validateContents(floatseq([ 1, 59.2, 60.19 ]).contents)).toThrow('indices 1 [59.2] failed');
        expect(() => val.validateContents(microtonalchordseq([ [ 1, 60 ], [], 59.19, 59.2, [ 60.2, 60.2 ] ]).contents))
            .toThrow('indices 3 [59.2], 4 [60.2,60.2] failed');

        expect(() => val.validateContents(MOCK_VALID)).not.toThrow();
        expect(() => val.validateContents(MOCK_INVALID)).not.toThrow(); // because this custom validator does not test type
    });
});

describe('Validator.describe()', () => {
    test('int validator', () => {
        expect(NumericValidator.INT_VALIDATOR.describe()).toStrictEqual('NumericValidator({type="int(0.000005)"})');
    });

    test('noop validator', () => {
        expect(NumericValidator.NOOP_VALIDATOR.describe()).toStrictEqual('NumericValidator({type="noop"})');
    });

    test('fraction validator', () => {
        expect(NumericValidator.FRACTION_VALIDATOR(8).describe()).toStrictEqual('NumericValidator({type="fraction(8,0.000005)"})');
    });

    test('custom validator', () => {
        expect(NumericValidator.CUSTOM_VALIDATOR((val: number) => val % 1 < 0.2).describe()).toStrictEqual('NumericValidator({type="custom"})');
    });
});