'use strict'

// Import the relevant parts of Palestrina: when using the module itself, we would require("palestrina")
const { intseq, noteseq, score, CONSTANTS, imports } = require('../built')

const LEN    = Number(process.env.INF_LEN   || 1280)
const TICKS  = Number(process.env.INF_TICKS || 64)
const GAP    = Number(process.env.INF_GAP   || 5)
const MOD    = Number(process.env.INF_MOD   || 25)
const BAR    = 16
const HASH   = 'dff50ffd4fb4d247db5691118cd058c2'

// Map bar numbers to the sequence member that starts the bar
function bar(x) {
    return (x - 1) * BAR
}

// Make a sequence of the same length as the melodic content, used to move the main melody up or down in pitch
// This sequence is a basic sinusoidal curve with some passages modified and the last 12 bars replaced by
// static values followed by a steady ascent
function makeOverlay() {
    const xpos = imports.sinusoidal(LEN, 8.5, 0, 3600)
    const max  = Math.max(...xpos)
    const min  = Math.min(...xpos)

    return noteseq(xpos)
        .mapSlice(bar(29), bar(37), v => v.invert(max))
        .mapSlice(bar(37), bar(45), v => v.setPitches(min - Math.floor(v.val() / 2)))
        .mapSlice(bar(61), bar(69), v => v.invert(max))
        .setSlice(bar(69), bar(73), min)
        .setSlice(bar(73), bar(77), max + 8)
        .mapSlice(bar(77), bar(81), (v, i) => v.setPitches(min + Math.round(i / BAR * 8)))
        .append(noteseq([ 8, 8 ]))
        .transpose(-16)
}

// Raw musical material using every nth note of a variant of Per Nørgård's infinity series,
// with 0 mapped to the A below middle C
function makeMelody(offset = 0) {
    return noteseq(imports.infinity_var1(LEN * GAP))
        .keepNth(GAP, offset)
        .mod(MOD)
        .scale('chromatic', 57)
}

// Function to transpose each member of the passed sequence up or down in pitch according to
// the value of the corresponding member of the overlay sequence
function applyOverlay(seq) {
    return seq.combine((a, b) => a.isSilent() ? a : a.transpose(b.val()), makeOverlay())
}

// Function to generate the dynamics for the composition
function makeVolume() {
    const { PPP, PP, P, MP, MF, F, FF, FFF } = CONSTANTS.DYNAMICS

    // Returns a function that generates a dynamic gradation over the length of the passed
    // sequence
    function dy(from, to = from) { return s => imports.linear(s.length, from, to) }

    return intseq(imports.constant(LEN, MF))
        .replaceSlice(bar(3), bar(6), dy(MF, F))
        .replaceSlice(bar(6), bar(8), dy(F))
        .replaceSlice(bar(8), bar(10), dy(F, MF))
        .replaceSlice(bar(12), bar(14), dy(MF, F))
        .replaceSlice(bar(14), bar(16), dy(F))
        .replaceSlice(bar(16), bar(18), dy(F, MF))
        .replaceSlice(bar(20), bar(22), dy(MF, F))
        .replaceSlice(bar(22), bar(24), dy(F))
        .replaceSlice(bar(24), bar(26), dy(F, MF))
        .replaceSlice(bar(27), bar(29), dy(MF, P))
        .replaceSlice(bar(33), bar(36), dy(MF, MP))
        .replaceSlice(bar(36), bar(37), dy(MP))
        .replaceSlice(bar(37), bar(42), dy(P, PP))
        .replaceSlice(bar(42), bar(46), dy(PP))
        .replaceSlice(bar(46), bar(48), dy(P, MP))
        .replaceSlice(bar(48), bar(49), dy(MP))
        .replaceSlice(bar(49), bar(53), dy(MP, P))
        .replaceSlice(bar(53), bar(56), dy(PP))
        .replaceSlice(bar(56), bar(59), dy(PP, P))
        .replaceSlice(bar(59), bar(61), dy(P, PP))
        .replaceSlice(bar(61), bar(69), dy(MP))
        .replaceSlice(bar(69), bar(71), dy(PP))
        .replaceSlice(bar(71), bar(75), dy(PP, MF))
        .replaceSlice(bar(77), bar(80), dy(P, F))
        .replaceSlice(bar(80), -1, dy(F, PP))
        .append(intseq([ PP, PP ]))
}

// Function to generate the rhythm for the composition (all in 16th notes in this case)
function makeRhythm() {
    return TICKS / 4
}

// Combine a sequence with the overlay sequence, convert to a melody, apply octave doubling,
// duration and volume.
function melodify(seq) {
    return applyOverlay(seq)
        .toMelody()
        .map(v => v.isSilent() ? v : v.mapPitches(p => [ p + 12, p ]))
        .withDuration(makeRhythm())
        .withVolume(makeVolume())
}

function makeScore() {
// Collect raw material using multiple variants of the base sequence
    const lines = []
    for (let i = 0; i < GAP; i++) {
        lines[i] = makeMelody(i)
    }

// Take the different variants and for every 8 notes select the following:
// [ variant 0, variant 0, variant 0, variant 1, variant 1, variant 1, variant 2, variant 2 ]
//
// For those who are observant, yes, two of the variants (3 and 4) are never used, and only
// the first third of the `look` variable is used. This can happen when adjusting algorithms
// till you get a result you like.
    const look = [ 0, 0, 0, 1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 3, 3, 3, 2, 2, 2, 1, 1, 1, ]
    const zig = lines[0].mapWith((v, i) => [ v[look[i % 8]] ], ...lines.slice(1))

// Separate into two parts, one for each hand, based on pitch of the note.
    const zag = zig[0].append(noteseq([ 69, 97 ])).partitionInPosition(p => p.min() >= 71, null)

// Create score from combining these parts with the overlay, then set metadata and generate
    score([ melodify(zag[0]), melodify(zag[1]) ])
        .withTicksPerQuarter(TICKS)
        .withTempo(100)
        .withTimeSignature('4/4')
        .writeCanvas(__filename)
        .writeMidi(__filename)
        .expectHash(HASH)
}

makeScore()
