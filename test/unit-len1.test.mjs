import assert from 'assert'
import wf from '../src/WFft.mjs'


//長度1(及2)之輸入: type='dft'與type='pow2'兩路徑須一致
//根因: mathjs之fft於長度1之軸直接回傳原元素(number, 非Complex物件), 取.re與.im為undefined(序列化為null)
//spec(fft1d/fft2d JSDoc opt.type): 'dft'為對任意n點做真實n點DFT, n=1時X[0]=x[0]; 'pow2'為補零至2冪次(最少4點)後做radix-2 FFT


//maxdiff, 取兩同形陣列(任意深度, 葉為number)之最大絕對誤差; 形狀不同或有非數值時回傳Infinity
function maxdiff(a, b) {
    if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) {
            return Infinity
        }
        let d = 0
        for (let i = 0; i < a.length; i++) {
            d = Math.max(d, maxdiff(a[i], b[i]))
        }
        return d
    }
    if (typeof a === 'number' && typeof b === 'number' && Number.isFinite(a) && Number.isFinite(b)) {
        return Math.abs(a - b)
    }
    return Infinity
}


//樸素DFT預言(依定義 X[k]=Σ x[n]*exp(-i*2πnk/N), 不經mathjs), 輸入實數陣列, 回傳[re,im]對陣列
function dft1(x) {
    let N = x.length
    let res = []
    for (let k = 0; k < N; k++) {
        let re = 0
        let im = 0
        for (let n = 0; n < N; n++) {
            let ang = -2 * Math.PI * n * k / N
            re += x[n] * Math.cos(ang)
            im += x[n] * Math.sin(ang)
        }
        res.push([re, im])
    }
    return res
}


//樸素2D DFT預言, 輸入實數矩陣, 回傳m×n之[re,im]矩陣
function dft2(mat) {
    let m = mat.length
    let n = mat[0].length
    let res = []
    for (let p = 0; p < m; p++) {
        let row = []
        for (let q = 0; q < n; q++) {
            let re = 0
            let im = 0
            for (let i = 0; i < m; i++) {
                for (let j = 0; j < n; j++) {
                    let ang = -2 * Math.PI * (i * p / m + j * q / n)
                    re += mat[i][j] * Math.cos(ang)
                    im += mat[i][j] * Math.sin(ang)
                }
            }
            row.push([re, im])
        }
        res.push(row)
    }
    return res
}


//生成m×n之實數矩陣(各元素相異)
let mkMat = (m, n) => Array.from({ length: m }, (_, i) => Array.from({ length: n }, (_, j) => (i + 1) * 10 + j + 1.5))


//sum, 取巢狀陣列(任意深度)之葉總和
let sumDeep = (a) => Array.isArray(a) ? a.reduce((s, v) => s + sumDeep(v), 0) : a


//單點值
let xs1 = [5, 0, -3.5, 1e-9, 123456.789]


