/**
 * OpenVault Device File System
 *
 * Reads the actual device file system using the File System Access API (desktop)
 * and directory upload (mobile fallback).
 * No restrictions — any accessible folder is browsable.
 */

let directoryHandle = null;
let currentRootName = 'Device';

/**
 * Check if the File System Access API is supported
 */
export function isFileSystemAccessSupported() {
  return 'showDirectoryPicker' in window;
}

/**
 * Open a directory picker to browse device storage
 * Works on desktop Chrome/Edge via File System Access API.
 * On mobile, we'll use webkitdirectory fallback.
 */
export async function pickDeviceDirectory() {
  try {
    if (isFileSystemAccessSupported()) {
      directoryHandle = await window.showDirectoryPicker();
      currentRootName = directoryHandle.name;
      return { name: directoryHandle.name, handle: directoryHandle };
    }
    return null;
  } catch (err) {
    if (err.name === 'AbortError') return null; // User cancelled
    throw err;
  }
}

/**
 * Get contents of a directory handle (File System Access API)
 */
export async function getDeviceContents(dirHandle) {
  const items = [];
  try {
    for await (const [name, handle] of dirHandle.entries()) {
      const isFile = handle.kind === 'file';
      let size = 0;
      let mimeType = '';
      let modifiedAt = null;

      if (isFile) {
        try {
          const file = await handle.getFile();
          size = file.size;
          mimeType = file.type;
          modifiedAt = file.lastModified;
        } catch (e) {
          // Permission or other error reading file metadata
        }
      }

      items.push({
        name,
        path: name,
        type: isFile ? 'file' : 'folder',
        size,
        mimeType,
        modifiedAt,
        handle, // Keep the handle for navigation
      });
    }
  } catch (err) {
    console.error('Error reading directory:', err);
  }

  items.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return items;
}

/**
 * Navigate into a subdirectory handle
 */
export function getSubDirectory(parentHandle, dirName) {
  return parentHandle.getDirectoryHandle(dirName);
}

/**
 * Get root handle for the currently opened device directory
 */
export function getRootHandle() {
  return directoryHandle;
}

/**
 * Get current root name
 */
export function getRootName() {
  return currentRootName;
}

/**
 * Clear device directory selection
 */
export function clearDeviceDirectory() {
  directoryHandle = null;
  currentRootName = 'Device';
}

/**
 * Read a file from a file handle
 */
export async function readDeviceFile(fileHandle) {
  const file = await fileHandle.getFile();
  return file;
}

/**
 * Check if webkitdirectory is supported (mobile fallback)
 */
export function isWebkitDirectorySupported() {
  const input = document.createElement('input');
  return 'webkitdirectory' in input;
}

/**
 * Process files uploaded via webkitdirectory input
 * Returns a tree structure of files and folders
 */
export function processDirectoryUpload(files) {
  const root = { name: 'Uploaded Folder', type: 'folder', children: {}, path: '' };

  for (const file of files) {
    const parts = file.webkitRelativePath.split('/');
    let current = root;
    let currentPath = '';

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      currentPath = currentPath ? `${currentPath}/${part}` : part;

      if (i === parts.length - 1) {
        // It's a file
        current.children[part] = {
          name: part,
          type: 'file',
          path: currentPath,
          size: file.size,
          mimeType: file.type,
          modifiedAt: file.lastModified,
          file,
        };
      } else {
        // It's a folder
        if (!current.children[part]) {
          current.children[part] = {
            name: part,
            type: 'folder',
            path: currentPath,
            children: {},
            size: 0,
          };
        }
        current = current.children[part];
      }
    }
  }

  return root;
}

/**
 * Read contents from a webkitdirectory upload tree node
 */
export function getUploadedContents(node) {
  if (!node || !node.children) return [];

  const items = Object.entries(node.children).map(([name, child]) => ({
    name,
    path: child.path,
    type: child.type,
    size: child.type === 'file' ? (child.size || 0) : 0,
    mimeType: child.mimeType || '',
    modifiedAt: child.modifiedAt || null,
    file: child.file || null,
    children: child.children || null,
  }));

  items.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return items;
}

/**
 * Get a child node from an uploaded tree by path
 */
export function getUploadedNodeByPath(root, path) {
  if (!path) return root;
  const parts = path.split('/');
  let current = root;
  for (const part of parts) {
    if (!current.children || !current.children[part]) return null;
    current = current.children[part];
  }
  return current;
}