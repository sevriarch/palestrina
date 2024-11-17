import type { NumSeq, NoteSeq, ChordSeq, Melody, SeqArgument, MetadataData } from '../types';

type NumSeqFrom = (members: SeqArgument, metadata?: MetadataData) => NumSeq;
type NoteSeqFrom = (members: SeqArgument, metadata?: MetadataData) => NoteSeq;
type ChordSeqFrom = (members: SeqArgument, metadata?: MetadataData) => ChordSeq;
type MelodyFrom = (members: SeqArgument, metadata?: MetadataData) => Melody;

let numseq_method: NumSeqFrom;
let noteseq_method: NoteSeqFrom;
let chordseq_method: ChordSeqFrom;
let melody_method: MelodyFrom;

const counters: Record<string, number> = {};

/** @hidden */
export default class Registry {
    static set_numseq_from_method(val: NumSeqFrom) {
        numseq_method = val;
    }

    static set_noteseq_from_method(val: NoteSeqFrom) {
        noteseq_method = val;
    }

    static set_chordseq_from_method(val: ChordSeqFrom) {
        chordseq_method = val;
    }

    static set_melody_from_method(val: MelodyFrom) {
        melody_method = val;
    }

    static get numseq_from_method() { return numseq_method; }
    static get noteseq_from_method() { return noteseq_method; }
    static get chordseq_from_method() { return chordseq_method; }
    static get melody_from_method() { return melody_method; }

    static inc(str: string) {
        if (counters[str]) {
            counters[str]++;
        } else {
            counters[str] = 1;
        }
    }

    static get counters() { return counters; }
}