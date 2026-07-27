//取得>=n的最小2冪次, 供type='pow2'補零至2冪次用
//最小值取4: ml-fft之radix-2核心於n=2時twiddle table有誤(實測FFT.init(2)+fft([1,2],[0,0])回傳[1,1]而非正確之[3,-1]), 故2冪次一律自4起算
function get2n(n) {
    let i = 2
    let j = Math.pow(2, 52)
    while (true) {
        i *= 2
        // console.log('n', n, 'i', i, 'n <= i', n <= i)
        if (n <= i) {
            break
        }
        // console.log('j', j, 'i >= j', i >= j)
        if (i >= j) {
            break
        }
    }
    return i
}


export default get2n
