import type { ScaleDefinition, PitchArgument, GamutOpts } from '../../types';

import type SeqMember from './generic';

import NumSeqMember from './number';
import NoteSeqMember from './note';
import ChordSeqMember from './chord';
import MelodyMember from './melody';

describe('SeqMember.len()', () => {
    const table: [ string, SeqMember<unknown>, number ][] = [
        [ 'NumSeqMember length is 1', NumSeqMember.from(5), 1 ],
        [ 'silent NoteSeqMember length is 0', NoteSeqMember.from(null), 0 ],
        [ 'non-silent NoteSeqMember length is 1', NoteSeqMember.from(5), 1 ],
        [ 'silent ChordSeqMember length is 0', ChordSeqMember.from([]), 0 ],
        [ 'non-silent ChordSeqMember length is 2', ChordSeqMember.from([ 1, 4 ]), 2 ],
        [ 'silent MelodyMember length is 0', MelodyMember.from([]), 0 ],
        [ 'non-silent MelodyMember length is 3', MelodyMember.from([ 1, -2, 4 ]), 3 ],
    ];

    test.each(table)('%s', (_, e, ret) => {
        expect(e.len()).toEqual(ret);
    });
});

describe('SeqMember.isSilent()', () => {
    const table: [ string, SeqMember<unknown>, boolean ][] = [
        [ 'NumSeqMember is not silent', NumSeqMember.from(5), false ],
        [ 'silent NoteSeqMember is silent', NoteSeqMember.from(null), true ],
        [ 'non-silent NoteSeqMember is not silent', NoteSeqMember.from(5), false ],
        [ 'silent ChordSeqMember is silent', ChordSeqMember.from([]), true ],
        [ 'non-silent ChordSeqMember is not silent', ChordSeqMember.from([ 1, -3, 5 ]), false ],
        [ 'silent MelodyMember is silent', MelodyMember.from(null), true ],
        [ 'non-silent MelodyMember is not silent', MelodyMember.from([ 1, -3, 5 ]), false ]
    ];

    test.each(table)('%s', (_, e, ret) => {
        expect(e.isSilent()).toEqual(ret);
    });
});

describe('SeqMember.numericValue()', () => {
    const errortable: [ string, SeqMember<unknown> ][] = [
        [ 'silent NoteSeqMember', NoteSeqMember.from(null) ],
        [ 'silent ChordSeqMember', ChordSeqMember.from([]) ],
        [ 'ChordSeqMember with a chord', ChordSeqMember.from([ 1, 4 ])],
        [ 'silent MelodyMember', MelodyMember.from([]) ],
        [ 'MelodyMember with a chord', MelodyMember.from([ 1, -2, 4 ])],
    ];

    test.each(errortable)('should throw for a', (_, e) => {
        expect(() => e.numericValue()).toThrow();
    });

    const table: [ string, SeqMember<unknown>, number ][] = [
        [ 'NumSeqMember', NumSeqMember.from(5), 5 ],
        [ 'one-note ChordSeqMember', ChordSeqMember.from([ 15 ]), 15 ],
        [ 'one-note MelodyMember', MelodyMember.from([ -5 ]), -5 ],
    ];

    test.each(table)('%s', (_, e, ret) => {
        expect(e.numericValue()).toEqual(ret);
    });
});

describe('SeqMember.nullableNumericValue()', () => {
    const errortable: [ string, SeqMember<unknown> ][] = [
        [ 'ChordSeqMember with a chord', ChordSeqMember.from([ 1, 4 ])],
        [ 'MelodyMember with a chord', MelodyMember.from([ 1, -2, 4 ])],
    ];

    test.each(errortable)('should throw for a', (_, e) => {
        expect(() => e.nullableNumericValue()).toThrow();
    });

    const table: [ string, SeqMember<unknown>, null | number ][] = [
        [ 'silent NoteSeqMember', NoteSeqMember.from(null), null ],
        [ 'silent ChordSeqMember', ChordSeqMember.from([]), null ],
        [ 'silent MelodyMember', MelodyMember.from([]), null ],
        [ 'NumSeqMember', NumSeqMember.from(5), 5 ],
        [ 'one-note ChordSeqMember', ChordSeqMember.from([ 15 ]), 15 ],
        [ 'one-note MelodyMember', MelodyMember.from([ -5 ]), -5 ],
    ];

    test.each(table)('%s', (_, e, ret) => {
        expect(e.nullableNumericValue()).toEqual(ret);
    });
});

