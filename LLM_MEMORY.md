# LLM_MEMORY.md — 工作記憶 (Taiwan Web Cam War Room)

此檔案為跨 LLM、跨機器、跨平台的協作記憶庫。主要紀錄專案架構、技術細節、已實現功能、已知限制與後續開發方向，供後續接手的 AI 助手快速理解上下文。

## A. 目前狀態（每次交接必更新）

- 目前階段: **[build]**
- 最後更新: 2026-11-27 21:45 / 當時階段: build
- 交接基準 commit: e5960d7 [maintain] 自動巡檢更新鏡頭健康狀態
- 進行中任務: v2 颱風戰情室（56 支 YouTube 鏡頭君）已審結上線；本機 `.env` 已配置 TDX API Key（僅本機離線建表用、不進版控／前端），完成全台監視器資料源調查與點數估算（詳見 `COMPONENT_MAP.md`）。待使用者確認是否切 `[plan]` 啟動下一期「全台道路 CCTV 整合」。
- 待辦事項（下一期草案，尚未定案，動碼前請先確認階段與方案）:
  1. **離線全台 CCTV 建表與盤點腳本（~0.02 點）**：本機讀取 `.env` 整合「高公局國道 XML（1,935 支，0 點）＋公路局省道 XML（2,354 支，0 點）＋TDX 22 縣市市區／縣道（開 `gzip`、每 15 秒 1 縣避 `5 次/分` 限流）」，裁切產出只含 `id / name / county / lat / lng / url / snapshotUrl / provider / source` 的純靜態檔（如 `public/cctv-roads.json`），同步盤點各縣市支數、HTTPS 相容性（過濾或標記純 `http://` 混合內容）、串流格式（MJPEG／HLS／Snapshot）與空縣市名單。
  2. **多串流播放器擴充**：於 `VideoCard.tsx`、`FocusTheaterModal.tsx` 依 `stream.provider` 分流，補上 MJPEG 元件（縮圖優先、開播 `<img src>`、卸載清 `src=''` 釋放連線防佔滿同網域連線上限）與必要時 HLS 支援，外連亦改依 `provider` 導向。
  3. **數千點位地圖分層與拆檔效能設計**：保留 `src/data/webcams.json`（56 支 YouTube 鏡頭君）與每日 `check-webcams.mjs` 巡檢不變；道路 CCTV 獨立拆檔按需載入，設計「道路監視器開關」與 `zoom >= 11` 視野渲染／抽稀，避免全島視角紅海與 `WarRoomMap` 全表 `forEach` 拖慢。
  4. **低耗點維護策略**：平時瀏覽與看畫面全走本機靜態表直連原主機（0 點）；單支失效僅單縣刷新（`~0.0007 點`），全盤僅季更或半年更（年耗 `< 0.08 點`）。
- 阻塞點:
  - 2026-11-26 09:00 待審下壓（基準 `e5960d7..dbf1fc8`）：核對 v15 升級、`COMPONENT_MAP.md` CCTV 台帳與 `LLM_MEMORY.md` 合併無漏
> 長期架構、已校正氣象座標、外部資源實測台帳（含 Carto 浮水印踩坑與 Esri/NLSC 替代方案）與建置部署實況已更新於 `COMPONENT_MAP.md`。
  - 2026-11-27 10:11 需要審閱（基準 `e5960d7..HEAD`）：
    ### 2026-11-27 10:11 [maintain] Antigravity (Gemini 4 Neon)

    - 完成了什麼: 依 user「推 全倉 套WF」將本 dir `AGENTS.md` 自 Online v16 整份覆蓋升至 v17（§5 禁假優缺點＋§1 `[build]` PDCA Act 閉環；無模板外自訂規則；覆蓋前 hash `8a3a517`）；原首筆待審依 §0 下壓入〈阻塞點〉並守原交接基準。為何改：全 8 倉同步 Online v17 憲法（D41）。
    - 驗證方式: `head -n 2 AGENTS.md` 為 `Playbook-Version: 17`/`Playbook-Variant: online`，全文 `12,791 B`/93 行與母倉逐 byte 一致；日誌 `<10 KB`、本檔 `<16 KB`、本筆 `<=1200 B`。
    - 下一個 agent 該做什麼: 本次改動需要審閱：`git diff e5960d7..HEAD` 核對 Online v17 條文一致且 A 區進行中任務未改寫。等待 new session（或 `/clear` 清空 context，建議換模型）審閱。
    - 地雷警告: 依 user 明示同步後 push；依 §2.1 本 context 禁自審。
  - 2026-11-27 14:50 需要審閱（基準 `e5960d7..HEAD`）：
    ### 2026-11-27 14:50 [build] Antigravity (Gemini 4 Neon)

    - 完成了什麼: 依 user「開工 做完再推」將本倉全部工作流同步至 Online v19（D45 純憲法同步免寫記憶）並更新 `scripts/hooks/pre-commit`；依 user 指示清理 v10～v18 純升版洗版日誌與假下壓（保留全部實質專案紀錄與待審）。
    - 驗證方式: `AGENTS.md`（13,590 B/95L）與 `scripts/hooks/pre-commit` 與母倉逐 byte 一致；`workflow_scan` v19 clean、`check_hooks` OK、記憶檔全合規。
    - 下一個 agent 該做什麼: 本次改動需要審閱：核對 `scripts/hooks/pre-commit` 與記憶清理未傷任何專案待審（日後純同步憲法不再觸碰記憶檔）。等待 new session 審閱。
    - 地雷警告: 依 user 明示驗證後推送（D42，push≠審結）；禁自審。
