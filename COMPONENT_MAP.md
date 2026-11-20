# COMPONENT_MAP.md — 長期架構與契約地圖 (Taiwan Web Cam War Room)

> 編碼規範：UTF-8／繁體中文。本檔**僅存已驗證事實與已定案決策**，嚴禁寫入未驗證猜想與未定案討論；門檻上限 16 KB。

## 六十秒進入狀況

- **專案**：台灣即時影像戰情室（`https://github.com/lee18-in/taiwan_web_cam`｜Live：`https://lee18-in.github.io/taiwan_web_cam/`）。
- **核心目標**：結合台灣暗黑地圖、全台 56 處「鏡頭君」YouTube 即時影像、動態風場與雙軌氣象圖層，專為「颱風／豪雨時點開即掌握風雨與現場畫面」打造。
- **v2 現代化架構（路線 A，已落地）**：Vite 6 + React 19 + TypeScript (Strict) + Tailwind CSS v4 + Zustand (LocalStorage 持久化) + Leaflet 1.9.4 (`preferCanvas: true`)，編譯至 `./dist` 由 `.github/workflows/static.yml` 免費部署至 GitHub Pages。
- **舊版保留契約（使用者 2026-11-20 明示）**：原始 1,166 行單檔版本已原樣保存於 `public/legacy.html`（打包後於 `/taiwan_web_cam/legacy.html` 持續可用，頂部 HUD 具「舊版」切換連結）。
- **最高紅線**：100% 部署於 GitHub Free（GitHub Pages + Actions），零付費後端、零付費 API Key；視覺體驗採高張力戰情室規格。

---

## 一、v2 系統結構與跨模組契約

### 1. 6 層「戰情三明治」地圖分層（`src/components/map/WarRoomMap.tsx`）
| 層級 | Leaflet Pane / 層 | z-index | 內容與契約 |
|---|---|---|---|
| Layer 6 | `markerPane` + SVG Overlay | `440–450+` | Canvas 未入選紅點、活躍發光聲納標記、節點復用 45° 戰術脈衝雷射連線（`ConnectorOverlay.tsx`） |
| Layer 5 | `labels-overlay` | `380` | **內政部國土測繪中心 `NLSC EMAP2` 透明繁體中文地名與國道路網**（浮於所有雲圖與雷達之上，避免雨帶蓋字） |
| Layer 4 | `weather-wind` | `350` | `WindFlowCanvas.ts`（Open-Meteo 6×6 網格→36×28 螢幕查表、5 色桶批次描邊、30fps＋分頁隱藏暫停之低 CPU 動態風場流線；獨立開關） |
| Layer 3 | `weather-radar` | `320` | 嚴格單選互斥降水層：RainViewer 2 小時透明動態雨帶（`maxNativeZoom: 7`）或 CWA 雷達／累積雨量（依底圖自動配最佳透明度） |
| Layer 2 | `weather-cloud` | `300` | 嚴格單選互斥雲系層：CWA 5 種衛星雲圖或地面等壓天氣圖（自動配最佳透明度與 `mix-blend-mode: screen`） |
| Layer 1 | `tilePane` | `200` | 3 種免費無浮水印底圖循環切換（Esri 暗黑畫布、Esri 衛星實景、NLSC 台灣繁中電子地圖） |

### 2. 核心模組分工與契約
- **資料層**：`src/data/webcams.json`（完整遷移 56 筆，含 `id`/`region`/`county`/`tags`/`stream`，已以腳本比對 `public/legacy.html` 100% 吻合）、`src/data/mapLayers.ts`（3 底圖、8 CWA 圖層自動最佳透明度、5 組已校正邊界）。
- **極簡操作契約（使用者 2026-11-20 明示定案）**：廢除複雜圖層抽屜、多層疊加與手動透明度滑桿；由 `WeatherQuickBar.tsx` 採**嚴格單選互斥（「點啥顯示啥、其他全關」）**，唯獨「動態風場」維持獨立開關、「底圖」一鍵循環切換。
- **純演算法層（`src/core/`，100% Vitest 單元測試覆蓋）**：`cameraSelector.ts`（釘選優先上限 4 支＋`level` 升冪＋距離排序＋離線自動遞補＋遮擋排除）、`spatialSorter.ts`（左右牆均衡切分與北→南排序）、`connectorGeometry.ts`（45° 戰術折線）、`urlSync.ts`（分享連結編解碼）。
- **零重載影片牆（`DesktopVideoPool.tsx`）**：所有顯示中 `VideoCard` 維持於**單一扁平 React 清單（DOM 順序依 `cam.id` 字典序固定）**，透過 CSS `transform: translate3d(x,y,0)` 定位至左右牆格位，確保拖動地圖或跨牆換位時不觸發 `insertBefore` 與 YouTube iframe 重載。預設前 4 順位自動錯峰直播，其餘格位採縮圖延遲啟動（可切換全直播滿載）。
- **SVG 座標與行動端契約**：`ConnectorOverlay.tsx` 直接訂閱 Leaflet `move`/`zoom` 並以快取 `getBoundingClientRect()` ＋原生 DOM `setAttribute` 繪製（拖曳縮放期間 **0 次 React 重繪**，嚴禁在根元件 `<App />` 綁 `move`/`zoom` `setState`）；手機版（`<= 1024px`）採滿版地圖＋三段式 `MobileBottomSheet.tsx`（同時最多自動播 2 支省電）。
- **防凍屏／防記憶體洩漏硬性紅線（2026-11-20 實測修復）**：
  1. RainViewer 地圖同時掛載上限嚴格為 **2 層**（當前幀＋下一幀預載），切換時立即 `removeLayer` 舊幀並設 `keepBuffer: 0, updateWhenZooming: false`；拖曳縮放中暫停時間軸推進。
  2. 底圖與置頂地名層一律設 `keepBuffer: 1, updateWhenZooming: false, updateWhenIdle: true`。
  3. 視角鏡頭切換防抖須為 **750ms**（`movestart`/`zoomstart` 取消計時），且 `YouTubeLivePlayer` 卸載時先將子 `iframe.src = 'about:blank'` 再 `destroy()` 立即釋放 Chromium MSE 解碼記憶體；`VideoCard` 包裝 `React.memo`。
