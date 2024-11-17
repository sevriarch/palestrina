# Do not collapse current Sequence types into a single implementation.

## Status

Accepted

## Context

The current implementation offers four different types of Sequence:
- `NumSeq` containing only numbers
- `NoteSeq` containing numbers or nulls
- `ChordSeq` containing arrays of numbers
- `Melody` containing objects including an array of numbers plus metadata

This adds complexity to the implementation, and it would be helpful if we could reduce this complexity, for example: by collapsing the first three types into a single entity or by including metadata with all Sequence types.

Accordingly, I did performance testing of the impact of the difference between single-valued, multi-valued and multi-valued-with-metadata sequences containing only numbers to see how different the performance of these was on common Sequence operations. This showed that multi-valued sequences are roughly 35-40% slower than single-valued sequences for common operations, and that these operations are roughly 220% slower if you include metadata in the sequence.

## Decision

- We should continue to separate Sequences with metadata from those without metadata for performance reasons.
- There is more of a case for collapsing multi-valued and single-valued Seqences into a single entity, but it will still incur a significant performance hit.
 - Hence there is probably not a strong case for doing this now.
 - We may wish to revisit this later after possible optimisations and changes.

## Consequences

- No major simplifications will be executed at this point in time.
