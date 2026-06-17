import { useState, useRef } from 'react';
import { useFiles } from '../context/FileContext.jsx';
import Breadcrumb from './Breadcrumb.jsx';
import {
  VscNewFolder, VscCloudUpload, VscRefresh, VscCloudDownload,
  VscSettingsGear, VscMenu, VscTrash, VscEdit,
  VscFolderOpened, VscHome
} from 'react-icons/vsc';
import ThemeSwitcher from './ThemeSwitcher.jsx';

export default function Toolbar({ onMenuToggle }) {
  const {
    items, currentPath, navigate, createFolder, uploadFiles, refresh,
    download, downloadAll, delete: deleteItem, rename, selectedItems, clearSelection,
    storageMode, openDeviceFolder, handleDirectoryUpload, switchToVault,
    isFileSystemSupported, isWebkitSupported, deviceName,
    navigateDeviceToSubfolder, navigateUploaded
  } = useFiles();

  const [showNewFolder, setShowNewFolder] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRename, setShowRename] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [renameName, setRenameName] = useState('');
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

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

  const handleFolderUpload = (e) => {
    const files = e.target.files;
    if (files?.length > 0) {
      handleDirectoryUpload(files);
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

  const handleDeviceOpen = async () => {
    if (isFileSystemSupported) {
      await openDeviceFolder();
    } else if (isWebkitSupported) {
      folderInputRef.current?.click();
    } else {
      alert('Your browser does not support browsing device folders. Please use Chrome or Edge.');
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

          {/* Storage indicator */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '3px 10px', borderRadius: 12,
            background: storageMode === 'device' ? 'var(--accent-light)' : 'var(--bg-secondary)',
            color: storageMode === 'device' ? 'var(--accent)' : 'var(--text-tertiary)',
            fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', marginLeft: 8
          }}>
            {storageMode === 'vault' ? '📦 VAULT' : `📂 ${deviceName?.toUpperCase() || 'DEVICE'}`}
          </div>
        </div>

        <div className="toolbar-right">
          {/* Vault-specific actions */}
          {storageMode === 'vault' && (
            <>
              <button className="tool-btn" onClick={() => setShowNewFolder(true)} title="Create new folder">
                <VscNewFolder /> <span>New Folder</span>
              </button>
              <button className="tool-btn" onClick={() => fileInputRef.current?.click()} title="Upload files">
                <VscCloudUpload /> <span>Upload</span>
              </button>
              <input ref={fileInputRef} type="file" multiple style={{ display: 'none' }} onChange={handleUpload} />
            </>
          )}

          {/* Device browsing controls */}
          {storageMode === 'device' && (
            <button className="tool-btn primary" onClick={() => switchToVault()} title="Back to Vault">
              <VscHome /> <span>Back to Vault</span>
            </button>
          )}

          <div className="toolbar-divider" />

          {/* Always: Open device folder */}
          <button className="tool-btn" onClick={handleDeviceOpen} title="Browse device files">
            <VscFolderOpened /> <span>Browse Device</span>
          </button>

          {/* Hidden folder upload input (mobile fallback) */}
          <input
            ref={folderInputRef}
            type="file"
            webkitdirectory=""
            directory=""
            multiple
            style={{ display: 'none' }}
            onChange={handleFolderUpload}
          />

          {selectedItems.size === 1 && storageMode === 'vault' && (
            <button className="tool-btn" onClick={openRename} title="Rename">
              <VscEdit /> <span>Rename</span>
            </button>
          )}

          {selectedItems.size > 0 && (
            <>
              <button className="tool-btn" onClick={handleDownloadSelected} title="Download selected">
                <VscCloudDownload /> <span>Download</span>
              </button>
              {storageMode === 'vault' && (
                <button className="tool-btn" onClick={() => setShowDeleteConfirm(true)} title="Delete selected">
                  <VscTrash /> <span>Delete</span>
                </button>
              )}
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