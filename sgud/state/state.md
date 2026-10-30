# 狀態

本檔記載當前已開發功能之最新狀態(各功能做到哪裡、對應之規則帳本條目與測試檔、已知缺口與待辦、最近一次驗證或發布之版本),只記現況、不寫過程(過程寫入 `sgud/exp/experience.md`).規則帳本(`sgud/rule/rulebook.md`)為藍圖,兩者比對即知尚未做到者.過長時依功能類型拆為 `state_<類型>.md`,本檔只留索引.

## 功能現況

| 功能 | 狀態 | 規則帳本 | 測試檔 |
|---|---|---|---|
| `fft1d`、`ifft1d`(`type:'dft'` mathjs 真實 n 點、`'pow2'` 補零至 2 冪次) | 完成 | R-PARAM-01 | `test/fft1d.test.mjs`、`test/ifft1d.test.mjs`、`test/pow2.test.mjs`、`test/unit-param.test.mjs` |
| `fft2d`、`ifft2d` | 完成 | R-PARAM-01 | `test/fft2d.test.mjs`、`test/ifft2d.test.mjs`、`test/pow2.test.mjs`、`test/unit-param.test.mjs` |
| `spectrum1d`、`spectrum2d` | 完成 | R-PARAM-01 | `test/spectrum1d_*.test.mjs`、`test/spectrum2d.test.mjs`、`test/unit-param.test.mjs` |
| `filter1d`、`filter2d`(帶通) | 完成 | R-PARAM-01 | `test/filter1d_*.test.mjs`、`test/filter2d.test.mjs`、`test/unit-param.test.mjs` |
| 輸入參數檢測(全部 8 個對外函數,入口先檢、`dft`／`pow2` 一致、訊息不帶值) | 完成(2026-10-31,待發布) | R-PARAM-01 | `test/unit-param.test.mjs` |

- 輸入參數檢測之實作集中於 `src/_chkParam.mjs`(本套件內之等價實作);**wsemi 共用檢測函數發布後改用之**(待辦,見 R-PARAM-01).
- 驗證(2026-10-31):`npm test` 1046 passing(含既有 frozen 輸出測試 0 改變);變異測試 44 個殺死 42,存活 2 皆為等價變異;eslint 對改動檔 0 問題.
- 破壞性變更:已寫入 README〈Breaking changes〉(未發布,`package.json` 之 version 仍為 1.0.32,由主控發布).

## 已知缺口與待辦

- `type:'dft'` 且長度 1 之輸入(`fft1d([5])`、`fft2d([[5]])`)回 `NaN`(mathjs 15.2.0 之 `fft` 對長度 1 之結果;`'pow2'` 路徑正確):範圍外缺陷,另案處理(建議於 `_fft1dDft`／`_fft2dDft` 對長度 1 直接回 `[[x,0]]`).
- 資料長度 1 且 `useOneTurn:true` 之 `spectrum1d`／`spectrum2d` 回空陣列、`hzStart > hzEnd` 不報錯、輸出溢位不檢:見 R-PARAM-01〈已知不處理〉.
- 是否收 TypedArray(`Float64Array` 等)為資料陣列:規格 A1 只收 `Array.isArray`,現依規格視為無效(舊版碰巧可用);如需收,須先改規格.
