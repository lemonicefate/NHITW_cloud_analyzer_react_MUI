# HIS 複製貼上 Tab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增獨立 tab「HIS複製」,以固定格式列出健保雲端所有就診的藥物,支援勾選/全選/全部複製到剪貼簿,讓使用者快速貼進 HIS 系統。

**Architecture:** 完全旁路既有 formatter 與設定機制。新增 1 個純函式檔(formatter)+ 1 個 React 元件(tab UI),改動 1 個既有檔案註冊 tab(`FloatingIcon.jsx`)。

**Tech Stack:** React 19、MUI 6.5、Vite。測試走既有 Mocha + Chai 在瀏覽器 `tests/test.html` 跑。

**Spec:** `docs/superpowers/specs/2026-04-27-his-quick-copy-tab-design.md`

---

## File Structure

| 動作 | 檔案 | 職責 |
|---|---|---|
| Create | `src/utils/hisCopyFormatter.js` | 純函式:單筆/批次藥物 → HIS 格式字串;日期計算 |
| Create | `tests/test_hisCopyFormatter.js` | 單元測試,涵蓋格式化與日期計算的正常與邊界 |
| Modify | `tests/test.js` | 註冊新測試模組 |
| Create | `src/components/tabs/HisQuickCopy.jsx` | Tab UI:就診摺疊清單 + 三態 checkbox + 三顆按鈕 + Snackbar |
| Modify | `src/components/FloatingIcon.jsx` | 新增 `<Tab>` 與 `<TabPanel>`,傳入 `groupedMedications` |

---

## Task 1: Formatter — 單筆藥物轉一行

**Files:**
- Create: `tests/test_hisCopyFormatter.js`
- Create: `src/utils/hisCopyFormatter.js`
- Modify: `tests/test.js`(在 import 區塊末尾加一行)

- [ ] **Step 1: 寫第一個 failing test (formatMedicationLine 基本格式)**

建立 `tests/test_hisCopyFormatter.js`:

```javascript
import {assert} from './lib/chai.js';

import {formatMedicationLine, addDays, formatMedicationLines} from './src/utils/hisCopyFormatter.js';

describe('utils/hisCopyFormatter', function () {
  describe('.formatMedicationLine', function () {
    it('formats a typical medication into one line', function () {
      const med = {
        name: 'Norvasc',
        ingredient: 'AMLODIPINE',
        perDosage: '1',
        frequency: 'QD',
        days: '28',
      };
      const group = {
        date: '2026/04/01',
        hosp: '台大醫院',
      };
      const expected = 'Norvasc(AMLODIPINE) 1# QD 28days 2026/04/01 - 2026/04/28 (台大醫院)';
      assert.strictEqual(formatMedicationLine(med, group), expected);
    });
  });
});
```

- [ ] **Step 2: 註冊新測試模組**

修改 `tests/test.js`,在最後一個 `await import` 後加:

```javascript
await import('./test_hisCopyFormatter.js');
```

- [ ] **Step 3: 跑測試確認 fail**

執行 `npm run test`,在瀏覽器開 `http://localhost:5173/test.html`。
Expected: 該 test 失敗,訊息類似 "Cannot resolve module .../hisCopyFormatter.js"。

- [ ] **Step 4: 寫最小實作讓 test pass**

建立 `src/utils/hisCopyFormatter.js`:

```javascript
export function addDays(yyyymmdd, days) {
  const [y, m, d] = yyyymmdd.split('/').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yy}/${mm}/${dd}`;
}

export function formatMedicationLine(med, group) {
  const days = parseInt(med.days, 10);
  const endDate = addDays(group.date, days - 1);
  return `${med.name}(${med.ingredient}) ${med.perDosage}# ${med.frequency} ${med.days}days ${group.date} - ${endDate} (${group.hosp})`;
}

export function formatMedicationLines(groupedMedications, isSelected) {
  const lines = [];
  groupedMedications.forEach((group, gIdx) => {
    group.medications.forEach((med, mIdx) => {
      if (!isSelected || isSelected(gIdx, mIdx)) {
        lines.push(formatMedicationLine(med, group));
      }
    });
  });
  return lines.join('\n');
}
```

- [ ] **Step 5: 跑測試確認 pass**

重新整理 `http://localhost:5173/test.html`。
Expected: 該 test 通過。

- [ ] **Step 6: 加更多 tests 涵蓋邊界**

在同檔案 `describe('.formatMedicationLine', ...)` 內加:

