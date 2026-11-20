<!-- AI AGENTS: Read ./AGENTS.md first, then ./LLM_MEMORY.md and ./COMPONENT_MAP.md.
     Do NOT write planning, status, or todo content into this file. -->

> - **Language and Encoding Standards**: All system files, code annotations, memory files (`LLM_MEMORY.md`), and handover logs for this project are uniformly encoded in **UTF-8** and **Traditional Chinese** by default.

# 🇹🇼 台灣即時影像戰情室 (Taiwan Web Cam War Room v2)

![Language](https://img.shields.io/badge/Language-zh--TW-blue.svg)
![Encoding](https://img.shields.io/badge/Encoding-UTF--8-lightgrey.svg)
![License](https://img.shields.io/badge/License-MIT-green.svg)

> 結合台灣暗黑戰情地圖、全台 56 處「鏡頭君」即時直播、Windy 風格動態風場粒子流線與雙軌氣象圖層，專為颱風與豪雨時快速掌握全台風雨動態與現場實況打造。

- 🌐 **Live Demo（v2 現代化戰情室）**：https://lee18-in.github.io/taiwan_web_cam/
- 🕰️ **舊版保留（Classic v1 單檔版）**：https://lee18-in.github.io/taiwan_web_cam/legacy.html

## ✨ 功能特色

- 🗺️ **6 層「戰情三明治」地圖與 3 種免費底圖**：支援暗黑戰情（Esri Dark）、衛星實景（Esri World Imagery）與內政部國土測繪中心台灣繁中電子地圖（NLSC）一鍵切換，並將透明繁體中文縣市地名與國道路網（NLSC EMAP2）置頂於雲圖與雷達之上。
- 🌪️ **動態風場粒子流線**：串接 Open-Meteo 免費網格氣象資料，以 Canvas 2D 呈現台灣周邊即時風場流動（依風速分色），並於每張鏡頭卡片顯示當地即時氣溫、風速／陣風與降雨量。
- 🎬 **雙軌氣象圖層（2 小時動態雨帶 ＋ CWA 8 圖層多疊加）**：整合 RainViewer 過去 2 小時雷達時間軸回放，並完整保留中央氣象署 8 組高解析疊圖（雷達、累積雨量、5 種衛星雲圖、地面等壓圖），支援多層疊加、獨立透明度、發光濾色與每 10 分鐘無感雙緩衝自動刷新。
- ⚡ **零重載影片牆與 45° 戰術脈衝連線**：採單一扁平 Keyed 定位池避免拖曳地圖時直播斷流，預設 4 格活體直播＋縮圖延遲啟動（可切換 4 / 6 / 8 格與全直播滿載），支援鏡頭釘選（Pin）、劇院大畫面（Focus）、URL 視角分享與 Kiosk 副螢幕壁掛模式。
- 📱 **行動裝置三段式抽屜**：手機與平板自動切換為滿版地圖＋可滑動 Bottom Sheet，避免畫面擁擠與裝置過熱。
- 🛡️ **雙層防黑屏容錯**：前端接入 YouTube Iframe Player API 偵測串流異常自動遞補，並由 GitHub Actions 每日巡檢鏡頭狀態。

## 🛠️ 技術棧 (Tech Stack)

- **前端框架與樣式**：Vite 6 + React 19 + TypeScript + Tailwind CSS v4 + Zustand + Lucide Icons
- **地圖與視覺化**：Leaflet 1.9.4（Canvas 標記渲染）+ 自建 Canvas 2D 風場流線層 + 節點復用 SVG 戰術連線層
- **免費公開圖資與 API**：Esri Basemaps、內政部國土測繪中心 NLSC、中央氣象署 CWA 圖資、Open-Meteo、RainViewer、YouTube Iframe API
- **部署與自動化**：GitHub Pages + GitHub Actions（自動測試、編譯與每日鏡頭健康巡檢）

## 🚀 本地開發

```bash
npm install
npm run dev       # 啟動本地開發伺服器
npm test          # 執行核心演算法單元測試 (Vitest)
npm run build     # 型別檢查並編譯靜態成品至 ./dist
npm run check:webcams  # 執行全數鏡頭健康巡檢
```

## 🔗 資料來源與版權聲明

- 即時影像播放清單來源：[台灣各地鏡頭君 YouTube Playlist](https://www.youtube.com/playlist?list=PLz7JwxFER5rzcxAcOO6Xf1cWtFwOJmZI4)
- 氣象與地圖資料來源：交通部中央氣象署 (CWA)、內政部國土測繪中心 (NLSC)、Open-Meteo、RainViewer、Esri

> ⚠️ **版權聲明**：本專案所彙整之所有即時影像（鏡頭君）之著作權與所有權，皆屬於原建置與轉播單位（包含但不限於交通部公路局、各縣市政府、風景區管理處等）。本專案僅透過 YouTube Iframe API 提供嵌入播放服務，作為公益與開源交流使用，不擁有亦不宣稱擁有其任何影像版權。

## 📄 授權條款 (License)

本專案採用 [MIT License](LICENSE) 開源授權 - 作者：lee18.in
