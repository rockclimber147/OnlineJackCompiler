import { useRef, useState, useEffect } from "react";
import { FileCode2, Trash2, Pencil, Upload, FolderOpen, FilePlus, FolderDown, Copy, ClipboardPaste } from "lucide-react";
import { type VirtualFile } from "../types/vfs";
import { type CompilerError } from "../types/compiler";

interface FileExplorerProps {
  files: VirtualFile[];
  activeFileId: string | null;
  onSelectFile: (id: string) => void;
  onAddFile: (name: string) => void;
  onUploadFiles: (files: FileList) => void;
  onRenameFile: (id: string, newName: string) => void;
  onDeleteFile: (id: string) => void;
  onDownloadAll?: () => void;
  onCopyAll?: () => void;
  onPasteAll?: () => void;
  title?: string;
  acceptedExtensions?: string;
  readOnly?: boolean;
  errors?: CompilerError[]; 
}

export function FileExplorer({
  files,
  activeFileId,
  onSelectFile,
  onAddFile,
  onUploadFiles,
  onRenameFile,
  onDeleteFile,
  onDownloadAll,
  onCopyAll,
  onPasteAll,
  title = "EXPLORER",
  acceptedExtensions = ".txt",
  readOnly = false,
  errors = [], 
}: FileExplorerProps) {
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  // Focus the input automatically when entering edit mode
  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      // Select the text before the extension
      const dotIndex = editName.lastIndexOf(".");
      if (dotIndex > 0) {
        editInputRef.current.setSelectionRange(0, dotIndex);
      } else {
        editInputRef.current.select();
      }
    }
  }, [editingId]);

  const handleManualAdd = () => {
    const baseName = "NewFile";
    let name = baseName + acceptedExtensions;
    let counter = 1;
    // Prevent duplicate default names
    while (files.some(f => f.name === name)) {
      name = `${baseName}${counter}${acceptedExtensions}`;
      counter++;
    }
    onAddFile(name);
  };

  const handleRename = (e: React.MouseEvent, file: VirtualFile) => {
    e.stopPropagation();
    setEditingId(file.id);
    setEditName(file.name);
  };

  const submitRename = (id: string) => {
    if (editName.trim() && !files.some(f => f.id !== id && f.name === editName.trim())) {
      onRenameFile(id, editName.trim());
    }
    setEditingId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === "Enter") submitRename(id);
    if (e.key === "Escape") setEditingId(null);
  };

  return (
    <div className="flex flex-col h-full bg-[#181818] border-r border-black/40 select-none">
      
      {/* Hidden Inputs for File Uploading */}
      <input 
        type="file" 
        multiple 
        accept={acceptedExtensions}
        className="hidden" 
        ref={fileInputRef} 
        onChange={(e) => e.target.files && onUploadFiles(e.target.files)} 
      />
      
      <input 
        type="file" 
        // @ts-expect-error - webkitdirectory is a non-standard but widely supported attribute for folder upload
        webkitdirectory="true" 
        className="hidden" 
        ref={folderInputRef} 
        onChange={(e) => e.target.files && onUploadFiles(e.target.files)} 
      />

      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-400 tracking-wider">
        <span>{title}</span>
          <div className="flex items-center gap-1">
          {/* Write Actions: Hidden if readOnly is true */}
          {!readOnly && (
            <>
              <button onClick={handleManualAdd} className="p-1 hover:bg-slate-700 rounded hover:text-slate-200 transition-colors" title="New File">
                <FilePlus size={14} />
              </button>
              <button onClick={() => fileInputRef.current?.click()} className="p-1 hover:bg-slate-700 rounded hover:text-slate-200 transition-colors" title="Upload Files">
                <Upload size={14} />
              </button>
              <button onClick={() => folderInputRef.current?.click()} className="p-1 hover:bg-slate-700 rounded hover:text-slate-200 transition-colors" title="Upload Folder">
                <FolderOpen size={14} />
              </button>
              {onPasteAll && (
                <button onClick={onPasteAll} title="Paste files from clipboard" className="hover:text-indigo-400 transition-colors cursor-pointer">
                  <ClipboardPaste size={14} />
                </button>
              )}
            </>
          )}

          {/* Read Actions: Always visible if the handlers and files exist */}
          {onCopyAll && files.length > 0 && (
            <button onClick={onCopyAll} title="Copy all files to clipboard" className="hover:text-indigo-400 transition-colors cursor-pointer">
              <Copy size={14} />
            </button>
          )}
          
          {onDownloadAll && files.length > 0 && (
            <button onClick={onDownloadAll} title="Download Folder as ZIP" className="hover:text-indigo-400 transition-colors cursor-pointer">
              <FolderDown size={14} />
            </button>
          )}
        </div>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-y-auto py-1">
        {files.length === 0 ? (
          <div className="px-4 py-4 text-xs text-slate-600 italic text-center">
            No files in workspace.
          </div>
        ) : (
          files.map(file => {
            // Dynamically check if this file has project-wide errors
            const hasError = errors.some(err => err.message.startsWith(`[${file.name}]`));

            return (
              <div
                key={file.id}
                onClick={() => {
                  if (editingId !== file.id) onSelectFile(file.id);
                }}
                className={`group flex items-center justify-between w-full px-3 py-1.5 text-sm cursor-pointer transition-colors ${
                  activeFileId === file.id 
                    ? "bg-[#37373d] text-white" 
                    : "text-slate-400 hover:bg-[#2a2d2e] hover:text-slate-300"
                }`}
              >
                {/* File Icon & Name */}
                <div className="flex items-center gap-2 overflow-hidden flex-1">
                  <FileCode2 
                    size={14} 
                    className={`shrink-0 ${
                      hasError ? "text-rose-500" : activeFileId === file.id ? "text-indigo-400" : "text-slate-500"
                    }`} 
                  />
                  
                  {/* Inline Renaming Input vs Static Text */}
                  {editingId === file.id ? (
                    <input
                      ref={editInputRef}
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={() => submitRename(file.id)}
                      onKeyDown={(e) => handleKeyDown(e, file.id)}
                      className="flex-1 bg-[#1e1e1e] text-slate-200 text-sm px-1 border border-indigo-500 rounded outline-none min-w-0"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <>
                      <span className={`truncate ${hasError && activeFileId !== file.id ? "text-rose-400" : ""}`}>
                        {file.name}
                      </span>
                      {hasError && <div className="shrink-0 w-2 h-2 rounded-full bg-rose-500" title="Contains errors" />}
                    </>
                  )}
                </div>

                {/* Hover Actions (Only show if not readonly and not currently editing) */}
                {!readOnly && editingId !== file.id && (
                  <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0">
                    <button 
                      onClick={(e) => handleRename(e, file)} 
                      className="p-1 text-slate-400 hover:text-white hover:bg-slate-600 rounded transition-colors"
                      title="Rename"
                    >
                      <Pencil size={12} />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteFile(file.id);
                      }} 
                      className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}

              </div>
            );
          })
        )}
      </div>
    </div>
  );
}