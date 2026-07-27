import get from 'lodash-es/get.js'
import size from 'lodash-es/size.js'
import ml from 'ml-fft'
import get2n from './get2n.mjs'


//https://github.com/mljs/fft
//https://github.com/IQEngine/WebFFT/blob/main/lib/mljs/fftlib.js
let FFT = ml.FFT


//基於ml-fft, 先用get2n將n補零至2冪次(nCols)再做radix-2 FFT
//非2冪次時實際為nCols點DFT(對DTFT的插值), 與真實n點DFT(MATLAB fft)不同, 輸出點數亦為nCols而非n; 但速度遠快於mathjs之Chirp-Z, 適合前端即時繪圖
function _fft1dPow2(arr, mode = 'norm') {

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

    //fft, 原地運算
    let res = []
    if (mode === 'norm') {
        FFT.fft(re, im)
        for (let i = 0; i < nCols; i++) {
            res.push([re[i], im[i]])
        }
    }
    else {

        //ifft, ml-fft之ifft已正規化(內部除以nCols)
        FFT.ifft(re, im)

        //res, 只取實部
        for (let i = 0; i < nCols; i++) {
            res.push(re[i])
        }
    }

    return res
}


export default _fft1dPow2
