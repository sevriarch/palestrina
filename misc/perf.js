/*
 * ITER = 10, LEN = 256, RUNS = 100
 * total time n: 18861112795n
 * total time c: 25239057768n
 * total time m: 78911917923n
 *
 * now:
 * total time n: 8160251696n
 * total time c: 14582314804n
 * total time m: 30983588654n
 *
 * Removing any operations involving changing sequence length:
 *
 * total time n: 9934158048n
 * total time c: 13611125687n
 * total time m: 41025937031n
 *
 * ITER = 10, LEN = 1024, RUNS = 25
 * total time n: 18545902832n
 * total time c: 24496885778n
 * total time m: 78999472330n
 *
 * Removing any operations involving changing sequence length:
 * total time n: 9709313205n
 * total time c: 13331331478n
 * total time m: 43012114946n
 *
 * ITER = 5, LEN = 5120, RUNS = 10
 * total time n: 18068609299n
 * total time c: 24846291967n
 * total time m: 83320551040n
 *
 * Removing any operations involving changing sequence length:
 * total time n: 9752195045n
 * total time c: 13604535269n
 * total time m: 43906129774n
 */

/* Consequences:
 * Using an array of numbers over a number increases runtime for numeric sequence operations by ~40%
 * Adding metadata to a sequence increases runtime for numeric sequence operations by ~220%
 */

const P = require('palestrina')
//const valued = require('./built/src/sequences/valued').default
const { hrtime } = require('node:process')

const ITER = 50
const LEN = 256
const RUNS = 20

const series = P.imports.infinity(LEN)

function addevent(e, i) {
	return i % 30 ? e : e.withEventBefore('sustain', 1).withDuration(32).withVolume(80)
}

function mangle(seq) {
	const ismelody = seq === m
	//if (!ismelody) return // used for flamegraph generation on a single path
	for (let i = 0; i < ITER; i++) {
		seq = seq.retrograde()
			.if(ismelody).then(e => e.map(addevent))
			.repeat()
			.transpose(1)
			.invert(40)
			.augment(1)
			.trim(20, 90)
			.drop(LEN / 2)
			.dropRight(LEN / 2)
			.map((e, i) => e % 2 ? e.transpose(1) : e.transpose(-1))
	}
	return seq
}

function seqs() {
	return [ P.intseq(series), P.chordseq(series), P.melody(series) ]
}

function timer(s) {
	const t1 = hrtime.bigint();

	switch (s) {
	case 'm': m = P.melody(series); mangle(m); break;
	case 'c': c = P.chordseq(series); mangle(c); break;
	case 'n': n = P.noteseq(series); mangle(n); break;
	}

	return hrtime.bigint() - t1;
}

let runs

function looper() {

	tot_m += timer('m')
	tot_c += timer('c')
	tot_n += timer('n')

	tot_c += timer('c')
	tot_n += timer('n')
	tot_m += timer('m')

	tot_n += timer('n')
	tot_m += timer('m')
	tot_c += timer('c')

	tot_m += timer('m')
	tot_n += timer('n')
	tot_c += timer('c')

	tot_n += timer('n')
	tot_c += timer('c')
	tot_m += timer('m')

	tot_c += timer('c')
	tot_m += timer('m')
	tot_n += timer('n')
}

let n, c, m;
//= seqs()
let tot_n = BigInt(0)
let tot_c = BigInt(0)
let tot_m = BigInt(0)

for (runs = 0; runs < RUNS; runs++) {
	process.stdout.write(`\r[${runs+1}/${RUNS}]`)
	looper()
}
console.log('')
console.log('total time n:', tot_n)
console.log('total time c:', tot_c)
console.log('total time m:', tot_m)

if (P.Registry && P.Registry.counters) console.log(P.Registry.counters);
