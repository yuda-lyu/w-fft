import get from 'lodash-es/get.js'
import size from 'lodash-es/size.js'
import { fft, ifft, complex } from 'mathjs'


//基於mathjs, 對任意m×n矩陣做真實2D DFT(對齊MATLAB fft2), 不補零至2冪次
//mathjs內部對每列每行各做1D(可分離), 各維皆支援任意長度(2冪次走Cooley-Tukey, 其餘走Chirp-Z)
function _fft2dDft(mat, mode = 'norm') {

    //m, n (列數, 行數); n以第0列長度為準, 缺項補0
    let m = size(mat)
    let n = size(get(mat, 0, []))
    // console.log('m', m, 'n', n)

    //fft 2D
    let res = []
    if (mode === 'norm') {

        //fill, 實數輸入矩陣(虛部視為0)
        let cs = []
        for (let i = 0; i < m; i++) {
            let row = new Array(n)
            for (let j = 0; j < n; j++) {
                row[j] = get(mat, `${i}.${j}`, 0)
            }
            cs.push(row)
        }

        //fft, 回傳mathjs Complex物件之巢狀陣列
        let out = fft(cs)

        //res, 每元素轉[re,im]
        for (let i = 0; i < m; i++) {
            let row = []
            for (let j = 0; j < n; j++) {
                row.push([out[i][j].re, out[i][j].im])
            }
            res.push(row)
        }
    }
    else {

        //fill, 複數輸入矩陣[[[re,im],...],...]
        let cs = []
        for (let i = 0; i < m; i++) {
            let row = new Array(n)
            for (let j = 0; j < n; j++) {
                let _i = get(mat, `${i}.${j}.0`, 0)
                let _j = get(mat, `${i}.${j}.1`, 0)
                row[j] = complex(_i, _j)
            }
            cs.push(row)
        }

        //ifft, mathjs之ifft已正規化(內部除以m*n), round-trip可還原原矩陣
        let out = ifft(cs)

        //res, 只取實部
        for (let i = 0; i < m; i++) {
            let row = []
            for (let j = 0; j < n; j++) {
                row.push(out[i][j].re)
            }
            res.push(row)
        }
    }

    return res
}


export default _fft2dDft
