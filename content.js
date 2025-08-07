// 等待頁面載入完成
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

function init() {
  // 檢查是否在套件頁面
  if (window.location.pathname.startsWith('/package/')) {
    setTimeout(injectFavoriteButton, 500);
  }
}

async function injectFavoriteButton() {
  const packageName = getPackageName();
  if (!packageName) return;
  
  // 尋找合適的注入位置
  const target = findTargetElement();
  if (!target) {
    console.log('找不到合適的位置注入收藏按鈕');
    return;
  }
  
  // 檢查是否已收藏
  const isFavorited = await checkIfFavorited(packageName);
  
  // 創建收藏按鈕容器
  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'npm-favorite-container';
  buttonContainer.style.cssText = `
    margin: 12px 0;
    display: flex;
    align-items: center;
  `;
  
  // 創建收藏按鈕
  const favoriteBtn = document.createElement('button');
  favoriteBtn.className = 'npm-favorite-btn';
  favoriteBtn.dataset.favorited = isFavorited;
  favoriteBtn.innerHTML = isFavorited 
    ? '⭐ 已收藏' 
    : '☆ 收藏';
  favoriteBtn.title = isFavorited 
    ? '點擊取消收藏' 
    : '點擊收藏此套件';
  
  // 添加樣式（與 npm 網站風格一致）
  favoriteBtn.style.cssText = `
    background: ${isFavorited ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#ffffff'};
    color: ${isFavorited ? '#ffffff' : '#667eea'};
    border: ${isFavorited ? '1px solid #667eea' : '1px solid #667eea'};
    padding: 6px 16px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: auto;
    line-height: 1.5;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  `;
  
  // 懸停效果
  favoriteBtn.addEventListener('mouseenter', () => {
    if (favoriteBtn.dataset.favorited === 'true') {
      favoriteBtn.style.opacity = '0.9';
    } else {
      favoriteBtn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      favoriteBtn.style.color = '#ffffff';
      favoriteBtn.style.border = 'none';
    }
  });
  
  favoriteBtn.addEventListener('mouseleave', () => {
    if (favoriteBtn.dataset.favorited === 'true') {
      favoriteBtn.style.opacity = '1';
    } else {
      favoriteBtn.style.background = '#ffffff';
      favoriteBtn.style.color = '#667eea';
      favoriteBtn.style.border = '1px solid #667eea';
    }
  });
  
  // 點擊事件
  favoriteBtn.addEventListener('click', async () => {
    const packageInfo = getPackageInfo();
    
    if (favoriteBtn.dataset.favorited === 'true') {
      // 取消收藏
      await removeFromFavorites(packageName);
      favoriteBtn.dataset.favorited = 'false';
      favoriteBtn.innerHTML = '☆ 收藏';
      favoriteBtn.title = '點擊收藏此套件';
      favoriteBtn.style.background = '#ffffff';
      favoriteBtn.style.color = '#667eea';
      favoriteBtn.style.border = '1px solid #667eea';
      showNotification('已取消收藏', packageName);
    } else {
      // 添加收藏
      await addToFavorites(packageInfo);
      favoriteBtn.dataset.favorited = 'true';
      favoriteBtn.innerHTML = '⭐ 已收藏';
      favoriteBtn.title = '點擊取消收藏';
      favoriteBtn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      favoriteBtn.style.color = '#ffffff';
      favoriteBtn.style.border = 'none';
      showNotification('已加入收藏', packageName);
    }
  });
  
  buttonContainer.appendChild(favoriteBtn);
  
  // 根據位置插入按鈕
  if (target.position === 'after') {
    target.element.insertAdjacentElement('afterend', buttonContainer);
  } else if (target.position === 'before') {
    target.element.insertAdjacentElement('beforebegin', buttonContainer);
  } else {
    target.element.appendChild(buttonContainer);
  }
}

function findTargetElement() {
  // 尋找右側欄位的 Install 區塊
  // NPM 網站的右側欄通常有特定的 class 或結構
  
  // 方法1: 尋找包含 npm i 指令的輸入框（右側）
  const inputs = document.querySelectorAll('input[type="text"], input[readonly]');
  for (const input of inputs) {
    const value = input.value || input.textContent || '';
    if (value.includes('npm i ') || value.includes('npm install ')) {
      // 找到輸入框的父容器
      let container = input.parentElement;
      // 往上找到合適的容器層級
      while (container && !container.querySelector('h2, h3, [class*="install"]')) {
        container = container.parentElement;
      }
      if (container) {
        // 在輸入框的容器內插入
        return { element: input.parentElement, position: 'after' };
      }
    }
  }
  
  // 方法2: 尋找右側欄的區塊（通常包含 Repository、Homepage 等）
  const sidebarSections = document.querySelectorAll('aside, [role="complementary"], [class*="sidebar"], [class*="side"], [class*="right"]');
  for (const section of sidebarSections) {
    // 在右側欄中尋找 Install 相關的標題
    const installHeading = Array.from(section.querySelectorAll('h2, h3, h4, p')).find(
      el => el.textContent.trim().toLowerCase() === 'install'
    );
    if (installHeading) {
      // 找到 npm 指令的元素
      const codeElement = section.querySelector('code, pre, input');
      if (codeElement && (codeElement.textContent || codeElement.value || '').includes('npm')) {
        // 在指令元素後插入
        return { element: codeElement.parentElement || codeElement, position: 'after' };
      }
      // 否則在標題後插入
      return { element: installHeading, position: 'after' };
    }
  }
  
  // 方法3: 使用更廣泛的選擇器尋找右側的 Install 區塊
  const allElements = document.querySelectorAll('*');
  for (const element of allElements) {
    // 檢查元素是否包含 Install 文字且位於頁面右側
    if (element.textContent === 'Install' && element.getBoundingClientRect().left > window.innerWidth / 2) {
      // 找到下方的 npm 指令元素
      const nextElements = [];
      let sibling = element.nextElementSibling;
      for (let i = 0; i < 5 && sibling; i++) {
        nextElements.push(sibling);
        sibling = sibling.nextElementSibling;
      }
      
      for (const next of nextElements) {
        const codeOrInput = next.querySelector('code, input, pre') || next;
        const content = codeOrInput.textContent || codeOrInput.value || '';
        if (content.includes('npm i ') || content.includes('npm install ')) {
          return { element: codeOrInput.parentElement || codeOrInput, position: 'after' };
        }
      }
      
      // 如果找不到 npm 指令，就在 Install 標題後插入
      return { element: element, position: 'after' };
    }
  }
  
  return null;
}

