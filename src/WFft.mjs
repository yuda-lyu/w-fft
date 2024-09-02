import get from 'lodash-es/get.js'
import size from 'lodash-es/size.js'
import each from 'lodash-es/each.js'
import range from 'lodash-es/range.js'
import take from 'lodash-es/take.js'
import reverse from 'lodash-es/reverse.js'
import ispnum from 'wsemi/src/ispnum.mjs'
import isp0num from 'wsemi/src/isp0num.mjs'
import cdbl from 'wsemi/src/cdbl.mjs'
import ml from 'ml-fft'


//https://github.com/mljs/fft
//https://github.com/IQEngine/WebFFT/blob/main/lib/mljs/fftlib.js
let FFT = ml.FFT
// let FFTUtils = ml.FFTUtils


function get2n(n) {
    let i = 1
    let j = Math.pow(2, 52)
    while (true) {
        i *= 2
        // console.log('n', n, 'i', i, 'n <= i', n <= i)
        if (n <= i) {
            break
        }
        // console.log('j', j, 'i >= j', i >= j)
        if (i >= j) {
            break
        }
    }
    return i
}


function _fft1d(arr, mode = 'norm') {

    //check
    if (mode !== 'norm' && mode !== 'inv') {
        throw new Error(`invalid mode[${mode}]`)
    }

    //n
    let n = size(arr)
    // console.log('n', n)

    //nCols
    let nCols = get2n(n)
    // console.log('nCols', nCols)

    //init
    FFT.init(nCols)

    //fill
    let re = new Array(nCols)
    let im = new Array(nCols)
    if (mode === 'norm') {
        for (let i = 0; i < nCols; i++) {
            let _i = get(arr, i, 0) //超過n至nCols之元素自動補0
            let _j = 0
            // console.log('_i', _i, '_j', _j)
            re[i] = _i
            im[i] = _j
        }
    }
    else {
        for (let i = 0; i < nCols; i++) {
            let _i = get(arr, `${i}.0`, 0)
            let _j = get(arr, `${i}.1`, 0)
            // console.log('_i', _i, '_j', _j)
            re[i] = _i
            im[i] = _j
        }
    }

    let res = []
    if (mode === 'norm') {
        FFT.fft(re, im)
        for (let i = 0; i < nCols; i++) {
            let _i = re[i]
            let _j = im[i]
            res.push([_i, _j])
        }
    }
    else {
        FFT.ifft(re, im)
        for (let i = 0; i < nCols; i++) {
            let _i = re[i]
            // let _j = im[i]
            // let _l = Math.sqrt(_i * _i, _j * _j)
            res.push(_i)
        }
    }

    return res
}


/**
 * FFT1D
 *
 * @param {Array} arr 輸入數據陣列
 * @return {Array} 回傳轉換後數據陣列
 * @example
 *
 * let arr
 * let res
 *
 * arr = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
 * res = wf.fft1d(arr)
 * console.log(res)
 * // => [
 * //   [ 120, 0 ],
 * //   [ -8, 40.21871593700678 ],
 * //   [ -8, 19.31370849898476 ],
 * //   [ -7.999999999999999, 11.972846101323913 ],
 * //   [ -8, 8 ],
 * //   [ -8, 5.345429103354391 ],
 * //   [ -8, 3.313708498984761 ],
 * //   [ -7.999999999999999, 1.5912989390372623 ],
 * //   [ -8, 0 ],
 * //   [ -7.999999999999999, -1.5912989390372623 ],
 * //   [ -8, -3.313708498984761 ],
 * //   [ -8, -5.345429103354391 ],
 * //   [ -8, -8 ],
 * //   [ -7.999999999999999, -11.972846101323913 ],
 * //   [ -8, -19.31370849898476 ],
 * //   [ -8, -40.21871593700678 ]
 * // ]
 *
 */
let fft1d = (arr) => {
    return _fft1d(arr, 'norm')
}


