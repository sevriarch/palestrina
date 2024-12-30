import type { MetaEventArg, MetaEventValue, MetaEventData } from '../types';

import Timing from '../timing/timing';

import * as keySignature from '../helpers/key-signature';
import * as timeSignature from '../helpers/time-signature';
import * as instrument from '../helpers/instrument';

import { invalidKeys, isNumber, isInt, is7BitInt } from '../helpers/validation';
import { dumpOneLine } from '../dump/dump';

const INVALID_KEYS = new Set([ 'event', 'value', 'offset', 'at' ]);

/**
 * Class representing data required to create a Midi event.
 *
 * Used by MetaList, which contains an array of these entities.
 * 
 * MetaList is used by MelodyMember to define an array of events that occur before
 * the MelodyMember and an array of events that occur after it, by Melody to define
 * an array of events that occur at the start of the Melody, by Score for the same
 * reason, and is used during the creation and reading of MIDI files.
 */
export default class MetaEvent {
    readonly event: string;          // the type of event
    readonly value?: MetaEventValue; // the value associated with the event, if any
    readonly timing: Timing;        // timing information

    static from(ob: MetaEventArg | MetaEvent): MetaEvent {
        if (ob instanceof MetaEvent) {
            return ob;
        }

        if (typeof ob !== 'object' || ob === null) {
            throw new Error(`MetaEvent data must be a non-null object; was ${dumpOneLine(ob)}`);
        }

        const badkeys = invalidKeys(ob, INVALID_KEYS);
        if (badkeys.length) {
            throw new Error(`Invalid keys in meta-event data ${dumpOneLine(ob)}: ${dumpOneLine(badkeys)}`);
        }

        const failed = [];

        if (ob.at !== undefined && !Timing.isExactTickValid(ob.at)) {
            failed.push('at');
        }

        if (ob.offset !== undefined && !Timing.isOffsetValid(ob.offset)) {
            failed.push('offset');
        }

        let value;
        if (ob.event !== 'end-track') {
            value = ob.value;

            switch (ob.event) {
            case 'sustain':
                if (ob.value !== 0 && ob.value !== 1) {
                    failed.push('value');
                }
                break;
            case 'tempo':
                if (!isNumber(ob.value) || ob.value as number <= 0) {
                    failed.push('value');
                }
                break;
            case 'key-signature':
                if (typeof ob.value !== 'string' || !keySignature.validate(ob.value)) {
                    failed.push('value');
                }
                break;
            case 'time-signature':
                if (typeof ob.value !== 'string' || !timeSignature.validate(ob.value)) {
                    failed.push('value');
                }
                break;
            case 'instrument':
                value = instrument.toInstrument(ob.value);

                if (value === undefined) {
                    failed.push('value');
                }
                break;
            case 'text':
            case 'lyric':
            case 'marker':
            case 'cue-point':
            case 'copyright':
            case 'track-name':
                if (typeof ob.value !== 'string') {
                    failed.push('value');
                }
                break;
            case 'volume':
            case 'pan':
            case 'balance':
                if (!is7BitInt(ob.value)) {
                    failed.push('value');
                }
                break;
            case 'pitch-bend':
                if (!isInt(ob.value) || ob.value as number >= 16384 || ob.value as number < -16384) {
                    failed.push('value');
                }
                break;
            default:
                failed.push('event');
            }
        }

        if (failed.length) {
            throw new Error(`invalid data in meta-event ${dumpOneLine(ob)}: fields ${dumpOneLine(failed)} failed validation`);
        }

        return new MetaEvent({
            event: ob.event,
            value: value,
            timing: new Timing(ob.at, ob.offset)
        } as MetaEventData);
    }

    get at() { return this.timing.exact; }
    get offset() { return this.timing.offset as number; }

    /**
     * Creates a new MetaEvent
     * @hidden
     */
    constructor(ob: MetaEventData) {
        this.event = ob.event;
        this.timing = ob.timing;

        if (ob.event !== 'end-track') {
            this.value = ob.value;
        }

        Object.freeze(this);
    }

    /**
     * Augment the timing values in this object
     */
    augment(i: number): MetaEvent {
        return new MetaEvent({
            event: this.event,
            value: this.value,
            timing: this.timing.augment(i)
        } as MetaEventData);
    }

    /**
     * Diminish the timing values in this object
     */
    diminish(i: number): MetaEvent {
        return new MetaEvent({
            event: this.event,
            value: this.value,
            timing: this.timing.diminish(i)
        } as MetaEventData);
    }

    /**
     * Return this object with a different offset
     */
    withOffset(i: number): MetaEvent {
        return new MetaEvent({ 
            event: this.event,
            value: this.value,
            timing: this.timing.withOffset(i)
        } as MetaEventData);
    }
    
    /**
     * Return this object with ticks converted to exact ticks
     */
    withAllTicksExact(curr: number): MetaEvent {
        return new MetaEvent({
            event: this.event,
            value: this.value,
            timing: this.timing.withAllTicksExact(curr)
        } as MetaEventData);
    }

    /**
     * Is this MetaEvent equal to the passed MetaEvent?
     */
    equals(e: MetaEvent): boolean {
        return e instanceof MetaEvent
            && this.event === e.event
            && this.value === e.value
            && this.offset === e.offset
            && this.at === e.at;
    }

    describe(): string {
        const val = this.value === undefined ? 'undefined' : dumpOneLine(this.value);

        return `${this.constructor.name}({event:"${this.event}",value:${val},at:${this.at},offset:${this.offset}})`;
    }
}
