# Changelog

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
