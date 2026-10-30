/* eslint-disable no-new-wrappers, no-sparse-arrays */
//包裝物件(new Number等)與稀疏陣列為刻意之無效輸入, 故關閉上列規則
import assert from 'assert'
import wf from '../src/WFft.mjs'
import { parseN2 } from '../src/_chkParam.mjs'


//規格: 跨套件之[輸入參數之檢測機制](輸入參數之檢測機制.md), 本檔為其§8測試矩陣之翻譯
//  N2有效數字(§3.2): 有限number與數字字串(§3.1)轉換後才使用(K4); 標記字串('-','NP','')、null、布林、NaN、Infinity、BigInt等皆無效(K5,K6), 不視為0
//  A1資料陣列(§3.6): 非陣列/空陣列/任一元素無效即throw, 訊息帶索引
//  B1布林(§3.3): 只收true/false
//  S3列舉字串、opt(§4): undefined與null取預設, 給了而無效即throw, 不得靜默改用預設(K3)
//  失敗通道(§5.1): 同步數值計算throw Error; 訊息(§6): `invalid <名稱>: must be <種類描述>`, 不回顯輸入值(K9)


//斷言同步throw Error且訊息全文相符(訊息為固定詞彙, 全文相符即不帶輸入值, 亦非mathjs等內部錯誤)
function expectInvalid(fn, msg) {
    assert.throws(fn, (err) => {
        assert.strict.ok(err instanceof Error)
        assert.strict.deepStrictEqual(err.message, msg)
        return true
    })
}


//dft與pow2兩路徑對同一輸入須有一致之檢測與錯誤
let types = ['dft', 'pow2']


//非有效數字之輸入矩陣(spec §8 V24-1)
let badNums = [
    ['marker string -', '-'],
    ['marker string NP', 'NP'],
    ['empty string', ''],
    ['blank string', '  '],
    ['null', null],
    ['undefined', undefined],
    ['true', true],
    ['false', false],
    ['NaN', NaN],
    ['Infinity', Infinity],
    ['-Infinity', -Infinity],
    ['string Infinity', 'Infinity'],
    ['string -Infinity', '-Infinity'],
    ['string NaN', 'NaN'],
    ['hex string 0x10', '0x10'],
    ['binary string 0b11', '0b11'],
    ['octal string 0o7', '0o7'],
    ['thousands string 1,234', '1,234'],
    ['fullwidth string', '１２３'],
    ['overflow string 1e999', '1e999'],
    ['dangling exponent 1e', '1e'],
    ['double sign --1', '--1'],
    ['inner space 1 2', '1 2'],
    ['BigInt', 10n],
    ['object', {}],
    ['empty array', []],
    ['array [1]', [1]],
    ['Number object', new Number(1)],
    ['String object', new String('1')],
    ['Symbol', Symbol('x')],
    ['function', () => 1],
]


//有效之數字字串與其對應數值(含頭尾空白、科學記號、正負號、省略整數或小數部分)
let strVals = ['1', ' 2 ', '3e0', '+4.5', '.5', '-0.25', '1.2e-5', '1.']
let numVals = [1, 2, 3, 4.5, 0.5, -0.25, 1.2e-5, 1]


//各函數之資料形狀: 皆以8個數值組成, path(p)為第p個數值被替換時預期之訊息名稱
let shapes = {
    '1d': {
        data: 'arr',
        build: (v) => v.slice(),
        path: (p) => `arr[${p}]`,
    },
    '1dc': {
        data: 'arr',
        build: (v) => [[v[0], v[1]], [v[2], v[3]], [v[4], v[5]], [v[6], v[7]]],
        path: (p) => `arr[${Math.floor(p / 2)}][${p % 2}]`,
    },
    '2d': {
        data: 'mat',
        build: (v) => [v.slice(0, 4), v.slice(4, 8)],
        path: (p) => `mat[${Math.floor(p / 4)}][${p % 4}]`,
    },
    '2dc': {
        data: 'mat',
        build: (v) => [[[v[0], v[1]], [v[2], v[3]]], [[v[4], v[5]], [v[6], v[7]]]],
        path: (p) => `mat[${Math.floor(p / 4)}][${Math.floor((p % 4) / 2)}][${p % 2}]`,
    },
}


