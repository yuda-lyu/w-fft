import _fft2d from './_fft2d.mjs'
import { chkMat, chkOpt, optType } from './_chkParam.mjs'


/**
 * FFT2D
 *
 * 輸入參數皆於入口先檢測(dft與pow2兩路徑一致)，無效時同步throw Error，訊息不帶輸入值。
 *
 * @param {Array} mat 輸入二維實數矩陣，種類為二維資料陣列(元素為有效數字)：須為非空之矩形陣列(各列皆為陣列且長度等於第0列，第0列不可為空，不補0亦不截斷)，各元素須為有限數字或數字字串(如'2'、' 2 '、'1.2e-5')，數字字串轉換為數字後才運算；非數字字串(含'-'、'NP'、'')、null、undefined、布林、NaN、Infinity、'0x10'等皆無效，不視為0或1；任一元素無效即throw Error，訊息帶兩層索引(如`invalid mat[1][2]: must be a valid number`)；非陣列(含類陣列物件、TypedArray)、空陣列與非矩形亦throw Error
 * @param {Object} [opt={}] 選項物件，種類為一般物件，undefined或null視為未給，其他非一般物件(如陣列、函數、Date)throw Error(`invalid opt: must be an object`)
 * @param {String} [opt.type='dft'] 輸入計算方式字串，種類為列舉字串('dft'或'pow2')，undefined或null取預設，給了而不在列舉內throw Error(`invalid opt.type: must be one of 'dft', 'pow2'`)，不靜默改用預設。'dft'為使用mathjs對任意m×n點做真實m×n點DFT(各軸2冪次走Cooley-Tukey、其餘走Chirp-Z)，數據品質最佳但非2冪次時較慢；'pow2'為兩軸各自先補零至2冪次(最少4點)再使用ml-fft之radix-2 FFT，速度極快適合前端即時繪圖，但輸出尺寸為補零後之2冪次，且非2冪次輸入時頻率bin為DTFT插值而非真實m×n點DFT，預設'dft'
 * @return {Array} 回傳二維[re,im]複數矩陣；輸入為1×1時'dft'為[[[x,0]]]
 * @example
 *
 * let mat
 * let res
 *
 * mat = [[1, 2, 3], [4, 5, 6]]
 * res = wf.fft2d(mat)
 * console.log(res)
 * // => [
 * //   [ [ 21, 1.0445074572148558e-16 ], [ -2.9999999999999982, 1.7320508075688785 ], [ -3.0000000000000013, -1.7320508075688705 ] ],
 * //   [ [ -9, -2.326366143623307e-16 ], [ 0, -8.881784197001252e-16 ], [ 0, -2.7755575615628914e-15 ] ]
 * // ]
 *
 * //type='pow2'時兩軸各自補零至2冪次(2×3補至4×4), 輸出尺寸與'dft'不同
 * res = wf.fft2d(mat, { type: 'pow2' })
 * console.log(res)
 * // => [
 * //   [ [ 21, 0 ], [ -4, -7 ], [ 7, 0 ], [ -4, 7 ] ],
 * //   [ [ 6, -15 ], [ -7, 0 ], [ 2, -5 ], [ 3, 4 ] ],
 * //   [ [ -9, 0 ], [ 0, 3 ], [ -3, 0 ], [ 0, -3 ] ],
 * //   [ [ 6, 15 ], [ 3, -4 ], [ 2, 5 ], [ -7, 0 ] ]
 * // ]
 *
 * //輸入為1×1時, 'dft'為真實1×1點DFT, X[0][0]=x[0][0]
 * res = wf.fft2d([[5]])
 * console.log(res)
 * // => [ [ [ 5, 0 ] ] ]
 *
 */
let fft2d = (mat, opt = {}) => {

    //check mat, 元素為有效數字, 轉換後才使用
    let vs = chkMat(mat, 'mat')

    //check opt
    opt = chkOpt(opt)

    //type
    let type = optType(opt)

    return _fft2d(vs, 'norm', type)
}


export default fft2d
