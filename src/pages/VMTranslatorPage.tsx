import { Group, Panel, Separator } from "react-resizable-panels";
import { Play, Copy, Download } from "lucide-react";

import { CodeDisplay } from "../components/CodeDisplay";
import { Console } from "../components/Console";
import { FileExplorer } from "../components/FileExplorer";

import { useVFS } from "../hooks/UseVFS";
import { useVMTranslator } from "../hooks/useVMTranslator";
import { copyToClipboard, downloadFile } from "../utils/FileActions";

export function VMTranslatorPage() {
  // 1. Initialize Translator Hook
  const { 
    asmCode, logs, addLog, runTranslate 
  } = useVMTranslator();

  // 2. Initialize File System Hook (Configured for .vm files, NO onLog here)
  const { 
    files, activeFileId, setActiveFileId, activeFile, 
    addFile, updateActiveFile, uploadFiles, renameFile, deleteFile
  } = useVFS({
    initialFiles: [{
      id: crypto.randomUUID(),
      name: "Main.vm",
      language: "plaintext", // Monaco doesn't have native VM syntax highlighting unless you add it!
      content: "// push constant 7\n// push constant 8\n// add"
    }]
  });

  // --- Handlers ---
  const handleTranslateClick = () => {
    // A VM Translator needs all files in the directory to link them properly
    runTranslate(files); 
  };

  const handleCopyClick = async (text: string) => {
    const success = await copyToClipboard(text);
    if (success) addLog("Copied to clipboard.", "success");
  };

  return (
    <div className="h-full w-full flex flex-col bg-[#1e1e1e] text-slate-300 overflow-hidden relative select-none">
      <main className="flex-1 flex flex-col min-h-0 h-full">
        <div className="h-[75%] min-h-[200px] w-full shrink-0">
          <Group className="h-full w-full">
            
            {/* 1. Left Panel: File Explorer */}
            <Panel defaultSize={20} minSize={15} className="bg-[#181818]">
              <FileExplorer 
                files={files}
                activeFileId={activeFileId}
                onSelectFile={setActiveFileId}
                onAddFile={(name) => addFile(name, ".vm", "plaintext")}
                onUploadFiles={(fl) => uploadFiles(fl, ".vm", "plaintext", addLog)}
                onRenameFile={renameFile}
                onDeleteFile={deleteFile}
                title="VM FILES"
                acceptedExtensions=".vm"
              />
            </Panel>

            <Separator className="w-1 bg-black/40 hover:bg-indigo-600 transition-colors cursor-col-resize" />

            {/* 2. Middle Panel: Source Code Editor */}
            <Panel defaultSize={40} minSize={20} className="bg-[#252526]">
              {activeFile ? (
                <CodeDisplay
                  title={activeFile.name}
                  value={activeFile.content}
                  language={activeFile.language}
                  onChange={updateActiveFile}
                  actions={
                    <>
                      <button onClick={() => handleCopyClick(activeFile.content)} className="flex items-center gap-1.5 text-slate-400 hover:text-indigo-400 px-2 py-1 rounded hover:bg-slate-800 transition-colors text-xs font-medium cursor-pointer">
                        <Copy size={13} /> Copy
                      </button>
                      <button onClick={() => downloadFile(activeFile.name, activeFile.content)} className="flex items-center gap-1.5 text-slate-400 hover:text-indigo-400 px-2 py-1 rounded hover:bg-slate-800 transition-colors text-xs font-medium cursor-pointer">
                        <Download size={13} /> Save
                      </button>
                    </>
                  }
                />
              ) : (
                <div className="flex h-full items-center justify-center text-slate-500 text-sm">Select a .vm file to edit.</div>
              )}
            </Panel>

            <Separator className="w-1 bg-black/40 hover:bg-indigo-600 transition-colors cursor-col-resize" />

            {/* 3. Right Panel: ASM Output Viewer */}
            <Panel defaultSize={40} minSize={20} className="bg-[#252526] flex flex-col">
              <div className="flex items-center justify-between bg-[#1e1e1e] border-b border-black/40 shrink-0">
                
                <div className="flex">
                  <div className="px-4 py-2 text-xs font-medium bg-[#252526] text-indigo-400 border-t-2 border-t-indigo-500 border-r border-black/40">
                    OUTPUT (.asm)
                  </div>
                </div>

                <div className="flex items-center gap-2 px-3">
                  {asmCode && !asmCode.startsWith("// Translated assembly") && (
                    <button onClick={() => downloadFile("Project.asm", asmCode)} className="text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer" title="Download .asm file">
                      <Download size={14} />
                    </button>
                  )}
                  <button onClick={handleTranslateClick} disabled={files.length === 0} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-3 py-1.5 rounded-md text-xs font-semibold transition tracking-wide active:scale-95 shadow-lg shadow-indigo-600/10 cursor-pointer">
                    <Play size={12} fill="currentColor" /> Translate All
                  </button>
                </div>
              </div>

              <div className="flex-1 min-h-0 relative">
                <CodeDisplay
                  title="COMBINED OUTPUT" 
                  value={asmCode}
                  language="hackasm" // Output uses your custom ASM highlighting!
                  readOnly={true}
                  actions={
                    <button onClick={() => handleCopyClick(asmCode)} className="flex items-center gap-1.5 text-slate-400 hover:text-indigo-400 px-2 py-1 rounded hover:bg-slate-800 transition-colors text-xs font-medium cursor-pointer">
                      <Copy size={13} /> Copy
                    </button>
                  }
                />
              </div>
            </Panel>

          </Group>
        </div>

        <div className="h-1 bg-black/30 border-y border-slate-800/40 w-full shrink-0" />
        <div className="flex-1 min-h-[100px] w-full bg-[#1e1e1e]">
          <Console logs={logs} />
        </div>
      </main>
    </div>
  );
}