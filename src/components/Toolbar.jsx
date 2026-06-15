import { useState, useRef } from 'react';
import { useFiles } from '../context/FileContext.jsx';
import Breadcrumb from './Breadcrumb.jsx';
import {
  VscNewFolder, VscCloudUpload, VscRefresh, VscCloudDownload,
  VscSettingsGear, VscMenu, VscTrash, VscEdit
} from 'react-icons/vsc';
import ThemeSwitcher from './ThemeSwitcher.jsx';

export default function Toolbar({ onMenuToggle, selectedItem }) {
  const {
    items, currentPath, navigate, createFolder, uploadFiles, refresh,
    download, downloadAll, delete: deleteItem, rename, selectedItems, clearSelection
  } = useFiles();
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRename, setShowRename] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [renameName, setRenameName] = useState('');
  const fileInputRef = useRef(null);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      await createFolder(newFolderName.trim());
      setNewFolderName('');
      setShowNewFolder(false);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpload = (e) => {
    const files = e.target.files;
    if (files?.length > 0) {
      uploadFiles(files);
    }
    e.target.value = '';
  };

  const handleDeleteSelected = async () => {
    for (const path of selectedItems) {
      await deleteItem(path);
    }
    clearSelection();
    setShowDeleteConfirm(false);
  };

  const handleRename = async () => {
    if (!renameName.trim() || selectedItems.size !== 1) return;
    const itemPath = selectedItems.values().next().value;
    await rename(itemPath, renameName.trim());
    setRenameName('');
    setShowRename(false);
    clearSelection();
  };

  const handleDownloadSelected = () => {
    for (const path of selectedItems) {
      download(path);
    }
    clearSelection?.();
  };

  const openRename = () => {
    if (selectedItems.size === 1) {
      const path = selectedItems.values().next().value;
      const name = path.split('/').pop();
      setRenameName(name);
      setShowRename(true);
    }
  };

  return (
    <>
      <div className="toolbar">
        <div className="toolbar-left">
          <button className="mobile-nav-toggle tool-btn icon-only" onClick={onMenuToggle}>
            <VscMenu />
          </button>
          <Breadcrumb />
        </div>

        <div className="toolbar-right">
          <button className="tool-btn" onClick={() => setShowNewFolder(true)} title="Create new folder">
            <VscNewFolder /> <span>New Folder</span>
          </button>
          <button className="tool-btn" onClick={() => fileInputRef.current?.click()} title="Upload files">
            <VscUpload /> <span>Upload</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            style={{ display: 'none' }}
            onChange={handleUpload}
          />

          <div className="toolbar-divider" />

          {selectedItems.size === 1 && (
            <button className="tool-btn" onClick={openRename} title="Rename">
              <VscEdit /> <span>Rename</span>
            </button>
          )}

          {selectedItems.size > 0 && (
            <>
              <button className="tool-btn" onClick={handleDownloadSelected} title="Download selected">
                <VscCloudDownload /> <span>Download</span>
              </button>
              <button className="tool-btn" onClick={() => setShowDeleteConfirm(true)} title="Delete selected">
                <VscTrash /> <span>Delete</span>
              </button>
            </>
          )}

          <div className="toolbar-divider" />

          <button className="tool-btn" onClick={refresh} title="Refresh">
            <VscRefresh />
          </button>
          <button className="tool-btn" onClick={() => setShowThemeModal(true)} title="Theme settings">
            <VscSettingsGear />
          </button>
        </div>
      </div>

      {/* Upload Progress / Empty state for drag-drop is handled in App.jsx */}

      {/* New Folder Modal */}
      {showNewFolder && (
        <div className="modal-overlay" onClick={() => setShowNewFolder(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Create New Folder</div>
            <input
              className="modal-input"
              placeholder="Folder name..."
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCreateFolder(); if (e.key === 'Escape') setShowNewFolder(false); }}
              autoFocus
            />
            <div className="modal-actions">
              <button className="modal-btn secondary" onClick={() => setShowNewFolder(false)}>Cancel</button>
              <button className="modal-btn primary" onClick={handleCreateFolder}>Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Modal */}
      {showRename && (
        <div className="modal-overlay" onClick={() => setShowRename(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Rename Item</div>
            <input
              className="modal-input"
              placeholder="New name..."
              value={renameName}
              onChange={e => setRenameName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setShowRename(false); }}
              autoFocus
            />
            <div className="modal-actions">
              <button className="modal-btn secondary" onClick={() => setShowRename(false)}>Cancel</button>
              <button className="modal-btn primary" onClick={handleRename}>Rename</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Delete {selectedItems.size} item(s)?</div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
              This action cannot be undone. The files will be permanently deleted from your vault.
            </p>
            <div className="modal-actions">
              <button className="modal-btn secondary" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              <button className="modal-btn danger" onClick={handleDeleteSelected}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Theme Modal */}
      {showThemeModal && (
        <div className="modal-overlay" onClick={() => setShowThemeModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 360 }}>
            <div className="modal-title">Theme Settings</div>
            <ThemeSwitcher />
            <div className="modal-actions" style={{ marginTop: 16 }}>
              <button className="modal-btn primary" onClick={() => setShowThemeModal(false)}>Done</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}