---

## B. 路線 A 大改版規劃（〈已定案〉 — v2 建置完成）

- **定案授權**：使用者於 `2026-11-20 11:52` 親自簽結 `0ee8a5a` 並切 `[build]`；於 `2026-11-20 13:51` 明示豁免中途審閱並拍板 UX 簡化為「氣象圖層嚴格單選互斥（點啥顯示啥、其他全關）＋動態風場獨立開關＋底圖一鍵循環」。
- **里程碑完成進度**：
  - [x] **Phase 1–4**：Vite 6 + React 19 + TS + Tailwind v4 + Zustand + Leaflet 6 層三明治全量落地，舊版原樣保存於 `public/legacy.html`。
  - [x] **UX 簡化與風場大瘦身**：移除 `WeatherDrawer` 多層疊加與手動透明度滑桿，改為底部 `WeatherQuickBar` 一鍵單選列；`WindFlowCanvas` 改採 36×28 螢幕空間預計算網格＋5 色桶批次描邊＋30fps＋分頁隱藏暫停。

---

## C. 交接日誌(只追加,不刪改;最新在最上,每筆一個小節)

### 2026-11-27 21:45 [build] Antigravity (Gemini 4 Hydrogen)

- 完成了什麼: 依 `1A` 從母倉(`36e5a6a`)同步修復 macOS Bash 3.2.57 相容之 `scripts/hooks/pre-commit`（抽 `is_exempt_const_file()`），依 §0 下壓 `14:50` 待審入〈阻塞點〉並守原基準 `e5960d7`。為何改：修 macOS `/bin/sh` 語法錯。
- 驗證方式: `cmp -s` 與母倉 `pre-commit` 一致(6,143 B)；`/bin/sh -n` 過；`hooksPath=scripts/hooks`；`<16KB`/`<10KB`/`<=1200B`。
- 下一個 agent 該做什麼: 本次改動需要審閱：`git diff d1bda39..HEAD -- scripts/hooks/pre-commit` 核與母倉一致並併審〈阻塞點〉。等待 new session（或 `/clear` 清空 context）審閱。
- 地雷警告: 依 1A 帶待審推遠端(D42，push≠審結)；禁自審。

### 2026-11-27 14:50 [build] Antigravity (Gemini 4 Neon)

- 完成了什麼: 依 user「開工 做完再推」將本倉全部工作流同步至 Online v19（D45 純憲法同步免寫記憶）並更新 `scripts/hooks/pre-commit`；依 user 指示清理 v10～v18 純升版洗版日誌與假下壓（保留全部實質專案紀錄與待審）。
- 驗證方式: `AGENTS.md`（13,590 B/95L）與 `scripts/hooks/pre-commit` 與母倉逐 byte 一致；`workflow_scan` v19 clean、`check_hooks` OK、記憶檔全合規。
- 下一個 agent 該做什麼: 本次改動需要審閱：核對 `scripts/hooks/pre-commit` 與記憶清理未傷任何專案待審（日後純同步憲法不再觸碰記憶檔）。等待 new session 審閱。
- 地雷警告: 依 user 明示驗證後推送（D42，push≠審結）；禁自審。

### 2026-11-26 09:00 [build] Antigravity

