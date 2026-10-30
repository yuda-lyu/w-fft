import _fft2dDft from './_fft2dDft.mjs'
import _fft2dPow2 from './_fft2dPow2.mjs'


//2D之FFT與iFFT核心, 依type分派至mathjs(真實m×n點DFT)或ml-fft(兩軸補零至2冪次之radix-2 FFT)
//mat須已由入口檢測並轉換(實數為number矩陣, inv為[re,im]之number對矩陣), 此處僅防呼叫端誤用mode與type
function _fft2d(mat, mode = 'norm', type = 'dft') {

    //check mode
    if (mode !== 'norm' && mode !== 'inv') {
        throw new Error(`invalid mode: must be 'norm' or 'inv'`)
    }

    //check type
    if (type !== 'dft' && type !== 'pow2') {
        throw new Error(`invalid opt.type: must be one of 'dft', 'pow2'`)
    }

    if (type === 'pow2') {
        return _fft2dPow2(mat, mode)
    }
    return _fft2dDft(mat, mode)
}


export default _fft2d