describe('SeqMember.max()', () => {
    const table: [ SeqMember<unknown>, null | number ][] = [
        [ NumSeqMember.from(5), 5 ],
        [ NoteSeqMember.from(null), null ],
        [ NoteSeqMember.from(5), 5 ],
        [ ChordSeqMember.from([]), null ],
        [ ChordSeqMember.from([ 1, -3, 5 ]), 5 ],
        [ MelodyMember.from([]), null ],
        [ MelodyMember.from([ 1, -3, 5 ]), 5 ]
    ];

    test.each(table)('%p.max() returns %p', (e, ret) => {
        expect(e.max()).toStrictEqual(ret);
    });
});

describe('SeqMember.min()', () => {
    const table: [ SeqMember<unknown>, null | number ][] = [
        [ NumSeqMember.from(5), 5 ],
        [ NoteSeqMember.from(null), null ],
        [ NoteSeqMember.from(5), 5 ],
        [ ChordSeqMember.from([]), null ],
        [ ChordSeqMember.from([ 1, -3, 5 ]), -3 ],
        [ MelodyMember.from([]), null ],
        [ MelodyMember.from([ 1, -3, 5 ]), -3 ]
    ];

    test.each(table)('%p.min() returns %p', (e, ret) => {
        expect(e.min()).toStrictEqual(ret);
    });
});

describe('SeqMember.mean()', () => {
    const table: [ SeqMember<unknown>, null | number ][] = [
        [ NumSeqMember.from(5), 5 ],
        [ NoteSeqMember.from(null), null ],
        [ NoteSeqMember.from(5), 5 ],
        [ ChordSeqMember.from([]), null ],
        [ ChordSeqMember.from([ 1, -3, 5 ]), 1 ],
        [ MelodyMember.from([]), null ],
        [ MelodyMember.from([ 1, -3, 5 ]), 1 ]
    ];

    test.each(table)('%p.mean() returns %p', (e, ret) => {
        expect(e.mean()).toStrictEqual(ret);
    });
});

describe('SeqMember.setPitches() tests', () => {
    const chord = ChordSeqMember.from([ 1 ]);
    const note = NoteSeqMember.from([ 2 ]);
    const float = NumSeqMember.from([ 1.5 ]);

    const errortable: [ string, SeqMember<unknown>, PitchArgument ][] = [
        [ 'passing an invalid pitch', chord, '1' as unknown as number ],
        [ 'setting null pitch on a NumSeqMember', float, null ],
        [ 'setting two pitches on a NoteSeqMember', note, [ 1, 2 ] ],
    ];

    test.each(errortable)('throws when %s', (_, e, pitch) => {
        expect(() => e.setPitches(pitch)).toThrow();
    });

    const table: [ string, SeqMember<unknown>, PitchArgument, SeqMember<unknown> ][] = [
        [ 'length 0 passed as array', chord, [], ChordSeqMember.from([]) ],
        [ 'length 0 passed as null', note, null, NoteSeqMember.from([]) ],
        [ 'length 1 passed as array', float, [ 5 ], NumSeqMember.from([ 5 ]) ],
        [ 'length 1 passed as value', note, 5, NoteSeqMember.from([ 5 ]) ],
        [ 'length 2 passed as array', chord, [ 2, 3 ], ChordSeqMember.from([ 2, 3 ]) ],
    ];

    test.each(table)('works when %s', (_, e, pitch, ret) => {
        expect(e.setPitches(pitch)).toStrictEqual(ret);
    });
});

describe('SeqMember.silence()', () => {
    test('silencing a NumSeqMember throws an error', () => {
        expect(() => NumSeqMember.from(5).silence()).toThrow();
    });

    const table: [ string, SeqMember<unknown>, SeqMember<unknown>][] = [
        [ 'NoteSeqMember', NoteSeqMember.from(5), NoteSeqMember.from(null) ],
        [ 'ChordSeqMember', ChordSeqMember.from([ 1, 2, 3 ]), ChordSeqMember.from(null) ],
        [ 'MelodyMember', MelodyMember.from([ 1, 2, 3 ]), MelodyMember.from(null) ],
    ];

    test.each(table)('can silence a %s', (_, e, ret) => {
        expect(e.silence()).toStrictEqual(ret);
    });
});

