/**
 * OpenVault Virtual File System
 *
 * This manages a virtual file system stored in IndexedDB.
 * Users can upload files, create folders, and download the entire vault as a ZIP.
 * No folder restrictions — all folders and files are accessible.
 */

import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const DB_NAME = 'openvault-fs';
const DB_VERSION = 2;
const STORE_NAME = 'files';

// Default vault structure
const DEFAULT_VAULT = {
  name: 'My Vault',
  type: 'folder',
  path: '/',
  children: {
    'Documents': {
      name: 'Documents',
      type: 'folder',
      path: '/Documents',
      children: {},
      createdAt: Date.now(),
      modifiedAt: Date.now(),
      size: 0,
    },
    'Projects': {
      name: 'Projects',
      type: 'folder',
      path: '/Projects',
      children: {},
      createdAt: Date.now(),
      modifiedAt: Date.now(),
      size: 0,
    },
    'Media': {
      name: 'Media',
      type: 'folder',
      path: '/Media',
      children: {},
      createdAt: Date.now(),
      modifiedAt: Date.now(),
      size: 0,
    },
    'Downloads': {
      name: 'Downloads',
      type: 'folder',
      path: '/Downloads',
      children: {},
      createdAt: Date.now(),
      modifiedAt: Date.now(),
      size: 0,
    },
  },
  createdAt: Date.now(),
  modifiedAt: Date.now(),
  size: 0,
};

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function dbGet(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(key);
    req.onsuccess = () => {
      resolve(req.result);
      db.close();
    };
    req.onerror = () => {
      reject(req.error);
      db.close();
    };
  });
}

async function dbSet(key, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const req = tx.objectStore(STORE_NAME).put(value, key);
    req.onsuccess = () => {
      resolve();
      db.close();
    };
    req.onerror = () => {
      reject(req.error);
      db.close();
    };
  });
}

async function getVault() {
  let vault = await dbGet('vault');
  if (!vault) {
    vault = DEFAULT_VAULT;
    await dbSet('vault', vault);
  }
  return vault;
}

async function saveVault(vault) {
  vault.modifiedAt = Date.now();
  await dbSet('vault', vault);
}

function getNodeAtPath(vault, path) {
  if (path === '/' || path === '') return vault;
  const parts = path.split('/').filter(Boolean);
  let node = vault;
  for (const part of parts) {
    if (!node.children || !node.children[part]) return null;
    node = node.children[part];
  }
  return node;
}

function getParentPath(path) {
  const parts = path.replace(/\/$/, '').split('/');
  parts.pop();
  return parts.length === 0 ? '/' : '/' + parts.join('/');
}

function getNodeName(path) {
  const parts = path.replace(/\/$/, '').split('/');
  return parts[parts.length - 1];
}

function calculateFolderSize(node) {
  if (node.type === 'file') return node.size || 0;
  let total = 0;
  if (node.children) {
    Object.values(node.children).forEach(child => {
      total += calculateFolderSize(child);
    });
  }
  return total;
}

export async function getFolderContents(path) {
  const vault = await getVault();
  const node = getNodeAtPath(vault, path);
  if (!node || node.type === 'file') return [];
  const items = node.children ? Object.entries(node.children).map(([name, child]) => ({
    name,
    path: child.path,
    type: child.type,
    size: child.type === 'folder' ? calculateFolderSize(child) : (child.size || 0),
    createdAt: child.createdAt,
    modifiedAt: child.modifiedAt,
    mimeType: child.mimeType || '',
  })) : [];
  // Sort: folders first, then files, alphabetically
  items.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  return items;
}

export async function createFolder(path, folderName) {
  const vault = await getVault();
  const parent = getNodeAtPath(vault, path);
  if (!parent || parent.type === 'file') throw new Error('Invalid path');
  if (!parent.children) parent.children = {};
  if (parent.children[folderName]) throw new Error('Already exists');
  const newPath = path === '/' ? `/${folderName}` : `${path}/${folderName}`;
  parent.children[folderName] = {
    name: folderName,
    type: 'folder',
    path: newPath,
    children: {},
    createdAt: Date.now(),
    modifiedAt: Date.now(),
    size: 0,
  };
  await saveVault(vault);
  return parent.children[folderName];
}

export async function uploadFile(path, file) {
  const vault = await getVault();
  const parent = getNodeAtPath(vault, path);
  if (!parent || parent.type === 'file') throw new Error('Invalid path');
  if (!parent.children) parent.children = {};

  const buffer = await file.arrayBuffer();
  const existing = parent.children[file.name];
  if (existing && existing.type === 'folder') throw new Error('A folder with this name exists');

  parent.children[file.name] = {
    name: file.name,
    type: 'file',
    path: path === '/' ? `/${file.name}` : `${path}/${file.name}`,
    data: buffer,
    size: file.size,
    mimeType: file.type || 'application/octet-stream',
    createdAt: Date.now(),
    modifiedAt: Date.now(),
  };

  await saveVault(vault);
  return parent.children[file.name];
}

