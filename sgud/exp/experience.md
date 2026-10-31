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

## `dft` 長度 1(2026-10-31,R-DFT-01)

- **根因要讀 mathjs 原始碼才準**:`node_modules/mathjs/lib/esm/function/matrix/fft.js` 之 `_fft` 於 `len === 1` 回 `[arr[0]]`(原元素,輸入為 number 即回 number),其餘長度之輸出皆為 Complex(`addScalar`／`multiplyScalar` 與 Complex 運算).故 `out[i].re` 為 `undefined`(序列化成 `null`),並非 `NaN`;先前之記載(`NaN`)來自 JSON 顯示,以 `JSON.stringify` 看輸出會把 `undefined` 與 `NaN` 都顯示成 `null`,探測時須用 `console.log` 或 `typeof`.
- **只有 1D 長度 1 與 2D 1×1 會踩**:2D 之 1×n、n×1(n≥2)因另一軸之運算產生 Complex 而正常(實測 1×1～5×5 共 25 形狀,僅 1×1 出錯);反向(ifft)因輸入皆為 `complex()` 建構之 Complex 而不踩.
- **修正位置選讀出端**:讀出時 `complex(out[i])`(Complex 會被複製,number 轉為虛部 0),不改餵給 mathjs 之輸入,故長度 2 以上之數值不受影響(既有 1046 案 0 改變).另一可行做法是把輸入改為 `complex(x,0)`(mathjs 對長度 1 即回 Complex):實測(隨機資料 n=1..64,`Object.is` 比對含有號零)兩種輸入之輸出逐位元相同,故兩者等價,擇讀出端是因改動點與根因(輸出型別不一致)同處、且不改變餵給 mathjs 之資料.
- **測試預言獨立於被測物**:以樸素 O(n²) DFT(依定義)當預言,對 1D n=1..9、2D 1..5×1..5 全形狀比對,不以 `pow2` 或 mathjs 互驗(兩者之一有誤時互驗會掩蓋).`dft` 與 `pow2` 之一致性須先推導關係(n 整除補零後之 N 時 `pow2` bin `k*N/n` 等於 `dft` bin k;ifft 輸出總和為頻譜直流分量之實部)再寫斷言,不可直接比整個輸出(點數本來就不同).
- **`filter` 之全通帶驗證**:`useOneTurn:false`、`hzStart:0`、`hzEnd:1e6`(`hzEnd` 排除 `Infinity`)時輸出應等於輸入,是檢驗 fft→遮罩→ifft 鏈對長度 1 是否正確之簡單不變式;修前 `dft` 回 0(實測;依程式,頻譜為 `[undefined, undefined]`,反向填值之 `get(arr,'0.0',0)` 遇 `undefined` 取預設 0),修後回原值.
- **變異測試**:14 個變異(還原修正、僅 n>1 才轉換之變體、re/im 對調、共軛、虛部恆 0、反向取虛部、`get2n` 最小值改 2、`type` 恆走 dft、`filter` 排除直流等)全殺;還原修正之 4 個(M01～M04)只有新測試抓得到,印證舊測試對此缺陷無覆蓋.變異腳本逐檔記錄 `byFile`(哪些測試檔抓到)以分辨新舊測試之貢獻.
