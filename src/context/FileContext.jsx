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

const FileContext = createContext(null);

export function FileProvider({ children }) {
  const [currentPath, setCurrentPath] = useState('/');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [vaultInfo, setVaultInfo] = useState(null);
  const [selectedItems, setSelectedItems] = useState(new Set());

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
    await navigate(currentPath);
    const info = await getVaultInfo();
    setVaultInfo(info);
  }, [currentPath, navigate]);

  const refreshInfo = useCallback(async () => {
    const info = await getVaultInfo();
    setVaultInfo(info);
  }, []);

  useEffect(() => {
    navigate('/');
    getVaultInfo().then(setVaultInfo);
  }, []);

  const handleCreateFolder = useCallback(async (name) => {
    try {
      await createFolder(currentPath, name);
      await refresh();
    } catch (err) {
      throw err;
    }
  }, [currentPath, refresh]);

  const handleUpload = useCallback(async (files) => {
    for (const file of files) {
      await uploadFile(currentPath, file);
    }
    await refresh();
  }, [currentPath, refresh]);

  const handleRename = useCallback(async (itemPath, newName) => {
    await renameItem(itemPath, newName);
    await refresh();
  }, [refresh]);

  const handleDelete = useCallback(async (itemPath) => {
    await deleteItem(itemPath);
    await refresh();
    await refreshInfo();
  }, [refresh, refreshInfo]);

  const handleDownload = useCallback(async (itemPath) => {
    await downloadFile(itemPath);
  }, []);

  const handleDownloadAll = useCallback(async () => {
    await downloadFolder('/');
  }, []);

  const handleMove = useCallback(async (sourcePath, destPath) => {
    await moveItem(sourcePath, destPath);
    await refresh();
  }, [refresh]);

  const handleSearch = useCallback(async (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    const results = await searchFiles(query);
    setSearchResults(results);
  }, []);

  const handleReset = useCallback(async () => {
    await resetVault();
    await navigate('/');
    await refreshInfo();
  }, [navigate, refreshInfo]);

  const toggleSelect = useCallback((path) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedItems(new Set(items.map(i => i.path)));
  }, [items]);

  const clearSelection = useCallback(() => {
    setSelectedItems(new Set());
  }, []);

  return (
    <FileContext.Provider value={{
      currentPath,
      items,
      loading,
      error,
      searchQuery,
      searchResults,
      vaultInfo,
      selectedItems,
      navigate,
      refresh,
      createFolder: handleCreateFolder,
      uploadFiles: handleUpload,
      rename: handleRename,
      delete: handleDelete,
      download: handleDownload,
      downloadAll: handleDownloadAll,
      move: handleMove,
      search: handleSearch,
      reset: handleReset,
      toggleSelect,
      selectAll,
      clearSelection,
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