- **開發校正工具（`CalibrationDrawer.tsx`）**：採 `React.lazy` 動態載入，僅於 `?debug=calib` 或圖層面板入口載入；調整結果即時存 LocalStorage 並提供 JSON 複製。

### 3. 已校正 CWA 氣象疊圖邊界（`DEFAULT_CALIBRATION_BOUNDS`）
| 群組 | 對應 CWA 圖資 | 已校正邊界 `[[s, w], [n, e]]` |
|---|---|---|
| `radar` | 雷達回波 `CV1_TW_3600.png` | `[[20.455, 118.000], [26.480, 124.000]]` |
| `rainfall` | 累積雨量 `QZJ.jpg` | `[[21.505, 119.195], [25.900, 123.575]]` |
| `sat1350` | 衛星可見光／真實色 `1350` | `[[19.030, 115.925], [28.215, 126.070]]` |
| `sat800` | 衛星彩色／色調強化／黑白 `800` | `[[19.050, 115.935], [28.195, 126.055]]` |
| `sfc` | 地面等壓天氣圖 `SFCcombo.jpg` | `[[-0.340, 80.630], [56.690, 167.995]]` |

---

## 二、外部資源與環境驗證台帳（2026-11-20 實測）

| 對象 / 機制 | 實測結果 | 架構契約 / 踩坑結論 |
|---|---|---|
| **CartoDB Basemaps (`basemaps.cartocdn.com`)** | 雖回傳 `HTTP 200`，但**實機截圖揭露圖片已印上 `API KEY REQUIRED` 浮水印**（重大踩坑！） | **否決棄用**！全面改採下方經實圖檢視零浮水印之 Esri / NLSC 圖磚。 |
| **Esri Dark Gray Base & World Imagery** | `World_Dark_Gray_Base`、`World_Imagery` 實圖檢視純淨無浮水印、`200 OK`、免 Key | 採用為預設「暗黑戰情」與「衛星實景」底圖。 |
| **內政部國土測繪中心 `NLSC EMAP` & `EMAP2`** | 帶 GitHub Pages Referer 回 `200 OK`；`EMAP2` 實圖檢視為 RGBA 透明繁體中文縣市地名＋國道路網 | 採用 `EMAP` 為繁中底圖、`EMAP2` 為 Layer 5 置頂地名層。 |
| **中央氣象署 8 張圖資 (`www.cwa.gov.tw/Data/...`)** | 瀏覽器直連 `200 OK` 但**無 `Access-Control-Allow-Origin` 標頭**；且 `CV1_TW_3600.png` 含不透明灰底 | 必須以 Leaflet DOM `<img>`（加 `referrerPolicy="no-referrer"`）疊圖，禁 WebGL 跨網域貼圖；預設雷達改採透明底 RainViewer，CWA 雷達保留於圖層面板（預設透明度 `0.38` 防泛白）。 |
| **Open-Meteo API** | 多座標批次查詢 `200 OK`、CORS `*`、免 Key | 驅動動態風場 6×6 網格與每鏡頭即時風雨遙測，快取 10 分鐘。 |
| **RainViewer API & Tilecache** | 過去 13 幀雷達路徑與 z6/z7 PNG 圖磚 `200 OK`、CORS `*`、背景全透明、免 Key | 作為預設 2 小時動態雨帶時間軸來源（`maxNativeZoom: 7`）。 |
| **YouTube oEmbed (`scripts/check-webcams.mjs`)** | 實測 56/56 支鏡頭皆回傳 `HTTP 200`，耗時約 2 秒 | 搭配 `.github/workflows/webcam-health.yml` 每日自動巡檢輸出 `public/health.json`；執行期另由 YouTube Iframe API `onError` 遞補。 |
| **Git Hooks & `.gitignore`** | `core.hooksPath=scripts/hooks`；`git check-ignore -v node_modules dist` 命中 `.gitignore` | 每次 commit 須同步更新 `LLM_MEMORY.md` 並守 §3 標籤，禁 `--no-verify`。 |

---

## 三、建置、測試與部署實況

- **本地環境**：Node.js `v26.13.1` / npm `11.20.0`（位於 `/opt/homebrew/bin`）。
- **常用指令**：
  - 開發預覽：`npm run dev`
  - 單元測試：`npm test`（Vitest，12 項核心測試）
  - 生產建置：`npm run build`（`tsc --noEmit && vite build`，輸出 `./dist` 含 `dist/legacy.html`）
  - 鏡頭巡檢：`npm run check:webcams`（更新 `public/health.json`）
- **部署流程**：`.github/workflows/static.yml` 於 `main` push 自動執行 `npm ci → npm test → npm run build` 並將 `./dist` 部署至 GitHub Pages（Vite `base: '/taiwan_web_cam/'`）。
- **慣例**：全專案採用 UTF-8 繁體中文；`README.md` 為人類向文件不寫規劃待辦。
