# NPM 套件收藏 Chrome 擴充功能

這是一個 Chrome 擴充功能，讓您可以輕鬆收藏和管理在 npmjs.com 上發現的優質套件。

## 功能特色

- 📌 **一鍵收藏** - 在 npm 套件頁面直接點擊收藏按鈕
- 🏷️ **智慧標籤** - 自動為套件分類（React、Vue、工具庫等）
- 🔍 **快速搜尋** - 在收藏清單中快速找到需要的套件
- 📝 **個人筆記** - 為每個套件添加使用心得或備註
- 📤 **匯出功能** - 支援 JSON 和 Markdown 格式匯出
- 🎨 **主題切換** - 支援淺色/深色主題

## 安裝方式

1. 開啟 Chrome 瀏覽器
2. 進入擴充功能管理頁面 `chrome://extensions/`
3. 開啟右上角的「開發人員模式」
4. 點擊「載入未封裝項目」
5. 選擇本專案資料夾

## 生成圖示

如果需要重新生成圖示：

1. 開啟 `icons/generate_pngs.html` 檔案
2. 點擊「生成所有圖示」按鈕
3. 右鍵儲存每個圖示為對應的檔名

## 使用說明

### 收藏套件
1. 瀏覽到任何 npm 套件頁面（例如：https://www.npmjs.com/package/react）
2. 點擊套件名稱旁的收藏按鈕
3. 套件會自動加入您的收藏清單

### 管理收藏
1. 點擊 Chrome 工具列的擴充功能圖示
2. 在彈出視窗中可以：
   - 搜尋收藏的套件
   - 按標籤篩選
   - 編輯筆記
   - 刪除收藏

### 匯出/匯入
1. 點擊擴充功能圖示，然後點擊設定按鈕
2. 在設定頁面選擇匯出格式（JSON 或 Markdown）
3. 點擊匯出按鈕下載收藏清單
4. 使用匯入功能可以恢復備份的收藏

## 檔案結構

```
chrome_extension/
├── manifest.json          # Chrome 擴充功能配置
├── popup.html            # 彈出視窗介面
├── popup.css             # 彈出視窗樣式
├── popup.js              # 彈出視窗邏輯
├── content.js            # 注入 npm 網站的腳本
├── content.css           # 注入的樣式
├── background.js         # 背景服務腳本
├── options.html          # 設定頁面
├── options.css           # 設定頁面樣式
├── options.js            # 設定頁面邏輯
└── icons/               # 圖示資料夾
    ├── icon16.png
    ├── icon32.png
    ├── icon48.png
    └── icon128.png
```

## 開發說明

### 技術架構
- **Manifest V3** - 使用最新的 Chrome 擴充功能架構
- **Chrome Storage API** - 本地儲存收藏資料
- **Content Script** - 注入 npm 網站以添加收藏功能
- **Service Worker** - 背景處理資料同步

### 資料結構
收藏的套件資料格式：
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

## 權限說明

本擴充功能需要以下權限：
- `storage` - 儲存收藏資料
- `tabs` - 存取當前頁籤資訊
- `notifications` - 顯示收藏通知
- `https://www.npmjs.com/*` - 在 npm 網站注入功能

## 版本歷史

### v1.0.0 (2024)
- 初始版本發布
- 基本收藏功能
- 搜尋與篩選
- 匯出/匯入功能
- 主題切換

## 授權

MIT License