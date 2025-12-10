import { ValidatorFn, SeqArgument } from '../types';

import { NumSeq, numseq, NoteSeq, noteseq, ChordSeq, chordseq, Melody, melody } from './sequences';

import NumericValidator from '../validation/numeric';

describe('numseq()', () => {
    const errortable: [ string, SeqArgument, string | undefined, ValidatorFn | undefined ][] = [
        [
            'no values are included',
            0 as unknown as SeqArgument,
            undefined,
            undefined
        ] ,
        [
            'invalid validator type passed',
            [],
            'meow',
            undefined
        ],
        [
            'invalid custom validator passed',
            [],
            'custom',
            0 as unknown as ValidatorFn
        ],
        [
            'invalid value in integer sequence',
            [ 1, 1.5, 2 ],
            'int',
            undefined
        ],
        [
            'invalid value in semitone sequence',
            [ 1, 1.5, 2 ],
            'semitone',
            undefined
        ],
        [
            'invalid value in quartertone sequence; shows that new validator overrides existing',
            NumSeq.from([ 1, 1.25, 1.5 ], { validator: NumericValidator.NOOP_VALIDATOR }),
            'quartertone',
            undefined
        ],
        [
            'invalid value in sixthtone sequence; shows that new validator overrides existing',
            NoteSeq.from([ 1, 1.25, 4 / 3 ], { validator: NumericValidator.NOOP_VALIDATOR }),
            'sixthtone',
            undefined
        ],
        [
            'invalid value in custom sequence',
            ChordSeq.from([ 1, 5, 9 ]),
            'custom',
            v => v % 3 !== 0
        ],
        [
            'null value present',
            NoteSeq.from([ 1, null, 2 ]),
            'none',
            undefined
        ],
        [
            'multiple values present',
            Melody.from([ { pitch: [ 1, 5 ], duration: 64, velocity: 80 }, { pitch: 9, duration: 32, velocity: 72 } ]),
            'microtonal',
            undefined
        ],
    ];

    test.each(errortable)('%s', (_, arg, val, fn) => {
        expect(() => numseq(arg, val, fn)).toThrow();
    });

    const table: [ string, SeqArgument, string | undefined, ValidatorFn | undefined, NumSeq ][] = [
        [
            'valid values in integer sequence',
            [ 1, 5, 2 ],
            'int',
            undefined,
            NumSeq.from([ 1, 5, 2 ])
        ],
        [
            'valid values in semitone sequence',
            [ 1, 5, 2 ],
            'semitone',
            undefined,
            NumSeq.from([ 1, 5, 2 ])
        ],
        [
            'valid values in quartertone sequence',
            NumSeq.from([ 1, 2.5, 1.5 ], { validator: NumericValidator.NOOP_VALIDATOR }),
            'quartertone',
            undefined,
            NumSeq.from([ 1, 2.5, 1.5 ], { validator: NumericValidator.FRACTION_VALIDATOR(2) }),
        ],
        [
            'valid values in sixthtone sequence',
            NoteSeq.from([ 1, 5 / 3, 4 / 3 ], { validator: NumericValidator.NOOP_VALIDATOR }),
            'sixthtone',
            undefined,
            NumSeq.from([ 1, 5 / 3, 4 / 3 ], { validator: NumericValidator.FRACTION_VALIDATOR(3) }),
        ],
        [
            'valid values in custom sequence',
            ChordSeq.from([ 1, 5, 9 ]),
            'custom',
            v => v % 4 !== 0,
            NumSeq.from([ 1, 5, 9 ], { validator: NumericValidator.CUSTOM_VALIDATOR(v => v % 4 !== 0) }),
        ],
    ];

    test.each(table)('%s', (_, arg, val, fn, ret) => {
        expect(numseq(arg, val, fn).contents).toStrictEqual(ret.contents);
    });
});