/**
 * iFFT1D
 *
 * @param {Array} arr 輸入數據陣列
 * @return {Array} 回傳轉換後數據陣列
 * @example
 *
 * let arr
 * let res
 *
 * arr = [
 *     [120, 0],
 *     [-8, 40.21871593700678],
 *     [-8, 19.31370849898476],
 *     [-7.999999999999999, 11.972846101323913],
 *     [-8, 8],
 *     [-8, 5.345429103354391],
 *     [-8, 3.313708498984761],
 *     [-7.999999999999999, 1.5912989390372623],
 *     [-8, 0],
 *     [-7.999999999999999, -1.5912989390372623],
 *     [-8, -3.313708498984761],
 *     [-8, -5.345429103354391],
 *     [-8, -8],
 *     [-7.999999999999999, -11.972846101323913],
 *     [-8, -19.31370849898476],
 *     [-8, -40.21871593700678]
 * ]
 * res = wf.ifft1d(arr)
 * console.log(res)
 * // => [
 * //    0,                  1,
 * //    2, 3.0000000000000018,
 * //    4,  5.000000000000002,
 * //    6,                  7,
 * //    8,                  9,
 * //   10, 10.999999999999998,
 * //   12, 12.999999999999998,
 * //   14,                 15
 * // ]
 *
 */
let ifft1d = (arr) => {
    return _fft1d(arr, 'inv')
}


// function __fft2d(re, im) {
//     let tre = []
//     let tim = []
//     let i = 0
//     // x-axis
//     for (let y = 0; y < _n; y++) {
//         i = y * _n
//         for (let x1 = 0; x1 < _n; x1++) {
//             tre[x1] = re[x1 + i]
//             tim[x1] = im[x1 + i]
//         }
//         fft1d(tre, tim)
//         for (let x2 = 0; x2 < _n; x2++) {
//             re[x2 + i] = tre[x2]
//             im[x2 + i] = tim[x2]
//         }
//     }
//     // y-axis
//     for (let x = 0; x < _n; x++) {
//         for (let y1 = 0; y1 < _n; y1++) {
//             i = x + y1 * _n
//             tre[y1] = re[i]
//             tim[y1] = im[i]
//         }
//         fft1d(tre, tim)
//         for (let y2 = 0; y2 < _n; y2++) {
//             i = x + y2 * _n
//             re[i] = tre[y2]
//             im[i] = tim[y2]
//         }
//     }
// }


// function __ifft2d(re, im) {
//     let tre = []
//     let tim = []
//     let i = 0
//     // x-axis
//     for (let y = 0; y < _n; y++) {
//         i = y * _n
//         for (let x1 = 0; x1 < _n; x1++) {
//             tre[x1] = re[x1 + i]
//             tim[x1] = im[x1 + i]
//         }
//         ifft1d(tre, tim)
//         for (let x2 = 0; x2 < _n; x2++) {
//             re[x2 + i] = tre[x2]
//             im[x2 + i] = tim[x2]
//         }
//     }
//     // y-axis
//     for (let x = 0; x < _n; x++) {
//         for (let y1 = 0; y1 < _n; y1++) {
//             i = x + y1 * _n
//             tre[y1] = re[i]
//             tim[y1] = im[i]
//         }
//         ifft1d(tre, tim)
//         for (let y2 = 0; y2 < _n; y2++) {
//             i = x + y2 * _n
//             re[i] = tre[y2]
//             im[i] = tim[y2]
//         }
//     }
// }


// function fft2d(mat, mode = 'norm') {

//     //check
//     if (mode !== 'norm' && mode !== 'inv') {
//         throw new Error(`invalid mode[${mode}]`)
//     }

//     //m, n
//     let m = size(mat)
//     let n = size(get(mat, 0, []))
//     console.log('m', m)
//     console.log('n', n)

//     //nRows, nCols
//     let nRows = get2n(m)
//     let nCols = get2n(n)
//     console.log('nRows', nRows)
//     console.log('nCols', nCols)

//     //data
//     let data = new Array(nRows * nCols)
//     for (let i = 0; i < nRows; i++) {
//         for (let j = 0; j < nCols; j++) {
//             data[i * nCols + j] = get(mat, `${i}.${j}`, 0) //超過元素自動補0
//         }
//     }
//     console.log('data', data)

//     let res = []
//     if (mode === 'norm') {
//         let ftData = FFTUtils.fft2DArray(data, nRows, nCols)
//         console.log('ftData', ftData, size(ftData))
//     }
//     else {

//     }

