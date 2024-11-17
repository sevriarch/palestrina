# Implement extendable Collection class

## Status

Accepted

## Context

There are three types of entity in Palestrina--`Sequence`s, `Score`s and `MetaList`s--which are essentially containers for arrays, containing some very similar functionality. Because they have been developed separately, they have multiple different ways and syntaxes for accomplishing similar tasks.

In addition, the `Sequence` object is also extremely large and could benefit from being split up for readability.

## Decision

- `Sequence` logic that is generic in nature shall be extracted into a `Collection` object where it can be reused by `Score`s and `MetaList`s
- Because `Sequence`s and `Score`s require metadata and `MetaList`s do not require metadata, two different versions of the `Collection` class will be produced:
  - One without metadata
  - One with metadata, extended from the class without metadata
  - The existing metadata class can then be retired

## Consequences

- Code and functionality duplications can be removed
- Some rewriting will be required where the removal of duplication changes interfaces
- The `Sequence` object will be reduced to a more manageable size and may not require further splitting up
- Metadata implementatinos in `Sequence` and `Score` will require less indirection
