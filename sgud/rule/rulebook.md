# 規則帳本

本檔為套件設計與開發階段之規則帳本(藍圖),為要求程式碼須長成什麼樣,或由規格產出之測試(項目/說明/流程)有哪些,包含軸、單一擁有者、已知限制、破壞性變更紀錄,以及對應是哪些測試檔案或指令等,由agent自行編列、擴充與維護.當前已做到哪些記於`sgud/state/state.md`.過長時依類型拆為`rulebook_<類型>.md`,本檔只留索引.

## R-PARAM-01 輸入參數之檢測

**規格(單一來源)**:跨套件規格〈輸入參數之檢測機制〉(`C:\opensrcOper\dspec\輸入參數之檢測機制.md`,2026-10-31 改寫).本節只記本套件如何套用,判準以該規格為準,不重抄.適用其中已確定之部分:N2、範圍子型、B1、S3、A1、O1、K3～K6、K9、§5.1(同步數值計算 throw Error)、§6(訊息,不帶值).待確認之 Q1、Q2 與本套件無關(訊息一律不帶值).

**單一擁有者**:`src/_chkParam.mjs`(本套件內之小型輔助函數,集中於單一檔案;**wsemi 共用檢測函數發布後改用之**,屆時刪除本檔之等價實作並改 import).不得用 wsemi `cdbl`／`cint` 作判定(非數字回 0),不得用 `isnum`／`ispnum`／`isp0num`(收 `'0x10'`、`'Infinity'`,較規格寬).

### 規則

- **R-PARAM-01.1 入口先檢**:全部對外函數於入口、先於任何運算,依參數順序由左至右檢測(資料、`dt`、`hzStart`、`hzEnd`、opt 本身、opt 之鍵);`type`='dft' 與 'pow2' 兩路徑對同一輸入有一致之檢測與錯誤,不交 mathjs／ml-fft 原生處理.
- **R-PARAM-01.2 資料陣列(A1,元素 N2)**:`Array.isArray` 且非空;各元素為有限 number 或數字字串(去頭尾空白後須為十進位寫法,可帶正負號、小數點、科學記號;不收 `'0x10'`、`'1,234'`、全形、`'Infinity'`、`'NaN'`);標記字串(`'-'`、`'NP'`、`''`)、`null`、`undefined`、布林、`NaN`、`±Infinity`、BigInt、物件、包裝物件皆無效,不視為 0 或 1(K5);任一元素無效整體 throw,訊息帶索引.類陣列物件與 TypedArray 非陣列(A1),無效.
- **R-PARAM-01.3 二維**:`mat` 須為非空**矩形**陣列(各列為陣列且長度等於第 0 列,不補 0、不截斷);訊息帶兩層索引.`ifft1d`／`ifft2d` 之元素為 `[re,im]` 長度 2 之陣列,兩者皆 N2,缺項不補 0.
- **R-PARAM-01.4 K4 檢測之值即使用之值**:數字字串轉換後才進入運算(轉換結果寫入新陣列,不改寫呼叫端資料);`_fft1d`／`_fft2d` 以下之核心只收已轉換之數字.`filter1d`／`filter2d` 內部之 fft→ifft 以內部核心銜接,不對自產之中間值再檢.
- **R-PARAM-01.5 純量(N2 範圍子型)**:`dt` 為正數;`hzStart`、`hzEnd` 為非負數;一律排除 `Infinity`;數字字串轉換後才使用.
- **R-PARAM-01.6 opt**:`undefined`／`null` 視為未給;其他非一般物件(陣列、函數、`Date`、`Map`、類別實例、原始值)throw `invalid opt: must be an object`;鍵為 `undefined`／`null` 取預設,**給了而無效即 throw,不靜默改用預設**(K3);未宣告之鍵忽略(V7);不改寫呼叫端之 opt(V9);存取器拋錯視為無效(V11).`opt.useOneTurn` 為 B1(只收 true／false,預設 true);`opt.type` 為 S3 列舉('dft'、'pow2',預設 'dft').
- **R-PARAM-01.7 訊息**:`invalid <名稱>: must be <種類描述>`,英文固定詞彙,不帶輸入值(K9);種類描述:`a valid number`、`a positive number`、`a non-negative number`、`a non-empty array`、`an array of 2 elements`、`an array with the same length as mat[0]`、`a boolean`、`one of 'dft', 'pow2'`、opt 為 `an object`.失敗通道:同步 throw Error(§5.1).
- **R-PARAM-01.8 JSDoc**:每個參數與 opt 鍵以文字寫明種類名稱與處置(§8 V23),`{型別}` 欄只作說明.

### 種類對照(函數 × 參數 × 種類)

