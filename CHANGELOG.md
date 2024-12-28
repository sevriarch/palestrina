# Changelog

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
