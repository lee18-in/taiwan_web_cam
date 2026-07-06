# LLM_MEMORY.md — 工作記憶 (Taiwan Web Cam War Room)

此檔案為跨 LLM、跨機器、跨平台的協作記憶庫。主要紀錄專案架構、技術細節、已實現功能、已知限制與後續開發方向，供後續接手的 AI 助手快速理解上下文。

## A. 目前狀態（每次交接必更新）

- 目前階段: **[build]**
- 最後更新: 2026-07-06 18:45 — 當時階段: [maintain]
- 最新 commit: e36fac6 [maintain] 導入 Playbook v2 agent 工作流系統
- 進行中任務: 等待下一項工作宣告（Playbook v2 導入已完成）
- 阻塞點: 無

---

## 📌 專案基本資訊
- **專案名稱**：台灣即時影像戰情室 (Taiwan Web Cam War Room)
- **Repo 網址**：https://github.com/lee18-in/taiwan_web_cam
- **Live Demo**：https://lee18-in.github.io/taiwan_web_cam/
- **核心技術**：原生 HTML / CSS / Vanilla JavaScript (無額外構建步驟，單一 HTML 檔案運作)
- **第三方套件**：
  - **Leaflet.js** (地圖呈現與標記管理)
  - **CartoDB Dark Matter** (戰情室暗色風格底圖)
  - **YouTube Iframe API** (即時串流影片嵌入與自動播放)

---

## 🗺️ 系統架構與關鍵邏輯

