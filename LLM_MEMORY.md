# LLM_MEMORY.md — 工作記憶 (Taiwan Web Cam War Room)

此檔案為跨 LLM、跨機器、跨平台的協作記憶庫。主要紀錄專案架構、技術細節、已實現功能、已知限制與後續開發方向，供後續接手的 AI 助手快速理解上下文。

## A. 目前狀態（每次交接必更新）

- 目前階段: **[build]**
- 最後更新: 2026-11-26 08:54 / 當時階段: build
- 交接基準 commit: e5960d7 [maintain] 自動巡檢更新鏡頭健康狀態
- 進行中任務: v2 颱風戰情室（56 支 YouTube 鏡頭君）已審結上線；本機 `.env` 已配置 TDX API Key（僅本機離線建表用、不進版控／前端），完成全台監視器資料源調查與點數估算（詳見 `COMPONENT_MAP.md`）。待使用者確認是否切 `[plan]` 啟動下一期「全台道路 CCTV 整合」。
- 待辦事項（下一期草案，尚未定案，動碼前請先確認階段與方案）:
  1. **離線全台 CCTV 建表與盤點腳本（~0.02 點）**：本機讀取 `.env` 整合「高公局國道 XML（1,935 支，0 點）＋公路局省道 XML（2,354 支，0 點）＋TDX 22 縣市市區／縣道（開 `gzip`、每 15 秒 1 縣避 `5 次/分` 限流）」，裁切產出只含 `id / name / county / lat / lng / url / snapshotUrl / provider / source` 的純靜態檔（如 `public/cctv-roads.json`），同步盤點各縣市支數、HTTPS 相容性（過濾或標記純 `http://` 混合內容）、串流格式（MJPEG／HLS／Snapshot）與空縣市名單。
  2. **多串流播放器擴充**：於 `VideoCard.tsx`、`FocusTheaterModal.tsx` 依 `stream.provider` 分流，補上 MJPEG 元件（縮圖優先、開播 `<img src>`、卸載清 `src=''` 釋放連線防佔滿同網域連線上限）與必要時 HLS 支援，外連亦改依 `provider` 導向。
  3. **數千點位地圖分層與拆檔效能設計**：保留 `src/data/webcams.json`（56 支 YouTube 鏡頭君）與每日 `check-webcams.mjs` 巡檢不變；道路 CCTV 獨立拆檔按需載入，設計「道路監視器開關」與 `zoom >= 11` 視野渲染／抽稀，避免全島視角紅海與 `WarRoomMap` 全表 `forEach` 拖慢。
  4. **低耗點維護策略**：平時瀏覽與看畫面全走本機靜態表直連原主機（0 點）；單支失效僅單縣刷新（`~0.0007 點`），全盤僅季更或半年更（年耗 `< 0.08 點`）。
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

### 2026-11-26 08:54 [build] 使用工具: Antigravity

- 完成了什麼: 完成全台道路監視器調查、點數估算、本機 `.env` 複製與記憶待辦建檔：(1) 將高公局國道（1,935 支）／公路局省道（2,354 支）／TDX 彰化（121 支）實測台帳、省點估算與 5 項整合檢核寫入 `COMPONENT_MAP.md`；(2) 複製 `buswatch/.env` 至本倉 `.env`（`600`）；(3) 覆蓋交接基準為 `e5960d7`、寫入 A 區 4 項待辦，並封存 `2026-07`～`11-18` 舊日誌入 D 區。為何改：承接全台 CCTV 調查並交接至本倉（明細見 `COMPONENT_MAP.md`）。
- 驗證方式: `git check-ignore -v .env` 命中 `.gitignore:9:.env`、`.env` `600` 且 `cmp -s` 一致；三來源均實測 `HTTP 200`；`COMPONENT_MAP.md` 12.5 KB、C 區 < 6 KB、本筆 < 1200 B。
- 下一個 agent 該做什麼: 本次改動需要審閱：核對 `COMPONENT_MAP.md` 台帳僅存已驗證事實與 D 區封存無漏。等待 `new session` 審閱，並請使用者決定是否切 `[plan]` 啟動待辦 1。
- 地雷警告: 自檢 `core.hooksPath` 原為空，已依 §0 設為 `scripts/hooks` 並 `chmod +x`；禁將 `.env` 入版控或於前端讀 `TDX_*`。

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

## D. 已封存結論（唯讀）

- **2026-07-06 ～ 2026-11-18（Playbook 工作流演進與簽結）**：本倉自 Playbook v2 導入 Git Hooks（`scripts/hooks/{pre-commit,commit-msg}`）後，歷經 v9／v10／v11／v12 逐步升級至 Online v13（三檔分流、10 KB／16 KB 門檻與 §2.1 雙軌結案），並於 `2026-11-18 19:39` 經使用者明示簽結（`2f921c1`）。相關長期規則與 hook 實況皆已留存於 `AGENTS.md` 與 `COMPONENT_MAP.md`。

---

> 專案技術脈絡（建置、測試、部署與程式碼慣例）依 `AGENTS.md` §5 統一維護於 `COMPONENT_MAP.md`。
