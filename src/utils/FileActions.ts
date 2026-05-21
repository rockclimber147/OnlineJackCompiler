import JSZip from 'jszip';
import type { VirtualFile } from "../types/Vfs";

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error("Failed to copy text: ", err);
    return false;
  }
};

export const downloadFile = (filename: string, content: string): void => {
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export async function downloadAllFilesAsZip(files: VirtualFile[], zipName: string = "workspace.zip"): Promise<boolean> {
  if (files.length === 0) return false;

  try {
    const zip = new JSZip();

    // Add each file to the zip archive
    files.forEach(file => {
      zip.file(file.name, file.content);
    });

    // Generate the zip blob
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    
    // Trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = zipName;
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error("Failed to generate zip:", error);
    return false;
  }
}

export async function copyWorkspaceToClipboard(files: VirtualFile[]): Promise<boolean> {
  if (files.length === 0) return false;

  try {
    // Map down to just name and content so we don't copy internal UI state like IDs
    const exportData = files.map(f => ({ name: f.name, content: f.content }));
    const jsonString = JSON.stringify(exportData);
    
    await navigator.clipboard.writeText(jsonString);
    return true;
  } catch (error) {
    console.error("Failed to copy workspace:", error);
    return false;
  }
}

export async function pasteWorkspaceFromClipboard(): Promise<{name: string, content: string}[] | null> {
  try {
    const text = await navigator.clipboard.readText();
    
    // Quick heuristic: does it look like JSON?
    if (!text.trim().startsWith('[')) return null;

    const parsed = JSON.parse(text);
    
    // Validate the shape to ensure it's actually our workspace data and not random JSON
    const isValid = Array.isArray(parsed) && parsed.every(f => 
      typeof f.name === 'string' && typeof f.content === 'string'
    );

    return isValid ? parsed : null;
  } catch (error) {
    // Fails silently if clipboard isn't JSON
    return null;
  }
}