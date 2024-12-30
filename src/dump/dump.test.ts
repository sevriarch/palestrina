import * as dump from './dump';

import MetaList from '../meta-events/meta-list';
import NoteSeq from '../sequences/note';
import Melody from '../sequences/melody';
import Score from '../scores/score';

describe('dump.dumpMultiLine()', () => {
    const table: [ string, unknown, number | undefined, string ][] = [
        [
            'boolean true',
            true,
            0,
            'true',
        ],
        [
            'boolean false',
            false,
            undefined,
            'false',
        ],
        [
            'null',
            null,
            undefined,
            'null',
        ],
        [
            'undefined',
            undefined,
            undefined,
            'undefined',
        ],
        [
            'empty array',
            [],
            0,
            'Array(len=0)[]'
        ],
        [
            'empty array, padded',
            [],
            4,
            'Array(len=0)[]'
        ],
        [
            'array with one number',
            [ 1 ],
            0,
            'Array(len=1)[\n  0: 1\n]'
        ],
        [
            'array with one number, padded',
            [ 1 ],
            4,
            'Array(len=1)[\n      0: 1\n    ]'
        ],
        [
            'array with strings',
            [ '', 'aaah', '"yes"' ],
            0,
            'Array(len=3)[\n  0: ""\n  1: "aaah"\n  2: "\\"yes\\""\n]'
        ],
        [
            'array with strings, padded',
            [ '', 'aaah', '"yes"' ],
            2,
            'Array(len=3)[\n    0: ""\n    1: "aaah"\n    2: "\\"yes\\""\n  ]'
        ],
        [
            'empty object',
            {},
            0,
            '{}'
        ],
        [
            'empty object, padded',
            {},
            4,
            '{}'
        ],
        [
            'object with values',
            { a: 1, b: 'two' },
            0,
            '{\n  \"a\": 1\n  \"b\": \"two\"\n}',
        ],
        [
            'object with values, indented',
            { a: 1, b: 'two' },
            2,
            '{\n    \"a\": 1\n    \"b\": \"two\"\n  }',
        ],
        [
            'nested items',
            {
                a: 1,
                b: [ 2, 3, { c: [ 4, 5 ] } ],
                c: { a: 1, b: [ 2, 3 ], c: 'yes' }
            },
            0,
            `{
  "a": 1
  "b": Array(len=3)[
    0: 2
    1: 3
    2: {
      "c": Array(len=2)[
        0: 4
        1: 5
      ]
    }
  ]
  "c": {
    "a": 1
    "b": Array(len=2)[
      0: 2
      1: 3
    ]
    "c": "yes"
  }
}`
        ],
        [
            'nested items, indented',
            {
                a: 1,
                b: [ 2, 3, { c: [ 4, 5 ] } ],
                c: { a: 1, b: [ 2, 3 ], c: 'yes' }
            },
            4,
            `{
      "a": 1
      "b": Array(len=3)[
        0: 2
        1: 3
        2: {
          "c": Array(len=2)[
            0: 4
            1: 5
          ]
        }
      ]
      "c": {
        "a": 1
        "b": Array(len=2)[
          0: 2
          1: 3
        ]
        "c": "yes"
      }
    }`
        ],
        [
            'MetaList',
            MetaList.from([ { event: 'copyright', value: 'test' }, { event: 'tempo', value: 144 } ]),
            4,
            'MetaList(length=2)([0: MetaEvent({event:"copyright",value:"test",at:undefined,offset:undefined}),1: MetaEvent({event:"tempo",value:144,at:undefined,offset:undefined}),])'
        ],
        [
            'NoteSeq',
            NoteSeq.from([ 5, null, 20, 5, 10, 5 ]),
            4,
            `NoteSeq(length=6,metadata=Metadata({}))([
        0: NoteSeqMember(5),
        1: NoteSeqMember(null),
        2: NoteSeqMember(20),
        3: NoteSeqMember(5),
        4: NoteSeqMember(10),
        5: NoteSeqMember(5),
    ])`
        ],
        [
            'Score',
            Score.from([
                Melody.from([ 1, 4, 6, 19 ], { instrument: 'violin' }),
                Melody.from([ 12, { pitch: [ 6 ], before: [ { event: 'text', value: 'test' } ] } ], { instrument: 'cello' })
            ], { tempo: 144, time_signature: '3/8' }),
            4,
            `Score(length=2,metadata=Metadata({tempo=144,time_signature=\"3/8\"}))([
        0: Melody(length=4,metadata=Metadata({instrument=\"violin\"}))([
            0: MelodyMember({pitch:ChordSeqMember([1]),velocity:64,duration:16,at:undefined,offset:0,delay:0,before:MetaList(length=0)([]),after:MetaList(length=0)([])}),
            1: MelodyMember({pitch:ChordSeqMember([4]),velocity:64,duration:16,at:undefined,offset:0,delay:0,before:MetaList(length=0)([]),after:MetaList(length=0)([])}),
            2: MelodyMember({pitch:ChordSeqMember([6]),velocity:64,duration:16,at:undefined,offset:0,delay:0,before:MetaList(length=0)([]),after:MetaList(length=0)([])}),
            3: MelodyMember({pitch:ChordSeqMember([19]),velocity:64,duration:16,at:undefined,offset:0,delay:0,before:MetaList(length=0)([]),after:MetaList(length=0)([])}),
        ]),
        1: Melody(length=2,metadata=Metadata({instrument=\"cello\"}))([
            0: MelodyMember({pitch:ChordSeqMember([12]),velocity:64,duration:16,at:undefined,offset:0,delay:0,before:MetaList(length=0)([]),after:MetaList(length=0)([])}),
            1: MelodyMember({pitch:ChordSeqMember([6]),velocity:64,duration:16,at:undefined,offset:0,delay:0,before:MetaList(length=1)([0: MetaEvent({event:\"text\",value:\"test\",at:undefined,offset:undefined}),]),after:MetaList(length=0)([])}),
        ]),
    ])`
        ]
    ];

    test.each(table)('dumping %s', (_, val, indent, ret) => {
        expect(dump.dumpMultiLine(val, indent)).toStrictEqual(ret);
    });
});

