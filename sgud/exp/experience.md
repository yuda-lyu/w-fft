# 累積經驗

本檔為執行工作時特有之累積經驗,留給後續之嘗試、執行與判斷,由agent自行編列、擴充與維護.過長時抽出舊者為`experience_<年月日>.md`,並於本檔註明何時抽出.

## 輸入參數檢測(2026-10-31,R-PARAM-01)

- **lodash `get(arr, i, 0)` 會靜默掩蓋缺值與無效值**:預設值只在結果為 `undefined` 時生效,`get(1, '0', 0)` 為 0,故 `ifft1d([1,2,3,4])`(元素非 `[re,im]`)舊版回全 0 而不報錯;`get(opt, 'type', 'dft')` 對非物件之 opt 亦靜默回預設.檢測改於入口以顯式迴圈逐元素進行,不再用 `get` 取資料.
- **兩條路徑對同一壞輸入之行為完全不同**:`pow2`(ml-fft)直接對原值做 `+`,`'2'` 與數字串接成字串(直流分量 28 而非 10),`''`／`null` 當 0、`true` 當 1、`'0x10'` 當 16;`dft`(mathjs)拋 `Cannot convert "-" to Complex` 等原生錯誤,且把 `undefined` 當 0.故入口須先檢並轉換,核心只收已轉換之 number.
- **mathjs 15.2.0 之 `fft` 對長度 1 回 `NaN`**(`fft1d([5])`、`fft2d([[5]])` 之 `dft` 路徑),`pow2` 路徑補零至 4 點後正確.與輸入檢測無關,已列範圍外缺陷.
- **內部串接不對自產中間值再檢**:`filter1d`／`filter2d` 之 fft→遮罩→ifft 以內部 `_fft1d`／`_fft2d` 銜接;若改用公開之 `ifft1d`,輸出溢位成 `Infinity`/`NaN` 時會以 `invalid arr[...]` 誤指呼叫端之 `arr`.
- **本輪新增之 `type` 保護網與入口檢測重複**:`_fft1d`／`_fft2d` 保留 mode／type 之防呼叫端誤用,訊息已改為不帶值;入口之 `optType` 先擋,故保護網為防禦性,變異測試中「入口收任何字串」(M23)因保護網同訊息而為等價變異.
- **變異測試之做法**:把 `src/` 與要驗之測試檔複製到 `./tmp/fft/mut/<編號>/`(只複製檔,不建目錄連結),Node 之 `node_modules` 解析會沿父目錄上溯至套件根,免做連結;腳本內逐一以字串取代植入變異並斷言「取代點存在」(M44 首輪因取代字串寫錯而 NOT-APPLIED,須檢查此狀態);一次取測試鎖合併跑.存活者逐一判是否等價:M44(`filter1d` 之 ifft 忽略 type)為數學等價(2 冪次長度之 dft 與 pow2 逆轉換結果僅差浮點末位),不為其寫位元比對.
- **eslint**:`.eslintrc.js` 有 `no-new-wrappers`、`no-sparse-arrays`;測試以包裝物件(`new Number(1)`)與稀疏陣列為刻意之無效輸入,於測試檔頂以 `/* eslint-disable ... */` 並註明理由.
- **單檔跑 mocha**:`node node_modules/mocha/bin/mocha.js --no-parallel test/unit-param.test.mjs --timeout 180000`;全套 `npm test`(`--parallel`).兩者皆經 `quiet-run --lock`.
- **測試規模**:新矩陣測試 1020 案(全套 1046 案)、全套約 3 秒;表驅動逐值一案,失敗時標題即指出是哪個函數、哪個無效值.
