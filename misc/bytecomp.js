const fs = require('fs')

const f1 = process.argv[2] || 'water1.new.js.mid'
const f2 = process.argv[3] || 'water1.new.js.comp.mid'

const c1 = fs.readFileSync(f1)
const c2 = fs.readFileSync(f2)

console.log(`length of ${f1}: ${c1.length}`)
console.log(`length of ${f2}: ${c2.length}`)

for (let i = 0; i < c1.length; i++) {
	console.log(c1[i] === c2[i] ? ' ' : '!', `${i}: 0x${c1[i].toString(16)} (${String.fromCharCode(c1[i])}) <-> 0x${c2[i].toString(16)} (${String.fromCharCode(c2[i])})`);
}
