import { useState } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { Play, Copy, Download, Database } from "lucide-react";

import { CodeDisplay } from "../components/CodeDisplay";
import { Console } from "../components/Console";
import { FileExplorer } from "../components/FileExplorer";
import { JackSymbolTableViewer } from "../components/JackSymbolTableViewer";

import { useVFS } from "../hooks/useVFS";
import { useJackCompiler } from "../hooks/useJackCompiler";
import { copyToClipboard, copyWorkspaceToClipboard, downloadAllFilesAsZip, downloadFile, pasteWorkspaceFromClipboard } from "../utils/FileActions";
import { JACK_OS_FILES } from "../constants/JackOS";

export function JackCompilerPage() {
  const [activeRightTab, setActiveRightTab] = useState<"vm" | "ast" | "symbols">("vm");
  const [activeCompiledFileId, setActiveCompiledFileId] = useState<string | null>(null);

  const { 
    files, activeFileId, setActiveFileId, activeFile, 
    addFile, updateActiveFile, uploadFiles, renameFile, deleteFile, importFiles
  } = useVFS({
    initialFiles: [{
      id: crypto.randomUUID(),
      name: "Main.jack",
      language: "jack",
      content: "class Main {\n  function void main() {\n    do Output.printString(\"Hello World\");\n    return;\n  }\n}"
    }]
  });

  const { logs, compilerErrors, symbolTable, compiledFiles, addLog, runCompile } = useJackCompiler(files);


  const activeFileErrors = compilerErrors.filter(err => 
    activeFile && err.message.startsWith(`[${activeFile.name}]`)
  );

  const activeCompiledFile = compiledFiles.find(f => f.id === activeCompiledFileId) || compiledFiles[0];

  const handleCompileClick = () => runCompile();

  const handleCopyClick = async (text: string) => {
    const success = await copyToClipboard(text);
    if (success) addLog("Copied to clipboard.", "success");
  };

  const handlePasteSourceFiles = async () => {
    const imported = await pasteWorkspaceFromClipboard();
    if (imported) {
      const count = importFiles(imported, ".jack", "jack");
      addLog(`Pasted ${count} Jack files from clipboard.`, "success");
    } else {
      addLog("Clipboard does not contain valid workspace data.", "error");
    }
  };

  const handleLoadOS = () => {
    const existingFileNames = new Set(files.map(f => f.name));
    
    const filesToAdd = JACK_OS_FILES.filter(osFile => !existingFileNames.has(osFile.name));

    if (filesToAdd.length === 0) {
      addLog("All Jack OS files are already in the workspace.", "info");
      return;
    }

    const count = importFiles(filesToAdd, ".jack", "jack");
    
    if (count > 0) {
      addLog(`Loaded ${count} Jack OS files into the workspace.`, "success");
    }
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
                errors={compilerErrors}
                onPasteAll={handlePasteSourceFiles}
                onDownloadAll={() => {
                          downloadAllFilesAsZip(compiledFiles, "compiled-vm-files.zip");
                          addLog("Downloaded compiled VM files as zip.", "success");
                        }}
                onCopyAll={async () => {
                  const success = await copyWorkspaceToClipboard(files);
                  if (success) addLog(`Copied ${files.length} Jack files to clipboard.`, "success");
                }}
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
                  errors={activeFileErrors} // <-- Hooked up local file errors here
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
              <div className="flex items-center justify-between bg-[#1e1e1e] border-b border-black/40 shrink-0 h-[34px]">
                <div className="flex h-full">
                  <button onClick={() => setActiveRightTab("vm")} className={`px-4 flex items-center justify-center text-xs font-medium border-r border-black/40 transition-colors cursor-pointer ${activeRightTab === "vm" ? "bg-[#252526] text-indigo-400 border-t-2 border-t-indigo-500" : "text-slate-500 hover:text-slate-300 bg-[#1e1e1e] border-t-2 border-t-transparent"}`}>
                    VM OUTPUT
                  </button>
                  <button 
                    onClick={() => setActiveRightTab("symbols")} 
                    className={`px-4 flex items-center justify-center text-xs font-medium border-r border-black/40 transition-colors cursor-pointer ${activeRightTab === "symbols" ? "bg-[#252526] text-indigo-400 border-t-2 border-t-indigo-500" : "text-slate-500 hover:text-slate-300 bg-[#1e1e1e] border-t-2 border-t-transparent"}`}
                  >
                    SYMBOLS
                  </button>
                </div>

                <div className="flex items-center px-3">
                  <button 
                    onClick={handleLoadOS} 
                    className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1 rounded-md text-[11px] font-semibold transition tracking-wide cursor-pointer"
                    title="Load standard OS libraries"
                  >
                    <Database size={12} /> Load OS
                  </button>
                  <button onClick={handleCompileClick} disabled={files.length === 0} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-3 py-1 rounded-md text-[11px] font-semibold transition tracking-wide active:scale-95 shadow-lg shadow-indigo-600/10 cursor-pointer">
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
                        onAddFile={() => {}} 
                        onUploadFiles={() => {}} 
                        title="COMPILED VM"
                        onRenameFile={() => {}}
                        onDeleteFile={() => {}}
                        readOnly={true}
                        onDownloadAll={() => {
                          downloadAllFilesAsZip(compiledFiles, "compiled-vm-files.zip");
                          addLog("Downloaded compiled VM files as zip.", "success");
                        }}
                        onCopyAll={async () => {
                          const success = await copyWorkspaceToClipboard(compiledFiles);
                          if (success) addLog(`Copied ${compiledFiles.length} compiled VM files to clipboard. Ready to paste in the VM Translator!`, "success");
                        }}
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
                ) : activeRightTab === "symbols" ? (
                  <JackSymbolTableViewer symbolTable={symbolTable} />

                ) : (
                  <div className="flex h-full items-center justify-center text-slate-500 text-sm italic">
                    AST Viewer not yet implemented.
                  </div>
                )}
              </div>
            </Panel>

          </Group>
        </div>

        <div className="h-1 bg-black/30 border-y border-slate-800/40 w-full shrink-0" />
        <div className="flex-1 min-h-[100px] w-full bg-[#1e1e1e]">
          <Console logs={logs} /> {/* Hooked up clearLogs here */}
        </div>
      </main>
    </div>
  );
}