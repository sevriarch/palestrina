import * as visualizations from './visualizations';

import * as crypto from 'crypto';

import * as factory from '../factory';

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

const EMPTY_SCORE = factory.score([]);
const SAMPLE_SCORE = factory.score([
    factory.melody([ { pitch: [ 64 ], duration: 32, velocity: 80 }, { pitch: [], duration: 32, velocity: 60 }, { pitch: [ 60, 68 ], duration: 64, velocity: 60, offset: 64 }]),
    factory.melody([ { pitch: [ 26, 29 ], duration: 64, velocity: 80 }, { pitch: [ 33 ], duration: 64, velocity: 60 }, { pitch: [ 30, 32 ], duration: 96, velocity: 60 }]),
]).withTicksPerQuarter(128);

describe('visualizations.scoreToNotesCanvas()', () => {
    test('generates appropriate canvas with empty score', () => {
        const ret = visualizations.scoreToNotesCanvas(EMPTY_SCORE);

        for (const str of [
            'const timeline = [];',
            'const data = [];',
            'const options = {\"color_rule\":\"mod12\",\"value_rule\":\"note\",\"header\":\"Notes\"};',
        ]) {
            expect(ret).toEqual(expect.stringContaining(str));
        }
    });

    test('generates appropriate canvas with defaults overridden', () => {
        const ret = visualizations.scoreToNotesCanvas(SAMPLE_SCORE, { color_rule: '#C0C0C0', value_rule: 'pitch', width: 640, height: 320 });

        for (const str of [
            'const timeline = [0,32,64,128,192,224];',
            'const data = [[26,29,64],[26,29],[33],[30,32,60,68],[30,32],[]];',
            'const options = {\"color_rule\":\"#C0C0C0\",\"value_rule\":\"pitch\",\"header\":\"Notes\",\"width\":640,\"height\":320};',
        ]) {
            expect(ret).toEqual(expect.stringContaining(str));
        }
    });
});

describe('visualizations.scoreToGamutCanvas()', () => {
    test('generates appropriate canvas with empty score', () => {
        const ret = visualizations.scoreToGamutCanvas(EMPTY_SCORE);

        for (const str of [
            'const timeline = [];',
            'const data = [];',
            'const options = {\"color_rule\":\"mod12\",\"value_rule\":\"gamut\",\"header\":\"Gamut\"};',
        ]) {
            expect(ret).toEqual(expect.stringContaining(str));
        }
    });

    test('generates appropriate canvas with defaults overridden', () => {
        const ret = visualizations.scoreToGamutCanvas(SAMPLE_SCORE, { color_rule: '#C0C0C0', value_rule: 'pitch', width: 640, height: 320 });

        for (const str of [
            'const timeline = [0,32,64,128,192,224];',
            'const data = [[2,4,5],[2,5],[9],[0,6,8],[6,8],[]];',
            'const options = {\"color_rule\":\"#C0C0C0\",\"value_rule\":\"pitch\",\"header\":\"Gamut\",\"width\":640,\"height\":320};',
        ]) {
            expect(ret).toEqual(expect.stringContaining(str));
        }
    });
});

describe('visualizations.scoreToIntervalsCanvas()', () => {
    test('generates appropriate canvas with empty score', () => {
        const ret = visualizations.scoreToIntervalsCanvas(EMPTY_SCORE);

        for (const str of [
            'const timeline = [];',
            'const data = [];',
            'const options = {\"color_rule\":\"mod12\",\"value_rule\":\"number\",\"header\":\"Intervals\"};',
        ]) {
            expect(ret).toEqual(expect.stringContaining(str));
        }
    });

    test('generates appropriate canvas with defaults overridden', () => {
        const ret = visualizations.scoreToIntervalsCanvas(SAMPLE_SCORE, { color_rule: '#C0C0C0', value_rule: 'pitch', width: 640, height: 320 });

        for (const str of [
            'const timeline = [0,32,64,128,192,224];',
            'const data = [[3,35,38],[3],[],[2,8,28,30,36,38],[2],[]];',
            'const options = {\"color_rule\":\"#C0C0C0\",\"value_rule\":\"pitch\",\"header\":\"Intervals\",\"width\":640,\"height\":320};',
        ]) {
            expect(ret).toEqual(expect.stringContaining(str));
        }
    });
});

describe('visualizations.scoreToIntervalGamutCanvas()', () => {
    test('generates appropriate canvas with empty score', () => {
        const ret = visualizations.scoreToIntervalGamutCanvas(EMPTY_SCORE);

        for (const str of [
            'const timeline = [];',
            'const data = [];',
            'const options = {\"color_rule\":\"mod12\",\"value_rule\":\"gamut\",\"header\":\"Interval Gamut\"};',
        ]) {
            expect(ret).toEqual(expect.stringContaining(str));
        }
    });

    test('generates appropriate canvas with defaults overridden', () => {
        const ret = visualizations.scoreToIntervalGamutCanvas(SAMPLE_SCORE, { color_rule: '#C0C0C0', value_rule: 'pitch', width: 640, height: 320 });

        for (const str of [
            'const timeline = [0,32,64,128,192,224];',
            'const data = [[2,3,11],[3],[],[0,2,4,6,8],[2],[]];',
            'const options = {\"color_rule\":\"#C0C0C0\",\"value_rule\":\"pitch\",\"header\":\"Interval Gamut\",\"width\":640,\"height\":320};',
        ]) {
            expect(ret).toEqual(expect.stringContaining(str));
        }
    });
});

describe('visualizations.scoreToScoreCanvas()', () => {
    test('generates appropriate canvas with empty score', () => {
        const ret = visualizations.scoreToScoreCanvas(EMPTY_SCORE);

        for (const str of [
            'var tracks = [];',
            'var min_p = null;',
            'var max_p = null;',
            'var end = null;',
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
