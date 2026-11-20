# LLM_MEMORY.md — 工作記憶 (Taiwan Web Cam War Room)

此檔案為跨 LLM、跨機器、跨平台的協作記憶庫。主要紀錄專案架構、技術細節、已實現功能、已知限制與後續開發方向，供後續接手的 AI 助手快速理解上下文。

## A. 目前狀態（每次交接必更新）

- 目前階段: **[build]**
- 最後更新: 2026-11-20 14:12 / 當時階段: build
- 交接基準 commit: 0ee8a5a [plan] 補建 COMPONENT_MAP 並完成路線 A 炫砲戰情室大改版規劃
- 進行中任務: v2 極簡單選氣象列＋風場瘦身＋拖曳縮放記憶體洩漏／卡死 4 項根因修復已推送上線，待使用者實測與審閱結案
- 阻塞點: 無

> 長期架構、已校正氣象座標、外部資源實測台帳（含 Carto 浮水印踩坑與 Esri/NLSC 替代方案）與建置部署實況已更新於 `COMPONENT_MAP.md`。

---

## B. 路線 A 大改版規劃（〈已定案〉 — v2 建置完成）

- **定案授權**：使用者於 `2026-11-20 11:52` 親自簽結 `0ee8a5a` 並切 `[build]`；於 `2026-11-20 13:51` 明示豁免中途審閱並拍板 UX 簡化為「氣象圖層嚴格單選互斥（點啥顯示啥、其他全關）＋動態風場獨立開關＋底圖一鍵循環」。
- **里程碑完成進度**：
  - [x] **Phase 1–4**：Vite 6 + React 19 + TS + Tailwind v4 + Zustand + Leaflet 6 層三明治全量落地，舊版原樣保存於 `public/legacy.html`。
  - [x] **UX 簡化與風場大瘦身**：移除 `WeatherDrawer` 多層疊加與手動透明度滑桿，改為底部 `WeatherQuickBar` 一鍵單選列；`WindFlowCanvas` 改採 36×28 螢幕空間預計算網格＋5 色桶批次描邊＋30fps＋分頁隱藏暫停。

---

## C. 交接日誌(只追加,不刪改;最新在最上,每筆一個小節)

### 2026-11-20 14:12 [build] 使用工具: Antigravity

- 完成了什麼: 依使用者 `13:51` 豁免與 `14:08` 實測回報「縮放拖拉幾次網頁沒反應」，除改為極簡一鍵單選列與 36×28 螢幕查表低 CPU 風場外，進一步修復 4 項記憶體／凍屏根因：RainViewer 圖層洩漏（13 層→上限 2 層）、移除根 `<App />` `move`/`zoom` 重繪改由 SVG 直連 DOM、YouTube 卸載 `about:blank` 釋放 MSE＋750ms 防抖、圖磚加 `updateWhenZooming: false`（紅線見 `COMPONENT_MAP.md`）。
- 驗證方式: `npm test` 12/12 過；`npm run build`（608ms）零錯；Chrome 14 秒連續輪播 DOM 實測 RainViewer 掛載層數 `2`（上限 `<=2`）、總圖磚 `76` 張、active iframe `4` 個；並推送經 GitHub Actions 驗證上線。
- 下一個 agent 該做什麼: 本次改動需要審閱：批次核對 `0ee8a5a..HEAD` v2 重構、單選狀態機、風場查表與 4 項記憶體修復。等待 `new session`／新工具審閱或使用者實測結案。
- 地雷警告: 嚴禁在 `<App />` 綁 `move`/`zoom` `setState` 或累積 >2 層 RainViewer TileLayer；CartoDB 圖磚有浮水印禁切回。

### 2026-11-20 12:13 [build] 使用工具: Antigravity

