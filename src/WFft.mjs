import get from 'lodash-es/get.js'
import size from 'lodash-es/size.js'
// import each from 'lodash-es/each.js'
// import toString from 'lodash-es/toString.js'
// import isNumber from 'lodash-es/isNumber.js'
// import genPm from 'wsemi/src/genPm.mjs'
// import KissFFT from './KissFFT.mjs'
import ml from 'ml-fft'


//https://github.com/mljs/fft
//https://github.com/IQEngine/WebFFT/blob/main/lib/mljs/fftlib.js
let FFT = ml.FFT
// let FFTUtils = ml.FFTUtils


function get2n(n) {
    let i = 1
    let j = 2 * 52
    while (true) {
        i *= 2
        if (n <= i) {
            break
        }
        if (i >= j) {
            break
        }
    }
    return i
}


function fft1d(arr, mode = 'norm') {

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
            let _j = im[i]
            let _l = Math.sqrt(_i * _i, _j * _j)
            res.push(_l)
        }
    }

    return res
}


let _fft1d = (arr) => {
    return fft1d(arr, 'norm')
}
let _ifft1d = (arr) => {
    return fft1d(arr, 'inv')
}


// function _fft2d(re, im) {
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
//         _fft1d(tre, tim)
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
//         _fft1d(tre, tim)
//         for (let y2 = 0; y2 < _n; y2++) {
//             i = x + y2 * _n
//             re[i] = tre[y2]
//             im[i] = tim[y2]
//         }
//     }
// }


// function _ifft2d(re, im) {
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
//         _ifft1d(tre, tim)
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
//         _ifft1d(tre, tim)
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


let _fft2d = (mat) => {
    //有問題待之後處理
    //return fft2d(mat, 'norm')
}
let _ifft2d = (mat) => {
    //有問題待之後處理
    // return fft2d(mat, 'inv')
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
    fft1d: _fft1d,
    ifft1d: _ifft1d,
    fft2d: _fft2d,
    ifft2d: _ifft2d,
}


export default WFft
