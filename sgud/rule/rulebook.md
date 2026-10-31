# 規則帳本

本檔為套件設計與開發階段之規則帳本(藍圖),為要求程式碼須長成什麼樣,或由規格產出之測試(項目/說明/流程)有哪些,包含軸、單一擁有者、已知限制、破壞性變更紀錄,以及對應是哪些測試檔案或指令等,由agent自行編列、擴充與維護.當前已做到哪些記於`sgud/state/state.md`.過長時依類型拆為`rulebook_<類型>.md`,本檔只留索引.

## R-PARAM-01 輸入參數之檢測

**規格(單一來源)**:跨套件規格〈輸入參數之檢測機制〉(`C:\opensrcOper\dspec\輸入參數之檢測機制.md`,2026-10-31 改寫).本節只記本套件如何套用,判準以該規格為準,不重抄.適用其中已確定之部分:N2、範圍子型、B1、S3、A1、O1、K3～K6、K9、§5.1(同步數值計算 throw Error)、§6(訊息,不帶值).待確認之 Q1、Q2 與本套件無關(訊息一律不帶值).

**單一擁有者**:`src/_chkParam.mjs`(本套件內之小型輔助函數,集中於單一檔案;**wsemi 共用檢測函數發布後改用之**,屆時刪除本檔之等價實作並改 import).不得用 wsemi `cdbl`／`cint` 作判定(非數字回 0),不得用 `isnum`／`ispnum`／`isp0num`(收 `'0x10'`、`'Infinity'`,較規格寬).

### 規則

- **R-PARAM-01.1 入口先檢**:全部對外函數於入口、先於任何運算,依參數順序由左至右檢測(資料、`dt`、`hzStart`、`hzEnd`、opt 本身、opt 之鍵);`type`='dft' 與 'pow2' 兩路徑對同一輸入有一致之檢測與錯誤,不交 mathjs／ml-fft 原生處理.`spectrum*`／`filter*` 於資料檢測之後另檢最小長度,見 R-LEN-01.
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

- (已處理,2026-10-31)資料長度 1 之頻譜與週期:原列於此之退化結果(`spectrum*` 回空、`filter*` 回 0)改為入口拋錯,見 R-LEN-01.
- `hzStart` 大於 `hzEnd`:不報錯,無頻率通過,輸出全 0;規格未定跨參數關係.
- 輸出溢位:有限之大數輸入(如 1e308)使輸出為 `NaN`,不另檢查輸出.

### 破壞性變更紀錄

- 長度不足之 `spectrum*`／`filter*` 入口拋錯:見 R-LEN-01.
- 2026-10-31(本規則首次套用):全部對外函數入口檢測,詳 README〈Breaking changes〉:資料元素為 N2、非陣列／空陣列／非矩形／缺項補 0／截斷皆報錯、`dt`／`hzStart`／`hzEnd` 排除 `Infinity` 與 `'0x10'`、opt 非一般物件報錯、`opt.useOneTurn` 非布林報錯(原以真值判定)、`opt.type` 為 `null` 取預設(原報錯)、訊息改為不帶值之新格式(原 `invalid type[abc]`、`dt[x] is not a positive number`).

### 測試對應

- 測試檔:`test/unit-param.test.mjs`(規格 §8 V24 矩陣之翻譯:數字類 31 種無效輸入 × 8 個函數 × 兩路徑;K4 數字字串輸入之結果與數值相同;資料陣列結構與索引;opt 非物件／`null`／`{}`／各鍵錯種類／`null` 取預設／存取器拋錯／凍結之 opt;布林矩陣)、`test/pow2.test.mjs` 之 type 無效案(訊息不帶值).
- 全套:`npm test`;單檔:`node node_modules/mocha/bin/mocha.js --no-parallel test/unit-param.test.mjs --timeout 180000`.
- 品質:變異測試 44 個變異殺死 42,存活 2 皆為等價變異(見 `sgud/exp/experience.md`).

## R-LEN-01 輸入長度不足以產生有意義之頻譜或濾波結果時,入口即拋錯

**規則**:`spectrum1d`、`spectrum2d`、`filter1d`、`filter2d` 於入口、資料檢測(R-PARAM-01.2／.3)之後、`dt` 檢測之前,檢輸入長度;不足即同步 throw `Error`,與 R-PARAM-01 同通道、不回顯值.`fft1d`、`ifft1d`、`fft2d`、`ifft2d` 長度 1 為正確之 1 點 DFT(R-DFT-01),**不套本規則**.

