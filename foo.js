const Collection = require('./built/src/collections/without-metadata').default;

const c = new Collection([ 1, 2, 3, 4, 5, 6 ]);

let i = 4;

c.do(c => {
	console.log(Object.keys(c._control), `entering first do(); i = ${i}`);
	return c.while(c => {
		const ret = c.valAt(1) < 8;
		console.log(Object.keys(c._control), `first while condition returns ${ret}`);
		return ret;
	}).do(c => {
		console.log(Object.keys(c._control), 'performing second do condition on', c);
		return c.map(v => v + 1).retrograde();
	})
})
.while(() => {
	i--;
	const ret = i > 1;
	console.log(Object.keys(c._control), `second while condition returns ${ret}`);
	return ret;
});
