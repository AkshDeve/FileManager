# OpenVault — Setup Instructions

## Prerequisites

- **Node.js** v18+ (recommended: v20+)
- **npm** v9+ or **yarn** v1.22+
- Any modern web browser (Chrome, Firefox, Safari, Edge)

## Installation

### 1. Clone or download the project

```bash
# If using git:
git clone <repo-url> openvault
cd openvault
```

### 2. Install dependencies

```bash
npm install
```

This installs:
- `react` & `react-dom` — UI framework
- `vite` & `@vitejs/plugin-react` — dev server & bundler
- `react-icons` — VS Code-style icons
- `jszip` — ZIP compression for folder downloads
- `file-saver` — Browser file save dialog

### 3. Start the development server

```bash
npm run dev
```

Open **http://localhost:5173** in your browser.

The app will hot-reload when you edit source files.

### 4. Build for production

```bash
npm run build
```

Output goes to `dist/`. Serve it:

```bash
npm run preview
```

## How It Works

OpenVault stores all your files in your browser's **IndexedDB** — a built-in browser database. There is **no server** and **no account needed**. Your files stay in your browser on your device.

### Key Concepts

| Concept | Description |
|---------|-------------|
| **Vault** | Root storage — displayed as "My Vault" in the browser |
| **Folders** | Created via toolbar or right-click. Open any folder freely |
| **Files** | Uploaded via drag-drop or the Upload button |
| **Themes** | Click the gear icon (⚙️) to pick Light, Dark, Ocean, Forest, or Sunset |
| **Download** | Right-click any file or folder → Download. Or use "Download Vault" to export everything |
| **Search** | Type in the search bar to find files by name |
| **Selection** | Click to select items, then batch-delete or batch-download |

### Data Persistence

Your files persist in IndexedDB across browser sessions. **Clearing your browser storage** (site data, IndexedDB) will **delete your vault**. Use the "Download Vault" button to export a ZIP backup.

### No File Restrictions

OpenVault imposes **zero restrictions** on which folders you can open or browse. Every folder and file in your vault is accessible with one click.

## Usage Tips

- **Drag and drop** files from your desktop directly into the app
- Use **right-click** on files/folders for quick actions (Download, Rename, Delete)
- **Grid view** is great for visual browsing; **List view** is better for sorting by size/date
- The **sidebar** shows your vault stats and a quick "All Files" link
- On **mobile**, tap the hamburger menu (☰) to open the sidebar

## Troubleshooting

**"Can't find the app"**
→ Make sure you ran `npm install` before `npm run dev`
→ Check that port 5173 isn't already in use

**"My files disappeared"**
→ Check that you're not in private/incognito mode (some browsers clear IndexedDB on close)
→ Use "Download Vault" regularly to back up

**"The app looks broken"**
→ Try a hard refresh (Ctrl+F5 or Cmd+Shift+R)
→ Clear site data for localhost:5173 in your browser settings

## Development

```bash
# Start dev server with host access (for mobile testing)
npm run dev -- --host

# Build and preview
npm run build && npm run preview
```

OpenVault uses Vite. See the [Vite docs](https://vitejs.dev/) for configuration options.