//全部對外函數(src/WFft.mjs之8個); call(d, opt)以預設之dt=1與帶通0~0.3呼叫
let entries = [
    { name: 'fft1d', shape: '1d', call: (d, opt) => wf.fft1d(d, opt) },
    { name: 'ifft1d', shape: '1dc', call: (d, opt) => wf.ifft1d(d, opt) },
    { name: 'spectrum1d', shape: '1d', call: (d, opt) => wf.spectrum1d(d, 1, opt), hasDt: true, hasOneTurn: true },
    { name: 'filter1d', shape: '1d', call: (d, opt) => wf.filter1d(d, 1, 0, 0.3, opt), hasDt: true, hasHz: true, hasOneTurn: true },
    { name: 'fft2d', shape: '2d', call: (d, opt) => wf.fft2d(d, opt) },
    { name: 'ifft2d', shape: '2dc', call: (d, opt) => wf.ifft2d(d, opt) },
    { name: 'spectrum2d', shape: '2d', call: (d, opt) => wf.spectrum2d(d, 1, opt), hasDt: true, hasOneTurn: true },
    { name: 'filter2d', shape: '2d', call: (d, opt) => wf.filter2d(d, 1, 0, 0.3, opt), hasDt: true, hasHz: true, hasOneTurn: true },
]


describe(`parseN2`, function() {

    let goods = [
        ['1', 1], [' 2 ', 2], ['1e-5', 1e-5], ['.5', 0.5], ['1.', 1], ['+3', 3], ['-0.25', -0.25], ['0', 0], ['1E3', 1000], ['\t7\n', 7],
        [0, 0], [-1.5, -1.5], [1e300, 1e300],
    ]
    for (let [input, expected] of goods) {
        it(`should accept ${JSON.stringify(input)} as ${expected}`, async function() {
            //spec §3.1: 去頭尾空白後須為十進位寫法; 有限number
            assert.strict.deepStrictEqual({ ok: true, v: expected }, parseN2(input))
        })
    }

    for (let [label, v] of badNums) {
        it(`should reject ${label}`, async function() {
            //spec §3.2 N2之無效: 標記字串、null、布林、NaN、Infinity、BigInt、物件等
            assert.strict.deepStrictEqual(false, parseN2(v).ok)
        })
    }

})


