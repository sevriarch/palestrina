import type { MetaEventArg, MetaEventKind, MetaListArg } from '../types';

import MetaEvent from './meta-event';

import { isNonNegNumber, isNonnegInt, isPosNumber } from '../helpers/validation';

import { dumpOneLine } from '../dump/dump';

/**
 * Class representing a list of Meta events. This functionality is used in a number of places
 * at the start and end of MelodyMembers, at the start of Melodies and Scores, and is used
 * during the creation and reading of MIDI files.
 */
export default class MetaList {
    contents: MetaEvent<MetaEventKind>[];

    static EMPTY_META_LIST = new MetaList([]);

    /**
     * Static method to return a MetaList.
     * If creating from nothing, return a constant.
     * If creating from a MetaList, return that MetaList.
     * Otherwise, create a new one.
     */
    static from(ob: MetaListArg = []): MetaList {
        if (ob instanceof MetaList) {
            return ob;
        }

        if (!Array.isArray(ob)) {
            throw new Error(`MetaList.from(): invalid argument: ${dumpOneLine(ob)}`);
        }

        if (ob.length) {
            return new MetaList(ob.map(MetaEvent.from));
        }

        return MetaList.EMPTY_META_LIST;
    }

    /**
     * Constructor. Takes an array of MetaEvents and creates a MetaList from them.
     */
    constructor(ob: MetaEvent<MetaEventKind>[]) {
        this.contents = ob.slice();

        Object.freeze(this.contents);
        Object.freeze(this);
    }

    protected construct(contents: MetaEvent<MetaEventKind>[]): this {
        const Ctor = this.constructor as new (contents: MetaEvent<MetaEventKind>[]) => this;

        return new Ctor(contents);
    }

    /**
     * Return a copy of this MetaList with an event added to it.
     * Argument is passed as an array of events.
     */
    withNewEvent(event: MetaEventArg): this {
        return this.construct([ ...this.contents, MetaEvent.from(event) ]);
    }

    /**
     * Return a copy of this MetaList with zero or more events added to it.
     * Argument is passed as an array of events.
     */
    withNewEvents(events: MetaListArg) {
        const newevents = events instanceof MetaList ? events.contents : events.map(e => MetaEvent.from(e));

        return this.construct([ ...this.contents, ...newevents ]);
    }

    /**
     * Is this MetaList identical to the passed MetaList?
     */
    equals(ml: MetaList): boolean {
        if (!(ml instanceof MetaList)) { return false; }

        if (this.contents.length !== ml.contents.length) { return false; }

        for (let i = 0; i < this.contents.length; i++) {
            if (!this.contents[i].equals(ml.contents[i])) { return false; }
        }

        return true;
    }

    /**
     * Return a copy of this MetaList with offsets augmented.
     */
    augmentRhythm(i: number): MetaList {
        if (!isNonNegNumber(i)) {
            throw new Error(`MetaList.augmentRhythm(): must augment by a non-negative number; was ${dumpOneLine(i)}`);
        }

        if (!this.contents.length) {
            return this;
        }

        return this.construct(this.contents.map(e => e.augment(i)));
    }

    /**
     * Return a copy of this MetaList with offsets dimished.
     */
    diminishRhythm(i: number): MetaList {
        if (!isPosNumber(i)) {
            throw new Error(`MetaList.diminishRhythm(): must diminish by a positive number; was ${dumpOneLine(i)}`);
        }

        if (!this.contents.length) {
            return this;
        }

        return this.construct(this.contents.map(e => e.diminish(i)));
    }

    /**
     * Return a copy of this MetaList with all ticks converted to exact ones.
     */
    withAllTicksExact(curr: number): MetaList {
        if (!isNonnegInt(curr)) {
            throw new Error(`MetaList.withAllTicksExact(): current tick must be a non-negative integer; was ${dumpOneLine(curr)}`);
        }

        if (!this.contents.length) {
            return this;
        }

        return this.construct(this.contents.map(e => e.withAllTicksExact(curr)));
    }

    /**
     * Return a string description of this object.
     */
    describe(): string {
        let ctdesc: string;

        if (this.contents.length) {
            ctdesc = this.contents.map((c, i) => `${i}: ${dumpOneLine(c)},`).join('');
        } else {
            ctdesc = '';
        }

        return `${this.constructor.name}(length=${this.contents.length})([${ctdesc}])`;
    }
}