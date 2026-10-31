# w-fft
A tool for FFT.

![language](https://img.shields.io/badge/language-JavaScript-orange.svg) 
[![npm version](http://img.shields.io/npm/v/w-fft.svg?style=flat)](https://npmjs.org/package/w-fft) 
[![license](https://img.shields.io/npm/l/w-fft.svg?style=flat)](https://npmjs.org/package/w-fft) 
[![npm download](https://img.shields.io/npm/dt/w-fft.svg)](https://npmjs.org/package/w-fft) 
[![npm download](https://img.shields.io/npm/dm/w-fft.svg)](https://npmjs.org/package/w-fft) 
[![jsdelivr download](https://img.shields.io/jsdelivr/npm/hm/w-fft.svg)](https://www.jsdelivr.com/package/npm/w-fft)

## Documentation
To view documentation or get support, visit [docs](https://yuda-lyu.github.io/w-fft/global.html).

## Example
To view some examples for more understanding, visit examples:
> **spectrum1d:** [ex-spectrum1d.html](https://yuda-lyu.github.io/w-fft/examples/ex-spectrum1d.html) [[source code](https://github.com/yuda-lyu/w-fft/blob/master/docs/examples/ex-spectrum1d.html)]

## Breaking changes

### Too-short input to `spectrum1d`, `spectrum2d`, `filter1d` and `filter2d` (next release)
An input too short to give a meaningful spectrum or filter result now throws a synchronous `Error` at the entry, identically for `type: 'dft'` and `type: 'pow2'` and for both values of `opt.useOneTurn`. Before, such inputs returned degenerate results (an empty array, a spectrum with only the DC point, an all-zero output) without any error. The length checked is the length of the input, not the zero-padded length of `type: 'pow2'`. The message never contains the input value.

| Function | Minimum length | Message |
|---|---|---|
| `spectrum1d(arr, ...)` | `arr`: 4 | `invalid arr: must be an array with at least 4 elements` |
| `filter1d(arr, ...)` | `arr`: 2 | `invalid arr: must be an array with at least 2 elements` |
| `spectrum2d(mat, ...)` | `mat`: 4 rows and 4 columns | `invalid mat: must be an array with at least 4 rows`, `invalid mat[0]: must be an array with at least 4 columns` |
| `filter2d(mat, ...)` | `mat`: 2 rows and 2 columns | `invalid mat: must be an array with at least 2 rows`, `invalid mat[0]: must be an array with at least 2 columns` |

- **Why 4 for the spectrum**: the spectrum is the positive-frequency half, `floor(n/2)` points. Length 1 returned `[]` (in 2D, an empty array or rows of empty arrays such as `[[], []]` for a 5×1 matrix) and lengths 2 and 3 returned only the DC point, so at least 4 points are needed to get one non-DC frequency. In 2D each axis needs them: with fewer, the frequency of that axis is always 0.
- **Why 2 for the filter**: the pass band separates the DC bin from the other bins, so there must be a non-DC bin. With `useOneTurn: true` (the default) a length-1 axis has the period `(n-1)*dt` = 0, its frequencies are `NaN`, and the output was all 0 (in 2D this happened whenever either axis had length 1, even if the other axis was long). With `useOneTurn: false` a length-1 axis has only the DC bin, so no band can be defined (a 1×N or N×1 matrix was just a 1D filter in disguise: call `filter1d` for a single row or column).
- **Order of checks**: the data content (container, structure, elements) comes first, then the length (2D: rows before columns), then `dt`, `hzStart`, `hzEnd` and `opt`; so an invalid element is still reported as `invalid arr[3]: must be a valid number`, and an empty array as `invalid arr: must be a non-empty array`.
- **Not changed**: `fft1d`, `ifft1d`, `fft2d` and `ifft2d` accept length 1 (the true 1-point DFT).

### Length-1 input with `type: 'dft'` (1.0.34)
`fft1d([5])` and `fft2d([[5]])` with `type: 'dft'` (the default) used to return `[[undefined, undefined]]` and `[[[undefined, undefined]]]` (shown as `null` in JSON): mathjs `fft` hands back the single element as a plain number instead of a complex object, and the `.re`/`.im` of a number are `undefined`. They now return the true 1-point DFT, `[[5, 0]]` and `[[[5, 0]]]`; `type: 'pow2'` was already correct (zero-padded to 4 points, every bin equals 5). Knock-on: `filter1d` and `filter2d` with `useOneTurn: false` on a length-1 input used to return `0` and now return the input (`filter1d([5], 1, 0, 1, { useOneTurn: false })` is `[5]`). `ifft1d`/`ifft2d` were already correct for length 1. In 1.0.34, unchanged for `type: 'dft'` (these inputs throw in the next release, see above): `spectrum1d`/`spectrum2d` return no spectrum points for a length-1 input (an empty array; in 2D, when either axis has length 1, an empty array or rows of empty arrays such as `[[], []]` for a 5×1 matrix), because the positive-frequency half has `floor(n/2) = 0` points; and with `useOneTurn: true` (the default) `filter1d`/`filter2d` return 0 for a length-1 input, because its period `(n-1)*dt` is 0.

### Input validation (1.0.34)
Every public function (`fft1d`, `ifft1d`, `fft2d`, `ifft2d`, `spectrum1d`, `spectrum2d`, `filter1d`, `filter2d`) now validates all inputs at the entry, identically for `type: 'dft'` and `type: 'pow2'`. Invalid input throws a synchronous `Error` with the message `invalid <name>: must be <description>`; the message never contains the input value. Inputs that were silently accepted, coerced or replaced by defaults before now throw:

- **Data elements must be valid numbers**: a finite number or a numeric string (decimal notation such as `'12'`, `' 12 '`, `'1.2e-5'`), converted to a number before computing. `'-'`, `'NP'`, `''`, `null`, `undefined`, booleans, `NaN`, `±Infinity`, `'Infinity'`, `'0x10'`, BigInt, objects and arrays throw `invalid arr[3]: must be a valid number` (2D: `invalid mat[1][2]: must be a valid number`); none of them is treated as 0 or 1. Before, `type: 'pow2'` concatenated numeric strings (`fft1d([1, '2', 3, 4], { type: 'pow2' })` had DC component 28 instead of 10) and treated `''`, `null` as 0 and `true` as 1, `type: 'dft'` leaked mathjs errors such as `Cannot convert "-" to Complex`, and `NaN` or `Infinity` turned the whole output into `NaN`.
- **Data containers**: `arr` and `mat` must be non-empty arrays (empty arrays, non-arrays, array-like objects and typed arrays such as `Float64Array` throw `invalid arr: must be a non-empty array`). A matrix must be rectangular: every row an array as long as row 0 (before, shorter rows were padded with 0 and longer rows truncated). For `ifft1d` and `ifft2d` every element must be a `[re, im]` pair of valid numbers (before, a missing `im` or a plain number was read as 0, so `ifft1d([1, 2, 3, 4])` returned zeros).
- **`dt`, `hzStart`, `hzEnd`**: valid numbers (numeric strings are converted); `dt` must be positive, `hzStart` and `hzEnd` non-negative. `Infinity`, `'Infinity'` and `'0x10'` are no longer accepted (give a large finite `hzEnd`, such as `1e9`, to pass all high frequencies). Messages changed from `dt[x] is not a positive number` to `invalid dt: must be a positive number`.
- **`opt`**: must be a plain object, `undefined` or `null`; other values (numbers, strings, arrays, functions...) used to be ignored and now throw `invalid opt: must be an object`. Keys that are `undefined` or `null` take their defaults; keys that are given but invalid throw instead of silently falling back to the default.
- **`opt.useOneTurn`** (`spectrum1d`, `spectrum2d`, `filter1d`, `filter2d`) must be `true` or `false`. Before, any truthy value was read as `true` (`'n'`, `'false'`, `1`...). **`opt.type`** must be `'dft'` or `'pow2'` (`null` now selects the default; before it threw); the message changed from `invalid type[abc]` to `invalid opt.type: must be one of 'dft', 'pow2'`.

## Installation

### Using npm(ES6 module):
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
//   [ -8.000000000000002, 11.972846101323912 ],
//   [ -8, 8 ],
//   [ -7.999999999999999, 5.345429103354391 ],
//   [ -8, 3.3137084989847594 ],
//   [ -8.000000000000002, 1.5912989390372623 ],
//   [ -8, 0 ],
//   [ -8, -1.5912989390372623 ],
//   [ -7.999999999999999, -3.3137084989847594 ],
//   [ -7.999999999999998, -5.345429103354393 ],
//   [ -7.999999999999999, -8 ],
//   [ -7.999999999999999, -11.97284610132391 ],
//   [ -7.999999999999997, -19.31370849898476 ],
//   [ -7.999999999999993, -40.21871593700678 ]
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
//                    0,                  1,
//   2.0000000000000004, 3.0000000000000013,
//                    4,  5.000000000000002,
//                    6,  7.000000000000001,
//                    8,                  9,
//                   10, 10.999999999999998,
//                   12, 12.999999999999998,
//                   14,                 15
// ]

```

### In a browser(UMD module):

Add script for w-fft.
```alias
<script src="https://cdn.jsdelivr.net/npm/w-fft@1.0.35/dist/w-fft.umd.js"></script>

```
