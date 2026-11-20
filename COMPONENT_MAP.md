# COMPONENT_MAP.md — 長期架構與契約地圖 (Taiwan Web Cam War Room)

> 編碼規範：UTF-8／繁體中文。本檔**僅存已驗證事實與已定案決策**，嚴禁寫入未驗證猜想與未定案討論；門檻上限 16 KB。

## 六十秒進入狀況

- **專案**：台灣即時影像戰情室（`https://github.com/lee18-in/taiwan_web_cam`｜Live：`https://lee18-in.github.io/taiwan_web_cam/`）。
- **核心目標**：結合台灣暗黑地圖、全台「鏡頭君」YouTube 即時影像與氣象圖層，特別服務「颱風／豪雨時點開網頁即掌握風雨與現場實況」情境。
- **現行實況**：全站目前為單檔純靜態網頁 `index.html`（1,166 行，約 52.7 KB，無建置步驟），由 `.github/workflows/static.yml` 直接部署 `.` 至 GitHub Pages。
- **已定案最高紅線（使用者 2026-11-20 明示）**：
  1. **100% 免費部署於 GitHub Free 服務**（GitHub Pages + GitHub Actions），不引入付費後端、不引入需付費 API Key 的強制依賴。
  2. **視覺與體驗優先（「怎麼炫怎麼來」）**，同時維持首屏流暢與行動端可用性。

---

## 一、現行系統結構與跨模組契約（已驗證實況）

### 1. 單檔結構（`index.html`）
- **底圖與依賴**：Leaflet 1.9.4（unpkg CDN）+ CartoDB Dark Matter 底圖 + YouTube Embed URL（目前直接拼字串，尚未接入 YouTube Iframe Player API）。
- **攝影機資料（`webcams` 陣列，共 52 筆）**：欄位為 `level`（0–4，數字越小優先權越高）、`videoId`、`lat`、`lng`、`name`。
- **動態影片牆與防遮擋邏輯**：
  - 桌機（`> 1024px`）最多 8 格（左右牆，依經度切西／東、緯度由北到南排）；手機（`<= 1024px`）最多 4 格（上下夾心，緯度分上下、經度分左右防連線交錯）。
  - 優先規則：不依縮放層級隱藏低階點，一律取可視範圍內依 `level` 升冪、同級依距中心點距離升冪排序；並迴圈最多 3 次排除被影片牆遮擋的候選點（`getDisplayCams()`）。
- **SVG 指引線座標修正契約（重要踩坑定案）**：
  - 行動裝置動態網址列會讓 CSS `100vh` 與 `window.innerHeight` 不一致；SVG 畫布必須以 `#connection-layer` 實際 `getBoundingClientRect()` 設定 `viewBox`，並將目標／起點 client 座標減去 `svgRect.left`/`top` 映射至 SVG 內部座標系。
  - 每次容器尺寸或排版變更後，必須立即呼叫 `map.invalidateSize({ animate: false })` 刷新 Leaflet 快取。
- **開發者校正工具（`#calibration-tool`）**：點地圖右下版權列 ⚙️ 開啟，提供 5 組邊界滑軌即時調整並複製 JSON 陣列。

### 2. 已校正氣象疊圖邊界（`satBoundsGroup`，務必完整保留）
| 群組鍵值 | 對應 CWA 圖資 | 已校正經緯度邊界 `[[s, w], [n, e]]` |
|---|---|---|
| `radarBounds` | 雷達回波 `CV1_TW_3600.png` | `[[20.455, 118.000], [26.480, 124.000]]` |
| `rainfallBounds` | 累積雨量 `QZJ.jpg` | `[[21.505, 119.195], [25.900, 123.575]]` |
| `1350` | 衛星可見光 `TWI_VIS_Gray_1350.jpg`、真實色 `TWI_TRGB_1350.jpg` | `[[19.030, 115.925], [28.215, 126.070]]` |
| `800` | 衛星彩色 `TWI_IR1_CR_800.jpg`、色調強化 `TWI_IR1_MB_800.jpg`、黑白 `TWI_IR1_Gray_800.jpg` | `[[19.050, 115.935], [28.195, 126.055]]` |
| `sfcBounds` | 地面等壓天氣圖 `SFCcombo.jpg` | `[[-0.340, 80.630], [56.690, 167.995]]` |

