import { useState } from 'react';
import { useFiles } from '../context/FileContext.jsx';
import { VscFiles, VscCloudDownload, VscDatabase, VscFolderOpened } from 'react-icons/vsc';

export default function Sidebar({ open, onClose }) {
  const {
    navigate, currentPath, downloadAll, vaultInfo,
    storageMode, deviceName, switchToVault, openDeviceFolder,
    isFileSystemSupported, isWebkitSupported
  } = useFiles();

  const handleNav = (path) => {
    navigate(path);
    onClose?.();
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    let size = bytes;
    while (size >= 1024 && i < units.length - 1) { size /= 1024; i++; }
    return `${size.toFixed(1)} ${units[i]}`;
  };

  return (
    <>
      {open && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">OV</div>
          <span className="sidebar-title">OpenVault</span>
        </div>

        <nav className="sidebar-nav">
          {/* Vault Section */}
          <div style={{ padding: '4px 12px 8px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-tertiary)' }}>
            Storage
          </div>

          <div
            className={`nav-item ${storageMode === 'vault' ? 'active' : ''}`}
            onClick={() => { switchToVault(); onClose?.(); }}
          >
            <span className="nav-icon"><VscDatabase /></span>
            My Vault
          </div>

          <div
            className={`nav-item ${storageMode === 'device' ? 'active' : ''}`}
            onClick={async () => {
              if (isFileSystemSupported || isWebkitSupported) {
                await openDeviceFolder();
                onClose?.();
              }
            }}
            title={isFileSystemSupported ? 'Open device folder' : 'Upload a folder from your device'}
          >
            <span className="nav-icon"><VscFolderOpened /></span>
            {storageMode === 'device' ? deviceName || 'Device' : 'Browse Device'}
          </div>

          <div style={{ padding: '12px 12px 4px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-tertiary)', marginTop: 8 }}>
            Quick Links
          </div>

          <div
            className={`nav-item ${currentPath === '/' && storageMode === 'vault' ? 'active' : ''}`}
            onClick={() => handleNav('/')}
          >
            <span className="nav-icon"><VscFiles /></span>
            All Files
          </div>
        </nav>

        <div className="sidebar-footer">
          {storageMode === 'vault' && (
            <div className="vault-info">
              <div className="vault-stat">
                <span>Files</span>
                <span>{vaultInfo?.fileCount ?? 0}</span>
              </div>
              <div className="vault-stat">
                <span>Folders</span>
                <span>{vaultInfo?.folderCount ?? 0}</span>
              </div>
              <div className="vault-stat">
                <span>Total Size</span>
                <span>{formatSize(vaultInfo?.totalSize || 0)}</span>
              </div>
            </div>
          )}

          {storageMode === 'device' && (
            <div className="vault-info">
              <div className="vault-stat">
                <span>Source</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{deviceName || 'Device'}</span>
              </div>
            </div>
          )}

          {storageMode === 'vault' && (
            <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
              <button className="tool-btn" onClick={downloadAll} title="Download entire vault as ZIP">
                <VscCloudDownload /> Download Vault
              </button>
            </div>
          )}

          {!isFileSystemSupported && !isWebkitSupported && storageMode === 'vault' && (
            <div style={{ marginTop: 8, padding: '8px', fontSize: 11, color: 'var(--text-tertiary)', textAlign: 'center', background: 'var(--bg-tertiary)', borderRadius: 6 }}>
              Device browsing requires a browser that supports the File System Access API (Chrome/Edge).
            </div>
          )}
        </div>
      </aside>
    </>
  );
}