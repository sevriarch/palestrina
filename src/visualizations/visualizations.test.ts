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

describe('visualizations.scoreToNotesSVG()', () => {
    test('fails with non-string name', () => {
        expect(() => visualizations.scoreToNotesSVG(EMPTY_SCORE, {}, 123 as unknown as string)).toThrow();
    });

    test('generates appropriate canvas with empty score', () => {
        expect(visualizations.scoreToNotesSVG(EMPTY_SCORE)).toStrictEqual(`<svg viewbox=\"0,0,0,0\" width=\"0\" height=\"0\" xmlns=\"http://www.w3.org/2000/svg\" style=\"border:1px solid black; background: black\">
  <style>
    text {
      font-family: \"Arial\";
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

    test('generates SVG with non-empty score', () => {
        expect(visualizations.scoreToNotesSVG(SAMPLE_SCORE)).toStrictEqual(`<svg viewbox=\"0,0,29,440\" width=\"29\" height=\"440\" xmlns=\"http://www.w3.org/2000/svg\" style=\"border:1px solid black; background: black\">
  <style>
    text {
      font-family: \"Arial\";
      font-size: 12px;
    }

    line {
      stroke-width: 1;
      stroke: #404040;
    }
  </style>
  <rect x="0" y="580" width="29" height="120" fill="#101010" />
  <rect x="0" y="700" width="29" height="120" fill="#000000" />
  <rect x="0" y="340" width="29" height="120" fill="#101010" />
  <rect x="0" y="460" width="29" height="120" fill="#000000" />
  <rect x="0" y="100" width="29" height="120" fill="#101010" />
  <rect x="0" y="220" width="29" height="120" fill="#000000" />
  <rect x="0" y="-140" width="29" height="120" fill="#101010" />
  <rect x="0" y="-20" width="29" height="120" fill="#000000" />
  <rect x="0" y="-380" width="29" height="120" fill="#101010" />
  <rect x="0" y="-260" width="29" height="120" fill="#000000" />
  <text x="16" y="10" fill="#C0C0C0">Notes</text>
  <text x="2" y="440" fill="#8080E0">D₁</text>
  <text x="2" y="430" fill="#E0E080">D#₁</text>
  <text x="2" y="420" fill="#E080E0">E₁</text>
  <text x="2" y="410" fill="#80E0E0">F₁</text>
  <text x="2" y="400" fill="#E02020">F#₁</text>
  <text x="2" y="390" fill="#20E080">G₁</text>
  <text x="2" y="380" fill="#2080E0">G#₁</text>
  <text x="2" y="370" fill="#E0E020">A₁</text>
  <text x="2" y="360" fill="#E020E0">A#₁</text>
  <text x="2" y="350" fill="#20E0E0">B₁</text>
  <text x="2" y="340" fill="#E08080">C₂</text>
  <text x="2" y="330" fill="#80E080">C#₂</text>
  <text x="2" y="320" fill="#8080E0">D₂</text>
  <text x="2" y="310" fill="#E0E080">D#₂</text>
  <text x="2" y="300" fill="#E080E0">E₂</text>
  <text x="2" y="290" fill="#80E0E0">F₂</text>
  <text x="2" y="280" fill="#E02020">F#₂</text>
  <text x="2" y="270" fill="#20E080">G₂</text>
  <text x="2" y="260" fill="#2080E0">G#₂</text>
  <text x="2" y="250" fill="#E0E020">A₂</text>
  <text x="2" y="240" fill="#E020E0">A#₂</text>
  <text x="2" y="230" fill="#20E0E0">B₂</text>
  <text x="2" y="220" fill="#E08080">C₃</text>
  <text x="2" y="210" fill="#80E080">C#₃</text>
  <text x="2" y="200" fill="#8080E0">D₃</text>
  <text x="2" y="190" fill="#E0E080">D#₃</text>
  <text x="2" y="180" fill="#E080E0">E₃</text>
  <text x="2" y="170" fill="#80E0E0">F₃</text>
  <text x="2" y="160" fill="#E02020">F#₃</text>
  <text x="2" y="150" fill="#20E080">G₃</text>
  <text x="2" y="140" fill="#2080E0">G#₃</text>
  <text x="2" y="130" fill="#E0E020">A₃</text>
  <text x="2" y="120" fill="#E020E0">A#₃</text>
  <text x="2" y="110" fill="#20E0E0">B₃</text>
  <text x="2" y="100" fill="#E08080">C₄</text>
  <text x="2" y="90" fill="#80E080">C#₄</text>
  <text x="2" y="80" fill="#8080E0">D₄</text>
  <text x="2" y="70" fill="#E0E080">D#₄</text>
  <text x="2" y="60" fill="#E080E0">E₄</text>
  <text x="2" y="50" fill="#80E0E0">F₄</text>
  <text x="2" y="40" fill="#E02020">F#₄</text>
  <text x="2" y="30" fill="#20E080">G₄</text>
  <text x="2" y="20" fill="#2080E0">G#₄</text>
  <rect x="16" y="430" width="1" height="10" fill="#8080E0" stroke="#8080E0" stroke-width="0" />
  <rect x="16" y="400" width="1" height="10" fill="#80E0E0" stroke="#80E0E0" stroke-width="0" />
  <rect x="16" y="50" width="1" height="10" fill="#E080E0" stroke="#E080E0" stroke-width="0" />
  <rect x="16" y="430" width="1" height="10" fill="#8080E0" stroke="#8080E0" stroke-width="0" />
  <rect x="16" y="400" width="1" height="10" fill="#80E0E0" stroke="#80E0E0" stroke-width="0" />
  <rect x="17" y="360" width="2" height="10" fill="#E0E020" stroke="#E0E020" stroke-width="0" />
  <rect x="19" y="390" width="2" height="10" fill="#E02020" stroke="#E02020" stroke-width="0" />
  <rect x="19" y="370" width="2" height="10" fill="#2080E0" stroke="#2080E0" stroke-width="0" />
  <rect x="19" y="90" width="2" height="10" fill="#E08080" stroke="#E08080" stroke-width="0" />
  <rect x="19" y="10" width="2" height="10" fill="#2080E0" stroke="#2080E0" stroke-width="0" />
  <rect x="20" y="390" width="1" height="10" fill="#E02020" stroke="#E02020" stroke-width="0" />
  <rect x="20" y="370" width="1" height="10" fill="#2080E0" stroke="#2080E0" stroke-width="0" />
</svg>
`);
    });

    test('generates SVG with fallback rules', () => {
        expect(visualizations.scoreToNotesSVG(SAMPLE_SCORE, { value_rule: 'default', color_rule: 'default' })).toStrictEqual(`<svg viewbox=\"0,0,29,440\" width=\"29\" height=\"440\" xmlns=\"http://www.w3.org/2000/svg\" style=\"border:1px solid black; background: black\">
  <style>
    text {
      font-family: \"Arial\";
      font-size: 12px;
    }

    line {
      stroke-width: 1;
      stroke: #404040;
    }
  </style>
  <rect x="0" y="580" width="29" height="120" fill="#101010" />
  <rect x="0" y="700" width="29" height="120" fill="#000000" />
  <rect x="0" y="340" width="29" height="120" fill="#101010" />
  <rect x="0" y="460" width="29" height="120" fill="#000000" />
  <rect x="0" y="100" width="29" height="120" fill="#101010" />
  <rect x="0" y="220" width="29" height="120" fill="#000000" />
  <rect x="0" y="-140" width="29" height="120" fill="#101010" />
  <rect x="0" y="-20" width="29" height="120" fill="#000000" />
  <rect x="0" y="-380" width="29" height="120" fill="#101010" />
  <rect x="0" y="-260" width="29" height="120" fill="#000000" />
  <text x="16" y="10" fill="#C0C0C0">Notes</text>
  <text x="2" y="440" fill="#C0C0C0">26</text>
  <text x="2" y="430" fill="#C0C0C0">27</text>
  <text x="2" y="420" fill="#C0C0C0">28</text>
  <text x="2" y="410" fill="#C0C0C0">29</text>
  <text x="2" y="400" fill="#C0C0C0">30</text>
  <text x="2" y="390" fill="#C0C0C0">31</text>
  <text x="2" y="380" fill="#C0C0C0">32</text>
  <text x="2" y="370" fill="#C0C0C0">33</text>
  <text x="2" y="360" fill="#C0C0C0">34</text>
  <text x="2" y="350" fill="#C0C0C0">35</text>
  <text x="2" y="340" fill="#C0C0C0">36</text>
  <text x="2" y="330" fill="#C0C0C0">37</text>
  <text x="2" y="320" fill="#C0C0C0">38</text>
  <text x="2" y="310" fill="#C0C0C0">39</text>
  <text x="2" y="300" fill="#C0C0C0">40</text>
  <text x="2" y="290" fill="#C0C0C0">41</text>
  <text x="2" y="280" fill="#C0C0C0">42</text>
  <text x="2" y="270" fill="#C0C0C0">43</text>
  <text x="2" y="260" fill="#C0C0C0">44</text>
  <text x="2" y="250" fill="#C0C0C0">45</text>
  <text x="2" y="240" fill="#C0C0C0">46</text>
  <text x="2" y="230" fill="#C0C0C0">47</text>
  <text x="2" y="220" fill="#C0C0C0">48</text>
  <text x="2" y="210" fill="#C0C0C0">49</text>
  <text x="2" y="200" fill="#C0C0C0">50</text>
  <text x="2" y="190" fill="#C0C0C0">51</text>
  <text x="2" y="180" fill="#C0C0C0">52</text>
  <text x="2" y="170" fill="#C0C0C0">53</text>
  <text x="2" y="160" fill="#C0C0C0">54</text>
  <text x="2" y="150" fill="#C0C0C0">55</text>
  <text x="2" y="140" fill="#C0C0C0">56</text>
  <text x="2" y="130" fill="#C0C0C0">57</text>
  <text x="2" y="120" fill="#C0C0C0">58</text>
  <text x="2" y="110" fill="#C0C0C0">59</text>
  <text x="2" y="100" fill="#C0C0C0">60</text>
  <text x="2" y="90" fill="#C0C0C0">61</text>
  <text x="2" y="80" fill="#C0C0C0">62</text>
  <text x="2" y="70" fill="#C0C0C0">63</text>
  <text x="2" y="60" fill="#C0C0C0">64</text>
  <text x="2" y="50" fill="#C0C0C0">65</text>
  <text x="2" y="40" fill="#C0C0C0">66</text>
  <text x="2" y="30" fill="#C0C0C0">67</text>
  <text x="2" y="20" fill="#C0C0C0">68</text>
  <rect x="16" y="430" width="1" height="10" fill="#C0C0C0" stroke="#C0C0C0" stroke-width="0" />
  <rect x="16" y="400" width="1" height="10" fill="#C0C0C0" stroke="#C0C0C0" stroke-width="0" />
  <rect x="16" y="50" width="1" height="10" fill="#C0C0C0" stroke="#C0C0C0" stroke-width="0" />
  <rect x="16" y="430" width="1" height="10" fill="#C0C0C0" stroke="#C0C0C0" stroke-width="0" />
  <rect x="16" y="400" width="1" height="10" fill="#C0C0C0" stroke="#C0C0C0" stroke-width="0" />
  <rect x="17" y="360" width="2" height="10" fill="#C0C0C0" stroke="#C0C0C0" stroke-width="0" />
  <rect x="19" y="390" width="2" height="10" fill="#C0C0C0" stroke="#C0C0C0" stroke-width="0" />
  <rect x="19" y="370" width="2" height="10" fill="#C0C0C0" stroke="#C0C0C0" stroke-width="0" />
  <rect x="19" y="90" width="2" height="10" fill="#C0C0C0" stroke="#C0C0C0" stroke-width="0" />
  <rect x="19" y="10" width="2" height="10" fill="#C0C0C0" stroke="#C0C0C0" stroke-width="0" />
  <rect x="20" y="390" width="1" height="10" fill="#C0C0C0" stroke="#C0C0C0" stroke-width="0" />
  <rect x="20" y="370" width="1" height="10" fill="#C0C0C0" stroke="#C0C0C0" stroke-width="0" />
</svg>
`);
    });

    test('generates appropriate canvas with various options included', () => {
        expect(
            visualizations.scoreToNotesSVG(SAMPLE_SCORE, { width: 640, height: 215, barlines: 80, beats: 2, value_rule: 'pitch' })
        ).toStrictEqual(`<svg viewbox=\"0,0,664,235\" width=\"664\" height=\"235\" xmlns=\"http://www.w3.org/2000/svg\" style=\"border:1px solid black; background: black\">
  <style>
    text {
      font-family: \"Arial\";
      font-size: 12px;
    }

    line {
      stroke-width: 1;
      stroke: #404040;
    }
  </style>
  <rect x="0" y="295" width="664" height="60" fill="#101010" />
  <rect x="0" y="355" width="664" height="60" fill="#000000" />
  <rect x="0" y="175" width="664" height="60" fill="#101010" />
  <rect x="0" y="235" width="664" height="60" fill="#000000" />
  <rect x="0" y="55" width="664" height="60" fill="#101010" />
  <rect x="0" y="115" width="664" height="60" fill="#000000" />
  <rect x="0" y="-65" width="664" height="60" fill="#101010" />
  <rect x="0" y="-5" width="664" height="60" fill="#000000" />
  <rect x="0" y="-185" width="664" height="60" fill="#101010" />
  <rect x="0" y="-125" width="664" height="60" fill="#000000" />
  <text x="16" y="10" fill="#C0C0C0">Notes</text>
  <text x="2" y="227.5" fill="#8080E0">D</text>
  <text x="642" y="227.5" fill="#8080E0">D</text>
  <text x="2" y="217.5" fill="#E080E0">E</text>
  <text x="642" y="217.5" fill="#E080E0">E</text>
  <text x="2" y="207.5" fill="#E02020">F#</text>
  <text x="642" y="207.5" fill="#E02020">F#</text>
  <text x="2" y="197.5" fill="#2080E0">G#</text>
  <text x="642" y="197.5" fill="#2080E0">G#</text>
  <text x="2" y="187.5" fill="#E020E0">A#</text>
  <text x="642" y="187.5" fill="#E020E0">A#</text>
  <text x="2" y="177.5" fill="#E08080">C</text>
  <text x="642" y="177.5" fill="#E08080">C</text>
  <text x="2" y="167.5" fill="#8080E0">D</text>
  <text x="642" y="167.5" fill="#8080E0">D</text>
  <text x="2" y="157.5" fill="#E080E0">E</text>
  <text x="642" y="157.5" fill="#E080E0">E</text>
  <text x="2" y="147.5" fill="#E02020">F#</text>
  <text x="642" y="147.5" fill="#E02020">F#</text>
  <text x="2" y="137.5" fill="#2080E0">G#</text>
  <text x="642" y="137.5" fill="#2080E0">G#</text>
  <text x="2" y="127.5" fill="#E020E0">A#</text>
  <text x="642" y="127.5" fill="#E020E0">A#</text>
  <text x="2" y="117.5" fill="#E08080">C</text>
  <text x="642" y="117.5" fill="#E08080">C</text>
  <text x="2" y="107.5" fill="#8080E0">D</text>
  <text x="642" y="107.5" fill="#8080E0">D</text>
  <text x="2" y="97.5" fill="#E080E0">E</text>
  <text x="642" y="97.5" fill="#E080E0">E</text>
  <text x="2" y="87.5" fill="#E02020">F#</text>
  <text x="642" y="87.5" fill="#E02020">F#</text>
  <text x="2" y="77.5" fill="#2080E0">G#</text>
  <text x="642" y="77.5" fill="#2080E0">G#</text>
  <text x="2" y="67.5" fill="#E020E0">A#</text>
  <text x="642" y="67.5" fill="#E020E0">A#</text>
  <text x="2" y="57.5" fill="#E08080">C</text>
  <text x="642" y="57.5" fill="#E08080">C</text>
  <text x="2" y="47.5" fill="#8080E0">D</text>
  <text x="642" y="47.5" fill="#8080E0">D</text>
  <text x="2" y="37.5" fill="#E080E0">E</text>
  <text x="642" y="37.5" fill="#E080E0">E</text>
  <text x="2" y="27.5" fill="#E02020">F#</text>
  <text x="642" y="27.5" fill="#E02020">F#</text>
  <text x="2" y="17.5" fill="#2080E0">G#</text>
  <text x="642" y="17.5" fill="#2080E0">G#</text>
  <line x1="16" y1="0" x2="16" y2="235" />
  <text x="48" y="235" fill="#C0C0C0">1</text>
  <text x="48" y="10" fill="#C0C0C0">1</text>
  <line x1="57" y1="0" x2="57" y2=235 style="stroke:#202020" />
  <line x1="96" y1="0" x2="96" y2="235" />
  <text x="128" y="235" fill="#C0C0C0">2</text>
  <text x="128" y="10" fill="#C0C0C0">2</text>
  <line x1="137" y1="0" x2="137" y2=235 style="stroke:#202020" />
  <line x1="176" y1="0" x2="176" y2="235" />
  <text x="208" y="235" fill="#C0C0C0">3</text>
  <text x="208" y="10" fill="#C0C0C0">3</text>
  <line x1="217" y1="0" x2="217" y2=235 style="stroke:#202020" />
  <line x1="256" y1="0" x2="256" y2="235" />
  <text x="288" y="235" fill="#C0C0C0">4</text>
  <text x="288" y="10" fill="#C0C0C0">4</text>
  <line x1="297" y1="0" x2="297" y2=235 style="stroke:#202020" />
  <line x1="336" y1="0" x2="336" y2="235" />
  <text x="368" y="235" fill="#C0C0C0">5</text>
  <text x="368" y="10" fill="#C0C0C0">5</text>
  <line x1="377" y1="0" x2="377" y2=235 style="stroke:#202020" />
  <line x1="416" y1="0" x2="416" y2="235" />
  <text x="448" y="235" fill="#C0C0C0">6</text>
  <text x="448" y="10" fill="#C0C0C0">6</text>
  <line x1="457" y1="0" x2="457" y2=235 style="stroke:#202020" />
  <line x1="496" y1="0" x2="496" y2="235" />
  <text x="528" y="235" fill="#C0C0C0">7</text>
  <text x="528" y="10" fill="#C0C0C0">7</text>
  <line x1="537" y1="0" x2="537" y2=235 style="stroke:#202020" />
  <line x1="576" y1="0" x2="576" y2="235" />
  <text x="608" y="235" fill="#C0C0C0">8</text>
  <text x="608" y="10" fill="#C0C0C0">8</text>
  <line x1="617" y1="0" x2="617" y2=235 style="stroke:#202020" />
  <line x1="656" y1="0" x2="656" y2="235" />
  <text x="688" y="235" fill="#C0C0C0">9</text>
  <text x="688" y="10" fill="#C0C0C0">9</text>
  <line x1="697" y1="0" x2="697" y2=235 style="stroke:#202020" />
  <rect x="16" y="220" width="92" height="5" fill="#8080E0" stroke="#8080E0" stroke-width="0" />
  <rect x="16" y="205" width="92" height="5" fill="#80E0E0" stroke="#80E0E0" stroke-width="0" />
  <rect x="16" y="30" width="92" height="5" fill="#E080E0" stroke="#E080E0" stroke-width="0" />
  <rect x="107" y="220" width="92" height="5" fill="#8080E0" stroke="#8080E0" stroke-width="0" />
  <rect x="107" y="205" width="92" height="5" fill="#80E0E0" stroke="#80E0E0" stroke-width="0" />
  <rect x="198" y="185" width="183" height="5" fill="#E0E020" stroke="#E0E020" stroke-width="0" />
  <rect x="380" y="200" width="183" height="5" fill="#E02020" stroke="#E02020" stroke-width="0" />
  <rect x="380" y="190" width="183" height="5" fill="#2080E0" stroke="#2080E0" stroke-width="0" />
  <rect x="380" y="50" width="183" height="5" fill="#E08080" stroke="#E08080" stroke-width="0" />
  <rect x="380" y="10" width="183" height="5" fill="#2080E0" stroke="#2080E0" stroke-width="0" />
  <rect x="562" y="200" width="92" height="5" fill="#E02020" stroke="#E02020" stroke-width="0" />
  <rect x="562" y="190" width="92" height="5" fill="#2080E0" stroke="#2080E0" stroke-width="0" />
</svg>
`);
    });
});

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
