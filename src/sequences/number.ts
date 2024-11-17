import type { SeqArgument, SeqMemberArgument, MetadataData, ISingleValuedSequence } from '../types';

import Sequence from './generic';
import NumSeqMember from './members/number';

import { xorshift } from '../imports/imports';

/**
 * Class representing a Sequence of {@link NumSeqMember}s, each of which contains a numeric value.
 */
export default class NumSeq extends Sequence<NumSeqMember> implements ISingleValuedSequence<NumSeqMember> {
    static from(v: SeqArgument, metadata?: MetadataData) {
        return Sequence.build(NumSeq, NumSeqMember, v, metadata);
    }

    protected constructMember(v: SeqMemberArgument): NumSeqMember {
        return NumSeqMember.from(v);
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

        return this.map((v, i) => v.mapPitches(p => round((p - zeroval + random[i]) / gradient)));
    }

    /**
     * Return a NumSeq containing the differences between consecutive values
     * in this NumSeq.
     * 
     * @example
     * // Returns numseq([ 1, -2, 3, -1, -1, -2, 5 ])
     * numseq([ 0, 1, -1, 2, 1, 0, -2, 3 ]).deltas()
     */
    deltas(): this {
        return this.drop().combineDiff(this.dropRight());
    }

    /**
     * Return a NumSeq containing running totals of the values in the current one.
     * 
     * @example
     * // Returns numseq([ 0, 1, 0, 2, 3, 3, 1, 4 ])
     * numseq([ 0, 1, -1, 2, 1, 0, -2, 3 ]).runningTotal()
     */
    runningTotal(): this {
        let curr = 0;

        return this.map(v => {
            curr += v.val();
            return v.setPitches(curr);
        });
    }

    /*
     * COMBINING MANY SERIES INTO ONE
     */

    /**
     * Combines this sequence with the passed NumSeqs by taking values from
     * all and summing them.
     * Throws an exception if the NumSeqs are not the same length.
     * 
     * @example
     * // Returns numseq([ 6, 11, 16 ])
     * numseq([ 1, 4, 7 ]).combineSum(numseq([ 2, 5, 8 ]), numseq([ 3, 2, 1 ]))
     */
    combineSum(...seq: this[]): this {
        return this.combine((...v) => v[0].setPitches(v.reduce((tot, val) => val.val() + tot, 0)), ...seq);
    }

    /**
     * Combines this sequence with the passed NumSeqs by taking values from
     * all and returning the product of the values. Null values are ignored,
     * though if every value is null, the product will be null.
     * Throws an exception if the NumSeqs are not the same length.
     * 
     * @example
     * // Returns numseq([ 6, 40, 56 ])
     * numseq([ 1, 4, 7 ]).combineProduct(numseq([ 2, 5, 8 ]), numseq([ 3, 2, 1 ]))
     */
    combineProduct(...seq: this[]): this {
        return this.combine((...v) => v[0].setPitches(v.reduce((tot, val) => val.val() * tot, 1)), ...seq);
    }

    /**
     * Combines this sequence with the passed NumSeq by taking values from
     * both and returning the difference.
     * Throws an exception if the two NumSeqs are not the same length.
     * 
     * @example
     * // Returns numseq([ -2, 2, 6 ])
     * numseq([ 1, 4, 7 ]).combineDiff(numseq([ 3, 2, 1 ]))
     */
    combineDiff(seq: this): this {
        return this.combine((a, b) => a.setPitches(a.val() - b.val()), seq);
    }

    /*
     * TAKING MULTIPLE SERIES, RETURNING MULTIPLE SERIES
     */

    /**
     * Swap values between the this NumSeq and the passed one. Creates two
     * new NumSeqs, the first with the higher values and the second with
     * the lower ones.
     * Throws an exception if the two NumSeqs are not the same length.
     * 
     * @example
     * // Returns [ numseq([ 3, 4, 7 ]), numseq([ 1, 2, 1 ])
     * numseq([ 1, 4, 7 ]).exchangeValuesDecreasing(numseq([ 3, 2, 1 ]))
     */
    exchangeValuesDecreasing(seq: this): [ this, this ] {
        return this.exchangeValuesIf((a, b) => b.val() > a.val(), seq);
    }

    /**
     * Swap values between the this NumSeq and the passed one. Creates two
     * new NumSeqs, the first with the lower values and the second with
     * the higher ones.
     * Throws an exception if the two NumSeqs are not the same length.
     * 
     * @example
     * // Returns [ numseq([ 1, 2, 1 ]), numseq([ 3, 4, 7 ])
     * numseq([ 1, 4, 7 ]).exchangeValuesIncreasing(numseq([ 3, 2, 1 ]))
     */
    exchangeValuesIncreasing(seq: this): [ this, this ] {
        return this.exchangeValuesIf((a, b) => a.val() > b.val(), seq);
    }
}
