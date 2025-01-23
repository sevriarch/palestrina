# Palestrina Cookbook

This is a short document designed to illustrate some of the things you can easily do with Palestrina.

### Write a MIDI file containing some music

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

### Set volume for a melody

```
// Constant volume
const newmelody = oldmelody.withVolume(64);

// A volume that varies sinusoidally over 1024 notes (requires you to import the 'imports' and 'numseq' modules)
const newmelody = oldmelody.withVolume(numseq(imports.sinusoidal(1024, 32, 0, 360)).transpose(48));
```

### Set durations for a melody

```
// Constant durations
const newmelody = oldmelody.withDuration(64);

// 300 note loop of the main rhythm in the 2nd movement of Beethoven's 7th symphony
const newmelody = oldmelody.withDuration(numseq([192, 96, 96, 192, 192]).loop(300));
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

The dark-light two-note version of Per Nørgård's infinity series as a numeric sequence:
```
const darklight = intseq(imports.infinity).mod(2);
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
```
const newmelody = oldmelody.keep(256); // keep first 256 notes
const newmelody = oldmelody.keepRight(256); // keep last 256 notes
const newmelody = oldmelody.drop(256); // keep all but first 256 notes
const newmelody = oldmelody.dropRight(256); // keep all but last 256 notes
const newmelody = oldmelody.keepSlice(256, 512); // keep notes 256-511
const newmelody = oldmelody.dropSlice(256, 512); // keep all but notes 256-511
```

### Apply manipulations to some (but not all) of a melody
```
// Transpose notes 256-511 up an octave
const newmelody = oldmelody.replaceSlice(256, 512, m => m.transpose(12));

// Replace notes 256-511 with a completely different melody
const newmelody = oldmelody.replaceSlice(256, 512, othermelody);

// Perform a custom manipulation on notes in 256-511
const newmelody = oldmelody.mapSlice(256, 512, c => c.mapEachPitch(p => (p + 12 + p % 6)));
```

### Add a second part in a canon
```
const TICKS_PER_QUARTER_NOTE = 192;

// voice2 is voice1 transposed down an octave and delay by 8 quarter notes
const voice2 = voice1.transpose(-12).withStartTick(8 * TICKS_PER_QUARTER_NOTE);

// this is a score containing both voices
score([ voice1, voice 2])
    .do_something(...)
```

### Swap notes in a two-part composition so the first voice is never lower than the second

```
// For the opposite operation, use .exchangeValuesIncreasing()
const [ newVoice1, newVoice2 ] = voice1.exchangeValuesDecreasing(voice2);
```

### Add some lyrics

This is a somewhat laborious process unless you can somehow link the lyrics programmatically to
individual notes, but the process below would be one way to do this semi-manually:
```
// m is the name of the melody we're adding notes to
const lyrics = [
    [ 0, 'this' ],
    [ 4, 'is' ],
    [ 5, 'the' ],
    [ 7, 'way' ],
    [ 13, 'the' ],
    [ 16, 'world' ],
    [ 19, 'ends ],
];

vocalLine.pipe(m => {
    lyrics.forEach([ note, text ] => m = m.withTextBefore('lyric', note, text));
})
```

### Check that the music did not change when you rewrote the script generating it

You can do this by using the hash functions associated with the `Score` entity.

Before rewriting, use the `score.toHash()` method to determine the hash of the score.
```
score.pipe(s => console.log('Score hash:', s.toHash()));
```

Take note of what the hash output was, and in the new version, make a constant at the top of the file
```
const EXPECTED_HASH = 'd0422047681ce6632afd75527f33c3ef'; // replace with what you got
```

And before generating the score use the `score.expectHash()` method to confirm that the hash is as you expected:
```
score.expectHash(EXPECTED_HASH)
    .writeMidi(__filename);
```

### Convert a MIDI file into a score
```
const newscore = score('myfile.mid');
```

### Generate an HTML canvas visualization of the score

There are a lot of options available for building score canvases, but a basic score canvas generation from a score object:
```
score.writeCanvas(__filename, { wd_scale: 2 })
                            // ^ options go in this object
```