describe('noteseq()', () => {
    const errortable: [ string, SeqArgument, string | undefined, ValidatorFn | undefined ][] = [
        [
            'no values are included',
            0 as unknown as SeqArgument,
            undefined,
            undefined
        ] ,
        [
            'invalid validator type passed',
            [],
            'meow',
            undefined
        ],
        [
            'invalid custom validator passed',
            [],
            'custom',
            0 as unknown as ValidatorFn
        ],
        [
            'invalid value in integer sequence',
            [ 1, 1.5, 2 ],
            'int',
            undefined
        ],
        [
            'invalid value in semitone sequence',
            [ 1, 1.5, 2 ],
            'semitone',
            undefined
        ],
        [
            'invalid value in quartertone sequence; shows that new validator overrides existing',
            NumSeq.from([ 1, 1.25, 1.5 ], { validator: NumericValidator.NOOP_VALIDATOR }),
            'quartertone',
            undefined
        ],
        [
            'invalid value in sixthtone sequence; shows that new validator overrides existing',
            NoteSeq.from([ 1, 1.25, 4 / 3 ], { validator: NumericValidator.NOOP_VALIDATOR }),
            'sixthtone',
            undefined
        ],
        [
            'invalid value in custom sequence',
            ChordSeq.from([ 1, 5, 9 ]),
            'custom',
            v => v % 3 !== 0
        ],
        [
            'multiple values present',
            Melody.from([ { pitch: [ 1, 5 ], duration: 64, velocity: 80 }, { pitch: 9, duration: 32, velocity: 72 } ]),
            'microtonal',
            undefined
        ],
    ];

    test.each(errortable)('%s', (_, arg, val, fn) => {
        expect(() => noteseq(arg, val, fn)).toThrow();
    });

    const table: [ string, SeqArgument, string | undefined, ValidatorFn | undefined, NoteSeq ][] = [
        [
            'valid values in integer sequence',
            [ 1, 5, 2 ],
            'int',
            undefined,
            NoteSeq.from([ 1, 5, 2 ])
        ],
        [
            'valid values in semitone sequence',
            [ 1, 5, 2 ],
            'semitone',
            undefined,
            NoteSeq.from([ 1, 5, 2 ])
        ],
        [
            'null value present',
            NoteSeq.from([ 1, null, 2 ]),
            'none',
            undefined,
            NoteSeq.from([ 1, null, 2 ]),
        ],
        [
            'valid values in quartertone sequence',
            NumSeq.from([ 1, 2.5, 1.5 ], { validator: NumericValidator.NOOP_VALIDATOR }),
            'quartertone',
            undefined,
            NoteSeq.from([ 1, 2.5, 1.5 ], { validator: NumericValidator.FRACTION_VALIDATOR(2) }),
        ],
        [
            'valid values in sixthtone sequence',
            NoteSeq.from([ 1, 5 / 3, 4 / 3 ], { validator: NumericValidator.NOOP_VALIDATOR }),
            'sixthtone',
            undefined,
            NoteSeq.from([ 1, 5 / 3, 4 / 3 ], { validator: NumericValidator.FRACTION_VALIDATOR(3) }),
        ],
        [
            'valid values in custom sequence',
            ChordSeq.from([ 1, 5, 9 ]),
            'custom',
            v => v % 4 !== 0,
            NoteSeq.from([ 1, 5, 9 ], { validator: NumericValidator.CUSTOM_VALIDATOR(v => v % 4 !== 0) }),
        ],
    ];

    test.each(table)('%s', (_, arg, val, fn, ret) => {
        expect(noteseq(arg, val, fn).contents).toStrictEqual(ret.contents);
    });
});

describe('chordseq()', () => {
    const errortable: [ string, SeqArgument, string | undefined, ValidatorFn | undefined ][] = [
        [
            'no values are included',
            0 as unknown as SeqArgument,
            undefined,
            undefined
        ],
        [
            'invalid validator type passed',
            [],
            'meow',
            undefined
        ],
        [
            'invalid custom validator passed',
            [],
            'custom',
            0 as unknown as ValidatorFn
        ],
        [
            'invalid value in integer sequence',
            [ 1, 1.5, 2 ],
            'int',
            undefined
        ],
        [
            'invalid value in semitone sequence',
            [ 1, 1.5, 2 ],
            'semitone',
            undefined
        ],
        [
            'invalid value in quartertone sequence; shows that new validator overrides existing',
            NumSeq.from([ 1, 1.25, 1.5 ], { validator: NumericValidator.NOOP_VALIDATOR }),
            'quartertone',
            undefined
        ],
        [
            'invalid value in sixthtone sequence; shows that new validator overrides existing',
            NoteSeq.from([ 1, 1.25, 4 / 3 ], { validator: NumericValidator.NOOP_VALIDATOR }),
            'sixthtone',
            undefined
        ],
        [
            'invalid value in custom sequence',
            ChordSeq.from([ 1, 5, 9 ]),
            'custom',
            v => v % 3 !== 0
        ],
    ];

    test.each(errortable)('%s', (_, arg, val, fn) => {
        expect(() => chordseq(arg, val, fn)).toThrow();
    });

    const table: [ string, SeqArgument, string | undefined, ValidatorFn | undefined, ChordSeq ][] = [
        [
            'valid values in integer sequence',
            [ 1, 5, 2 ],
            'int',
            undefined,
            ChordSeq.from([ 1, 5, 2 ])
        ],
        [
            'valid values in semitone sequence',
            [ 1, 5, 2 ],
            'semitone',
            undefined,
            ChordSeq.from([ 1, 5, 2 ])
        ],
        [
            'null value present',
            NoteSeq.from([ 1, null, 2 ]),
            'none',
            undefined,
            ChordSeq.from([ 1, null, 2 ]),
        ],
        [
            'valid values in quartertone sequence',
            NumSeq.from([ 1, 2.5, 1.5 ], { validator: NumericValidator.NOOP_VALIDATOR }),
            'quartertone',
            undefined,
            ChordSeq.from([ 1, 2.5, 1.5 ], { validator: NumericValidator.FRACTION_VALIDATOR(2) }),
        ],
        [
            'valid values in sixthtone sequence',
            NoteSeq.from([ 1, 5 / 3, 4 / 3 ], { validator: NumericValidator.NOOP_VALIDATOR }),
            'sixthtone',
            undefined,
            ChordSeq.from([ 1, 5 / 3, 4 / 3 ], { validator: NumericValidator.FRACTION_VALIDATOR(3) }),
        ],
        [
            'valid values in custom sequence',
            ChordSeq.from([ 1, 5, 9 ]),
            'custom',
            v => v % 4 !== 0,
            ChordSeq.from([ 1, 5, 9 ], { validator: NumericValidator.CUSTOM_VALIDATOR(v => v % 4 !== 0) }),
        ],
        [
            'multiple values present',
            Melody.from([ { pitch: [ 1, 5 ], duration: 64, velocity: 80 }, { pitch: 9, duration: 32, velocity: 72 } ]),
            'microtonal',
            undefined,
            ChordSeq.from([ [ 1, 5 ], 9 ]),
        ],
    ];

    test.each(table)('%s', (_, arg, val, fn, ret) => {
        expect(chordseq(arg, val, fn).contents).toStrictEqual(ret.contents);
    });
});

