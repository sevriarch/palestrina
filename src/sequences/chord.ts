import type { SeqMemberArgument, ISequence, SeqArgument, Metadata } from '../types';

import Sequence from './base';
import ChordSeqMember from './members/chord';

/**
 * Class representing a Sequence of {@link ChordSeqMember}s, each of which contains an array of zero or more numbers.
 */
export default class ChordSeq extends Sequence<ChordSeqMember> implements ISequence<ChordSeqMember> {
    static from(v: SeqArgument, metadata?: Metadata) {
        return Sequence.build(ChordSeq, ChordSeqMember, v, metadata);
    }

    protected constructMember(v: SeqMemberArgument): ChordSeqMember {
        return ChordSeqMember.from(v);
    }
}
