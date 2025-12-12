# Changelog

## 1.0.0

This is a new major release with some significant behind-the-scenes changes to eliminate cruft dating from back to before the application was ported from JavaScript to TypeScript. Hence it breaks back compatibility in a number of places.
* The `end-track` meta-event has been removed as it is a MIDI-specific concept that does not make proper sense within the Sibelius Score/Melody concept. This has allowed a significant amount of simplification of the meta-event and meta-list objects. This probably will not affect any end user code, as the `end-track` meta-event should never have been used in user code, but is noted as the possibility of resulting errors exists.
* The `visualizations` module is no longer exported to the end user, as Score and Melody now provide access to all visualizations included in the module. Any code using this module directly can be rewritten to use the appropriate Score/Melody methods `writeCanvas()`, `writeNotesSVG()`, `writeGamutSVG()` and `writeIntervalsSVG()`. Similarly, the
`Melody.summary()` method formerly used by the Score canvas visualization has been removed.
* The `intseq()` Sequence creation method has been renamed to `numseq()`. 
* Sequence creation methods beginning with "microtonal" are no longer available as separate methods. Instead the optional second argument "microtonal" should be used, eg: `melody(notes, 'microtonal')` instead of `microtonalmelody(notes)`.
* MIDI file creation has been redesigned so as to be based on ordered lists of everything that happens during a Score (in a parallel flow to MusicXML file creation). This, in some cases, will result in small differences in the order of events that occur on the same MIDI tick in the same track. These should not affect any kind of audio rendering but will result in a change in the hash checksum generated for the file.
* Meta-events are now typed more restrictively, with the type of the value being dependent on the type of the event. This will lead to more errors being caught at the compilation stage if the end user is using TypeScript.

### Features
* `Score` and `Melody` now have additional methods listing the contents of the entity in temporal order:
 * `.toOrderedEntities()` returns a list of everything that happens in each track in the score, in temporal order, as either notes or meta-events, with exact ticks applied to each.
 * `.toOrderedChords()` returns a list of all chords within the score, in temporal order, with exact ticks applied to each chord.
* These should reduce required effort (and traps for the unwary) when implementing functionality that operates on all of a score or melody outside of a Sibelius context.

### Deprecations
* The `end-track` meta-event is no longer supported.
* The `visualizations` module is no longer exported as all functionality within it is implemented in `Score`.
* The legacy `Melody.toSummary()` method is no longer available.
* Exported microtonal sequence creation methods are now supported using a second argument instead of a separate method.

### Enhancements
* The MIDI creation flow has been cleaned up significantly.
* The sequence-to-sequence methods have been cleaned up and are now implemented using a mixin.
* Dependencies have been updated.
* Some documentation errors have been fixed.

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
