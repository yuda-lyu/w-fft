import assert from 'assert'
import wf from '../src/WFft.mjs'


describe(`fft1d`, function() {

    let arr1 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
    // res = wf.fft1d(arr)
    // console.log(res)
    let res1 = [
        [120, 0],
        [-8, 40.21871593700678],
        [-8, 19.31370849898476],
        [-7.999999999999999, 11.972846101323913],
        [-8, 8],
        [-8, 5.345429103354391],
        [-8, 3.313708498984761],
        [-7.999999999999999, 1.5912989390372623],
        [-8, 0],
        [-7.999999999999999, -1.5912989390372623],
        [-8, -3.313708498984761],
        [-8, -5.345429103354391],
        [-8, -8],
        [-7.999999999999999, -11.972846101323913],
        [-8, -19.31370849898476],
        [-8, -40.21871593700678]
    ]

    it(`should return '${JSON.stringify(res1)}' when input ${JSON.stringify(arr1)}`, async function() {
        let res = wf.fft1d(arr1)
        assert.strict.deepStrictEqual(res1, res)
    })

})
