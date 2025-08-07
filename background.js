// 擴充功能安裝時初始化
chrome.runtime.onInstalled.addListener(() => {
  // 初始化存儲
  chrome.storage.local.get('packages', (result) => {
    if (!result.packages) {
      chrome.storage.local.set({ packages: [] });
    }
  });
  
  // 初始化設定
  chrome.storage.local.get('settings', (result) => {
    if (!result.settings) {
      chrome.storage.local.set({
        settings: {
          theme: 'light',
          autoTag: true,
          notifications: true,
          exportFormat: 'json'
        }
      });
    }
  });
});

// 監聽來自內容腳本的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'getPackages':
      chrome.storage.local.get('packages', (result) => {
        sendResponse(result.packages || []);
      });
      return true;
      
    case 'savePackage':
      savePackage(request.package).then(sendResponse);
      return true;
      
    case 'removePackage':
      removePackage(request.packageName).then(sendResponse);
      return true;
      
    case 'importPackages':
      importPackages(request.data).then(sendResponse);
      return true;
      
    case 'exportPackages':
      exportPackages(request.format).then(sendResponse);
      return true;
      
    case 'getSettings':
      chrome.storage.local.get('settings', (result) => {
        sendResponse(result.settings);
      });
      return true;
      
    case 'saveSettings':
      chrome.storage.local.set({ settings: request.settings }, () => {
        sendResponse({ success: true });
      });
      return true;
  }
});

// 保存套件
async function savePackage(packageInfo) {
  return new Promise((resolve) => {
    chrome.storage.local.get('packages', (result) => {
      const packages = result.packages || [];
      
      // 檢查是否已存在
      const existingIndex = packages.findIndex(pkg => pkg.name === packageInfo.name);
      
      if (existingIndex !== -1) {
        // 更新現有套件
        packages[existingIndex] = {
          ...packages[existingIndex],
          ...packageInfo,
          updatedAt: Date.now()
        };
      } else {
        // 添加新套件
        packages.unshift({
          ...packageInfo,
          savedAt: Date.now()
        });
      }
      
      chrome.storage.local.set({ packages }, () => {
        // 顯示通知
        if (chrome.notifications) {
          chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: 'NPM 套件收藏',
            message: `已收藏 ${packageInfo.name}`
          });
        }
        
        resolve({ success: true, packages });
      });
    });
  });
}

// 移除套件
async function removePackage(packageName) {
  return new Promise((resolve) => {
    chrome.storage.local.get('packages', (result) => {
      const packages = result.packages || [];
      const filtered = packages.filter(pkg => pkg.name !== packageName);
      
      chrome.storage.local.set({ packages: filtered }, () => {
        resolve({ success: true, packages: filtered });
      });
    });
  });
}

// 匯入套件
async function importPackages(importData) {
  return new Promise((resolve) => {
    try {
      const data = JSON.parse(importData);
      
      if (!data.packages || !Array.isArray(data.packages)) {
        resolve({ success: false, error: '無效的匯入格式' });
        return;
      }
      
      chrome.storage.local.get('packages', (result) => {
        const existingPackages = result.packages || [];
        const existingNames = new Set(existingPackages.map(pkg => pkg.name));
        
        // 合併套件，避免重複
        const newPackages = data.packages.filter(pkg => !existingNames.has(pkg.name));
        const mergedPackages = [...existingPackages, ...newPackages];
        
        chrome.storage.local.set({ packages: mergedPackages }, () => {
          resolve({
            success: true,
            imported: newPackages.length,
            total: mergedPackages.length
          });
        });
      });
    } catch (error) {
      resolve({ success: false, error: error.message });
    }
  });
}

// 匯出套件
async function exportPackages(format = 'json') {
  return new Promise((resolve) => {
    chrome.storage.local.get('packages', (result) => {
      const packages = result.packages || [];
      
      if (format === 'json') {
        const exportData = {
          version: '1.0',
          exportDate: new Date().toISOString(),
          packages: packages
        };
        resolve({
          success: true,
          data: JSON.stringify(exportData, null, 2),
          filename: `npm-favorites-${new Date().toISOString().split('T')[0]}.json`
        });
      } else if (format === 'markdown') {
        let markdown = '# NPM 套件收藏清單\n\n';
        markdown += `匯出日期: ${new Date().toLocaleString('zh-TW')}\n\n`;
        markdown += `總計: ${packages.length} 個套件\n\n`;
        
        // 按標籤分組
        const grouped = {};
        packages.forEach(pkg => {
          const tags = pkg.tags || ['未分類'];
          tags.forEach(tag => {
            if (!grouped[tag]) grouped[tag] = [];
            grouped[tag].push(pkg);
          });
        });
        
        Object.keys(grouped).sort().forEach(tag => {
          markdown += `## ${tag}\n\n`;
          grouped[tag].forEach(pkg => {
            markdown += `### [${pkg.name}](https://www.npmjs.com/package/${pkg.name})\n`;
            if (pkg.version) markdown += `版本: ${pkg.version}\n\n`;
            if (pkg.description) markdown += `${pkg.description}\n\n`;
            if (pkg.note) markdown += `> 📝 筆記: ${pkg.note}\n\n`;
            markdown += `\`\`\`bash\nnpm install ${pkg.name}\n\`\`\`\n\n`;
            markdown += '---\n\n';
          });
        });
        
        resolve({
          success: true,
          data: markdown,
          filename: `npm-favorites-${new Date().toISOString().split('T')[0]}.md`
        });
      }
    });
  });
}

// 定期清理過期數據（可選）
chrome.alarms.create('cleanup', { periodInMinutes: 60 * 24 }); // 每天執行一次

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'cleanup') {
    // 可以在這裡添加清理邏輯，例如移除超過一年未更新的收藏
    console.log('執行定期清理任務');
  }
});

// 監聽擴充功能圖示點擊（作為備用）
chrome.action.onClicked.addListener((tab) => {
  // 如果 manifest 中已經設置了 default_popup，這個事件不會觸發
  console.log('擴充功能圖示被點擊');
});