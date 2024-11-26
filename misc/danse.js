'use strict'

const { helpers, noteseq, score } = require('../built')

const SCALE = 'octatonic12'
const MAX   = 1024
const HASH  = '1005ed2d433072460c5a43614009be90'

function my2(offset) {
    let arr = new Array(MAX)

    arr[0] = 0
    for (let i = 1; i < MAX; i++) {
        arr[i] = (i + offset) * (i + offset + 1) % Math.floor(Math.sqrt(i))
    }

    return noteseq(arr)
}

function sliceAndDice(s) {
    const seq = s.keepNth(2).append(s.dropNth(2).retrograde())

    return seq.insertBefore(512, seq.keepSlice(544, 576))
}

let x = []
let opts = []

function addTrack(t, o) {
    x.push(t)
    opts.push(o || {})
}

function arrToSeq(arr, val) {
    const ret = new Array(1056).fill(null)

    arr.forEach(ix => ret[ix] = val)

    return noteseq(ret)
}

for (let i = -3; i < 4; i++) {
    addTrack(sliceAndDice(my2(i)), 'my2(' + i + ')')
}

addTrack(x[0].combineMax(x[3]), { trackName: 'max(0,3)' })
addTrack(x[3].combineMax(x[6]), { trackName: 'max(3,6)' })
addTrack(x[0].combineMax(x[6]), { trackName: 'max(0,6)' })
addTrack(x[7].combineMax(x[8]), { instrument: 'cello', trackName: 'Vc' })
addTrack(x[0].combineMin(x[3]), { trackName: 'min(0,3)' })
addTrack(x[3].combineMin(x[6]), { trackName: 'mix(3,6)' })
addTrack(x[0].combineMin(x[6]), { trackName: 'min(0,6)' })
addTrack(x[11].combineMax(x[12]), { instrument: 'violin', trackName: 'Vn' })
addTrack(x[10].combineDiff(x[14]), { instrument: 'viola', trackName: 'Va' })

x[14] = x[14].scale(SCALE, 57) // VN = 14
x[15] = x[15].scale(SCALE, 48) // VA = 15
x[10] = x[10].scale(SCALE, 39) // VC = 10

function SWAP_FUNC([ vn, va, x_vn, x_va ]) {
    // If not flagged, don't change
    // If flagged and va above vn, swap them; else drop vn note
    if (!x_vn.val() && !x_va.val()) { return [ vn, va ] }

    if (vn.val() < va.val()) { return [ va, vn ] }

    return [ x_vn.val() ? vn.silence() : vn, x_va.val() ? va.silence() : va ]
}

function sortfinal([ vn, va, vc ]) {
	const vn_keep = vn.val() === null || helpers.isOpenString('violin', vn.val())
	const va_keep = va.val() === null || helpers.isOpenString('viola', va.val())
	const vc_keep = vc.val() === null || helpers.isOpenString('cello', vc.val())

	if (vn_keep) {
		if (va_keep || vc_keep || va.val() >= vc.val()) {
			return [ vn, va, vc ];
		}
		return [ vn, vc, va ];
	}

	if (va_keep) {
		if (vn_keep || vc_keep || vn.val() >= vc.val()) {
			return [ vn, va, vc ];
		}
		return [ vc, va, vn ];
	}

	if (vc_keep) {
		if (vn_keep || va_keep || vn.val() >= va.val()) {
			return [ vn, va, vc ];
		}
		return [ va, vn, vc ];
	}

	return [ vn, va, vc ].sort((a, b) => b.val() - a.val())
}

function leapy(a, b, inst) {
    if (a === null || b - a <= 14) { return false }

    return !helpers.isOpenString(inst, a)
}

function BAD_LEAP_VN([ a, b ]) { return leapy(a.val(), b.val(), 'violin') }
function BAD_LEAP_VA([ a, b ]) { return leapy(a.val(), b.val(), 'viola') }
function BAD_LEAP_VC([ a, b ]) { return leapy(a.val(), b.val(), 'cello') }

function BAD_DROP_VN([ a, b ]) { return leapy(b.val(), a.val(), 'violin') }
function BAD_DROP_VA([ a, b ]) { return leapy(b.val(), a.val(), 'viola') }
function BAD_DROP_VC([ a, b ]) { return leapy(b.val(), a.val(), 'cello') }

// Drop first note of leaps
const VC_LEAPS = x[10].findIfWindow(2, 1, BAD_LEAP_VC)
const VN_LEAPS = x[14].findIfWindow(2, 1, BAD_LEAP_VN)
const VA_LEAPS = x[15].findIfWindow(2, 1, BAD_LEAP_VA)

