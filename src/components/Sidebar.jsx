import { useState } from 'react';
import { useFiles } from '../context/FileContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { VscFiles, VscFolder, VscCloudDownload, VscSettingsGear } from 'react-icons/vsc';

export default function Sidebar({ open, onClose }) {
  const { navigate, currentPath, downloadAll, vaultInfo } = useFiles();
  const { theme } = useTheme();
  const [showThemeModal, setShowThemeModal] = useState(false);

  const quickFolders = [
    { name: 'All Files', path: '/', icon: <VscFiles /> },
  ];

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
          {quickFolders.map((folder) => (
            <div
              key={folder.path}
              className={`nav-item ${currentPath === folder.path ? 'active' : ''}`}
              onClick={() => handleNav(folder.path)}
            >
              <span className="nav-icon">{folder.icon}</span>
              {folder.name}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
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

          <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
            <button className="tool-btn" onClick={downloadAll} title="Download entire vault as ZIP">
              <VscCloudDownload /> Download Vault
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}