for (let en of entries) {

    let sh = shapes[en.shape]
    let dn = sh.data

    describe(`${en.name}: ${dn} elements`, function() {

        for (let [label, bad] of badNums) {
            it(`should throw invalid ${dn}[...] for ${label} in both dft and pow2`, async function() {
                //spec §3.2 N2資料陣列: 任一元素無效即整體失敗, 訊息帶索引(§6 V19)
                let vals = numVals.slice()
                vals[5] = bad
                let msg = `invalid ${sh.path(5)}: must be a valid number`
                for (let type of types) {
                    expectInvalid(() => en.call(sh.build(vals), { type }), msg)
                }
                expectInvalid(() => en.call(sh.build(vals)), msg)
            })
        }

        it(`should report the index of the invalid element at every position`, async function() {
            //spec §3.2: 訊息帶索引, 每個位置皆須被檢測(含首尾)
            for (let p = 0; p < 8; p++) {
                let vals = numVals.slice()
                vals[p] = '-'
                for (let type of types) {
                    expectInvalid(() => en.call(sh.build(vals), { type }), `invalid ${sh.path(p)}: must be a valid number`)
                }
            }
        })

        it(`should report the first invalid element when several are invalid`, async function() {
            //spec §3.6: 第一個無效元素之訊息帶索引
            let vals = numVals.slice()
            vals[2] = 'NP'
            vals[6] = null
            expectInvalid(() => en.call(sh.build(vals)), `invalid ${sh.path(2)}: must be a valid number`)
        })

        it(`should give the same result for numeric strings as for numbers in both dft and pow2`, async function() {
            //spec §2 K4: 檢測之值即使用之值, 數字字串輸入之結果須與數值輸入相同(§8 V24-6)
            for (let type of types) {
                let rn = en.call(sh.build(numVals), { type })
                let rs = en.call(sh.build(strVals), { type })
                assert.strict.deepStrictEqual(rn, rs)
            }
        })

        it(`should not modify the input data`, async function() {
            //spec §4 V9之同理: 轉換結果寫入新陣列, 不改寫呼叫端之資料
            let d = sh.build(strVals)
            let snap = JSON.stringify(d)
            en.call(d, { type: 'pow2' })
            en.call(d, { type: 'dft' })
            assert.strict.deepStrictEqual(snap, JSON.stringify(d))
        })

    })

    describe(`${en.name}: ${dn} structure`, function() {

        let nonArrays = [
            ['undefined', undefined],
            ['null', null],
            ['string', 'abc'],
            ['number', 123],
            ['true', true],
            ['plain object', {}],
            ['array-like object', { length: 4, 0: 1, 1: 2, 2: 3, 3: 4 }],
            ['Float64Array', new Float64Array([1, 2, 3, 4])],
            ['function', () => 1],
            ['empty array', []],
        ]
        for (let [label, v] of nonArrays) {
            it(`should throw invalid ${dn} for ${label} in both dft and pow2`, async function() {
                //spec §3.6 A1: 非陣列(含類陣列物件)與空陣列無效
                for (let type of types) {
                    expectInvalid(() => en.call(v, { type }), `invalid ${dn}: must be a non-empty array`)
                }
            })
        }

    })

}


describe(`ifft1d: complex element structure`, function() {

    let cases = [
        ['real number array', [1, 2, 3, 4], 'invalid arr[0]: must be an array of 2 elements'],
        ['number in the middle', [[1, 0], 2, [3, 0]], 'invalid arr[1]: must be an array of 2 elements'],
        ['missing imaginary part', [[1, 0], [3]], 'invalid arr[1]: must be an array of 2 elements'],
        ['extra element', [[1, 0], [3, 0, 5]], 'invalid arr[1]: must be an array of 2 elements'],
        ['string of length 2', [[1, 0], 'ab'], 'invalid arr[1]: must be an array of 2 elements'],
        ['null element', [[1, 0], null], 'invalid arr[1]: must be an array of 2 elements'],
        ['hole', [[1, 0], , [3, 0]], 'invalid arr[1]: must be an array of 2 elements'],
        ['invalid real part', [[1, 0], ['NP', 0]], 'invalid arr[1][0]: must be a valid number'],
        ['invalid imaginary part', [[1, 0], [2, null]], 'invalid arr[1][1]: must be a valid number'],
    ]
    for (let [label, v, msg] of cases) {
        it(`should throw '${msg}' for ${label} in both dft and pow2`, async function() {
            //spec §3.6 A1: 元素種類須宣告([re,im]之N2對), 缺項不補0; 訊息帶索引
            for (let type of types) {
                expectInvalid(() => wf.ifft1d(v, { type }), msg)
            }
        })
    }

})


describe(`ifft2d: complex element structure`, function() {

    let cases = [
        ['real matrix', [[1, 2], [3, 4]], 'invalid mat[0][0]: must be an array of 2 elements'],
        ['missing imaginary part', [[[1, 0], [2, 0]], [[3, 0], [4]]], 'invalid mat[1][1]: must be an array of 2 elements'],
        ['invalid real part', [[[1, 0], [2, 0]], [[3, 0], ['-', 0]]], 'invalid mat[1][1][0]: must be a valid number'],
        ['invalid imaginary part', [[[1, 0], [2, 0]], [[3, true], [4, 0]]], 'invalid mat[1][0][1]: must be a valid number'],
    ]
    for (let [label, v, msg] of cases) {
        it(`should throw '${msg}' for ${label} in both dft and pow2`, async function() {
            //spec §3.6 A1 + 帶兩層(以上)索引
            for (let type of types) {
                expectInvalid(() => wf.ifft2d(v, { type }), msg)
            }
        })
    }

})


