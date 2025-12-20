import type { MetaEventArg, MetaEventKind, MetaEventValueMap } from '../types';

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
export default class MetaEvent<Event extends MetaEventKind> {
    readonly event: MetaEventKind;            // the kind of event
    readonly value: MetaEventValueMap[Event]; // the value associated with the event
    readonly timing: Timing;                  // timing information

    static from(ob: MetaEventArg | MetaEvent<MetaEventKind>): MetaEvent<MetaEventKind> {
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

        let value = ob.value;

        switch (ob.event) {
        case 'sustain':
            if (value !== 0 && value !== 1) {
                failed.push('value');
            }
            break;
        case 'tempo':
            if (!isNumber(value) || value as number <= 0) {
                failed.push('value');
            }
            break;
        case 'key-signature':
            if (typeof value !== 'string' || !keySignature.validate(value)) {
                failed.push('value');
            }
            break;
        case 'time-signature':
            if (typeof value !== 'string' || !timeSignature.validate(value)) {
                failed.push('value');
            }
            break;
        case 'instrument':
            const inst = instrument.toInstrument(value);

            if (inst === undefined) {
                failed.push('value');
            } else {
                value = inst;
            }
            break;
        case 'text':
        case 'lyric':
        case 'marker':
        case 'cue-point':
        case 'copyright':
        case 'track-name':
        case 'instrument-name':
            if (typeof value !== 'string') {
                failed.push('value');
            }
            break;
        case 'volume':
        case 'pan':
        case 'balance':
            if (!is7BitInt(value)) {
                failed.push('value');
            }
            break;
        case 'pitch-bend':
            if (!isInt(value) || value as number >= 16384 || value as number < -16384) {
                failed.push('value');
            }
            break;
        default:
            failed.push('event');
        }

        if (failed.length) {
            throw new Error(`invalid data in meta-event ${dumpOneLine(ob)}: fields ${dumpOneLine(failed)} failed validation`);
        }

        return new MetaEvent({
            event: ob.event,
            value,
            timing: new Timing(ob.at, ob.offset)
        });
    }

    get at() { return this.timing.exact; }
    get offset() { return this.timing.offset as number; }

    /**
     * Creates a new MetaEvent
     * @hidden
     */
    constructor(ob: MetaEventArg & { timing: Timing }) {
        this.event = ob.event;
        this.timing = ob.timing;
        this.value = ob.value as MetaEventValueMap[Event];

        Object.freeze(this);
    }

    /**
     * Augment the timing values in this object
     */
    augment(i: number): MetaEvent<Event> {
        return new MetaEvent({
            event: this.event,
            value: this.value,
            timing: this.timing.augment(i)
        });
    }

    /**
     * Diminish the timing values in this object
     */
    diminish(i: number): MetaEvent<Event> {
        return new MetaEvent({
            event: this.event,
            value: this.value,
            timing: this.timing.diminish(i)
        });
    }

    /**
     * Return this object with a different offset
     */
    withOffset(i: number): MetaEvent<Event> {
        return new MetaEvent({ 
            event: this.event,
            value: this.value,
            timing: this.timing.withOffset(i)
        });
    }
    
    /**
     * Return this object with ticks converted to exact ticks
     */
    withAllTicksExact(curr: number): MetaEvent<Event> {
        return new MetaEvent({
            event: this.event,
            value: this.value,
            timing: this.timing.withAllTicksExact(curr)
        });
    }

    /**
     * Is this MetaEvent equal to the passed MetaEvent?
     */
    equals(e: MetaEvent<Event>): boolean {
        return e instanceof MetaEvent
            && this.event === e.event
            && this.value === e.value
            && this.offset === e.offset
            && this.at === e.at;
    }

    describe(): string {
        return `${this.constructor.name}({event:"${this.event}",value:${dumpOneLine(this.value)},at:${this.at},offset:${this.offset}})`;
    }
}