describe('SeqMember.invert()', () => {
    const table: [ string, SeqMember<unknown>, number, SeqMember<unknown> ][] = [
        [ 'NumSeqMember', NumSeqMember.from(5), 5, NumSeqMember.from(5) ],
        [ 'silent NoteSeqMember', NoteSeqMember.from(null), 0, NoteSeqMember.from(null) ],
        [ 'non-silent NoteSeqMember', NoteSeqMember.from(5), 0, NoteSeqMember.from(-5) ],
        [ 'silent ChordSeqMember', ChordSeqMember.from([]), -5, ChordSeqMember.from([]) ],
        [ 'non-silent ChordSeqMember', ChordSeqMember.from([ 1, -3, 5 ]), -5, ChordSeqMember.from([ -11, -7, -15 ]) ],
        [ 'silent MelodyMember', MelodyMember.from([]), 5, MelodyMember.from([]) ],
        [ 'non-silent MelodyMember', MelodyMember.from([ 1, -3, 5 ]), 5, MelodyMember.from([ 9, 13, 5 ]) ]
    ];

    test.each(table)('works for a %s', (_, e, n, ret) => {
        expect(e.invert(n)).toStrictEqual(ret);
    });
});

describe('SeqMember.transpose()', () => {
    const table: [ string, SeqMember<unknown>, number, SeqMember<unknown> ][] = [
        [ 'NumSeqMember', NumSeqMember.from(5), 5, NumSeqMember.from(10) ],
        [ 'silent NoteSeqMember', NoteSeqMember.from(null), 5, NoteSeqMember.from(null) ],
        [ 'non-silent NoteSeqMember', NoteSeqMember.from(5), 5, NoteSeqMember.from(10) ],
        [ 'silent ChordSeqMember', ChordSeqMember.from([]), 5, ChordSeqMember.from([]) ],
        [ 'non-silent ChordSeqMember', ChordSeqMember.from([ 1, -3, 5 ]), 5, ChordSeqMember.from([ 6, 2, 10 ]) ],
        [ 'silent MelodyMember', MelodyMember.from([]), 5, MelodyMember.from([]) ],
        [ 'non-silent MelodyMember', MelodyMember.from([ 1, -3, 5 ]), 5, MelodyMember.from([ 6, 2, 10 ]) ]
    ];

    test.each(table)('works for a %s', (_, e, n, ret) => {
        expect(e.transpose(n)).toStrictEqual(ret);
    });
});

describe('SeqMember.augment()', () => {
    const table: [ string, SeqMember<unknown>, number, SeqMember<unknown> ][] = [
        [ 'NumSeqMember', NumSeqMember.from(5), 5, NumSeqMember.from(25) ],
        [ 'silent NoteSeqMember', NoteSeqMember.from(null), 0, NoteSeqMember.from(null) ],
        [ 'non-silent NoteSeqMember', NoteSeqMember.from(5), 0.2, NoteSeqMember.from(1) ],
        [ 'silent ChordSeqMember', ChordSeqMember.from([]), -5, ChordSeqMember.from([]) ],
        [ 'non-silent ChordSeqMember', ChordSeqMember.from([ 1, -3, 5 ]), -5, ChordSeqMember.from([ -5, 15, -25 ]) ],
        [ 'silent MelodyMember', MelodyMember.from([]), 5, MelodyMember.from([]) ],
        [ 'non-silent MelodyMember', MelodyMember.from([ 1, -3, 5 ]), 5, MelodyMember.from([ 5, -15, 25 ]) ]
    ];

    test.each(table)('works for a %s', (_, e, n, ret) => {
        expect(e.augment(n)).toStrictEqual(ret);
    });
});