export async function renameItem(path, newName) {
  const vault = await getVault();
  const parentPath = getParentPath(path);
  const oldName = getNodeName(path);
  const parent = getNodeAtPath(vault, parentPath);
  if (!parent || !parent.children || !parent.children[oldName]) throw new Error('Not found');
  if (parent.children[newName]) throw new Error('Already exists');

  const node = parent.children[oldName];
  node.name = newName;
  node.modifiedAt = Date.now();

  // Update path recursively
  function updatePath(n, oldBase, newBase) {
    n.path = n.path.replace(oldBase, newBase);
    if (n.children) {
      Object.values(n.children).forEach(c => updatePath(c, oldBase, newBase));
    }
  }

  const oldPath = node.path;
  const newPath = parentPath === '/' ? `/${newName}` : `${parentPath}/${newName}`;
  updatePath(node, oldPath, newPath);

  parent.children[newName] = node;
  delete parent.children[oldName];

  await saveVault(vault);
}

export async function deleteItem(path) {
  const vault = await getVault();
  const parentPath = getParentPath(path);
  const name = getNodeName(path);
  const parent = getNodeAtPath(vault, parentPath);
  if (!parent || !parent.children || !parent.children[name]) throw new Error('Not found');
  delete parent.children[name];
  await saveVault(vault);
}

export async function readFile(path) {
  const vault = await getVault();
  const node = getNodeAtPath(vault, path);
  if (!node || node.type !== 'file') throw new Error('File not found');
  return node.data;
}

export async function downloadFile(path) {
  const vault = await getVault();
  const node = getNodeAtPath(vault, path);
  if (!node) throw new Error('Not found');
  if (node.type === 'file') {
    const blob = new Blob([node.data], { type: node.mimeType || 'application/octet-stream' });
    saveAs(blob, node.name);
  } else {
    await downloadFolder(path);
  }
}

async function addToZip(zip, node, basePath) {
  if (node.type === 'file') {
    zip.file(basePath + node.name, node.data);
  } else if (node.children) {
    const folder = zip.folder(basePath + node.name);
    Object.values(node.children).forEach(child => {
      addToZip(folder, child, '');
    });
  }
}

export async function downloadFolder(path) {
  const vault = await getVault();
  const node = getNodeAtPath(vault, path);
  if (!node) throw new Error('Not found');

  const zip = new JSZip();
  const folderName = path === '/' ? 'MyVault' : node.name;

  if (path === '/') {
    // Download everything
    Object.values(node.children).forEach(child => {
      addToZip(zip, child, '');
    });
  } else {
    addToZip(zip, node, '');
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, `${folderName}.zip`);
}

export async function getVaultInfo() {
  const vault = await getVault();
  const totalSize = calculateFolderSize(vault);
  let fileCount = 0;
  let folderCount = 0;

  function count(node) {
    if (node.type === 'file') fileCount++;
    else {
      folderCount++;
      if (node.children) Object.values(node.children).forEach(count);
    }
  }
  Object.values(vault.children).forEach(count);

  return {
    totalSize,
    fileCount,
    folderCount,
    itemCount: Object.keys(vault.children).length,
    modifiedAt: vault.modifiedAt,
  };
}

export async function moveItem(sourcePath, destPath) {
  const vault = await getVault();
  const sourceParentPath = getParentPath(sourcePath);
  const sourceName = getNodeName(sourcePath);
  const sourceParent = getNodeAtPath(vault, sourceParentPath);
  const destParent = getNodeAtPath(vault, destPath);

  if (!sourceParent || !sourceParent.children || !sourceParent.children[sourceName]) throw new Error('Source not found');
  if (!destParent || destParent.type === 'file') throw new Error('Invalid destination');
  if (!destParent.children) destParent.children = {};
  if (destParent.children[sourceName]) throw new Error('Already exists at destination');

  const node = sourceParent.children[sourceName];
  const newPath = destPath === '/' ? `/${sourceName}` : `${destPath}/${sourceName}`;

  function updatePaths(n, oldBase, newBase) {
    n.path = n.path.replace(oldBase, newBase);
    n.modifiedAt = Date.now();
    if (n.children) Object.values(n.children).forEach(c => updatePaths(c, oldBase, newBase));
  }
  updatePaths(node, node.path, newPath);

  destParent.children[sourceName] = node;
  delete sourceParent.children[sourceName];
  await saveVault(vault);
}

export async function searchFiles(query) {
  const vault = await getVault();
  const results = [];
  const lowerQuery = query.toLowerCase();

  function search(node) {
    if (node.name.toLowerCase().includes(lowerQuery)) {
      results.push({
        name: node.name,
        path: node.path,
        type: node.type,
        size: node.type === 'file' ? node.size : calculateFolderSize(node),
        modifiedAt: node.modifiedAt,
      });
    }
    if (node.children) Object.values(node.children).forEach(search);
  }
  Object.values(vault.children).forEach(search);
  return results;
}

export async function resetVault() {
  await dbSet('vault', DEFAULT_VAULT);
  return DEFAULT_VAULT;
}