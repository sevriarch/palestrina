# A brief list of the terms used within this software

Any entity with a non-trivial meaning should be briefly listed in this dictionary so as to easily clarify its meaning.

This is not an exhaustive list, but anything beneficial to add to it should be added.

## Collections

These entities are children of the Collection class, which is a container for an array of values.

| Term | Meaning |
|---|---|
| Collection | A container for an array of members whose value type is unspecified |
| Sequence | A container for an array of members that has musical meaning in itself (numbers, nullable numbers, arrays of numbers, array of numbers with metadata) |
| Score | A container for an array of Melodies (Sequences where the members are arrays of pitches plus metadata) |
| MetaList | A container for an array of MetaEvents (metadata associated with either the beginning or the end of a Sequence, Sequence member or Score) |

## Other Entities 

| Term | Meaning |
|---|---|
| SequenceMember | A container for a single member of a Sequence (number, nullable number, array of numbers, array of numbers plus metadata) |
| MetaEvent | A container for an object defining some non-note-related action within a Sequence (eg: tempo change, pedal being depressed, text in a score); roughly corresponds to meta-events in MIDI |
| Metadata | A container for associated metadata related to an entity. See types.ts for possible metadata fields |
| Scale | An array of numbers indicating a scale or a string corresponding to this array, eg: major scale is [ 0, 2, 4, 5, 7, 9, 11 ] |
| Gamut | A group of notes to distribute values into (the term stolen largely from Cage) |
| MidiEvent | An event in the MIDI standard |

## Properties of entities

| Term | Meaning |
|---|---|
| Pitch | A null, number or array of numbers representing a pitch: 60 corresponds to middle C as with the MIDI pitch standard |
| Rhythm | A number indicating the duration of the entity or its members |
| Volume | A number indicating the volume of the entity or its members |

## Temporal data

This is data that helps define the position in time of an entity. Normally this would be calculated based on what came before in the sequence, but temporal data indicates when that is insufficient and other operations must be applied.

| Term | Meaning |
|---|---|
| Offset | A number indicating a delta in tick that should only be applied to this member |
| Delay | A number indicating a delta in tick that should also be applied to subsequent members |
| ExactTick | A number indicating an exact tick that should be applied to this members and which subsequent members should be resynced to |

## Types of method

| Term | Meaning |
|---|---|
| to() | Convert to a new entity of the specified type |
| is() | Return a boolean determining if an entity is the specified type |
| insert() | Return a new entity with members inserted before in appropriate locations |
| findIf() | Find matching members, return their indices |
| replace() | Replace matching entities with an entity of a similar type |
| map() | A map operation on the contents of an entity that returns a new entity |
| filter() | A filter operation on the contents of an entity that returns a new entity |
| partition() | A partition operation on the contents of an entity that returns two new entities |
| groupBy() | A group by operation on the contents of an entity that returns a string-to-entity map |
| with() | Return a new entity with a property added |
| combine() | Return new collections combining data from those passed |
| patch() | Return a new entity with modified existing values |
| add() | Return a new entity with modified existing numeric values |

## Locations within a Collection or Sequence

| Term | Meaning |
|---|---|
| Before | Directly before a specific location |
| At | At a specific location or location; can also be referred to using Indices |
| After | Directly after a specific location |
| Left | Typically implicit rather than explicit (eg in: pad() or keep()), but operate starting from beginning of Collection |
| Right | Operate starting from end of Collection |
| First | The first matching location |
| Last | The last matching location |

## Matchers that act on a Collection or Sequence

| Term | Meaning |
|---|---|
| If | A matcher operating on each member in turn |
| IfWindow | A matcher operating using a left-to-right sliding window |
| IfReverseWindow | A matcher operating using a right-to-left sliding window |
| Nth | A matcher matching every N members |
| Slice | A matcher matching a slice of a Collection or Sequence |
