# LLM_MEMORY.md — 工作記憶 (Taiwan Web Cam War Room)

此檔案為跨 LLM、跨機器、跨平台的協作記憶庫。主要紀錄專案架構、技術細節、已實現功能、已知限制與後續開發方向，供後續接手的 AI 助手快速理解上下文。

## A. 目前狀態（每次交接必更新）

- 目前階段: **[plan]**
- 最後更新: 2026-11-20 09:21 / 當時階段: plan
- 交接基準 commit: 86533ca [maintain] 依 §2.1 記錄使用者簽結並更新交接基準
- 進行中任務: 路線 A「GitHub Free 炫砲颱風戰情室」大改版規劃（已寫入 B 區，待審閱與使用者拍板〈已定案〉）
- 阻塞點: 待使用者審閱拍板 B 區規劃（確認可標記〈已定案〉並授權切換 `[build]`）

> 長期架構、已校正氣象座標、外部資源實測台帳與建置部署實況已分流至 `COMPONENT_MAP.md`。

---

## B. 路線 A 大改版規劃（待定案 — 未標〈已定案〉前禁改程式碼）

### 1. 最高指導原則與核心情境
- **零成本部署紅線**：100% 部署於 GitHub Free（GitHub Pages + GitHub Actions），零付費後端、零付費 API Key。
- **核心情境**：颱風／豪雨時點開網頁即刻掌握全台風雨動態與即時現場鏡頭，體驗取向為 **「怎麼炫怎麼來」的次世代 Tactical Weather HUD 戰情室**，同時徹底根治舊版卡頓與難擴充問題。

### 2. 推薦技術棧（100% 靜態打包部署至 GitHub Pages）
- **核心架構**：Vite + React 19 + TypeScript (Strict) + Tailwind CSS + Zustand（含 LocalStorage 持久化）+ Lucide Icons。
- **地圖引擎**：Leaflet 1.9.4（`preferCanvas: true`）+ CartoDB Dark Matter 底圖（保留切換底圖介面）。採 Leaflet 主因實測 CWA 8 圖資無 CORS 標頭（詳 `COMPONENT_MAP.md`），DOM `<img>` 可零 Proxy 直連並無痛延續 5 組已校正座標；另封裝 `MapAdapter` 介面預留擴充。
- **測試與 CI/CD**：Vitest（核心演算法單元測試）+ Playwright（桌機/手機 RWD 與連線回歸測試）；`.github/workflows/static.yml` 升級為自動建置並部署 `./dist`（Vite 設定 `base: '/taiwan_web_cam/'`）。

### 3. 五大炫砲戰情核心亮點（全部依實測免費端點設計）
1. **🌪️ Windy 風格動態風場粒子流線層（Animated Wind Flow Canvas）**：
   - 以 Open-Meteo 免費批次 API（實測 CORS `*`）每 10 分鐘查詢台灣周邊 6×6 網格風速／風向，於 Leaflet 上疊加輕量 Canvas 2D 雙線性內插動態風場粒子流線（依風速從青→黃→橘紅→紫漸變；支援一鍵開關與密度切換），颱風逼近時可直觀看到氣旋流動。
2. **🎬 雙軌氣象圖層系統：2 小時動態雷達時間軸 ＋ CWA 官方高解析 8 圖層多疊加**：
   - **動態軌跡**：整合 RainViewer 公開雷達圖磚（實測過去 13 幀、CORS `*`、`maxNativeZoom: 7`），內建底部精簡時間軸播放／暫停／拖曳看雨帶移動。
   - **官方高解析疊圖**：保留原本 CWA 8 圖層（雷達／累積雨量／5 衛星／地面等壓圖），升級為**支援多圖層同時疊加、獨立透明度滑桿、Lazy Load、10 分鐘雙緩衝無感自動刷新（不閃白）、`referrerPolicy="no-referrer"`、附 dBZ/雨量色階圖例**。
3. **⚡ 45° 戰術脈衝雷射導引線 ＋ 聲納目標鎖定環**：
   - 以固定節點復用 SVG（`setAttribute` 更新＋`rAF` 節流，拿掉昂貴 `drop-shadow`）繪製 **45° 戰術折線（Tactical Elbow）** 與 CSS `stroke-dashoffset` 流動光點脈衝。
   - 影片卡片與地圖標記雙向 Hover 鎖定：高亮對應連線與地圖**聲納擴散鎖定環（Sonar Pulse Ring）**，其餘連線優雅退暗。