```javascript
    it('handles PRN frequency', function () {
      const med = {name: 'Voren', ingredient: 'DICLOFENAC', perDosage: '1', frequency: 'PRN', days: '5'};
      const group = {date: '2026/04/01', hosp: '某診所'};
      assert.strictEqual(
        formatMedicationLine(med, group),
        'Voren(DICLOFENAC) 1# PRN 5days 2026/04/01 - 2026/04/05 (某診所)'
      );
    });

    it('handles fractional dose', function () {
      const med = {name: 'Concor', ingredient: 'BISOPROLOL', perDosage: '0.5', frequency: 'QD', days: '14'};
      const group = {date: '2026/04/01', hosp: 'A'};
      assert.strictEqual(
        formatMedicationLine(med, group),
        'Concor(BISOPROLOL) 0.5# QD 14days 2026/04/01 - 2026/04/14 (A)'
      );
    });

    it('handles single-day prescription (1 day)', function () {
      const med = {name: 'Solu-Cortef', ingredient: 'HYDROCORTISONE', perDosage: '1', frequency: 'STAT', days: '1'};
      const group = {date: '2026/04/01', hosp: 'A'};
      assert.strictEqual(
        formatMedicationLine(med, group),
        'Solu-Cortef(HYDROCORTISONE) 1# STAT 1days 2026/04/01 - 2026/04/01 (A)'
      );
    });
  });

  describe('.addDays', function () {
    it('crosses month boundary', function () {
      assert.strictEqual(addDays('2026/04/30', 1), '2026/05/01');
    });

    it('crosses year boundary', function () {
      assert.strictEqual(addDays('2026/12/31', 1), '2027/01/01');
    });

    it('handles leap year Feb', function () {
      assert.strictEqual(addDays('2024/02/28', 1), '2024/02/29');
    });
  });

  describe('.formatMedicationLines', function () {
    const groups = [
      {
        date: '2026/04/01',
        hosp: 'A',
        medications: [
          {name: 'X', ingredient: 'X1', perDosage: '1', frequency: 'QD', days: '7'},
          {name: 'Y', ingredient: 'Y1', perDosage: '1', frequency: 'BID', days: '7'},
        ],
      },
      {
        date: '2026/03/15',
        hosp: 'B',
        medications: [
          {name: 'Z', ingredient: 'Z1', perDosage: '1', frequency: 'QD', days: '30'},
        ],
      },
    ];

    it('joins all lines with \\n when no predicate', function () {
      const result = formatMedicationLines(groups);
      assert.strictEqual(result.split('\n').length, 3);
    });

    it('filters by predicate', function () {
      const result = formatMedicationLines(groups, (g, m) => g === 0 && m === 0);
      assert.strictEqual(result, 'X(X1) 1# QD 7days 2026/04/01 - 2026/04/07 (A)');
    });

    it('returns empty string when nothing selected', function () {
      assert.strictEqual(formatMedicationLines(groups, () => false), '');
    });
  });
});
```

- [ ] **Step 7: 跑測試確認全部 pass**

重新整理 `http://localhost:5173/test.html`。
Expected: 所有 hisCopyFormatter tests pass(共 9 個)。

- [ ] **Step 8: Commit**

```bash
git add src/utils/hisCopyFormatter.js tests/test_hisCopyFormatter.js tests/test.js
git commit -m "feat: add hisCopyFormatter for HIS-friendly medication output

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: HisQuickCopy Tab UI 元件

**Files:**
- Create: `src/components/tabs/HisQuickCopy.jsx`

UI 沒有自動化測試框架(React component 無 jsdom 環境),改以視覺化驗證 + 下個 task 的端到端手動測試。

- [ ] **Step 1: 建立元件骨架**

建立 `src/components/tabs/HisQuickCopy.jsx`:

```jsx
import { useState, useMemo } from "react";
import {
  Box,
  Button,
  Checkbox,
  Stack,
  Typography,
  Snackbar,
  Alert,
  Divider,
} from "@mui/material";
import { formatMedicationLine, formatMedicationLines } from "../../utils/hisCopyFormatter";

const keyOf = (g, m) => `${g}-${m}`;

