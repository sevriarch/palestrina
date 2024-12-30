import type { MetaEventValue, MetaEventOpts, MetaEventArg, MelodyMemberArg, MelodyMemberData, SeqMemberArgument, PitchArgument, JSONValue, ISeqMember, ValidatorFn } from '../../types';

import MetaList from '../../meta-events/meta-list';
import Timing from '../../timing/timing';
import SeqMember from './generic';
import ChordSeqMember from './chord';

import { DEFAULTS } from '../../constants';
import { isInt, isNonnegInt, isNonNegNumber, isPosNumber, invalidKeys } from '../../helpers/validation';
import { dumpOneLine } from '../../dump/dump';

const DEFAULT_TIMING = new Timing(undefined, undefined, undefined, DEFAULTS.NOTE_DURATION);
const INVALID_KEYS = new Set([ 'pitch', 'duration', 'velocity', 'delay', 'offset', 'at', 'before', 'after' ]);

function pitchToMelodyMemberData(pitch: PitchArgument | ChordSeqMember): MelodyMemberData {
    return {
        pitch: ChordSeqMember.from(pitch),
        velocity: DEFAULTS.NOTE_VELOCITY,
        timing: DEFAULT_TIMING,
        before: MetaList.EMPTY_META_LIST,
        after: MetaList.EMPTY_META_LIST,
    };
}

function isVelocityValid(i: unknown): boolean {
    return isNonnegInt(i);
}

function inputToMelodyMemberData(ob: MelodyMemberArg): MelodyMemberData {
    const badkeys = invalidKeys(ob, INVALID_KEYS);

    if (badkeys.length) {
        throw new Error(`invalid keys in ${dumpOneLine(ob)}: ${dumpOneLine(badkeys)}`);
    }

    const failed: string[] = [];

    let velocity;
    if ('velocity' in ob) {
        if (!isVelocityValid(ob.velocity)) {
            failed.push('velocity');
        }
        velocity = ob.velocity as number;
    } else {
        velocity = DEFAULTS.NOTE_VELOCITY;
    }

    let duration;
    if ('duration' in ob) {
        if (!Timing.isDurationValid(ob.duration)) {
            failed.push('duration');
        }
        duration = ob.duration;
    } else {
        duration = DEFAULTS.NOTE_DURATION;
    }

    let delay;
    if ('delay' in ob) {
        if (!Timing.isDelayValid(ob.delay)) {
            failed.push('delay');
        }
        delay = ob.delay;
    }

    let offset;
    if ('offset' in ob) {
        if (!Timing.isOffsetValid(ob.offset)) {
            failed.push('offset');
        }
        offset = ob.offset;
    }

    if (ob.at !== undefined && !Timing.isExactTickValid(ob.at)) {
        failed.push('at');
    }

    if (failed.length) {
        throw new Error(`invalid data ${dumpOneLine(ob)}: fields ${dumpOneLine(failed)} failed validation`);
    }

    return {
        pitch: ChordSeqMember.from(ob.pitch),
        before: MetaList.from(ob.before),
        after: MetaList.from(ob.after),
        velocity,
        timing: new Timing(ob.at, offset, delay, duration),
    };
}

function toMelodyMemberData(val: SeqMemberArgument): MelodyMemberData {
    if (typeof val === 'object' && val !== null) {
        if (val instanceof SeqMember) {
            if (!(val instanceof ChordSeqMember)) {
                val = val.pitches();
            }
        } else if ('pitch' in val) {
            return inputToMelodyMemberData(val);
        }
    }

    return pitchToMelodyMemberData(val);
}

/**
 * Class representing a member of a {@link Melody}, whose value represents a single note, chord or silence.
 */
export default class MelodyMember extends SeqMember<MelodyMemberData> implements ISeqMember<MelodyMemberData> {
    get pitch(): ChordSeqMember { return this._val.pitch; }
    get duration(): number { return this._val.timing.duration || 0; }
    get velocity(): number { return this._val.velocity; }
    get delay(): number { return this._val.timing.delay ?? 0; }
    get offset(): number { return this._val.timing.offset ?? 0; }
    get at(): number | undefined { return this._val.timing.exact; }
    get before(): MetaList { return this._val.before; }
    get after(): MetaList { return this._val.after; }
    get timing(): Timing { return this._val.timing; }