describe('SeqMember.diminish()', () => {
    const table: [ string, SeqMember<unknown>, number, SeqMember<unknown> ][] = [
        [ 'NumSeqMember', NumSeqMember.from(5), 0.2, NumSeqMember.from(25) ],
        [ 'silent NoteSeqMember', NoteSeqMember.from(null), 0, NoteSeqMember.from(null) ],
        [ 'non-silent NoteSeqMember', NoteSeqMember.from(5), 5, NoteSeqMember.from(1) ],
        [ 'silent ChordSeqMember', ChordSeqMember.from([]), -5, ChordSeqMember.from([]) ],
        [ 'non-silent ChordSeqMember', ChordSeqMember.from([ 1, -3, 5 ]), -0.2, ChordSeqMember.from([ -5, 15, -25 ]) ],
        [ 'silent MelodyMember', MelodyMember.from([]), 5, MelodyMember.from([]) ],
        [ 'non-silent MelodyMember', MelodyMember.from([ 1, -3, 5 ]), 0.2, MelodyMember.from([ 5, -15, 25 ]) ]
    ];

    test.each(table)('works for a %s', (_, e, n, ret) => {
        expect(e.diminish(n)).toStrictEqual(ret);
    });
});

describe('SeqMember.mod()', () => {
    const table: [ string, SeqMember<unknown>, number, SeqMember<unknown> ][] = [
        [ 'NumSeqMember', NumSeqMember.from(5), 3, NumSeqMember.from(2) ],
        [ 'silent NoteSeqMember', NoteSeqMember.from(null), 4, NoteSeqMember.from(null) ],
        [ 'non-silent NoteSeqMember', NoteSeqMember.from(5), 4, NoteSeqMember.from(1) ],
        [ 'silent ChordSeqMember', ChordSeqMember.from([]), 4, ChordSeqMember.from([]) ],
        [ 'non-silent ChordSeqMember', ChordSeqMember.from([ 1, -3, 5 ]), 4, ChordSeqMember.from([ 1, 1, 1 ]) ],
        [ 'silent MelodyMember', MelodyMember.from([]), 5, MelodyMember.from([]) ],
        [ 'non-silent MelodyMember', MelodyMember.from([ 1, -3, 5 ]), 5, MelodyMember.from([ 1, 2, 0 ]) ],
    ];

    test.each(table)('works for a %s', (_, e, n, ret) => {
        expect(e.mod(n)).toStrictEqual(ret);
    });
});

// TODO: From here, tests probably can use rebuilding
describe('SeqMember.trim()', () => {
    const errortable: [ SeqMember<unknown>, number | null, number | null, SeqMember<unknown>? ][] = [
        [ NoteSeqMember.from(null), '5' as unknown as number, 10 ],
        [ NoteSeqMember.from(null), 5, '10' as unknown as number ],
        [ NoteSeqMember.from(null), 10, 5 ],
    ];

    test.each(errortable)('%p.trim(%p,%p) throws', (e, min, max) => {
        expect(() => e.trim(min, max)).toThrow();
    });

    const table: [ SeqMember<unknown>, number | null, number | null, SeqMember<unknown> ][] = [
        [ NumSeqMember.from(-8), -5, 10, NumSeqMember.from(-5) ],
        [ NoteSeqMember.from(null), -5, 10, NoteSeqMember.from(null) ],
        [ NoteSeqMember.from(-8), -5, 10, NoteSeqMember.from(-5) ],
        [ NoteSeqMember.from(5), -5, 10, NoteSeqMember.from(5) ],
        [ NoteSeqMember.from(15), -5, 10, NoteSeqMember.from(10) ],
        [ NoteSeqMember.from(-10), null, 10, NoteSeqMember.from(-10) ],
        [ NoteSeqMember.from(15), null, 10, NoteSeqMember.from(10) ],
        [ NoteSeqMember.from(-10), -5, null, NoteSeqMember.from(-5) ],
        [ NoteSeqMember.from(15), -5, null, NoteSeqMember.from(15) ],
        [ NoteSeqMember.from(0), null, null, NoteSeqMember.from(0) ],
        [ ChordSeqMember.from([]), -5, 10, ChordSeqMember.from([]) ],
        [ ChordSeqMember.from([ -8, 5, 15 ]), -5, 10, ChordSeqMember.from([ -5, 5, 10 ]) ],
        [ ChordSeqMember.from([ -8, 5, 15 ]), null, 10, ChordSeqMember.from([ -8, 5, 10 ]) ],
        [ ChordSeqMember.from([ -8, 5, 15 ]), -5, null, ChordSeqMember.from([ -5, 5, 15 ]) ],
        [ MelodyMember.from([]), -5, 10, MelodyMember.from([]) ],
        [ MelodyMember.from([ -8, 5, 15 ]), -5, 10, MelodyMember.from([ -5, 5, 10 ]) ],
        [ MelodyMember.from([ -8, 5, 15 ]), null, 10, MelodyMember.from([ -8, 5, 10 ]) ],
        [ MelodyMember.from([ -8, 5, 15 ]), -5, null, MelodyMember.from([ -5, 5, 15 ]) ],
    ];

    test.each(table)('%p.trim(%p,%p) returns %p', (e, min, max, ret) => {
        expect(e.trim(min, max)).toStrictEqual(ret);
    });
});