describe('melody()', () => {
    const errortable: [ string, SeqArgument, string | undefined, ValidatorFn | undefined ][] = [
        [
            'no values are included',
            0 as unknown as SeqArgument,
            undefined,
            undefined
        ],
        [
            'invalid validator type passed',
            [],
            'meow',
            undefined
        ],
        [
            'invalid custom validator passed',
            [],
            'custom',
            0 as unknown as ValidatorFn
        ],
        [
            'invalid value in integer sequence',
            [ 1, 1.5, 2 ],
            'int',
            undefined
        ],
        [
            'invalid value in semitone sequence',
            [ 1, 1.5, 2 ],
            'semitone',
            undefined
        ],
        [
            'invalid value in quartertone sequence; shows that new validator overrides existing',
            NumSeq.from([ 1, 1.25, 1.5 ], { validator: NumericValidator.NOOP_VALIDATOR }),
            'quartertone',
            undefined
        ],
        [
            'invalid value in sixthtone sequence; shows that new validator overrides existing',
            NoteSeq.from([ 1, 1.25, 4 / 3 ], { validator: NumericValidator.NOOP_VALIDATOR }),
            'sixthtone',
            undefined
        ],
        [
            'invalid value in custom sequence',
            ChordSeq.from([ 1, 5, 9 ]),
            'custom',
            v => v % 3 !== 0
        ],
    ];

    test.each(errortable)('%s', (_, arg, val, fn) => {
        expect(() => melody(arg, val, fn)).toThrow();
    });

    const table: [ string, SeqArgument, string | undefined, ValidatorFn | undefined, Melody ][] = [
        [
            'valid values in integer sequence',
            [ 1, 5, 2 ],
            'int',
            undefined,
            Melody.from([ 1, 5, 2 ])
        ],
        [
            'valid values in semitone sequence',
            [ 1, 5, 2 ],
            'semitone',
            undefined,
            Melody.from([ 1, 5, 2 ])
        ],
        [
            'null value present',
            NoteSeq.from([ 1, null, 2 ]),
            'none',
            undefined,
            Melody.from([ 1, null, 2 ]),
        ],
        [
            'valid values in quartertone sequence',
            NumSeq.from([ 1, 2.5, 1.5 ], { validator: NumericValidator.NOOP_VALIDATOR }),
            'quartertone',
            undefined,
            Melody.from([ 1, 2.5, 1.5 ], { validator: NumericValidator.FRACTION_VALIDATOR(2) }),
        ],
        [
            'valid values in sixthtone sequence',
            NoteSeq.from([ 1, 5 / 3, 4 / 3 ], { validator: NumericValidator.NOOP_VALIDATOR }),
            'sixthtone',
            undefined,
            Melody.from([ 1, 5 / 3, 4 / 3 ], { validator: NumericValidator.FRACTION_VALIDATOR(3) }),
        ],
        [
            'valid values in custom sequence',
            ChordSeq.from([ 1, 5, 9 ]),
            'custom',
            v => v % 4 !== 0,
            Melody.from([ 1, 5, 9 ], { validator: NumericValidator.CUSTOM_VALIDATOR(v => v % 4 !== 0) }),
        ],
        [
            'multiple values present',
            Melody.from([ { pitch: [ 1, 5 ], duration: 64, velocity: 80 }, { pitch: 9, duration: 32, velocity: 72 } ]),
            'microtonal',
            undefined,
            Melody.from([ { pitch: [ 1, 5 ], duration: 64, velocity: 80 }, { pitch: 9, duration: 32, velocity: 72 } ]),
        ],
    ];

    test.each(table)('%s', (_, arg, val, fn, ret) => {
        expect(melody(arg, val, fn).contents).toStrictEqual(ret.contents);
    });
});