import assert from 'assert'
import wf from '../src/WFft.mjs'
import expectInvalid from './tools/expectInvalid.mjs'


//規格: 本套件規則帳本R-LEN-01(輸入長度不足以產生有意義之頻譜或濾波結果時, 入口即拋錯), 與既有檢測同通道(同步throw Error, `invalid <名稱>: must be <描述>`, 不帶值)
//最小有效長度(依演算法, 見sgud/rule/rulebook.md R-LEN-01之實測依據):
//  spectrum1d: arr至少4點(輸出點數floor(n/2), 至少要有1個非直流點才有頻率軸; n=1空, n=2,3只有直流點)
//  spectrum2d: mat各軸至少4點(輸出floor(m/2)×floor(n/2), 每一軸皆須有非直流點)
//  filter1d  : arr至少2點(全部n個bin皆參與, n=1時週期(n-1)*dt為0或只有直流bin, 頻帶無從界定; n>=2起有非直流bin)
//  filter2d  : mat各軸至少2點(任一軸為1時該軸頻率為NaN或退化為1D)
//  fft1d/ifft1d/fft2d/ifft2d: 長度1為正確之1點DFT, 不拒絕(1.0.34已修)
//檢測順序: 資料(結構與元素)→資料長度→dt→hzStart→hzEnd→opt; 2D先列後行


let types = ['dft', 'pow2']
let oneTurns = [true, false]


//所有(type, useOneTurn)組合之opt, 另含未給opt
let optsAll = [undefined]
for (let type of types) {
    for (let useOneTurn of oneTurns) {
        optsAll.push({ type, useOneTurn })
    }
}


//實數陣列 3,5,7,9,...
let mkArr = (n) => Array.from({ length: n }, (_, i) => 2 * i + 3)

//m×n矩陣, 各元素相異
let mkMat = (m, n) => Array.from({ length: m }, (_, i) => Array.from({ length: n }, (_, j) => (i + 1) * 10 + j + 1.5))

//兩個同長數字陣列之最大絕對誤差
let maxdiff = (a, b) => a.length === b.length ? Math.max(0, ...a.map((v, i) => Math.abs(v - b[i]))) : Infinity


let fns1d = [
    { name: 'spectrum1d', min: 4, call: (arr, opt) => wf.spectrum1d(arr, 1, opt) },
    { name: 'filter1d', min: 2, call: (arr, opt) => wf.filter1d(arr, 1, 0, 0.3, opt) },
]

let fns2d = [
    { name: 'spectrum2d', minRows: 4, minCols: 4, call: (mat, opt) => wf.spectrum2d(mat, 1, opt) },
    { name: 'filter2d', minRows: 2, minCols: 2, call: (mat, opt) => wf.filter2d(mat, 1, 0, 0.3, opt) },
]


describe(`minimum input length: 1D (spectrum1d, filter1d)`, function() {

    for (let fn of fns1d) {

        for (let n = 1; n < fn.min; n++) {
            it(`should throw 'at least ${fn.min} elements' when ${fn.name} with ${n} element(s) in both dft and pow2, both useOneTurn`, async function() {

                //spec R-LEN-01: 長度不足最小值即同步throw, 訊息不帶值, 兩路徑與兩種useOneTurn一致
                let msg = `invalid arr: must be an array with at least ${fn.min} elements`
                for (let opt of optsAll) {
                    expectInvalid(() => fn.call(mkArr(n), opt), msg)
                }
            })
        }

        for (let n of [fn.min, fn.min + 1, fn.min + 2, 16]) {
            it(`should not throw when ${fn.name} with ${n} elements (>= minimum ${fn.min}) in both dft and pow2, both useOneTurn`, async function() {

                //spec R-LEN-01: 恰為最小長度及以上者不拋
                for (let opt of optsAll) {
                    let res = fn.call(mkArr(n), opt)
                    assert.strict.ok(Array.isArray(res) && res.length > 0)
                }
            })
        }

    }

    it(`should count elements by length regardless of element kind (numeric strings) when spectrum1d and filter1d`, async function() {

        //spec R-LEN-01: 長度以元素個數計, 數字字串元素與數值元素同; 元素全數有效後才比長度
        expectInvalid(() => wf.spectrum1d(['1', '2', '3'], 1), 'invalid arr: must be an array with at least 4 elements')
        expectInvalid(() => wf.filter1d(['1'], 1, 0, 0.3), 'invalid arr: must be an array with at least 2 elements')
    })

})


