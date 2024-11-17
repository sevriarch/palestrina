# What is a replacer?

A replacer is a generic concept in `Collections` and `Sequences` which denotes a replacement for an existing value, values, `Collection` or `Sequence`.

In Collections it can take the following forms:
- a value that could be a member of the Collection; `CollectionMember`.
- an array of values that could be members of the Collection `CollectionMember[]`.
- a `Collection`.
- a method returning any of the three above possibilities; arguments to the method representing an existing value or values and an index within the `Collection`

In `Sequence`s it can take the following forms:
- a value that could be a member of the `Sequence`; `SeqMember`.
- a value that could be used to contruct a member of the `Sequence` using `Sequence.constructMember()`; `SeqMemberArgument`.
- an array of values that could be members of the `Sequence` or used to construct members; `SeqMemberArgument[]`.
- a `Sequence`.
- a method taking in current values and returning any of the four values above, or a `Collection`/`Sequence`:
- a method returning any of the four above possibilities; arguments to the method representing an existing values or values and an index within the `Sequence`.

Replacers are used in the following `Collection`/`Sequence` methods:
| Method | Replacer Method Argument |
|---|---|
| insertBefore() | Single value |
| insertAfter() | Single value |
| replaceIndices() | Single value |
| replaceFirstIndex() | Single value |
| replaceLastIndex() | Single value |
| replaceIf() | Single value |
| replaceNth() | Single value |
| replaceSlice() | `Collection` or `Sequence` |
| replaceIfWindow() | Array of values |
| replaceIfReverseWindow() | Array of values |
