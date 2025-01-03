import type { MetadataData, TypeOrArray, MetaEventArg } from '../types';

import MetaList from '../meta-events/meta-list';
import NumericValidator from '../validation/numeric';

import { DEFAULTS } from '../constants';
import { invalidKeys, isMidiChannel, isIntBetween } from '../helpers/validation';
import { dumpOneLine } from '../dump/dump';

import * as keySignature from '../helpers/key-signature';
import * as timeSignature from '../helpers/time-signature';
import * as instrument from '../helpers/instrument';

const VALID_KEYS = new Set([ 'tempo', 'time_signature', 'key_signature', 'copyright', 'trackname', 'midichannel', 'before', 'ticks_per_quarter', 'instrument', 'validator' ]);

// Return a list of fields that failed validation
function fieldsFailingValidation(ob: MetadataData): string[] {
    const failed: string[] = [];

    if (ob.midichannel !== undefined && !isMidiChannel(ob.midichannel)) {
        failed.push('midichannel');
    }

    if (ob.before !== undefined && !(ob.before instanceof MetaList)) {
        failed.push('before');
    }

    if (ob.tempo !== undefined && (typeof ob.tempo !== 'number' || ob.tempo <= 0)) {
        failed.push('tempo');
    }

    if (ob.time_signature !== undefined && !timeSignature.validate(ob.time_signature)) {
        failed.push('time_signature');
    }

    if (ob.key_signature !== undefined && !keySignature.validate(ob.key_signature)) {
        failed.push('key_signature');
    }

    if (ob.copyright !== undefined && typeof ob.copyright !== 'string') {
        failed.push('copyright');
    }

    if (ob.trackname !== undefined && typeof ob.trackname !== 'string') {
        failed.push('trackname');
    }

    if (ob.instrument !== undefined && typeof ob.instrument !== 'string') {
        failed.push('instrument');
    }

    if (ob.validator !== undefined && !(ob.validator instanceof NumericValidator)) {
        failed.push('validator');
    }

    if (ob.ticks_per_quarter !== undefined && !isIntBetween(ob.ticks_per_quarter, 0x01, 0xffff)) {
        failed.push('ticks_per_quarter');
    }

    return failed;
}

/**
 * Class representing the metadata associated with a Collection or similar entity.
 */
export default class Metadata {
    metadata: MetadataData;

    static EMPTY_METADATA = new Metadata({});

    static from(ob?: MetadataData | Metadata) {
        if (!ob) {
            return this.EMPTY_METADATA;
        }

        return ob instanceof Metadata ? ob : new Metadata(ob);
    }

    /**
     * Used by midi-reader to create track metadata.
     * Extract meta-list events that are actually metadata.
     * Pack them into an object containing metadata.
     * Create a new meta-list that contains all events from this one that are not metadata.
     * Assign it to the `before` field of the metadata object
     * Return the object containing metadata.
     */
    static fromMetaEventArg(eventdata: MetaEventArg[]): Metadata {
        const metadata: MetadataData = {};

        // Move events that should be in metadata to metadata object.
        // Keep events that are not in metadata to turn to MetaList.
        const filtered = eventdata.filter(event => {
            if (event.at || !('value' in event)) {
                return true;
            }

            switch (event.event) {
            case 'track-name':
                metadata.trackname = event.value;
                return false;
            case 'copyright':
                metadata.copyright = event.value;
                return false;
            case 'tempo':
                metadata.tempo = event.value;
                return false;
            case 'key-signature':
                metadata.key_signature = event.value;
                return false;
            case 'time-signature':
                metadata.time_signature = event.value;
                return false;
            case 'instrument':
                if (typeof event.value === 'number') {
                    metadata.instrument = instrument.toInstrument(event.value);
                } else {
                    metadata.instrument = event.value;
                }
                return false;
            default:
                return true;
            }
        });

        if (filtered.length) {
            metadata.before = MetaList.from(filtered);
        }
    
        return new Metadata(metadata);
    }

    get midichannel() { return this.metadata.midichannel ?? DEFAULTS.MIDI_CHANNEL; }
    get before() { return this.metadata.before ?? MetaList.EMPTY_META_LIST; }
    get ticks_per_quarter() { return this.metadata.ticks_per_quarter ?? DEFAULTS.TICKS_PER_QUARTER; }
    get validator() { return this.metadata.validator ?? NumericValidator.INT_VALIDATOR; }
    get tempo() { return this.metadata.tempo; }
    get time_signature() { return this.metadata.time_signature; }
    get key_signature() { return this.metadata.key_signature; }
    get copyright() { return this.metadata.copyright; }
    get trackname() { return this.metadata.trackname; }
    get instrument() { return this.metadata.instrument; }

