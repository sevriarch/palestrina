import * as crypto from 'crypto';

import { Melody } from '../sequences/sequences';

import * as visualizations from './visualizations';
import Score from '../scores/score';

function getHash(str: string): string {
    const hash = crypto.createHash('md5');

    hash.update(Buffer.from(str));

    return hash.digest('hex');
}

describe('visualizations.JSONTemplate()', () => {
    test('should fail if template is an invalid value', () => {
        expect(() => visualizations.JSONTemplate(123 as unknown as string, {})).toThrow();
    });

    test('should fail if template contains invalid characters', () => {
        expect(() => visualizations.JSONTemplate('../templates/score', {})).toThrow();
    });

    test('should return the correct template', () => {
        expect(getHash(visualizations.JSONTemplate('score'))).toEqual('4eb01617c97565cb86462e5be504ef18');
    });

    test('should substitute correctly', () => {
        const str = visualizations.JSONTemplate('test', {
            __STRING_VAR__: 'string',
            __NUM_VAR__: 123,
            __BOOL_VAR__: true,
            __ARRAY_VAR__: [ 1, 2, 3 ],
            __OBJ_VAR__: { a: 1, b: [] }
        });

        expect(str).toEqual('<script>\nvar stringvar = "string";\nvar numvar = 123;\nvar boolvar = true;\nvar arrayvar = [1,2,3];\nvar objvar = {"a":1,"b":[]};\n</script>\n');
    });
});

describe('visualizations.render2DCanvas() tests', () => {
    test('non-string name should throw an error', () => {
        expect(() => visualizations.render2DCanvas({ name: 444 as unknown as string, timeline: [], data: [] })).toThrow();
    });

    test('non-array timeline should throw an error', () => {
        expect(() => visualizations.render2DCanvas({ name: 'test', timeline: 444 as unknown as number[], data: [] })).toThrow();
    });

    test('non-array timeline should throw an error', () => {
        expect(() => visualizations.render2DCanvas({ name: 'test', timeline: [], data: 444 as unknown as number[][] })).toThrow();
    });

    test('different timeline and data lengths should throw an error', () => {
        expect(() => visualizations.render2DCanvas({ name: 'test', timeline: [ 0, 64 ], data: [ [ 0, 6 ] ] })).toThrow();
    });

    test('name should appear in the visualizations ID', () => {
        expect(visualizations.render2DCanvas({ name: 'test', timeline: [], data: [] }))
            .toEqual(expect.stringContaining('<canvas id="test-canvas"'));
    });

    test('timeline should appear in the visualizations code', () => {
        expect(visualizations.render2DCanvas({ name: 'test', timeline: [ 0, 64, 128 ], data: [ [ 0 ], [ 6, 12 ], [ 18, 24, 30 ] ] }))
            .toEqual(expect.stringContaining('const timeline = [0,64,128]'));
    });

    test('data should appear in the visualizations code', () => {
        expect(visualizations.render2DCanvas({ name: 'test', timeline: [ 0, 64, 128 ], data: [ [ 0 ], [ 6, 12 ], [ 18, 24, 30 ] ] }))
            .toEqual(expect.stringContaining('const data = [[0],[6,12],[18,24,30]]'));
    });

    test('options should appear in the visualizations code even if not passed', () => {
        expect(visualizations.render2DCanvas({ name: 'test', timeline: [], data: [] }))
            .toEqual(expect.stringContaining('const options = {}'));
    });

    test('options should appear in the visualizations code if passed', () => {
        expect(visualizations.render2DCanvas({ name: 'test', timeline: [], data: [], options: { px_horiz: 0.1 } }))
            .toEqual(expect.stringContaining('const options = {"px_horiz":0.1}'));
    });
});

const EMPTY_SCORE = Score.from([]);
const SAMPLE_SCORE = Score.from([
    Melody.from([ { pitch: [ 64 ], duration: 32, velocity: 80 }, { pitch: [], duration: 32, velocity: 60 }, { pitch: [ 60, 68 ], duration: 64, velocity: 60, offset: 64 }]),
    Melody.from([ { pitch: [ 26, 29 ], duration: 64, velocity: 80 }, { pitch: [ 33 ], duration: 64, velocity: 60 }, { pitch: [ 30, 32 ], duration: 96, velocity: 60 }]),
]).withTicksPerQuarter(128);

// This section only tests some limited error handling as functionality is
// tested through Score features that generate SVGs by calling this method.
describe('visualizations.scoreTo2DSVG', () => {
    test('throws if id is not a string', () => {
        expect(() => visualizations.scoreTo2DSVG(EMPTY_SCORE, () => [ [], [] ], { id: 0 as unknown as string})).toThrow();
    });

    test('throws if timeline generator returns an tuple containing different lengths', () => {
        expect(() => visualizations.scoreTo2DSVG(EMPTY_SCORE, (() => [ [ 1 ], [] ]), {})).toThrow();
    });

    test('applies defaults if none are present', () => {
        expect(visualizations.scoreTo2DSVG(EMPTY_SCORE, () => [ [], [] ] )).toStrictEqual(`<svg id="unknown_svg" viewbox="0,0,0,0" width="0" height="0" xmlns="http://www.w3.org/2000/svg" style="border:1px solid black; background: black">
  <style>
    text {
      font-family: "Arial";
      font-size: 12px;
    }

    line {
      stroke-width: 1;
      stroke: #404040;
    }
  </style>
</svg>
`);
    });
});

describe('visualizations.scoreToScoreCanvas()', () => {
    test('generates appropriate canvas with empty score', () => {
        const ret = visualizations.scoreToScoreCanvas(EMPTY_SCORE);

        for (const str of [
            'var tracks = [];',
            'var min_p = null;',
            'var max_p = null;',
            'var end = 0;',
            'var tgt_ht = 750',
            'var tgt_wd = 2500',
            'var min_wd = 2',
            'var ticks_sc = 192',
            'var ticks_px = 0',
        ]) {
            expect(ret).toEqual(expect.stringContaining(str));
        }
    });

    test('generates appropriate canvas with defaults overridden', () => {
        const ret = visualizations.scoreToScoreCanvas(SAMPLE_SCORE, { ht: 100, wd: 1000, wd_scale: 3, wd_quarter: 4 });

        for (const str of [
            'var tracks = [[{\"tick\":0,\"pitch\":[64],\"duration\":32,\"velocity\":80},{\"tick\":128,\"pitch\":[60,68],\"duration\":64,\"velocity\":60}],[{\"tick\":0,\"pitch\":[26,29],\"duration\":64,\"velocity\":80},{\"tick\":64,\"pitch\":[33],\"duration\":64,\"velocity\":60},{\"tick\":128,\"pitch\":[30,32],\"duration\":96,\"velocity\":60}]];',
            'var min_p = 26;',
            'var max_p = 68;',
            'var end = 224;',
            'var tgt_ht = 100',
            'var tgt_wd = 1000',
            'var min_wd = 2',
            'var ticks_sc = 384',
            'var ticks_px = 32',
        ]) {
            expect(ret).toEqual(expect.stringContaining(str));
        }
    });
});
