# OpenVault

> A cross-platform React file manager with theme system, no folder access restrictions, and one-click folder downloads.

![OpenVault](public/favicon.svg)

## ✨ Features

- **Full Folder Access** — No restrictions. Browse, open, and manage every folder.
- **Cross-Platform** — Works on desktop and mobile (Windows, macOS, Linux, iOS, Android).
- **Theme System** — 5 built-in themes (Light, Dark, Ocean, Forest, Sunset) with CSS variable architecture.
- **One-Click Downloads** — Download individual files or entire folders as ZIP.
- **Drag & Drop** — Upload files by dragging them into the window.
- **Grid & List Views** — Switch between visual grid and detailed list views.
- **Create & Organize** — Create folders, rename items, move files between folders.
- **Search** — Full-text search across all files and folders.
- **Persistent Storage** — All data stored in your browser's IndexedDB — no server required.
- **Touch-Friendly** — Responsive UI designed for both mouse and touch interactions.
- **No Installation** — Runs entirely in the browser. Share via URL or serve as a PWA.

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server
npm run dev

# 3. Open in browser
#    http://localhost:5173
```

## 🏗️ Build for Production

```bash
npm run build
```

The output will be in the `dist/` folder. Serve it with any static server:

```bash
npm run preview
```

## 📁 Project Structure

```
openvault/
├── index.html              # Entry HTML
├── package.json            # Dependencies & scripts
├── vite.config.js          # Vite bundler config
├── public/
│   └── favicon.svg         # App icon
├── src/
│   ├── main.jsx            # React entry point
│   ├── App.jsx             # Root app component
│   ├── index.css           # Global styles & CSS variables
│   ├── context/
│   │   ├── ThemeContext.jsx # Theme state & CSS variable injection
│   │   └── FileContext.jsx  # File system state & operations
│   ├── components/
│   │   ├── Sidebar.jsx      # Navigation sidebar
│   │   ├── Toolbar.jsx      # Action toolbar + modals
│   │   ├── Breadcrumb.jsx   # Path navigation
│   │   ├── FileExplorer.jsx # Grid/list file display
│   │   ├── ContextMenu.jsx  # Right-click context menu
│   │   └── ThemeSwitcher.jsx# Theme selector UI
│   ├── themes/
│   │   └── index.js         # 5 color themes (Light, Dark, Ocean, Forest, Sunset)
│   └── utils/
│       └── fileSystem.js    # Virtual file system in IndexedDB
```

## 🎨 Theme System

OpenVault includes 5 themes. Themes are built on CSS custom properties — new themes can be added by providing a color object:

```js
export const myCustomTheme = {
  name: 'My Theme',
  id: 'my-theme',
  colors: {
    bgPrimary: '#...',
    textPrimary: '#...',
    accent: '#...',
    // ... see themes/index.js for full list
  },
  isDark: false,
};
```

Themes are applied automatically via CSS variables on `<html>`.

## 💻 Tech Stack

- **React 18** — UI library
- **Vite 5** — Build tool & dev server
- **react-icons** — VS Code style icons
- **JSZip** — Folder download as ZIP
- **FileSaver** — Browser file download
- **IndexedDB** — Persistent file storage

## 📱 Mobile Support

- Responsive grid adapts to screen size
- Hamburger menu for sidebar navigation
- Touch-friendly tap targets
- No install required — works in mobile browser

## 📄 License

MIT — Free and open source.