describe(`2D matrix structure`, function() {

    let names = ['fft2d', 'spectrum2d', 'filter2d']
    let cases = [
        ['empty first row', [[]], 'invalid mat[0]: must be a non-empty array'],
        ['rows are numbers', [1, 2], 'invalid mat[0]: must be a non-empty array'],
        ['second row is a number', [[1, 2], 3], 'invalid mat[1]: must be an array with the same length as mat[0]'],
        ['shorter second row', [[1, 2, 3], [4, 5]], 'invalid mat[1]: must be an array with the same length as mat[0]'],
        ['longer second row', [[1, 2], [3, 4, 5]], 'invalid mat[1]: must be an array with the same length as mat[0]'],
        ['undefined third row', [[1, 2], [3, 4], undefined], 'invalid mat[2]: must be an array with the same length as mat[0]'],
    ]
    let call = (name, d, opt) => {
        if (name === 'fft2d') return wf.fft2d(d, opt)
        if (name === 'spectrum2d') return wf.spectrum2d(d, 1, opt)
        return wf.filter2d(d, 1, 0, 0.3, opt)
    }
    for (let name of names) {
        for (let [label, v, msg] of cases) {
            it(`should throw '${msg}' for ${label} when ${name} in both dft and pow2`, async function() {
                //spec §3.6 A1: 矩形(各列長度同第0列), 缺項不補0、多出者不截斷, 訊息帶列索引
                for (let type of types) {
                    expectInvalid(() => call(name, v, { type }), msg)
                }
            })
        }
    }

    it(`should throw for ragged matrix when ifft2d in both dft and pow2`, async function() {
        let v = [[[1, 0], [2, 0]], [[3, 0]]]
        for (let type of types) {
            expectInvalid(() => wf.ifft2d(v, { type }), 'invalid mat[1]: must be an array with the same length as mat[0]')
        }
    })

})


describe(`dt, hzStart and hzEnd`, function() {

    let arr = numVals
    let mat = shapes['2d'].build(numVals)
    let calls = {
        spectrum1d: (dt, hs, he, opt) => wf.spectrum1d(arr, dt, opt),
        filter1d: (dt, hs, he, opt) => wf.filter1d(arr, dt, hs, he, opt),
        spectrum2d: (dt, hs, he, opt) => wf.spectrum2d(mat, dt, opt),
        filter2d: (dt, hs, he, opt) => wf.filter2d(mat, dt, hs, he, opt),
    }

    let badDt = badNums.concat([['zero', 0], ['negative', -1], ['string 0', '0'], ['string -1', '-1'], ['padded negative', ' -1 ']])
    let badHz = badNums.concat([['negative', -1], ['string -1', '-1'], ['padded negative', ' -1 ']])

    for (let name of Object.keys(calls)) {
        let f = calls[name]

        for (let [label, bad] of badDt) {
            it(`should throw invalid dt for ${label} when ${name} in both dft and pow2`, async function() {
                //spec §3.7: dt為N2正數(排除Infinity); 無效時throw, 訊息不帶值
                for (let type of types) {
                    expectInvalid(() => f(bad, 0, 0.3, { type }), 'invalid dt: must be a positive number')
                }
            })
        }

        it(`should give the same result for numeric string dt as for number dt when ${name} in both dft and pow2`, async function() {
            //spec §2 K4: 數字字串轉換後才使用, 結果須與數值相同
            for (let type of types) {
                let rn = f(0.5, 0, 0.3, { type })
                for (let s of ['0.5', ' 0.5 ', '5e-1', '+.5', '.5']) {
                    assert.strict.deepStrictEqual(rn, f(s, 0, 0.3, { type }))
                }
            }
        })

    }

    for (let name of ['filter1d', 'filter2d']) {
        let f = calls[name]

        for (let key of ['hzStart', 'hzEnd']) {
            for (let [label, bad] of badHz) {
                it(`should throw invalid ${key} for ${label} when ${name} in both dft and pow2`, async function() {
                    //spec §3.7: 頻率為N2非負數(排除Infinity); 無效時throw, 訊息不帶值
                    for (let type of types) {
                        if (key === 'hzStart') {
                            expectInvalid(() => f(1, bad, 0.3, { type }), 'invalid hzStart: must be a non-negative number')
                        }
                        else {
                            expectInvalid(() => f(1, 0, bad, { type }), 'invalid hzEnd: must be a non-negative number')
                        }
                    }
                })
            }
        }

        it(`should give the same result for numeric string hzStart and hzEnd as for numbers when ${name} in both dft and pow2`, async function() {
            //spec §2 K4
            for (let type of types) {
                let rn = f(1, 0.1, 0.3, { type })
                assert.strict.deepStrictEqual(rn, f(1, '0.1', '0.3', { type }))
                assert.strict.deepStrictEqual(rn, f(1, ' 1e-1 ', ' 3E-1 ', { type }))
            }
        })

        it(`should accept zero for hzStart and hzEnd when ${name}`, async function() {
            //spec §3.2 非負數: 0有效(直流濾波)
            let r0 = f(1, 0, 0, {})
            assert.strict.deepStrictEqual(r0, f(1, '0', '0', {}))
            assert.strict.ok(r0.length > 0)
        })

    }

    it(`should accept a large finite hzEnd as passthrough when filter1d`, async function() {
        //spec §3.2: 有限大數有效(Infinity無效); 以1e9代替無上限
        let res = wf.filter1d([1, 2, 3, 4, 5, 6, 7, 8], 1, 0, 1e9)
        for (let i = 0; i < 8; i++) {
            assert.strict.ok(Math.abs(res[i] - (i + 1)) < 1e-9)
        }
    })

})


