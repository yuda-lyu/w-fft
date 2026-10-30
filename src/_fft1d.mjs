import _fft1dDft from './_fft1dDft.mjs'
import _fft1dPow2 from './_fft1dPow2.mjs'


//1D之FFT與iFFT核心, 依type分派至mathjs(真實n點DFT)或ml-fft(補零至2冪次之radix-2 FFT)
//arr須已由入口檢測並轉換(實數為number陣列, inv為[re,im]之number對陣列), 此處僅防呼叫端誤用mode與type
function _fft1d(arr, mode = 'norm', type = 'dft') {

    //check mode
    if (mode !== 'norm' && mode !== 'inv') {
        throw new Error(`invalid mode: must be 'norm' or 'inv'`)
    }

    //check type
    if (type !== 'dft' && type !== 'pow2') {
        throw new Error(`invalid opt.type: must be one of 'dft', 'pow2'`)
    }

    if (type === 'pow2') {
        return _fft1dPow2(arr, mode)
    }
    return _fft1dDft(arr, mode)
}


export default _fft1d
