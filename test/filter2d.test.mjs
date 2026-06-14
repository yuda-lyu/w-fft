import assert from 'assert'
import wf from '../src/WFft.mjs'


describe(`filter2d`, function() {

    let input = [
        [0, 1, 2, 3],
        [1, 2, 3, 4],
        [2, 3, 4, 5],
        [3, 4, 5, 6]
    ]

    let dt = 0.5

    let band = [0.3, 0.8]

    let expectedBand = [
        [-2, -2, 0, 0],
        [-2, -2, 0, 0],
        [0, 0, 2, 2],
        [0, 0, 2, 2]
    ]

    it(`should return frozen band regression output for band [0.3, 0.8]`, async function() {
        let res = wf.filter2d(input, dt, band[0], band[1])
        assert.strict.deepStrictEqual(expectedBand, res)
    })

    it(`should return output approximately equal to input when band is passthrough [0, 1e9]`, async function() {
        let res = wf.filter2d(input, dt, 0, 1e9)
        for (let i = 0; i < input.length; i++) {
            for (let j = 0; j < input[i].length; j++) {
                assert.ok(
                    Math.abs(res[i][j] - input[i][j]) < 1e-9,
                    `res[${i}][${j}]=${res[i][j]} differs from input[${i}][${j}]=${input[i][j]} by more than 1e-9`
                )
            }
        }
    })

    it(`should return output where every cell equals the mean of input when band is DC-only [0, 0]`, async function() {
        let sum = 0
        let count = 0
        for (let i = 0; i < input.length; i++) {
            for (let j = 0; j < input[i].length; j++) {
                sum += input[i][j]
                count++
            }
        }
        let mean = sum / count

        let res = wf.filter2d(input, dt, 0, 0)
        for (let i = 0; i < res.length; i++) {
            for (let j = 0; j < res[i].length; j++) {
                assert.ok(
                    Math.abs(res[i][j] - mean) < 1e-9,
                    `res[${i}][${j}]=${res[i][j]} differs from mean=${mean} by more than 1e-9`
                )
            }
        }
    })

})