| 函數 | 參數 | 種類 | 無效時 |
|---|---|---|---|
| `fft1d` | `arr` | A1 資料陣列(元素 N2) | `invalid arr[i]: must be a valid number`／`invalid arr: must be a non-empty array` |
| `fft1d` | `opt`、`opt.type` | O1、S3 | `invalid opt: must be an object`／`invalid opt.type: must be one of 'dft', 'pow2'` |
| `ifft1d` | `arr` | A1(元素為 `[re,im]` 之 N2 對) | `invalid arr[i]: must be an array of 2 elements`／`invalid arr[i][k]: must be a valid number` |
| `ifft1d` | `opt`、`opt.type` | 同 `fft1d` | 同上 |
| `fft2d` | `mat` | A1 之 A1(矩形,元素 N2) | `invalid mat[i][j]: must be a valid number`／`invalid mat[i]: must be an array with the same length as mat[0]`／`invalid mat[0]: must be a non-empty array` |
| `fft2d` | `opt`、`opt.type` | 同 `fft1d` | 同上 |
| `ifft2d` | `mat` | A1 之 A1(矩形,元素 `[re,im]` 之 N2 對) | `invalid mat[i][j]: must be an array of 2 elements`／`invalid mat[i][j][k]: must be a valid number` 及上列矩形訊息 |
| `ifft2d` | `opt`、`opt.type` | 同 `fft1d` | 同上 |
| `spectrum1d` | `arr`;`dt`;`opt.useOneTurn`;`opt.type` | A1(N2);N2 正數;B1;S3 | 同上;`invalid dt: must be a positive number`;`invalid opt.useOneTurn: must be a boolean` |
| `spectrum2d` | `mat`;`dt`;`opt.useOneTurn`;`opt.type` | A1 之 A1(N2);N2 正數;B1;S3 | 同上 |
| `filter1d` | `arr`;`dt`;`hzStart`、`hzEnd`;`opt.useOneTurn`;`opt.type` | A1(N2);N2 正數;N2 非負數;B1;S3 | 同上;`invalid hzStart: must be a non-negative number`、`invalid hzEnd: must be a non-negative number` |
| `filter2d` | `mat`;`dt`;`hzStart`、`hzEnd`;`opt.useOneTurn`;`opt.type` | A1 之 A1(N2);N2 正數;N2 非負數;B1;S3 | 同上 |

### 盤點指令與站點全集(可重跑,於套件根;`--untracked` 為使新檔亦被搜尋)

- 站點全集(對外函數,應為 8 行):`git grep --untracked -n -E "^    (fft|ifft|spectrum|filter)[12]d,$" -- src/WFft.mjs`
- 已套(各入口檢測呼叫,每檔 import 一行加呼叫):`git grep --untracked -c -E "chkArr\(|chkArrCplx\(|chkMat\(|chkMatCplx\(|chkNum\(|chkOpt\(|optType\(|optUseOneTurn\(" -- "src/*.mjs"`;期望 8 個入口檔皆有命中(`fft1d`、`ifft1d`、`fft2d`、`ifft2d`、`spectrum1d`、`spectrum2d`、`filter1d`、`filter2d`).
- 殘留舊式(應為 0 筆):`git grep --untracked -n -E "get\(opt|from 'wsemi|ispnum|isp0num|cdbl" -- src`
- 判準:已套＝8 個入口於入口以 `_chkParam.mjs` 宣告種類並以其回傳值運算;刻意不套＝非匯出之內部核心(`_fft1d`、`_fft2d`、`_fft1dDft`、`_fft1dPow2`、`_fft2dDft`、`_fft2dPow2`、`get2n`,只收已檢測轉換之數字)與 `WFft.mjs` 之物件匯出;未套＝無.

### 已知不處理(本輪範圍外,現況保留)

- 資料長度與 `useOneTurn` 之組合:`dft` 且長度 1 且 `useOneTurn:true` 時週期為 0,`spectrum1d`／`spectrum2d` 回空陣列(未報錯);非種類檢測,規格未定.
- `hzStart` 大於 `hzEnd`:不報錯,無頻率通過,輸出全 0;規格未定跨參數關係.
- 輸出溢位:有限之大數輸入(如 1e308)使輸出為 `NaN`,不另檢查輸出.
- `type:'dft'` 且長度 1(`fft1d([5])`、`fft2d([[5]])`)回 `NaN`(mathjs 15.2.0 之 `fft` 對長度 1 之結果,本輪實測;`type:'pow2'` 補零至 4 點後正確):範圍外缺陷,另案.

### 破壞性變更紀錄

- 2026-10-31(本規則首次套用):全部對外函數入口檢測,詳 README〈Breaking changes〉:資料元素為 N2、非陣列／空陣列／非矩形／缺項補 0／截斷皆報錯、`dt`／`hzStart`／`hzEnd` 排除 `Infinity` 與 `'0x10'`、opt 非一般物件報錯、`opt.useOneTurn` 非布林報錯(原以真值判定)、`opt.type` 為 `null` 取預設(原報錯)、訊息改為不帶值之新格式(原 `invalid type[abc]`、`dt[x] is not a positive number`).

### 測試對應

- 測試檔:`test/unit-param.test.mjs`(規格 §8 V24 矩陣之翻譯:數字類 31 種無效輸入 × 8 個函數 × 兩路徑;K4 數字字串輸入之結果與數值相同;資料陣列結構與索引;opt 非物件／`null`／`{}`／各鍵錯種類／`null` 取預設／存取器拋錯／凍結之 opt;布林矩陣)、`test/pow2.test.mjs` 之 type 無效案(訊息不帶值).
- 全套:`npm test`;單檔:`node node_modules/mocha/bin/mocha.js --no-parallel test/unit-param.test.mjs --timeout 180000`.
- 品質:變異測試 44 個變異殺死 42,存活 2 皆為等價變異(見 `sgud/exp/experience.md`).
