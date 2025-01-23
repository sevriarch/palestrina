# SeqMember construction

## Context

As new `SeqMember`s are created in large numbers during normal Palestrina operations, we should define how they are created and validated. It is essential that they should not be able to contain invalid types.

## Assumptions

All `SeqMember`s are frozen after construction, which guarantees that contents that are primitives (ie: `NumSeqMember` and `NoteSeqMember` contents) may not become invalid during the lifetime of the `SeqMember`. For contents that are objects, these are also frozen after construction; in the case of `MelodyMember` further nested freezing implicitly occurs and this is documented in the relevant section.

### `NumSeqMember`

Constructor sanitization converts `SeqMemberArgument` to `number` or throws an error.
- contents are a `number` and thus immutable
- hence all `NumSeqMember`s are guaranteed to contain the correct data type at all times

### `NoteSeqMember`

Constructor sanitization converts `SeqMemberArgument` to `(number | null)` or throws an error.
- contents are `(number | null)` and thus immutable
- hence all `NoteSeqMember`s are guaranteed to contain the correct data type at all times

### `ChordSeqMember`

Constructor sanitization converts `SeqMemberArgument` to `number[]` and sorts it, or throws an error.
- contents are `number[]` and are frozen separately after creation to ensure immutability
- if the passed value is `number[]` or a non-`SeqMember` object containing a field `pitch` that is of type `number[]`:
    - it is sliced to avoid any risk of freezing of a variable that the user might wish to change
    - it is also sorted to ensure consistent ordering of chords and to enable certain optimizations within `ChordSeqMember`
    - the above two steps are not performed if the passed value is a `SeqMember` object as we know it is already frozen and sorted
- hence all `ChordSeqMember`s are guaranteed to contain the correct data type at all times

### `MelodyMember`

There is no constructor sanitization in `MelodyMember`, as this entity contains five separate fields and most methods within `MelodyMember` changing at most one of these fields before creating a new `MelodyMember`. Hence constructor-level sanitization would be significantly inefficient, but the price of not performing sanitization here is that it must be performed in all methods that lead to the creation of a new `MelodyMember`.

`MelodyMember` contents are an object wtih the following fields:
- `pitch`: a `ChordSeqMember`
- `duration`: a non-negative number
- `timing`: a `Timing`
- `before`: a `MetaList`
- `after`: a `MetaList`

The constructor freezes the `MelodyMember` and its contents. Since `duration` is a primitive, and `ChordSeqMember`, `Timing` and `MetaList` all guarantee that any instances of these classes are frozen, there is no need to deep freeze its contents.

`MelodyMember`s are created by the following methods within the class:
- `MelodyMember.from()`: if the passed argument is not a `MelodyMember`; sanitization performed at this step
- Methods modifying only `pitch` (which is a `ChordSeqMember`):
    - `.setPitches()`: type is guaranteed via use of `ChordSeqMember.from()`
    - `.mapPitches()`: type is guaranteed via use of `pitch.mapPitches()`
    - Pitch mutator methods: type is guaranteed via use of `.mapPitches()`
- Methods modifying `velocity`:
    - `.withVolume()`: type is guaranteed via validation
- Methods modifying `timing`:
    - `.withDuration()`: type is guaranteed via use of `Timing.withDuration()`
    - `.withExactTick()`: type is guaranteed via use of `Timing.withExactTick()`
    - `.withOffset()`, `.addOffset()`: type is guaranteed via use of `Timing.withOffset()`
    - `.withDelay()`, `.addDelay()`: type is guaranteed via use of `Timing.withDelay()`
- Methods modifying `before`:
    - `.withTextBefore()`, `.withEventBefore()`, `.withEventsBefore()`: type and freezing is guaranteed via related `MetaList` methods.
- Methods modifying `after`:
    - `.withTextAfter()`, `.withEventAfter()`, `.withEventsAfter()`: type and freezing is guaranteed via related `MetaList` methods.
- Methods modifying multiple fields:
    - `.augmentRhythm()`, `.diminishRhythm()`: type for `timing`, `before` and `after` guaranteed via validation and via `Timing` and `MetaList` methods.

Hence all `MelodyMember`s are guaranteed to contain the correct data type at all times.

## Implications

As long as the implementation remains like this, we can assume that all `SeqMember`s are immutable and contain the correct data type at all times. This enables optimizations and simplifications.

## Notes

As the nature of pitch validation is a property of the containing `Sequence`, not of the individual `SeqMember`, pitch validation beyond confirmation that data is of the correct type is performed on construction of the parent Sequence and is not visible to any type of `SeqMember`.

Pitch mutator methods are `.silence()`, `.invert()`, `.transpose()`, `.augment()`, `.diminish()`, `.mod()`, `.trim()`, `.bounce()`, `.scale()`, `.gamut()`.
- All of these methods guarantee mutation from number to number [TODO: check gamut]
- All of these methods work via `.mapPitches()`, which provides a duplicate type validation
