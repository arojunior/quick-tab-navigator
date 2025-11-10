# Quick Tab Navigator

A Chrome extension that allows you to navigate through your tabs in the order you visited them, similar to IntelliJ's cursor position navigation. Uses `Option + Left/Right Arrow` by default.

## Features

- **Navigate Back**: Press `Option + Left Arrow` (default) to go to the previous tab you visited
- **Navigate Forward**: Press `Option + Right Arrow` (default) to go to the next tab in your visit history
- **Automatic History Tracking**: Automatically tracks which tabs you visit and in what order
- **Smart History Management**: Removes closed tabs from history and limits history size for performance
- **Customizable Shortcuts**: Change the keyboard shortcuts to your preference

## Installation

### From Source (Developer Mode)

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in the top right)
4. Click "Load unpacked"
5. Select the folder containing this extension
6. The extension is now installed!

### Keyboard Shortcuts

**Default Shortcuts** (automatically set):
- **Navigate Back**: `Option + Left Arrow` (Mac) or `Alt + Left Arrow` (Windows/Linux)
- **Navigate Forward**: `Option + Right Arrow` (Mac) or `Alt + Right Arrow` (Windows/Linux)

**Customizing Shortcuts** (optional):

If you want to change the shortcuts:

1. Go to `chrome://extensions/shortcuts`
2. Find "Quick Tab Navigator" in the list
3. Click on the pencil icon (or the shortcut field) next to each command
4. Press your desired key combination

**Available Modifier Combinations**:
- `Option + Key` ✅ (default - simple and clean!)
- `Command + Shift + Key` ✅
- `Command + Key` ✅
- `Control + Shift + Key` ✅ (on Mac, this uses the actual Control key, not Command)
- `Command + Option + Key` ❌ (not supported by Chrome)

## Usage

1. **Normal Tab Navigation**: Just click on tabs as you normally would. The extension automatically tracks your navigation.

2. **Navigate Back**: Press `Option + Left Arrow` (or your custom shortcut) to go back to the previous tab you visited.

3. **Navigate Forward**: Press `Option + Right Arrow` (or your custom shortcut) to go forward to the next tab in your visit history (if you've navigated back).

## How It Works

- The extension maintains a history stack of tabs you've visited
- When you click on a tab, it's added to the history
- When you navigate back/forward, you move through this history
- Closed tabs are automatically removed from the history
- History is limited to the last 50 tabs for performance

## Development

### Project Structure

```
quick-tab-navigator/
├── manifest.json      # Extension configuration
├── background.js      # Background service worker (tracks tab history)
├── README.md          # This file
└── icons/             # Extension icons (optional)
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

### Making Changes

1. Edit the files as needed
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card to reload your changes

## Troubleshooting

- **Shortcuts not working**: Make sure you've configured them at `chrome://extensions/shortcuts`
- **Extension not tracking tabs**: Check that the extension is enabled in `chrome://extensions/`
- **History seems wrong**: Close and reopen the extension, or reload it from the extensions page

## License

MIT

