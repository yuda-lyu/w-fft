import get from 'lodash-es/get.js'
import _fft2d from './_fft2d.mjs'


/**
 * iFFT2D
 *
 * @param {Array} mat 輸入二維[re,im]複數矩陣
 * @param {Object} [opt={}] 選項物件
 * @param {String} [opt.type='dft'] 輸入計算方式字串，'dft'為使用mathjs對任意m×n點做真實m×n點iDFT(各軸2冪次走Cooley-Tukey、其餘走Chirp-Z)，數據品質最佳但非2冪次時較慢；'pow2'為兩軸各自先補零至2冪次(最少4點)再使用ml-fft之radix-2 iFFT，速度極快適合前端即時繪圖，但輸出尺寸為補零後之2冪次，預設'dft'
 * @return {Array} 回傳二維實數矩陣
 * @example
 *
 * let mat
 * let res
 *
 * mat = [
 *     [ [ 21, 1.0445074572148558e-16 ], [ -2.9999999999999982, 1.7320508075688785 ], [ -3.0000000000000013, -1.7320508075688705 ] ],
 *     [ [ -9, -2.326366143623307e-16 ], [ 0, -8.881784197001252e-16 ], [ 0, -2.7755575615628914e-15 ] ]
 * ]
 * res = wf.ifft2d(mat)
 * console.log(res)
 * // => [
 * //   [ 1.0000000000000002, 2.0000000000000004, 2.9999999999999987 ],
 * //   [ 4, 5.000000000000001, 5.999999999999999 ]
 * // ]
 *
 */
let ifft2d = (mat, opt = {}) => {

    //type
    let type = get(opt, 'type', 'dft')

    return _fft2d(mat, 'inv', type)
}


export default ifft2d
