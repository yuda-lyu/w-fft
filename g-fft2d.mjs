import wf from './src/WFft.mjs'

let arr
let res

arr = [
    [0, 1, 2, 3],
    [1, 2, 3, 4],
    [2, 3, 4, 5],
    [3, 4, 5, 6],
    [4, 5, 6, 7],
    [5, 6, 7, 8],
    [6, 7, 8, 9],
    [7, 8, 9, 10],
    [8, 9, 10, 11],
    [9, 10, 11, 12],
    [10, 11, 12, 13],
    [11, 12, 13, 14],
    [12, 13, 14, 15],
    [13, 14, 15, 16],
    [14, 15, 16, 17],
    [15, 16, 17, 18],
]
res = wf.fft2d(arr)
console.log(res)

//node --experimental-modules g-fft2d.mjs
