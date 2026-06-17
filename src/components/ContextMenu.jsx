import { useEffect, useRef } from 'react';
import { VscTrash, VscEdit, VscCloudDownload, VscFolderOpened, VscInfo } from 'react-icons/vsc';
import { useFiles } from '../context/FileContext.jsx';

export default function ContextMenu({ x, y, item, onClose }) {
  const { delete: deleteItem, download, rename, navigate, storageMode, navigateDeviceToSubfolder } = useFiles();
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClick = () => onClose();
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  // Adjust position to stay in viewport
  const adjustedX = Math.min(x, window.innerWidth - 200);
  const adjustedY = Math.min(y, window.innerHeight - 280);

  const handleAction = (action) => {
    switch (action) {
      case 'open':
        if (item.type === 'folder') {
          if (storageMode === 'vault') {
            navigate(item.path);
          } else if (storageMode === 'device') {
            if (item.handle?.kind === 'directory') {
              navigateDeviceToSubfolder(item.name);
            }
          }
        }
        break;
      case 'download':
        download(item.path);
        break;
      case 'rename':
        if (storageMode === 'vault') {
          const newName = prompt('Rename to:', item.name);
          if (newName) rename(item.path, newName);
        }
        break;
      case 'delete':
        if (storageMode === 'vault' && confirm(`Delete "${item.name}"?`)) {
          deleteItem(item.path);
        }
        break;
      default:
        break;
    }
    onClose();
  };

  const actions = [
    { label: 'Open', icon: <VscFolderOpened />, action: 'open' },
    { label: 'Download', icon: <VscCloudDownload />, action: 'download' },
  ];

  if (storageMode === 'vault') {
    actions.push(
      { label: 'Rename', icon: <VscEdit />, action: 'rename' },
      { type: 'separator' },
      { label: 'Delete', icon: <VscTrash />, action: 'delete', danger: true }
    );
  }

  return (
    <div
      ref={menuRef}
      className="context-menu"
      style={{ left: adjustedX, top: adjustedY }}
      onClick={e => e.stopPropagation()}
    >
      <div className="context-menu-header" style={{
        padding: '4px 12px 8px',
        borderBottom: '1px solid var(--border-secondary)',
        marginBottom: 4,
        fontSize: 12,
        color: 'var(--text-tertiary)',
        maxWidth: 200,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }}>
        {item.name}
      </div>
      {actions.map((act, i) =>
        act.type === 'separator' ? (
          <div key={i} className="context-menu-separator" />
        ) : (
          <div
            key={i}
            className={`context-menu-item ${act.danger ? 'danger' : ''}`}
            onClick={() => handleAction(act.action)}
          >
            <span className="cm-icon">{act.icon}</span>
            {act.label}
          </div>
        )
      )}
    </div>
  );
}