describe('SeqMember.bounce()', () => {
    const errortable: [ SeqMember<unknown>, number | null, number | null ][] = [
        [ NoteSeqMember.from(null), '5' as unknown as number, 10 ],
        [ NoteSeqMember.from(null), 5, '10' as unknown as number ],
        [ NoteSeqMember.from(null), 10, 5 ],
    ];

    test.each(errortable)('%p.bounce(%p,%p) throws', (e, min, max) => {
        expect(() => e.bounce(min, max)).toThrow();
    });

    const table: [ SeqMember<unknown>, number | null, number | null, SeqMember<unknown>? ][] = [
        [ NumSeqMember.from(-24), -10, -5, NumSeqMember.from(-6) ],
        [ NoteSeqMember.from(null), -10, -5, NoteSeqMember.from(null) ],
        [ NoteSeqMember.from(-24), -10, -5, NoteSeqMember.from(-6) ],
        [ NoteSeqMember.from(-8), -10, -5, NoteSeqMember.from(-8) ],
        [ NoteSeqMember.from(-15), -10, -5, NoteSeqMember.from(-5) ],
        [ ChordSeqMember.from([]), -10, -5, ChordSeqMember.from([]) ],
        [ ChordSeqMember.from([ -24, -18, -8, -3, 6, 15 ]), -10, -5, ChordSeqMember.from([ -6, -8, -8, -7, -6, -5 ]) ],
        [ ChordSeqMember.from([ -24, -18, -8, -3, 6, 15 ]), null, -5, ChordSeqMember.from([ -24, -18, -8, -7, -16, -25 ]) ],
        [ ChordSeqMember.from([ -24, -18, -8, -3, 6, 15 ]), -10, null, ChordSeqMember.from([ 4, -2, -8, -3, 6, 15 ]) ],
        [ MelodyMember.from([]), -10, -5, MelodyMember.from([]) ],
        [ MelodyMember.from([ -24, -18, -8, -3, 6, 15 ]), -10, -5, MelodyMember.from([ -6, -8, -8, -7, -6, -5 ]) ],
    ];

    test.each(table)('%p.bounce(%p,%p) returns %p', (e, min, max, ret) => {
        expect(e.bounce(min, max)).toStrictEqual(ret);
    });
});

