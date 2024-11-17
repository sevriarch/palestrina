import type { SeqArgument, SeqMemberArgument, MetadataData, MelodySummary, MapperFn, SeqIndices, MetaEventValue, MetaEventOpts, MetaEventArg, ISequence } from '../types';

import Sequence from './generic';
import MelodyMember from './members/melody';

import { melodyToTimedMidiBytes, melodyToMidiTrack } from '../midi/conversions';

/**
 * Class representing a Sequence of {@link MelodyMember}s, each of which contains an array of zero or more numbers
 * plus non-pitch timing information and metadata.
 */
export default class Melody extends Sequence<MelodyMember> implements ISequence<MelodyMember> {
    static from(v: SeqArgument, metadata?: MetadataData) {
        return Sequence.build(Melody, MelodyMember, v, metadata);
    }

    protected constructMember(v: SeqMemberArgument): MelodyMember {
        return MelodyMember.from(v);
    }

    private patchFieldValuesWithArray(arr: number[], patcher: MapperFn<MelodyMember>): this {
        if (this.length !== arr.length) {
            throw new Error(`${this.constructor.name}.patchFieldValues(): passed argument length ${arr.length} must be equal to sequence length (${this.length})`);
        }

        return this.map((e, i) => patcher(e, arr[i]));
    }

    private patchFieldValues(seq: SeqIndices, patcher: MapperFn<MelodyMember>) {
        if (typeof seq === 'number') {
            return this.map(e => patcher(e, seq));
        }

        if (Array.isArray(seq)) {
            return this.patchFieldValuesWithArray(seq, patcher);
        }

        if (seq instanceof Sequence) {
            return this.patchFieldValuesWithArray(seq.toNumericValues(), patcher);
        }

        throw new Error(`${this.constructor.name}.patchFieldValues(): Argument must be a Sequence, an array, or a number of the same length`);
    }

    /**
     * Returns the lowest volume in the Melody.
     */
    minVolume(): number {
        return Math.min(...this.contents.filter(v => !v.isSilent()).map(v => v.velocity));
    }

    /**
     * Returns the highest volume in the Melody.
     */
    maxVolume(): number {
        return Math.max(...this.contents.filter(v => !v.isSilent()).map(v => v.velocity));
    }

    /**
     * Returns all durations in the Melody.
     */
    toDuration(): number[] {
        return this.contents.map(n => n.duration);
    }

    /**
     * Change all durations in this Melody to the values in the supplied Sequence.
     * Return a Melody with the required changes.
     */
    withDuration(seq: SeqIndices): this {
        return this.patchFieldValues(seq, (e, i) => e.withDuration(i));
    }

    /**
     * Returns all volumes in the Melody.
     */
    toVolume(): number[] {
        return this.contents.map(n => n.velocity);
    }

    /**
     * Change all volumes in this Melody to the values in the supplied Sequence.
     * Return a Melody with the required changes.
     */
    withVolume(seq: SeqIndices): this {
        return this.patchFieldValues(seq, (e, i) => e.withVolume(i));
    }

    /**
     * Returns all delays in the Melody.
     */
    toDelay(): number[] {
        return this.contents.map(n => n.delay);
    }

    /**
     * Change all delays in this Melody to the values in the supplied Sequence.
     * Return a Melody with the required changes.
     */
    withDelay(seq: SeqIndices): this {
        return this.patchFieldValues(seq, (e, i) => e.withDelay(i));
    }

    /**
     * Returns all offsets in the Melody.
     */
    toOffset(): number[] {
        return this.contents.map(n => n.offset);
    }

    /**
     * Change all offsets in this Melody to the values in the supplied Sequence.
     * Return a Melody with the required changes.
     */
    withOffset(seq: SeqIndices): this {
        return this.patchFieldValues(seq, (e, i) => e.withOffset(i));
    }

    /**
     * Returns all defined exact ticks in the Melody.
     */
    toExactTick(): (number | undefined)[] {
        return this.contents.map(n => n.at);
    }

    /**
     * Change all defined exact ticks in this Melody to the values in the supplied Sequence.
     * Return a Melody with the required changes.
     */
    withExactTick(seq: SeqIndices): this {
        return this.patchFieldValues(seq, (e, i) => e.withExactTick(i));
    }

    /**
     * Returns the Midi tick of the end of this Melody.
     */
    lastTick(): number {
        const events = melodyToTimedMidiBytes(this);

        return events.length ? events[events.length - 1][0] : 0;
    }

    /**
     * Returns the MIDI tick of the note on events for the Melody.
     */
    toTicks(): number[] {
        let curr = 0;

        return this.contents.map(v => {
            const tick = v.timing.startTick(curr);

            curr = v.timing.endTick(curr);

            return tick;
        });
    }

