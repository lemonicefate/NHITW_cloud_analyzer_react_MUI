# NHITW_cloud_analyzer_react_MUI Roadmap

**Status**: 🟢 Active
**Last updated**: 2026-04-27
**Current milestone**: HIS Quick Copy Tab（feature/his-quick-copy-tab 分支進行中）

## 🚧 In progress

- [ ] HIS Quick Copy Tab（v1, 西藥）
  - [x] `hisCopyFormatter` 純函式（單筆/批次格式化、日期計算）與 Mocha+Chai 單元測試
  - [x] `HisQuickCopy.jsx` Tab UI（三態 checkbox、全選/部分選、複製選取/複製全部、Snackbar）
  - [x] 在 `FloatingIcon` 中註冊 Tab 與 TabPanel（位於「餘藥」與「說明」之間）
  - [ ] 完成手動端到端驗證（依 `docs/superpowers/plans/2026-04-27-his-quick-copy-tab.md` Step 4 清單，含空藥歷情境）
  - [ ] Self-Review checklist 全數通過後合併回 main

## 📅 Up next（本月）

- [ ] HIS Quick Copy Tab v2 範圍評估（spec 已預留：檢驗、影像）
- [ ] 同步 upstream 的 `feature-copydata-content`、`feature-lab-trend-chart` 變更與 fork 是否仍需 rebase
- [ ] 釋出新版本（`release-stable.sh` / `release-alpha.sh`）並更新 Chrome Web Store 上架版本

## 🗂️ Backlog（someday/maybe）

- 與 upstream（leescot）同步檢核：定期 rebase / cherry-pick
- HIS Quick Copy 的就診區塊摺疊（spec 已標註為 v1 不做）
- HIS Quick Copy 對 `med.ingredient` 為空時的 fallback（目前風險，依實測再處理）
- React component 的 jsdom 測試環境（目前 UI 僅手動驗證）
- 自動化 CI（除 `release.yml` 之外，目前尚無 GitHub Actions）
- 程式碼內既有 TODO 清查與整理

## ✅ Recently done（近一個月）

- [x] feat: register HIS quick-copy tab in FloatingIcon (`e849770`)
- [x] feat: add HisQuickCopy tab component with checkbox selection (`d759c3b`)
- [x] feat: add hisCopyFormatter for HIS-friendly medication output (`7945c03`)
- [x] docs: HIS quick-copy tab 規格 + 實作計畫（`99fe5f6`、`2b56fa4`）
- [x] feat: 新增檢驗項目趨勢圖 popover 功能（`f990cf7`，PR #60）
- [x] feat: 新增影像學報告展開/收合功能 + 顯示邏輯優化（`bacd5c8`、`861171f`，PR #55）
- [x] docs: 加入 Apache 2.0 授權與貢獻指南、簡化文件結構（`64e77dd`、`3735be5`，PR #57）

## ⚠️ Known concerns

- 無 GitHub Actions CI（除 `release.yml`）
- 無自動化測試（僅瀏覽器中執行的 Mocha + Chai，UI 純手動驗證）
- Fork 與 upstream（leescot）持續同步成本：目前 `upstream/feature-copydata-content`、`upstream/feature-lab-trend-chart`、`upstream/release` 尚未 merge