### 3. 已知現行結構痛點（重構驅動原因）
- `renderVideoWall()` 以 `wall.innerHTML` 重建整排，名單差 1 台即導致其餘 7 支直播斷流重載；一次自動播放 8 支 iframe 造成高 CPU/RAM 負載。
- `zoom`/`move` 每幀重寫 SVG `innerHTML` 並套用 `filter: drop-shadow`；`zoomend` 重複觸發 `updateMarkersVisibility()` 並全量清空重建未顯示紅點。
- Popup 標題未經 `escapeHtml()`；無 YouTube 串流失效容錯；手機版字體縮至 `6px`–`7px` 難以操作。

---

## 二、外部資源與環境驗證台帳

| 驗證日期 | 對象 / 機制 | 實測結果 | 架構契約 / 結論 |
|---|---|---|---|
| 2026-11-20 | 中央氣象署 8 張圖資（`www.cwa.gov.tw/Data/...`） | `curl -sI` 帶 `Origin` 與 `Referer: https://lee18-in.github.io/taiwan_web_cam/` 均回 `HTTP/1.1 200 OK`（HiNetCDN），但**無 `Access-Control-Allow-Origin` 標頭** | **關鍵架構決策**：不可用 WebGL 跨網域貼圖（如 MapLibre `image` source）直連，否則觸發瀏覽器 CORS 阻擋。**必須以 DOM `<img>`（Leaflet `L.imageOverlay`）疊圖**，即可 100% 純 GitHub Pages 零 Proxy 運作；並可加 `referrerPolicy="no-referrer"` 預防未來擋 Referer。 |
| 2026-11-20 | Open-Meteo API（`api.open-meteo.com/v1/forecast`） | 實測多座標批次查詢 `HTTP/1.1 200 OK`、`access-control-allow-origin: *`、免 Key、回傳氣溫／風速／風向／陣風／降雨 | 可純前端直連，用於鏡頭即時風雨遙測與台灣網格動態風場流線（建議快取 10 分鐘控制請求量）。 |
| 2026-11-20 | RainViewer API（`api.rainviewer.com/public/weather-maps.json` 與 `tilecache.rainviewer.com`） | 實測 `HTTP/2 200`、`access-control-allow-origin: *`、免 Key；回傳過去 13 幀雷達路徑，z6/z7 PNG 圖磚均 `200 OK` | 可純前端直連提供過去約 2 小時動態雷達時間軸播放（搭配 Leaflet `maxNativeZoom: 7` 與 CWA 高解析靜態圖互補）。 |
| 2026-11-20 | YouTube oEmbed（`www.youtube.com/oembed`） | 實測 `200 OK` 回傳 JSON，免 Key | 可供 GitHub Actions 定期巡檢失效影片 ID（前端執行期另由 YouTube Iframe Player API `onError` 補強）。 |
| 2026-11-20 | Git Hooks 環境自檢 | `git config --get core.hooksPath` 為 `scripts/hooks`，`pre-commit` 與 `commit-msg` 皆具 `+x` 權限 | 每次 commit 強制檢核同目錄 `LLM_MEMORY.md` 同步異動與 `[plan|build|maintain|takeover]` 標籤，禁用 `--no-verify`。 |

---

## 三、建置、測試與部署實況（隨實況更新）

- **建置指令**：無（現行純單檔 `index.html`；大改版進 `[build]` 後更新為 Vite 指令）。
- **測試指令**：無（現行無自動測試框架；規劃中將導入 Vitest + Playwright）。
- **部署流程**：`.github/workflows/static.yml` 監聽 `main` push，目前直接上傳 `.` 至 GitHub Pages；改版後將改為建置並上傳 `./dist`，且 Vite `base` 須設為 `'/taiwan_web_cam/'`。
- **程式碼與文件慣例**：全專案採用 UTF-8 繁體中文；`README.md` 僅供人類閱讀不寫規劃待辦；非衰減事實一律寫本檔。
