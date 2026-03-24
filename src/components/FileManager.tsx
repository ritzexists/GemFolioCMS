import React, { useState, useEffect, useRef } from 'react';
import { Folder, File, Upload, Trash, Edit2, CornerUpLeft, Plus, Image as ImageIcon, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';

interface FileItem {
  name: string;
  type: 'file' | 'directory';
  path: string;
  size: number;
  mtime: string;
}

interface FileManagerProps {
  onEditFile?: (path: string) => void;
  onFileChange?: () => void;
}

export default function FileManager({ onEditFile, onFileChange }: FileManagerProps) {
  const [currentDir, setCurrentDir] = useState('');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [modalState, setModalState] = useState<{ type: 'mkdir' | 'rename' | 'delete' | 'delete-multiple' | 'move-multiple' | null, item?: FileItem, path?: string, paths?: string[] }>({ type: null });
  const [modalInput, setModalInput] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadFiles = async (dir: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/files?dir=${encodeURIComponent(dir)}`);
      if (res.ok) {
        const data = await res.json();
        setFiles(data);
        setCurrentDir(dir);
        setSelectedFiles(new Set());
      } else {
        setMessage('Failed to load files');
      }
    } catch (e) {
      setMessage('Error loading files');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadFiles('');
  }, []);

  const handleNavigate = (dir: string) => {
    loadFiles(dir);
  };

  const handleUp = () => {
    if (!currentDir) return;
    const parts = currentDir.split('/').filter(Boolean);
    parts.pop();
    loadFiles(parts.join('/'));
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const formData = new FormData();
    formData.append('dir', currentDir);
    for (let i = 0; i < e.target.files.length; i++) {
      formData.append('files', e.target.files[i]);
    }

    setLoading(true);
    try {
      const res = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        setMessage('Upload successful');
        loadFiles(currentDir);
        onFileChange?.();
      } else {
        setMessage('Upload failed');
      }
    } catch (e) {
      setMessage('Upload error');
    }
    setLoading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const toggleSelection = (path: string) => {
    const newSet = new Set(selectedFiles);
    if (newSet.has(path)) {
      newSet.delete(path);
    } else {
      newSet.add(path);
    }
    setSelectedFiles(newSet);
  };

  const toggleAll = () => {
    if (selectedFiles.size === files.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(files.map(f => f.path)));
    }
  };

  const handleDeleteMultiple = () => {
    if (selectedFiles.size === 0) return;
    setModalState({ type: 'delete-multiple', paths: Array.from(selectedFiles) });
  };

  const confirmDeleteMultiple = async () => {
    const paths = modalState.paths;
    if (!paths || paths.length === 0) return;
    
    setModalState({ type: null });
    setLoading(true);
    try {
      const deletePromises = paths.map(path => 
        fetch('/api/files/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path })
        })
      );
      await Promise.all(deletePromises);
      setMessage('Deleted successfully');
      loadFiles(currentDir);
      onFileChange?.();
    } catch (e) {
      setMessage('Delete error');
    }
    setLoading(false);
  };

  const handleMoveMultiple = () => {
    if (selectedFiles.size === 0) return;
    setModalState({ type: 'move-multiple', paths: Array.from(selectedFiles) });
    setModalInput(currentDir);
  };

  const confirmMoveMultiple = async () => {
    const paths = modalState.paths;
    const destDir = modalInput;
    if (!paths || paths.length === 0 || destDir === undefined) {
      setModalState({ type: null });
      return;
    }

    setModalState({ type: null });
    setLoading(true);
    try {
      const movePromises = paths.map(source => {
        const filename = source.split('/').pop();
        const destination = destDir ? `${destDir}/${filename}` : filename;
        if (source === destination) return Promise.resolve();
        
        return fetch('/api/files/move', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ source, destination })
        });
      });
      await Promise.all(movePromises);
      setMessage('Moved successfully');
      loadFiles(currentDir);
      onFileChange?.();
    } catch (e) {
      setMessage('Move error');
    }
    setLoading(false);
  };

  const handleDelete = async (path: string) => {
    setModalState({ type: 'delete', path });
  };

  const confirmDelete = async () => {
    const path = modalState.path;
    if (!path) return;
    
    setModalState({ type: null });
    setLoading(true);
    try {
      const res = await fetch('/api/files/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path })
      });
      if (res.ok) {
        setMessage('Deleted successfully');
        loadFiles(currentDir);
        onFileChange?.();
      } else {
        setMessage('Delete failed');
      }
    } catch (e) {
      setMessage('Delete error');
    }
    setLoading(false);
  };

  const handleRename = async (item: FileItem) => {
    setModalState({ type: 'rename', item });
    setModalInput(item.path);
  };

  const confirmRename = async () => {
    const item = modalState.item;
    const newPath = modalInput;
    if (!item || !newPath || newPath === item.path) {
      setModalState({ type: null });
      return;
    }

    setModalState({ type: null });
    const source = item.path;
    const destination = newPath;

    setLoading(true);
    try {
      const res = await fetch('/api/files/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source, destination })
      });
      if (res.ok) {
        setMessage('Moved/Renamed successfully');
        loadFiles(currentDir);
        onFileChange?.();
      } else {
        setMessage('Move/Rename failed');
      }
    } catch (e) {
      setMessage('Move/Rename error');
    }
    setLoading(false);
  };

  const handleMkdir = async () => {
    setModalState({ type: 'mkdir' });
    setModalInput('');
  };

  const confirmMkdir = async () => {
    const name = modalInput;
    if (!name) {
      setModalState({ type: null });
      return;
    }

    setModalState({ type: null });
    const newPath = currentDir ? `${currentDir}/${name}` : name;

    setLoading(true);
    try {
      const res = await fetch('/api/files/mkdir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: newPath })
      });
      if (res.ok) {
        setMessage('Folder created');
        loadFiles(currentDir);
        onFileChange?.();
      } else {
        setMessage('Failed to create folder');
      }
    } catch (e) {
      setMessage('Error creating folder');
    }
    setLoading(false);
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getIcon = (item: FileItem) => {
    if (item.type === 'directory') return <Folder size={16} className="text-neon-green" />;
    if (item.name.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i)) return <ImageIcon size={16} className="text-neon-pink" />;
    return <FileText size={16} className="text-white/70" />;
  };

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="neobrutal-box p-4 flex justify-between items-center bg-void z-10 gap-4">
        <div className="flex items-center gap-4 flex-1">
          <span className="font-bold text-neon-green whitespace-nowrap">
            FILE MANAGER
          </span>
          {message && <span className="text-neon-pink animate-pulse text-sm whitespace-nowrap">[{message}]</span>}
        </div>
        <div className="flex gap-2 items-center">
          <button onClick={handleMkdir} className="neobrutal-button text-xs py-1 flex items-center gap-2" disabled={loading}>
            <Plus size={14} /> NEW FOLDER
          </button>
          <button onClick={handleUploadClick} className="neobrutal-button text-xs py-1 flex items-center gap-2" disabled={loading}>
            <Upload size={14} /> UPLOAD
          </button>
          <input 
            type="file" 
            multiple 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
          />
        </div>
      </div>

      <div className="neobrutal-box flex-1 flex flex-col overflow-hidden relative">
        {modalState.type && (
          <div className="absolute inset-0 bg-black/80 z-20 flex items-center justify-center p-4">
            <div className="neobrutal-box p-6 max-w-md w-full flex flex-col gap-4">
              <h3 className="text-neon-pink font-bold text-lg">
                {modalState.type === 'mkdir' && 'CREATE FOLDER'}
                {modalState.type === 'rename' && 'RENAME / MOVE'}
                {modalState.type === 'delete' && 'CONFIRM DELETE'}
                {modalState.type === 'delete-multiple' && 'CONFIRM DELETE MULTIPLE'}
                {modalState.type === 'move-multiple' && 'MOVE MULTIPLE FILES'}
              </h3>
              
              {modalState.type === 'delete' ? (
                <p className="text-white/80">Are you sure you want to delete <span className="text-neon-green font-mono">{modalState.path}</span>?</p>
              ) : modalState.type === 'delete-multiple' ? (
                <p className="text-white/80">Are you sure you want to delete {modalState.paths?.length} items?</p>
              ) : (
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-white/50 uppercase">
                    {modalState.type === 'mkdir' ? 'Folder Name' : modalState.type === 'move-multiple' ? 'Destination Directory (relative to content folder)' : 'New Path (relative to content folder)'}
                  </label>
                  <input 
                    type="text" 
                    className="neobrutal-input w-full" 
                    value={modalInput}
                    onChange={(e) => setModalInput(e.target.value)}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (modalState.type === 'mkdir') confirmMkdir();
                        else if (modalState.type === 'rename') confirmRename();
                        else if (modalState.type === 'move-multiple') confirmMoveMultiple();
                      } else if (e.key === 'Escape') {
                        setModalState({ type: null });
                      }
                    }}
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 mt-4">
                <button 
                  onClick={() => setModalState({ type: null })}
                  className="px-4 py-2 border border-white/20 hover:bg-white/10 text-sm font-bold"
                >
                  CANCEL
                </button>
                <button 
                  onClick={() => {
                    if (modalState.type === 'mkdir') confirmMkdir();
                    else if (modalState.type === 'rename') confirmRename();
                    else if (modalState.type === 'delete') confirmDelete();
                    else if (modalState.type === 'delete-multiple') confirmDeleteMultiple();
                    else if (modalState.type === 'move-multiple') confirmMoveMultiple();
                  }}
                  className="neobrutal-button text-sm px-4 py-2"
                >
                  CONFIRM
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-neon-pink text-void px-4 py-2 text-xs font-bold flex items-center gap-2">
          <button 
            onClick={handleUp} 
            disabled={!currentDir || loading}
            className="hover:bg-white/20 p-1 rounded disabled:opacity-50"
          >
            <CornerUpLeft size={14} />
          </button>
          <span className="font-mono">/content/{currentDir}</span>
          {selectedFiles.size > 0 && (
            <div className="flex gap-2 items-center ml-auto">
              <span className="text-void/70 text-xs">{selectedFiles.size} selected</span>
              <button onClick={handleMoveMultiple} className="hover:bg-white/20 p-1 rounded flex items-center gap-1" disabled={loading}>
                <Edit2 size={12} /> Move
              </button>
              <button onClick={handleDeleteMultiple} className="hover:bg-white/20 p-1 rounded flex items-center gap-1" disabled={loading}>
                <Trash size={12} /> Delete
              </button>
            </div>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
          {loading && files.length === 0 ? (
            <div className="text-center p-4 text-white/50">Loading...</div>
          ) : files.length === 0 ? (
            <div className="text-center p-4 text-white/50">Empty directory</div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-white/50 uppercase border-b border-white/10">
                <tr>
                  <th className="px-4 py-2 w-10">
                    <input 
                      type="checkbox" 
                      className="accent-neon-pink w-4 h-4 cursor-pointer"
                      checked={files.length > 0 && selectedFiles.size === files.length}
                      onChange={toggleAll}
                    />
                  </th>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2 w-24">Size</th>
                  <th className="px-4 py-2 w-32">Modified</th>
                  <th className="px-4 py-2 w-24 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {files.map((item) => (
                  <tr key={item.path} className="border-b border-white/5 hover:bg-white/5 group">
                    <td className="px-4 py-2" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        className="accent-neon-pink w-4 h-4 cursor-pointer"
                        checked={selectedFiles.has(item.path)}
                        onChange={() => toggleSelection(item.path)}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <div 
                        className={cn("flex items-center gap-2", item.type === 'directory' ? "cursor-pointer hover:underline" : "")}
                        onClick={() => {
                          if (item.type === 'directory') {
                            handleNavigate(item.path);
                          } else if (item.name.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i)) {
                            window.open(`/content/${item.path}`, '_blank');
                          }
                        }}
                      >
                        {getIcon(item)}
                        <span className={cn("truncate max-w-[200px] md:max-w-md", item.type === 'file' && item.name.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i) && "cursor-pointer hover:underline")}>{item.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-white/50 font-mono text-xs">
                      {item.type === 'directory' ? '--' : formatSize(item.size)}
                    </td>
                    <td className="px-4 py-2 text-white/50 font-mono text-xs">
                      {new Date(item.mtime).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleRename(item)}
                          className="text-neon-green hover:text-white"
                          title="Rename / Move"
                        >
                          <Edit2 size={14} />
                        </button>
                        {item.type === 'file' && item.name.match(/\.(md|adoc|rst)$/i) && onEditFile && (
                          <button 
                            onClick={() => onEditFile(item.path)}
                            className="text-neon-pink hover:text-white"
                            title="Edit Content"
                          >
                            <FileText size={14} />
                          </button>
                        )}
                        <button 
                          onClick={() => handleDelete(item.path)}
                          className="text-neon-pink hover:text-white"
                          title="Delete"
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
