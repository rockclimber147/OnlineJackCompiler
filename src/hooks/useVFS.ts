import { useState } from "react";
import { type VirtualFile } from "../types/Vfs";

interface UseVFSProps {
  initialFiles?: VirtualFile[];
}

export function useVFS({ initialFiles = [] }: UseVFSProps = {}) {
  const [files, setFiles] = useState<VirtualFile[]>(initialFiles);
  const [activeFileId, setActiveFileId] = useState<string | null>(initialFiles[0]?.id || null);

  const activeFile = files.find(f => f.id === activeFileId) || null;

  const isNameTaken = (name: string, ignoreId?: string) => {
    return files.some(f => f.name.toLowerCase() === name.toLowerCase() && f.id !== ignoreId);
  };

  const addFile = (name: string, extension: string, defaultLanguage: string = "plaintext"): boolean => {
    const formattedName = name.endsWith(extension) ? name : `${name}${extension}`;
    
    // Prevent duplicate
    if (isNameTaken(formattedName)) return false; 

    const newFile: VirtualFile = {
      id: crypto.randomUUID(),
      name: formattedName,
      language: defaultLanguage,
      content: ""
    };
    setFiles(prev => [...prev, newFile]);
    setActiveFileId(newFile.id);
    return true;
  };

  const renameFile = (id: string, newName: string): boolean => {
    if (isNameTaken(newName, id)) return false;

    setFiles(prev => prev.map(f => f.id === id ? { ...f, name: newName } : f));
    return true;
  };

  const updateActiveFile = (newContent: string) => {
    if (!activeFileId) return;
    setFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, content: newContent } : f));
  };

  const setFileError = (fileId: string, hasError: boolean) => {
    setFiles(prev => prev.map(f => f.id === fileId ? { ...f, hasError } : f));
  };

  const uploadFiles = async (
    fileList: FileList, 
    allowedExtension: string, 
    defaultLanguage: string = "plaintext",
    onLog?: (msg: string, type: "info" | "success" | "error" | "warning") => void // Added warning type
  ) => {
    const validFiles = Array.from(fileList).filter(file => file.name.endsWith(allowedExtension));
    
    if (validFiles.length === 0) {
      onLog?.(`No ${allowedExtension} files found in selection.`, "error");
      return;
    }

    // Filter out files that already exist in the workspace
    const existingNames = new Set(files.map(f => f.name.toLowerCase()));
    const nonDuplicateFiles = validFiles.filter(file => !existingNames.has(file.name.toLowerCase()));
    const skippedCount = validFiles.length - nonDuplicateFiles.length;

    if (nonDuplicateFiles.length === 0) {
      onLog?.(`All ${skippedCount} selected files already exist in the workspace.`, "warning");
      return;
    }

    const newVirtualFiles: VirtualFile[] = [];
    const readPromises = nonDuplicateFiles.map(file => {
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
      if (skippedCount > 0) {
        onLog?.(`Skipped ${skippedCount} duplicate file(s).`, "warning");
      }
    } catch (error: any) {
      onLog?.(error.message, "error");
    }
  };

  const deleteFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    
    if (activeFileId === id) {
      setActiveFileId(null);
    }
  };

  // 5. importFiles now skips duplicates
  const importFiles = (importedFiles: {name: string, content: string}[], extension: string, language: string) => {
    const existingNames = new Set(files.map(f => f.name.toLowerCase()));
    
    const newFiles = importedFiles
      .filter(f => f.name.endsWith(extension) && !existingNames.has(f.name.toLowerCase())) // <-- Filter added here
      .map(f => ({
        id: crypto.randomUUID(),
        name: f.name,
        content: f.content,
        language
      }));

    if (newFiles.length > 0) {
      setFiles(prev => [...prev, ...newFiles]);
      setActiveFileId(newFiles[0].id);
    }
    return newFiles.length; 
  };

  return { 
    files, 
    activeFileId, 
    setActiveFileId, 
    activeFile, 
    addFile, 
    updateActiveFile, 
    uploadFiles, 
    importFiles, 
    setFileError, 
    renameFile, 
    deleteFile 
  };
}