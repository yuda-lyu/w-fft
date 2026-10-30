import get from 'lodash-es/get.js'
import size from 'lodash-es/size.js'
import _fft2d from './_fft2d.mjs'
import { chkMat, chkNum, chkOpt, optType, optUseOneTurn } from './_chkParam.mjs'


/**
 * FFT2D 帶通濾波
 *
 * 輸入參數皆於入口先檢測(dft與pow2兩路徑一致)，依參數順序由左至右，無效時同步throw Error，訊息不帶輸入值。
 *
 * @param {Array} mat 輸入二維實數矩陣，種類為二維資料陣列(元素為有效數字)：須為非空之矩形陣列(各列皆為陣列且長度等於第0列，第0列不可為空，不補0亦不截斷)，各元素須為有限數字或數字字串(如'2'、' 2 '、'1.2e-5')，數字字串轉換為數字後才運算；非數字字串(含'-'、'NP'、'')、null、undefined、布林、NaN、Infinity、'0x10'等皆無效，不視為0或1；任一元素無效即throw Error，訊息帶兩層索引(如`invalid mat[1][2]: must be a valid number`)；非陣列(含類陣列物件、TypedArray)、空陣列與非矩形亦throw Error
 * @param {Number} dt 時間間隔，單位s，種類為有效數字(正數)：有限數字或數字字串(轉換後才使用)且須大於0，未給、非數字、0、負數、Infinity、'0x10'等throw Error(`invalid dt: must be a positive number`)
 * @param {Number} hzStart 帶通頻率下限，單位Hz（以徑向頻率 sqrt(fRow²+fCol²) 判斷），種類為有效數字(非負數)：有限數字或數字字串(轉換後才使用)且須大於等於0，未給、非數字、負數、Infinity、'0x10'等throw Error(`invalid hzStart: must be a non-negative number`)
 * @param {Number} hzEnd 帶通頻率上限，單位Hz，種類為有效數字(非負數)：有限數字或數字字串(轉換後才使用)且須大於等於0，未給、非數字、負數、Infinity(需通過全部高頻時請給足夠大之有限數)、'0x10'等throw Error(`invalid hzEnd: must be a non-negative number`)
 * @param {Object} [opt={}] 選項物件，種類為一般物件，undefined或null視為未給，其他非一般物件(如陣列、函數、Date)throw Error(`invalid opt: must be an object`)
 * @param {Boolean} [opt.useOneTurn=true] true=各軸視為一個完整週期(頭尾重複)，週期(len-1)*dt；false=標準DFT，週期len*dt。種類為布林(只收true或false)，undefined或null取預設，給了而非布林(如'n'、'false'、0、1)throw Error(`invalid opt.useOneTurn: must be a boolean`)，不以真值判定
 * @param {String} [opt.type='dft'] 輸入計算方式字串，種類為列舉字串('dft'或'pow2')，undefined或null取預設，給了而不在列舉內throw Error(`invalid opt.type: must be one of 'dft', 'pow2'`)，不靜默改用預設。'dft'為使用mathjs對任意m×n點做真實m×n點DFT(各軸2冪次走Cooley-Tukey、其餘走Chirp-Z)，數據品質最佳但非2冪次時較慢；'pow2'為兩軸各自先補零至2冪次(最少4點)再使用ml-fft之radix-2 FFT，速度極快適合前端即時繪圖，但輸出尺寸與各軸頻率解析度df係以補零後之2冪次點數計算，預設'dft'
 * @return {Array} 回傳帶通處理後二維實數矩陣
 * @example
 *
 * let mat
 * let res
 *
 * mat = [[0,1,2,3],[1,2,3,4],[2,3,4,5],[3,4,5,6]]
 * res = wf.filter2d(mat, 0.5, 0.3, 0.8)
 * console.log(res)
 * // => [
 * //   [ -2, -2, 0, 0 ],
 * //   [ -2, -2, 0, 0 ],
 * //   [  0,  0, 2, 2 ],
 * //   [  0,  0, 2, 2 ]
 * // ]
 *
 */
function filter2d(mat, dt, hzStart, hzEnd, opt = {}) {

    //check mat, 元素為有效數字, 轉換後才使用
    let vs = chkMat(mat, 'mat')

    //check dt, 有效數字(正數), 轉換後才使用
    dt = chkNum(dt, 'dt', 'positive')

    //check hzStart, 有效數字(非負數), 轉換後才使用
    hzStart = chkNum(hzStart, 'hzStart', 'nonneg')

    //check hzEnd, 有效數字(非負數), 轉換後才使用
    hzEnd = chkNum(hzEnd, 'hzEnd', 'nonneg')

    //check opt
    opt = chkOpt(opt)

    //useOneTurn: true(預設)=各軸視為一個完整週期(頭尾重複), 週期(len-1)*dt; false=標準DFT, 週期len*dt
    let useOneTurn = optUseOneTurn(opt)

    //type: 'dft'(預設)=mathjs真實m×n點DFT; 'pow2'=兩軸補零至2冪次後用ml-fft, 速度極快
    let type = optType(opt)

    //fft2d, vs已檢測並轉換, 回傳m×n之[re,im]
    let rm = _fft2d(vs, 'norm', type)

    //m, n
    let m = size(rm)
    let n = size(get(rm, 0, []))

    //df, 兩軸各自
    let dfRow = 1 / ((useOneTurn ? m - 1 : m) * dt)
    let dfCol = 1 / ((useOneTurn ? n - 1 : n) * dt)

    //帶通, 以徑向頻率sqrt(fRow²+fCol²)判斷; bin(i,j)頻率大小取min(i,m-i)*dfRow與min(j,n-j)*dfCol(與共軛bin同值→一起遮罩, 輸出保持實數), 涵蓋全部bin
    for (let i = 0; i < m; i++) {
        for (let j = 0; j < n; j++) {
            let fRow = Math.min(i, m - i) * dfRow
            let fCol = Math.min(j, n - j) * dfCol
            let fRad = Math.sqrt(fRow ** 2 + fCol ** 2)
            let b = hzStart <= fRad && fRad <= hzEnd //允許通過
            if (!b) {
                rm[i][j][0] = 0
                rm[i][j][1] = 0
            }
        }
    }

    //ifft2d, rm之兩軸點數已為2冪次, 'pow2'不會再補零; rm為本函數內部產生之[re,im]數字對, 不需再檢測
    let res = _fft2d(rm, 'inv', type)

    return res
}


export default filter2d
