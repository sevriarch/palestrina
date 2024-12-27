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
| MetaEvent | A container for an object defining some non-note-related action within a Sequence (eg: tempo change, pedal being depressed, text in a score); includes supported MIDI meta-events and channel events |
| Metadata | A container for associated metadata related to an entity. See [types.ts](../src/types.ts) for possible metadata fields |
| Scale | An array of numbers indicating a scale or a string corresponding to this array, eg: a major scale is [ 0, 2, 4, 5, 7, 9, 11 ] |
| Gamut | A group of notes to distribute values into (the term stolen largely from Cage) |
| MidiEvent | An event in the MIDI standard (is not exposed to end users) |

## Properties of entities

| Term | Meaning |
|---|---|
| Pitch | A null, number or array of numbers representing a pitch: 60 corresponds to middle C as with the MIDI pitch standard; numbers will be integers for a non-microtonal composition but can be floating point numbers for microtonal compositions |
| Volume | A number indicating the volume of the entity or its members |
| Timing | A collection of temporal data (see below) associated with the entity |

## Temporal data

This is data that helps define the position in time of an entity. Normally this would be calculated based on what came before in the sequence, but temporal data indicates when that is insufficient and other operations must be applied. SequenceMembers contain all of these properties, Metadata and MetaEvents contain only ExactTick and Offset.

| Term | Meaning |
|---|---|
| ExactTick | A non-negative integer indicating an exact tick that should be applied to this member and (in a Sequence) to which subsequent members should be resynced to |
| Offset | An integer indicating a delta in tick that should only be applied to this member |
| Delay | An integer indicating a delta in tick that should also be applied to subsequent members |
| Duration | A non-negative integer indication the duration of a note, silence or chord |

## Method prefixes

In many cases method names will begin with one of these prefixes, indicating the type of operation they provide.

| Term | Meaning |
|---|---|
| .to | Convert to a new entity of the specified type |
| .is | Return a boolean determining if an entity is the specified type |
| .insert | Return a new entity with member(s) inserted in appropriate locations |
| .find | Find matching member(s), return their indices |
| .replace | Replace matching entities with an entity of a similar type |
| .map | A map operation on the contents of an entity that returns a new entity |
| .flatMap | A map operation on the contents of an entity that flattens the results of the map and returns a new entity |
| .filter | A filter operation on the contents of an entity that returns a new entity |
| .partition | A partition operation on the contents of an entity that returns two new entities |
| .groupBy | A group by operation on the contents of an entity that returns a string-to-entity map |
| .with | Return a new entity with a property added (or replaced) |
| .combine | Return new collection(s) combining data from the current one and those passed as an argument |
| .add | Return a new entity with modified existing numeric values |
| .append | Return a collection with new entities added at the end |
| .prepend | Return a collection with new entities added at the beginning |

## Locations within a Collection or Sequence

| Term | Meaning |
|---|---|
| At | At a specific location(s) |
| Before | Directly before specific location(s) |
| After | Directly after specific location(s) |
| Indices | At a specific index or indices |
| Left | Operation begins at the start of the Collection (typically implicit rather than explicit, eg in: .pad or .keep methods) |
| Right | Operation begins at the end of the Collection |
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
