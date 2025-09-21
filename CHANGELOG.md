# Changelog

## 0.9.2

### Enhancements
* Performance has been improved for some chained Score operations related to MIDI and SVG creation.

## 0.9.1

### Features
* score.writeGamutSVG() and score.writeIntervalsSVG() have been added; these have similar functionality to score.writeNotesSVG().

### Enhancements
* Score.lastTick() is significantly more performant in many cases.
* Score.withAllTicksExact() has been adjusted to be a noop in cases where no change has been made to the Score since the last call. This should improve performance in some rendering cases.

### Bugfixes
* Score.lastTick() no longer returns the wrong result when the chronologically last event in the Score appears in the Score metadata.

## 0.9.0

### Features
* score.writeNotesSVG() has been added; this generates an SVG image of the score somewhat comparable to previous HTML canvas implementations.

## 0.8.0

### Features
* Scores and Melodies have an experimental feature, `.withChordsCombined()`. This will combine notes with identical start and end times and volumes into a single chord, but it does this in a destructive manner, potentially causing the loss of metadata, note order and other things. The primary use case for this feature is to combine the notes of chords contained in a Score or Melodies read from a MIDI file.

## 0.7.3

### Bugfixes
* collection.do(...).while(...).while(...).do(...) and similar chaining is now guaranteed to work correctly.

## 0.7.2

### Enhancements
* When a Melody contains invalid notes, the error message converting it to MIDI now says where in the Melody the error occurred.
* Dev dependencies have been updated.

## 0.7.1

### Enhancements
* Some error messages have been improved in the midi reader module.

## 0.7.0

### Features
* In order to simplify the creation of one-track compositions, Melody also supports the following MIDI-related methods already available in Score:
  * `toDataURI()`
  * `toHash()`
  * `expectHash()`
  * `writeMidi()`

## 0.6.1

### Documentation
* Some minor errors and omissions corrected.

## 0.6.0

### Features
* The following collection replacer methods now also have `map` and `flatMap` variants, to help clarify intent:
  * `replaceIndices()`
  * `replaceFirstIndex()`
  * `replaceLastIndex()`
  * `replaceIf()`
  * `replaceNth()`
  * `replaceSlice()`

## 0.5.0

### Features
* Sequence methods are now available for generating pitch distribution and location maps.

### Enhancements
* Some error messages have been improved and will generate more detail.
* Dev dependencies have been updated.

## 0.4.1

### Enhancements
* Palestrina has 100% test coverage again.
* `Melody.firstTick()` has parallel functionality to `Melody.lastTick()`.

## 0.4.0

### Enhancements
* Palestrina now understands the MIDI names of percussion instruments.
  * Percussion instruments are still referred to by pitch to match the MIDI standard, and because this would be a very breaking change.

## 0.3.0

### Features
* `Score.withAllTicksExact()` and `Melody.withAllTicksExact()` allow you to convert temporal data to exact ticks only. This can be used to aid merging together multiple tracks that are not rhythmically identical.

## 0.2.0

### Documentation
* Some fleshing out of the Palestrina Cookbook. There is still much work to be done here.
* Clarifying and cleaning up some of the dictionary and entity listing.
* Links to cookbook, dictionary and entity listing are now in the README file, which has hopefully been made a little more useful.
* A directory of example compositions has been added and will be gradually fleshed out.

### Bugfixes
* `Melody.augmentRhythm()` and `Melody.diminishRhythm()` now change exact ticks in MIDI events associated with notes.
* `Melody.augmentRhythm()` and `Melody.diminishRhythm()` now change exact ticks and offsets in Melody metadata.
* Timing now throws an error when you generate non-integer MIDI ticks via augmentation or diminution of rhythms, instead of throwing the error when you try to create the score. This is consistent with how such errors are handled elsewhere.

### Enhancements
* Minor optimisation in `primefactors()` import.
* Some parameter names have been changed to make their meaning clearer.

### Features
* `MetaEvent.augment()` exists and returns a copy of the MetaEvent with any MIDI tick values in it augmented.
* `MetaEvent.diminish()` exists and returns a copy of the MetaEvent with any MIDI tick values in it diminished.
