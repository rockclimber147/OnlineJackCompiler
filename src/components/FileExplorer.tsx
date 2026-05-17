import { useRef } from "react";
import { FileCode2, FolderOpen, FilePlus, Upload } from "lucide-react";
import { type VirtualFile } from "../types/Vfs";

interface FileExplorerProps {
  files: VirtualFile[];
  activeFileId: string | null;
  onSelectFile: (id: string) => void;
  onAddFile: (name: string) => void;
  onUploadFiles: (files: FileList) => void;
  title?: string;
  acceptedExtensions?: string; // e.g., ".asm,.txt" or ".jack"
}

export function FileExplorer({
  files,
  activeFileId,
  onSelectFile,
  onAddFile,
  onUploadFiles,
  title = "EXPLORER",
  acceptedExtensions
}: FileExplorerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleManualAdd = () => {
    const name = prompt("Enter new file name (e.g., Main.jack):");
    if (name) onAddFile(name);
  };

  return (
    <div className="flex flex-col h-full bg-[#181818] border-r border-black/40 select-none">
      
      {/* Hidden File Inputs */}
      <input 
        type="file" 
        multiple 
        accept={acceptedExtensions}
        ref={fileInputRef} 
        className="hidden" 
        onChange={(e) => e.target.files && onUploadFiles(e.target.files)} 
      />
      
      {/* webkitdirectory allows folder selection */}
      <input 
        type="file" 
        // @ts-ignore - React types don't officially support webkitdirectory yet, but browsers do
        webkitdirectory="" 
        directory=""
        ref={folderInputRef} 
        className="hidden" 
        onChange={(e) => e.target.files && onUploadFiles(e.target.files)} 
      />

      {/* Header & Actions */}
      <div className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-400 tracking-wider">
        <span>{title}</span>
        <div className="flex items-center gap-1">
          <button onClick={handleManualAdd} className="p-1 hover:bg-slate-700 rounded hover:text-slate-200" title="New File">
            <FilePlus size={14} />
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="p-1 hover:bg-slate-700 rounded hover:text-slate-200" title="Upload Files">
            <Upload size={14} />
          </button>
          <button onClick={() => folderInputRef.current?.click()} className="p-1 hover:bg-slate-700 rounded hover:text-slate-200" title="Upload Folder">
            <FolderOpen size={14} />
          </button>
        </div>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-y-auto py-1">
        {files.length === 0 ? (
          <div className="px-4 py-4 text-xs text-slate-600 italic text-center">
            No files in workspace.
          </div>
        ) : (
          files.map(file => (
            <button
              key={file.id}
              onClick={() => onSelectFile(file.id)}
              className={`w-full flex items-center gap-2 px-3 py-1 text-sm cursor-pointer transition-colors ${
                activeFileId === file.id 
                  ? "bg-[#37373d] text-white" 
                  : "text-slate-400 hover:bg-[#2a2d2e] hover:text-slate-300"
              }`}
            >
              <FileCode2 size={14} className={activeFileId === file.id ? "text-indigo-400" : "text-slate-500"} />
              <span className="truncate">{file.name}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}