4. **📊 鏡頭即時風雨遙測角標 ＋ Kiosk 壁掛指揮模式**：
   - Open-Meteo 單次批次查顯示中鏡頭座標，於卡片角標顯示即時氣溫、風速／陣風（強陣風自動亮琥珀／紅警示）、降雨量。
   - 頂部 Tactical HUD 提供：台北即時戰情時鐘、地名/縣市搜尋、**颱風情境快捷篩選（🌊 沿海風浪／🏔️ 山區水庫／🌧️ 都會路況／🏝️ 離島／📌 只看釘選）**、URL 視角配置一鍵分享，以及 **Kiosk 壁掛純享模式**（一鍵隱藏控制列，適合掛副螢幕或大電視）。
5. **🚀 零重載高效能引擎 ＋ 雙層防黑屏 ＋ 手機版全新重做**：
   - **Keyed Zero-Reload 影片牆**：以 `cam.id`/`videoId` 為穩定 Key，配合 250ms 拖曳防抖，留任直播 0 重載；預設 **4 格活體直播＋縮圖點擊即播（Facade Pattern）**，一鍵切換 `4 / 6 / 8 格滿載` 與 150ms 錯峰掛載；每卡支援 **釘選 Pin（上限 4 支不被拖曳洗掉）、劇院大畫面 Focus、地圖平滑飛至定位**。
   - **雙層防黑屏**：前端接入 YouTube Iframe Player API 監聽 `onError` 自動切換備援 ID 或遞補下一順位；另設 GitHub Actions（`webcam-health.yml`）每日執行 `scripts/check-webcams.mjs` 產出 `public/health.json`。
   - **手機版重做（<= 1024px）**：廢除 `6px` 小字與夾心餅，改為「**滿版地圖 ＋ 底部三段式可滑動 Bottom Sheet**」（收合純看圖／半開橫滑卡片且最多同時播 2 支省電／全開搜尋與圖層控制）。

### 4. 目錄結構與資料 Schema
- `src/data/webcams.json`：完整遷移既有 52 支鏡頭，新增 `id`、`region`、`county`、`tags`、`stream: { provider: 'youtube', videoId, backupVideoIds }`（預留未來接 `hls`/`mjpeg` 公路局介面）。
- `src/data/weatherLayers.ts`：集中管理 CWA 8 圖層 URL、5 組校正邊界與圖例定義。
- `src/core/`：`cameraSelector.ts`、`spatialSorter.ts`、`urlSync.ts`（純函式 100% 單元測試）。
- `src/services/`：`youtubeApi.ts`、`openMeteo.ts`、`rainViewer.ts`、`weatherRefresher.ts`。
- `src/components/dev/CalibrationDrawer.tsx`：僅於 `?debug=calib` 或進階選單動態 Lazy Load，保留 5 組邊界校正與 JSON 複製。

### 5. 四階段落地里程碑（核准切 `[build]` 後執行）
- **Phase 1（骨架與資料遷移）**：初始化 Vite + React 19 + TS + Tailwind 專案、遷移 52 筆 `webcams.json` 與 `core/` 純演算法＋Vitest 單元測試、升級 `.github/workflows/static.yml` 支援自動打包部署。
- **Phase 2（地圖、雙軌氣象、動態風場與零重載引擎）**：實作 Leaflet Canvas 地圖、CWA 多圖層疊加與雙緩衝刷新、RainViewer 2 小時時間軸、Open-Meteo 動態風場流線 Canvas、Keyed Zero-Reload 影片牆、45° 脈衝雷射線＋聲納鎖定、YouTube API `onError` 遞補。
- **Phase 3（戰情 HUD、遙測、Kiosk 與手機 Bottom Sheet）**：完成頂部 HUD 搜尋／情境快捷鍵、釘選 Pin、劇院大畫面、卡片即時風雨遙測角標、Kiosk 模式、LocalStorage 偏好與 URL 分享、手機版三段式 Bottom Sheet。
- **Phase 4（校正工具、自動巡檢與驗收）**：Lazy-load 校正抽屜、GitHub Actions 每日鏡頭巡檢腳本、Playwright 桌機/手機冒煙測試、清理舊單檔與更新 `COMPONENT_MAP.md`／`README.md`。

### 6. 標記〈已定案〉前待使用者確認（有預設推薦值）
1. 框架：預設 **React 19 + TS**（或改 Vue 3）。
2. 首屏預設直播格數：預設 **4 格活體＋其餘縮圖點即播（可一鍵切 6/8 格）**（或改預設 8 格全播）。
3. 確認納入 **Windy 動態風場流線＋RainViewer 2 小時動態雷達＋GitHub Actions 每日鏡頭巡檢**。

---

## C. 交接日誌(只追加,不刪改;最新在最上,每筆一個小節)

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