function getPackageName() {
  const pathname = window.location.pathname;
  const match = pathname.match(/^\/package\/([^\/]+)/);
  return match ? match[1] : null;
}

function getPackageInfo() {
  const packageName = getPackageName();
  
  // 獲取版本
  let version = 'latest';
  const versionElement = document.querySelector('[class*="version"]');
  if (versionElement) {
    const versionMatch = versionElement.textContent.match(/(\d+\.\d+\.\d+)/);
    if (versionMatch) {
      version = versionMatch[1];
    }
  }
  
  // 獲取描述
  let description = '';
  const descElement = document.querySelector('p[class*="description"], [class*="description"] p, meta[name="description"]');
  if (descElement) {
    description = descElement.content || descElement.textContent || '';
  }
  
  // 嘗試自動識別套件類型並添加標籤
  const tags = [];
  const name = packageName.toLowerCase();
  const desc = description.toLowerCase();
  
  if (name.includes('react') || desc.includes('react')) tags.push('React');
  if (name.includes('vue') || desc.includes('vue')) tags.push('Vue');
  if (name.includes('angular') || desc.includes('angular')) tags.push('Angular');
  if (name.includes('webpack') || desc.includes('webpack')) tags.push('構建工具');
  if (name.includes('eslint') || name.includes('prettier')) tags.push('代碼規範');
  if (name.includes('test') || name.includes('jest') || name.includes('mocha')) tags.push('測試');
  if (name.includes('ui') || name.includes('component')) tags.push('UI元件');
  if (name.includes('cli')) tags.push('CLI工具');
  if (name.includes('util') || name.includes('helper')) tags.push('工具庫');
  
  return {
    name: packageName,
    version: version,
    description: description.substring(0, 200),
    url: window.location.href,
    savedAt: Date.now(),
    tags: tags.length > 0 ? tags : ['未分類']
  };
}

async function checkIfFavorited(packageName) {
  return new Promise((resolve) => {
    chrome.storage.local.get('packages', (result) => {
      const packages = result.packages || [];
      resolve(packages.some(pkg => pkg.name === packageName));
    });
  });
}

async function addToFavorites(packageInfo) {
  return new Promise((resolve) => {
    chrome.storage.local.get('packages', (result) => {
      const packages = result.packages || [];
      
      // 檢查是否已存在
      const existingIndex = packages.findIndex(pkg => pkg.name === packageInfo.name);
      if (existingIndex !== -1) {
        // 更新現有記錄
        packages[existingIndex] = { ...packages[existingIndex], ...packageInfo };
      } else {
        // 添加新記錄
        packages.unshift(packageInfo);
      }
      
      chrome.storage.local.set({ packages }, resolve);
    });
  });
}

async function removeFromFavorites(packageName) {
  return new Promise((resolve) => {
    chrome.storage.local.get('packages', (result) => {
      const packages = result.packages || [];
      const filtered = packages.filter(pkg => pkg.name !== packageName);
      chrome.storage.local.set({ packages: filtered }, resolve);
    });
  });
}

function showNotification(message, packageName) {
  // 創建通知元素
  const notification = document.createElement('div');
  notification.className = 'npm-favorite-notification';
  notification.innerHTML = `
    <span style="font-size: 18px; margin-right: 8px;">📦</span>
    <div>
      <div style="font-weight: 600;">${message}</div>
      <div style="font-size: 12px; opacity: 0.8; margin-top: 2px;">${packageName}</div>
    </div>
  `;
  
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 10000;
    display: flex;
    align-items: center;
    animation: slideIn 0.3s ease;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
  `;
  
  // 添加動畫
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }
  `;
  
  if (!document.querySelector('style[data-npm-favorite]')) {
    style.setAttribute('data-npm-favorite', 'true');
    document.head.appendChild(style);
  }
  
  document.body.appendChild(notification);
  
  // 3秒後移除
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}

// 監聽頁面變化（用於 SPA 導航）
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    if (window.location.pathname.startsWith('/package/')) {
      setTimeout(init, 500);
    }
  }
}).observe(document, { subtree: true, childList: true });