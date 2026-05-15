import { useState } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { Play } from "lucide-react";
import { CodeDisplay } from "../components/CodeDisplay";
import { Console } from "../components/Console";
import { type LogMessage } from "../types/compiler";
// import { AssemblerEngine } from "../compiler/assembler/AssemblerEngine";

export function AssemblerPage() {
  // Localized states for the Assembler workspace
  const [asmCode, setAsmCode] = useState<string>(
    "// Example: Compute 2 + 3\n@2\nD=A\n@3\nD=D+A\n(END)\n@END\n0;JMP"
  );
  const [binaryCode, setBinaryCode] = useState<string>("// Binary machine code output will appear here");
  const [logs, setLogs] = useState<LogMessage[]>([
    { text: "Assembler workspace initialized. Ready for source compilation.", type: "info" }
  ]);

  const handleAssemble = () => {
    setLogs(prev => [...prev, { text: "Executing Assembler Pass 1 & Pass 2...", type: "info" }]);
    
    const result = { success: true, errors: [], binary: ["1001010110110"]} // AssemblerEngine.assemble(asmCode);

    if (result.success) {
      setBinaryCode(result.binary.join("\n"));
      setLogs(prev => [
        ...prev,
        { text: `[Success] Compiled ${result.binary.length} instructions smoothly.`, type: "success" }
      ]);
    } else {
      setBinaryCode("// Compilation Failed");
      setLogs(prev => [
        ...prev,
        { text: "[Build Failure] Assembly failed with errors:", type: "error" },
        ...result.errors.map((err): LogMessage => ({ text: ` -> ${err}`, type: "error" }))
      ]);
    }
  };

return (
    <div className="h-full w-full flex flex-col bg-[#1e1e1e] text-slate-300 overflow-hidden relative select-none">
      
      {/* Page Action Bar (Floated over the workspace) */}
      <div className="absolute top-2 right-6 z-50">
        <button
          onClick={handleAssemble}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-md text-xs font-semibold transition tracking-wide active:scale-95 shadow-lg shadow-indigo-600/10 cursor-pointer"
        >
          <Play size={12} fill="currentColor" /> Run Assembler
        </button>
      </div>

      {/* Main Workspace Layout Stack */}
      <main className="flex-1 flex flex-col min-h-0 h-full">
        
        {/* UPPER PORTION: Horizontal Resizable Side-by-Side Code Editors */}
        <div className="h-[75%] min-h-[200px] w-full shrink-0">
          <Group className="h-full w-full">
            
            {/* Left Side: ASM Code Input */}
            <Panel className="bg-[#252526] min-w-[150px]">
              <CodeDisplay
                title="SOURCE CODE (.asm)"
                value={asmCode}
                onChange={setAsmCode}
                language="hackasm"
              />
            </Panel>

            {/* Vertical Drag bar separator */}
            <Separator className="w-1 bg-black/20 hover:bg-indigo-600 transition-colors cursor-col-resize" />

            {/* Right Side: Binary Machine Code Reader */}
            <Panel className="bg-[#252526] min-w-[150px]">
              <CodeDisplay
                title="MACHINE CODE BINARY (.hack)"
                value={binaryCode}
                language="plaintext"
                readOnly={true}
              />
            </Panel>

          </Group>
        </div>

        {/* STATIO DIVIDER GUTTER: Clean divider between editors and terminal */}
        <div className="h-1 bg-black/30 border-y border-slate-800/40 w-full shrink-0" />

        {/* LOWER PORTION: Output Diagnostic Console Tray */}
        <div className="flex-1 min-h-[100px] w-full bg-[#1e1e1e]">
          <Console logs={logs} />
        </div>

      </main>
    </div>
  );
}