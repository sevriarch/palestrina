const DEFAULTS = {
    NOTE_VELOCITY: 64,
    NOTE_DURATION: 16,
    TICKS_PER_QUARTER: 192,
    MIDI_CHANNEL: 1,
};

const MIDI = {
    VOLUME_CONTROLLER:     0x07,
    BALANCE_CONTROLLER:    0x08,
    PAN_CONTROLLER:        0x0a,
    SUSTAIN_CONTROLLER:    0x40,
    EVENT_ON_VALUE:        0x7f,
    EVENT_OFF_VALUE:       0x00,
    TEXT_EVENT:            [ 0xff, 0x01 ],
    COPYRIGHT_EVENT:       [ 0xff, 0x02 ],
    TRACK_NAME_EVENT:      [ 0xff, 0x03 ],
    INSTRUMENT_NAME_EVENT: [ 0xff, 0x04 ],
    LYRIC_EVENT:           [ 0xff, 0x05 ],
    MARKER_EVENT:          [ 0xff, 0x06 ],
    CUE_POINT_EVENT:       [ 0xff, 0x07 ],
    TEMPO_EVENT:           [ 0xff, 0x51, 0x03 ],
    TIME_SIGNATURE_EVENT:  [ 0xff, 0x58, 0x04 ],
    KEY_SIGNATURE_EVENT:   [ 0xff, 0x59, 0x02 ],
    END_TRACK_EVENT:       [ 0xff, 0x2f, 0x00 ],
    HEADER_CHUNK:          [ 0x4d, 0x54, 0x68, 0x64 ],
    HEADER_LENGTH:         [ 0x00, 0x00, 0x00, 0x06 ],
    HEADER_FORMAT:         [ 0x00, 0x01 ],
    TRACK_HEADER_CHUNK:    [ 0x4d, 0x54, 0x72, 0x6b ],
};

const DYNAMICS = {
    PPP: 20,
    PP: 39,
    P: 61,
    MP: 71,
    MF: 84,
    F: 98,
    FF: 113,
    FFF: 127
};