const HisQuickCopy = ({ groupedMedications }) => {
  const [selectedKeys, setSelectedKeys] = useState(new Set());
  const [snack, setSnack] = useState({ open: false, msg: "" });

  const totalCount = useMemo(
    () => groupedMedications.reduce((sum, g) => sum + g.medications.length, 0),
    [groupedMedications]
  );

  const selectedCount = selectedKeys.size;
  const allSelected = totalCount > 0 && selectedCount === totalCount;
  const someSelected = selectedCount > 0 && selectedCount < totalCount;

  const toggleOne = (gIdx, mIdx) => {
    const k = keyOf(gIdx, mIdx);
    const next = new Set(selectedKeys);
    if (next.has(k)) next.delete(k);
    else next.add(k);
    setSelectedKeys(next);
  };

  const toggleGroup = (gIdx) => {
    const groupKeys = groupedMedications[gIdx].medications.map((_, mIdx) =>
      keyOf(gIdx, mIdx)
    );
    const allOn = groupKeys.every((k) => selectedKeys.has(k));
    const next = new Set(selectedKeys);
    if (allOn) groupKeys.forEach((k) => next.delete(k));
    else groupKeys.forEach((k) => next.add(k));
    setSelectedKeys(next);
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelectedKeys(new Set());
    } else {
      const next = new Set();
      groupedMedications.forEach((g, gIdx) => {
        g.medications.forEach((_, mIdx) => next.add(keyOf(gIdx, mIdx)));
      });
      setSelectedKeys(next);
    }
  };

  const groupCheckState = (gIdx) => {
    const groupKeys = groupedMedications[gIdx].medications.map((_, mIdx) =>
      keyOf(gIdx, mIdx)
    );
    const onCount = groupKeys.filter((k) => selectedKeys.has(k)).length;
    return {
      checked: onCount === groupKeys.length && groupKeys.length > 0,
      indeterminate: onCount > 0 && onCount < groupKeys.length,
    };
  };

  const copyToClipboard = async (text, label) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      const lineCount = text.split("\n").length;
      setSnack({ open: true, msg: `已複製 ${lineCount} 行 (${label})` });
    } catch (e) {
      setSnack({ open: true, msg: `複製失敗: ${e.message}` });
    }
  };

  const handleCopySelected = () => {
    const text = formatMedicationLines(
      groupedMedications,
      (g, m) => selectedKeys.has(keyOf(g, m))
    );
    copyToClipboard(text, "選取");
  };

  const handleCopyAll = () => {
    const text = formatMedicationLines(groupedMedications);
    copyToClipboard(text, "全部");
  };

  if (groupedMedications.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="text.secondary">目前沒有藥物資料</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 1 }}>
      {/* 工具列 */}
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        sx={{ mb: 1, flexWrap: "wrap" }}
      >
        <Checkbox
          size="small"
          checked={allSelected}
          indeterminate={someSelected}
          onChange={toggleAll}
        />
        <Typography variant="body2">全選</Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Button
          variant="contained"
          size="small"
          disabled={selectedCount === 0}
          onClick={handleCopySelected}
        >
          複製選取 ({selectedCount})
        </Button>
        <Button variant="outlined" size="small" onClick={handleCopyAll}>
          複製全部 ({totalCount})
        </Button>
      </Stack>

      <Divider sx={{ mb: 1 }} />

      {/* 就診清單 */}
      {groupedMedications.map((group, gIdx) => {
        const { checked, indeterminate } = groupCheckState(gIdx);
        return (
          <Box key={gIdx} sx={{ mb: 1.5 }}>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Checkbox
                size="small"
                checked={checked}
                indeterminate={indeterminate}
                onChange={() => toggleGroup(gIdx)}
              />
              <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                {group.date} {group.hosp} ({group.medications.length} 項)
              </Typography>
            </Stack>
            <Box sx={{ pl: 4 }}>
              {group.medications.map((med, mIdx) => {
                const k = keyOf(gIdx, mIdx);
                return (
                  <Stack
                    key={mIdx}
                    direction="row"
                    alignItems="center"
                    spacing={0.5}
                  >
                    <Checkbox
                      size="small"
                      checked={selectedKeys.has(k)}
                      onChange={() => toggleOne(gIdx, mIdx)}
                    />
                    <Typography
                      variant="body2"
                      sx={{ fontFamily: "monospace", fontSize: "0.85rem" }}
                    >
                      {formatMedicationLine(med, group)}
                    </Typography>
                  </Stack>
                );
              })}
            </Box>
          </Box>
        );
      })}

      <Snackbar
        open={snack.open}
        autoHideDuration={2000}
        onClose={() => setSnack({ ...snack, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" sx={{ width: "100%" }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default HisQuickCopy;
```

- [ ] **Step 2: Commit**

```bash
git add src/components/tabs/HisQuickCopy.jsx
git commit -m "feat: add HisQuickCopy tab component with checkbox selection

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: 註冊 Tab 到 FloatingIcon

**Files:**
- Modify: `src/components/FloatingIcon.jsx`

新 tab 的位置:**緊接「餘藥」(目前 index 7) 之後、「說明」(目前 index 8) 之前**。這會把「說明」推到 9、條件式的「進階」推到 10。

- [ ] **Step 1: import HisQuickCopy 與選一個 icon**

在 `FloatingIcon.jsx` 既有 import 區塊(約 line 60-80)的 tabs import 群組加上:

```jsx
import HisQuickCopy from "./tabs/HisQuickCopy";
```

確認既有 MUI icon imports;`ContentCopyIcon` 通常已存在。若沒 import,加上:

```jsx
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
```

- [ ] **Step 2: 在「餘藥」Tab 後、「說明」Tab 前插入新 Tab**

找到 `<Tab label={`餘藥 (${medDaysData.length})`}` 區塊(約 line 673-684),在它之後、`<Tab label="說明"` 之前插入:

```jsx
                <Tab
                  label="HIS複製"
                  icon={<ContentCopyIcon sx={{ fontSize: "1rem" }} />}
                  iconPosition="start"
                  sx={{
                    padding: "6px 10px",
                    color: groupedMedications.length > 0 ? getTabColor(generalDisplaySettings, "medication") : "#9e9e9e",
                    "&.Mui-selected": {
                      color: groupedMedications.length > 0 ? getTabSelectedColor(generalDisplaySettings, "medication") : "#616161",
                    },
                  }}
                />
```

- [ ] **Step 3: 在對應 index 加 TabPanel,並把後面的 index 各 +1**

找到 `<TabPanel value={tabValue} index={8}>`(目前是「說明」),把它與其後所有 panel 的 `index` 各 +1(8→9, 9→10)。然後在原 index 8 的位置(現在被空出)插入:

```jsx
          <TabPanel value={tabValue} index={8}>
            <HisQuickCopy groupedMedications={groupedMedications} />
          </TabPanel>
```

注意:條件式的「進階」panel(原 index 9)也要改成 index 10。

- [ ] **Step 4: 手動端到端驗證**

1. 執行 `npm run build`(會建好 `dist/`)。
2. 開 `chrome://extensions/`,開發者模式,reload 此 extension(指向 `dist/`)。
3. 在健保雲端 2.0 任一病人頁面,點浮動圖示展開。
4. 確認新 tab「HIS複製」出現在「餘藥」與「說明」之間。
5. 切到該 tab,驗證顯示:
   - [ ] 所有就診都有出現,日期/院所正確
   - [ ] 每筆藥物的格式 = `name(ingredient) X# FREQ Ndays YYYY/MM/DD - YYYY/MM/DD (院所)`
   - [ ] 結束日 = 處方日 + 天數 - 1(取一筆 28 天的對照確認)
6. 互動:
   - [ ] 點單筆 checkbox,「複製選取 (1)」按鈕變可按
   - [ ] 點某次就診的 checkbox,該次所有藥物全勾;再點一次全取消
   - [ ] 點「全選」,所有藥物勾起;再點一次全取消;部分勾選時顯示 indeterminate
   - [ ] 「複製選取」按下後,toast 顯示「已複製 N 行」
   - [ ] 貼到記事本驗證內容與行數正確
   - [ ] 「複製全部」忽略勾選狀態,複製全部
   - [ ] 切換到別的 tab 再回來,既有 layout 沒被破壞
7. 換一個沒有藥歷的病人,切到該 tab,確認顯示「目前沒有藥物資料」。

- [ ] **Step 5: Commit**

```bash
git add src/components/FloatingIcon.jsx
git commit -m "feat: register HIS quick-copy tab in FloatingIcon

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Self-Review Checklist(實作完成後)

- [ ] 既有「西藥」「西藥表格」「中藥」「檢驗」「檢驗表格」「影像」「餘藥」「說明」「進階」tab 都還能正常開啟、複製功能未壞
- [ ] 既有 `medicationCopyFormatter.js`、`defaultSettings.js`、設定編輯器無任何改動
- [ ] `npm run build` 成功無 warning(MUI/React 既有 warning 除外)
- [ ] `tests/test.html` 9 個新測試通過
- [ ] 設計文件中的格式範例與實機輸出逐字相符
