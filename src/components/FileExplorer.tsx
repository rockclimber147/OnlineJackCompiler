import { useRef } from "react";
// --- NEW: Import Pencil and Trash2 icons ---
import { FileCode2, FolderOpen, FilePlus, Upload, Pencil, Trash2 } from "lucide-react";
import { type VirtualFile } from "../types/vfs";

interface FileExplorerProps {
  files: VirtualFile[];
  activeFileId: string | null;
  onSelectFile: (id: string) => void;
  onAddFile: (name: string) => void;
  onUploadFiles: (files: FileList) => void;
  // --- NEW: Add the action props ---
  onRenameFile?: (id: string, newName: string) => void;
  onDeleteFile?: (id: string) => void;
  title?: string;
  acceptedExtensions?: string; 
  readOnly?: boolean;
}

export function FileExplorer({
  files,
  activeFileId,
  onSelectFile,
  onAddFile,
  onUploadFiles,
  onRenameFile,  
  onDeleteFile, 
  title = "EXPLORER",
  acceptedExtensions,
  readOnly = false
}: FileExplorerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleManualAdd = () => {
    const name = prompt("Enter new file name (e.g., Main.jack):");
    if (name) onAddFile(name);
  };


  const handleRename = (e: React.MouseEvent, file: VirtualFile) => {
    e.stopPropagation(); // Prevents the row from being "clicked" (selecting the file)
    const newName = prompt("Rename file to:", file.name);
    if (newName && newName.trim() !== "" && newName !== file.name) {
      onRenameFile?.(file.id, newName);
    }
  };

  const handleDelete = (e: React.MouseEvent, file: VirtualFile) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete '${file.name}'?`)) {
      onDeleteFile?.(file.id);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#181818] border-r border-black/40 select-none">
      
      {/* Hidden File Inputs */}
      <input type="file" multiple accept={acceptedExtensions} ref={fileInputRef} className="hidden" onChange={(e) => e.target.files && onUploadFiles(e.target.files)} />
      {/* @ts-ignore */}
      <input type="file" webkitdirectory="" directory="" ref={folderInputRef} className="hidden" onChange={(e) => e.target.files && onUploadFiles(e.target.files)} />

      {/* Header & Actions */}
      <div className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-400 tracking-wider">
        <span>{title}</span>
        {/* 3. Hide the add/upload buttons if readOnly is true */}
        {!readOnly && (
          <div className="flex items-center gap-1">
            <button onClick={handleManualAdd} className="p-1 hover:bg-slate-700 rounded hover:text-slate-200" title="New File"><FilePlus size={14} /></button>
            <button onClick={() => fileInputRef.current?.click()} className="p-1 hover:bg-slate-700 rounded hover:text-slate-200" title="Upload Files"><Upload size={14} /></button>
            <button onClick={() => folderInputRef.current?.click()} className="p-1 hover:bg-slate-700 rounded hover:text-slate-200" title="Upload Folder"><FolderOpen size={14} /></button>
          </div>
        )}
      </div>

      {/* File List */}
      <div className="flex-1 overflow-y-auto py-1">
        {files.length === 0 ? (
          <div className="px-4 py-4 text-xs text-slate-600 italic text-center">
            No files in workspace.
          </div>
        ) : (
          files.map(file => (
            // --- UPDATED: Changed from <button> to <div className="group"> ---
            <div
              key={file.id}
              onClick={() => onSelectFile(file.id)}
              className={`group flex items-center justify-between w-full px-3 py-1.5 text-sm cursor-pointer transition-colors ${
                activeFileId === file.id 
                  ? "bg-[#37373d] text-white" 
                  : "text-slate-400 hover:bg-[#2a2d2e] hover:text-slate-300"
              }`}
            >
              {/* File Icon & Name */}
              <div className="flex items-center gap-2 overflow-hidden">
                <FileCode2 
                  size={14} 
                  className={`shrink-0 ${
                    file.hasError ? "text-rose-500" : activeFileId === file.id ? "text-indigo-400" : "text-slate-500"
                  }`} 
                />
                <span className={`truncate ${file.hasError && activeFileId !== file.id ? "text-rose-400" : ""}`}>
                  {file.name}
                </span>
                {file.hasError && <div className="shrink-0 w-2 h-2 rounded-full bg-rose-500" title="Contains errors" />}
              </div>

              {/* --- NEW: Hover Action Buttons --- */}
              <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={(e) => handleRename(e, file)} 
                  className="p-1 text-slate-400 hover:text-white hover:bg-slate-600 rounded transition-colors"
                  title="Rename"
                >
                  <Pencil size={12} />
                </button>
                <button 
                  onClick={(e) => handleDelete(e, file)} 
                  className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 rounded transition-colors"
                  title="Delete"
                >
                  <Trash2 size={12} />
                </button>
              </div>

            </div>
          ))
        )}
      </div>
    </div>
  );
}