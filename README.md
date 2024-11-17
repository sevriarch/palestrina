# Palestrina

[![pipeline status](https://gitlab.com/sevriarch/palestrina/badges/main/pipeline.svg)](https://gitlab.com/sevriarch/palestrina/commits/main) [![coverage report](https://gitlab.com/sevriarch/palestrina/badges/main/coverage.svg)](https://gitlab.com/sevriarch/palestrina/commits/main)

Palestrina is a library and toolkit for algorithmic composition using JavaScript. It provides the ability to create and manipulate integer sequences, and to convert them into musical representations of these sequences, as well as the ability to export these as MIDI files.

## Very basic use example
```
const { imports, melody, score } = require('palestrina')

const QUARTER_NOTE = 192

// Use the melodic content of Per Nørgård's second symphony in 16th notes
const base = melody(imports.infinity(4096))
    .transpose(67)
    .withDuration(QUARTER_NOTE / 4)

// Keep every second note, play in 8th notes
const part2 = base.keepNth(2)
    .withDuration(QUARTER_NOTE / 2)

// Keep every fourth notes, play the retrograde in quarter notes, transposed down an octave
const part3 = base.keepNth(4)
    .withDuration(QUARTER_NOTE)
    .retrograde()
    .transpose(-12)

// Write out as a MIDI file
score([ base, part2, part3 ], { ticks_per_quarter: QUARTER_NOTE })
    .writeMidi(__filename)
```

## High-Level Architecture

The generic building block of a Palestrina composition is the abstract class <a href="./src/sequences/generic.ts">**Sequence**</a>. Sequences contain a series of manipulable values, which could be integers, floating point numbers, arrays of integers, or complex objects representing musical notes with metadata, depending on the subclass used, and provide a wide variety of ways to manipulate them, perform conditional logic, and to inject your own JavaScript code to perform any actions not implemented within Palestrina.

Numeric Sequences include <a href="./src/sequences/number.ts">**NumSeq**</a> (which represents a sequnce of numbers), and <a href="./src/sequences/note.ts">**NoteSeq**</a> (which represents a sequence of nullable numbers), while a <a href="./src/sequences/chord.ts">**ChordSeq**</a> contains a sequence of arrays of numbers -- chords, in other words.

A <a href="./src/sequences/melody.ts">**Melody**</a> is a representation of an individual part within a score, with notes and chords, volume, rhythm, textual addenda and the like. It contains a series of <a href="./src/sequences/members/melody.ts">**MelodyMember**</a>s.

All sequences all include metadata.

A <a href="./src/scores/score.ts">**Score**</a> is a representation of a music score with zero or more parts (each of which is a Melody) and metadata, and can be used to write MIDI files, graphical depictions of the score as an HTML canvas, and so on.

## Requirements

Node.js 16 or above, and npm.

## Install

Type `npm install` in the root directory.

## Run tests

Type `npm test`.
