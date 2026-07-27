import get from 'lodash-es/get.js'
import size from 'lodash-es/size.js'
import { fft, ifft, complex } from 'mathjs'


//基於mathjs, 直接對任意n點做真實n點DFT(對齊MATLAB fft), 不補零至2冪次
//mathjs對任意n: 2冪次走Cooley-Tukey, 其餘走Chirp-Z(CZT), 皆為真實n點DFT
function _fft1dDft(arr, mode = 'norm') {

    //n
    let n = size(arr)
    // console.log('n', n)

    //fft
    let res = []
    if (mode === 'norm') {

        //fill, 實數輸入(虛部視為0)
        let cs = new Array(n)
        for (let i = 0; i < n; i++) {
            cs[i] = get(arr, i, 0)
        }

        //fft, 回傳mathjs Complex物件陣列(含re, im)
        let out = fft(cs)

        //res
        for (let i = 0; i < n; i++) {
            res.push([out[i].re, out[i].im])
        }
    }
    else {

        //fill, 複數輸入[[re,im],...]
        let cs = new Array(n)
        for (let i = 0; i < n; i++) {
            let _i = get(arr, `${i}.0`, 0)
            let _j = get(arr, `${i}.1`, 0)
            cs[i] = complex(_i, _j)
        }

        //ifft, mathjs之ifft已正規化(內部除以n), round-trip可還原原訊號
        let out = ifft(cs)

        //res, 只取實部
        for (let i = 0; i < n; i++) {
            res.push(out[i].re)
        }
    }

    return res
}


export default _fft1dDft