describe(`minimum input length: 1D boundary values equal the definition (n = minimum)`, function() {

    for (let type of types) {
        for (let useOneTurn of oneTurns) {

            it(`should return the DFT of [3,5,7,9] in the first 2 bins when spectrum1d n=4 (type=${type}, useOneTurn=${useOneTurn})`, async function() {

                //spec: 頻譜為正頻半部floor(n/2)=2點; X[0]=Σx=24, X[1]=Σ x[n]*exp(-i*2π*n*1/4)=(3-7)+i(-5+9)=-4+4i; 頻率間隔df=1/((n-1)*dt)(true)或1/(n*dt)(false)
                let res = wf.spectrum1d([3, 5, 7, 9], 1, { type, useOneTurn })
                let df = useOneTurn ? 1 / 3 : 1 / 4
                assert.strict.deepStrictEqual(res.length, 2)
                assert.strict.deepStrictEqual(res[0].freq, 0)
                assert.strict.ok(Math.abs(res[0].real - 24) < 1e-9 && Math.abs(res[0].imag) < 1e-9 && Math.abs(res[0].ampl - 24) < 1e-9)
                assert.strict.ok(Math.abs(res[1].freq - df) < 1e-12)
                assert.strict.ok(Math.abs(res[1].real - (-4)) < 1e-9 && Math.abs(res[1].imag - 4) < 1e-9 && Math.abs(res[1].ampl - Math.sqrt(32)) < 1e-9)
            })

            it(`should separate DC from the non-DC bin when filter1d n=2 (type=${type}, useOneTurn=${useOneTurn})`, async function() {

                //spec: n=2有直流bin與1個非直流bin(頻率>=0.5/dt>0.01): 通過全部頻率=輸入, 只通過直流=平均, 只通過非直流=輸入減平均; 'pow2'補零至4點(輸入[3,5,0,0], 平均2)
                let pad = type === 'pow2' ? [3, 5, 0, 0] : [3, 5]
                let mean = pad.reduce((s, v) => s + v, 0) / pad.length
                let opt = { type, useOneTurn }
                assert.strict.ok(maxdiff(wf.filter1d([3, 5], 1, 0, 1e6, opt), pad) < 1e-9)
                assert.strict.ok(maxdiff(wf.filter1d([3, 5], 1, 0, 0.01, opt), pad.map(() => mean)) < 1e-9)
                assert.strict.ok(maxdiff(wf.filter1d([3, 5], 1, 0.01, 1e6, opt), pad.map((v) => v - mean)) < 1e-9)
            })

        }
    }

    it(`should separate DC from the non-DC bins when filter1d n=3 (dft)`, async function() {

        //spec: n=3(dft)之bin1,2同頻率; 只通過直流=平均5, 只通過非直流=輸入減平均
        for (let useOneTurn of oneTurns) {
            let opt = { useOneTurn }
            assert.strict.ok(maxdiff(wf.filter1d([3, 5, 7], 1, 0, 0.01, opt), [5, 5, 5]) < 1e-9)
            assert.strict.ok(maxdiff(wf.filter1d([3, 5, 7], 1, 0.01, 1e6, opt), [-2, 0, 2]) < 1e-9)
        }
    })

})


