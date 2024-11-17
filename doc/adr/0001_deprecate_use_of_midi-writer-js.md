# Deprecate use of midi-writer-js

## Status

Accepted

## Context

We have used the `midi-writer-js` library thus far for creating MIDI files. However, this library has some quirks in behaviour, and working with it has resulted in significant additional complexity in the workflows as its behaviour is not entirely consistent with how Palestrina works.

## Decision

- We will deprecate the use of `midi-writer-js` in Palestrina and replace it with our own midi-reading/writing logic.

## Consequences

- Additional midi-writer library code is required
- Logic that creates additional indirection can be removed
- We have one fewer direct dependency in the library
