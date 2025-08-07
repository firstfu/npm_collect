let settings = {
  theme: 'light',
  autoTag: true,
  notifications: true,
  exportFormat: 'json'
};

document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  loadStats();
  setupEventListeners();
});

async function loadSettings() {
  const result = await chrome.storage.local.get('settings');
  if (result.settings) {
    settings = result.settings;
    
    // 應用設定到UI
    document.getElementById('theme').value = settings.theme || 'light';
    document.getElementById('autoTag').checked = settings.autoTag !== false;
    document.getElementById('notifications').checked = settings.notifications !== false;
    document.getElementById('exportFormat').value = settings.exportFormat || 'json';
    
    // 應用主題
    applyTheme(settings.theme);
  }
}

async function loadStats() {
  const result = await chrome.storage.local.get('packages');
  const packages = result.packages || [];
  
  document.getElementById('totalPackages').textContent = packages.length;
  
  // 計算使用空間
  const dataSize = new Blob([JSON.stringify(packages)]).size;
  const sizeInKB = (dataSize / 1024).toFixed(2);
  document.getElementById('storageUsed').textContent = `${sizeInKB} KB`;
}

function setupEventListeners() {
  // 儲存按鈕
  document.getElementById('saveBtn').addEventListener('click', saveSettings);
  
  // 主題切換
  document.getElementById('theme').addEventListener('change', (e) => {
    applyTheme(e.target.value);
  });
  
  // 匯入按鈕
  document.getElementById('importBtn').addEventListener('click', () => {
    document.getElementById('importFile').click();
  });
  
  // 匯入檔案選擇
  document.getElementById('importFile').addEventListener('change', handleImport);
  
  // 匯出按鈕
  document.getElementById('exportBtn').addEventListener('click', handleExport);
  
  // 清除按鈕
  document.getElementById('clearBtn').addEventListener('click', handleClear);
}

async function saveSettings() {
  settings = {
    theme: document.getElementById('theme').value,
    autoTag: document.getElementById('autoTag').checked,
    notifications: document.getElementById('notifications').checked,
    exportFormat: document.getElementById('exportFormat').value
  };
  
  await chrome.storage.local.set({ settings });
  
  // 顯示儲存成功訊息
  const status = document.getElementById('saveStatus');
  status.textContent = '✓ 設定已儲存';
  status.classList.add('show');
  
  setTimeout(() => {
    status.classList.remove('show');
  }, 3000);
}

function applyTheme(theme) {
  if (theme === 'dark') {
    document.body.classList.add('dark-theme');
  } else if (theme === 'light') {
    document.body.classList.remove('dark-theme');
  } else if (theme === 'auto') {
    // 檢測系統主題
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }
}

async function handleImport(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const data = JSON.parse(e.target.result);
      
      if (!data.packages || !Array.isArray(data.packages)) {
        alert('無效的匯入檔案格式');
        return;
      }
      
      const result = await chrome.storage.local.get('packages');
      const existingPackages = result.packages || [];
      const existingNames = new Set(existingPackages.map(pkg => pkg.name));
      
      // 合併套件
      const newPackages = data.packages.filter(pkg => !existingNames.has(pkg.name));
      const mergedPackages = [...existingPackages, ...newPackages];
      
      await chrome.storage.local.set({ packages: mergedPackages });
      
      alert(`成功匯入 ${newPackages.length} 個新套件\n總計: ${mergedPackages.length} 個套件`);
      
      // 重新載入統計
      loadStats();
    } catch (error) {
      alert('匯入失敗: ' + error.message);
    }
  };
  
  reader.readAsText(file);
  
  // 清除選擇的檔案
  event.target.value = '';
}

async function handleExport() {
  const result = await chrome.storage.local.get('packages');
  const packages = result.packages || [];
  
  if (packages.length === 0) {
    alert('沒有可匯出的套件');
    return;
  }
  
  const format = document.getElementById('exportFormat').value;
  
  if (format === 'json') {
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      packages: packages
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    downloadFile(blob, `npm-favorites-${new Date().toISOString().split('T')[0]}.json`);
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
    
    const blob = new Blob([markdown], { type: 'text/markdown' });
    downloadFile(blob, `npm-favorites-${new Date().toISOString().split('T')[0]}.md`);
  }
}

function downloadFile(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function handleClear() {
  const result = await chrome.storage.local.get('packages');
  const packages = result.packages || [];
  
  if (packages.length === 0) {
    alert('沒有收藏的套件');
    return;
  }
  
  if (confirm(`確定要清除所有 ${packages.length} 個收藏的套件嗎？\n此操作無法復原！`)) {
    if (confirm('請再次確認：是否真的要清除所有收藏？')) {
      await chrome.storage.local.set({ packages: [] });
      alert('所有收藏已清除');
      loadStats();
    }
  }
}

// 監聽系統主題變化
if (window.matchMedia) {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    const currentTheme = document.getElementById('theme').value;
    if (currentTheme === 'auto') {
      applyTheme('auto');
    }
  });
}