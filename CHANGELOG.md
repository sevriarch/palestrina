# Changelog

## 0.2.0

### Bugfixes
* `Melody.augmentRhythm()` and `Melody.diminishRhythm()` now change exact ticks in MIDI events associated with notes.
* `Melody.augmentRhythm()` and `Melody.diminishRhythm()` now change exact ticks and offsets in Melody metadata.
* Timing now throws an error when you generate non-integer MIDI ticks via augmentation or diminution of rhythms, instead of throwing the error when you try to create the score. This is consistent with how such errors are handled elsewhere.

### Enhancements
* Minor optimisation in `primefactors()` import.

### Features
* `MetaEvent.augment()` exists and returns a copy of the MetaEvent with any MIDI tick values in it augmented.
* `MetaEvent.diminish()` exists and returns a copy of the MetaEvent with any MIDI tick values in it diminished.
