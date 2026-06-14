import assert from 'assert'
import wf from '../src/WFft.mjs'


describe(`ifft2d`, function() {

    let input = [
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

    let expected = [
        [1.0000000000000002, 2.0000000000000004, 2.9999999999999987],
        [4, 5.000000000000001, 5.999999999999999]
    ]

    it(`should return correct 2D IFFT output for a 2x3 complex matrix`, async function() {
        let res = wf.ifft2d(input)
        assert.strict.deepStrictEqual(expected, res)
    })

})
