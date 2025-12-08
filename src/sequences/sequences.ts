// Wrapper module around all types of Sequence that ensures they provide intra-Sequence
// conversion methods. If new types of Sequence are added, they must be inserted here too.
//
// This prevents issues with circular imports.

import NumSeq from './number';
import NoteSeq from './note';
import ChordSeq from './chord';
import Melody from './melody';

import Registry from '../registry/registry';

Registry.set_numseq_from_method(NumSeq.from);
Registry.set_noteseq_from_method(NoteSeq.from);
Registry.set_chordseq_from_method(ChordSeq.from);
Registry.set_melody_from_method(Melody.from);

// Alternate non-registry implementation would use something analogous to a mixin for this.

//for (const c of [ NumSeq, NoteSeq, ChordSeq, Melody ]) {
//    c.prototype.toNumSeq = () => NumSeq.from(this.contents, this.metadata);
//}

// Re-export classes. If imported from here this guarantees that these classes will provide
// intra-class conversion methods.
export { NumSeq, NoteSeq, ChordSeq, Melody };