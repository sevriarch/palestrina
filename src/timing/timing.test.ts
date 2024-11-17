import Timing from './timing';

describe('augment()', () => {
    const undef = new Timing();
    const def = new Timing(50, 100, 150, 200);

    test('invalid arguments', () => {
        expect(() => undef.augment('1' as unknown as number)).toThrow();
        expect(() => undef.augment(-1)).toThrow();
    });

    test('doubling', () => {
        expect(undef.augment(2)).toStrictEqual(undef);
        expect(def.augment(2)).toStrictEqual(new Timing(50, 200, 300, 400));
    });

    test('halving', () => {
        expect(undef.augment(0.5)).toStrictEqual(undef);
        expect(def.augment(0.5)).toStrictEqual(new Timing(50, 50, 75, 100));
    });
});

describe('diminish()', () => {
    const undef = new Timing();
    const def = new Timing(50, 100, 150, 200);

    test('invalid arguments', () => {
        expect(() => undef.diminish('1' as unknown as number)).toThrow();
        expect(() => undef.diminish(0)).toThrow();
        expect(() => undef.diminish(-1)).toThrow();
    });

    test('doubling', () => {
        expect(undef.diminish(0.5)).toStrictEqual(undef);
        expect(def.diminish(0.5)).toStrictEqual(new Timing(50, 200, 300, 400));
    });

    test('halving', () => {
        expect(undef.diminish(2)).toStrictEqual(undef);
        expect(def.diminish(2)).toStrictEqual(new Timing(50, 50, 75, 100));
    });
});

describe('withExactTick()', () => {
    const def = new Timing(50, 100, 150, 200);

    test('invalid arguments', () => {
        expect(() => def.withExactTick('1' as unknown as number)).toThrow();
        expect(() => def.withExactTick(0.5)).toThrow();
        expect(() => def.withExactTick(-1)).toThrow();
    });

    test('new value', () => {
        expect(def.withExactTick(40)).toStrictEqual(new Timing(40, 100, 150, 200));
    });
});

describe('withOffset()', () => {
    const def = new Timing(50, 100, 150, 200);

    test('invalid arguments', () => {
        expect(() => def.withOffset('1' as unknown as number)).toThrow();
        expect(() => def.withOffset(0.5)).toThrow();
        expect(() => def.withOffset(-1)).not.toThrow();
    });

    test('new value', () => {
        expect(def.withOffset(40)).toStrictEqual(new Timing(50, 40, 150, 200));
    });
});

describe('withDelay()', () => {
    const def = new Timing(50, 100, 150, 200);

    test('invalid arguments', () => {
        expect(() => def.withDelay('1' as unknown as number)).toThrow();
        expect(() => def.withDelay(0.5)).toThrow();
        expect(() => def.withDelay(-1)).not.toThrow();
    });

    test('new value', () => {
        expect(def.withDelay(40)).toStrictEqual(new Timing(50, 100, 40, 200));
    });
});

describe('withDuration()', () => {
    const def = new Timing(50, 100, 150, 200);

    test('invalid arguments', () => {
        expect(() => def.withDuration('1' as unknown as number)).toThrow();
        expect(() => def.withDuration(0.5)).toThrow();
        expect(() => def.withDuration(-1)).toThrow();
    });

    test('new value', () => {
        expect(def.withDuration(40)).toStrictEqual(new Timing(50, 100, 150, 40));
    });
});

