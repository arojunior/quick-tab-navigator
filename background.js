// Tab navigation history tracking
let tabHistory = [];
let currentHistoryIndex = -1;
let isNavigating = false; // Flag to prevent adding navigation to history

// Initialize: Get current active tab and add it to history
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (tabs.length > 0) {
    tabHistory = [tabs[0].id];
    currentHistoryIndex = 0;
  }
});

// Track when a tab is activated (user clicks on a tab)
chrome.tabs.onActivated.addListener((activeInfo) => {
  if (isNavigating) {
    // Don't add to history if we're programmatically navigating
    isNavigating = false;
    return;
  }

  const tabId = activeInfo.tabId;
  const currentTabId = tabHistory[currentHistoryIndex];

  // Only add to history if it's a different tab
  if (tabId !== currentTabId) {
    // Remove any forward history if we're not at the end
    if (currentHistoryIndex < tabHistory.length - 1) {
      tabHistory = tabHistory.slice(0, currentHistoryIndex + 1);
    }

    // Add new tab to history
    tabHistory.push(tabId);
    currentHistoryIndex = tabHistory.length - 1;

    // Limit history size to prevent memory issues (keep last 50 tabs)
    if (tabHistory.length > 50) {
      tabHistory = tabHistory.slice(-50);
      currentHistoryIndex = tabHistory.length - 1;
    }
  }
});

// Track when a tab is updated (e.g., page loads)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // When a tab becomes active due to navigation, update history
  if (changeInfo.status === 'complete' && tab.active && !isNavigating) {
    const currentTabId = tabHistory[currentHistoryIndex];
    if (tabId !== currentTabId) {
      // This handles cases where a new tab is opened and becomes active
      if (currentHistoryIndex < tabHistory.length - 1) {
        tabHistory = tabHistory.slice(0, currentHistoryIndex + 1);
      }
      tabHistory.push(tabId);
      currentHistoryIndex = tabHistory.length - 1;
    }
  }
});

// Handle tab removal - clean up history
chrome.tabs.onRemoved.addListener((tabId) => {
  const index = tabHistory.indexOf(tabId);
  if (index !== -1) {
    tabHistory.splice(index, 1);

    // Adjust current index if needed
    if (index <= currentHistoryIndex) {
      currentHistoryIndex--;
    }

    // Ensure index is valid
    if (currentHistoryIndex < 0 && tabHistory.length > 0) {
      currentHistoryIndex = 0;
    }
    if (currentHistoryIndex >= tabHistory.length) {
      currentHistoryIndex = tabHistory.length - 1;
    }
  }
});

// Navigate to previous tab in history
function navigateBack() {
  if (currentHistoryIndex > 0) {
    currentHistoryIndex--;
    const tabId = tabHistory[currentHistoryIndex];
    isNavigating = true;

    chrome.tabs.get(tabId, (tab) => {
      if (chrome.runtime.lastError) {
        // Tab doesn't exist anymore, remove from history and try again
        tabHistory.splice(currentHistoryIndex, 1);
        if (currentHistoryIndex >= tabHistory.length) {
          currentHistoryIndex = tabHistory.length - 1;
        }
        if (currentHistoryIndex >= 0) {
          navigateBack();
        }
        return;
      }

      chrome.tabs.update(tabId, { active: true });
      chrome.windows.update(tab.windowId, { focused: true });
    });
  }
}

// Navigate to next tab in history
function navigateForward() {
  if (currentHistoryIndex < tabHistory.length - 1) {
    currentHistoryIndex++;
    const tabId = tabHistory[currentHistoryIndex];
    isNavigating = true;

    chrome.tabs.get(tabId, (tab) => {
      if (chrome.runtime.lastError) {
        // Tab doesn't exist anymore, remove from history and try again
        tabHistory.splice(currentHistoryIndex, 1);
        if (currentHistoryIndex >= tabHistory.length) {
          currentHistoryIndex = tabHistory.length - 1;
        }
        if (currentHistoryIndex < tabHistory.length - 1) {
          navigateForward();
        }
        return;
      }

      chrome.tabs.update(tabId, { active: true });
      chrome.windows.update(tab.windowId, { focused: true });
    });
  }
}

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
  if (command === 'navigate-back') {
    navigateBack();
  } else if (command === 'navigate-forward') {
    navigateForward();
  }
});

