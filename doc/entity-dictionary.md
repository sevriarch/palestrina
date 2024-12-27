This document lists entities within Palestrina.

## Implemented as classes

| Entity | Parent Entity | Description | Contains |
|---|---|---|---|
| Collection | - | Generic container for an array of contents of a generic type | Contents<Type>[], optionally Metadata |
| Sequence | Collection | Generic container for an array of contents of a generic type | SequenceMember<Type>[], Metadata |
| Score | Collection | Contains a musical composition | Melody[], Metadata |
| Melody | Sequence | Contains a track from a musical composition | MelodyMember[], Metadata |
| ChordSeq | Sequence | Contains a series of chords | ChordSeqMember[], Metadata |
| NoteSeq | Sequence | Contains a series of notes or silences | NoteSeqMember[], Metadata |
| NumSeq | Sequence | Contains a series of numbers | NumSeqMember[], Metadata |
| SeqMember | - | Generic container for data of a generic type | Data<Type> |
| MelodyMember | SequenceMember | Contains a note or chord within a Melody | ChordSeqMember, velocity, Timing, 2 MetaLists (before, after ) |
| ChordSeqMember | SequenceMember | Contains a chord | number[] |
| NoteSeqMember | SequenceMember | Contains a note or silence | number | null |
| NumSeqMember | SequenceMember | Contains a number | number |
| Metadata | - | Contains metadata (within a Collection) | Metadata k/v pairs, including a MetaList |
| MetaList | Collection | Contains a series of non-pitch events | MetaEvent[] |
| MetaEvent | - | Contains a non-pitch event (text, or change of some sort) | Event, value, Timing |
| Timing | - | Determines offset/exact position of an event in time | exact, offset, delay, duration |
| Validator | - | An object that provides pitch validation for a Sequence | validation method, boolean noop flag |

## Not implemented as classes
| Entity | Description | Value |
|---|---|---|
| Pitch | A representation of a zero or more pitches | null \| number \| number[] |
| Pitch Mutator | A method that changes a pitch into a different pitch | (pitch: number \| null) => number \| null |
| Pitch Bend | A representation of how MIDI simulates microtonal pitches | integer (in Palestrina); two 8-bit integers (in MIDI) |
| Volume | Representation of volume | number (integer between 0 and 127) |
| Key Signature | Key signature | one or two character string of appropriate format (in Palestrina); two 8-bit integers (in MIDI) |
| Time Signature | Time signature | string of format "{int}/{int}" (in Palestrina); 2 8-bit integers (in MIDI) |
| Tempo | The tempo of a piece of music | number (in Palestrina); 2 8-bit integers (in MIDI) |
| Instrument | Indicates an instrument | string (in Palestrina); 8-bit integer (in MIDI) |
| Text | Text to include in a score | string |
| Midi Channel | A number representing the MIDI channel a note appears on (10 = percussion, others non-percussion) | 4-bit integer |
| Ticks per Quarter | A number representing how many MIDI ticks occur per quarter note | integer (in Palestrina); two 8-bit integers (in MIDI) |
| Canvas | A visual representation of a Score as an HTML canvas | HTML, JavaScript code |
| Canvas Options | An object configuring canvas generation for visualising music | CanvasOpts |
| Score Canvas Options | An object configuring canvas generation for visualising a Score | ScoreCanvasOpts |
| Replacer | A value, object or method representing the replacement for an existing value within a Sequence | Replacer<TFrom, TTo> |