    /**
     * Static method for creating a new MelodyMember.
     */
    static from(val: SeqMemberArgument): MelodyMember {
        if (val instanceof MelodyMember) {
            return val;
        }

        return new MelodyMember(toMelodyMemberData(val));
    }

    constructor(ob: MelodyMemberData) {
        super(ob);

        Object.freeze(this._val);
    }

    val(): MelodyMemberData {
        return this._val;
    }

    pitches(): number[] {
        return this._val.pitch.pitches();
    }

    len(): number {
        return this._val.pitch.len();
    }

    numericValue(): number {
        return this._val.pitch.numericValue();
    }

    nullableNumericValue(): number | null {
        return this._val.pitch.nullableNumericValue();
    }

    isSilent(): boolean {
        return this._val.pitch.isSilent();
    }

    max(): number | null {
        return this._val.pitch.max();
    }

    min(): number | null {
        return this._val.pitch.min();
    }

    mean(): number | null {
        return this._val.pitch.mean();
    }

    override setPitches(p: PitchArgument): this {
        return this.construct({ ...this._val, pitch: ChordSeqMember.from(p) });
    }

    toJSON(): JSONValue {
        return JSON.parse(JSON.stringify(this._val));
    }

    mapPitches(fn: (p: number) => PitchArgument): this {
        if (this.pitch.len() === 0) {
            return this;
        }

        const v = this._val;

        // This is a commonly used function, so we optimise at the expense of clarity
        return this.construct({
            pitch: v.pitch.mapPitches(fn),
            velocity: v.velocity,
            timing: v.timing,
            before: v.before,
            after: v.after
        });
    }

    equals(e: SeqMember<unknown>): boolean {
        return e instanceof MelodyMember
            && this._val.velocity === e._val.velocity
            && this._val.pitch.equals(e._val.pitch)
            && this._val.timing.equals(e._val.timing)
            && this._val.before.equals(e._val.before)
            && this._val.after.equals(e._val.after);
    }

    protected withTiming(t: Timing): this {
        const v = this._val;

        return this.construct({
            pitch: v.pitch,
            velocity: v.velocity,
            timing: t,
            before: v.before,
            after: v.after
        });
    }

    /**
     * Returns a new MelodyMember copying this but with a changed duration.
     */
    withDuration(i: number): this {
        return this.withTiming(this._val.timing.withDuration(i));
    }

    /**
     * Returns a new MelodyMember copying this but with a changed velocity.
     */
    withVolume(i: number): this {
        if (!isVelocityValid(i)) {
            throw new Error(`invalid velocity: ${i}`);
        }

        return this.construct({ ...this._val, velocity: i });
    }

    /**
     * Returns a new MelodyMember copying this but with a changed absolute tick.
     */
    withExactTick(i: number): this {
        return this.withTiming(this._val.timing.withExactTick(i));
    }

    /**
     * Returns a new MelodyMember copying this but with a new offset.
     */
    withOffset(i: number): this {
        return this.withTiming(this._val.timing.withOffset(i));
    }

    /**
     * Returns a new MelodyMember copying this but with the offset increased.
     */
    addOffset(i: number): this {
        if (!isInt(i)) {
            throw new Error(`invalid delta: ${i}`);
        }

        return this.withOffset(this.offset + i);
    }

    /**
     * Returns a new MelodyMember copying this but with a new delay.
     */
    withDelay(i: number): this {
        return this.withTiming(this._val.timing.withDelay(i));
    }

    /**
     * Returns a new MelodyMember copying this but with the delay increased.
     */
    addDelay(i: number): this {
        if (!isInt(i)) {
            throw new Error(`invalid delta: ${i}`);
        }

        return this.withDelay(this.delay + i);
    }

    /**
     * Returns a new MelodyMember where its tick is converted to an exact one;
     * meta-events associated with have it undergo the same tick conversion.
     */
    withAllTicksExact(curr: number): this {
        if (!isNonnegInt(curr)) {
            throw new Error(`invalid curr: ${curr}`);
        }

        const newtiming = this.timing.withAllTicksExact(curr);
        const start = newtiming.exact as number;
        const end = this.timing.endTick(curr);

        return this.construct({
            pitch: this.pitch,
            velocity: this.velocity,
            timing: newtiming,
            before: this.before.withAllTicksExact(start),
            after: this.after.withAllTicksExact(end),
        });
    }

