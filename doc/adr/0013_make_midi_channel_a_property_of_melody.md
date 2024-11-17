# MIDI channel will be a property of Melodies, not individual notes

## Status

Accepted

## Context

The MIDI standard allows the use of multiple different channels in a single track to permit switching between instruments or other parameters within that track, but the primary target of this software (Sibelius) does not.

Sibelius' MIDI channel logic is as follows:
- If all note events in a track are assigned to the same channel, assign everything in the Sibelius track to that channel.
- Otherwise assign everything in the Sibelius track to channel 1.

Hence, while we can use multiple channels within a single track, it will have no impact on Sibelius. In addition, all behaviour that can be implemented via multiple channels in a single track can be implemented using multiple tracks.

## Decision

- MIDI channel should be a property of a `Melody`, not individual members of that entity as currently.
- This can be implemented using `Collection` metadata.

## Consequences

- Significant amounts of logic related to channels can be removed.
- MIDI generation will have to take the channel parameter from the `Melody` metadata rather than from individual events.