describe('SeqMember.scale()', () => {
    const ce = ChordSeqMember.from([ -12, -11, -10, -9, -8, -7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12 ]);
    const me = MelodyMember.from([ -12, -11, -10, -9, -8, -7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12 ]);

    const errortable: [ SeqMember<unknown>, ScaleDefinition, number, number | undefined ][] = [
        [ NumSeqMember.from(5), 'chromatic', '50' as unknown as number, 12 ],
        [ NumSeqMember.from(5), 'banana', 50, undefined ],
        [ ChordSeqMember.from([ 5 ]), 'chromatic', 50, '12' as unknown as number ],
        [ NoteSeqMember.from(null), [], 50, undefined ],
        [ NoteSeqMember.from(null), [ 0, '2' as unknown as number, 4, 6, 8, 10 ], 50, undefined ],
    ];

    test.each(errortable)('%p.scale(%p,%p,%p) throws', (e, scale, zero, octave) => {
        expect(() => e.scale(scale, zero, octave)).toThrow();
    });

    const table: [ SeqMember<unknown>, ScaleDefinition, number, number | undefined, SeqMember<unknown> ][] = [
        [ NumSeqMember.from(5), 'chromatic', 50, undefined, NumSeqMember.from(55) ],
        [ NoteSeqMember.from(5), 'chromatic', 50, undefined, NoteSeqMember.from(55) ],
        [ NoteSeqMember.from(null), 'chromatic', 50, undefined, NoteSeqMember.from(null) ],
        [ ChordSeqMember.from([ 5 ]), 'chromatic', 50, undefined, ChordSeqMember.from([ 55 ]) ],
        [ ChordSeqMember.from([ 5 ]), 'chromatic', 50, 12, ChordSeqMember.from([ 55 ]) ],
        [ MelodyMember.from([ 5 ]), 'chromatic', 50, undefined, MelodyMember.from([ 55 ]) ],

        [ ce, 'chromatic',    60, undefined, ChordSeqMember.from([ 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72 ]) ],
        [ ce, 'octatonic12',  60, undefined, ChordSeqMember.from([ 42, 43, 45, 46, 48, 49, 51, 52, 54, 55, 57, 58, 60, 61, 63, 64, 66, 67, 69, 70, 72, 73, 75, 76, 78 ]) ],
        [ me, 'minor',        60, undefined, MelodyMember.from([ 39, 41, 43, 44, 46, 48, 50, 51, 53, 55, 56, 58, 60, 62, 63, 65, 67, 68, 70, 72, 74, 75, 77, 79, 80 ]) ],
        [ me, 'lydian',       60, undefined, MelodyMember.from([ 40, 42, 43, 45, 47, 48, 50, 52, 54, 55, 57, 59, 60, 62, 64, 66, 67, 69, 71, 72, 74, 76, 78, 79, 81 ]) ],

        [ ce, [ 0, 3, 6, 9 ], 60, undefined, ChordSeqMember.from([ 24, 27, 30, 33, 36, 39, 42, 45, 48, 51, 54, 57, 60, 63, 66, 69, 72, 75, 78, 81, 84, 87, 90, 93, 96 ]) ],
        [ ce, [ 1, 3, 6, 9 ], 60, 18, ChordSeqMember.from([ 7, 9, 12, 15, 25, 27, 30, 33, 43, 45, 48, 51, 61, 63, 66, 69, 79, 81, 84, 87, 97, 99, 102, 105, 115 ]) ],
        [ me, [ 0, 9, 3, 3 ], 60, undefined, MelodyMember.from([ 24, 33, 27, 27, 36, 45, 39, 39, 48, 57, 51, 51, 60, 69, 63, 63, 72, 81, 75, 75, 84, 93, 87, 87, 96 ]) ],
        [ me, [ 0, 9, 3, -3 ], 60, 6, MelodyMember.from([ 42, 51, 45, 39, 48, 57, 51, 45, 54, 63, 57, 51, 60, 69, 63, 57, 66, 75, 69, 63, 72, 81, 75, 69, 78 ]) ],
    ];

    test.each(table)('scale() %#', (e, scale, zero, octave, ret) => {
        expect(e.scale(scale, zero, octave)).toStrictEqual(ret);
    });
});

