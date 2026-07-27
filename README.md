<div align="center">
  <img src="icons/icon128.png" alt="RTL Fixer - By EHS Logo" width="128" height="128">
  <h1>RTL Fixer - By EHS</h1>
  <p><b>Enhanced Chrome Extension for Automatic RTL Text Handling on AI Chat Platforms</b></p>
</div>

## Overview

**RTL Fixer - By EHS** is an enhanced Chrome extension that automatically fixes Right-to-Left (RTL) text alignment, mixed-language ordering, and layout issues when using Arabic and other RTL scripts on popular AI chat platforms.

This project is built upon the open-source foundation of the original [Now2.ai RTL Fixer](https://github.com/idanmashaal/Now2ai-RTL-Fixer) by Idan Mashaal, with significant custom features, UI upgrades, and performance optimizations introduced by **Eng Hassan A. Soliman (EHS)**.

## Key Upgrades in This Version (By EHS)

- 🎨 **Customizable Indicator Transparency:** Control the opacity of the floating indicator directly from the extension popup slider (from 0% up to 90% transparency).
- 🏷️ **Custom Prefix / Name Customization:** Every user can set their custom name in the popup, displaying e.g. `ChatGPT - EHS` or `NotebookLM - EHS` in real-time across supported sites.
- 📐 **Adjustable Indicator Size (Small / Medium / Large):** Switch between Small, Medium, and Large badge sizes instantly from the extension popup.
- 🖐️ **Smooth Drag-Anywhere Repositioning:** Click and drag the floating indicator anywhere on your screen. Positions are saved per domain with a 1-click reset to default option in the popup menu.
- ⚡ **Custom Dynamic Remote Config:** Updated configuration manager to pull remote dynamic rules directly from the [RTL-Fixer-By-EHS](https://github.com/HassanAhmed238/RTL-Fixer-By-EHS) repository.

## Supported Platforms

- Claude.ai
- ChatGPT
- Google Gemini
- Google NotebookLM
- Perplexity.ai

## Features

- **Automatic RTL Fixing**: Automatically detects and fixes RTL text handling issues on chat inputs and responses.
- **Per-Site Toggle**: Easily enable or disable the extension for specific sites.
- **Non-Destructive Layout**: Applies styling fixes without modifying your actual text content.
- **Draggable & Resettable Indicator**: Reposition the indicator anywhere on your screen, with persistent per-domain coordinate saving and a 1-click reset to default.

## Installation (Developer Mode)

1. Download or clone this repository:
   ```bash
   git clone https://github.com/HassanAhmed238/RTL-Fixer-By-EHS.git
   ```
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** (toggle switch in the top-right corner).
4. Click **Load unpacked** and select the extension directory (`dist/latest-production` or the repository root).

## Technical Details

### Text Direction Handling Strategies
- **Auto Detection**: Handles mixed content (combining RTL and LTR scripts in a single message).
- **Direction Inheritance**: Inherits parent direction where appropriate for clean alignment.
- **Forced RTL**: Guarantees RTL layout for dedicated Arabic input fields.

### Architecture
- `MutationObserver` for real-time DOM monitoring as new chat responses stream in.
- Isolated CSS rules to prevent breaking web page styles.
- Asynchronous Chrome Storage API for saving user preferences.

## Development & Building

1. Clone the repository and install dev dependencies:
   ```bash
   npm install
   ```
2. Build the extension:
   - Development build: `npm run dev:build`
   - Production build: `npm run prod:build`

## Privacy & Security

- **Local Execution:** Operates entirely inside your browser.
- **Zero Data Collection:** Does not collect, store, or transmit your conversations or private data.
- **Full Transparency:** See our [Privacy Policy](PRIVACY_POLICY.md).

## Credits & Acknowledgments

- **Original Base Project:** Created by Idan Mashaal ([Now2.ai RTL Fixer](https://github.com/idanmashaal/Now2ai-RTL-Fixer)).
- **Enhancements & Maintenance:** Developed by **Eng Hassan A. Soliman (EHS)**.

## License

Distributed under the GNU General Public License v3.0. See [LICENSE](LICENSE) for details.
