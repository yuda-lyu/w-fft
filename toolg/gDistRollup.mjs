import path from 'path'
import rollupFiles from 'w-package-tools/src/rollupFiles.mjs'


let fdSrc = './src'
let fdTar = './dist'

rollupFiles({ //rollupFiles預設會clean folder
    fns: 'WFft.mjs',
    fdSrc,
    fdTar,
    nameDistType: 'kebabCase',
    globals: {
    },
    external: [
    ],
})
