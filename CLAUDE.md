# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 專案概述

這是一個 Chrome 擴充功能，讓用戶可以在 npmjs.com 網站上收藏 npm 套件，並提供管理、搜尋、標籤分類、筆記和匯出功能。使用 Manifest V3 架構。

## 開發指令

### 安裝與測試
```bash
# 在 Chrome 中載入擴充功能進行測試
# 1. 開啟 chrome://extensions/
# 2. 開啟「開發人員模式」
# 3. 點擊「載入未封裝項目」，選擇此專案資料夾

# 重新載入擴充功能 (修改代碼後)
# 在 chrome://extensions/ 頁面點擊擴充功能的重新載入按鈕
```

### 圖示生成
```bash
# 生成所有尺寸的圖示檔案
# 開啟 icons/generate_pngs.html 在瀏覽器中
# 點擊「生成所有圖示」按鈕，然後右鍵儲存每個圖示

# 或者使用 Python 腳本 (如果可用)
python icons/create_icons.py
```

## 核心架構

### Chrome Extension 元件
- **manifest.json** - 擴充功能配置，定義權限、背景服務、內容腳本等
- **background.js** - Service Worker，處理存儲操作和跨元件通訊
- **content.js + content.css** - 注入 npm 網站的腳本和樣式，負責添加收藏按鈕
- **popup.js/popup.html/popup.css** - 彈出視窗，顯示收藏清單和管理功能
- **options.js/options.html/options.css** - 設定頁面，處理匯入/匯出和偏好設定
- **icons/** - 包含各種尺寸的擴充功能圖示和生成工具

### 資料結構
套件資料格式：
```javascript
{
  name: "package-name",
  version: "1.0.0", 
  description: "套件描述",
  url: "https://www.npmjs.com/package/package-name",
  tags: ["React", "UI元件"],
  note: "個人筆記",
  savedAt: 1234567890000
}
```

### 通訊機制
- 使用 `chrome.runtime.onMessage` 和 `chrome.runtime.sendMessage` 進行元件間通訊
- 統一透過 background.js 處理所有 storage 操作
- 支援的訊息類型：`getPackages`, `savePackage`, `removePackage`, `importPackages`, `exportPackages`, `getSettings`, `saveSettings`

## 重要實作細節

### 按鈕注入邏輯 (content.js)
- 使用 `findTargetElement()` 尋找適合的注入位置
- 優先尋找右側欄位的 "Install" 標題元素
- 支援 SPA 導航的動態注入 (使用 MutationObserver)

### 自動標籤識別
- 根據套件名稱和描述自動添加相關標籤（React、Vue、Angular、CLI工具等）
- 標籤用於收藏清單的篩選和分組

### 存儲策略
- 使用 Chrome Storage Local API 儲存所有資料
- 避免重複收藏同一套件（以名稱為唯一鍵）
- 支援資料匯入/匯出 (JSON 和 Markdown 格式)

## 調試與開發技巧

### Chrome 開發者工具
- **Extension DevTools**: 在 `chrome://extensions/` 中點擊「檢查視圖」來調試 popup 和 options 頁面
- **Background Script**: 使用 `chrome://extensions/` 中的「檢查背景頁面」來調試 Service Worker
- **Content Script**: 在 npm 網站上按 F12，在 Console 中可以看到 content script 的 log

### 常見調試場景
- **Storage 檢查**: 在 DevTools 的 Application > Storage > Extension storage 中檢視存儲的資料
- **消息傳遞**: 在 background.js 和 content.js 中使用 `console.log` 追蹤消息流
- **DOM 注入**: 檢查 npm 網站的 DOM 結構變化，確保按鈕正確注入

## 開發注意事項

### 樣式處理
- 內容腳本注入的元素需考慮與 npm 網站樣式的兼容性
- 使用內聯樣式避免 CSS 衝突
- 支援動畫和過渡效果

### DOM 操作
- npm 網站可能更新 DOM 結構，注入邏輯需要多種備用方案
- 使用防禦性程式設計處理元素查找失敗的情況

### 權限最小化
- 只請求必要的 Chrome API 權限
- host_permissions 限制在 `https://www.npmjs.com/*`

### 錯誤處理
- 所有異步操作都需要適當的錯誤處理
- 用戶操作失敗時提供明確的錯誤訊息