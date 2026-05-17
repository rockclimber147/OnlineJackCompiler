import { useEffect, useState } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { Play } from "lucide-react";
import { CodeDisplay } from "../components/CodeDisplay";
import { Console } from "../components/Console";
import { type LogMessage } from "../types/compiler";
import { Assembler } from "../compiler/HackAssembler/Assembler";

export function AssemblerPage() {
  const [asmCode, setAsmCode] = useState<string>("");
  
  // Right Panel States
  const [activeRightTab, setActiveRightTab] = useState<"binary" | "symbols">("binary");
  const [binaryCode, setBinaryCode] = useState<string>("// Binary machine code output will appear here");
  const [symbolTableData, setSymbolTableData] = useState<Array<{symbol: string, address: number}>>([]);
  const [compilerErrors, setCompilerErrors] = useState<string[]>([]);
  const [logs, setLogs] = useState<LogMessage[]>([
    { text: "Assembler workspace initialized. Ready for source compilation.", type: "info" }
  ]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      const backgroundAssembler = new Assembler();
      const result = backgroundAssembler.assemble(asmCode);
      setCompilerErrors(result.errors);
      
    }, 500);

    // Cleanup function cancels the timeout if the user keeps typing
    return () => clearTimeout(debounceTimer);
  }, [asmCode]);

  const handleAssemble = () => {
    setLogs(prev => [...prev, { text: "Executing Assembler Pass 1 & Pass 2...", type: "info" }]);
    
    const assembler = new Assembler();
    const result = assembler.assemble(asmCode);

    setSymbolTableData(assembler.symbolTable.getEntries());

    if (result.success) {
      setBinaryCode(result.binary.join("\n"));
      setCompilerErrors([]); // Clear squigglies on success
      setLogs(prev => [
        ...prev,
        { text: `[Success] Compiled ${result.binary.length} instructions smoothly.`, type: "success" }
      ]);
    } else {
      setBinaryCode("// Compilation Failed");
      setCompilerErrors(result.errors); // Pass the errors to state
      setLogs(prev => [
        ...prev,
        { text: "[Build Failure] Assembly failed with errors:", type: "error" },
        ...result.errors.map((err): LogMessage => ({ text: ` -> ${err}`, type: "error" }))
      ]);
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-[#1e1e1e] text-slate-300 overflow-hidden relative select-none">
      
      <main className="flex-1 flex flex-col min-h-0 h-full">
        
        <div className="h-[75%] min-h-[200px] w-full shrink-0">
          <Group className="h-full w-full">
            
            {/* Left Side: ASM Code Input */}
            <Panel className="bg-[#252526] min-w-[150px]">
              <CodeDisplay
                title="SOURCE CODE (.asm)"
                value={asmCode}
                onChange={setAsmCode}
                language="hackasm"
                errors={compilerErrors} 
              />
            </Panel>

            <Separator className="w-1 bg-black/20 hover:bg-indigo-600 transition-colors cursor-col-resize" />

            {/* Right Side: Tabbed Viewer */}
            <Panel className="bg-[#252526] min-w-[150px] flex flex-col">
              
              {/* VS Code Style Tab Bar - NOW WITH BUTTON ALIGNED INSIDE */}
              <div className="flex items-center justify-between bg-[#1e1e1e] border-b border-black/40 shrink-0">
                <div className="flex">
                  <button
                    onClick={() => setActiveRightTab("binary")}
                    className={`px-4 py-2 text-xs font-medium border-r border-black/40 transition-colors ${
                      activeRightTab === "binary"
                        ? "bg-[#252526] text-indigo-400 border-t-2 border-t-indigo-500"
                        : "text-slate-500 hover:text-slate-300 hover:bg-[#2a2a2b] border-t-2 border-t-transparent"
                    }`}
                  >
                    BINARY (.hack)
                  </button>
                  <button
                    onClick={() => setActiveRightTab("symbols")}
                    className={`px-4 py-2 text-xs font-medium border-r border-black/40 transition-colors ${
                      activeRightTab === "symbols"
                        ? "bg-[#252526] text-indigo-400 border-t-2 border-t-indigo-500"
                        : "text-slate-500 hover:text-slate-300 hover:bg-[#2a2a2b] border-t-2 border-t-transparent"
                    }`}
                  >
                    SYMBOL TABLE
                  </button>
                </div>

                {/* Moved the Run Button here */}
                <div className="px-3">
                  <button
                    onClick={handleAssemble}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-md text-xs font-semibold transition tracking-wide active:scale-95 shadow-lg shadow-indigo-600/10 cursor-pointer"
                  >
                    <Play size={12} fill="currentColor" /> Run Assembler
                  </button>
                </div>
              </div>

              {/* Tab Content Area */}
              <div className="flex-1 min-h-0 relative">
                {activeRightTab === "binary" ? (
                  <CodeDisplay
                    title="OUTPUT" 
                    value={binaryCode}
                    language="plaintext"
                    readOnly={true}
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
                        {symbolTableData.length === 0 && (
                          <tr>
                            <td colSpan={2} className="py-6 text-center text-slate-500 italic">
                              Run the assembler to populate the symbol table.
                            </td>
                          </tr>
                        )}
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