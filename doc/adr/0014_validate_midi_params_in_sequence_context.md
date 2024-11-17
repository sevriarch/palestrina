# Validate MIDI parameters in a Sequence context

## Status

Accepted

## Context

MIDI parameters need to be validated before creating a MIDI file. In the current workflow, there are two obvious places to do this validation: when converting from a Melody to an array of MIDI events, and when converting from the MIDI events to a MIDI file.

While the latter option may be easier to implement, from an end-user perspective, the former option is clearly superior, as any errors are easier to relate to an entity closer which the end user has created.

## Decision

At all times, MIDI validation is done when creating an individual MIDI event, not when converting that event into MIDI bytes.

## Consequences

- It will be easier for end users to understand where invalid MIDI parameters come from.
- Some rewriting of validation will be required.
