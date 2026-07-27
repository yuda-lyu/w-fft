import _fft1dDft from './_fft1dDft.mjs'
import _fft1dPow2 from './_fft1dPow2.mjs'


//1D之FFT與iFFT核心, 依type分派至mathjs(真實n點DFT)或ml-fft(補零至2冪次之radix-2 FFT)
function _fft1d(arr, mode = 'norm', type = 'dft') {

    //check mode
    if (mode !== 'norm' && mode !== 'inv') {
        throw new Error(`invalid mode[${mode}]`)
    }

    //check type
    if (type !== 'dft' && type !== 'pow2') {
        throw new Error(`invalid type[${type}]`)
    }

    if (type === 'pow2') {
        return _fft1dPow2(arr, mode)
    }
    return _fft1dDft(arr, mode)
}


export default _fft1d
