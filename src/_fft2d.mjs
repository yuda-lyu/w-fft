import _fft2dDft from './_fft2dDft.mjs'
import _fft2dPow2 from './_fft2dPow2.mjs'


//2D之FFT與iFFT核心, 依type分派至mathjs(真實m×n點DFT)或ml-fft(兩軸補零至2冪次之radix-2 FFT)
function _fft2d(mat, mode = 'norm', type = 'dft') {

    //check mode
    if (mode !== 'norm' && mode !== 'inv') {
        throw new Error(`invalid mode[${mode}]`)
    }

    //check type
    if (type !== 'dft' && type !== 'pow2') {
        throw new Error(`invalid type[${type}]`)
    }

    if (type === 'pow2') {
        return _fft2dPow2(mat, mode)
    }
    return _fft2dDft(mat, mode)
}


export default _fft2d
