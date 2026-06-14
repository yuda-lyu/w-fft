import assert from 'assert'
import wf from '../src/WFft.mjs'


describe(`spectrum2d`, function() {

    let input = [
        [0, 1, 2, 3],
        [1, 2, 3, 4],
        [2, 3, 4, 5],
        [3, 4, 5, 6]
    ]

    let dt = 0.5

    let expected = [
        [
            { freqRow: 0, freqCol: 0, real: 48, imag: 0, ampl: 48 },
            { freqRow: 0, freqCol: 0.6666666666666666, real: -8, imag: 8, ampl: 11.313708498984761 }
        ],
        [
            { freqRow: 0.6666666666666666, freqCol: 0, real: -8, imag: 8, ampl: 11.313708498984761 },
            { freqRow: 0.6666666666666666, freqCol: 0.6666666666666666, real: 0, imag: 0, ampl: 0 }
        ]
    ]

    it(`should return correct 2D spectrum output for a 4x4 real matrix with dt=0.5`, async function() {
        let res = wf.spectrum2d(input, dt)
        assert.strict.deepStrictEqual(expected, res)
    })

})
