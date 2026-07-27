import _ from 'lodash-es'
import assert from 'assert'
import wf from '../src/WFft.mjs'


//maxdiff, 取兩結構相同數值結構之最大絕對誤差
function maxdiff(a, b) {
    let fa = _.flattenDeep(a)
    let fb = _.flattenDeep(b)
    assert.strict.deepStrictEqual(fa.length, fb.length)
    return _.max(_.map(fa, (v, i) => Math.abs(v - fb[i])))
}


describe(`type='pow2'`, function() {

    it(`should return exact 4-point DFT of zero-padded [1,2,3] when fft1d with type='pow2'`, async function() {

        //spec: 'pow2'為補零至2冪次(3點補至4點)後做真實4點DFT
        //X[k]=Σ x[n]*exp(-i*2πnk/4), x=[1,2,3,0] => X=[6, -2-2i, 2, -2+2i]
        let res = wf.fft1d([1, 2, 3], { type: 'pow2' })
        let expected = [
            [6, 0],
            [-2, -2],
            [2, 0],
            [-2, 2],
        ]
        assert.strict.deepStrictEqual(expected, res)
    })

    it(`should match type='dft' when input length is already a power of 2 for fft1d`, async function() {

        //spec: 輸入點數已為2冪次時無需補零, 'pow2'與'dft'皆為真實n點DFT, 僅浮點誤差差異
        let arr = _.range(16)
        let rd = wf.fft1d(arr)
        let rp = wf.fft1d(arr, { type: 'pow2' })
        assert.strict.ok(maxdiff(rd, rp) < 1e-12)
    })

    it(`should restore the original signal when ifft1d(fft1d) with type='pow2'`, async function() {

        //spec: 'pow2'之ifft已正規化(除以點數), round-trip可還原原訊號
        let arr = _.range(16)
        let rm = wf.fft1d(arr, { type: 'pow2' })
        let res = wf.ifft1d(rm, { type: 'pow2' })
        assert.strict.ok(maxdiff(arr, res) < 1e-12)
    })

    it(`should equal type='dft' of the zero-padded matrix when fft2d with type='pow2'`, async function() {

        //spec: 'pow2'為兩軸各自補零至2冪次(2×3補至4×4)後做真實4×4點DFT
        let mat = [
            [1, 2, 3],
            [4, 5, 6],
        ]
        let matPad = [
            [1, 2, 3, 0],
            [4, 5, 6, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
        ]
        let rp = wf.fft2d(mat, { type: 'pow2' })
        let rd = wf.fft2d(matPad)
        assert.strict.deepStrictEqual([4, 4], [_.size(rp), _.size(_.get(rp, 0, []))])
        assert.strict.ok(maxdiff(rd, rp) < 1e-12)
    })

    it(`should restore the original matrix when ifft2d(fft2d) with type='pow2'`, async function() {

        //spec: 'pow2'之2D ifft兩趟各自正規化, 合計除以nRows*nCols, round-trip可還原原矩陣
        let mat = [
            [0, 1, 2, 3],
            [1, 2, 3, 4],
            [2, 3, 4, 5],
            [3, 4, 5, 6],
        ]
        let rm = wf.fft2d(mat, { type: 'pow2' })
        let res = wf.ifft2d(rm, { type: 'pow2' })
        assert.strict.ok(maxdiff(mat, res) < 1e-12)
    })

    it(`should return next-power-of-2 length when filter1d with type='pow2' for a 101-point input`, async function() {

        //spec: 'pow2'輸出點數為補零後之2冪次, 101點補至128點
        let arr = _.range(101)
        assert.strict.deepStrictEqual(101, _.size(wf.filter1d(arr, 0.01, 0, 2)))
        assert.strict.deepStrictEqual(128, _.size(wf.filter1d(arr, 0.01, 0, 2, { type: 'pow2' })))
    })

    it(`should match type='dft' when filter1d a 128-point input`, async function() {

        //spec: 輸入點數已為2冪次時無需補零, 帶通遮罩與df相同, 'pow2'與'dft'結果一致
        let arr = _.map(_.range(128), (k) => Math.sin(2 * Math.PI * 3 * k * 0.0078125) + Math.sin(2 * Math.PI * 6 * k * 0.0078125))
        let rd = wf.filter1d(arr, 0.0078125, 4, 8)
        let rp = wf.filter1d(arr, 0.0078125, 4, 8, { type: 'pow2' })
        assert.strict.ok(maxdiff(rd, rp) < 1e-12)
    })

    it(`should match type='dft' when spectrum1d a 128-point input`, async function() {

        //spec: 輸入點數已為2冪次時無需補零, 頻譜點數與各bin值一致
        let arr = _.map(_.range(128), (k) => Math.sin(2 * Math.PI * 3 * k * 0.0078125))
        let rd = wf.spectrum1d(arr, 0.0078125)
        let rp = wf.spectrum1d(arr, 0.0078125, { type: 'pow2' })
        assert.strict.deepStrictEqual(_.size(rd), _.size(rp))
        assert.strict.ok(maxdiff(_.map(rd, 'ampl'), _.map(rp, 'ampl')) < 1e-12)
        assert.strict.deepStrictEqual(_.map(rd, 'freq'), _.map(rp, 'freq'))
    })

    it(`should match type='dft' when spectrum2d and filter2d a 4x4 input`, async function() {

        //spec: 兩軸點數皆為2冪次時無需補零, 'pow2'與'dft'結果一致
        let mat = [
            [0, 1, 2, 3],
            [1, 2, 3, 4],
            [2, 3, 4, 5],
            [3, 4, 5, 6],
        ]
        let sd = wf.spectrum2d(mat, 0.5)
        let sp = wf.spectrum2d(mat, 0.5, { type: 'pow2' })
        assert.strict.ok(maxdiff(_.map(_.flatten(sd), 'ampl'), _.map(_.flatten(sp), 'ampl')) < 1e-12)
        let fd = wf.filter2d(mat, 0.5, 0.3, 0.8)
        let fp = wf.filter2d(mat, 0.5, 0.3, 0.8, { type: 'pow2' })
        assert.strict.ok(maxdiff(fd, fp) < 1e-12)
    })

    it(`should throw an error when type is invalid`, async function() {
        assert.throws(() => wf.fft1d([1, 2, 3, 4], { type: 'abc' }), /invalid type\[abc\]/)
        assert.throws(() => wf.fft2d([[1, 2], [3, 4]], { type: 'abc' }), /invalid type\[abc\]/)
    })

})