### 1. 單一檔案結構 (Single-File Architecture)
整個專案主要邏輯與介面皆在 [index.html](file:///home/winbug3/文件/github/taiwan_web_cam/index.html) 中實作：
- **HTML/CSS**：定義了地圖容器、兩側的影片牆 (`.video-wall-left`, `.video-wall-right`)、連線 SVG 畫布 (`#connection-layer`)、氣象疊圖按鈕控制面板 (`#footer-links`)，以及疊圖校正工具 (`#calibration-tool`)。
- **JavaScript**：負責地圖初始化、氣象疊圖加載/切換/校正、攝影機資料庫篩選、影片牆渲染與 SVG 連線動態計算。

### 2. 攝影機篩選與排版邏輯
- **資料定義**：在 `webcams` 陣列中定義，每個攝影機具有：
  - `level` (0-4，數字越小優先權越高，決定影片牆不足時的顯示順序)
  - `videoId` (YouTube 直播 ID)
  - `lat`, `lng` (經緯度)
  - `name` (名稱)
- **動態影片牆**：
  - **電腦版 (正常解析度 > 1024px)**：最多顯示 8 個影片，分置於左側與右側。影片牆寬度會根據當前顯示的影片數動態計算，並會將地圖的原生控制元件（如縮放按鈕、版權宣告）以及底部的按鈕面板向內推移，避免被遮擋。
  - **手機/平板/低解析度版 (<= 1024px)**：最多顯示 4 個影片，分別放置在畫面的最上方 (前 2 個) 與最下方 (後 2 個)，形成「上二、下二」的配置，而 Leaflet 地圖被夾在中間（Sandwich Layout）。在分發至上下影片牆前，會先將相機清單進行地理空間排序（緯度由北到南劃分上下兩組，再以經度由西到東排定左右順序），以確保視訊分割與地圖地標的對應指引線不會產生交錯。
- **雷射連線指示器 (SVG Connector Line)**：
  - 透過 `renderConnectorLines()` 動態計算影片牆卡片的邊緣中點，與該標記在地圖上的實際螢幕座標點 (`map.latLngToContainerPoint`)，並利用 SVG `<line>` 與 `<circle>` 繪製虛線連線，營造戰情室科技感。
  - 手機/低解析度版時，雷射連線會自動判斷地標相對於影片卡片的位置，自動從影片卡片的下方 (指引向下方地圖) 或上方 (指引向上方地圖) 射出。

### 3. 七合一氣象疊圖系統與校正工具
整合交通部中央氣象署 (CWA) 資源，提供以下圖層切換：
1. 📡 **雷達回波圖** (預設開啟)
2. 🌧️ **累積雨量圖**
3. ☀️ **可見光衛星雲圖**
4. 🌍 **真實色衛星雲圖**
5. 🎨 **彩色紅外線衛星雲圖**
6. 🌓 **色調強化衛星雲圖**
7. ⬛ **黑白紅外線衛星雲圖**
8. 🌀 **地面等壓天氣圖**

#### 🔧 開發者校正工具 (Calibration Tool)
- 點擊地圖右下角 Leaflet 版權欄位中的 ⚙️ 按鈕可開啟隱藏的「疊圖校正工具」。
- 提供北、南、西、東的經緯度滑軌（Range Slider），拖動時會即時更新對應圖層的 Leaflet `ImageOverlay` 邊界（Bounds）。
- 自動生成 JSON 格式的代碼陣列（例如 `[[s, w], [n, e]]`），方便開發者直接複製並貼回程式碼的 `satBoundsGroup` 中。

### 4. 座標指引線定位機制 (SVG Connector Offset Fix)
- **問題現象**：在低解析度或行動裝置瀏覽器下，雷射指引線與地標位置會產生偏移。
- **根本原因**：
  1. 行動裝置下瀏覽器 UI（如網址列）動態顯示/隱藏導致 CSS 的 `100vh` 與 JS 的 `window.innerHeight` 不一致，而 SVG 之前是使用 `window.innerWidth`/`innerHeight` 作為 viewBox，導致畫布縮放拉伸。
  2. 地圖容器 `#map` 的尺寸與位置在行動裝置版動態變更（如因為上方的影片牆高度改變），但 Leaflet 的內部尺寸快取未同步更新，導致 `latLngToContainerPoint` 計算出過時的座標。
- **解決方案**：
  1. 動態獲取 `#connection-layer` (SVG) 的 `getBoundingClientRect()` 作為基準，並將其 `viewBox` 設定為實際的渲染寬高（`0 0 svgRect.width svgRect.height`）。
  2. 將計算出的螢幕 client 座標（如影片邊緣或地圖標記座標）減去 `svgRect.left` 和 `svgRect.top`，完美映射至 SVG 內部座標系，對抗所有因視窗捲動或定位產生的位移。
  3. 將地圖定位重構為統一的 `updateMapPosition()`，在每次更新地圖樣式（不論是手機版或桌機版）後，立即呼叫 `map.invalidateSize({ animate: false })` 強制 Leaflet 刷新容器大小快取。

---

## 🛠️ 當前已實作功能
- [x] 基礎地圖初始化與 CartoDB 暗黑主題。
- [x] 根據地圖可視範圍與 `level` 優先度篩選並動態載入 YouTube 影片。
- [x] 自動記憶與避免重複渲染（若視角變化但顯示清單不變，不重新加載 iframe 避免斷流）。
- [x] SVG 科技感雷射連線。
- [x] 多種氣象雲圖疊加與切換。
- [x] 即時疊圖邊界校正工具（包含 SFC 等壓圖、雨量圖、雷達圖與兩種不同解析度衛星圖的專屬滑軌範圍限制）。

---

## ⚠️ 已知限制與開發注意事項
1. **YouTube 串流失效風險**：
   - 即時影像的 YouTube `videoId` 有可能因原轉播單位重開直播而變更。需定期檢查 `webcams` 陣列中的影片 ID 是否有效。
2. **網頁快取問題**：
   - 氣象圖層的圖片網址後方皆有加上時間戳記 `?t=new Date().getTime()`，以避免瀏覽器快取過期的氣象資訊。
3. **無構建系統**：
   - 本專案完全基於單一 HTML 檔案，所有的樣式與指令碼都在 `index.html` 中。修改程式碼時請確保不會破壞既有的純網頁架構（除非後續有重構為 React/Vite 等框架的需求）。

---

## 🚀 後續規劃與待辦事項 (Roadmap)
- [ ] **使用者偏好儲存**：實作「鏡頭優先等級」或「自訂顯示清單」面板，並結合 LocalStorage 儲存使用者設定。
- [ ] **更多即時資訊疊加**：加入國道時速壅塞圖層、累積雨量具體數值標記等。
- [ ] **YouTube API 錯誤處理**：在 Iframe 載入失敗或直播已結束時，顯示友善的替代畫面或自動替換其他備份攝影機。

---

## C. 交接日誌(只追加,不刪改;最新在最上,每筆一個小節)

### 2026-07-06 18:30 [maintain] 使用工具: Claude Haiku

- 完成了什麼: 導入 Playbook v2 工作流系統。覆蓋 AGENTS.md 至 v2 版本（引入 §2.1 Review Loop、交接日誌書寫規範、§4 Git Hook 強制約束）；遷移舊 AGENTS.md §5 的技術脈絡值至 LLM_MEMORY.md E 區；建立 scripts/hooks/{pre-commit,commit-msg}；執行 `git config core.hooksPath scripts/hooks` 啟用。
- 下一個 agent 該做什麼: 無

---

## E. 專案技術脈絡(依專案填寫,agent 得隨專案實況更新,保持精簡)

- 建置指令: 無（純 HTML/CSS/JavaScript，單一 index.html，無構建步驟）
- 測試指令: 無（目前無自動測試框架）
- 程式碼慣例:
  - 原生 HTML/CSS/JavaScript（不使用框架）
  - 所有邏輯在單一 index.html 中實作
  - 依賴：Leaflet.js (地圖)、CartoDB (底圖)、YouTube Iframe API (影音)
  - 遵循既有的「單一檔案」架構，不引入新的構建工具
