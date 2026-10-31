# 狀態

本檔記載當前已開發功能之最新狀態(各功能做到哪裡、對應之規則帳本條目與測試檔、已知缺口與待辦、最近一次驗證或發布之版本),只記現況、不寫過程(過程寫入 `sgud/exp/experience.md`).規則帳本(`sgud/rule/rulebook.md`)為藍圖,兩者比對即知尚未做到者.過長時依功能類型拆為 `state_<類型>.md`,本檔只留索引.

## 功能現況

| 功能 | 狀態 | 規則帳本 | 測試檔 |
|---|---|---|---|
| `fft1d`、`ifft1d`(`type:'dft'` mathjs 真實 n 點、`'pow2'` 補零至 2 冪次) | 完成 | R-PARAM-01、R-DFT-01 | `test/fft1d.test.mjs`、`test/ifft1d.test.mjs`、`test/pow2.test.mjs`、`test/unit-param.test.mjs`、`test/unit-len1.test.mjs` |
| `fft2d`、`ifft2d` | 完成 | R-PARAM-01、R-DFT-01 | `test/fft2d.test.mjs`、`test/ifft2d.test.mjs`、`test/pow2.test.mjs`、`test/unit-param.test.mjs`、`test/unit-len1.test.mjs` |
| `spectrum1d`、`spectrum2d` | 完成 | R-PARAM-01、R-LEN-01 | `test/spectrum1d_*.test.mjs`、`test/spectrum2d.test.mjs`、`test/unit-param.test.mjs`、`test/unit-minlen.test.mjs` |
| `filter1d`、`filter2d`(帶通) | 完成 | R-PARAM-01、R-LEN-01 | `test/filter1d_*.test.mjs`、`test/filter2d.test.mjs`、`test/unit-param.test.mjs`、`test/unit-minlen.test.mjs` |
| 輸入參數檢測(全部 8 個對外函數,入口先檢、`dft`／`pow2` 一致、訊息不帶值) | 完成(2026-10-31,待發布) | R-PARAM-01 | `test/unit-param.test.mjs` |
| `type:'dft'` 長度 1 之 `fft1d`／`fft2d`(1D 長度 1、2D 1×1)回 `[[x,0]]`／`[[[x,0]]]`;`dft` 與 `pow2` 對長度 1、2 之一致性 | 完成(1.0.34 已發布) | R-DFT-01 | `test/unit-len1.test.mjs` |
| 最小輸入長度:`spectrum1d` 至少 4 點、`filter1d` 至少 2 點、`spectrum2d` 各軸至少 4 點、`filter2d` 各軸至少 2 點,不足入口拋錯(`dft`／`pow2` 一致,以輸入長度判定);`fft`／`ifft` 家族長度 1 不拒收 | 完成(2026-10-31,待發布) | R-LEN-01 | `test/unit-minlen.test.mjs` |

- 輸入參數檢測之實作集中於 `src/_chkParam.mjs`(本套件內之等價實作);**wsemi 共用檢測函數發布後改用之**(待辦,見 R-PARAM-01);最小長度檢查(`chkMinLen`／`chkMinShape`)為 FFT 特有,同檔保留.
- 驗證(2026-10-31):`npm test` 1169 passing(含既有 frozen 輸出測試 0 改變;新增 `unit-minlen` 82 案,`unit-len1` 由 45 案改為 41 案);R-LEN-01 變異測試 31 個全殺;eslint 對改動檔 0 問題.1.0.34 已發布(含 R-PARAM-01、R-DFT-01);R-LEN-01 之破壞性變更已寫入 README〈Breaking changes〉(待發布,`package.json` 之 version 為 1.0.34,由主控發布).

## 已知缺口與待辦

- 最小長度之數字為依演算法與「頻率軸至少 1 個非直流點」判準所定(R-LEN-01〈已知不處理 / 可調整處〉):`spectrum` 之 4 若改採「輸出非空」判準可降為 2,待主控裁示;`hzStart > hzEnd` 不報錯、輸出溢位不檢:見 R-PARAM-01〈已知不處理〉.
- 是否收 TypedArray(`Float64Array` 等)為資料陣列:規格 A1 只收 `Array.isArray`,現依規格視為無效(舊版碰巧可用);如需收,須先改規格.
