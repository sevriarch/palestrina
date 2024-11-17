'use strict'

const { noteseq, score, CONSTANTS, imports } = require('../built')

const LEN    = Number(process.env.INF_LEN   || 1280)
const TICKS  = Number(process.env.INF_TICKS || 64)
const GAP    = Number(process.env.INF_GAP   || 5)
const MOD    = Number(process.env.INF_MOD   || 25)
const BAR    = 16

function bar(x) {
    return (x - 1) * BAR
}

function makeOverlay() {
    const xpos = imports.sinusoidal(LEN, 8.5, 0, 3600)
    const max  = Math.max(...xpos)
    const min  = Math.min(...xpos)

    return noteseq(xpos)
        .mapSlice(bar(29), bar(37), v => v.setPitches(2 * max - v.val()))
        .mapSlice(bar(37), bar(45), v => v.setPitches(min - Math.floor(v.val() / 2)))
        .mapSlice(bar(61), bar(69), v => v.setPitches(2 * max - v.val()))
        .setSlice(bar(69), bar(73), min)
        .setSlice(bar(73), bar(77), max + 8)
        .mapSlice(bar(77), bar(81), (v, i) => v.setPitches(min + Math.round(i / BAR * 8)))
        .append(noteseq([ 8, 8 ]))
        .transpose(-16)
}

function makeMelody(offset = 0) {
    return noteseq(imports.infinity_var1(LEN * GAP))
        .keepNth(GAP, offset)
        .mod(MOD)
}

function applyOverlay(seq) {
    return seq.combine((a, b) => a.isSilent() ? a : a.transpose(b.val()), makeOverlay())
}

function makeVolume() {
    const { PPP, PP, P, MP, MF, F, FF, FFF } = CONSTANTS.DYNAMICS

    function dy(from, to = from) { return s => imports.linear(s.length, from, to) }

    return noteseq(imports.constant(LEN, MF))
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
        .append(noteseq([ PP, PP ]))
}

function makeRhythm() {
    return TICKS / 4
}

function melodify(seq) {
    return applyOverlay(seq)
        .toMelody()
        .map(v => v.isSilent() ? v : v.mapPitches(p => [ p + 12, p ]))
        .withDuration(makeRhythm())
        .withVolume(makeVolume())
        .withEventBefore(0, 'tempo', 100)
        .withEventBefore(0, 'time-signature', '4/4')
}

function makeTrack(offset = 0) {
    return makeMelody(offset).scale('chromatic', 57)
}

function makeScore() {
    let lines = []

    for (let i = 0; i < GAP; i++) {
        lines[i] = makeTrack(i)
    }

    const look = [ 0, 0, 0, 1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 3, 3, 3, 2, 2, 2, 1, 1, 1, ]
    const zig = lines[0].mapWith((v, i) => [ v[look[i % 8]] ], ...lines.slice(1))
    const zag = zig[0].append(noteseq([ 69, 97 ])).partitionInPosition(p => p.min() >= 71, null)

    score([ melodify(zag[0]), melodify(zag[1]) ])
        .withTicksPerQuarter(TICKS)
        .writeCanvas(__filename)
        .writeMidi(__filename)
        .tap(s => console.log('hash:', s.toHash()))
}

makeScore()