//     // let ftData = FFTUtils.fft2DArray(data, nRows, nCols)
//     // let ftRows = nRows * 2
//     // let ftCols = nCols / 2 + 1
//     // let iftData = FFTUtils.ifft2DArray(ftData, ftRows, ftCols)
// }


let fft2d = (mat) => {
    //有問題待之後處理
    //return fft2d(mat, 'norm')
}
let ifft2d = (mat) => {
    //有問題待之後處理
    // return fft2d(mat, 'inv')
}


function spectrum1d(arr, dt) {

    //check dt
    if (!ispnum(dt)) {
        throw new Error(`dt[${dt}] is not a positive number`)
    }
    dt = cdbl(dt)

    //fft1d
    let rm = fft1d(arr)
    // console.log('rm', rm)
    // console.log('n1', size(arr))

    //n
    let n = size(rm)
    // console.log('n', n)

    //T
    let T = dt * (n - 1)
    // console.log('T', T)

    //df
    let df = 1 / T
    // console.log('df', df)

    //F
    let F = df * (n - 1)
    // console.log('F', F)

    //hzs
    // let hzs = range(df, F + df, df)
    let hzs = range(0, F, df)
    let hzsHalf = take(hzs, n / 2)
    // hzs = [
    //     ...hzsHalf,
    //     ...reverse(hzsHalf),
    // ]
    hzs = hzsHalf
    // console.log('hzs', JSON.stringify(hzs), size(hzs))

    //rs
    let rs = []
    each(hzs, (v, k) => {
        let freq = v
        let real = rm[k][0]
        let imag = rm[k][1]
        let ampl = Math.sqrt(rm[k][0] ** 2 + rm[k][1] ** 2)
        let r = {
            freq,
            real,
            imag,
            ampl,
        }
        rs.push(r)
    })

    return rs
}