describe('dump.dumpOneLine()', () => {
    const table: [ string, unknown, string ][] = [
        [
            'boolean true',
            true,
            'true',
        ],
        [
            'boolean false',
            false,
            'false',
        ],
        [
            'null',
            null,
            'null',
        ],
        [
            'undefined',
            undefined,
            'undefined',
        ],
        [
            'empty array',
            [],
            '[]'
        ],
        [
            'array with one number',
            [ 1 ],
            '[1]'
        ],
        [
            'array with strings',
            [ '', 'aaah', '"yes"' ],
            '["","aaah","\\"yes\\""]'
        ],
        [
            'empty object',
            {},
            '{}'
        ],
        [
            'object with values',
            { a: 1, b: 'two' },
            '{"a":1,"b":"two"}',
        ],
        [
            'nested items',
            {
                a: 1,
                b: [ 2, 3, { c: [ 4, 5 ] } ],
                c: { a: 1, b: [ 2, 3 ], c: 'yes' }
            },
            '{"a":1,"b":[2,3,{"c":[4,5]}],"c":{"a":1,"b":[2,3],"c":"yes"}}'
        ],
        [
            'MetaList',
            MetaList.from([ { event: 'copyright', value: 'test' }, { event: 'tempo', value: 144 } ]),
            'MetaList(length=2)([0: MetaEvent({event:"copyright",value:"test",at:undefined,offset:undefined}),1: MetaEvent({event:"tempo",value:144,at:undefined,offset:undefined}),])'
        ],
    ];

    test.each(table)('dumping %s', (_, val, ret) => {
        expect(dump.dumpOneLine(val)).toStrictEqual(ret);
    });
});

describe('dump.dumpHex()', () => {
    const table: [ string, number[], string ][] = [
        [ 'empty', [], '0x' ],
        [ 'one byte, below 16', [ 0x0f ], '0x0f' ],
        [ 'one byte, above 16', [ 0x7f ], '0x7f' ],
        [ 'four bytes', [ 0x20, 0x30, 0x00, 0x80 ], '0x20300080' ],
        [ 'four bytes, first byte zero', [ 0x00, 0x7f, 0xff, 0xb0 ], '0x007fffb0' ],
    ];

    test.each(table)('when %s', (_, bytes, ret) => {
        expect(dump.dumpHex(...bytes)).toStrictEqual(ret);
    });
});