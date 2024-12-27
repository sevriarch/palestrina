# Palestrina Cookbook

This is a short document designed to illustrate some of the things you can easily do with Palestrina.

### Write a MIDI file containing some music.

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

### Some standard musical manipulations

Transposition:
```
// Move every note up 12 gradations
const newmelody = oldmelody.transpose(12);

// Move every note so that the maximum pitch in the melody is 60
const newmelody = oldmelody.transposeTomax(60);

// Move every note so that the minimum pitch in the melody is 0
const newmelody = oldmelody.transposeTomax(0);
```

Inversion:
```
const newmelody = oldmelody.invert(0);
```

Retrograde:
```
const newmelody = oldmelody.retrograde();
```

Retrograde inversion:
```
const newmelody = oldmelody.retrograde().invert(0);
```

Repeat:
```
const newmelody = oldmelody.repeat(); // .repeat(3) for the melody to appear three times
```

Repeat each note once:
```
const newmelody = oldmelody.dupe(); // or .dupe(3) for each note to appear three times
```

Remove repeated notes:
```
const newmelody = oldmelody.dedupe();
```

Swap first and second notes, then third and fourth notes, etc:
```
const newmelody = oldmelody.shuffle([ 0, 1 ]);
```

Add a note at the beginning (or the end):
```
const newmelody = oldmelody.pad(5); // .pad(5, 3) to add this note three times at the start
const newmelody = oldmelody.padRight(5); // .padRight(5, 3) to add three times at the end
```

Add a note repeatedly at the start (or the end) till the melody is 80 notes long:
```
const newmelody = oldmelody.padTo(5, 80); 
const newmelody = oldmelody.padRightTo(5, 80);
```

Remove a specific note from throughout the melody:
```
const newmelody = oldmelody.filterPitches(p => p != 12);
```

Retain only the top (or bottom) two pitches in a series of chords:
```
const newmelody = oldmelody.keepTopPitches(2);
const newmelody = oldmelody.keepBottomPitches(2);
```

Double all intervals in a melody:
```
const newmelody = oldmelody.augment(2);
```

Halve all intervals in a melody:
```
const newmelody = oldmelody.diminish(2);
```

Double all durations in a melody:
```
const newmelody = oldmelody.augmentRhythm(2);
```

Halve all intervals in a melody:
```
const newmelody = oldmelody.diminishRhythm(2);
```

Double the duration of every third note in a melody, starting with the third:
```
const newmelody = oldmelody.replaceNth(3, n => n.augmentRhythm(2), 2); // last argument is 2 as melodies are zero-indexed
```

The dark-light two-note version of Per Nørgård's infinity series:
```
const darklight = infinity.mod(2);
```

If any note is outside the supplied minimum or maximum, set it to those values:
```
const newmelody = oldmelody.trim(10, null); // minimum is 10
const newmelody = oldmelody.trim(null, 30); // maximum is 30
const newmelody = oldmelody.trim(10, 30); // minimum is 10 and maximum is 30
```

Apply a pitch gamut as in some works of eg: John Cage or Pelle Gudmundsen-Holmgreen:
```
const newmelody = oldmelody.gamut([ 0, 5, 9, 12, 14, 15, 16, 18, 21, 25, 30 ])
```

Convert a melody to a specific scale, mapping the value of 0 to middle C
```
const newmelody = oldmelody.scale('lydian', 60); // 60 = middle C in MIDI
```

### Remove (or keep) only some of the melody

### Apply manipulations to some (but not all) of a melody

### Add a second part in a canon

### Swap notes in a two-part composition so the first voice is never lower than the second
 
### Add some lyrics

### Check that the music did not change when you rewrote the script generating it

### Generate an HTML visualization of the score
