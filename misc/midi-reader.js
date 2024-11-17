const P = require('../built')
const { hrtime } = require('node:process')

const ITER = 10
const RUNS = 10
const FILE = './midi-reader.mid'
const HASH = '2340b3a0960ecd02c782b4c8ae2e1c24'

function timer(s) {
	const t1 = hrtime.bigint()
	const score = P.score(FILE)

	return hrtime.bigint() - t1
}

function looper() {
}

if (process.argv[2] === 'perf') {
	let tot = BigInt(0)

	for (let runs = 0; runs < RUNS; runs++) {
		console.log('run', runs)

		for (let i = 0; i < ITER; i++) {
			tot += timer()
		}
	}

	console.log('total time:', tot)
	process.exit()
}

const score = P.score(FILE)

score.writeCanvas(__filename)
score.writeMidi(__filename)
score.expectHash(HASH)