    /**
     * Returns values of this Melody, with Midi ticks added for note start.
     * 
     * Used by the canvas-drawing feature of the Score class.
     */
    toSummary(): MelodySummary {
        let curr = 0;

        return this.contents.map(v => {
            const tick = v.timing.startTick(curr);

            curr = v.timing.endTick(curr);

            return {
                tick: tick,
                pitch: v.pitches(),
                duration: v.duration,
                velocity: v.velocity
            };
        });
    }

    /**
     * Return the contents of this Melody as the bytes of a MIDI track.
     */
    toMidiTrack(): number[] {
        return melodyToMidiTrack(this);
    }

    /**
     * Return a new Melody containing this Melody, but with repeated chords
     * joined into a new chord with the combined length of the chords joined.
     *
     * Note that non-pitch data associated with the second note will be lost.
     * 
     * @example:
     * // returns melody([ { pitch: 60, duration: 96 }, { pitch: 72, duration: 144 }])
     * melody([ { pitch: 60, duration: 64 }, { pitch: 60, duration: 32 }, { pitch: 72, duration: 144 } ]).joinRepeats()
     */
    joinRepeats(): this {
        return this.joinIf((curr, next) =>
            curr.pitch.equals(next.pitch)
            && curr.offset === next.offset
            && next.delay === 0 && next.at === undefined);
    }

    /**
     * Return a new Melody containing this melody, but with chords joined into
     * a new chord with the combined length of the chords joined for any time
     * the comparator function returns true.
     *
     * Note that non-pitch data associated with the second note will be lost.
     * 
     * @example:
     * // returns melody([ { pitch: 60, duration: 96 }, { pitch: 72, duration: 144 }])
     * melody([ { pitch: 60, duration: 64 }, { pitch: 60, duration: 32 }, { pitch: 72, duration: 144 } ])
     *     .joinIf((a, b) => a.pitch.equals(b.pitch))
     */
    joinIf(fn: (curr: MelodyMember, next: MelodyMember) => boolean): this {
        if (typeof fn !== 'function') {
            throw new Error(`${this.constructor.name}.joinIf(): must supply comparator function`);
        }

        return this.replaceIfWindow(2, 1,
            ([ curr, next ]) => fn(curr, next),
            ([ curr, next ]) => curr.withDuration(curr.duration + next.duration)
        );
    }

    /**
     * Return a new Melody containing this melody, but rhythms augmented.
     */
    augmentRhythm(n: number): this {
        return this.map(e => e.augmentRhythm(n));
    }

    /**
     * Return a new Melody containing this melody, but rhythms diminished.
     */
    diminishRhythm(n: number): this {
        return this.map(e => e.diminishRhythm(n));
    }

    /**
     * Return a new Melody with meta events added before the defined positions
     * in the Melody. If any meta events already existed in these positions,
     * the new events will be placed directly after the last of them.
     * 
     * @example:
     * // sets time-signature and tempo and depresses sustain pedal immediately
     * // before notes 0 and 64, also releases sustain pedal 256 ticks later
     * myMelody.withEventsBefore([ 0, 64 ], [
     *  { event: 'time-signature', value: '3/4' },
     *  { event: 'tempo', value: 144 },
     *  { event: 'sustain', value: 1 },
     *  { event: 'sustain', value: 0, offset: 256 }
     * ])
     */
    withEventsBefore(pos: SeqIndices, events: MetaEventArg[]): this {
        return this.replaceIndices(pos, e => e.withEventsBefore(events));
    }

    /**
     * Return a new Melody with meta events added after the defined positions
     * in the Melody. If any meta events already existed in these positions,
     * the new events will be placed directly after the last of them.
     * 
     * @example:
     * // sets time-signature and tempo and depresses sustain pedal immediately
     * // after notes 31 and 95; also releases sustain pedal 256 ticks later
     * myMelody.withEventsBefore([ 31, 95 ], [
     *  { event: 'time-signature', value: '3/4' },
     *  { event: 'tempo', value: 144 },
     *  { event: 'sustain', value: 1 },
     *  { event: 'sustain', value: 0, offset: 256 }
     * ])
     */
    withEventsAfter(pos: SeqIndices, events: MetaEventArg[]): this {
        return this.replaceIndices(pos, e => e.withEventsAfter(events));
    }

