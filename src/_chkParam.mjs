//輸入參數之檢測(本套件內之小型輔助函數, 集中於本檔; 規格為跨套件之[輸入參數之檢測機制])
//種類: N2有效數字(含正數與非負數範圍子型), B1布林, S3列舉字串, A1資料陣列(元素為N2或[re,im]之N2對), O1一般物件(opt)
//wsemi共用檢測函數發布後改用之, 見sgud/rule/rulebook.md R-PARAM-01
//訊息格式: `invalid <名稱>: must be <種類描述>`, 英文固定詞彙, 不帶輸入值; 檢測失敗一律同步throw Error


//數字字串之格式: 先去頭尾空白, 再須為十進位寫法(可帶正負號,小數點,科學記號)
//不收十六進位,二進位,八進位,千分位,全形數字,'Infinity','NaN',空字串與純空白
let reNumStr = /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/


//N2有效數字之判定與轉換, 回傳{ ok, v }(v為轉換後之數值)
//有效輸入: 有限number, 數字字串(轉換後須為有限數); 其餘(含null,undefined,布林,NaN,Infinity,BigInt,物件,陣列,包裝物件,標記字串'-','NP','')皆無效
//不拋錯, 只以typeof判型, 不呼叫輸入值之方法
function parseN2(v) {
    if (typeof v === 'number') {
        return { ok: Number.isFinite(v), v }
    }
    if (typeof v === 'string') {
        let s = v.trim()
        if (reNumStr.test(s)) {
            let n = Number(s)
            if (Number.isFinite(n)) {
                return { ok: true, v: n }
            }
        }
    }
    return { ok: false, v: 0 }
}


//種類描述
function descN2(range) {
    if (range === 'positive') {
        return 'a positive number'
    }
    if (range === 'nonneg') {
        return 'a non-negative number'
    }
    return 'a valid number'
}


//純量之N2檢測, range為undefined(有效數字),'positive'(正數)或'nonneg'(非負數), 回傳轉換後之數值
function chkNum(v, name, range) {
    let r = parseN2(v)
    let b = r.ok
    if (b && range === 'positive') {
        b = r.v > 0
    }
    if (b && range === 'nonneg') {
        b = r.v >= 0
    }
    if (!b) {
        throw new Error(`invalid ${name}: must be ${descN2(range)}`)
    }
    return r.v
}


//資料陣列之單一元素, 須為N2
function chkElem(v, name) {
    let r = parseN2(v)
    if (!r.ok) {
        throw new Error(`invalid ${name}: must be a valid number`)
    }
    return r.v
}


//資料陣列之複數元素, 須為長度2之陣列[re,im], 且兩者皆為N2(不補0)
function chkPair(v, name) {
    if (!Array.isArray(v) || v.length !== 2) {
        throw new Error(`invalid ${name}: must be an array of 2 elements`)
    }
    return [chkElem(v[0], `${name}[0]`), chkElem(v[1], `${name}[1]`)]
}


//1D資料陣列(A1), 元素為N2; 空陣列與非陣列(含類陣列物件,TypedArray)無效; 任一元素無效即throw, 訊息帶索引; 回傳轉換後之新陣列
function chkArr(arr, name) {
    if (!Array.isArray(arr) || arr.length === 0) {
        throw new Error(`invalid ${name}: must be a non-empty array`)
    }
    let rs = new Array(arr.length)
    for (let i = 0; i < arr.length; i++) {
        rs[i] = chkElem(arr[i], `${name}[${i}]`)
    }
    return rs
}


//1D複數資料陣列(A1), 元素為[re,im]; 規則同chkArr, 訊息帶索引(如arr[3]或arr[3][1])
function chkArrCplx(arr, name) {
    if (!Array.isArray(arr) || arr.length === 0) {
        throw new Error(`invalid ${name}: must be a non-empty array`)
    }
    let rs = new Array(arr.length)
    for (let i = 0; i < arr.length; i++) {
        rs[i] = chkPair(arr[i], `${name}[${i}]`)
    }
    return rs
}


