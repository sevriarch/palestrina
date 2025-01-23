# Pitches and Pitch Construction

## Context

In order to keep design simple and consistent, it is necessary to define clearly how we can supply pitches to objects consuming them with an appropriate level of flexibility and consistency.

## Assumption

Different `Sequence`s contain different type of pitches/values.

|`Sequence`|Pitch Type|Member Contents|Notes|
|---|---|---|---|
|`NumSeq`|`number`|`number`|Could also be considered as a sequence of numbers|
|`NoteSeq`|`(number \| null)`|`(number \| null)`|
|`ChordSeq`|`number[]`|`number[]`|
|`Melody`|`number[]`|`MelodyMemberData`|Also contains volume, timing information and meta-events|

In order to ensure that the contents of one type of `Sequence` are interoperable with other `Sequences`, the following arguments that can be used to create `SeqMember`s.

|Value|Meaning|
|---|---|
|`null`|zero pitches|
|`number`|one pitch|
|`number[]`|zero or more pitches|
|`MelodyMemberData`|zero or more pitches, plus related metadata|
|`NumSeqMember`|one pitch|
|`NoteSeqMember`|zero or one pitches|
|`ChordSeqMember`|zero or more pitches|
|`MelodyMember`|zero or more pitches, plus related metadata|

## Implications

All methods returning a new `SeqMember` of a known type can accept any of the above values as an argument with a clear and unambiguous meaning, as defined in the table below.

|Argument \\ Member Type|`NumSeqMember`|`NoteSeqMember`|`ChordSeqMember`|`MelodyMember`|
|---|---|---|---|---|
|null|Error|`null`|`[]`|`[]`|
|number|number|number|`[ number ]`|`[ number ]`|
|number[]|<ul><li>if length is 1, `number`<li>else Error</li></ul>|<ul><li>if length is 0, `null`</li><li>if length is 1, `number`</li><li>else Error</li></ul>|`number[]`|`number[]`|
|`SeqMember`|`m.numericValue()`|`m.nullableNumericValue()`|`m.numericValues()`|`m.numericValues()`|

If the argument is of `MelodyMemberData` type, pitch value is extracted from the `pitch` field and&mdash;if a `MelodyMember` is being created&mdash;the other fields are used to construct the related metadata.

This can be applied to concepts such as `Replacer`s to determine their required behaviour.
