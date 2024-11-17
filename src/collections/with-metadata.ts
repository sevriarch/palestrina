import type { MetadataData, MetaEventValue, MetaListArg, MetaEventOpts, MetaEventArg } from '../types';

import CollectionWithoutMetadata from './without-metadata';

import { dumpMultiLine } from '../dump/dump';

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

    protected withMetadataValues(ob: MetadataData): this {
        return this.withMetadata(this.metadata.withValues(ob));
    }

    /**
     * Return a copy of this Collection with copyright metadata set to the passed value.
     */
    withCopyright(s: string): this {
        return this.withMetadataValues({ copyright: s });
    }

    /**
     * Set a track name. Return a new entity.
     * Return a copy of this Collection with track name metadata set to the passed value.
     */
    withTrackName(s: string): this {
        return this.withMetadataValues({ trackname: s });
    }

    /**
     * Set ticks per quarter. Return a new entity.
     * Return a copy of this Collection with MIDI ticks per quarter metadata set to the passed value.
     */
    withTicksPerQuarter(ticks: number): this {
        return this.withMetadataValues({ ticks_per_quarter: ticks });
    }

    /**
     * Return a copy of this Collection with MIDI channel metadata set to the passed value.
     */
    withMidiChannel(n: number): this {
        return this.withMetadataValues({ midichannel: n });
    }

    /**
     * Return a copy of this Collection with time signature metadata set to the passed value.
     */
    withTimeSignature(s: string): this {
        return this.withMetadataValues({ time_signature: s });
    }

    /**
     * Return a copy of this Collection with time signature metadata set to the passed value.
     */
    withKeySignature(s: string): this {
        return this.withMetadataValues({ key_signature: s });
    }

    /**
     * Return a copy of this Collection with the tempo metadata set to the passed value.
     */
    withTempo(t: number): this {
        return this.withMetadataValues({ tempo: t });
    }

    /**
     * Return a copy of this Collection with the instrument metadata set to the passed value.
     */
    withInstrument(s: string): this {
        return this.withMetadataValues({ instrument: s });
    }

    /**
     * Return a copy of this Collection with a new meta-event pushed onto its start.
     */
    withNewEvent(event: string | MetaEventArg, value?: MetaEventValue, meta?: MetaEventOpts): this {
        return this.withMetadataValues({ before: this.metadata.before.withNewEvent(event, value, meta) });
    }

    /**
     * Return a copy of this Collection with new meta-events added.
     */
    withNewEvents(events: MetaListArg): this {
        return this.withMetadataValues({ before: this.metadata.before.withNewEvents(events) });
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
