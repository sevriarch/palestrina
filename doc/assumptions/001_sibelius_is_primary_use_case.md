# Interfacing with Sibelius via MIDI files is the primary audio use case

## Context

Since this software is initially being developed for a single user (myself) it makes sense to initially implement file reading and writing based on the software that will be used. In this case the initial use case is to write output to and read output from the Sibelius composition software, but it would be useful to have this more flexible.

## Assumption

File operations will be performed in MIDI type 1 format as this is supported by Sibelius and all major composition software. However, as support is not complete, the initial version of Palestrina does not need to support features not available in Sibelius. See the notes section at the bottom of this document for details of relevant incomplete support.

## Implications

- Software must support reading from and writing to MIDI files
- Sibelius assumes all notes in a MIDI track should be on the same channel; hence midi channel can be a track property, not a note property.
    - Implications here include microtonal chords needing to be distributed amongst multiple tracks
    - If any notes are in channel 10 (percussion) all notes are in channel 10
- We should document which MIDI features are supported, which are not supported, and which cannot be supported due to Sibelius restrictions

## Notes

Sibelius MIDI restrictions:
- Support pitch bends, but support does not work when notes overlap within one track
    - Treats all content in a MIDI track as belonging to the same channel
        - If any notes are in channel 10, everything is treated as in channel 10
    - Hence you can't have overlapping notes with the same MIDI pitch in one MIDI track
        - This could get hacked around, but won't be 100% reliable and would be very messy

MuseScore MIDI restrictions:
- Doesn't support pitch bend events

LilyPond MIDI restrictions:
- Doesn't seem to support pitch bend events (midi2ly)

Finale and Dorico MIDI restrictions are not known as I do not have these programs.


