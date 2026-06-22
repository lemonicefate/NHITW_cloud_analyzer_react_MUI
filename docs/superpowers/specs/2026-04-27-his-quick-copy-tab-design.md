# HIS 複製貼上 Tab — Design Spec

- **Date**: 2026-04-27
- **Scope**: v1 — 西藥(Western medication)only;檢驗、影像留待後續迭代
- **Author**: Claude + 使用者(ENT 專科醫師 / 診所負責人)

## 動機

健保雲端 2.0 的藥歷在門診時需要被快速複製貼上到 HIS,既有的「藥物清單」tab 已可複製,但格式必須走自訂 formatter 設定,且 UI 是以「整次處方一段文字」為單位。實際看診時更常見的需求是:**勾幾筆關鍵藥物、用一個固定且可預期的格式、一鍵貼進 HIS 的某個欄位**。為避免動到既有設定機制與 UI,我們新增一個獨立 tab 專門服務這個流程。

## 目標格式

```
{name}({ingredient}) {perDosage}# {frequency} {days}days {date} - {endDate} ({hosp})
```

範例:
```
Norvasc(AMLODIPINE) 1# QD 28days 2026/04/01 - 2026/04/28 (台大醫院)
```

### 欄位來源
| 欄位 | 來源 | 備註 |
|---|---|---|
| `name` | `med.name` | 健保雲端的商品名 |
| `ingredient` | `med.ingredient` | 健保雲端必有英文學名 |
| `perDosage` | `med.perDosage` | 原樣輸出(可能是 `0.5`、`1`、`2`) |
| `frequency` | `med.frequency` | 已被 `medicationProcessor` 標準化為 `QD/BID/PRN` 等 |
| `days` | `med.days` | 健保雲端必有天數 |
| `date` | `group.date` | 處方日,格式 `yyyy/mm/dd` |
| `endDate` | `date + days - 1` | 計算得出,當天=處方日 |
| `hosp` | `group.hosp` | 院所名稱原樣 |

### 邊界規則(已與使用者確認)

- 學名一定有,不需 fallback。
- 天數一定有,不需 fallback。
- PRN / 特殊頻次:`frequency` 欄位直接顯示 `PRN`(由 processor 處理)。
- 劑量為分數或多單位(`0.5`、`2`)原樣輸出。
- 院所全名照舊,不截斷。

## UI 設計

新增 tab `HIS複製` 在既有 tab bar 末端。Tab 內容:

```
┌─ HIS 複製 ────────────────────────────────────┐
│ [☐ 全選]  [複製選取 (N)]  [複製全部]          │
├──────────────────────────────────────────────┤
│ ☐  2026/04/01  台大醫院  (3 項)                │
│   ☐  Norvasc(AMLODIPINE) 1# QD 28days …       │
│   ☐  Crestor(ROSUVASTATIN) 1# QD 28days …     │
│   ☐  普拿疼(ACETAMINOPHEN) 1# PRN 14days …    │
├──────────────────────────────────────────────┤
│ ☐  2026/03/15  XX 診所  (5 項)                │
│   …                                            │
└──────────────────────────────────────────────┘
```

### 互動規則
- **單藥 checkbox**:獨立勾選。
- **就診層級 checkbox**:三態(全選 / 部分選 / 未選);點擊 = 切換該就診下所有藥物。
- **全選 checkbox**:三態;點擊 = 切換所有就診下所有藥物。
- **預設狀態**:全部未勾,避免誤複製。
- **就診區塊**:預設展開,v1 不做摺疊(可後續加)。
- **複製選取**按鈕:以 `\n` 串接所有勾選藥物的格式化字串,寫入剪貼簿,顯示 toast「已複製 N 行」。按鈕文字動態顯示目前勾選數,N=0 時 disabled。
- **複製全部**按鈕:不論勾選狀態,複製當前 `groupedMedications` 全部。
- **空狀態**:顯示「目前沒有藥物資料」。

## 架構

### 新增檔案
1. **`src/components/tabs/HisQuickCopy.jsx`**
   - Props: `groupedMedications`(沿用 `MedicationList` 的 prop)
   - State: `selectedKeys: Set<string>`(key = `${visitIdx}-${medIdx}`)
   - 使用 MUI `Checkbox`、`Button`、`Box`、`Typography`、`Snackbar`(沿用既有風格)
   - 渲染就診清單、處理勾選、處理複製

2. **`src/utils/hisCopyFormatter.js`**
   - Export `formatMedicationLine(med, group): string` — 純函式,單筆藥物轉一行字串
   - Export `formatMedicationLines(groupedMedications, predicate?): string` — 走訪全部藥物,套用可選的 predicate(用於「複製選取」),回傳以 `\n` 串接的多行字串
   - Export `addDays(yyyymmdd, days): string` — 日期計算工具,輸入輸出皆 `yyyy/mm/dd`

### 改動檔案
3. **`src/components/FloatingIcon.jsx`**
   - Import `HisQuickCopy`
   - 在既有 `<Tab>` 群組末端新增一個 `<Tab label="HIS複製">`
   - 在既有 `<TabPanel>` 群組末端新增對應 panel,把 `groupedMedications` 傳入

不動 `defaultSettings.js`、`medicationCopyFormatter.js`、`medicationProcessor.js`、設定編輯器等任何既有檔案。**完全旁路**。

## 資料流

```
healthcloud DOM
  → legacyContent.js(既有)
  → window.postMessage
  → FloatingIcon 接收並 setState groupedMedications(既有)
  → HisQuickCopy 收到 prop(新)
  → 內部 selectedKeys state 管理勾選(新)
  → 點按鈕 → formatMedicationLines() → navigator.clipboard.writeText()(新)
```

## 不做(YAGNI)

- 不做格式自訂——這個 tab 的賣點就是固定可預期。
- 不做匯出檔案——剪貼簿就夠用。
- 不做搜尋過濾——藥物量未到需要搜尋的程度。
- 不做就診區塊摺疊——v1 預設展開即可。
- 不做設定面板入口——使用者直接點 tab。

## 測試與驗收

- 專案無單元測試框架,以實機驗證為主:
  1. 在 `chrome://extensions/` 開發者模式重新載入 extension。
  2. 開啟健保雲端任一病人的藥歷頁,點浮動圖示,切到「HIS複製」tab。
  3. 驗證所有就診/藥物正確顯示。
  4. 勾選若干藥物,點「複製選取」,貼到記事本驗證格式與行數。
  5. 點「複製全部」,確認全部藥物以正確格式輸出。
  6. 驗證日期計算:處方日 + 天數 - 1 = 結束日(當天=處方日)。

## 風險

- 若某筆 `med.ingredient` 罕見地為空,輸出會是 `Norvasc()` 這種怪格式 → 由於使用者確認健保雲端必有,不額外處理;若實測遇到再加 fallback。
- `groupedMedications` 結構若未來改變,新 tab 與既有 `MedicationList` 同步壞掉——可接受的耦合,因為兩者本來就共享資料源。
