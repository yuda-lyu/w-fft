import path from 'path'
import rollupFiles from 'w-package-tools/src/rollupFiles.mjs'


let fdSrc = './src'
let fdTar = './dist'

async function core() {

    await rollupFiles({ //rollupFiles預設會clean folder
        fns: 'WFft.mjs',
        fdSrc,
        fdTar,
        nameDistType: 'kebabCase',
        globals: {
        },
        external: [
        ],
    })
        .catch((err) => {
            console.log(err)
        })

}
core()
    .catch((err) => {
        console.log(err)
    })
