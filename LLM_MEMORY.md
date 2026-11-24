# LLM_MEMORY.md — 工作記憶 (Taiwan Web Cam War Room)

此檔案為跨 LLM、跨機器、跨平台的協作記憶庫。主要紀錄專案架構、技術細節、已實現功能、已知限制與後續開發方向，供後續接手的 AI 助手快速理解上下文。

## A. 目前狀態（每次交接必更新）

- 目前階段: **[build]**
- 最後更新: 2026-11-24 14:07 / 當時階段: maintain
- 交接基準 commit: e5960d7 [maintain] 自動巡檢更新鏡頭健康狀態
- 進行中任務: `0ee8a5a..3de418e` v2 重構、極簡單選氣象列、風場瘦身與 4 項記憶體／凍屏修復已審閱與實測通過，待使用者確認結案或交付新需求
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

### 2026-11-24 14:07 [maintain] 使用工具: Antigravity (Gemini 4 Neon)

- 完成了什麼: 依使用者「12全區佈署」指示將本目錄 `AGENTS.md` 自 Online v13 整份覆蓋升級至 v14（無模板外自訂規則；覆蓋前 hash `2f921c1`）；依 §0 將 2026-07-06～10-22 四筆純工作流升級舊日誌壓縮入 D 區使 C 區低於 10 KB；無待審已覆蓋交接基準為 `e5960d7`。為何改：全 12 倉同步 Online v14 憲法。
- 驗證方式: `head -n 2 AGENTS.md` 為 `Playbook-Version: 14` 與 `Playbook-Variant: online`，全文 `10,191 B`/89 行與 `Andy_AI_AGENT_WorkFlow/AGENTS.md` 逐位元組一致。
- 下一個 agent 該做什麼: 本次改動需要審閱：對照 Online v14 模板確認條文一致且 A 區進行中任務未遭改寫與舊日誌壓縮無遺失。等待 `new session`（或 `/clear` 清空 `context`，建議換模型）審閱。
- 地雷警告: 未 push；依 §2.1 本 `context` 禁自審。

### 2026-11-20 16:29 [build] 使用工具: Antigravity

- 完成了什麼: 依 §2.1 完成 `0ee8a5a..3de418e` 批次審閱與獨立實測：確認架構符合 `COMPONENT_MAP.md`、單選互斥與風場查表及 4 項防凍屏紅線（RainViewer `<=2` 層、無根元件 `move`/`zoom` `setState`、750ms 防抖＋`about:blank` 卸載、圖磚 `updateWhenZooming: false`）全數落實，`public/legacy.html` 與 `webcams.json` 56 筆 100% 一致；已覆蓋交接基準為 `3de418e`。
- 驗證方式: `npm test` 12/12 過；`npm run build` 610ms 零錯（含 `dist/legacy.html` 51K）；`diff` 比對 `0ee8a5a:index.html` 與 `public/legacy.html` 零差異、`webcams.json` 56/56 吻合；`git check-ignore -v node_modules dist` 命中；`vite preview` + Headless Chrome 實測桌機(1440×900)與手機(390×844)零 JS 例外、單選切換正確、縮放壓測後 RainViewer `2` 層／圖磚 `84` 張／iframe `4` 個、`?debug=calib` 與 `/legacy.html` HTTP 200 正常。
- 下一個 agent 該做什麼: 無（待使用者確認結案或交付新需求；可順手留意 `ConnectorOverlay` 若初始 `slots` 為 0 才掛載地圖之邊角情況）。
- 地雷警告: 無（維持禁在 `<App />` 綁 `move`/`zoom` `setState` 與累積 >2 層 RainViewer）。

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


## D. 已封存結論（自〈交接日誌〉壓縮搬入，唯讀）

> 2026-11-24 壓縮 2026-07-06～2026-10-22 四筆純工作流導入／升版舊日誌（專案技術脈絡與環境實測台帳均已完整載於同目錄 `COMPONENT_MAP.md`）：
> - 2026-07-06：導入 Playbook v2 工作流並安裝啟用 `scripts/hooks/*`。
> - 2026-08-25：升級 Playbook Online v9（覆蓋前 hash `e36fac6`）、更新 `scripts/hooks/*`、補 `.gitattributes`（`eol=lf`）與遷移「交接基準 commit」。
> - 2026-09-14、2026-10-22：依序升級 Playbook Online v10 與 v11（覆蓋前 hash `8e6860a`）。

---

> 專案技術脈絡（建置、測試、部署與程式碼慣例）依 `AGENTS.md` §0 統一維護於 `COMPONENT_MAP.md`。
