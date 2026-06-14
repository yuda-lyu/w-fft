import assert from 'assert'
import wf from '../src/WFft.mjs'


describe(`fft2d`, function() {

    let input = [
        [1, 2, 3],
        [4, 5, 6]
    ]

    let expected = [
        [
            [21, 1.0445074572148558e-16],
            [-2.9999999999999982, 1.7320508075688785],
            [-3.0000000000000013, -1.7320508075688705]
        ],
        [
            [-9, -2.326366143623307e-16],
            [0, -8.881784197001252e-16],
            [0, -2.7755575615628914e-15]
        ]
    ]

    it(`should return correct 2D FFT output for a 2x3 real matrix`, async function() {
        let res = wf.fft2d(input)
        assert.strict.deepStrictEqual(expected, res)
    })

})
