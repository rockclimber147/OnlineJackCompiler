import { useState } from "react";
import { type VirtualFile } from "../types/Vfs";

interface UseVFSProps {
  initialFiles?: VirtualFile[];
  onLog?: (msg: string, type: "info" | "success" | "error") => void;
}

export function useVFS({ initialFiles = [], onLog }: UseVFSProps = {}) {
  const [files, setFiles] = useState<VirtualFile[]>(initialFiles);
  const [activeFileId, setActiveFileId] = useState<string | null>(initialFiles[0]?.id || null);

  const activeFile = files.find(f => f.id === activeFileId) || null;

  const addFile = (name: string, extension: string, defaultLanguage: string = "plaintext") => {
    const formattedName = name.endsWith(extension) ? name : `${name}${extension}`;
    const newFile: VirtualFile = {
      id: crypto.randomUUID(),
      name: formattedName,
      language: defaultLanguage,
      content: ""
    };
    setFiles(prev => [...prev, newFile]);
    setActiveFileId(newFile.id);
  };

  const updateActiveFile = (newContent: string) => {
    if (!activeFileId) return;
    setFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, content: newContent } : f));
  };

  const uploadFiles = async (fileList: FileList, allowedExtension: string, defaultLanguage: string = "plaintext") => {
    const validFiles = Array.from(fileList).filter(file => file.name.endsWith(allowedExtension));
    
    if (validFiles.length === 0) {
      onLog?.(`No ${allowedExtension} files found in selection.`, "error");
      return;
    }

    const newVirtualFiles: VirtualFile[] = [];
    const readPromises = validFiles.map(file => {
      return new Promise<void>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          newVirtualFiles.push({
            id: crypto.randomUUID(),
            name: file.name,
            content: e.target?.result as string,
            language: defaultLanguage,
          });
          resolve();
        };
        reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
        reader.readAsText(file);
      });
    });

    try {
      await Promise.all(readPromises);
      setFiles(prev => [...prev, ...newVirtualFiles]);
      setActiveFileId(newVirtualFiles[0].id);
      onLog?.(`Loaded ${newVirtualFiles.length} file(s) into workspace.`, "success");
    } catch (error: any) {
      onLog?.(error.message, "error");
    }
  };

  return { files, activeFileId, setActiveFileId, activeFile, addFile, updateActiveFile, uploadFiles };
}