    /**
     * Return a new Melody with meta events added before the defined positions
     * in the Melody. If any meta events already existed in these positions,
     * the new events will be placed directly after the last of them.
     * 
     * @example:
     * // 4-argument format: release sustain pedal 1024 ticks after note 100 begins
     * myMelody.withEventBefore([ 100 ], 'sustain', 0, { offset: 1024 })
     * 
     * // 2-argument format: release sustain pedal 1024 ticks after note 100 begins
     * myMelody.withEventBefore([ 100 ], { event: 'sustain', value: 0, offset: 1024 })
     */
    withEventBefore(pos: SeqIndices, event: string | MetaEventArg, value?: MetaEventValue, meta?: MetaEventOpts): this {
        return this.replaceIndices(pos, e => e.withEventBefore(event, value, meta));
    }

    /**
     * Return a new Melody with meta events added after the defined positions
     * in the Melody. If any meta events already existed in these positions,
     * the new events will be placed directly after the last of them.
     * 
     * @example:
     * // 4-argument format: release sustain pedal 1024 ticks after note 100 ends
     * myMelody.withEventAfter([ 100 ], 'sustain', 0, { offset: 1024 })
     * 
     * // 2-argument format: release sustain pedal 1024 ticks after note 100 ends
     * myMelody.withEventAfter([ 100 ], { event: 'sustain', value: 0, offset: 1024 })
     */
    withEventAfter(pos: SeqIndices, event: string | MetaEventArg, value?: MetaEventValue, meta?: MetaEventOpts): this {
        return this.replaceIndices(pos, e => e.withEventAfter(event, value, meta));
    }

    /**
     * Return a new Melody with delays added at the defined positions in the
     * Melody. If delays already existed in any of these positions, the new
     * delay is added to the existing one.
     */
    addDelayAt(pos: SeqIndices, val: number): this {
        return this.replaceIndices(pos, e => e.addDelay(val));
    }

    /**
     * Return a new Melody with offsets added at the defined positions in the
     * Melody. If offsets already existed in any of these positions, the new
     * offset is added to the existing one.
     */
    addOffsetAt(pos: SeqIndices, val: number): this {
        return this.replaceIndices(pos, e => e.addOffset(val));
    }

    /**
     * Return a new Melody with an exact Midi tick applied to the defined
     * positions in the Melody.
     */
    withExactTickAt(pos: SeqIndices, tick: number): this {
        return this.replaceIndices(pos, e => e.withExactTick(tick));
    }

    /**
     * Return a new Melody with a duration applied to the positions in the Melody.
     */
    withDelayAt(pos: SeqIndices, val: number): this {
        return this.replaceIndices(pos, e => e.withDelay(val));
    }

    /**
     * Return a new Melody with a duration applied to the positions in the Melody.
     */
    withOffsetAt(pos: SeqIndices, val: number): this {
        return this.replaceIndices(pos, e => e.withOffset(val));
    }

    /**
     * Return a new Melody with a duration applied to the positions in the Melody.
     */
    withDurationAt(pos: SeqIndices, val: number): this {
        return this.replaceIndices(pos, e => e.withDuration(val));
    }

    /**
     * Return a new Melody with a duration applied to the positions in the Melody.
     */
    withVolumeAt(pos: SeqIndices, val: number): this {
        return this.replaceIndices(pos, e => e.withVolume(val));
    }

    /**
     * Return a new Melody with an exact Midi tick applied to the start.
     */
    withStartTick(tick: number): this {
        return this.withExactTickAt(0, tick);
    }

    /**
     * Return a new Melody with text events added before the specified locations.
     * 
     * @example
     * // Add a generic text 64 ticks before notes 40, 80, 120
     * myMelody.withTextBefore([ 40, 80, 120 ], 'emphasise melodic line', { offset: -64 })
     * 
     * // Add a lyric at the start of note 60
     * myMelody.withTextBefore([ 60 ], 'lyric', 'merciful')
     */
    withTextBefore(pos: SeqIndices, val: string, arg2: string | MetaEventOpts = 'text', arg3?: MetaEventOpts) {
        return this.replaceIndices(pos, e => e.withTextBefore(val, arg2, arg3));
    }

    /**
     * Return a new Melody with text events added before the specified locations.
     * 
     * @example
     * // Add a generic text 64 ticks before notes 40, 80, 120 end
     * myMelody.withTextAfter([ 40, 80, 120 ], 'emphasise melodic line', { offset: -64 })
     * 
     * // Add a lyric at the end of note 60
     * myMelody.withTextAfter([ 60 ], 'lyric', 'merciful')
     */
    withTextAfter(pos: SeqIndices, val: string, arg2: string | MetaEventOpts = 'text', arg3?: MetaEventOpts) {
        return this.replaceIndices(pos, e => e.withTextAfter(val, arg2, arg3));
    }
}
