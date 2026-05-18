import { useEffect, useState } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { Play, Copy, Download } from "lucide-react";

import { CodeDisplay } from "../components/CodeDisplay";
import { Console } from "../components/Console";
import { FileExplorer } from "../components/FileExplorer";

import { useVFS } from "../hooks/useVFS";
import { useAssembler } from "../hooks/useAssembler";
import { copyToClipboard, downloadFile } from "../utils/FileActions";

export function AssemblerPage() {
  const [activeRightTab, setActiveRightTab] = useState<"binary" | "symbols">("binary");

  const { 
    files, activeFileId, setActiveFileId, activeFile, 
    addFile, updateActiveFile, uploadFiles, setFileError, renameFile, deleteFile
  } = useVFS({
    initialFiles: []
  });

  const { 
    binaryCode, symbolTableData, compilerErrors, logs, 
    addLog, runAssemble 
  } = useAssembler(activeFile?.content);

  // --- Handlers ---
  const handleCompileClick = () => {
    if (!activeFile) return;
    const success = runAssemble(activeFile.name, activeFile.content);
    if (!success) setActiveRightTab("binary");
  };

  const handleCopyClick = async (text: string) => {
    const success = await copyToClipboard(text);
    if (success) addLog("Copied to clipboard.", "success");
  };

  useEffect(() => {
    if (activeFileId) {
      setFileError(activeFileId, compilerErrors.length > 0);
    }
  }, [compilerErrors, activeFileId]);

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
                onAddFile={(name) => addFile(name, ".asm", "hackasm")}
                onUploadFiles={(fl) => uploadFiles(fl, ".asm", "hackasm", addLog)} 
                onRenameFile={renameFile} // <-- Wire it up
                onDeleteFile={deleteFile}
                title="WORKSPACE"
                acceptedExtensions=".asm,.txt"
                errors={compilerErrors}
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
                  errors={compilerErrors}
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
                <div className="flex h-full items-center justify-center text-slate-500 text-sm">Select or create a file to start coding.</div>
              )}
            </Panel>

            <Separator className="w-1 bg-black/40 hover:bg-indigo-600 transition-colors cursor-col-resize" />

            {/* 3. Right Panel: Tabbed Output Viewer */}
            <Panel defaultSize={40} minSize={20} className="bg-[#252526] flex flex-col">
              <div className="flex items-center justify-between bg-[#1e1e1e] border-b border-black/40 shrink-0">
                
                <div className="flex">
                  <button onClick={() => setActiveRightTab("binary")} className={`px-4 py-2 text-xs font-medium border-r border-black/40 transition-colors ${activeRightTab === "binary" ? "bg-[#252526] text-indigo-400 border-t-2 border-t-indigo-500" : "text-slate-500 hover:text-slate-300 hover:bg-[#2a2a2b] border-t-2 border-t-transparent"}`}>
                    BINARY (.hack)
                  </button>
                  <button onClick={() => setActiveRightTab("symbols")} className={`px-4 py-2 text-xs font-medium border-r border-black/40 transition-colors ${activeRightTab === "symbols" ? "bg-[#252526] text-indigo-400 border-t-2 border-t-indigo-500" : "text-slate-500 hover:text-slate-300 hover:bg-[#2a2a2b] border-t-2 border-t-transparent"}`}>
                    SYMBOL TABLE
                  </button>
                </div>

                <div className="flex items-center gap-2 px-3">
                  <button onClick={handleCompileClick} disabled={!activeFile} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-3 py-1.5 rounded-md text-xs font-semibold transition tracking-wide active:scale-95 shadow-lg shadow-indigo-600/10 cursor-pointer">
                    <Play size={12} fill="currentColor" /> Run Assembler
                  </button>
                </div>
              </div>

              <div className="flex-1 min-h-0 relative">
                {activeRightTab === "binary" ? (
                  <CodeDisplay
                    title="OUTPUT" 
                    value={binaryCode}
                    language="hackbinary"
                    readOnly={true}
                    actions={
                      <>
                        <button onClick={() => handleCopyClick(binaryCode)} className="flex items-center gap-1.5 text-slate-400 hover:text-indigo-400 px-2 py-1 rounded hover:bg-slate-800 transition-colors text-xs font-medium cursor-pointer">
                          <Copy size={13} /> Copy
                        </button>
                        
                        {/* ADDED: Download button is now native to the CodeDisplay header */}
                        {binaryCode !== "// Compilation Failed" && !binaryCode.startsWith("//") && (
                          <button onClick={() => downloadFile(activeFile?.name.replace(".asm", ".hack") || "output.hack", binaryCode)} className="flex items-center gap-1.5 text-slate-400 hover:text-indigo-400 px-2 py-1 rounded hover:bg-slate-800 transition-colors text-xs font-medium cursor-pointer">
                            <Download size={13} /> Save
                          </button>
                        )}
                      </>
                    }
                  />
                ) : (
                  <div className="h-full overflow-y-auto p-4 font-mono text-sm text-slate-300 select-text">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-700 text-slate-400 text-xs tracking-wider">
                          <th className="pb-2 font-medium">SYMBOL</th>
                          <th className="pb-2 font-medium">ADDRESS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {symbolTableData.map((entry, idx) => (
                          <tr key={idx} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                            <td className="py-2 text-indigo-300">{entry.symbol}</td>
                            <td className="py-2 text-emerald-400">{entry.address}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
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