function COMBINER(v1, v2) { return v2.val() ? v2.silence() : v1 }

addTrack(arrToSeq(VC_LEAPS, 38), { channel: 10, trackName: 'Snare Vc' }) // 16
addTrack(x[10].combine(COMBINER, x[16]), { instrument: 'cello', trackName: 'Vc Snip' }) // 17
addTrack(arrToSeq(VN_LEAPS, 76), { channel: 10, trackName: 'Snare Vn' }) // 18
addTrack(x[14].combine(COMBINER, x[18]), { instrument: 'violin', trackName: 'Vn Snip' }) // 19
addTrack(arrToSeq(VA_LEAPS, 77), { channel: 10, trackName: 'Snare Va' }) // 20
addTrack(x[15].combine(COMBINER, x[20]), { instrument: 'viola', trackName: 'Va Snip' }) // 21

// Swap on first note of leaps
const VN_VA_PROC = x[14].mapWith(SWAP_FUNC, x[15], x[18], x[20])
addTrack(VN_VA_PROC[0], { instrument: 'violin', trackName: 'Vn1' }) // 22
addTrack(VN_VA_PROC[1], { instrument: 'viola', trackName: 'Va1' }) // 23

// Add 1 to flag the lower note
const VN_LEAPS2 = x[22].findIfWindow(2, 1, BAD_DROP_VN).map(v => v + 1)
const VA_LEAPS2 = x[23].findIfWindow(2, 1, BAD_DROP_VA).map(v => v + 1)

addTrack(arrToSeq(VN_LEAPS2, 60), { channel: 10, trackName: 'Snare Vn2' }) // 24
addTrack(arrToSeq(VA_LEAPS2, 61), { channel: 10, trackName: 'Snare Va2' }) // 25

// Swap on second note of fall
const VN_VA_PROC2 = x[22].mapWith(SWAP_FUNC, x[23], x[24], x[25])
addTrack(VN_VA_PROC2[0], { instrument: 'violin', trackName: 'Vn2' }) // 26
addTrack(VN_VA_PROC2[1], { instrument: 'viola', trackName: 'Va2' }) // 27

const VN_LEAPS3 = x[26].findIfWindow(2, 1, BAD_LEAP_VN)
const VA_LEAPS3 = x[27].findIfWindow(2, 1, BAD_LEAP_VA)

addTrack(arrToSeq(VN_LEAPS3, 49), { channel: 10, trackName: 'Snare Vn3' }) // 28
addTrack(arrToSeq(VA_LEAPS3, 38), { channel: 10, trackName: 'Snare Va3' }) // 29

// Swap on first note of leaps
const VN_VA_PROC3 = x[26].mapWith(SWAP_FUNC, x[27], x[28], x[29])
addTrack(VN_VA_PROC3[0], { instrument: 'violin', trackName: 'Vn1' }) // 30
addTrack(VN_VA_PROC3[1], { instrument: 'viola', trackName: 'Va1' }) // 31

// Add 1 to flag the lower note
const VN_LEAPS4 = x[30].findIfWindow(2, 1, BAD_DROP_VN).map(v => v + 1)
const VA_LEAPS4 = x[31].findIfWindow(2, 1, BAD_DROP_VA).map(v => v + 1)

addTrack(arrToSeq(VN_LEAPS4, 49), { channel: 10, trackName: 'Snare Vn4' }) // 32
addTrack(arrToSeq(VA_LEAPS4, 38), { channel: 10, trackName: 'Snare Va4' }) // 33

// Swap on second note of fall
const VN_VA_PROC4 = x[30].mapWith(SWAP_FUNC, x[31], x[32], x[33])
addTrack(VN_VA_PROC4[0], { instrument: 'violin', trackName: 'Vn4' }) // 34
addTrack(VN_VA_PROC4[1], { instrument: 'viola', trackName: 'Va4' }) // 35

const VN_LEAPS5 = x[34].findIfWindow(2, 1, BAD_LEAP_VN)
const VA_LEAPS5 = x[35].findIfWindow(2, 1, BAD_LEAP_VA)

addTrack(arrToSeq(VN_LEAPS5, 38), { channel: 10, trackName: 'Snare Vn5' }) // 36
addTrack(arrToSeq(VA_LEAPS5, 58), { channel: 10, trackName: 'Snare Va5' }) // 37