//2D矩陣(A1之A1), fn為單一元素之檢測; 須為矩形(各列為陣列且長度皆等於第0列, 不補0亦不截斷), 第0列不可為空; 訊息帶兩層索引
function chkMatBy(mat, name, fn) {
    if (!Array.isArray(mat) || mat.length === 0) {
        throw new Error(`invalid ${name}: must be a non-empty array`)
    }
    let m = mat.length
    let n = 0
    let rs = new Array(m)
    for (let i = 0; i < m; i++) {
        let row = mat[i]
        if (i === 0) {
            if (!Array.isArray(row) || row.length === 0) {
                throw new Error(`invalid ${name}[0]: must be a non-empty array`)
            }
            n = row.length
        }
        else if (!Array.isArray(row) || row.length !== n) {
            throw new Error(`invalid ${name}[${i}]: must be an array with the same length as ${name}[0]`)
        }
        let r = new Array(n)
        for (let j = 0; j < n; j++) {
            r[j] = fn(row[j], `${name}[${i}][${j}]`)
        }
        rs[i] = r
    }
    return rs
}


//2D實數矩陣, 元素為N2
function chkMat(mat, name) {
    return chkMatBy(mat, name, chkElem)
}


//2D複數矩陣, 元素為[re,im]
function chkMatCplx(mat, name) {
    return chkMatBy(mat, name, chkPair)
}


//1D資料陣列之最小長度, 於chkArr之後呼叫(資料結構與元素先於長度); 長度不足以產生有意義之頻譜或濾波結果, 入口即throw, 訊息不帶值
//最小長度依各函數演算法而定(見sgud/rule/rulebook.md R-LEN-01), 由呼叫端傳入
function chkMinLen(vs, name, min) {
    if (vs.length < min) {
        throw new Error(`invalid ${name}: must be an array with at least ${min} elements`)
    }
}


//2D資料矩陣之各軸最小長度, 於chkMat之後呼叫(vs為矩形, 第0列非空); 先列後行, 訊息寫明哪一維(列為name, 行為name[0]), 不帶值
function chkMinShape(vs, name, minRows, minCols) {
    if (vs.length < minRows) {
        throw new Error(`invalid ${name}: must be an array with at least ${minRows} rows`)
    }
    if (vs[0].length < minCols) {
        throw new Error(`invalid ${name}[0]: must be an array with at least ${minCols} columns`)
    }
}


//O1一般物件, 原型為Object.prototype或null(跨realm者以原型之原型為null判定); 陣列,Date,Map,類別實例,函數,null皆非
function isObj(o) {
    try {
        if (typeof o !== 'object' || o === null) {
            return false
        }
        if (Object.prototype.toString.call(o) !== '[object Object]') {
            return false
        }
        let p = Object.getPrototypeOf(o)
        return p === null || Object.getPrototypeOf(p) === null
    }
    catch (err) {
        return false
    }
}


//opt本身, undefined與null視為未給(回傳空物件), 其他非一般物件throw; 不改寫呼叫端之opt
function chkOpt(opt) {
    if (opt === undefined || opt === null) {
        return {}
    }
    if (!isObj(opt)) {
        throw new Error('invalid opt: must be an object')
    }
    return opt
}


//讀取opt之鍵一次, 存取器拋錯即視為無效
function readOpt(opt, key) {
    try {
        return { ok: true, v: opt[key] }
    }
    catch (err) {
        return { ok: false, v: undefined }
    }
}


//opt.type, S3列舉字串'dft'或'pow2', undefined與null取預設'dft', 給了而不在列舉內throw(不靜默改用預設)
function optType(opt) {
    let r = readOpt(opt, 'type')
    if (r.ok && (r.v === undefined || r.v === null)) {
        return 'dft'
    }
    if (!r.ok || (r.v !== 'dft' && r.v !== 'pow2')) {
        throw new Error(`invalid opt.type: must be one of 'dft', 'pow2'`)
    }
    return r.v
}


//opt.useOneTurn, B1布林, undefined與null取預設true, 給了而非true/false(含'true','n',1,0)throw
function optUseOneTurn(opt) {
    let r = readOpt(opt, 'useOneTurn')
    if (r.ok && (r.v === undefined || r.v === null)) {
        return true
    }
    if (!r.ok || typeof r.v !== 'boolean') {
        throw new Error('invalid opt.useOneTurn: must be a boolean')
    }
    return r.v
}


export { parseN2, chkNum, chkArr, chkArrCplx, chkMat, chkMatCplx, chkMinLen, chkMinShape, chkOpt, optType, optUseOneTurn }
