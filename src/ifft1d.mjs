import _fft1d from './_fft1d.mjs'
import { chkArrCplx, chkOpt, optType } from './_chkParam.mjs'


/**
 * iFFT1D
 *
 * 輸入參數皆於入口先檢測(dft與pow2兩路徑一致)，無效時同步throw Error，訊息不帶輸入值。
 *
 * @param {Array} arr 輸入數據陣列，種類為資料陣列(元素為[re,im]複數對)：陣列須非空，各元素須為長度2之陣列[re,im]，re與im須為有限數字或數字字串(如'2'、' 2 '、'1.2e-5')，數字字串轉換為數字後才運算，缺項不補0；非數字字串(含'-'、'NP'、'')、null、undefined、布林、NaN、Infinity、'0x10'等皆無效，不視為0或1；任一元素無效即throw Error，訊息帶索引(如`invalid arr[3]: must be an array of 2 elements`、`invalid arr[3][1]: must be a valid number`)；非陣列(含類陣列物件、TypedArray)與空陣列亦throw Error
 * @param {Object} [opt={}] 選項物件，種類為一般物件，undefined或null視為未給，其他非一般物件(如陣列、函數、Date)throw Error(`invalid opt: must be an object`)
 * @param {String} [opt.type='dft'] 輸入計算方式字串，種類為列舉字串('dft'或'pow2')，undefined或null取預設，給了而不在列舉內throw Error(`invalid opt.type: must be one of 'dft', 'pow2'`)，不靜默改用預設。'dft'為使用mathjs對任意n點做真實n點iDFT(2冪次走Cooley-Tukey、其餘走Chirp-Z)，數據品質最佳但非2冪次時較慢；'pow2'為先補零至2冪次(最少4點)再使用ml-fft之radix-2 iFFT，速度極快適合前端即時繪圖，但輸出點數為補零後之2冪次，預設'dft'
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
 * //    0,                      1,
 * //    2.0000000000000004, 3.0000000000000013,
 * //    4,                  5.000000000000002,
 * //    6,                  7.000000000000001,
 * //    8,                  9,
 * //   10,                 10.999999999999998,
 * //   12,                 12.999999999999998,
 * //   14,                 15
 * // ]
 *
 * res = wf.ifft1d(arr, { type: 'pow2' })
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
let ifft1d = (arr, opt = {}) => {

    //check arr, 元素為[re,im]之有效數字對, 轉換後才使用
    let vs = chkArrCplx(arr, 'arr')

    //check opt
    opt = chkOpt(opt)

    //type
    let type = optType(opt)

    return _fft1d(vs, 'inv', type)
}


export default ifft1d