    constructor(ob: MetadataData) {
        if (typeof ob !== 'object' || ob === null) {
            throw new Error(`Metadata must be a non-null object; was ${dumpOneLine(ob)}`);
        }

        const badkeys = invalidKeys(ob, VALID_KEYS);
        if (badkeys.length) {
            throw new Error(`Invalid keys in metadata ${dumpOneLine(ob)}: ${dumpOneLine(badkeys)}`);
        }

        const failed = fieldsFailingValidation(ob);
        if (failed.length) {
            throw new Error(`invalid data in Metadata ${dumpOneLine(ob)}: fields ${dumpOneLine(failed)} failed validation`);
        }

        this.metadata = { ...ob };

        // Update midi channel if necessary
        if ('instrument' in this.metadata) {
            if (instrument.toPercussionInstrument(this.metadata.instrument)) {
                this.metadata.midichannel = 10;
            } else if (this.metadata.midichannel === 10 && instrument.toInstrument(this.metadata.instrument)) {
                this.metadata.midichannel = 1;
            }
        }

        Object.freeze(this);
        Object.freeze(this.metadata);
    }

    /**
     * Construct a new metadata object.
     */
    protected construct(ob: MetadataData): this {
        const Ctor = this.constructor as new (ob: MetadataData) => this;

        return new Ctor(ob);
    }

    /**
     * Merge in values from another metadata object if the are not set in this object.
     * NOTE: If the `before` field is set in both objects, prepend values from the
     * passed object to those in this object.
     */
    mergeFrom(ob: Metadata) {
        if (!(ob instanceof Metadata)) {
            throw new Error('can only merge from another Metadata object');
        }

        const vals = { ...ob.metadata, ...this.metadata };

        if (this.metadata.before && ob.metadata.before) {
            vals.before = ob.metadata.before.append(this.metadata.before);
        }

        return this.construct(vals);
    }

    /**
     * Return a copy of this metadata fields set.
     */
    withValues(vals: MetadataData): this {
        return this.construct({ ...this.metadata, ...vals });
    }

    /**
     * Return a copy of this metadata with a field or fields removed.
     */
    withoutValues(key: TypeOrArray<keyof MetadataData>): this {
        const data = { ...this.metadata };

        if (Array.isArray(key)) {
            for (const k of key) {
                delete data[k];
            }
        } else {
            delete data[key];
        }

        return this.construct(data);
    }

    /**
     * Return a copy of this metadata with all ticks converted to exact ones.
     */
    withAllTicksExact(): this {
        if (!this.metadata.before) {
            return this;
        }

        return this.withValues({ before: this.metadata.before.withAllTicksExact(0) });
    }

    /**
     * Return a description of this metadata for debugging purposes.
     */
    describe(): string {
        const fields: string[] = [];
        const m = this.metadata;

        if (m.midichannel !== undefined) {
            fields.push('midichannel=' + m.midichannel);
        }

        if (m.tempo !== undefined) {
            fields.push('tempo=' + m.tempo);
        }

        if (m.ticks_per_quarter !== undefined) {
            fields.push('ticks_per_quarter=' + m.ticks_per_quarter);
        }

        if (m.time_signature !== undefined) {
            fields.push('time_signature=' + dumpOneLine(m.time_signature));
        }

        if (m.key_signature !== undefined) {
            fields.push('key_signature=' + dumpOneLine(m.key_signature));
        }

        if (m.copyright !== undefined) {
            fields.push('copyright=' + dumpOneLine(m.copyright));
        }

        if (m.trackname !== undefined) {
            fields.push('trackname=' + dumpOneLine(m.trackname));
        }

        if (m.instrument !== undefined) {
            fields.push('instrument=' + dumpOneLine(m.instrument));
        }

        if (m.before !== undefined) {
            fields.push('before=' + m.before.describe());
        }

        if (m.validator !== undefined) {
            fields.push('validator=' + m.validator.describe());
        }

        return 'Metadata({' + fields.join(',') + '})';
    }
}
