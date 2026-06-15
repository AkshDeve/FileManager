import { useFiles } from '../context/FileContext.jsx';
import {
  VscTrash, VscRefresh, VscListTree, VscSymbolNamespace
} from 'react-icons/vsc';
import { useState } from 'react';

function formatSize(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let size = bytes;
  while (size >= 1024 && i < units.length - 1) { size /= 1024; i++; }
  return `${size.toFixed(1)} ${units[i]}`;
}

function formatDate(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function FileExplorer({ onContextMenu, onOpenFolder }) {
  const {
    items, loading, error, currentPath, navigate,
    selectedItems, toggleSelect, selectAll, clearSelection,
    searchQuery, searchResults,
  } = useFiles();

  const [viewMode, setViewMode] = useState('grid');
  const displayItems = searchQuery.trim() ? searchResults : items;

  if (loading) {
    return (
      <div className="file-explorer">
        <div className="file-grid">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="file-item" style={{ pointerEvents: 'none' }}>
              <div className="skeleton" style={{ width: 64, height: 64, borderRadius: 12 }} />
              <div className="skeleton" style={{ width: '70%', height: 14, marginTop: 8 }} />
              <div className="skeleton" style={{ width: '40%', height: 12 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state">
        <div className="empty-icon" style={{ color: 'var(--error)' }}>
          <VscTrash />
        </div>
        <div className="empty-title">Error Loading Files</div>
        <div className="empty-desc">{error}</div>
        <button className="tool-btn primary" onClick={() => navigate(currentPath)}>
          <VscRefresh /> Retry
        </button>
      </div>
    );
  }

  if (displayItems.length === 0) {
    const isSearching = searchQuery.trim().length > 0;
    return (
      <div className="empty-state">
        <div className="empty-icon">{isSearching ? '🔍' : '📁'}</div>
        <div className="empty-title">
          {isSearching ? 'No Results Found' : 'This Folder is Empty'}
        </div>
        <div className="empty-desc">
          {isSearching
            ? `No files match "${searchQuery}"`
            : 'Upload files or create a new folder to get started.'
          }
        </div>
      </div>
    );
  }

  const handleDoubleClick = (item) => {
    if (item.type === 'folder') {
      navigate(item.path);
    }
  };

  const handleClick = (e, item) => {
    toggleSelect(item.path);
  };

  const handleContextMenu = (e, item) => {
    e.preventDefault();
    e.stopPropagation();
    onContextMenu(e, item);
  };

  // Grid View
  if (viewMode === 'grid') {
    return (
      <div className="file-explorer">
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4, padding: '0 8px 8px' }}>
          <button
            className={`tool-btn icon-only ${viewMode === 'grid' ? 'primary' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Grid view"
          >
            <VscSymbolNamespace />
          </button>
          <button
            className={`tool-btn icon-only ${viewMode === 'list' ? 'primary' : ''}`}
            onClick={() => setViewMode('list')}
            title="List view"
          >
            <VscListTree />
          </button>
        </div>
        <div className="file-grid">
          {displayItems.map((item) => (
            <div
              key={item.path}
              className={`file-item ${item.type} ${selectedItems.has(item.path) ? 'selected' : ''}`}
              onClick={(e) => handleClick(e, item)}
              onDoubleClick={() => handleDoubleClick(item)}
              onContextMenu={(e) => handleContextMenu(e, item)}
            >
              <div className={`file-icon`}>
                {item.type === 'folder' ? '📁' : '📄'}
              </div>
              <span className="file-name truncate" title={item.name}>{item.name}</span>
              {item.type === 'file' && (
                <span className="file-info">{formatSize(item.size)}</span>
              )}
              {item.type === 'folder' && (
                <span className="file-info">{formatSize(item.size)}</span>
              )}
              <div className="checkbox">
                {selectedItems.has(item.path) && '✓'}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // List View
  return (
    <div className="file-explorer">
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4, padding: '0 8px 8px' }}>
        <button
          className={`tool-btn icon-only ${viewMode === 'grid' ? 'primary' : ''}`}
          onClick={() => setViewMode('grid')}
          title="Grid view"
        >
          <VscSymbolNamespace />
        </button>
        <button
          className={`tool-btn icon-only ${viewMode === 'list' ? 'primary' : ''}`}
          onClick={() => setViewMode('list')}
          title="List view"
        >
          <VscListTree />
        </button>
      </div>
      <table className="file-list">
        <thead>
          <tr>
            <th style={{ width: 24 }}>
              <input
                type="checkbox"
                onChange={(e) => e.target.checked ? selectAll() : clearSelection()}
                checked={selectedItems.size === displayItems.length && displayItems.length > 0}
                style={{ accentColor: 'var(--accent)' }}
              />
            </th>
            <th>Name</th>
            <th style={{ width: 100 }}>Size</th>
            <th style={{ width: 140 }}>Modified</th>
          </tr>
        </thead>
        <tbody>
          {displayItems.map((item) => (
            <tr
              key={item.path}
              className={selectedItems.has(item.path) ? 'selected' : ''}
              onClick={(e) => handleClick(e, item)}
              onDoubleClick={() => handleDoubleClick(item)}
              onContextMenu={(e) => handleContextMenu(e, item)}
            >
              <td>
                <input
                  type="checkbox"
                  checked={selectedItems.has(item.path)}
                  onChange={() => toggleSelect(item.path)}
                  onClick={(e) => e.stopPropagation()}
                  style={{ accentColor: 'var(--accent)' }}
                />
              </td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20 }}>
                    {item.type === 'folder' ? '📁' : '📄'}
                  </span>
                  <span className="truncate" style={{ fontWeight: 500 }} title={item.name}>
                    {item.name}
                  </span>
                </div>
              </td>
              <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                {formatSize(item.size)}
              </td>
              <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                {formatDate(item.modifiedAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}