/**
 * FFT1D Filter
 *
 * @param {Array} arr 輸入數據陣列
 * @param {Number} dt 輸入數據點時間間隔數字，單位s
 * @param {Number} hzStart 輸入過濾用帶通頻率下限數字，單位Hz
 * @param {Number} hzEnd 輸入過濾用帶通頻率上限數字，單位Hz
 * @return {Array} 回傳帶通處理後數據陣列
 * @example
 *
 * let dt
 * let arr
 * let res
 *
 * //dt=0.0078125s, 3+6hz
 * dt = 0.0078125
 *
 * arr = [
 *     0,
 *     0.437015151709824,
 *     0.845854910274064,
 *     1.20056554679302,
 *     1.47944976553089,
 *     1.66674368151922,
 *     1.75379573376597,
 *     1.73964987434863,
 *     1.63098631369783,
 *     1.44142799002054,
 *     1.19027504868833,
 *     0.900778315875612,
 *     0.598101848038141,
 *     0.307150781019375,
 *     0.0504516520458098,
 *     -0.153732804251563,
 *     -0.292893218813452,
 *     -0.361241031239776,
 *     -0.360072875476548,
 *     -0.297503430771426,
 *     -0.187593110348962,
 *     -0.0489494660021425,
 *     0.0970731816865672,
 *     0.228416556922734,
 *     0.324423348821458,
 *     0.367818520155133,
 *     0.346391996239585,
 *     0.254233601317238,
 *     0.0924099202087415,
 *     -0.130978839760706,
 *     -0.401370102712605,
 *     -0.698891832710318,
 *     -1,
 *     -1.27946118721924,
 *     -1.51251056875181,
 *     -1.67699974648618,
 *     -1.75534914481383,
 *     -1.73613585202716,
 *     -1.61517856456688,
 *     -1.39602400854158,
 *     -1.08979021355164,
 *     -0.714376916729265,
 *     -0.293107462345689,
 *     0.147084814656977,
 *     0.577773754381215,
 *     0.971283137555866,
 *     1.30286634912854,
 *     1.55263964022464,
 *     1.70710678118655,
 *     1.76014786721285,
 *     1.7133908766509,
 *     1.57593734934667,
 *     1.36346871276832,
 *     1.09681259653473,
 *     0.80009440465607,
 *     0.498634516368545,
 *     0.216772751324739,
 *     -0.0241926543480825,
 *     -0.207774827040493,
 *     -0.323625771825179,
 *     -0.368309299491684,
 *     -0.345455359932455,
 *     -0.265285555765141,
 *     -0.1435542027991,
 *     -3.67544536472586E-16,
 *     0.1435542027991,
 *     0.26528555576514,
 *     0.345455359932455,
 *     0.368309299491684,
 *     0.323625771825179,
 *     0.207774827040493,
 *     0.0241926543480835,
 *     -0.216772751324738,
 *     -0.498634516368544,
 *     -0.800094404656069,
 *     -1.09681259653473,
 *     -1.36346871276832,
 *     -1.57593734934667,
 *     -1.7133908766509,
 *     -1.76014786721285,
 *     -1.70710678118655,
 *     -1.55263964022464,
 *     -1.30286634912855,
 *     -0.971283137555864,
 *     -0.577773754381218,
 *     -0.14708481465698,
 *     0.293107462345686,
 *     0.714376916729258,
 *     1.08979021355163,
 *     1.39602400854158,
 *     1.61517856456688,
 *     1.73613585202716,
 *     1.75534914481383,
 *     1.67699974648618,
 *     1.51251056875181,
 *     1.27946118721924,
 *     1,
 *     0.698891832710321,
 *     0.40137010271261,
 *     0.130978839760704,
 *     -0.0924099202087405,
 *     -0.254233601317238,
 *     -0.346391996239584,
 *     -0.367818520155133,
 *     -0.324423348821457,
 *     -0.228416556922734,
 *     -0.0970731816865679,
 *     0.0489494660021418,
 *     0.18759311034896,
 *     0.297503430771423,
 *     0.360072875476548,
 *     0.361241031239776,
 *     0.292893218813452,
 *     0.153732804251566,
 *     -0.0504516520458086,
 *     -0.307150781019376,
 *     -0.598101848038137,
 *     -0.900778315875611,
 *     -1.19027504868833,
 *     -1.44142799002054,
 *     -1.63098631369783,
 *     -1.73964987434863,
 *     -1.75379573376597,
 *     -1.66674368151922,
 *     -1.47944976553089,
 *     -1.20056554679302,
 *     -0.845854910274064,
 *     -0.43701515170983,
 * ]
 *
 * res = wf.filter1d(arr, dt, 0, 2)
 * fs.writeFileSync('./filter1d_128p_0_2Hz.txt', _.join(_.map(res, w.cstr), '\n'), 'utf8')
 * console.log(res)
 * // => [
 * //     1.900130354665816e-17,   3.171289289530446e-17,   4.332415707367346e-17,
 * //    5.3695846472494235e-17,   6.269785986213638e-17,   7.021057013202281e-17,
 * //     7.612605570310054e-17,   8.034922556306299e-17,   8.279882688317987e-17,
 * //     8.340832529158958e-17,   8.212664909001537e-17,   7.891878999746445e-17,
 * //     7.376625437307838e-17,   6.666736029780011e-17,    5.76373773671691e-17,
 * //     4.670850755121418e-17,   3.392970699761463e-17,   1.936635017644406e-17,
 * //     3.099739274245762e-18, -1.4773536772583848e-17,  -3.414238777438079e-17,
 * //    -5.488214509861833e-17,  -7.685561326121688e-17,  -9.991424053039947e-17,
 * //   -1.2389939763250017e-16,  -1.486437526110982e-16, -1.7397272896700838e-16,
 * //   -1.9970603340589478e-16,  -2.256592388503064e-16,  -2.516454078402015e-16,
 * //     -2.77476741055675e-16, -3.0296623545138124e-16, -3.2792933639642097e-16,
 * //   -3.5218556826715847e-16, -3.7556012814304826e-16,  -3.978854276051409e-16,
 * //   -4.1900256813015115e-16,  -4.387627362050729e-16,  -4.570285050522503e-16,
 * //    -4.736750307452075e-16,  -4.885911315028551e-16,  -5.016802400642502e-16,
 * //    -5.128612202571727e-16,  -5.220690401697757e-16,  -5.292552957029921e-16,
 * //    -5.343885797091161e-16,  -5.374546933952765e-16,  -5.384566981752595e-16,
 * //    -5.374148076748214e-16,   -5.34366121119686e-16,  -5.293642008471598e-16,
 * //    -5.224784981672418e-16,  -5.137936332429572e-16,  -5.034085360485657e-16,
 * //    -4.914354567849328e-16,  -4.779988553710472e-16,  -4.632341807774995e-16,
 * //    -4.472865520107286e-16,  -4.303093534859731e-16,  -4.124627583332443e-16,
 * //    -3.939121938565287e-16, -3.7482676390538224e-16, -3.5537764331493207e-16,
 * //    -3.357364598212945e-16, -3.1607367896215424e-16,  -2.965570074258067e-16,
 * //    -2.773498301168155e-16,  -2.586096958645067e-16, -2.4048686621515183e-16,
 * //    -2.231229411245869e-16,  -2.066495746112324e-16, -1.9118729254734605e-16,
 * //   -1.7684442376738718e-16, -1.6371615456625556e-16, -1.5188371545758223e-16,
 * //   -1.4141370777480338e-16,  -1.323575763378787e-16, -1.2475123298934835e-16,
 * //   -1.1861483433865337e-16, -1.1395271555741253e-16, -1.1075348055508646e-16,
 * //   -1.0899024734876648e-16, -1.0862104593732587e-16, -1.0958936451335684e-16,
 * //   -1.1182483841044193e-16, -1.1524407480220627e-16,  -1.197516048565951e-16,
 * //   -1.2524095381656962e-16, -1.3159581833879772e-16, -1.3869133938591487e-16,
 * //   -1.4639545804553208e-16, -1.5457034084925898e-16, -1.6307386049529978e-16,
 * //   -1.7176111734511303e-16, -1.8048598667334478e-16, -1.8910267640450308e-16,
 * //    -1.974672799720086e-16,  -2.054393089862649e-16, -2.1288319059773535e-16,
 * //   -2.1966971478677226e-16,
 * //   ... 28 more items
 * // ]
 *
 * res = wf.filter1d(arr, dt, 0, 4)
 * fs.writeFileSync('./filter1d_128p_0_4Hz.txt', _.join(_.map(res, w.cstr), '\n'), 'utf8')
 * console.log(res)
 * // => [
 * //   -4.827486540753305e-16,    0.1467304744553614,  0.29028467725446216,
 * //      0.42755509343028203,    0.5555702330196024,   0.6715589548470189,
 * //       0.7730104533627374,    0.8577286100002727,   0.9238795325112873,
 * //        0.970031253194545,    0.9951847266721979,   0.9987954562051734,
 * //       0.9807852804032313,    0.9415440651830219,   0.8819212643483562,
 * //        0.803207531480646,    0.7071067811865485,   0.5956993044924345,
 * //       0.4713967368259986,   0.33688985339222094,  0.19509032201612894,
 * //     0.049067674327418584,  -0.09801714032956012, -0.24298017990326354,
 * //     -0.38268343236508945,   -0.5141027441932216,  -0.6343932841636454,
 * //      -0.7409511253549594,   -0.8314696123025456,  -0.9039892931234439,
 * //      -0.9569403357322095,   -0.9891765099647818,  -1.0000000000000007,
 * //       -0.989176509964782,   -0.9569403357322102,  -0.9039892931234446,
 * //      -0.8314696123025467,   -0.7409511253549607,  -0.6343932841636468,
 * //      -0.5141027441932232,  -0.38268343236509117,  -0.2429801799032654,
 * //     -0.09801714032956207,   0.04906767432741662,    0.195090322016127,
 * //      0.33688985339221894,   0.47139673682599664,   0.5956993044924324,
 * //       0.7071067811865467,    0.8032075314806444,   0.8819212643483545,
 * //       0.9415440651830205,    0.9807852804032301,   0.9987954562051723,
 * //       0.9951847266721967,    0.9700312531945441,   0.9238795325112867,
 * //       0.8577286100002725,    0.7730104533627374,   0.6715589548470189,
 * //       0.5555702330196027,    0.4275550934302826,   0.2902846772544628,
 * //      0.14673047445536228, 4.752026505856477e-16, -0.14673047445536128,
 * //     -0.29028467725446194,   -0.4275550934302818,  -0.5555702330196022,
 * //      -0.6715589548470184,    -0.773010453362737,  -0.8577286100002722,
 * //      -0.9238795325112868,   -0.9700312531945445,  -0.9951847266721975,
 * //      -0.9987954562051732,   -0.9807852804032311,  -0.9415440651830217,
 * //      -0.8819212643483559,   -0.8032075314806458,  -0.7071067811865485,
 * //      -0.5956993044924345,   -0.4713967368259986, -0.33688985339222105,
 * //     -0.19509032201612905,  -0.04906767432741875,  0.09801714032955992,
 * //      0.24298017990326332,    0.3826834323650892,   0.5141027441932213,
 * //       0.6343932841636452,     0.740951125354959,   0.8314696123025451,
 * //       0.9039892931234434,     0.956940335732209,   0.9891765099647813,
 * //       1.0000000000000002,    0.9891765099647816,   0.9569403357322097,
 * //       0.9039892931234439,
 * //   ... 28 more items
 * // ]
 *
 * res = wf.filter1d(arr, dt, 4, 8)
 * fs.writeFileSync('./filter1d_128p_4_8Hz.txt', _.join(_.map(res, w.cstr), '\n'), 'utf8')
 * console.log(res)
 * // => [
 * //   -5.79305934263002e-16,     0.2902846772544621,   0.5555702330196025,
 * //      0.7730104533627378,     0.9238795325112876,   0.9951847266721983,
 * //       0.980785280403232,     0.8819212643483566,   0.7071067811865489,
 * //       0.471396736825999,    0.19509032201612922, -0.09801714032956009,
 * //     -0.3826834323650895,    -0.6343932841636457,  -0.8314696123025459,
 * //     -0.9569403357322098,     -1.000000000000001,  -0.9569403357322103,
 * //     -0.8314696123025468,    -0.6343932841636469,   -0.382683432365091,
 * //    -0.09801714032956177,    0.19509032201612747,  0.47139673682599736,
 * //      0.7071067811865476,     0.8819212643483555,   0.9807852804032312,
 * //      0.9951847266721979,     0.9238795325112878,   0.7730104533627384,
 * //      0.5555702330196037,     0.2902846772544636, 1.11697531048158e-15,
 * //    -0.29028467725446144,    -0.5555702330196017,   -0.773010453362737,
 * //     -0.9238795325112868,    -0.9951847266721975,  -0.9807852804032314,
 * //     -0.8819212643483562,    -0.7071067811865488,  -0.4713967368259991,
 * //    -0.19509032201612952,     0.0980171403295596,   0.3826834323650889,
 * //       0.634393284163645,     0.8314696123025451,   0.9569403357322093,
 * //      1.0000000000000004,     0.9569403357322098,   0.8314696123025465,
 * //      0.6343932841636467,    0.38268343236509095,   0.0980171403295618,
 * //    -0.19509032201612736,   -0.47139673682599714,  -0.7071067811865472,
 * //     -0.8819212643483553,     -0.980785280403231,  -0.9951847266721975,
 * //     -0.9238795325112876,     -0.773010453362738,  -0.5555702330196034,
 * //    -0.29028467725446333, -8.663552482114443e-16,  0.29028467725446166,
 * //      0.5555702330196018,     0.7730104533627369,   0.9238795325112867,
 * //      0.9951847266721974,     0.9807852804032311,   0.8819212643483559,
 * //      0.7071067811865485,    0.47139673682599875,  0.19509032201612922,
 * //    -0.09801714032955984,   -0.38268343236508906,   -0.634393284163645,
 * //      -0.831469612302545,    -0.9569403357322089,  -1.0000000000000002,
 * //     -0.9569403357322096,    -0.8314696123025461,  -0.6343932841636465,
 * //     -0.3826834323650908,   -0.09801714032956171,   0.1950903220161273,
 * //     0.47139673682599703,     0.7071067811865471,   0.8819212643483548,
 * //      0.9807852804032305,     0.9951847266721973,   0.9238795325112874,
 * //       0.773010453362738,     0.5555702330196033,   0.2902846772544634,
 * //   9.714153559505677e-16,   -0.29028467725446144,  -0.5555702330196017,
 * //     -0.7730104533627368,
 * //   ... 28 more items
 * // ]
 *
 */