- 完成了什麼: 完成全台道路 CCTV 調查、`.env` 複製（`600`）、待辦與台帳建檔（`COMPONENT_MAP.md`），並依 user 指示 push 前 `merge origin/main`（`117ed89`，收下 Online v15 `AGENTS.md` 與 `public/health.json`）；`LLM_MEMORY.md` 採語意合併留雙方日誌降序重排、將 `11-24` v15/v14 待審下壓〈阻塞點〉並封存 `2026-07`～`11-18` 舊日誌入 D 區。為何改：交接 CCTV 調查並同步遠端後推送（詳 `COMPONENT_MAP.md`）。
- 驗證方式: `git check-ignore -v .env` 命中 `.gitignore:9:.env`、`.env` 未進版控；國道/省道 XML 與 TDX `ChanghuaCounty` 實測 `200 OK`；Python 驗無衝突標記、`LLM_MEMORY.md` < 16 KB、`COMPONENT_MAP.md` 12.5 KB、C 區 < 10 KB、本筆 < 1200 B。
- 下一個 agent 該做什麼: 本次改動需要審閱：`git diff e5960d7..HEAD` 批次核對 v15 升級、`COMPONENT_MAP.md` CCTV 台帳與 `LLM_MEMORY.md` 合併無漏。等待 new session（或 `/clear` 清空 context，建議換模型）審閱，再由 user 決定是否切 `[plan]`。
- 地雷警告: 自檢原 `core.hooksPath` 空已設 `scripts/hooks` 並 `chmod +x`；禁 `.env` 入版控或前端讀 `TDX_*`。

### 2026-11-24 14:07 [maintain] 使用工具: Antigravity (Gemini 4 Neon)

- 完成了什麼: 依使用者「12全區佈署」指示將本目錄 `AGENTS.md` 自 Online v13 整份覆蓋升級至 v14（無模板外自訂規則；覆蓋前 hash `2f921c1`）；依 §0 將 2026-07-06～10-22 四筆純工作流升級舊日誌壓縮入 D 區使 C 區低於 10 KB；無待審已覆蓋交接基準為 `e5960d7`。為何改：全 12 倉同步 Online v14 憲法。
- 驗證方式: `head -n 2 AGENTS.md` 為 `Playbook-Version: 14` 與 `Playbook-Variant: online`，全文 `10,191 B`/89 行與 `Andy_AI_AGENT_WorkFlow/AGENTS.md` 逐位元組一致。
- 下一個 agent 該做什麼: 本次改動需要審閱：對照 Online v14 模板確認條文一致且 A 區進行中任務未遭改寫與舊日誌壓縮無遺失。等待 `new session`（或 `/clear` 清空 `context`，建議換模型）審閱。
- 地雷警告: 未 push；依 §2.1 本 `context` 禁自審。

## D. 已封存結論（自〈交接日誌〉壓縮搬入，唯讀）

> - 2026-11-20 09:21～16:29（已於 16:29 審結，基準 `3de418e`，紅線與實測台帳存 `COMPONENT_MAP.md`）：完成 v2 路線 A 颱風戰情室 Phase 1–4 建置（舊單檔存 `public/legacy.html`、56 支鏡頭）、單選互斥氣象列與 36×28 查表低 CPU 風場、4 項防凍屏修復（RainViewer `<=2` 層、禁 `<App />` `move`/`zoom` `setState`、750ms 防抖＋`about:blank` 卸載、`updateWhenZooming: false`），`npm test` 12/12 與 Headless Chrome 桌機／手機壓測全過。
> 2026-11-24 / 2026-11-26 壓縮 2026-07-06～2026-11-18 純工作流導入／升版與簽結舊日誌（專案技術脈絡與環境實測台帳均已載於 `COMPONENT_MAP.md`）：
> - 2026-07-06：導入 Playbook v2 工作流並安裝啟用 `scripts/hooks/*`。
> - 2026-08-25：升級 Playbook Online v9（覆蓋前 hash `e36fac6`）、更新 `scripts/hooks/*`、補 `.gitattributes`（`eol=lf`）與遷移「交接基準 commit」。
> - 2026-09-14、2026-10-22、2026-10-28：依序升級 Playbook Online v10、v11（覆蓋前 `8e6860a`）與 v12（覆蓋前 `61eef4a`）。
> - 2026-11-18：升級 Playbook Online v13（覆蓋前 `62e133a`），並於同日 19:39 經使用者明示簽結（`2f921c1`）。

---

> 專案技術脈絡（建置、測試、部署與程式碼慣例）依 `AGENTS.md` §0 統一維護於 `COMPONENT_MAP.md`。
