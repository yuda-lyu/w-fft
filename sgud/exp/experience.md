# 累積經驗

本檔為執行工作時特有之累積經驗,留給後續之嘗試、執行與判斷,由agent自行編列、擴充與維護.過長時抽出舊者為`experience_<年月日>.md`,並於本檔註明何時抽出.

## 輸入參數檢測(2026-10-31,R-PARAM-01)

- **lodash `get(arr, i, 0)` 會靜默掩蓋缺值與無效值**:預設值只在結果為 `undefined` 時生效,`get(1, '0', 0)` 為 0,故 `ifft1d([1,2,3,4])`(元素非 `[re,im]`)舊版回全 0 而不報錯;`get(opt, 'type', 'dft')` 對非物件之 opt 亦靜默回預設.檢測改於入口以顯式迴圈逐元素進行,不再用 `get` 取資料.
- **兩條路徑對同一壞輸入之行為完全不同**:`pow2`(ml-fft)直接對原值做 `+`,`'2'` 與數字串接成字串(直流分量 28 而非 10),`''`／`null` 當 0、`true` 當 1、`'0x10'` 當 16;`dft`(mathjs)拋 `Cannot convert "-" to Complex` 等原生錯誤,且把 `undefined` 當 0.故入口須先檢並轉換,核心只收已轉換之 number.
- **mathjs 15.2.0 之 `fft` 對長度 1 之結果(已於 R-DFT-01 修正,見下節)**:先前誤記為 `NaN`,實為 `[[undefined, undefined]]`(JSON 顯示 `null`).
- **內部串接不對自產中間值再檢**:`filter1d`／`filter2d` 之 fft→遮罩→ifft 以內部 `_fft1d`／`_fft2d` 銜接;若改用公開之 `ifft1d`,輸出溢位成 `Infinity`/`NaN` 時會以 `invalid arr[...]` 誤指呼叫端之 `arr`.
- **本輪新增之 `type` 保護網與入口檢測重複**:`_fft1d`／`_fft2d` 保留 mode／type 之防呼叫端誤用,訊息已改為不帶值;入口之 `optType` 先擋,故保護網為防禦性,變異測試中「入口收任何字串」(M23)因保護網同訊息而為等價變異.
- **變異測試之做法**:把 `src/` 與要驗之測試檔複製到 `./tmp/fft/mut/<編號>/`(只複製檔,不建目錄連結),Node 之 `node_modules` 解析會沿父目錄上溯至套件根,免做連結;腳本內逐一以字串取代植入變異並斷言「取代點存在」(M44 首輪因取代字串寫錯而 NOT-APPLIED,須檢查此狀態);一次取測試鎖合併跑.存活者逐一判是否等價:M44(`filter1d` 之 ifft 忽略 type)為數學等價(2 冪次長度之 dft 與 pow2 逆轉換結果僅差浮點末位),不為其寫位元比對.
- **eslint**:`.eslintrc.js` 有 `no-new-wrappers`、`no-sparse-arrays`;測試以包裝物件(`new Number(1)`)與稀疏陣列為刻意之無效輸入,於測試檔頂以 `/* eslint-disable ... */` 並註明理由.
- **單檔跑 mocha**:`node node_modules/mocha/bin/mocha.js --no-parallel test/unit-param.test.mjs --timeout 180000`;全套 `npm test`(`--parallel`).兩者皆經 `quiet-run --lock`.
- **測試規模**:新矩陣測試 1020 案(全套 1046 案)、全套約 3 秒;表驅動逐值一案,失敗時標題即指出是哪個函數、哪個無效值.

## 最小輸入長度(2026-10-31,R-LEN-01)

