import { useState, useCallback, useRef } from 'react';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { FileProvider, useFiles } from './context/FileContext.jsx';
import Sidebar from './components/Sidebar.jsx';
import Toolbar from './components/Toolbar.jsx';
import FileExplorer from './components/FileExplorer.jsx';
import ContextMenu from './components/ContextMenu.jsx';

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const { uploadFiles, storageMode } = useFiles();
  const dragCounter = useRef(0);

  const handleContextMenu = useCallback((e, item) => {
    setContextMenu({ x: e.clientX, y: e.clientY, item });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  // Drag-and-drop upload support (vault only)
  const handleDragEnter = useCallback((e) => {
    if (storageMode !== 'vault') return;
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items?.length > 0) {
      setIsDragging(true);
    }
  }, [storageMode]);

  const handleDragLeave = useCallback((e) => {
    if (storageMode !== 'vault') return;
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }, [storageMode]);

  const handleDragOver = useCallback((e) => {
    if (storageMode !== 'vault') return;
    e.preventDefault();
    e.stopPropagation();
  }, [storageMode]);

  const handleDrop = useCallback((e) => {
    if (storageMode !== 'vault') return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;
    const files = e.dataTransfer.files;
    if (files?.length > 0) {
      uploadFiles(files);
    }
  }, [uploadFiles, storageMode]);

  return (
    <div
      className="app-layout"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Toolbar onMenuToggle={() => setSidebarOpen(prev => !prev)} />
        <FileExplorer
          onContextMenu={handleContextMenu}
        />
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          item={contextMenu.item}
          onClose={closeContextMenu}
        />
      )}

      {isDragging && (
        <div className="dropzone">
          <div className="dropzone-text">📂 Drop files to upload</div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <FileProvider>
        <AppContent />
      </FileProvider>
    </ThemeProvider>
  );
}