- 完成了什麼: 使用者於 `2026-11-20 11:52` 簽結 `0ee8a5a`、定案並切 `[build]`（保留舊版），已覆蓋基準為 `0ee8a5a` 並完成 v2 路線 A Phase 1–4 全量建置（原單檔保存於 `public/legacy.html`）。為何改：升級高效能 100% GitHub Free 颱風戰情室（細節與 Carto 浮水印踩坑詳 `COMPONENT_MAP.md`）。
- 驗證方式: `npm test` 12/12 過；`npm run build`（`tsc` + Vite 611ms）含 `dist/legacy.html`；`npm run check:webcams` 56/56 `200 OK`；`git check-ignore -v node_modules dist` 命中；Chrome 1440×900/520×844 實機截圖驗收無浮水印與排版正常。
- 下一個 agent 該做什麼: 本次改動需要審閱：核對 `0ee8a5a..HEAD` v2 結構、56 筆 `webcams.json` 與 `legacy.html` 一致性、CI workflow 與 `COMPONENT_MAP.md`。等待 `new session`／新工具審閱（或使用者簽結後決定是否 `git push`）。
- 地雷警告: Node 在 `/opt/homebrew/bin`；禁未指示 `git push`；CartoDB 圖磚已有浮水印切勿切回。

### 2026-11-20 09:21 [plan] 使用工具: Antigravity

- 完成了什麼: 依使用者指示切至 `[plan]`，補建 `COMPONENT_MAP.md` 遷移非衰減事實與外部資源實測台帳，並於 B 區完成「100% GitHub Free 炫砲颱風戰情室（路線 A）」完整規劃（待定案）。為何改：啟動大改版規劃並落實 Online v13 三檔分流（實測與決策依據見 `COMPONENT_MAP.md`）。
- 驗證方式: `git config --get core.hooksPath`=`scripts/hooks`；`curl -sI` 實測 CWA 8 圖 `200 OK` 無 CORS、Open-Meteo 與 RainViewer `200 OK` 且 CORS `*`、YouTube oEmbed `200 OK`；`COMPONENT_MAP.md` < 16 KB、C 區 < 10 KB；未改程式碼。
- 下一個 agent 該做什麼: 本次改動需要審閱：核對 `COMPONENT_MAP.md` 僅含已驗證事實且無漏遷、確認 `LLM_MEMORY.md` B 區規劃符合 GitHub Free 紅線與憲法規範且未誤改程式碼。等待 `new session`／新工具審閱，並待使用者確認 B 區待決項標記〈已定案〉與切換 `[build]` 後開工。
- 地雷警告: CWA 圖資無 CORS 標頭禁以 WebGL 跨網域貼圖直連；B 區未標〈已定案〉前嚴禁動碼。

### 2026-11-18 19:39 [maintain] 使用工具: Antigravity

- 完成了什麼: 使用者於 2026-11-18 19:39 明示「我看過結案」，依 §2.1 正式簽結 v12／Online v13 憲法升級，自〈阻塞點〉移除並覆蓋交接基準為 `2f921c1`。
- 驗證方式: `git diff --name-only` 僅異動 `LLM_MEMORY.md`；純記憶更新免新審閱；C 區 `< 10 KB`。
- 下一個 agent 該做什麼: 無（等待下一項工作宣告；已覆蓋基準為 `2f921c1`）。
- 地雷警告: 無

### 2026-11-18 16:01 [maintain] 使用工具: Antigravity

- 完成了什麼: 依使用者指示將本目錄 `AGENTS.md` 自 Online v12 整份覆蓋升級至 v13（無模板外自訂規則；覆蓋前 hash `62e133a`）。為何改：同步全 12 專案憲法至 v13。
- 驗證方式: `head -n 2 AGENTS.md` 為 `Playbook-Version: 13` 與 `Playbook-Variant: online`，全文與 `Andy_AI_AGENT_WorkFlow/AGENTS.md` 一致。
- 下一個 agent 該做什麼: 本次改動需要審閱：對照 Online v13 模板確認條文一致且 A 區進行中任務未遭改寫；並於〈阻塞點〉續列前次待審。等待 `new session` 審閱。
- 地雷警告: 無

### 2026-10-28 11:39 [maintain] 使用工具: Cursor Grok 4.7