describe('SeqMember.gamut()', () => {
    const errortable: [ SeqMember<unknown>, number[], GamutOpts | undefined, SeqMember<unknown>? ][] = [
        [
            NoteSeqMember.from(null),
            'gamut' as unknown as number[],
            {},
        ],
        [
            NoteSeqMember.from(null),
            [ 54, 56, 58, 60, 62, 64, 66 ],
            'options' as unknown as GamutOpts,
        ],
        [
            NoteSeqMember.from(null),
            [],
            {},
        ],
        [
            ChordSeqMember.from([ 0, 1, -1, 2, 3, 4, -2, 8, -4 ]),
            [ 54, 56, 58, 60, 62, 64, 66 ],
            { zero: 59 },
        ],
    ];

    test.each(errortable)('%p.gamut(%p,%p) throws', (e, gamut, opts) => {
        expect(() => e.gamut(gamut, opts)).toThrow();
    });

    const table: [ SeqMember<unknown>, number[], GamutOpts | undefined, SeqMember<unknown> ][] = [
        [
            NumSeqMember.from(1),
            [ 54, 56, 58 ],
            undefined,
            NumSeqMember.from(56)
        ],
        [
            NoteSeqMember.from(null),
            [ 54, 56, 58 ],
            undefined,
            NoteSeqMember.from(null)
        ],
        [
            NoteSeqMember.from(3),
            [ 54, 56, 58 ],
            undefined,
            NoteSeqMember.from(54)
        ],
        [
            NoteSeqMember.from(3),
            [ 54, 56, 58 ],
            { highVal: null },
            NoteSeqMember.from(null)
        ],
        [
            ChordSeqMember.from([ 0, 1, -1, 2, 3, 4, -2, 8, -4 ]),
            [ 54, 56, 58, 60, 62, 64, 66 ],
            undefined,
            ChordSeqMember.from([ 54, 56, 66, 58, 60, 62, 64, 56, 60 ])
        ],
        [
            ChordSeqMember.from([ 0, 1, -1, 2, 3, 4, -2, 8, -4 ]),
            [ 54, 56, 58, 60, 62, 64, 66 ],
            {},
            ChordSeqMember.from([ 54, 56, 66, 58, 60, 62, 64, 56, 60 ])
        ],
        [
            ChordSeqMember.from([ 0, -5, 5, -9, 9, -12, 12 ]),
            [ 50, 55, 60, 65, 70 ],
            {},
            ChordSeqMember.from([ 50, 50, 50, 55, 70, 65, 60 ])
        ],
        [
            ChordSeqMember.from([ 0, -5, 5, -9, 9, -12, 12 ]),
            [ 50, 55, 60, 65, 70, 65, 60, 55 ],
            {},
            ChordSeqMember.from([ 50, 65, 65, 55, 55, 70, 70 ])
        ],
        [
            ChordSeqMember.from([ 0, -5, 5, -9, 9, -12, 12 ]),
            [ 50, 55, 60, 65, 70, 65, 60, 55 ],
            { zero: 50 },
            ChordSeqMember.from([ 50, 65, 65, 55, 55, 70, 70 ])
        ],
        [
            ChordSeqMember.from([ 0, -5, 5, -9, 9, -12, 12 ]),
            [ 50, 55, 60, 65, 70, 65, 60, 55 ],
            { zero: 60 },
            ChordSeqMember.from([ 60, 65, 55, 55, 65, 60, 60 ])
        ],
        [
            ChordSeqMember.from([ 0, 1, -1, 2, 3, 4, -2, 8, -4 ]),
            [ 54, 56, 58, 60, 62, 64, 66 ],
            { zero: 58 },
            ChordSeqMember.from([ 58, 60, 56, 62, 64, 66, 54, 60, 64 ])
        ],
        [
            ChordSeqMember.from([ -1, 0, 1, 2, 3 ]),
            [ 10, 20, 30 ],
            { lowVal: -10, highVal: 40 },
            ChordSeqMember.from([ -10, 10, 20, 30, 40 ])
        ],
        [
            ChordSeqMember.from([ 0, 1, -1, 2, 3, 4, -2, 8, -4 ]),
            [ 54, 56, 58, 60, 62, 64, 66 ],
            { lowVal: null, highVal: null },
            ChordSeqMember.from([ 54, 56, 58, 60, 62 ])
        ],
        [
            MelodyMember.from([ 0, 1, -1, 2, 3, 4, -2, 8, -4 ]),
            [ 54, 56, 58, 60, 62, 64, 66 ],
            { lowVal: null, highVal: null },
            MelodyMember.from([ 54, 56, 58, 60, 62 ])
        ],
        [
            MelodyMember.from([ 0, 1, -1, 2, 3, 4, -2, 8, -4 ]),
            [ 54, 56, 58, 60, 62, 64, 66 ],
            { lowVal: 53, highVal: 67 },
            MelodyMember.from([ 54, 56, 53, 58, 60, 62, 53, 67, 53 ])
        ],
        [
            MelodyMember.from([ 0, 1, -1, 2, 3, 4, -2, 8, -4 ]),
            [ 54, 56, 58, 60, 62, 64, 66 ],
            { zero: 58, highVal: 65 },
            MelodyMember.from([ 58, 60, 56, 62, 64, 66, 54, 65, 64 ])
        ],
        [
            MelodyMember.from([ 0, 1, -1, 2, 3, 4, -2, 8, -4 ]),
            [ 54, 56, 58, 60, 62, 64, 66 ],
            { zero: 58, highVal: 67, lowVal: 57 },
            MelodyMember.from([ 58, 60, 56, 62, 64, 66, 54, 67, 57 ]),
        ],
    ];

    test.each(table)('gamut() %#', (e, gamut, opts, ret) => {
        expect(e.gamut(gamut, opts)).toStrictEqual(ret);
    });
});