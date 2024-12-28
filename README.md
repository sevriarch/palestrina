# Palestrina

![CI](https://github.com/sevriarch/palestrina/actions/workflows/main.yml/badge.svg)
[![codecov](https://codecov.io/github/sevriarch/palestrina/branch/main/graph/badge.svg?token=6N3RBEJ7AX)](https://codecov.io/github/sevriarch/palestrina)

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

## How it works

Palestrina works on the principle that some types of algorithmic music composition can be seen as performing manipulations on numeric series. Some considerations associated with this:
- transposition/inversion/retrograde/retrograde inversion of a melody can be seen as a manipulation of a numeric series
- a canon can be seen as making a copy of the series and performing manipulations on that copy
- the rhythms associated with a melody can be seen as another, different numeric series
- many common processes in repertoire works can be seen in this regard (eg: much Renaissance polyphony, or Sofia Gubaidulina's violin concerto "Offertorium")

The process of creating a composition within Palestrina involves creating one or more such series, performing appropriate manipulations on them, packing them together into a score, then generating MIDI or visualization output from this score.

The types of series available within Palestrina:
- intseq(): a series of integers
- floatseq(): a series of floating point numbers
- noteseq(): a series of pitches (represented by numbers) or silences (represented by nulls)
- microtonalnoteseq(): similarly, but for microtonal music
- chordseq(): a series of chords (0 or more notes)
- microtonalchordseq(): similarly, but for microtonal music
- melody(): a series of chords, each also including temporal data, volume information and metadata
- microtonalmelody(): similarly, but for microtonal music

## Requirements

Node.js 16 or above, and npm.

## Install

Type `npm install` in the root directory.

## Run Tests

Type `npm test`.

## Sample compositions made using Palestrina

These&mdash;complete with comments illustrating what's happening&mdash;can be found in the [/examples](/examples) directory. So far there aren't many.

## Further reading

* [Palestrina Cookbook](./doc/cookbook.md) (under development)
* [Palestrina Dictionary](./doc/dictionary.md)&mdash;some of the terminology used in Palestrina, with brief explanations of their meaning.
* [Palestrina Entities](./doc-entity-dictionary.md)&mdash;a list of the various components of the software.
