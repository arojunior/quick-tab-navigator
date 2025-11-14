// Tab navigation history tracking
let tabHistory = [];
let currentHistoryIndex = -1;
let isNavigating = false; // Flag to prevent adding navigation to history

// Save state to persistent storage
async function saveState() {
  await chrome.storage.local.set({
    tabHistory: tabHistory,
    currentHistoryIndex: currentHistoryIndex
  });
}

// Load state from persistent storage
async function loadState() {
  try {
    const result = await chrome.storage.local.get(['tabHistory', 'currentHistoryIndex']);
    if (result.tabHistory && Array.isArray(result.tabHistory)) {
      tabHistory = result.tabHistory;
      currentHistoryIndex = result.currentHistoryIndex !== undefined ? result.currentHistoryIndex : -1;

      // Validate and clean up history - remove tabs that no longer exist
      const tabCheckPromises = tabHistory.map(async (tabId) => {
        try {
          await chrome.tabs.get(tabId);
          return tabId;
        } catch (error) {
          return null;
        }
      });

      const validTabs = await Promise.all(tabCheckPromises);
      tabHistory = validTabs.filter(tabId => tabId !== null);

      // Adjust current index if needed
      if (currentHistoryIndex >= tabHistory.length) {
        currentHistoryIndex = tabHistory.length > 0 ? tabHistory.length - 1 : -1;
      }
      if (currentHistoryIndex < 0 && tabHistory.length > 0) {
        currentHistoryIndex = 0;
      }

      await saveState();
    }
  } catch (error) {
    console.error('Error loading state:', error);
  }
}

// Initialize: Load state and get current active tab
async function initialize() {
  await loadState();

  // Get current active tab and add it to history if not already there
  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    if (tabs.length > 0) {
      const currentTabId = tabs[0].id;

      // If history is empty or current tab is not the last in history, add it
      if (tabHistory.length === 0 || tabHistory[tabHistory.length - 1] !== currentTabId) {
        tabHistory.push(currentTabId);
        currentHistoryIndex = tabHistory.length - 1;
        await saveState();
      } else {
        // Update index to point to current tab if it's already in history
        const index = tabHistory.indexOf(currentTabId);
        if (index !== -1) {
          currentHistoryIndex = index;
          await saveState();
        }
      }
    }
  });
}

// Initialize on service worker startup
initialize();

// Track when a tab is activated (user clicks on a tab)
chrome.tabs.onActivated.addListener(async (activeInfo) => {
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

    await saveState();
  }
});

// Track when a tab is updated (e.g., page loads)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
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
      await saveState();
    }
  }
});

// Handle tab removal - clean up history
chrome.tabs.onRemoved.addListener(async (tabId) => {
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

    await saveState();
  }
});

// Navigate to previous tab in history
async function navigateBack() {
  if (currentHistoryIndex > 0) {
    currentHistoryIndex--;
    const tabId = tabHistory[currentHistoryIndex];
    isNavigating = true;
    await saveState();

    chrome.tabs.get(tabId, async (tab) => {
      if (chrome.runtime.lastError) {
        // Tab doesn't exist anymore, remove from history and try again
        tabHistory.splice(currentHistoryIndex, 1);
        if (currentHistoryIndex >= tabHistory.length) {
          currentHistoryIndex = tabHistory.length - 1;
        }
        await saveState();
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
async function navigateForward() {
  if (currentHistoryIndex < tabHistory.length - 1) {
    currentHistoryIndex++;
    const tabId = tabHistory[currentHistoryIndex];
    isNavigating = true;
    await saveState();

    chrome.tabs.get(tabId, async (tab) => {
      if (chrome.runtime.lastError) {
        // Tab doesn't exist anymore, remove from history and try again
        tabHistory.splice(currentHistoryIndex, 1);
        if (currentHistoryIndex >= tabHistory.length) {
          currentHistoryIndex = tabHistory.length - 1;
        }
        await saveState();
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
