import size from 'lodash-es/size.js'
import each from 'lodash-es/each.js'
import range from 'lodash-es/range.js'
import take from 'lodash-es/take.js'
import _fft1d from './_fft1d.mjs'
import { chkArr, chkMinLen, chkNum, chkOpt, optType, optUseOneTurn } from './_chkParam.mjs'


/**
 * 振幅頻譜1D
 *
 * 輸入參數皆於入口先檢測(dft與pow2兩路徑一致)，依參數順序由左至右，無效時同步throw Error，訊息不帶輸入值。
 *
 * @param {Array} arr 輸入數據陣列，種類為資料陣列(元素為有效數字)：陣列須非空，各元素須為有限數字或數字字串(如'2'、' 2 '、'1.2e-5')，數字字串轉換為數字後才運算；非數字字串(含'-'、'NP'、'')、null、undefined、布林、NaN、Infinity、'0x10'等皆無效，不視為0或1；任一元素無效即throw Error，訊息帶索引(如`invalid arr[3]: must be a valid number`)；非陣列(含類陣列物件、TypedArray)與空陣列亦throw Error。長度須至少4點(以dft計，輸出為正頻半部floor(n/2)點，至少4點才含非直流頻率點；長度1回空陣列、長度2與3只有直流點，皆不是有意義之頻譜)，不足throw Error(`invalid arr: must be an array with at least 4 elements`)，dft與pow2一致，以輸入長度判定而非補零後點數；此檢查於元素檢測之後、dt之前
 * @param {Number} dt 時間間隔，單位s，種類為有效數字(正數)：有限數字或數字字串(轉換後才使用)且須大於0，未給、非數字、0、負數、Infinity、'0x10'等throw Error(`invalid dt: must be a positive number`)
 * @param {Object} [opt={}] 選項物件，種類為一般物件，undefined或null視為未給，其他非一般物件(如陣列、函數、Date)throw Error(`invalid opt: must be an object`)
 * @param {Boolean} [opt.useOneTurn=true] true=輸入視為一個完整週期(頭尾重複)，週期(n-1)*dt；false=標準DFT，週期n*dt。種類為布林(只收true或false)，undefined或null取預設，給了而非布林(如'n'、'false'、0、1)throw Error(`invalid opt.useOneTurn: must be a boolean`)，不以真值判定
 * @param {String} [opt.type='dft'] 輸入計算方式字串，種類為列舉字串('dft'或'pow2')，undefined或null取預設，給了而不在列舉內throw Error(`invalid opt.type: must be one of 'dft', 'pow2'`)，不靜默改用預設。'dft'為使用mathjs對任意n點做真實n點DFT(2冪次走Cooley-Tukey、其餘走Chirp-Z)，數據品質最佳但非2冪次時較慢；'pow2'為先補零至2冪次(最少4點)再使用ml-fft之radix-2 FFT，速度極快適合前端即時繪圖，但頻譜點數與頻率解析度df係以補零後之2冪次點數計算，預設'dft'
 * @return {Array} 回傳[{freq,real,imag,ampl},...]頻譜陣列
 * @example
 *
 * let arr
 * let res
 *
 * arr = [1, 2, 3, 4]
 * res = wf.spectrum1d(arr, 1)
 * console.log(res)
 * // => [
 * //   { freq: 0, real: 10, imag: 0, ampl: 10 },
 * //   { freq: 0.3333333333333333, real: -2, imag: 2, ampl: 2.8284271247461903 }
 * // ]
 *
 */
function spectrum1d(arr, dt, opt = {}) {

    //check arr, 元素為有效數字, 轉換後才使用
    let vs = chkArr(arr, 'arr')

    //check 長度, 至少4點(輸出floor(n/2)點, 需含非直流點才有頻率軸), 不足throw
    chkMinLen(vs, 'arr', 4)

    //check dt, 有效數字(正數), 轉換後才使用
    dt = chkNum(dt, 'dt', 'positive')

    //check opt
    opt = chkOpt(opt)

    //useOneTurn: true(預設)=輸入視為一個完整週期(頭尾為同一相位、重複), 週期取(n-1)*dt; false=標準DFT, 週期取n*dt
    let useOneTurn = optUseOneTurn(opt)

    //type: 'dft'(預設)=mathjs真實n點DFT; 'pow2'=補零至2冪次後用ml-fft, 速度極快
    let type = optType(opt)

    //fft1d, vs已檢測並轉換
    let rm = _fft1d(vs, 'norm', type)
    // console.log('rm', rm)
    // console.log('n1', size(arr))

    //n
    let n = size(rm)
    // console.log('n', n)

    //T, useOneTurn=true時週期(n-1)*dt, =false時標準DFT週期n*dt
    let T = useOneTurn ? dt * (n - 1) : dt * n
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


export default spectrum1d
