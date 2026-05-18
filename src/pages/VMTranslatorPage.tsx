import { useState } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { Play, Copy, Download } from "lucide-react";

import { CodeDisplay } from "../components/CodeDisplay";
import { Console } from "../components/Console";
import { FileExplorer } from "../components/FileExplorer";
import { VMSymbolTableViewer } from "../components/VMSymbolTableViewer";

import { useVFS } from "../hooks/useVFS";
import { useVMTranslator } from "../hooks/useVMTranslator";
import { copyToClipboard, downloadFile } from "../utils/FileActions";

export function VMTranslatorPage() {
  const { 
    files, activeFileId, setActiveFileId, activeFile, 
    addFile, updateActiveFile, uploadFiles, renameFile, deleteFile 
  } = useVFS({
    initialFiles: [{
      id: crypto.randomUUID(),
      name: "Main.vm",
      language: "hackvm", 
      content: "// Example VM code\npush constant 7\npush constant 8\nadd\nreturn"
    }]
  });

  const { 
    asmCode, logs, compilerErrors, symbols, addLog, runTranslate, 
  } = useVMTranslator(files);

  // NEW: State for Right Panel tabs
  const [rightTab, setRightTab] = useState<"output" | "symbols">("output");

  const activeFileErrors = compilerErrors.filter(err => 
    activeFile && err.message.startsWith(`[${activeFile.name}]`)
  );

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
            <Panel defaultSize={15} minSize={10} className="bg-[#181818]">
              <FileExplorer 
                files={files}
                activeFileId={activeFileId}
                onSelectFile={setActiveFileId}
                onAddFile={(name) => addFile(name, ".vm", "hackvm")}
                onUploadFiles={(fl) => uploadFiles(fl, ".vm", "hackvm", addLog)}
                onRenameFile={(id, name) => renameFile(id, name)}
                onDeleteFile={deleteFile}
                title="WORKSPACE"
                acceptedExtensions=".vm"
                errors={compilerErrors}
              />
            </Panel>

            <Separator className="w-1 bg-black/40 hover:bg-indigo-600 transition-colors cursor-col-resize" />

            {/* 2. Middle Panel: VM Code Editor */}
            <Panel defaultSize={45} minSize={20} className="bg-[#252526]">
              {activeFile ? (
                <CodeDisplay
                  title={activeFile.name}
                  value={activeFile.content}
                  language={activeFile.language}
                  onChange={updateActiveFile}
                  errors={activeFileErrors} 
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

            {/* 3. Right Panel: Output & Symbols */}
            <Panel defaultSize={40} minSize={20} className="bg-[#252526] flex flex-col">
              <div className="flex items-center justify-between bg-[#1e1e1e] border-b border-black/40 shrink-0 pr-3 h-[34px]">
                
                {/* Tabs */}
                <div className="flex h-full">
                  <button 
                    onClick={() => setRightTab("output")}
                    className={`px-4 flex items-center justify-center text-xs font-medium tracking-wide border-r border-black/40 transition-colors cursor-pointer ${
                      rightTab === "output" ? "text-indigo-400 bg-[#252526] border-t-2 border-t-indigo-500" : "text-slate-500 bg-[#1e1e1e] border-t-2 border-t-transparent hover:text-slate-300"
                    }`}
                  >
                    OUTPUT (.asm)
                  </button>
                  <button 
                    onClick={() => setRightTab("symbols")}
                    className={`px-4 flex items-center justify-center text-xs font-medium tracking-wide border-r border-black/40 transition-colors cursor-pointer ${
                      rightTab === "symbols" ? "text-indigo-400 bg-[#252526] border-t-2 border-t-indigo-500" : "text-slate-500 bg-[#1e1e1e] border-t-2 border-t-transparent hover:text-slate-300"
                    }`}
                  >
                    SYMBOLS
                  </button>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button onClick={runTranslate} disabled={files.length === 0} className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-2 py-1 rounded-md text-[11px] font-semibold transition tracking-wide active:scale-95 shadow-lg shadow-indigo-600/10 cursor-pointer">
                    <Play size={12} fill="currentColor" /> Translate All
                  </button>
                </div>
              </div>

              {/* Dynamic Content */}
              <div className="flex-1 min-h-0 relative">
                {rightTab === "output" ? (
                  <CodeDisplay
                    title="Project.asm" 
                    value={asmCode}
                    language="hackasm" 
                    readOnly={true}
                    actions={
                      <>
                        <button onClick={() => handleCopyClick(asmCode)} className="flex items-center gap-1.5 text-slate-400 hover:text-indigo-400 px-2 py-1 rounded hover:bg-slate-800 transition-colors text-xs font-medium cursor-pointer">
                          <Copy size={13} /> Copy
                        </button>
                        {asmCode && !asmCode.startsWith("// Translated assembly") && !asmCode.startsWith("// Translation Failed") && (
                          <button onClick={() => downloadFile("Project.asm", asmCode)} className="flex items-center gap-1.5 text-slate-400 hover:text-indigo-400 px-2 py-1 rounded hover:bg-slate-800 transition-colors text-xs font-medium cursor-pointer">
                            <Download size={13} /> Save
                          </button>
                        )}
                      </>
                    }
                  />
                ) : (
                  <VMSymbolTableViewer symbols={symbols} />
                )}
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