**單一擁有者**:`src/_chkParam.mjs` 之 `chkMinLen`(1D)與 `chkMinShape`(2D,先列後行);各函數之最小長度數字寫在該函數入口之呼叫(`git grep` 可盤點),JSDoc 與測試鎖定同一數字.本規則為 FFT 特有(非通用種類檢測),wsemi 共用檢測函數發布後本檔兩函數仍保留.

| 函數 | 最小長度 | 訊息(逐字,不帶值) |
|---|---|---|
| `spectrum1d` | `arr` 4 點 | `invalid arr: must be an array with at least 4 elements` |
| `filter1d` | `arr` 2 點 | `invalid arr: must be an array with at least 2 elements` |
| `spectrum2d` | `mat` 4 列且 4 行 | `invalid mat: must be an array with at least 4 rows`;`invalid mat[0]: must be an array with at least 4 columns` |
| `filter2d` | `mat` 2 列且 2 行 | `invalid mat: must be an array with at least 2 rows`;`invalid mat[0]: must be an array with at least 2 columns` |

- **R-LEN-01.1 判定長度為輸入長度**:`dft` 與 `pow2` 一致,以呼叫端給之長度判定,不看 `pow2` 補零後點數(補零後之點數與頻率軸是補零之產物,不是資料之資訊量).
- **R-LEN-01.2 順序**:資料容器、結構與元素(空陣列、非矩形、無效元素)→ 長度(2D:先列後行)→ `dt` → `hzStart` → `hzEnd` → opt.元素無效者仍報 `invalid arr[i]: must be a valid number`,空陣列仍報 `invalid arr: must be a non-empty array`.
- **R-LEN-01.3 訊息**:`invalid <名稱>: must be an array with at least N elements|rows|columns`,依 R-PARAM-01.7 之 `must be <描述>` 寫法;2D 以名稱區分維度(列為 `mat`、行為 `mat[0]`)並於描述寫明 rows／columns.
- **R-LEN-01.4 失敗無副作用**:不改寫呼叫端資料.

**最小長度之依據(實測,`type:'dft'`;探測腳本輸出見 2026-10-31 修正報告)**:
- `spectrum`:輸出為正頻半部 `floor(n/2)` 點.n=1 回空;n=2、3 只有直流點(頻率軸無非直流點);n≥4 才含非直流頻率點.2D 各軸各自如此(任一軸不足 4 點,該軸頻率恆為 0;軸長 1 則為空).故 `spectrum1d` 為 4、`spectrum2d` 各軸 4.
- `filter`:全部 n 個 bin 皆參與遮罩,帶通須能區分直流與非直流 bin.n=1:`useOneTurn:true` 週期 `(n-1)*dt` 為 0、頻率 `0*Infinity` 為 `NaN`、輸出恆 0(2D 為任一軸長 1 即全 0,另一軸再長亦然);`useOneTurn:false` 只有直流 bin,頻帶無從界定(2D 退化為 1D).n=2 起有非直流 bin,`filter1d([3,5],1,0,0.01)` 為 `[4,4]`、`filter1d([3,5],1,0.01,1e6)` 為 `[-1,1]`.故 `filter1d` 為 2、`filter2d` 各軸 2.
- `pow2` 補零至 4 點,故修前長度 1～3 於 `pow2` 有輸出(補零之產物);仍依 R-LEN-01.1 以輸入長度拒收.

**已知不處理 / 可調整處**:
- 最小長度為依演算法與「頻率軸至少 1 個非直流點」之判準所定(原則 3 歧義收嚴);若改採「輸出非空」判準,`spectrum1d` 降為 2、`spectrum2d` 各軸降為 2,只需改入口之數字與 JSDoc、測試之 `min`.
- `spectrum` 之奇數 n 因取 `floor(n/2)` 而不含第 `(n-1)/2` 個正頻 bin(如 n=3 不含 bin 1、n=5 不含 bin 2):既有行為,frozen 輸出測試(101 點)鎖定,不在本規則範圍.
- `spectrum2d` 之 2×N、3×N 等長度 2、3 之軸亦拒收(各軸 4);若認為只需「輸出含非直流點」(2×4 即有),另案裁示.