// Swap on first note of leaps
const VN_VA_PROC5 = x[34].mapWith(SWAP_FUNC, x[35], x[36], x[37])
addTrack(VN_VA_PROC5[0], { instrument: 'violin', trackName: 'Vn5' }) // 38
addTrack(VN_VA_PROC5[1], { instrument: 'viola', trackName: 'Va5' }) // 39

// Add 1 to flag the lower note
const VN_LEAPS6 = x[38].findIfWindow(2, 1, BAD_DROP_VN).map(v => v + 1)
const VA_LEAPS6 = x[39].findIfWindow(2, 1, BAD_DROP_VA).map(v => v + 1)

addTrack(arrToSeq(VN_LEAPS6, 38), { channel: 10, trackName: 'Snare Vn4' }) // 40
addTrack(arrToSeq(VA_LEAPS6, 38), { channel: 10, trackName: 'Snare Va4' }) // 41

// Swap on second note of fall
const VN_VA_PROC6 = x[38].mapWith(SWAP_FUNC, x[39], x[40], x[41])
addTrack(VN_VA_PROC6[0], { instrument: 'violin', trackName: 'Vn6' }) // 42
addTrack(VN_VA_PROC6[1], { instrument: 'viola', trackName: 'Va6' }) // 43

const VN_LEAPS7 = x[42].findIfWindow(2, 1, BAD_LEAP_VN)
const VA_LEAPS7 = x[43].findIfWindow(2, 1, BAD_LEAP_VA)

const VC_LEAPS2 = x[17].findIfWindow(2, 1, BAD_DROP_VC).map(v => v + 1)

addTrack(arrToSeq(VC_LEAPS2, 35), { channel: 10, trackName: 'Snare Vc5' }) // 44
addTrack(x[17].combine(COMBINER, x[44]), { instrument: 'cello', trackName: 'Vc Snip' }) // 45

console.log(`Analysis:
VN LEAPS 1 ${VN_LEAPS.length}
VN LEAPS 2 ${VN_LEAPS2.length}
VN LEAPS 3 ${VN_LEAPS3.length}
VN LEAPS 4 ${VN_LEAPS4.length}
VN LEAPS 5 ${VN_LEAPS5.length}
VN LEAPS 6 ${VN_LEAPS6.length}
VN LEAPS 7 ${VN_LEAPS7.length}
VA LEAPS 1 ${VA_LEAPS.length}
VA LEAPS 2 ${VA_LEAPS2.length}
VA LEAPS 3 ${VA_LEAPS3.length}
VA LEAPS 4 ${VA_LEAPS4.length}
VA LEAPS 5 ${VA_LEAPS5.length}
VA LEAPS 6 ${VA_LEAPS6.length}
VA LEAPS 7 ${VA_LEAPS7.length}
VC LEAPS 1 ${VC_LEAPS.length}
VC LEAPS 2 ${VC_LEAPS2.length}
`)

const newtrax = x[42].mapWith(sortfinal, x[43], x[45])
addTrack(newtrax[0], { instrument: 'violin' });
addTrack(newtrax[1], { instrument: 'viola' });
addTrack(newtrax[2], { instrument: 'cello' });

const TRACKS = [ /*42, 43, 45,*/ 46, 47, 48, 16, 18, 20, 24, 25, 44, 28, 32, 37 ]
const BASE   = { tempo: 92, timeSignature: [ 2, 4 ] }

let s = score()

function melodify(seq) {
    return seq.toMelody()
        .withDuration(16)
        .withVolume(64)
        .joinRepeats()
        .withStartTick(0)
}

if (process.argv[2] === 'piano') {
    const mel = melodify(x[42])
        .append(melodify(x[43]))
        .append(melodify(x[45]))

    s = s.appendItems(mel)
} else {
    for (let i of TRACKS) {
        const o = { ...BASE, ...opts[i] }
        const t = melodify(x[i])
            .if(opts[i].channel)
                .then(s => s.withMidiChannel(opts[i].channel))
            .if(opts[i].instrument)
                .then(s => s.withEventBefore(0, { event: 'instrument', value: opts[i].instrument }))
            .if(opts[i].trackName)
                .then(s => s.withEventBefore(0, { event: 'track-name', value: opts[i].trackName }))

        s = s.appendItems(t)
    }
}
    
s.withTicksPerQuarter(64)
    .withTimeSignature('2/4')
    .withTempo(92)
    .writeCanvas(__filename, { wd_quarter: 10 })
    .writeMidi(__filename)
    .expectHash(HASH)