- 完成了什麼: 使用者指示把本目錄 AGENTS.md 從 online v11 整份覆蓋成 v12。與其他 v11 檔內容相同，沒有模板外自訂規則。覆蓋前 hash 61eef4a。
- 驗證方式: 讀檔首兩行是 Playbook-Version: 12 與 Playbook-Variant: online，且有「## 6. 對人訂正」。
- 下一個 agent 該做什麼: 本次改動需要審閱：對照 v12 模板，確認條文一致且 A 區進行中任務沒被改寫。等待新 session／新工具審閱。
- 地雷警告: 無


### 2026-10-22 11:15 [maintain] 使用工具: Cursor Auto

- 完成了什麼: 依 AI_AGENT_Playbook_Online.md 將本目錄 AGENTS.md 自 v10 整份覆蓋升級至 v11（online）。覆蓋前 AGENTS.md hash: 8e6860a（可用 `git show .md` 找回）。v11 重點：§0 接手環境自檢／驗證方式必填／待審下壓保護；§2.1 使用者簽結與批次審閱。
- 驗證方式: 讀檔確認開頭 `<!-- Playbook-Version: 11 -->` 與 `<!-- Playbook-Variant: online -->`；內容含「接手環境自檢」「驗證方式」「待審下壓」「使用者簽結」。
- 下一個 agent 該做什麼: 無（純憲法升級；若接手請依 §0 做 hooksPath 自檢）
- 地雷警告: 無


### 2026-09-14 10:20 [maintain] 使用工具: Antigravity

- 完成了什麼: 依使用者指示，將 AGENTS.md 升級至 Playbook v10（三層架構規範、防膨脹門檻改為 10KB、單筆長度上限約 1200 bytes、Review Loop 排除 COMPONENT_MAP.md）。
- 下一個 agent 該做什麼: 使用者明示推送到 GitHub（豁免本次審閱）。請後續接手的 agent 依各自專案階段推進任務。
- 地雷警告: 無

### 2026-08-25 16:04 [maintain] 使用工具: Claude Code

- 完成了什麼: 依使用者指示，將 `AGENTS.md` 整份覆蓋升級至 Playbook v9（原版本 v2）。改動摘要：新增「交接基準 commit」欄位與其填寫規則、覆蓋前後順序規定（§2）；新增 §2.1 Review Loop 審閱提示機制；新增 §4「作用範圍僅限本檔所在目錄」巢狀邊界規則；新增語言與編碼規範明文（UTF-8／繁體中文）；新增 `Playbook-Variant: online` 標記。舊版 AGENTS.md（v2，commit `e36fac6`）已存於 git 歷史，可用 `git show e36fac6:AGENTS.md` 找回，不再另外存檔。同時將 `scripts/hooks/pre-commit`／`commit-msg` 整份覆蓋至 v9 版本（中文檔名相容、管轄錨點收斂避免死鎖、大量檔案效能優化、commit-msg 白名單合併/還原訊息等修正），並確認 `.gitattributes` 已含 `scripts/hooks/* text eol=lf`。同步將〈A. 目前狀態〉的「最新 commit」欄改名為「交接基準 commit」（Playbook v3 起的欄位語意變更：只在接手時填一次、工作期間不再更動，不再是「做到哪」），並填入當下 HEAD。
- 下一個 agent 該做什麼: 本次改動需要審閱：確認 v9 新規則（尤其 §2.1 Review Loop 與 §4 巢狀邊界）是否符合本專案實際工作模式，並確認 hook 版本升級後 commit 仍正常通過。
- 地雷警告: 無

### 2026-07-06 18:30 [maintain] 使用工具: Claude Haiku

- 完成了什麼: 導入 Playbook v2 工作流系統。覆蓋 AGENTS.md 至 v2 版本（引入 §2.1 Review Loop、交接日誌書寫規範、§4 Git Hook 強制約束）；遷移舊 AGENTS.md §5 的技術脈絡值至 LLM_MEMORY.md E 區；建立 scripts/hooks/{pre-commit,commit-msg}；執行 `git config core.hooksPath scripts/hooks` 啟用。
- 下一個 agent 該做什麼: 無

---

> 專案技術脈絡（建置、測試、部署與程式碼慣例）依 `AGENTS.md` §5 統一維護於 `COMPONENT_MAP.md`。