describe(`length-1 input (type='dft' vs type='pow2')`, function() {

    describe(`fft1d / fft2d with type='dft' (default)`, function() {

        for (let x of xs1) {
            it(`should return [[${x},0]] when fft1d([${x}])`, async function() {

                //spec: 'dft'為真實n點DFT, n=1時X[0]=x[0], 虛部0
                assert.strict.deepStrictEqual(wf.fft1d([x]), [[x, 0]])
                assert.strict.deepStrictEqual(wf.fft1d([x], { type: 'dft' }), [[x, 0]])
            })

            it(`should return [[[${x},0]]] when fft2d([[${x}]])`, async function() {

                //spec: 'dft'為真實m×n點DFT, 1×1時X[0][0]=x[0][0], 虛部0
                assert.strict.deepStrictEqual(wf.fft2d([[x]]), [[[x, 0]]])
                assert.strict.deepStrictEqual(wf.fft2d([[x]], { type: 'dft' }), [[[x, 0]]])
            })
        }

        it(`should return finite numbers (no NaN/undefined) in every leaf when length is 1`, async function() {

            //spec: 'dft'輸出為[re,im]之有限數字對
            let r1 = wf.fft1d([5])
            assert.strict.deepStrictEqual(r1.length, 1)
            assert.strict.deepStrictEqual(r1[0].length, 2)
            assert.strict.ok(r1[0].every((v) => typeof v === 'number' && Number.isFinite(v)))
            let r2 = wf.fft2d([[5]])
            assert.strict.ok(r2[0][0].every((v) => typeof v === 'number' && Number.isFinite(v)))
        })

        it(`should convert numeric string to number before use when length is 1`, async function() {

            //spec(輸入參數之檢測機制 K4): 數字字串轉換後才使用, 結果與數值輸入相同
            assert.strict.deepStrictEqual(wf.fft1d(['5']), [[5, 0]])
            assert.strict.deepStrictEqual(wf.fft2d([[' 5 ']]), [[[5, 0]]])
        })

        it(`should equal the naive DFT by definition for n=1..9`, async function() {

            //spec: 'dft'為真實n點DFT(依定義X[k]=Σ x[n]*exp(-i*2πnk/N))
            for (let n = 1; n <= 9; n++) {
                let x = Array.from({ length: n }, (_, i) => i * i - 3 * i + 1.25)
                let r = wf.fft1d(x)
                assert.strict.ok(maxdiff(r, dft1(x)) < 1e-9, `n=${n}`)
            }
        })

        it(`should equal the naive 2D DFT by definition for every shape m,n=1..5 (including axes of length 1)`, async function() {

            //spec: 'dft'為真實m×n點DFT(依定義), 任一軸長度為1(含1×1)亦同
            for (let m = 1; m <= 5; m++) {
                for (let n = 1; n <= 5; n++) {
                    let mat = mkMat(m, n)
                    let r = wf.fft2d(mat)
                    assert.strict.ok(maxdiff(r, dft2(mat)) < 1e-9, `${m}x${n}`)
                }
            }
        })

    })

    describe(`ifft1d / ifft2d with length 1`, function() {

        for (let [x, y] of [[5, 0], [5, 3], [-3.5, 2], [0, 0]]) {
            it(`should return [${x}] and [[${x}]] when ifft1d([[${x},${y}]]) and ifft2d([[[${x},${y}]]]) with type='dft'`, async function() {

                //spec: 'dft'為真實n點iDFT, n=1時x[0]=X[0]之實部(只取實部)
                assert.strict.deepStrictEqual(wf.ifft1d([[x, y]]), [x])
                assert.strict.deepStrictEqual(wf.ifft2d([[[x, y]]]), [[x]])
            })
        }

        it(`should restore the original signal when ifft(fft(x)) of length 1 with type='dft'`, async function() {

            //spec: ifft已正規化, round-trip可還原原訊號
            for (let x of xs1) {
                assert.strict.deepStrictEqual(wf.ifft1d(wf.fft1d([x])), [x])
                assert.strict.deepStrictEqual(wf.ifft2d(wf.fft2d([[x]])), [[x]])
            }
        })

    })

    describe(`type='dft' vs type='pow2' consistency for length 1 and 2`, function() {

        let xs1d = [[5], [-3.5], [5, 7], [-2.5, 4]]

        for (let x of xs1d) {
            it(`should have dft bin k equal pow2 bin k*N/n when fft1d(${JSON.stringify(x)})`, async function() {

                //spec: 'pow2'補零至N點(最少4點)後做FFT; n整除N時, pow2之bin(k*N/n)即真實n點DFT之bin k
                let n = x.length
                let rd = wf.fft1d(x)
                let rp = wf.fft1d(x, { type: 'pow2' })
                assert.strict.deepStrictEqual(rd.length, n)
                assert.strict.deepStrictEqual(rp.length, 4)
                let stride = rp.length / n
                for (let k = 0; k < n; k++) {
                    assert.strict.ok(maxdiff(rd[k], rp[k * stride]) < 1e-12, `k=${k}`)
                }
            })
        }

        it(`should have every pow2 bin equal x when n=1 (DFT of a constant after zero padding)`, async function() {

            //spec: 'pow2'對n=1補零為[x,0,0,0], 其DFT各bin皆為x
            let rp = wf.fft1d([5], { type: 'pow2' })
            assert.strict.deepStrictEqual(rp, [[5, 0], [5, 0], [5, 0], [5, 0]])
        })

        for (let [m, n] of [[1, 1], [1, 2], [2, 1], [2, 2]]) {
            it(`should have dft bin [i][j] equal pow2 bin [i*Nr/m][j*Nc/n] when fft2d ${m}x${n}`, async function() {

                //spec: 'pow2'兩軸各自補零至2冪次(最少4點); 各軸點數整除其2冪次時, pow2之bin即真實m×n點DFT之bin
                let mat = mkMat(m, n)
                let rd = wf.fft2d(mat)
                let rp = wf.fft2d(mat, { type: 'pow2' })
                assert.strict.deepStrictEqual([rd.length, rd[0].length], [m, n])
                assert.strict.deepStrictEqual([rp.length, rp[0].length], [4, 4])
                for (let i = 0; i < m; i++) {
                    for (let j = 0; j < n; j++) {
                        assert.strict.ok(maxdiff(rd[i][j], rp[i * (4 / m)][j * (4 / n)]) < 1e-12, `[${i}][${j}]`)
                    }
                }
            })
        }

        for (let [sp, label] of [[[[5, 3]], 'n=1'], [[[5, 3], [7, -2]], 'n=2']]) {
            it(`should have both types' ifft1d sum equal the real part of the DC bin (${label})`, async function() {

                //spec: x[n]=(1/N)Σ X[k]*exp(+i*2πnk/N)(已正規化), 故Σ x[n]=Re(X[0]), dft與pow2兩路徑皆然
                let rd = wf.ifft1d(sp)
                let rp = wf.ifft1d(sp, { type: 'pow2' })
                assert.strict.deepStrictEqual(rd.length, sp.length)
                assert.strict.deepStrictEqual(rp.length, 4)
                assert.strict.ok(Math.abs(sumDeep(rd) - sp[0][0]) < 1e-12)
                assert.strict.ok(Math.abs(sumDeep(rp) - sp[0][0]) < 1e-12)
            })
        }

        for (let [m, n] of [[1, 1], [1, 2], [2, 1], [2, 2]]) {
            it(`should have both types' ifft2d sum equal the real part of the DC bin (${m}x${n})`, async function() {

                //spec: 2D之Σ x[i][j]=Re(X[0][0]), dft與pow2兩路徑皆然
                let sp = mkMat(m, n).map((row) => row.map((v) => [v, v / 3]))
                let rd = wf.ifft2d(sp)
                let rp = wf.ifft2d(sp, { type: 'pow2' })
                assert.strict.deepStrictEqual([rd.length, rd[0].length], [m, n])
                assert.strict.deepStrictEqual([rp.length, rp[0].length], [4, 4])
                assert.strict.ok(Math.abs(sumDeep(rd) - sp[0][0][0]) < 1e-9)
                assert.strict.ok(Math.abs(sumDeep(rp) - sp[0][0][0]) < 1e-9)
            })
        }

        for (let x of [[5], [-3.5], [5, 7]]) {
            it(`should restore the original signal in the first n points when ifft1d(fft1d(${JSON.stringify(x)})) with both types`, async function() {

                //spec: round-trip可還原原訊號; 'pow2'輸出為補零後之2冪次點數, 前n點為原訊號, 其後為補零之0
                let rd = wf.ifft1d(wf.fft1d(x))
                assert.strict.ok(maxdiff(rd, x) < 1e-12)
                let rp = wf.ifft1d(wf.fft1d(x, { type: 'pow2' }), { type: 'pow2' })
                assert.strict.deepStrictEqual(rp.length, 4)
                assert.strict.ok(maxdiff(rp.slice(0, x.length), x) < 1e-12)
                assert.strict.ok(maxdiff(rp.slice(x.length), new Array(4 - x.length).fill(0)) < 1e-12)
            })
        }

    })

    //長度1之spectrum/filter不再回傳退化結果, 入口即拋錯(R-LEN-01), 其測試見unit-minlen.test.mjs; 此處只留長度2之filter與其餘之一致性
    describe(`filter with length 2 and spectrum DC bin consistency (dft vs pow2)`, function() {

        it(`should pass the signal unchanged when filter1d all-pass (useOneTurn=false) with type='dft'`, async function() {

            //spec: 帶通[0,hzEnd]涵蓋全部頻率時輸出等於輸入, n=2(filter1d之最小長度)
            assert.strict.ok(maxdiff(wf.filter1d([5, 7], 1, 0, 1e6, { useOneTurn: false }), [5, 7]) < 1e-12)
        })

        it(`should pass the signal unchanged in the first n points when filter1d all-pass (useOneTurn=false) with type='pow2'`, async function() {

            //spec: 帶通涵蓋全部頻率時輸出等於輸入; 'pow2'輸出為補零後之4點, 前n點為輸入, 其後為0
            assert.strict.ok(maxdiff(wf.filter1d([5, 7], 1, 0, 1e6, { useOneTurn: false, type: 'pow2' }), [5, 7, 0, 0]) < 1e-12)
        })

        it(`should pass the matrix unchanged when filter2d all-pass (useOneTurn=false) 2x2 with both types`, async function() {

            //spec: 帶通涵蓋全部頻率時輸出等於輸入, 2x2(filter2d之最小長度); 'pow2'輸出為補零後之4×4, 左上2×2為輸入, 其餘為0
            let mat = mkMat(2, 2)
            let rd = wf.filter2d(mat, 1, 0, 1e6, { useOneTurn: false })
            assert.strict.ok(maxdiff(rd, mat) < 1e-9)
            let rp = wf.filter2d(mat, 1, 0, 1e6, { useOneTurn: false, type: 'pow2' })
            let exp = Array.from({ length: 4 }, (_, i) => Array.from({ length: 4 }, (_, j) => (i < 2 && j < 2) ? mat[i][j] : 0))
            assert.strict.ok(maxdiff(rp, exp) < 1e-9)
        })

        it(`should return the same DC bin in dft and pow2 when spectrum1d n=4 / spectrum2d 4x4 (useOneTurn=false)`, async function() {

            //spec: 頻譜首點為直流分量(freq=0, 值為Σ x), dft與pow2一致; 4點與4×4為spectrum之最小長度, 且與其2冪次補零後點數相同
            let sd = wf.spectrum1d([5, 7, 1, 3], 1, { useOneTurn: false })
            let sp = wf.spectrum1d([5, 7, 1, 3], 1, { useOneTurn: false, type: 'pow2' })
            assert.strict.deepStrictEqual(sd[0], { freq: 0, real: 16, imag: 0, ampl: 16 })
            assert.strict.deepStrictEqual(sp[0], { freq: 0, real: 16, imag: 0, ampl: 16 })
            let mat = [[1, 2, 3, 4], [3, 4, 5, 6], [0, 1, 0, 1], [2, 2, 2, 2]]
            let s2d = wf.spectrum2d(mat, 1, { useOneTurn: false })
            let s2p = wf.spectrum2d(mat, 1, { useOneTurn: false, type: 'pow2' })
            assert.strict.deepStrictEqual(s2d[0][0], { freqRow: 0, freqCol: 0, real: 38, imag: 0, ampl: 38 })
            assert.strict.deepStrictEqual(s2p[0][0], { freqRow: 0, freqCol: 0, real: 38, imag: 0, ampl: 38 })
        })

    })

})
