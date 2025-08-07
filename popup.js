let allPackages = [];
let filteredPackages = [];

document.addEventListener('DOMContentLoaded', () => {
  loadPackages();
  setupEventListeners();
});

function setupEventListeners() {
  document.getElementById('searchInput').addEventListener('input', filterPackages);
  document.getElementById('tagFilter').addEventListener('change', filterPackages);
  document.getElementById('sortOrder').addEventListener('change', sortPackages);
  document.getElementById('exportBtn').addEventListener('click', exportPackages);
  document.getElementById('optionsBtn').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
}

async function loadPackages() {
  try {
    const result = await chrome.storage.local.get('packages');
    allPackages = result.packages || [];
    filteredPackages = [...allPackages];
    
    updateTagFilter();
    sortPackages();
    renderPackages();
    updateStats();
  } catch (error) {
    console.error('Error loading packages:', error);
    showError();
  }
}

function updateTagFilter() {
  const tags = new Set();
  allPackages.forEach(pkg => {
    if (pkg.tags) {
      pkg.tags.forEach(tag => tags.add(tag));
    }
  });
  
  const tagFilter = document.getElementById('tagFilter');
  tagFilter.innerHTML = '<option value="">所有標籤</option>';
  
  Array.from(tags).sort().forEach(tag => {
    const option = document.createElement('option');
    option.value = tag;
    option.textContent = tag;
    tagFilter.appendChild(option);
  });
}

function filterPackages() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  const selectedTag = document.getElementById('tagFilter').value;
  
  filteredPackages = allPackages.filter(pkg => {
    const matchesSearch = !searchTerm || 
      pkg.name.toLowerCase().includes(searchTerm) ||
      (pkg.description && pkg.description.toLowerCase().includes(searchTerm)) ||
      (pkg.note && pkg.note.toLowerCase().includes(searchTerm));
    
    const matchesTag = !selectedTag || 
      (pkg.tags && pkg.tags.includes(selectedTag));
    
    return matchesSearch && matchesTag;
  });
  
  sortPackages();
  renderPackages();
  updateStats();
}

function sortPackages() {
  const sortOrder = document.getElementById('sortOrder').value;
  
  filteredPackages.sort((a, b) => {
    switch (sortOrder) {
      case 'newest':
        return (b.savedAt || 0) - (a.savedAt || 0);
      case 'oldest':
        return (a.savedAt || 0) - (b.savedAt || 0);
      case 'name':
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });
  
  renderPackages();
}

function renderPackages() {
  const packageList = document.getElementById('packageList');
  
  if (filteredPackages.length === 0) {
    packageList.innerHTML = `
      <div class="empty-state">
        <p>沒有找到收藏的套件</p>
        <p style="margin-top: 8px; font-size: 11px;">前往 npmjs.com 開始收藏您喜愛的套件</p>
      </div>
    `;
    return;
  }
  
  packageList.innerHTML = filteredPackages.map(pkg => `
    <div class="package-item" data-name="${pkg.name}">
      <div class="package-header">
        <span class="package-name" 
              data-url="https://www.npmjs.com/package/${pkg.name}"
              title="在 NPM 上查看">
          ${pkg.name}
        </span>
        <span class="package-version">${pkg.version || 'latest'}</span>
      </div>
      ${pkg.description ? `<div class="package-description">${pkg.description}</div>` : ''}
      ${pkg.note ? `<div class="note-text">📝 ${pkg.note}</div>` : ''}
      <div class="package-footer">
        <div class="package-tags">
          ${pkg.tags ? pkg.tags.map(tag => `<span class="tag">${tag}</span>`).join('') : ''}
        </div>
        <div class="package-actions">
          <button class="action-btn edit-btn" title="編輯筆記">✏️</button>
          <button class="action-btn delete-btn" title="刪除">🗑️</button>
        </div>
      </div>
    </div>
  `).join('');
  
  // 添加事件監聽器
  packageList.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const packageName = e.target.closest('.package-item').dataset.name;
      deletePackage(packageName);
    });
  });
  
  packageList.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const packageItem = e.target.closest('.package-item');
      const packageName = packageItem.dataset.name;
      editPackageNote(packageName, packageItem);
    });
  });
  
  // 處理套件名稱點擊
  packageList.querySelectorAll('.package-name').forEach(element => {
    element.addEventListener('click', (e) => {
      e.stopPropagation();
      const url = element.dataset.url;
      if (url) {
        chrome.tabs.create({ url: url });
      }
    });
  });
}

async function deletePackage(packageName) {
  if (confirm(`確定要刪除 ${packageName} 嗎？`)) {
    allPackages = allPackages.filter(pkg => pkg.name !== packageName);
    await chrome.storage.local.set({ packages: allPackages });
    loadPackages();
  }
}

async function editPackageNote(packageName, packageItem) {
  const pkg = allPackages.find(p => p.name === packageName);
  if (!pkg) return;
  
  const currentNote = pkg.note || '';
  const noteElement = packageItem.querySelector('.note-text');
  
  // 創建輸入框
  const input = document.createElement('textarea');
  input.className = 'note-input';
  input.value = currentNote;
  input.placeholder = '添加筆記...';
  
  if (noteElement) {
    noteElement.replaceWith(input);
  } else {
    const description = packageItem.querySelector('.package-description');
    if (description) {
      description.after(input);
    } else {
      packageItem.querySelector('.package-header').after(input);
    }
  }
  
  input.focus();
  input.select();
  
  const saveNote = async () => {
    pkg.note = input.value.trim();
    await chrome.storage.local.set({ packages: allPackages });
    loadPackages();
  };
  
  input.addEventListener('blur', saveNote);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      input.blur();
    }
  });
}

function updateStats() {
  document.getElementById('totalCount').textContent = 
    `共 ${filteredPackages.length} 個收藏${
      filteredPackages.length < allPackages.length 
        ? ` (總計 ${allPackages.length} 個)` 
        : ''
    }`;
}

async function exportPackages() {
  if (allPackages.length === 0) {
    alert('沒有可匯出的套件');
    return;
  }
  
  const exportData = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    packages: allPackages
  };
  
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `npm-favorites-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  
  URL.revokeObjectURL(url);
}

function showError() {
  document.getElementById('packageList').innerHTML = `
    <div class="empty-state">
      <p>載入套件時發生錯誤</p>
    </div>
  `;
}