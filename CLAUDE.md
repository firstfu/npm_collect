# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 專案概述

這是一個 Chrome 擴充功能，讓用戶可以在 npmjs.com 網站上收藏 npm 套件，並提供管理、搜尋、標籤分類、筆記和匯出功能。使用 Manifest V3 架構。

## 核心架構

### Chrome Extension 元件
- **manifest.json** - 擴充功能配置，定義權限、背景服務、內容腳本等
- **background.js** - Service Worker，處理存儲操作和跨元件通訊
- **content.js** - 注入 npm 網站的腳本，負責添加收藏按鈕
- **popup.js/popup.html** - 彈出視窗，顯示收藏清單和管理功能
- **options.js/options.html** - 設定頁面，處理匯入/匯出和偏好設定

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