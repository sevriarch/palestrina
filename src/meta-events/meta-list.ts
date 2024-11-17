import type { MetaEventArg, MetaEventOpts, MetaEventValue, MetaListArg } from '../types';

import CollectionWithoutMetadata from '../collections/without-metadata';
import MetaEvent from './meta-event';

import { isNonNegNumber, isPosNumber } from '../helpers/validation';

/**
 * Class representing a list of Meta events. This functionality is used in a number of places
 * at the start and end of MelodyMembers, at the start of Melodies and Scores, and is used
 * during the creation and reading of MIDI files.
 */
export default class MetaList extends CollectionWithoutMetadata<MetaEvent> {
    static EMPTY_META_LIST = new MetaList([]);

    /**
     * Static method to return a MetaList.
     * If creating from nothing, return a constant.
     * If creating from a MetaList, return that MetaList.
     * Otherwise, create a new one.
     */
    static from(ob?: MetaListArg): MetaList {
        if (ob instanceof MetaList) {
            return ob;
        }

        if (!ob || ob.length === 0) {
            return MetaList.EMPTY_META_LIST;
        }

        return new MetaList(ob.map(MetaEvent.from));
    }

    /**
     * Constructor. Takes an array of MetaEvents and creates a MetaList from them.
     */
    constructor(ob: MetaEvent[]) {
        super(ob);

        Object.freeze(this);
    }

    /**
     * Return a copy of this MetaList with zero or more events added to it.
     * Argument is passed as an array of events.
     */
    withNewEvent(event: string | MetaEventArg, value?: MetaEventValue, meta?: MetaEventOpts): this {
        let metaevent: MetaEventArg;

        if (typeof event === 'string') {
            metaevent = { event, value } as MetaEventArg; // Invalid values will be handled in MetaEvent.from()

            if (meta) {
                metaevent = { ...metaevent, ...meta };
            }
        } else {
            metaevent = event;
        }

        return this.appendItems(MetaEvent.from(metaevent));
    }

    /**
     * Return a copy of this MetaList with zero or more events added to it.
     * Argument is passed as an array of events.
     */
    withNewEvents(events: MetaListArg) {
        const newevents = events instanceof MetaList ? events.contents : events.map(e => MetaEvent.from(e));

        return this.construct(this.contents, newevents);
    }

    /**
     * Is this MetaList identical to the passed MetaList?
     */
    equals(ml: MetaList): boolean {
        if (!(ml instanceof MetaList)) { return false; }

        if (this.length !== ml.length) { return false; }

        for (let i = 0; i < this.length; i++) {
            if (!this.contents[i].equals(ml.contents[i])) { return false; }
        }

        return true;
    }

    /**
     * Return a copy of this MetaList with offsets augmented.
     */
    augmentRhythm(i: number): MetaList {
        if (!isNonNegNumber(i)) {
            throw new Error(`MetaList.augmentRhythm(): must augment by a non-negative number; was ${i}`);
        }

        if (!this.length) {
            return this;
        }

        return this.map(e => e.withOffset(e.offset * i));
    }

    /**
     * Return a copy of this MetaList with offsets dimished.
     */
    diminishRhythm(i: number): MetaList {
        if (!isPosNumber(i)) {
            throw new Error(`MetaList.diminishRhythm(): must diminish by a positive number; was ${i}`);
        }

        if (!this.length) {
            return this;
        }

        return this.map(e => e.withOffset(e.offset / i));
    }
}