describe(`minimum input length: 2D (spectrum2d, filter2d)`, function() {

    for (let fn of fns2d) {

        for (let m = 1; m <= 5; m++) {
            for (let n = 1; n <= 5; n++) {

                let tooFewRows = m < fn.minRows
                let tooFewCols = n < fn.minCols

                if (tooFewRows || tooFewCols) {
                    //列數不足先報列(mat), 否則報行(mat[0])
                    let msg = tooFewRows ? `invalid mat: must be an array with at least ${fn.minRows} rows` : `invalid mat[0]: must be an array with at least ${fn.minCols} columns`
                    it(`should throw '${msg}' when ${fn.name} ${m}x${n} in both dft and pow2, both useOneTurn`, async function() {

                        //spec R-LEN-01: 各軸長度不足最小值即同步throw, 訊息寫明哪一維(列=mat, 行=mat[0]), 兩路徑與兩種useOneTurn一致
                        for (let opt of optsAll) {
                            expectInvalid(() => fn.call(mkMat(m, n), opt), msg)
                        }
                    })
                }
                else {
                    it(`should not throw when ${fn.name} ${m}x${n} (each axis >= minimum) in both dft and pow2, both useOneTurn`, async function() {

                        //spec R-LEN-01: 各軸恰為最小長度及以上者不拋
                        for (let opt of optsAll) {
                            let res = fn.call(mkMat(m, n), opt)
                            assert.strict.ok(Array.isArray(res) && res.length > 0)
                        }
                    })
                }

            }
        }

    }

    it(`should name the dimension in the message (literal messages)`, async function() {

        //spec R-LEN-01: 逐字訊息, 寫明哪一維
        expectInvalid(() => wf.spectrum2d(mkMat(1, 5), 1), 'invalid mat: must be an array with at least 4 rows')
        expectInvalid(() => wf.spectrum2d(mkMat(5, 1), 1), 'invalid mat[0]: must be an array with at least 4 columns')
        expectInvalid(() => wf.spectrum2d(mkMat(1, 1), 1), 'invalid mat: must be an array with at least 4 rows')
        expectInvalid(() => wf.spectrum2d(mkMat(3, 8), 1), 'invalid mat: must be an array with at least 4 rows')
        expectInvalid(() => wf.spectrum2d(mkMat(8, 3), 1), 'invalid mat[0]: must be an array with at least 4 columns')
        expectInvalid(() => wf.filter2d(mkMat(1, 5), 1, 0, 0.3), 'invalid mat: must be an array with at least 2 rows')
        expectInvalid(() => wf.filter2d(mkMat(5, 1), 1, 0, 0.3), 'invalid mat[0]: must be an array with at least 2 columns')
        expectInvalid(() => wf.filter2d(mkMat(1, 1), 1, 0, 0.3), 'invalid mat: must be an array with at least 2 rows')
    })

    it(`should separate DC from the non-DC bins when filter2d 2x2 (dft, both useOneTurn)`, async function() {

        //spec: 2x2有直流與非直流bin: 通過全部=輸入; 只通過直流=全矩陣平均17; 只通過非直流=輸入減平均
        let mat = mkMat(2, 2)
        for (let useOneTurn of oneTurns) {
            let opt = { useOneTurn }
            assert.strict.ok(maxdiff(wf.filter2d(mat, 1, 0, 1e6, opt).flat(), mat.flat()) < 1e-9)
            assert.strict.ok(maxdiff(wf.filter2d(mat, 1, 0, 0.01, opt).flat(), [17, 17, 17, 17]) < 1e-9)
            assert.strict.ok(maxdiff(wf.filter2d(mat, 1, 0.01, 1e6, opt).flat(), mat.flat().map((v) => v - 17)) < 1e-9)
        }
    })

    it(`should return the 2D DFT bins when spectrum2d 4x4 (dft and pow2, both useOneTurn)`, async function() {

        //spec: 4x4之正頻象限2x2; X[0][0]=Σ=48(mat=[[0..3],[1..4],[2..5],[3..6]]), X[0][1]=X[1][0]=-8+8i, X[1][1]=0
        let mat = [[0, 1, 2, 3], [1, 2, 3, 4], [2, 3, 4, 5], [3, 4, 5, 6]]
        for (let type of types) {
            for (let useOneTurn of oneTurns) {
                let res = wf.spectrum2d(mat, 1, { type, useOneTurn })
                assert.strict.deepStrictEqual([res.length, res[0].length], [2, 2])
                assert.strict.ok(Math.abs(res[0][0].real - 48) < 1e-9)
                assert.strict.ok(Math.abs(res[0][1].real - (-8)) < 1e-9 && Math.abs(res[0][1].imag - 8) < 1e-9)
                assert.strict.ok(Math.abs(res[1][0].real - (-8)) < 1e-9 && Math.abs(res[1][0].imag - 8) < 1e-9)
                assert.strict.ok(Math.abs(res[1][1].real) < 1e-9 && Math.abs(res[1][1].imag) < 1e-9)
            }
        }
    })

})


