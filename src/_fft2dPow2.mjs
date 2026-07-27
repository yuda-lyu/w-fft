import get from 'lodash-es/get.js'
import size from 'lodash-es/size.js'
import ml from 'ml-fft'
import get2n from './get2n.mjs'


//https://github.com/mljs/fft
//https://github.com/IQEngine/WebFFT/blob/main/lib/mljs/fftlib.js
let FFT = ml.FFT


//基於ml-fft, 兩軸各自補零至2冪次(nRows×nCols)後做可分離之radix-2 FFT: 先對每列做nCols點, 再對每行做nRows點
//不使用ml-fft之FFTUtils.fft2DArray(其為real-to-complex之壓縮排列)與FFT.fft2d(其要求列數等於行數), 改以1D兩趟組合, 可支援任意m×n
//非2冪次時實際為nRows×nCols點DFT(對DTFT的插值), 與真實m×n點DFT(MATLAB fft2)不同, 輸出尺寸亦為nRows×nCols; 但速度遠快於mathjs之Chirp-Z
function _fft2dPow2(mat, mode = 'norm') {

    //m, n (列數, 行數); n以第0列長度為準, 缺項補0
    let m = size(mat)
    let n = size(get(mat, 0, []))
    // console.log('m', m, 'n', n)

    //nRows, nCols
    let nRows = get2n(m)
    let nCols = get2n(n)
    // console.log('nRows', nRows, 'nCols', nCols)

    //fill, re與im各存為nRows×nCols二維陣列, 超過m或n之元素自動補0
    let re = []
    let im = []
    for (let i = 0; i < nRows; i++) {
        let rowRe = new Array(nCols)
        let rowIm = new Array(nCols)
        for (let j = 0; j < nCols; j++) {
            if (mode === 'norm') {
                rowRe[j] = get(mat, `${i}.${j}`, 0) //實數輸入矩陣(虛部視為0)
                rowIm[j] = 0
            }
            else {
                rowRe[j] = get(mat, `${i}.${j}.0`, 0) //複數輸入矩陣[[[re,im],...],...]
                rowIm[j] = get(mat, `${i}.${j}.1`, 0)
            }
        }
        re.push(rowRe)
        im.push(rowIm)
    }

    //fn, norm用fft, inv用ifft(ifft各趟各自除以其點數, 兩趟合計除以nRows*nCols, 與mathjs之ifft正規化一致)
    let fn = (mode === 'norm') ? FFT.fft : FFT.ifft

    //列方向, 對每列做nCols點轉換, 原地運算
    FFT.init(nCols)
    for (let i = 0; i < nRows; i++) {
        fn(re[i], im[i])
    }

    //行方向, 對每行做nRows點轉換
    FFT.init(nRows)
    let tre = new Array(nRows)
    let tim = new Array(nRows)
    for (let j = 0; j < nCols; j++) {
        for (let i = 0; i < nRows; i++) {
            tre[i] = re[i][j]
            tim[i] = im[i][j]
        }
        fn(tre, tim)
        for (let i = 0; i < nRows; i++) {
            re[i][j] = tre[i]
            im[i][j] = tim[i]
        }
    }

    //res
    let res = []
    for (let i = 0; i < nRows; i++) {
        let row = []
        for (let j = 0; j < nCols; j++) {
            if (mode === 'norm') {
                row.push([re[i][j], im[i][j]])
            }
            else {
                row.push(re[i][j]) //只取實部
            }
        }
        res.push(row)
    }

    return res
}


export default _fft2dPow2
