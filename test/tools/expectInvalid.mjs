import assert from 'assert'


//斷言同步throw Error且訊息全文相符(訊息為固定詞彙, 全文相符即不帶輸入值, 亦非mathjs等內部錯誤)
function expectInvalid(fn, msg) {
    assert.throws(fn, (err) => {
        assert.strict.ok(err instanceof Error)
        assert.strict.deepStrictEqual(err.message, msg)
        return true
    })
}


export default expectInvalid