    /**
     * Returns a new MelodyMember with a text event before it.
     * Optional second argument is the type of text event.
     * Optional third argument are the standard meta event options.
     */
    withTextBefore(val: string, typeOrOpts: string | MetaEventOpts = 'text', opts?: MetaEventOpts): this {
        if (typeof typeOrOpts === 'string') {
            switch (typeOrOpts) {
            case 'text':
            case 'lyric':
            case 'cue-point':
            case 'marker':
                break;
            
            default:
                throw new Error(`invalid text event type: ${typeOrOpts}`);
            }

            return this.withEventBefore(typeOrOpts, val, opts);
        }

        return this.withEventBefore('text', val, typeOrOpts);
    }

    /**
     * Returns a new MelodyMember with a text event before it.
     * Optional second argument is the type of text event.
     * Optional third argument are the standard meta event options.
     */
    withTextAfter(val: string, typeOrOpts: string | MetaEventOpts = 'text', opts?: MetaEventOpts): this {
        if (typeof typeOrOpts === 'string') {
            switch (typeOrOpts) {
            case 'text':
            case 'lyric':
            case 'cue-point':
            case 'marker':
                break;
            
            default:
                throw new Error(`invalid text event type: ${typeOrOpts}`);
            }

            return this.withEventAfter(typeOrOpts, val, opts);
        }

        return this.withEventAfter('text', val, typeOrOpts);
    }

    /**
     * Returns a new MelodyMember that is a copy of this but with new meta events that are
     * processed when the associated note starts.
     */
    withEventsBefore(events: MetaEventArg[]): this {
        return this.construct({ ...this._val, before: this._val.before.withNewEvents(events) });
    }

    /**
     * Returns a new MelodyMember that is a copy of this but with new meta events that are
     * processed when the associated note stops.
     */
    withEventsAfter(events: MetaEventArg[]): this {
        return this.construct({ ...this._val, after: this._val.after.withNewEvents(events) });
    }

    /**
     * Returns a new MelodyMember copying this but with a meta event to execute before it.
     */
    withEventBefore(event: string | MetaEventArg, value?: MetaEventValue, opts?: MetaEventOpts): this {
        return this.construct({ ...this._val, before: this._val.before.withNewEvent(event, value, opts) });
    }

    /**
     * Returns a new MelodyMember copying this but with new meta events to execute after it.
     */
    withEventAfter(event: string | MetaEventArg, value?: MetaEventValue, opts?: MetaEventOpts): this {
        return this.construct({ ...this._val, after: this._val.after.withNewEvent(event, value, opts) });
    }

    /**
     * Returns a new MelodyMember copying this but with rhythms augmented.
     */
    augmentRhythm(i: number): this {
        if (!isNonNegNumber(i)) {
            throw new Error(`must augment by a non-negative number; was ${i}`);
        }

        const v = this._val;

        return this.construct({
            pitch: v.pitch,
            velocity: v.velocity,
            timing: v.timing.augment(i),
            before: v.before.augmentRhythm(i),
            after: v.after.augmentRhythm(i),
        });
    }

    /**
     * Returns a new MelodyMember copying this but with rhythms diminished.
     */
    diminishRhythm(i: number): this {
        if (!isPosNumber(i)) {
            throw new Error(`must diminish by a positive num/ber; was ${i}`);
        }

        const v = this._val;

        return this.construct({
            pitch: v.pitch,
            velocity: v.velocity,
            timing: v.timing.diminish(i),
            before: v.before.diminishRhythm(i),
            after: v.after.diminishRhythm(i),
        });
    }

    /**
     * Validate this ChordSeqMember.
     */
    validate(fn: ValidatorFn): boolean {
        return this._val.pitch.validate(fn);
    }

    describe(): string {
        return `${this.constructor.name}({pitch:${this.pitch.describe()},velocity:${this.velocity},duration:${this.duration},at:${this.at},offset:${this.offset},delay:${this.delay},before:${this.before.describe()},after:${this.after.describe()}})`;
    }
}
