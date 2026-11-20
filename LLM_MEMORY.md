# LLM_MEMORY.md — 工作記憶 (Taiwan Web Cam War Room)

此檔案為跨 LLM、跨機器、跨平台的協作記憶庫。主要紀錄專案架構、技術細節、已實現功能、已知限制與後續開發方向，供後續接手的 AI 助手快速理解上下文。

## A. 目前狀態（每次交接必更新）

- 目前階段: **[build]**
- 最後更新: 2026-11-20 12:13 / 當時階段: build
- 交接基準 commit: 0ee8a5a [plan] 補建 COMPONENT_MAP 並完成路線 A 炫砲戰情室大改版規劃
- 進行中任務: v2 路線 A「GitHub Free 炫砲戰情室」Phase 1–4 全量建置與視覺驗收完成（等待審閱與使用者決定是否推送部署）
- 阻塞點: 無

> 長期架構、已校正氣象座標、外部資源實測台帳（含 Carto 浮水印踩坑與 Esri/NLSC 替代方案）與建置部署實況已更新於 `COMPONENT_MAP.md`。

---

## B. 路線 A 大改版規劃（〈已定案〉 — v2 建置完成）

- **定案授權**：使用者於 `2026-11-20 11:52` 親自簽結 `0ee8a5a`，核准納入「3 張免費底圖切換＋6 層戰情三明治＋保留舊版 `public/legacy.html`」，並授權標記〈已定案〉切換 `[build]` 開工。
- **里程碑完成進度**：
  - [x] **Phase 1**：Vite 6 + React 19 + TS + Tailwind v4 + Zustand 初始化；56 支鏡頭完整遷移 `src/data/webcams.json`（與 `public/legacy.html` 100% 吻合）；`src/core/` 純演算法＋Vitest 12 項單元測試通過；升級 `.github/workflows/static.yml`。
  - [x] **Phase 2**：6 層戰情三明治 Leaflet 地圖（實圖驗收改採零浮水印 Esri Dark/Imagery＋國土測繪中心 NLSC EMAP/EMAP2 繁中置頂地名）；RainViewer 2 小時動態雨帶時間軸＋CWA 8 圖層多疊加／發光濾色／10 分鐘雙緩衝刷新；Open-Meteo 動態風場粒子流線；單一扁平 Keyed 零重載影片牆；45° 脈衝雷射線＋聲納鎖定環；YouTube Iframe API `onError` 遞補。
  - [x] **Phase 3**：頂部 Tactical HUD（台北時鐘、搜尋、颱風情境快捷、4/6/8 格與省電切換、釘選 Pin、劇院大畫面、即時風雨遙測角標、Kiosk 壁掛模式、URL 分享、舊版連結）；手機版三段式 Bottom Sheet。
  - [x] **Phase 4**：Lazy-load `?debug=calib` 校正抽屜、`scripts/check-webcams.mjs` 與 `.github/workflows/webcam-health.yml` 每日巡檢、無頭 Chrome 桌機與行動端視覺實測驗證、`README.md` 與 `COMPONENT_MAP.md` 同步更新。

---

## C. 交接日誌(只追加,不刪改;最新在最上,每筆一個小節)

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