describe(`opt`, function() {

    let nonObjects = [
        ['number', 123],
        ['string', 'x'],
        ['true', true],
        ['false', false],
        ['BigInt', 10n],
        ['Symbol', Symbol('s')],
        ['array', []],
        ['function', () => 1],
        ['Date', new Date(0)],
        ['Map', new Map()],
        ['class instance', new (class A {})()],
    ]

    for (let en of entries) {

        let sh = shapes[en.shape]
        let d = sh.build(numVals)

        for (let [label, v] of nonObjects) {
            it(`should throw invalid opt for ${label} when ${en.name}`, async function() {
                //spec §4 V4: undefined與null視為未給, 其他非一般物件無效
                expectInvalid(() => en.call(d, v), 'invalid opt: must be an object')
            })
        }

        it(`should use defaults for undefined, null, {} and null-prototype object when ${en.name}`, async function() {
            //spec §4 V4,V5: undefined與null取預設
            let r0 = en.call(d)
            assert.strict.deepStrictEqual(r0, en.call(d, undefined))
            assert.strict.deepStrictEqual(r0, en.call(d, null))
            assert.strict.deepStrictEqual(r0, en.call(d, {}))
            assert.strict.deepStrictEqual(r0, en.call(d, Object.create(null)))
        })

        let badTypes = [
            ['uppercase DFT', 'DFT'],
            ['abc', 'abc'],
            ['empty string', ''],
            ['number', 1],
            ['true', true],
            ['array', []],
            ['object', {}],
            ['String object', new String('dft')],
            ['Symbol', Symbol('t')],
        ]
        for (let [label, v] of badTypes) {
            it(`should throw invalid opt.type for ${label} when ${en.name}`, async function() {
                //spec §2 K3,§3.4 S3: 給了而不在列舉內即無效, 不靜默改用預設
                expectInvalid(() => en.call(d, { type: v }), `invalid opt.type: must be one of 'dft', 'pow2'`)
            })
        }

        it(`should treat opt.type null and undefined as the default when ${en.name}`, async function() {
            //spec §4 V5: 鍵為undefined或null取預設
            let r0 = en.call(d, { type: 'dft' })
            assert.strict.deepStrictEqual(r0, en.call(d, { type: null }))
            assert.strict.deepStrictEqual(r0, en.call(d, { type: undefined }))
        })

        it(`should work for both enum values of opt.type when ${en.name}`, async function() {
            //spec §3.4 S3: 列舉值'dft'與'pow2'皆為有效輸入
            assert.strict.ok(en.call(d, { type: 'dft' }))
            assert.strict.ok(en.call(d, { type: 'pow2' }))
        })

        it(`should throw invalid opt.type when reading opt.type throws, when ${en.name}`, async function() {
            //spec §4 V11: 讀取拋錯(存取器)即無效, 訊息不洩漏內部錯誤
            let opt = {
                get type() {
                    throw new Error('internal boom')
                },
            }
            expectInvalid(() => en.call(d, opt), `invalid opt.type: must be one of 'dft', 'pow2'`)
        })

        it(`should neither modify opt nor fail on a frozen opt when ${en.name}`, async function() {
            //spec §4 V9: 不改寫呼叫端之opt
            let opt = Object.freeze({ type: 'pow2' })
            en.call(d, opt)
            assert.strict.deepStrictEqual({ type: 'pow2' }, opt)
        })

        it(`should ignore undeclared opt keys when ${en.name}`, async function() {
            //spec §4 V7: 未宣告之鍵忽略(opt常整份轉傳)
            let r0 = en.call(d)
            assert.strict.deepStrictEqual(r0, en.call(d, { foo: 'bar' }))
        })

    }

    for (let name of ['fft1d', 'ifft1d', 'fft2d', 'ifft2d']) {
        it(`should ignore opt.useOneTurn when ${name}`, async function() {
            //spec §4 V7: useOneTurn非此函數宣告之鍵, 忽略(不檢測)
            let en = entries.find((v) => v.name === name)
            let d = shapes[en.shape].build(numVals)
            assert.strict.deepStrictEqual(en.call(d), en.call(d, { useOneTurn: 'n' }))
        })
    }

})


