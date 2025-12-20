import type { MetaEventKind, MetaEventValueMap, MetaListArg, EventTiming, MetaEventArg } from '../types';

import CollectionWithoutMetadata from './without-metadata';

import { toInstrument, toPercussionInstrument } from '../helpers/instrument';
import { dumpOneLine, dumpMultiLine } from '../dump/dump';

import type Metadata from '../metadata/metadata';

/**
 * Class representing a Collection that has metadata.
 */
export default class CollectionWithMetadata<T> extends CollectionWithoutMetadata<T> {
    readonly metadata: Metadata;

    constructor(contents: T[], metadata: Metadata) {
        super(contents);

        this.metadata = metadata;
    }

    /**
     * Construct a new Collection from zero or more arrays of Collection contents.
     * Metadata is unchanged.
     */
    protected override construct(...contents: T[][]): this {
        const Ctor = this.constructor as new (contents: T[], metadata: Metadata) => this;

        return new Ctor(contents.flat(1), this.metadata);
    }

    /**
     * Construct a new Collection with different metadata, but the same contents.
     */
    protected withMetadata(metadata: Metadata): this {
        const Ctor = this.constructor as new (contents: T[], metadata: Metadata) => this;

        return new Ctor(this.contents, metadata);
    }

    /**
     * Return a copy of this Collection with copyright metadata set to the passed value.
     */
    withCopyright(s: string): this {
        return this.withMetadata(this.metadata.withValues({ copyright: s }));
    }

    /**
     * Set a track name. Return a new entity.
     * Return a copy of this Collection with track name metadata set to the passed value.
     */
    withTrackName(s: string): this {
        return this.withMetadata(this.metadata.withValues({ trackname: s }));
    }

    /**
     * Set ticks per quarter. Return a new entity.
     * Return a copy of this Collection with MIDI ticks per quarter metadata set to the passed value.
     */
    withTicksPerQuarter(ticks: number): this {
        return this.withMetadata(this.metadata.withValues({ ticks_per_quarter: ticks }));
    }

    /**
     * Return a copy of this Collection with MIDI channel metadata set to the passed value.
     */
    withMidiChannel(n: number): this {
        return this.withMetadata(this.metadata.withValues({ midichannel: n }));
    }

    /**
     * Return a copy of this Collection with time signature metadata set to the passed value.
     */
    withTimeSignature(s: string): this {
        return this.withMetadata(this.metadata.withValues({ time_signature: s }));
    }

    /**
     * Return a copy of this Collection with time signature metadata set to the passed value.
     */
    withKeySignature(s: string): this {
        return this.withMetadata(this.metadata.withValues({ key_signature: s }));
    }

    /**
     * Return a copy of this Collection with the tempo metadata set to the passed value.
     */
    withTempo(t: number): this {
        return this.withMetadata(this.metadata.withValues({ tempo: t }));
    }

    /**
     * Return a copy of this Collection with the instrument metadata set to the passed value.
     */
    withInstrument(inst: string | number): this {
        if (typeof inst === 'string') {
            return this.withMetadata(this.metadata.withValues({ instrument: inst }));
        }

        const istr = this.metadata.midichannel === 10 ? toPercussionInstrument(inst) : toInstrument(inst);

        if (!istr) {
            throw new Error(`${this.constructor.name}.withInstrument(): invalid instrument: ${dumpOneLine(inst)}`);
        }

        return this.withMetadata(this.metadata.withValues({ instrument: istr }));
    }

    /**
     * Return a copy of this Collection with a new meta-event pushed onto its start.
     */
    withNewEvent<Event extends MetaEventKind>(event: Event | MetaEventArg, value?: MetaEventValueMap[Event], opts?: EventTiming): this {
        let newevent: MetaEventArg;
        if (typeof event === 'string') {
            if (value === undefined) {
                throw new Error(`${this.constructor.name}.withNewEvent(): event "${event}" missing a value`);
            }

            newevent = { event, value, ...opts };
        } else {
            newevent = event;
        }

        return this.withMetadata(this.metadata.withValues({ before: this.metadata.before.withNewEvent(newevent) }));
    }

    /**
     * Return a copy of this Collection with new meta-events added.
     */
    withNewEvents(events: MetaListArg): this {
        return this.withMetadata(this.metadata.withValues({ before: this.metadata.before.withNewEvents(events) }));
    }

    /**
     * Return a copy of this Collection with metadata ticks converted to exact ticks.
    */
    withMetadataTicksExact(): this {
        const m = this.metadata.withAllTicksExact();

        if (m === this.metadata) {
            return this;

        }
        return this.withMetadata(m);
    }

    /**
     * Merge in metadata from another entity, but only when this metadata value wasn't present.
     */
    mergeMetadataFrom(source: { metadata: Metadata }): this {
        return this.withMetadata(this.metadata.mergeFrom(source.metadata));
    }

    override describe(indent = 0): string {
        const pad = ''.padStart(indent, ' ');

        let ctdesc: string;
        if (this.length) {
            ctdesc = '\n' + this.contents.map((c, i) => `    ${pad}${i}: ${dumpMultiLine(c, indent + 4)},\n`).join('') + pad;
        } else {
            ctdesc = '';
        }

        return `${this.constructor.name}(length=${this.length},metadata=${this.metadata.describe()})([${ctdesc}])`;
    }
}
