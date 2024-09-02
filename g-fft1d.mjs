import wf from './src/WFft.mjs'

let arr
let res

arr = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
res = wf.fft1d(arr)
console.log(res)
// => [
//   [ 120, 0 ],
//   [ -8, 40.21871593700678 ],
//   [ -8, 19.31370849898476 ],
//   [ -7.999999999999999, 11.972846101323913 ],
//   [ -8, 8 ],
//   [ -8, 5.345429103354391 ],
//   [ -8, 3.313708498984761 ],
//   [ -7.999999999999999, 1.5912989390372623 ],
//   [ -8, 0 ],
//   [ -7.999999999999999, -1.5912989390372623 ],
//   [ -8, -3.313708498984761 ],
//   [ -8, -5.345429103354391 ],
//   [ -8, -8 ],
//   [ -7.999999999999999, -11.972846101323913 ],
//   [ -8, -19.31370849898476 ],
//   [ -8, -40.21871593700678 ]
// ]

arr = [
    [120, 0],
    [-8, 40.21871593700678],
    [-8, 19.31370849898476],
    [-7.999999999999999, 11.972846101323913],
    [-8, 8],
    [-8, 5.345429103354391],
    [-8, 3.313708498984761],
    [-7.999999999999999, 1.5912989390372623],
    [-8, 0],
    [-7.999999999999999, -1.5912989390372623],
    [-8, -3.313708498984761],
    [-8, -5.345429103354391],
    [-8, -8],
    [-7.999999999999999, -11.972846101323913],
    [-8, -19.31370849898476],
    [-8, -40.21871593700678]
]
res = wf.ifft1d(arr)
console.log(res)
// => [
//    0,                  1,
//    2, 3.0000000000000018,
//    4,  5.000000000000002,
//    6,                  7,
//    8,                  9,
//   10, 10.999999999999998,
//   12, 12.999999999999998,
//   14,                 15
// ]

//node --experimental-modules g-fft1d.mjs