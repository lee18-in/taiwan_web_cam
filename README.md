<!-- AI AGENTS: Read ./AGENTS.md first, then ./LLM_MEMORY.md.
     Do NOT write planning content into this file. -->

# 🇹🇼 台灣即時影像戰情室 (Taiwan Web Cam War Room)

![Language](https://img.shields.io/badge/Language-zh--TW-blue.svg)
![Encoding](https://img.shields.io/badge/Encoding-UTF--8-lightgrey.svg)
![License](https://img.shields.io/badge/License-MIT-green.svg)

> 結合台灣地圖與各地「鏡頭君」即時影像，打造如兵棋推演般的戰情室儀表板，讓您一眼掌握全台各地實況。

## 💡 專案簡介

這是一個以網頁呈現的視覺化戰情室專案。我們以台灣地圖為基底，將全台各地的即時影像（鏡頭君）直播標記並疊加在地圖上。使用者不需要逐一切換頻道，就能像指揮官一樣，直觀且全面地總覽各地目前的天氣與路況。

## ✨ 功能特色

- 🗺️ **互動式台灣地圖**：採用 Leaflet.js 與 CartoDB 暗黑戰情室風格底圖，快速定位全台「鏡頭君」。
- 📹 **動態即時影像牆**：依據地圖可視範圍與縮放位置，自動於畫面兩側展開多分割 YouTube 直播牆。
- 🎯 **沉浸式戰情室體驗**：具備 SVG 雷射連線動態指示功能，將兩側影片精準對應至地圖上的實體位置。
- 🌦️ **即時氣象雷達疊圖**：整合中央氣象署雷達回波圖，並內建開發者疊圖校正工具。
- 📡 **層級化資料來源**：彙整全台各熱門景點、國道及省道路況，並區分 1~4 級優先顯示權重。

## 🔗 資料來源

- 即時影像播放清單來源：[台灣各地鏡頭君 YouTube Playlist](https://www.youtube.com/playlist?list=PLz7JwxFER5rzcxAcOO6Xf1cWtFwOJmZI4)
- 氣象雷達圖來源：交通部中央氣象署 (CWA)

> ⚠️ **版權聲明**：本專案所彙整之所有即時影像（鏡頭君）之著作權與所有權，皆屬於原建置與轉播單位（包含但不限於交通部公路局、各縣市政府、風景區管理處等）。本專案僅透過 YouTube Iframe API 提供嵌入播放服務，作為公益與開源交流使用，不擁有亦不宣稱擁有其任何影像版權。

## 🛠️ 技術棧 (Tech Stack)

- **前端開發**: 原生 HTML / CSS / Vanilla JavaScript
- **地圖圖資**: Leaflet.js + CartoDB Dark Matter
- **影音串流**: YouTube Iframe API (搭配 Lazy Loading 最佳化)

## 🚀 未來規劃 (Roadmap)

- [x] 建立基礎地圖與標記點。
- [x] 實作點擊標記即彈出 YouTube 播放器的功能。
- [x] 實作多畫面分割的動態「全視角」影像牆與對齊連線。
- [x] 整合中央氣象署資料，疊加即時雷達回波圖。
- [ ] 實作「鏡頭優先等級」自訂面板，並結合 LocalStorage 儲存使用者偏好。
- [ ] 加入更多氣象與路況資訊（如累積雨量圖、國道壅塞地圖）。

## 📄 授權條款 (License)

本專案採用 [MIT License](LICENSE) 開源授權 - 作者：lee18.in 