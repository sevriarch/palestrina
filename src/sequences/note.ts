import type { SeqArgument, SeqMemberArgument, MetadataData, ISingleValuedSequence } from '../types';

import Sequence from './generic';
import NoteSeqMember from './members/note';

import { xorshift } from '../imports/imports';

/**
 * Class representing a Sequence of {@link NoteSeqMember}s, each of which contains a number or a null value.
 */
export default class NoteSeq extends Sequence<NoteSeqMember> implements ISingleValuedSequence<NoteSeqMember> {
    static from(v: SeqArgument, metadata?: MetadataData) {
        return Sequence.build(NoteSeq, NoteSeqMember, v, metadata);
    }

    protected constructMember(v: SeqMemberArgument): NoteSeqMember {
        return NoteSeqMember.from(v);
    }

    protected diffornull(ev1: NoteSeqMember, ev2: NoteSeqMember): number | null {
        const val1 = ev1.val();
        const val2 = ev2.val();

        return (val1 === null || val2 === null) ? null : val1 - val2;
    }

    protected greaterornull(ev1: NoteSeqMember, ev2: NoteSeqMember): boolean {
        const val1 = ev1.val();
        const val2 = ev2.val();

        return val1 !== null && val2 !== null && val1 > val2;
    }

    /*
     * CREATION OF RELATED SERIES
     */

    /**
     * Return a Sequence containing pseudorandom density based on the values in
     * this sequence. The two integer parameters are the value required to
     * guarantee a value of zero and the value required to guarantee a value
     * of one. An optional PRNG seed for the xorshift function may be passed.
     */
    density(zeroval: number, oneval: number, seed?: number): this {
        const gradient = oneval - zeroval;
        const random = xorshift(this.length, Math.abs(gradient), seed);
        const round = gradient >= 0
            ? (v: number) => v < 1 ? 0 : 1
            : (v: number) => v > 0 ? 1 : 0;

        return this.map((v, i) =>
            v.mapPitches(p => round((p - zeroval + random[i]) / gradient))
        );
    }

    /**
     * Return a NoteSeq containing the differences between consecutive values
     * in this Sequence. If either value is null, deltas are also null.
     * 
     * @example
     * // returns noteseq([ null, -2, 3, -1, null, null, 5 ])
     * noteseq([ null, 1, -1, 2, 1, null, -2, 3 ]).deltas()
     */
    deltas(): this {
        return this.drop().combineDiff(this.dropRight());
    }

    /**
     * Return a NoteSeq containing running totals of the values in the current one.
     * 
     * @example
     * // returns noteseq([ 0, 1, 0, 2, 3, 3, 1, 4 ])
     * noteseq([ null, 1, -1, 2, 1, null, -2, 3 ]).runningTota()
     */
    runningTotal(): this {
        let curr = 0;

        return this.map(v => {
            const val = v.val();

            if (val !== null) {
                curr += val;
            }

            return v.setPitches(curr);
        });
    }

    /*
     * COMBINING MANY SERIES INTO ONE
     */

    /**
     * Combines this sequence with the passed NoteSeqs by taking values from
     * all and summing them. Null values are ignored, though if every value is
     * null, the sum will be null.
     * Throws an exception if the NoteSeqs are not the same length.
     * 
     * @example
     * // Returns noteseq([ 6, 11, 16 ])
     * noteseq([ 1, 4, 7 ]).combineSum(noteseq([ 2, 5, 8 ]), noteseq([ 3, 2, 1 ]))
     */
    combineSum(...seq: this[]): this {
        return this.combine((...v) => {
            const vals = v.filter(val => val.val() !== null);
            let pitch: number | null;

            if (vals.length) {
                pitch = vals.reduce((tot, val) => (val.val() as number) + tot, 0);
            } else {
                pitch = null;
            }

            return v[0].setPitches(pitch);
        }, ...seq);
    }

    /**
     * Combines this sequence with the passed NoteSeqs by taking values from
     * all and returning the product of the values. Null values are ignored,
     * though if every value is null, the product will be null.
     * Throws an exception if the NoteSeqs are not the same length.
     * 
     * @example
     * // Returns noteseq([ 6, 40, 56 ])
     * noteseq([ 1, 4, 7 ]).combineProduct(noteseq([ 2, 5, 8 ]), noteseq([ 3, 2, 1 ]))
     */
    combineProduct(...seq: this[]): this {
        return this.combine((...v) => {
            const vals = v.filter(val => val.val() !== null);
            let pitch: number | null;

            if (vals.length) {
                pitch = vals.reduce((tot, val) => (val.val() as number) * tot, 1);
            } else {
                pitch = null;
            }

            return v[0].setPitches(pitch);
        }, ...seq);
    }

    /**
     * Combines this sequence with the passed NoteSeq by taking values from
     * both and returning the difference. If either value is null, the combination
     * will also be null.
     * Throws an exception if the two NoteSeqs are not the same length.
     * 
     * @example
     * // Returns noteseq([ -2, 2, 6 ])
     * noteseq([ 1, 4, 7 ]).combineDiff(noteseq([ 3, 2, 1 ]))
     */
    combineDiff(seq: this): this {
        return this.combine((a, b) => a.setPitches(this.diffornull(a, b)), seq);
    }

    /*
     * TAKING MULTIPLE SERIES, RETURNING MULTIPLE SERIES
     */

    /**
     * Swap values between the this NoteSeq and the passed one. Creates two
     * new NoteSeqs, the first with the higher values and the second with
     * the lower ones. Do not swap if either value is null.
     * 
     * @example
     * // Returns [ noteseq([ 3, 4, 7 ]), noteseq([ 1, 2, 1 ])
     * noteseq([ 1, 4, 7 ]).exchangeValuesDecreasing(noteseq([ 3, 2, 1 ]))
     * Throws an exception if the two NoteSeqs are not the same length.
     */
    exchangeValuesDecreasing(seq: this): [ this, this ] {
        return this.exchangeValuesIf((a, b) => this.greaterornull(b, a), seq);
    }

    /**
     * Swap values between the this NoteSeq and the passed one. Creates two
     * new NoteSeqs, the first with the lower values and the second with
     * the higher ones. Do not swap if either value is null.
     * Throws an exception if the two NoteSeqs are not the same length.
     * 
     * @example
     * // Returns [ noteseq([ 1, 2, 1 ]), noteseq([ 3, 4, 7 ])
     * noteseq([ 1, 4, 7 ]).exchangeValuesIncreasing(noteseq([ 3, 2, 1 ]))
     * Throws an exception if the two NoteSeqs are not the same length.
     */
    exchangeValuesIncreasing(seq: this): [ this, this ] {
        return this.exchangeValuesIf((a, b) => this.greaterornull(a, b), seq);
    }
}