describe(`minimum input length: order of checks and scope`, function() {

    it(`should report an invalid element before the length (data content first)`, async function() {

        //spec R-LEN-01(順序): 資料結構與元素先於長度
        expectInvalid(() => wf.spectrum1d(['x'], 1), 'invalid arr[0]: must be a valid number')
        expectInvalid(() => wf.spectrum1d([1, 2, 'x'], 1), 'invalid arr[2]: must be a valid number')
        expectInvalid(() => wf.filter1d([null], 1, 0, 0.3), 'invalid arr[0]: must be a valid number')
        expectInvalid(() => wf.spectrum2d([['x']], 1), 'invalid mat[0][0]: must be a valid number')
        expectInvalid(() => wf.filter2d([[1, 'x']], 1, 0, 0.3), 'invalid mat[0][1]: must be a valid number')
    })

    it(`should keep the existing messages for empty and ragged data (structure first)`, async function() {

        //spec R-LEN-01(順序): 空陣列與非矩形仍由既有檢測先拋
        expectInvalid(() => wf.spectrum1d([], 1), 'invalid arr: must be a non-empty array')
        expectInvalid(() => wf.filter1d([], 1, 0, 0.3), 'invalid arr: must be a non-empty array')
        expectInvalid(() => wf.spectrum2d([], 1), 'invalid mat: must be a non-empty array')
        expectInvalid(() => wf.spectrum2d([[]], 1), 'invalid mat[0]: must be a non-empty array')
        expectInvalid(() => wf.filter2d([[1, 2], [3]], 1, 0, 0.3), 'invalid mat[1]: must be an array with the same length as mat[0]')
        expectInvalid(() => wf.spectrum2d([[1], [2, 3]], 1), 'invalid mat[1]: must be an array with the same length as mat[0]')
    })

    it(`should report the length before dt, hzStart, hzEnd and opt (data first, left to right)`, async function() {

        //spec R-LEN-01(順序): 資料長度先於dt、hzStart、hzEnd、opt
        expectInvalid(() => wf.spectrum1d([1], 'x', { type: 'abc' }), 'invalid arr: must be an array with at least 4 elements')
        expectInvalid(() => wf.filter1d([1], 'x', 'y', 'z', 'q'), 'invalid arr: must be an array with at least 2 elements')
        expectInvalid(() => wf.spectrum2d(mkMat(2, 2), 'x', { useOneTurn: 'n' }), 'invalid mat: must be an array with at least 4 rows')
        expectInvalid(() => wf.filter2d(mkMat(1, 1), 'x', 'y', 'z', 'q'), 'invalid mat: must be an array with at least 2 rows')
    })

    it(`should report dt, hzStart, hzEnd and opt for long enough data (the length check does not mask them)`, async function() {

        //spec R-LEN-01: 長度足夠時其餘參數之檢測照舊
        expectInvalid(() => wf.spectrum1d(mkArr(4), 'x'), 'invalid dt: must be a positive number')
        expectInvalid(() => wf.filter1d(mkArr(2), 1, 'y', 0.3), 'invalid hzStart: must be a non-negative number')
        expectInvalid(() => wf.filter1d(mkArr(2), 1, 0, 'z'), 'invalid hzEnd: must be a non-negative number')
        expectInvalid(() => wf.spectrum2d(mkMat(4, 4), 1, { type: 'abc' }), `invalid opt.type: must be one of 'dft', 'pow2'`)
        expectInvalid(() => wf.filter2d(mkMat(2, 2), 1, 0, 0.3, { useOneTurn: 'n' }), 'invalid opt.useOneTurn: must be a boolean')
    })

    it(`should not modify the input data when the length is too short`, async function() {

        //spec R-LEN-01: 失敗無副作用(不改寫呼叫端之資料)
        let arr = ['1', ' 2 ']
        let mat = [['1']]
        let sa = JSON.stringify(arr)
        let sm = JSON.stringify(mat)
        assert.throws(() => wf.spectrum1d(arr, 1))
        assert.throws(() => wf.filter2d(mat, 1, 0, 0.3))
        assert.strict.deepStrictEqual(JSON.stringify(arr), sa)
        assert.strict.deepStrictEqual(JSON.stringify(mat), sm)
    })

    for (let type of types) {
        it(`should still accept length 1 for fft1d, ifft1d, fft2d and ifft2d (type=${type})`, async function() {

            //spec: fft家族長度1為正確之1點DFT(1.0.34已修), 本規則不涵蓋; dft回1點, pow2補零至4點
            let n = type === 'dft' ? 1 : 4
            assert.strict.deepStrictEqual(wf.fft1d([5], { type }).length, n)
            assert.strict.deepStrictEqual(wf.ifft1d([[5, 0]], { type }).length, n)
            assert.strict.deepStrictEqual(wf.fft2d([[5]], { type }).length, n)
            assert.strict.deepStrictEqual(wf.ifft2d([[[5, 0]]], { type }).length, n)
        })
    }

})
