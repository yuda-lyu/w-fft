# w-fft
A tool for FFT.

![language](https://img.shields.io/badge/language-JavaScript-orange.svg) 
[![npm version](http://img.shields.io/npm/v/w-fft.svg?style=flat)](https://npmjs.org/package/w-fft) 
[![license](https://img.shields.io/npm/l/w-fft.svg?style=flat)](https://npmjs.org/package/w-fft) 
[![gzip file size](http://img.badgesize.io/yuda-lyu/w-fft/master/dist/w-fft.umd.js.svg?compression=gzip)](https://github.com/yuda-lyu/w-fft)
[![npm download](https://img.shields.io/npm/dt/w-fft.svg)](https://npmjs.org/package/w-fft) 
[![npm download](https://img.shields.io/npm/dm/w-fft.svg)](https://npmjs.org/package/w-fft) 
[![jsdelivr download](https://img.shields.io/jsdelivr/npm/hm/w-fft.svg)](https://www.jsdelivr.com/package/npm/w-fft)

## Documentation
To view documentation or get support, visit [docs](https://yuda-lyu.github.io/w-fft/global.html).

## Installation
### Using npm(ES6 module):
> **Note:** w-fft is mainly dependent on `ml-fft`, `lodash-es` and `wsemi`.
```alias
npm i w-fft
```

#### Example for FFT1D and iFFT1D:
> **Link:** [[dev source code](https://github.com/yuda-lyu/w-cluster/blob/master/g-fft1d.mjs)]
```alias

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

```

### In a browser(UMD module):
> **Note:** w-fft does not dependent on any package.

Add script for w-fft.
```alias
<script src="https://cdn.jsdelivr.net/npm/w-fft@1.0.2/dist/w-fft.umd.js"></script>

```