function filter1d(arr, dt, hzStart, hzEnd) {

    //check dt
    if (!ispnum(dt)) {
        throw new Error(`dt[${dt}] is not a positive number`)
    }
    dt = cdbl(dt)

    //check hzStart
    if (!isp0num(hzStart)) {
        throw new Error(`hzStart[${hzStart}] is not a positive number`)
    }
    hzStart = cdbl(hzStart)

    //check hzEnd
    if (!isp0num(hzEnd)) {
        throw new Error(`hzEnd[${hzEnd}] is not a positive number`)
    }
    hzEnd = cdbl(hzEnd)

    //fft1d
    let rm = fft1d(arr)
    // console.log('rm', rm)
    // console.log('n1', size(arr))

    //n
    let n = size(rm)
    // console.log('n', n)

    //T
    let T = dt * (n - 1)
    // console.log('T', T)

    //df
    let df = 1 / T
    // console.log('df', df)

    //F
    let F = df * (n - 1)
    // console.log('F', F)

    //hzs
    // let hzs = range(df, F + df, df)
    let hzs = range(0, F, df)
    let hzsHalf = take(hzs, n / 2)
    hzs = [
        ...hzsHalf,
        ...reverse(hzsHalf),
    ]
    // console.log('hzs', JSON.stringify(hzs), size(hzs))

    //帶通, 依照指定起訖頻率清除rm
    each(hzs, (v, k) => {
        let b = hzStart <= v && v <= hzEnd //允許通過
        if (!b) {
            rm[k][0] = 0
            rm[k][1] = 0
        }
    })
    // console.log('rm(clean)', JSON.stringify(rm))

    //ifft1d
    let res = ifft1d(rm)
    // console.log('res', res)

    return res
}