- **最小長度要以「輸出裡有沒有非直流點」實測,不憑推論**:`spectrum` 輸出 `floor(n/2)` 點,故 n=2、3 只有直流點(n=2 之 Nyquist bin 與 n=3 之 bin 1 皆被 `floor` 截掉),n≥4 才有非直流點;`filter` 遮罩涵蓋全部 n 個 bin,n≥2 即有非直流 bin.兩者最小值不同(4 對 2)是演算法差異,不是不一致.探測腳本逐 (函數 × 長度 × 路徑 × `useOneTurn`) 印輸出,以自訂序列化區分 `undefined`/`NaN`/`Infinity`(`JSON.stringify` 全顯示 `null`),修前後各跑一次並以比對腳本斷言「有效長度之輸出逐字相同、不足者皆為預期訊息」(152 行不變、180 行拋預期訊息、0 行例外).
- **2D 之 `filter` 任一軸長 1 且 `useOneTurn:true` 時全 0**:該軸 `df = 1/(0*dt) = Infinity`,頻率 `min(0,1)*Infinity = NaN`,徑向頻率 `NaN`,`hzStart <= NaN` 為 false 而全部清零——即使另一軸很長;`useOneTurn:false` 則退化為 1D(與對應之 `filter1d` 同值).
- **`pow2` 長度 1～3 修前有輸出,是補零之產物**:補零至 4 點後頻率軸與點數由 4 決定,與資料之資訊量無關;故長度檢查以輸入長度判定(R-PARAM-01.1 兩路徑一致).
- **長度檢查之位置**:放在資料檢測(`chkArr`/`chkMat`)之後、`dt` 之前.若放在元素檢測之前(以原始 `arr.length` 判),`undefined`／`null` 輸入會在取 `.length` 時拋 TypeError 而非 `invalid arr: must be a non-empty array`,且元素無效者會被誤報為長度問題(變異 M28 被 `unit-minlen`、`unit-param` 抓到).
- **訊息寫法**:派工例為 `must have at least N elements`,但規格 V19 與本套件既有訊息(`must be an array with the same length as mat[0]`)皆為 `must be <描述>`,故採 `must be an array with at least N elements|rows|columns`(含例之關鍵詞 `at least N elements`);2D 以名稱區分維度(列 `mat`、行 `mat[0]`)並於描述寫 rows／columns.
- **既有測試之基準資料要跟著檢**:`unit-param` 之 `spectrum2d` 基準為 2×4,新規則下會拋最小長度錯誤(元素無效類測試因元素檢測先於長度而照樣綠,有效資料類測試才紅),改為 4×4 之 `2dq` 形狀(第 2、3 列重複第 0、1 列,使列優先掃描之第一個無效元素仍為第 p 個).`unit-len1` 之長度 1 `filter`/`spectrum` 斷言隨規則廢止,改由 `unit-minlen` 斷言拋錯,不放寬規則去保舊測試.
- **本套件 4 個函數檔為 CRLF,`_chkParam.mjs` 等為 LF**:變異腳本以字串取代植入變異時,須先把讀入之內容 `replace(/\r\n/g, '\n')`,否則多行 `from` 字串不吻合(`NOT-APPLIED`).測試輔助 `expectInvalid` 抽至 `test/tools/`,`unit-param` 與 `unit-minlen` 共用(同一 helper 只定義一次).
- **下游**:盤 `C:/opensrc`(120 個套件,以 node 遞迴走訪、不跟進連結,sanity 為 111 個 package.json 依賴 wsemi)無任何 `package.json` 依賴 `w-fft`,原始碼亦無呼叫四函數者.

## `dft` 長度 1(2026-10-31,R-DFT-01)

- **根因要讀 mathjs 原始碼才準**:`node_modules/mathjs/lib/esm/function/matrix/fft.js` 之 `_fft` 於 `len === 1` 回 `[arr[0]]`(原元素,輸入為 number 即回 number),其餘長度之輸出皆為 Complex(`addScalar`／`multiplyScalar` 與 Complex 運算).故 `out[i].re` 為 `undefined`(序列化成 `null`),並非 `NaN`;先前之記載(`NaN`)來自 JSON 顯示,以 `JSON.stringify` 看輸出會把 `undefined` 與 `NaN` 都顯示成 `null`,探測時須用 `console.log` 或 `typeof`.
- **只有 1D 長度 1 與 2D 1×1 會踩**:2D 之 1×n、n×1(n≥2)因另一軸之運算產生 Complex 而正常(實測 1×1～5×5 共 25 形狀,僅 1×1 出錯);反向(ifft)因輸入皆為 `complex()` 建構之 Complex 而不踩.
- **修正位置選讀出端**:讀出時 `complex(out[i])`(Complex 會被複製,number 轉為虛部 0),不改餵給 mathjs 之輸入,故長度 2 以上之數值不受影響(既有 1046 案 0 改變).另一可行做法是把輸入改為 `complex(x,0)`(mathjs 對長度 1 即回 Complex):實測(隨機資料 n=1..64,`Object.is` 比對含有號零)兩種輸入之輸出逐位元相同,故兩者等價,擇讀出端是因改動點與根因(輸出型別不一致)同處、且不改變餵給 mathjs 之資料.
- **測試預言獨立於被測物**:以樸素 O(n²) DFT(依定義)當預言,對 1D n=1..9、2D 1..5×1..5 全形狀比對,不以 `pow2` 或 mathjs 互驗(兩者之一有誤時互驗會掩蓋).`dft` 與 `pow2` 之一致性須先推導關係(n 整除補零後之 N 時 `pow2` bin `k*N/n` 等於 `dft` bin k;ifft 輸出總和為頻譜直流分量之實部)再寫斷言,不可直接比整個輸出(點數本來就不同).
- **`filter` 之全通帶驗證**:`useOneTurn:false`、`hzStart:0`、`hzEnd:1e6`(`hzEnd` 排除 `Infinity`)時輸出應等於輸入,是檢驗 fft→遮罩→ifft 鏈對長度 1 是否正確之簡單不變式;修前 `dft` 回 0(實測;依程式,頻譜為 `[undefined, undefined]`,反向填值之 `get(arr,'0.0',0)` 遇 `undefined` 取預設 0),修後回原值.
- **變異測試**:14 個變異(還原修正、僅 n>1 才轉換之變體、re/im 對調、共軛、虛部恆 0、反向取虛部、`get2n` 最小值改 2、`type` 恆走 dft、`filter` 排除直流等)全殺;還原修正之 4 個(M01～M04)只有新測試抓得到,印證舊測試對此缺陷無覆蓋.變異腳本逐檔記錄 `byFile`(哪些測試檔抓到)以分辨新舊測試之貢獻.