- 盤點指令(於套件根):`git grep --untracked -n -E "chkMinLen\(|chkMinShape\(" -- "src/*.mjs"`;期望 `_chkParam.mjs` 之 2 個定義與 `spectrum1d`／`filter1d`(`chkMinLen`)、`spectrum2d`／`filter2d`(`chkMinShape`)各 1 個呼叫.
- 站點全集(8 個對外函數):已套＝`spectrum1d`、`spectrum2d`、`filter1d`、`filter2d`;刻意不套＝`fft1d`、`ifft1d`、`fft2d`、`ifft2d`(長度 1 為正確之 1 點 DFT).
- 測試:`test/unit-minlen.test.mjs`(82 案:各函數長度不足之各形態〔1D 長度 1..min-1、2D 形狀 1..5×1..5〕× `dft`/`pow2` × `useOneTurn` 真偽與未給 opt、恰為最小長度不拋與其值依 DFT 定義、順序、`fft` 家族長度 1 不拒收);單檔:`node node_modules/mocha/bin/mocha.js --no-parallel test/unit-minlen.test.mjs --timeout 180000`;全套 `npm test`.輔助:`test/tools/expectInvalid.mjs`(同步 throw 且訊息全文相符,`unit-param` 與 `unit-minlen` 共用).
- 品質:變異測試 31 個全殺(還原修正之 M01～M04 只有 `unit-minlen` 抓得到;過嚴之 M30、M31〔`fft1d`/`fft2d` 加最小長度〕被 `unit-minlen` 與 `unit-len1` 抓到).
- 破壞性變更(2026-10-31):長度不足者由回傳退化結果改為拋錯,詳 README〈Breaking changes〉.原 `unit-len1` 中對長度 1 之 `filter`／`spectrum` 斷言(全通帶回原值、頻譜欄位有限)隨規則廢止,改由 `unit-minlen` 斷言拋錯;`unit-param` 之 `spectrum2d` 基準資料由 2×4 改為 4×4(`2dq` 形狀).

## R-DFT-01 `type:'dft'` 核心讀出 mathjs `fft` 結果須經 `complex()`

**規則**:`_fft1dDft`／`_fft2dDft` 之正向(`norm`)讀出 mathjs `fft` 結果時,每個元素先以 `complex()` 轉為 Complex 再取 `.re`／`.im`.

**why**:mathjs 之 `fft` 對長度 1 之軸直接回傳原元素(其 `_fft` 於 `len === 1` 回 `[arr[0]]`,為 number 而非 Complex),`out[i].re` 為 `undefined`;1D 之長度 1 與 2D 之 1×1(兩軸皆長度 1)必踩,其餘形狀因至少一軸之運算產生 Complex 而無事.本規則使 `fft1d([x])` 為 `[[x,0]]`、`fft2d([[x]])` 為 `[[[x,0]]]`,與 `pow2` 之直流 bin 一致.反向(`inv`)讀出之輸入皆以 `complex(re,im)` 建構,mathjs 回傳 Complex,不需轉換(以測試鎖定長度 1).

- 盤點指令(於套件根):`git grep --untracked -n -E "\.(re|im)\b" -- src/_fft1dDft.mjs src/_fft2dDft.mjs`
- 站點全集(4 處):`_fft1dDft` 正向(已套:`complex(out[i])`)、`_fft1dDft` 反向(刻意不套:輸入為 Complex)、`_fft2dDft` 正向(已套:`complex(out[i][j])`)、`_fft2dDft` 反向(刻意不套:輸入為 Complex).
- 一致性關係(`dft` 與 `pow2` 對長度 1、2):`pow2` 補零至 N 點(最少 4 點),n 整除 N 時 `pow2` 之 bin `k*N/n` 等於 `dft` 之 bin k(1D;2D 兩軸各自);`ifft` 之輸出總和等於頻譜直流分量之實部(兩路徑皆然);`ifft(fft(x))` 之前 n 點為 x(`pow2` 其後為補零之 0);全通帶(`useOneTurn:false`、`hzStart:0`、大 `hzEnd`)之 `filter` 輸出等於輸入(`pow2` 左上 n 點為輸入、其餘為 0;`filter` 長度 1 依 R-LEN-01 已改為入口拋錯,本關係只適用長度 2 以上).
- 測試:`test/unit-len1.test.mjs`(41 案,原 45 案中 4 案隨 R-LEN-01 改為由 `unit-minlen` 斷言拋錯;含樸素 DFT 預言對 1D n=1..9、2D 1..5×1..5 全形狀);單檔:`node node_modules/mocha/bin/mocha.js --no-parallel test/unit-len1.test.mjs --timeout 180000`;全套 `npm test`.
- 品質:變異測試 14 個變異殺死 14,其中還原本規則之 4 個(M01～M04)只有 `unit-len1` 抓得到(舊測試不抓).
- 破壞性變更(2026-10-31):`type:'dft'` 長度 1 之 `fft1d`／`fft2d` 由 `[[undefined,undefined]]` 改為 `[[x,0]]`;`useOneTurn:false` 之 `filter1d`／`filter2d` 對長度 1 由回 0 改為回原值(1.0.34;其後 R-LEN-01 將長度 1 之 `filter`／`spectrum` 改為入口拋錯);詳 README〈Breaking changes〉.