const PITCH_CLASS_MAP: { [k: string]: string } = {
    '': '0-1',
    '0': '1-1',
    '01': '2-1',
    '02': '2-2',
    '03': '2-3',
    '04': '2-4',
    '05': '2-5',
    '06': '2-6',
    '012': '3-1',
    '013': '3-2A',
    '023': '3-2B',
    '014': '3-3A',
    '034': '3-3B',
    '015': '3-4A',
    '045': '3-4B',
    '016': '3-5A',
    '056': '3-5B',
    '024': '3-6',
    '025': '3-7A',
    '035': '3-7B',
    '026': '3-8A',
    '046': '3-8B',
    '027': '3-9',
    '036': '3-10',
    '037': '3-11A',
    '047': '3-11B',
    '048': '3-12',
    '0123': '4-1',
    '0124': '4-2A',
    '0234': '4-2B',
    '0134': '4-3',
    '0125': '4-4A',
    '0345': '4-4B',
    '0126': '4-5A',
    '0456': '4-5B',
    '0127': '4-6',
    '0145': '4-7',
    '0156': '4-8',
    '0167': '4-9',
    '0235': '4-10',
    '0135': '4-11A',
    '0245': '4-11B',
    '0236': '4-12A',
    '0346': '4-12B',
    '0136': '4-13A',
    '0356': '4-13B',
    '0237': '4-14A',
    '0457': '4-14B',
    '0146': '4-Z15A',
    '0256': '4-Z15B',
    '0157': '4-16A',
    '0267': '4-16B',
    '0347': '4-17',
    '0147': '4-18A',
    '0367': '4-18B',
    '0148': '4-19A',
    '0348': '4-19B',
    '0158': '4-20',
    '0246': '4-21',
    '0247': '4-22A',
    '0357': '4-22B',
    '0257': '4-23',
    '0248': '4-24',
    '0268': '4-25',
    '0358': '4-26',
    '0258': '4-27A',
    '0368': '4-27B',
    '0369': '4-28',
    '0137': '4-Z29A',
    '0467': '4-Z29B',
    '01234': '5-1',
    '01235': '5-2A',
    '02345': '5-2B',
    '01245': '5-3A',
    '01345': '5-3B',
    '01236': '5-4A',
    '03456': '5-4B',
    '01237': '5-5A',
    '04567': '5-5B',
    '01256': '5-6A',
    '01456': '5-6B',
    '01267': '5-7A',
    '01567': '5-7B',
    '02346': '5-8',
    '01246': '5-9A',
    '02456': '5-9B',
    '01346': '5-10A',
    '02356': '5-10B',
    '02347': '5-11A',
    '03457': '5-11B',
    '01356': '5-Z12',
    '01248': '5-13A',
    '02348': '5-13B',
    '01257': '5-14A',
    '02567': '5-14B',
    '01268': '5-15',
    '01347': '5-16A',
    '03467': '5-16B',
    '01348': '5-Z17',
    '01457': '5-Z18A',
    '02367': '5-Z18B',
    '01367': '5-19A',
    '01467': '5-19B',
    '01568': '5-20A',
    '02378': '5-20B',
    '01458': '5-21A',
    '03478': '5-21B',
    '01478': '5-22',
    '02357': '5-23A',
    '02457': '5-23B',
    '01357': '5-24A',
    '02467': '5-24B',
    '02358': '5-25A',
    '03568': '5-25B',
    '02458': '5-26A',
    '03468': '5-26B',
    '01358': '5-27A',
    '03578': '5-27B',
    '02368': '5-28A',
    '02568': '5-28B',
    '01368': '5-29A',
    '02578': '5-29B',
    '01468': '5-30A',
    '02478': '5-30B',
    '01369': '5-31A',
    '02369': '5-31B',
    '01469': '5-32A',
    '03589': '5-32B',
    '02468': '5-33',
    '02469': '5-34',
    '02479': '5-35',
    '01247': '5-Z36A',
    '03567': '5-Z36B',
    '03458': '5-Z37',
    '01258': '5-Z38A',
    '03678': '5-Z39B',
    '012345': '6-1',
    '012346': '6-2A',
    '023456': '6-2B',
    '012356': '6-Z3A',
    '013456': '6-Z3B',
    '012456': '6-Z4',
    '012367': '6-5A',
    '014567': '6-5B',
    '012567': '6-Z6',
    '012678': '6-7',
    '023457': '6-8',
    '012357': '6-9A',
    '024567': '6-9B',
    '013457': '6-Z10A',
    '023467': '6-Z10B',
    '012457': '6-Z11A',
    '023567': '6-Z11B',
    '012467': '6-Z12A',
    '013567': '6-Z12B',
    '013467': '6-Z13',
    '013458': '6-14A',
    '034578': '6-14B',
    '012458': '6-15A',
    '034678': '6-15B',
    '014568': '6-16A',
    '023478': '6-16B',
    '012478': '6-Z17A',
    '014678': '6-Z17B',
    '012578': '6-18A',
    '013678': '6-18B',
    '013478': '6-Z19A',
    '014578': '6-Z19B',
    '014589': '6-20',
    '023468': '6-21A',
    '024568': '6-21B',
    '012468': '6-22A',
    '024678': '6-22B',
    '023568': '6-Z23',
    '013468': '6-Z24A',
    '024578': '6-Z24B',
    '013568': '6-Z25A',
    '023578': '6-Z25B',
    '013578': '6-Z26',
    '013469': '6-Z27A',
    '035689': '6-Z27B',
    '013569': '6-Z28',
    '023679': '6-Z29',
    '013679': '6-30A',
    '023689': '6-30B',
    '014579': '6-31A',
    '024589': '6-31B',
    '024579': '6-32',
    '023579': '6-33A',
    '024679': '6-33B',
    '013579': '6-34A',
    '024689': '6-34B',
    '02468a': '6-35',
    '012347': '6-36A',
    '034567': '6-Z36B',
    '012348': '6-Z37',
    '012378': '6-Z38',
    '023458': '6-Z39A',
    '034568': '6-Z39B',
    '012358': '6-Z40A',
    '035678': '6-Z40B',
    '012368': '6-Z41A',
    '025678': '6-Z41B',
    '012369': '6-Z42',
    '012568': '6-Z43A',
    '023678': '6-Z43B',
    '012569': '6-Z44A',
    '034789': '6-Z44B',
    '023469': '6-Z45',
    '012469': '6-Z46A',
    '035789': '6-Z46B',
    '012479': '6-Z47A',
    '025789': '6-Z47B',
    '012579': '6-Z48',
    '013479': '6-Z49',
    '014679': '6-Z50',
    '0123456': '7-1',
    '0123457': '7-2A',
    '0234567': '7-2B',
    '0123458': '7-3A',
    '0345678': '7-3B',
    '0123467': '7-4A',
    '0134567': '7-4B',
    '0123567': '7-5A',
    '0124567': '7-5B',
    '0123478': '7-6A',
    '0145678': '7-6B',
    '0123678': '7-7A',
    '0125678': '7-7B',
    '0234568': '7-8',
    '0123468': '7-9A',
    '0245678': '7-9B',
    '0123469': '7-10A',
    '0234569': '7-10B',
    '0134568': '7-11A',
    '0234578': '7-11B',
    '0123479': '7-Z12',
    '0124568': '7-13A',
    '0234678': '7-13B',
    '0123578': '7-14A',
    '0135678': '7-14B',
    '0124678': '7-15',
    '0123569': '7-16A',
    '0134569': '7-16B',
    '0124569': '7-Z17',
    '0123589': '7-Z18A',
    '0146789': '7-Z18B',
    '0123679': '7-19A',
    '0123689': '7-19B',
    '0124789': '7-20A',
    '0125789': '7-20B',
    '0124589': '7-21A',
    '0134589': '7-21B',
    '0125689': '7-22',
    '0234579': '7-23A',
    '0245679': '7-23B',
    '0123579': '7-24A',
    '0246789': '7-24B',
    '0234679': '7-25A',
    '0235679': '7-25B',
    '0134579': '7-26A',
    '0245689': '7-26B',
    '0124579': '7-27A',
    '0245789': '7-27B',
    '0135679': '7-28A',
    '0234689': '7-28B',
    '0124679': '7-29A',
    '0235789': '7-29B',
    '0124689': '7-30A',
    '0135789': '7-30B',
    '0134679': '7-31A',
    '0235689': '7-31B',
    '0134689': '7-32A',
    '0135689': '7-32B',
    '012468a': '7-33',
    '013468a': '7-34',
    '013568a': '7-35',
    '0123568': '7-Z36A',
    '0235678': '7-Z36B',
    '0134578': '7-Z37',
    '0124578': '7-Z38A',
    '0134678': '7-Z38B',
    '01234567': '8-1',
    '02345678': '8-2B',
    '01234568': '8-2A',
    '01234569': '8-3',
    '01345678': '8-4B',
    '01234578': '8-4A',
    '01245678': '8-5B',
    '01234678': '8-5A',
    '01235678': '8-6',
    '01234589': '8-7',
    '01234789': '8-8',
    '01236789': '8-9',
    '02345679': '8-10',
    '02456789': '8-11B',
    '01234579': '8-11A',
    '01345679': '8-12A',
    '02345689': '8-12B',
    '02356789': '8-13B',
    '01234679': '8-13A',
    '01245679': '8-14A',
    '02345789': '8-14B',
    '01356789': '8-Z15B',
    '01234689': '8-Z15A',
    '01246789': '8-16B',
    '01235789': '8-16A',
    '01345689': '8-17',
    '01346789': '8-18B',
    '01235689': '8-18A',
    '01345789': '8-19B',
    '01245689': '8-19A',
    '01245789': '8-20',
    '0123468a': '8-21',
    '0123579a': '8-22B',
    '0123568a': '8-22A',
    '0123578a': '8-23',
    '0124568a': '8-24',
    '0124678a': '8-25',
    '0134578a': '8-26',
    '0124679a': '8-27B',
    '0124578a': '8-27A',
    '0134679a': '8-28',
    '02346789': '8z29B',
    '01235679': '8z29A',
    '012345678': '9-1',
    '012345679': '9-2',
    '023456789': '9-2B',
    '012345689': '9-3A',
    '013456789': '9-3B',
    '012345789': '9-4A',
    '012456789': '9-4B',
    '012346789': '9-5A',
    '012356789': '9-5B',
    '01234568a': '9-6',
    '01234578a': '9-7A',
    '01234579a': '9-7B',
    '01234678a': '9-8A',
    '01234689a': '9-BB',
    '01235678a': '9-9',
    '01234679a': '9-10',
    '01235679a': '9-11A',
    '01235689a': '9-11B',
    '01245689a': '9-12',
    '0123456789': '10-1',
    '012345678a': '10-2',
    '012345679a': '10-3',
    '012345689a': '10-4',
    '012345789a': '10-5',
    '012346789a': '10-6',
    '0123456789a': '11-1',
    '0123456789ab': '12-1',
};

const exportable = { DYNAMICS, DEFAULTS };

Object.freeze(DYNAMICS);
Object.freeze(MIDI);
Object.freeze(DYNAMICS);
Object.freeze(PITCH_CLASS_MAP);
Object.freeze(exportable);

export { DEFAULTS, MIDI, DYNAMICS, PITCH_CLASS_MAP, exportable };