describe('startTick()', () => {
    const undef = new Timing();
    const exact = new Timing(100);
    const offset = new Timing(undefined, 200);
    const delay = new Timing(undefined, undefined, 300);
    const all = new Timing(100, 200, 300);

    const table: [ string, Timing, number, number ][] = [
        [ 'curr 0, no timing', undef, 0, 0 ],
        [ 'curr 150, no timing', undef, 150, 150 ],
        [ 'curr 0, exact', exact, 0, 100 ],
        [ 'curr 150, exact', exact, 150, 100 ],
        [ 'curr 0, offset', offset, 0, 200 ],
        [ 'curr 150, offset', offset, 150, 350 ],
        [ 'curr 0, delay', delay, 0, 300 ],
        [ 'curr 150, delay', delay, 150, 450 ],
        [ 'curr 0, all', all, 0, 600 ],
        [ 'curr 150, all', all, 150, 600 ],
    ];

    test.each(table)('%s', (_, ob, curr, ret) => {
        expect(ob.startTick(curr)).toStrictEqual(ret);
    });
});

describe('endTick()', () => {
    const undef = new Timing();
    const dur = new Timing(undefined, undefined, undefined, 50);
    const exact = new Timing(100, undefined, undefined, 50);
    const offset = new Timing(undefined, 200, undefined, 50);
    const delay = new Timing(undefined, undefined, 300, 50);
    const all = new Timing(100, 200, 300, 50);

    const table: [ string, Timing, number, number ][] = [
        [ 'curr 0, no timing', undef, 0, 0 ],
        [ 'curr 150, no timing', undef, 150, 150 ],
        [ 'curr 0, dur', dur, 0, 50 ],
        [ 'curr 150, dur', dur, 150, 200 ],
        [ 'curr 0, exact', exact, 0, 150 ],
        [ 'curr 150, exact', exact, 150, 150 ],
        [ 'curr 0, offset', offset, 0, 250 ],
        [ 'curr 150, offset', offset, 150, 400 ],
        [ 'curr 0, delay', delay, 0, 350 ],
        [ 'curr 150, delay', delay, 150, 500 ],
        [ 'curr 0, all', all, 0, 650 ],
        [ 'curr 150, all', all, 150, 650 ],
    ];

    test.each(table)('%s', (_, ob, curr, ret) => {
        expect(ob.endTick(curr)).toStrictEqual(ret);
    });
});

describe('nextTick()', () => {
    const undef = new Timing();
    const dur = new Timing(undefined, undefined, undefined, 50);
    const exact = new Timing(100, undefined, undefined, 50);
    const offset = new Timing(undefined, 200, undefined, 50);
    const delay = new Timing(undefined, undefined, 300, 50);
    const all = new Timing(100, 200, 300, 50);

    const table: [ string, Timing, number, number ][] = [
        [ 'curr 0, no timing', undef, 0, 0 ],
        [ 'curr 150, no timing', undef, 150, 150 ],
        [ 'curr 0, dur', dur, 0, 50 ],
        [ 'curr 150, dur', dur, 150, 200 ],
        [ 'curr 0, exact', exact, 0, 150 ],
        [ 'curr 150, exact', exact, 150, 150 ],
        [ 'curr 0, offset', offset, 0, 50 ],
        [ 'curr 150, offset', offset, 150, 200 ],
        [ 'curr 0, delay', delay, 0, 350 ],
        [ 'curr 150, delay', delay, 150, 500 ],
        [ 'curr 0, all', all, 0, 450 ],
        [ 'curr 150, all', all, 150, 450 ],
    ];

    test.each(table)('%s', (_, ob, curr, ret) => {
        expect(ob.nextTick(curr)).toStrictEqual(ret);
    });
});

describe('equals()', () => {
    const t = new Timing(100, 200, 300, 50);

    const table: [ string, unknown, boolean ][] = [
        [ 'not a Timing object', [ 100, 200, 300, 50 ], false ],
        [ 'exact differs', new Timing(50, 200, 300, 50), false ],
        [ 'offset differs', new Timing(100, 250, 300, 50), false ],
        [ 'delay differs', new Timing(100, 200, 250, 50), false ],
        [ 'duration differs', new Timing(100, 200, 300, 150), false ],
        [ 'identical', new Timing(100, 200, 300, 50), true ],
    ];

    test.each(table)('%s', (_, cmp, ret) => {
        expect(t.equals(cmp)).toBe(ret);
    });
});