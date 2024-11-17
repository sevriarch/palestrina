# Define the correspondance between meta-events and metadata

## Status
Accepted

## Context
The MIDI standard, which Palestrina chooses to implement as its form of writing audio data to and reading audio data from files, largely elides the difference between track-level metadata and individual meta-events that might indicate track-level metadata or a change/effect inside an individual track.

In order to more correctly identify the correct implementation, a distinction should be made for any relevant meta-events in the MIDI standard, plus metadata within it.

## Decision
We will treat meta-events as follows:
- Metadata or Event: tempo, key-signature, signature
- Only Metadata: instrument, copyright, track-name
- Only Event: text, lyric, marker, cue-point, volume, pan, balance, pitch-bend

There is one case of ambiguity not solved by this table; that of the situation when a meta-event being read from a MIDI file could represent metadata or an event within the track. In this case we will presume that it should be treated as metadata if it is placed at the first tick of the track, and an event within the track if it is placed elsewhere.

## Consequences
- Meta-events that can be metadata will be available in all collections with metadata.
- Meta-events that can be track events will be available in Melodies and MelodyMembers.
- We can define a process for converting metadata from a Melody into Meta-events within a MIDI file.
- We can define a process for converting meta-events from a MIDI file into metadata and track events and implement it through MetaLists.
