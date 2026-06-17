import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getFolderContents,
  createFolder,
  uploadFile,
  renameItem,
  deleteItem,
  downloadFile,
  downloadFolder,
  moveItem,
  searchFiles,
  getVaultInfo,
  resetVault,
} from '../utils/fileSystem.js';
import {
  pickDeviceDirectory,
  getDeviceContents,
  getSubDirectory,
  getRootHandle,
  getRootName,
  clearDeviceDirectory,
  isFileSystemAccessSupported,
  isWebkitDirectorySupported,
  processDirectoryUpload,
  getUploadedContents,
  getUploadedNodeByPath,
} from '../utils/deviceFileSystem.js';

const FileContext = createContext(null);

export function FileProvider({ children }) {
  // Storage mode: 'vault' or 'device'
  const [storageMode, setStorageMode] = useState('vault');

  // Vault state
  const [currentPath, setCurrentPath] = useState('/');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [vaultInfo, setVaultInfo] = useState(null);
  const [selectedItems, setSelectedItems] = useState(new Set());

  // Device storage state
  const [deviceRoot, setDeviceRoot] = useState(null);
  const [deviceCurrentHandle, setDeviceCurrentHandle] = useState(null);
  const [devicePath, setDevicePath] = useState('');
  const [deviceItems, setDeviceItems] = useState([]);
  const [deviceName, setDeviceName] = useState('');

  // Directory upload state (mobile fallback)
  const [uploadedRoot, setUploadedRoot] = useState(null);
  const [uploadedPath, setUploadedPath] = useState('');

  // Shared load-more state
  const [showVaultInfo, setShowVaultInfo] = useState(false);

  // --- Vault Navigation ---
  const navigate = useCallback(async (path) => {
    setLoading(true);
    setError(null);
    setSelectedItems(new Set());
    try {
      const contents = await getFolderContents(path);
      setItems(contents);
      setCurrentPath(path);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    if (storageMode === 'vault') {
      await navigate(currentPath);
      const info = await getVaultInfo();
      setVaultInfo(info);
    } else if (storageMode === 'device' && deviceCurrentHandle) {
      await refreshDevice();
    } else if (storageMode === 'device' && uploadedRoot) {
      refreshUploaded();
    }
  }, [storageMode, currentPath, navigate, deviceCurrentHandle, uploadedRoot]);

  const refreshInfo = useCallback(async () => {
    const info = await getVaultInfo();
    setVaultInfo(info);
  }, []);

  // --- Device Navigation ---
  const openDeviceFolder = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await pickDeviceDirectory();
      if (!result) {
        setLoading(false);
        return;
      }
      setDeviceRoot(result.handle);
      setDeviceCurrentHandle(result.handle);
      setDeviceName(result.name);
      setDevicePath('');
      setStorageMode('device');

      const contents = await getDeviceContents(result.handle);
      setDeviceItems(contents);
    } catch (err) {
      setError(err.message || 'Could not access device storage');
    } finally {
      setLoading(false);
    }
  }, []);

  const navigateDevice = useCallback(async (handle, pathName) => {
    setLoading(true);
    setError(null);
    try {
      const contents = await getDeviceContents(handle);
      setDeviceItems(contents);
      setDeviceCurrentHandle(handle);
      setDevicePath(pathName || '');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const navigateDeviceToSubfolder = useCallback(async (folderName) => {
    if (!deviceCurrentHandle) return;
    try {
      const subHandle = await deviceCurrentHandle.getDirectoryHandle(folderName);
      const newPath = devicePath ? `${devicePath}/${folderName}` : folderName;
      await navigateDevice(subHandle, newPath);
    } catch (err) {
      setError('Cannot open folder: ' + err.message);
    }
  }, [deviceCurrentHandle, devicePath, navigateDevice]);

  const refreshDevice = useCallback(async () => {
    if (deviceCurrentHandle) {
      const contents = await getDeviceContents(deviceCurrentHandle);
      setDeviceItems(contents);
    }
  }, [deviceCurrentHandle]);

  // --- Directory Upload (Mobile fallback) ---
  const handleDirectoryUpload = useCallback((files) => {
    const tree = processDirectoryUpload(files);
    setUploadedRoot(tree);
    setUploadedPath('');
    setDeviceName(tree.name);
    setStorageMode('device');

    const contents = getUploadedContents(tree);
    setDeviceItems(contents);
    setDeviceCurrentHandle(null);
  }, []);

  const navigateUploaded = useCallback(async (path) => {
    if (!uploadedRoot) return;
    const node = getUploadedNodeByPath(uploadedRoot, path);
    if (!node) return;
    setUploadedPath(path);
    const contents = getUploadedContents(node);
    setDeviceItems(contents);
  }, [uploadedRoot]);

  const refreshUploaded = useCallback(() => {
    if (uploadedRoot) {
      const node = getUploadedNodeByPath(uploadedRoot, uploadedPath);
      const contents = getUploadedContents(node);
      setDeviceItems(contents);
    }
  }, [uploadedRoot, uploadedPath]);

  // --- Switch storage mode ---
  const switchToVault = useCallback(async () => {
    setStorageMode('vault');
    setError(null);
    setSelectedItems(new Set());
    await navigate(currentPath);
  }, [currentPath, navigate]);

  // --- Vault operations ---
  useEffect(() => {
    if (storageMode === 'vault') {
      navigate('/');
      getVaultInfo().then(setVaultInfo);
    }
  }, []);

  // @Override initial load
  useEffect(() => {
    if (storageMode === 'vault' && items.length === 0 && !loading) {
      navigate('/');
      getVaultInfo().then(setVaultInfo);
    }
  }, [storageMode]);

  const handleCreateFolder = useCallback(async (name) => {
    if (storageMode !== 'vault') throw new Error('Can only create folders in Vault mode');
    try {
      await createFolder(currentPath, name);
      await refresh();
    } catch (err) {
      throw err;
    }
  }, [currentPath, refresh, storageMode]);

  const handleUpload = useCallback(async (files) => {
    if (storageMode === 'vault') {
      for (const file of files) {
        await uploadFile(currentPath, file);
      }
      await refresh();
    }
  }, [currentPath, refresh, storageMode]);

  const handleRename = useCallback(async (itemPath, newName) => {
    if (storageMode !== 'vault') return;
    await renameItem(itemPath, newName);
    await refresh();
  }, [refresh, storageMode]);

  const handleDelete = useCallback(async (itemPath) => {
    if (storageMode !== 'vault') return;
    await deleteItem(itemPath);
    await refresh();
    await refreshInfo();
  }, [refresh, refreshInfo, storageMode]);

  const handleDownload = useCallback(async (itemPath) => {
    if (storageMode === 'vault') {
      await downloadFile(itemPath);
    } else if (deviceCurrentHandle) {
      // Download from device using File System Access API
      try {
        const fileName = itemPath.split('/').pop();
        // Navigate to the parent first, then get file
        const fileHandle = await deviceCurrentHandle.getFileHandle(fileName);
        const file = await fileHandle.getFile();
        const url = URL.createObjectURL(file);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
      } catch (err) {
        // Fall back to simple download if we can
      }
    } else if (uploadedRoot) {
      const node = getUploadedNodeByPath(uploadedRoot, itemPath);
      if (node && node.file) {
        const url = URL.createObjectURL(node.file);
        const a = document.createElement('a');
        a.href = url;
        a.download = node.name;
        a.click();
        URL.revokeObjectURL(url);
      }
    }
  }, [storageMode, deviceCurrentHandle, uploadedRoot]);

  const handleDownloadAll = useCallback(async () => {
    if (storageMode === 'vault') {
      await downloadFolder('/');
    }
  }, [storageMode]);

  const handleMove = useCallback(async (sourcePath, destPath) => {
    if (storageMode !== 'vault') return;
    await moveItem(sourcePath, destPath);
    await refresh();
  }, [refresh, storageMode]);

  const handleSearch = useCallback(async (query) => {
    if (storageMode !== 'vault') return;
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    const results = await searchFiles(query);
    setSearchResults(results);
  }, [storageMode]);

  const handleReset = useCallback(async () => {
    if (storageMode !== 'vault') return;
    await resetVault();
    await navigate('/');
    await refreshInfo();
  }, [navigate, refreshInfo, storageMode]);

  const toggleSelect = useCallback((path) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    const currentItems = storageMode === 'vault' ? items : deviceItems;
    setSelectedItems(new Set(currentItems.map(i => i.path)));
  }, [items, deviceItems, storageMode]);

  const clearSelection = useCallback(() => {
    setSelectedItems(new Set());
  }, []);

  const displayItems = storageMode === 'vault' ? items : deviceItems;

  return (
    <FileContext.Provider value={{
      // Shared
      storageMode,
      currentPath: storageMode === 'vault' ? currentPath : (devicePath || '/'),
      items: displayItems,
      loading,
      error,
      searchQuery,
      searchResults,
      vaultInfo,
      selectedItems,
      deviceName,
      isFileSystemSupported: isFileSystemAccessSupported(),
      isWebkitSupported: isWebkitDirectorySupported(),

      // Navigation
      navigate: storageMode === 'vault' ? navigate : navigateDevice,
      navigateDeviceToSubfolder,
      navigateUploaded,
      openDeviceFolder,
      switchToVault,
      handleDirectoryUpload,

      // Vault operations
      createFolder: handleCreateFolder,
      uploadFiles: handleUpload,
      rename: handleRename,
      delete: handleDelete,
      download: handleDownload,
      downloadAll: handleDownloadAll,
      move: handleMove,
      search: handleSearch,
      reset: handleReset,

      // Selection
      toggleSelect,
      selectAll,
      clearSelection,
      refresh,
    }}>
      {children}
    </FileContext.Provider>
  );
}

export function useFiles() {
  const ctx = useContext(FileContext);
  if (!ctx) throw new Error('useFiles must be used within FileProvider');
  return ctx;
}