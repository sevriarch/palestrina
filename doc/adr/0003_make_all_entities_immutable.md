# Make all entities immutable

## Status

Accepted

## Context

There are many potential traps for the end-user within this software that are a result of entities being mutable.

Example:
```
// This reverses the order of pitches within chords in the original sequence
const seq = chordseq(...);
const newseq = seq.mapPitches(pitches => pitches.reverse());
```

The only safe solution to issues with action at a distance is to make entities immutable.

## Decision

- We will make all entities within Palestrina immutable.

## Consequences

- We must implement and test immutable in all entities that the end user may be expected to access.
- The score entity must be rewritten to some extent as it is currently immutable.
- Entities that the end user attempts to modify will throw errors in some cases.
- Some additional complexity will result from this, particularly in entity creation.
- Making entities immutable will cause some reduction in performance. Testing suggests this reduction is around 10% for operations on `NumSeq`, `NoteSeq` and `Melody`, and around 30% for operations on `ChordSeq`.
