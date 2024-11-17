import type { GamutOpts, SeqMemberArgument, PitchArgument, PitchMutatorFn, JSONValue, ISeqMember } from '../../types';

import * as mutators from '../../mutators/mutators';

/**
 * Base class for members of Sequences.
 *
 * Intended for inheritance, not for direct use.
 */
export default abstract class SeqMember<T> implements ISeqMember<T> {
    protected readonly _val: T;

    constructor(val: T) {
        this._val = val;

        Object.freeze(this);
    }

    /**
     * Return a new SeqMember of the same class as this one.
     */
    protected construct(arg: SeqMemberArgument): this {
        const Ctor = this.constructor as new (arg: SeqMemberArgument) => this;

        return new Ctor(arg);
    }

    /**
     * Return the value of this event.
     */
    abstract val(): T;

    /**
     * Return an array of pitches. The value returned may be immutable.
     */
    abstract pitches(): number[];

    /**
     * Return the number of pitches.
     */
    abstract len(): number;

    /**
     * Returning a single numeric value from this entity.
     * If there is no single numeric value in the entity, throw an error.
     */
    abstract numericValue(): number;

    /**
     * Function for returning a single nullable numeric value from this entity.
     * If there is more than one value, throw an error.
     */
    abstract nullableNumericValue(): null | number;

    /**
     * Is this entity silent?
     */
    abstract isSilent(): boolean;

    /**
     * Return the highest pitch.
     */
    abstract max(): number | null;

    /**
     * Return the lowest pitch.
     */
    abstract min(): number | null;

    /**
     * Return the mean pitch.
     */
    abstract mean(): number | null;

    /**
     * Compare this entity to another entity.
     */
    abstract equals(e: SeqMember<unknown>): boolean;

    /**
     * Return a new entity with modified pitches.
     */
    abstract mapPitches(fn: PitchMutatorFn): this;

    /**
     * Return a JSON representation of this entity.
     */
    abstract toJSON(): JSONValue;

    /**
     * Return a string description of this entity.
     */
    abstract describe(): string;

    /**
     * Determine if this entity validates successfully against a validation function.
    */
    abstract validate(fn: (e: number) => boolean): boolean;

    /**
     * Return a new entity with the set pitches.
     */
    setPitches(p: PitchArgument): this {
        return this.construct(p);
    }

    /**
     * Return a new entity, but with no pitches played.
     */
    silence(): this {
        return this.setPitches([]);
    }

    /**
     * Return a new entity, with pitches inverted.
     */
    invert(i: number): this {
        return this.mapPitches(mutators.invertFn(i));
    }

    /**
     * Return a new entity, with pitches transposed.
     */
    transpose(i: number): this {
        return this.mapPitches(mutators.transposeFn(i));
    }

    /**
     * Return a new entity, with pitches augmented.
     */
    augment(i: number): this {
        return this.mapPitches(mutators.augmentFn(i));
    }

    /**
     * Return a new entity, with pitches diminished.
     */
    diminish(i: number): this {
        return this.mapPitches(mutators.diminishFn(i));
    }

    /**
     * Return a new entity, with a modulus operator applied to pitches.
     */
    mod(i: number): this {
        return this.mapPitches(mutators.modFn(i));
    }

    /**
     * Return a new entity, with lower and upper limits applied to pitches.
     */
    trim(min?: null | number, max?: null | number): this {
        return this.mapPitches(mutators.trimFn(min, max));
    }

    /**
     * Return a new entity, with pitches bounced between lower and upper limits.
     */
    bounce(min?: null | number, max?: null | number): this {
        return this.mapPitches(mutators.bounceFn(min, max));
    }

    /**
     * Return a new entity, with the passed scale applied to pitches.
     */
    scale(scale: string | number[], zero: number, octave = 12): this {
        return this.mapPitches(mutators.scaleFn(scale, zero, octave));
    }

    /**
     * Return a new entity, with the passed gamut applied to pitches.
     */
    gamut(gamut: number[], opts: GamutOpts = {}): this {
        return this.mapPitches(mutators.gamutFn(gamut, opts));
    }
}
