import { useState } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { Play, Copy, Download } from "lucide-react";

import { CodeDisplay } from "../components/CodeDisplay";
import { Console } from "../components/Console";
import { FileExplorer } from "../components/FileExplorer";

import { useVFS } from "../hooks/useVFS";
import { useJackCompiler } from "../hooks/useJackCompiler";
import { copyToClipboard, downloadFile } from "../utils/FileActions";

export function JackCompilerPage() {
  const [activeRightTab, setActiveRightTab] = useState<"vm" | "ast" | "symbols">("vm");
  const [activeCompiledFileId, setActiveCompiledFileId] = useState<string | null>(null);

  const { 
    files, activeFileId, setActiveFileId, activeFile, 
    addFile, updateActiveFile, uploadFiles, renameFile, deleteFile 
  } = useVFS({
    initialFiles: [{
      id: crypto.randomUUID(),
      name: "Main.jack",
      language: "jack",
      content: "class Main {\n  function void main() {\n    do Output.printString(\"Hello World\");\n    return;\n  }\n}"
    }]
  });

  const { compiledFiles, logs, addLog, runCompile } = useJackCompiler();

  const activeCompiledFile = compiledFiles.find(f => f.id === activeCompiledFileId) || compiledFiles[0];

  const handleCompileClick = () => runCompile(files);

  const handleCopyClick = async (text: string) => {
    const success = await copyToClipboard(text);
    if (success) addLog("Copied to clipboard.", "success");
  };

  return (
    <div className="h-full w-full flex flex-col bg-[#1e1e1e] text-slate-300 overflow-hidden relative select-none">
      <main className="flex-1 flex flex-col min-h-0 h-full">
        <div className="h-[75%] min-h-[200px] w-full shrink-0">
          <Group className="h-full w-full">
            
            {/* 1. Left Panel: SOURCE File Explorer */}
            <Panel defaultSize={15} minSize={10} className="bg-[#181818]">
              <FileExplorer 
                files={files}
                activeFileId={activeFileId}
                onSelectFile={setActiveFileId}
                onAddFile={(name) => addFile(name, ".jack", "jack")}
                onUploadFiles={(fl) => uploadFiles(fl, ".jack", "jack", addLog)}
                onRenameFile={(id, name) => renameFile(id, name)}
                onDeleteFile={deleteFile}
                title="JACK FILES"
                acceptedExtensions=".jack"
              />
            </Panel>

            <Separator className="w-1 bg-black/40 hover:bg-indigo-600 transition-colors cursor-col-resize" />

            {/* 2. Middle Panel: Jack Code Editor */}
            <Panel defaultSize={35} minSize={20} className="bg-[#252526]">
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
                <div className="flex h-full items-center justify-center text-slate-500 text-sm">Select a .jack file to edit.</div>
              )}
            </Panel>

            <Separator className="w-1 bg-black/40 hover:bg-indigo-600 transition-colors cursor-col-resize" />

            {/* 3. Right Panel: Output Viewer */}
            <Panel defaultSize={50} minSize={30} className="bg-[#252526] flex flex-col">
              
              {/* Tab Bar & Compile Button */}
              <div className="flex items-center justify-between bg-[#1e1e1e] border-b border-black/40 shrink-0">
                <div className="flex">
                  <button onClick={() => setActiveRightTab("vm")} className={`px-4 py-2 text-xs font-medium border-r border-black/40 transition-colors ${activeRightTab === "vm" ? "bg-[#252526] text-indigo-400 border-t-2 border-t-indigo-500" : "text-slate-500 hover:text-slate-300 hover:bg-[#2a2a2b] border-t-2 border-t-transparent"}`}>
                    VM OUTPUT
                  </button>
                  <button onClick={() => setActiveRightTab("ast")} className={`px-4 py-2 text-xs font-medium border-r border-black/40 transition-colors ${activeRightTab === "ast" ? "bg-[#252526] text-indigo-400 border-t-2 border-t-indigo-500" : "text-slate-500 hover:text-slate-300 hover:bg-[#2a2a2b] border-t-2 border-t-transparent"}`}>
                    AST (XML)
                  </button>
                </div>

                <div className="flex items-center px-3">
                  <button onClick={handleCompileClick} disabled={files.length === 0} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-3 py-1.5 rounded-md text-xs font-semibold transition tracking-wide active:scale-95 shadow-lg shadow-indigo-600/10 cursor-pointer">
                    <Play size={12} fill="currentColor" /> Compile Jack
                  </button>
                </div>
              </div>

              {/* Tab Contents */}
              <div className="flex-1 min-h-0 relative">
                {activeRightTab === "vm" ? (
                  /* NESTED RESIZABLE LAYOUT FOR VM OUTPUTS */
                  <Group>
                    <Panel defaultSize={25} minSize={15}>
                      <FileExplorer 
                        files={compiledFiles}
                        activeFileId={activeCompiledFile?.id || null}
                        onSelectFile={setActiveCompiledFileId}
                        onAddFile={() => {}} onUploadFiles={() => {}} // Disabled
                        title="COMPILED VM"
                        onRenameFile={() => {}}
                        onDeleteFile={() => {}}
                        readOnly={true}
                      />
                    </Panel>
                    <Separator className="w-1 bg-black/20 hover:bg-indigo-600 transition-colors cursor-col-resize" />
                    <Panel defaultSize={75}>
                      {activeCompiledFile ? (
                        <CodeDisplay
                          title={activeCompiledFile.name}
                          value={activeCompiledFile.content}
                          language="hackvm"
                          readOnly={true}
                          actions={
                            <>
                              <button onClick={() => handleCopyClick(activeCompiledFile.content)} className="flex items-center gap-1.5 text-slate-400 hover:text-indigo-400 px-2 py-1 rounded hover:bg-slate-800 transition-colors text-xs font-medium cursor-pointer">
                                <Copy size={13} /> Copy
                              </button>
                              <button onClick={() => downloadFile(activeCompiledFile.name, activeCompiledFile.content)} className="flex items-center gap-1.5 text-slate-400 hover:text-indigo-400 px-2 py-1 rounded hover:bg-slate-800 transition-colors text-xs font-medium cursor-pointer">
                                <Download size={13} /> Save VM
                              </button>
                            </>
                          }
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-slate-500 text-sm italic">Run compiler to generate VM files.</div>
                      )}
                    </Panel>
                  </Group>
                ) : (
                  <div className="p-6 text-slate-400 italic text-sm">AST Viewer not yet implemented.</div>
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