describe(`opt.useOneTurn`, function() {

    let ens = entries.filter((v) => v.hasOneTurn)

    //spec §3.3 B1: 只收true/false; 給了而無效即throw(舊版以真值判定, 'n'等同true)
    let badBools = [
        ['string true', 'true'],
        ['string false', 'false'],
        ['string TRUE', 'TRUE'],
        ['string n', 'n'],
        ['string y', 'y'],
        ['string 1', '1'],
        ['string 0', '0'],
        ['empty string', ''],
        ['number 1', 1],
        ['number 0', 0],
        ['NaN', NaN],
        ['empty array', []],
        ['object', {}],
        ['BigInt', 10n],
        ['Boolean object', new Boolean(true)],
        ['Symbol', Symbol('b')],
        ['function', () => true],
    ]

    for (let en of ens) {

        let d = shapes[en.shape].build(numVals)

        for (let [label, v] of badBools) {
            it(`should throw invalid opt.useOneTurn for ${label} when ${en.name} in both dft and pow2`, async function() {
                for (let type of types) {
                    expectInvalid(() => en.call(d, { type, useOneTurn: v }), 'invalid opt.useOneTurn: must be a boolean')
                }
            })
        }

        it(`should treat opt.useOneTurn null and undefined as the default true when ${en.name}`, async function() {
            //spec §4 V5: 鍵為undefined或null取預設(true)
            let r0 = en.call(d, { useOneTurn: true })
            assert.strict.deepStrictEqual(r0, en.call(d))
            assert.strict.deepStrictEqual(r0, en.call(d, { useOneTurn: null }))
            assert.strict.deepStrictEqual(r0, en.call(d, { useOneTurn: undefined }))
        })

        it(`should accept true and false for opt.useOneTurn when ${en.name}`, async function() {
            assert.strict.ok(en.call(d, { useOneTurn: true }))
            assert.strict.ok(en.call(d, { useOneTurn: false }))
        })

    }

    it(`should use period (n-1)*dt for true and n*dt for false when spectrum1d`, async function() {
        //spec: useOneTurn=true週期(n-1)*dt, false週期n*dt; 8點, dt=2 => df=1/14 或 1/16
        let arr = [1, 2, 3, 4, 5, 6, 7, 8]
        let rt = wf.spectrum1d(arr, 2, { useOneTurn: true })
        let rf = wf.spectrum1d(arr, 2, { useOneTurn: false })
        assert.strict.deepStrictEqual(1 / 14, rt[1].freq)
        assert.strict.deepStrictEqual(1 / 16, rf[1].freq)
    })

    it(`should use period (len-1)*dt for true and len*dt for false when spectrum2d`, async function() {
        //spec: 各軸點數m=2,n=4, dt=1 => true: dfRow=1/1, dfCol=1/3; false: dfRow=1/2, dfCol=1/4
        let mat = shapes['2d'].build(numVals)
        let rt = wf.spectrum2d(mat, 1, { useOneTurn: true })
        let rf = wf.spectrum2d(mat, 1, { useOneTurn: false })
        assert.strict.deepStrictEqual(1 / 3, rt[0][1].freqCol)
        assert.strict.deepStrictEqual(1 / 4, rf[0][1].freqCol)
    })

    it(`should change the passband mask between true and false when filter1d`, async function() {
        //spec: 8點, dt=1, 帶通0~0.27: true時bin2頻率2/7=0.2857>0.27被濾除, false時bin2頻率2/8=0.25通過
        let arr = [1, 2, 3, 4, 5, 6, 7, 8]
        let rt = wf.filter1d(arr, 1, 0, 0.27, { useOneTurn: true })
        let rf = wf.filter1d(arr, 1, 0, 0.27, { useOneTurn: false })
        let maxdiff = Math.max(...rt.map((v, i) => Math.abs(v - rf[i])))
        assert.strict.ok(maxdiff > 0.1)
    })

    it(`should change the passband mask between true and false when filter2d`, async function() {
        //spec: 4x4, dt=1, 徑向帶通0~0.3: true時df=1/3, bin(1,0)頻率0.333>0.3被濾除, 只剩直流=全矩陣平均3; false時df=1/4, bin(1,0)頻率0.25通過, 輸出不再恆為3
        let mat = [
            [0, 1, 2, 3],
            [1, 2, 3, 4],
            [2, 3, 4, 5],
            [3, 4, 5, 6],
        ]
        let rt = wf.filter2d(mat, 1, 0, 0.3, { useOneTurn: true })
        let rf = wf.filter2d(mat, 1, 0, 0.3, { useOneTurn: false })
        assert.strict.ok(rt.every((row) => row.every((v) => Math.abs(v - 3) < 1e-9)))
        assert.strict.ok(rf.some((row) => row.some((v) => Math.abs(v - 3) > 0.5)))
    })

})


