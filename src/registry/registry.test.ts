import Registry from './registry';

describe('counters', () => {
    test('increments as one would expect', () => {
        Registry.inc('foo');
        expect(Registry.counters).toStrictEqual({ foo: 1 });

        Registry.inc('bar');
        expect(Registry.counters).toStrictEqual({ foo: 1, bar: 1 });

        Registry.inc('foo');
        expect(Registry.counters).toStrictEqual({ foo: 2, bar: 1 });
    });
});