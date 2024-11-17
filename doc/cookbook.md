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

```
melody(w)
```

### Remove (or keep) only some of the melody

### Apply manipulations to some (but not all) of a melody

### Add a second part in a canon

### Swap notes in a two-part composition so the first voice is never lower than the second
 
### Add some lyrics

### Check that the music did not change when you rewrote the script generating it

### Generate an HTML visualization of the score