describe(`numeric string input equals numeric input (K4 headline)`, function() {

    it(`should return DC component 10 when fft1d([1,'2',3,4]) with type='pow2'`, async function() {
        //spec §2 K4: 舊版pow2以字串串接, 直流分量為28, 正解為10
        let res = wf.fft1d([1, '2', 3, 4], { type: 'pow2' })
        assert.strict.deepStrictEqual([10, 0], res[0])
        assert.strict.deepStrictEqual(wf.fft1d([1, 2, 3, 4], { type: 'pow2' }), res)
    })

    it(`should return DC component 10 when fft1d([1,'2',3,4]) with type='dft'`, async function() {
        let res = wf.fft1d([1, '2', 3, 4])
        assert.strict.deepStrictEqual([10, 0], res[0])
        assert.strict.deepStrictEqual(wf.fft1d([1, 2, 3, 4]), res)
    })

    it(`should not treat '', null, true as 0 or 1 when fft1d with type='pow2'`, async function() {
        //spec §2 K5與§3.2 N2: 舊版pow2把''、null當0、true當1; 現須throw
        for (let v of ['', null, true]) {
            expectInvalid(() => wf.fft1d([1, v, 3, 4], { type: 'pow2' }), 'invalid arr[1]: must be a valid number')
        }
    })

})
