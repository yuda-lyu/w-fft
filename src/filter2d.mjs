import get from 'lodash-es/get.js'
import size from 'lodash-es/size.js'
import ispnum from 'wsemi/src/ispnum.mjs'
import isp0num from 'wsemi/src/isp0num.mjs'
import cdbl from 'wsemi/src/cdbl.mjs'
import fft2d from './fft2d.mjs'
import ifft2d from './ifft2d.mjs'


/**
 * FFT2D 帶通濾波
 *
 * @param {Array} mat 輸入二維實數矩陣
 * @param {Number} dt 時間間隔，單位s
 * @param {Number} hzStart 帶通頻率下限，單位Hz（以徑向頻率 sqrt(fRow²+fCol²) 判斷）
 * @param {Number} hzEnd 帶通頻率上限，單位Hz
 * @param {Object} [opt={}] 選項物件
 * @param {Boolean} [opt.useOneTurn=true] true=各軸視為一個完整週期(頭尾重複)，週期(len-1)*dt；false=標準DFT，週期len*dt
 * @param {String} [opt.type='dft'] 輸入計算方式字串，'dft'為使用mathjs對任意m×n點做真實m×n點DFT(各軸2冪次走Cooley-Tukey、其餘走Chirp-Z)，數據品質最佳但非2冪次時較慢；'pow2'為兩軸各自先補零至2冪次(最少4點)再使用ml-fft之radix-2 FFT，速度極快適合前端即時繪圖，但輸出尺寸與各軸頻率解析度df係以補零後之2冪次點數計算，預設'dft'
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

    //useOneTurn: true(預設)=各軸視為一個完整週期(頭尾重複), 週期(len-1)*dt; false=標準DFT, 週期len*dt
    let useOneTurn = get(opt, 'useOneTurn', true)

    //type: 'dft'(預設)=mathjs真實m×n點DFT; 'pow2'=兩軸補零至2冪次後用ml-fft, 速度極快
    let type = get(opt, 'type', 'dft')

    //fft2d, 回傳m×n之[re,im]
    let rm = fft2d(mat, { type })

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

    //ifft2d, rm之兩軸點數已為2冪次, 'pow2'不會再補零
    let res = ifft2d(rm, { type })

    return res
}


export default filter2d