/**
 * FFT與iFFT
 *
 * @returns {Array} 回傳數據陣列
 * @example
 *
 * let arr
 * let res
 *
 * arr = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
 * res = wf.fft1d(arr)
 * console.log(res)
 * // => [
 * //   [ 120, 0 ],
 * //   [ -8, 40.21871593700678 ],
 * //   [ -8, 19.31370849898476 ],
 * //   [ -7.999999999999999, 11.972846101323913 ],
 * //   [ -8, 8 ],
 * //   [ -8, 5.345429103354391 ],
 * //   [ -8, 3.313708498984761 ],
 * //   [ -7.999999999999999, 1.5912989390372623 ],
 * //   [ -8, 0 ],
 * //   [ -7.999999999999999, -1.5912989390372623 ],
 * //   [ -8, -3.313708498984761 ],
 * //   [ -8, -5.345429103354391 ],
 * //   [ -8, -8 ],
 * //   [ -7.999999999999999, -11.972846101323913 ],
 * //   [ -8, -19.31370849898476 ],
 * //   [ -8, -40.21871593700678 ]
 * // ]
 *
 * arr = [
 *     [120, 0],
 *     [-8, 40.21871593700678],
 *     [-8, 19.31370849898476],
 *     [-7.999999999999999, 11.972846101323913],
 *     [-8, 8],
 *     [-8, 5.345429103354391],
 *     [-8, 3.313708498984761],
 *     [-7.999999999999999, 1.5912989390372623],
 *     [-8, 0],
 *     [-7.999999999999999, -1.5912989390372623],
 *     [-8, -3.313708498984761],
 *     [-8, -5.345429103354391],
 *     [-8, -8],
 *     [-7.999999999999999, -11.972846101323913],
 *     [-8, -19.31370849898476],
 *     [-8, -40.21871593700678]
 * ]
 * res = wf.ifft1d(arr)
 * console.log(res)
 * // => [
 * //    0,                  1,
 * //    2, 3.0000000000000018,
 * //    4,  5.000000000000002,
 * //    6,                  7,
 * //    8,                  9,
 * //   10, 10.999999999999998,
 * //   12, 12.999999999999998,
 * //   14,                 15
 * // ]
 *
 */
let WFft = {

    fft1d,
    ifft1d,

    fft2d,
    ifft2d,

    spectrum1d,
    // spectrum2d,

    filter1d,
    // filter2d,

}


export default WFft