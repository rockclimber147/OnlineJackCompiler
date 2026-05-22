import { useState, useRef } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import Editor from "@monaco-editor/react";
import { useHackEmulator } from "../hooks/useHackEmulator";
import { Assembler } from "../compiler/HackAssembler/Assembler";

export function HackEmulatorPage() {
  const { pc, registers, load, step, getRamRange } = useHackEmulator();
  const [source, setSource] = useState("// Write your Hack ASM here\n@10\nD=A\n@0\nM=D");
  
  // Initialize assembler ref to avoid re-instantiating on every render
  const assembler = useRef(new Assembler());

  const handleAssembleAndLoad = () => {
    try {
      const result = assembler.current.assemble(source);
      
      if (result.success && result.binary) {
        // Convert binary strings ("000...1") to Int16 numbers
        const numericInstructions = result.binary.map((bin) => {
          const val = parseInt(bin, 2);
          // Force 16-bit signed wrapping
          return (val << 16) >> 16;
        });
        
        load(numericInstructions);
      } else {
        console.error("Assembly errors:", result.errors);
        alert(`Assembly failed: ${JSON.stringify(result.errors)}`);
      }
    } catch (e) {
      console.error("Assembler crash:", e);
      alert("Assembler encountered an error. Check console.");
    }
  };

  return (
    <div className="h-full w-full bg-slate-900 text-slate-100 flex flex-col">
      {/* Toolbar */}
      <div className="h-12 border-b border-slate-800 flex items-center px-4 gap-2 bg-slate-950">
        <button 
          onClick={handleAssembleAndLoad} 
          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 rounded text-sm font-medium transition-colors"
        >
          Assemble & Load
        </button>
        <button 
          onClick={step} 
          className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-sm font-medium transition-colors"
        >
          Step
        </button>
      </div>

      <Group className="flex-1">
        {/* Left: ASM Editor */}
        <Panel defaultSize={40}>
          <Editor 
            theme="vs-dark"
            language="plaintext" // Or your custom 'asm' language
            value={source} 
            onChange={(v) => setSource(v || "")}
            options={{ 
              minimap: { enabled: false },
              fontSize: 14,
              fontFamily: 'monospace'
            }}
          />
        </Panel>

        <Separator className="w-1 bg-slate-800" />

        {/* Middle: Registers & Screen Placeholder */}
        <Panel defaultSize={30} className="p-4 flex flex-col gap-4">
          <div className="bg-slate-950 p-4 rounded border border-slate-800">
            <h2 className="text-xs text-slate-400 uppercase tracking-wider mb-3">Registers</h2>
            <div className="font-mono text-lg space-y-1">
              <div className="flex justify-between"><span>PC:</span> <span className="text-indigo-400">{pc}</span></div>
              <div className="flex justify-between"><span>A:</span> <span className="text-emerald-400">{registers.a}</span></div>
              <div className="flex justify-between"><span>D:</span> <span className="text-amber-400">{registers.d}</span></div>
            </div>
          </div>
          
          <div className="flex-1 bg-slate-950 rounded border border-slate-800 flex items-center justify-center text-slate-600 font-mono text-sm">
            [ Screen Placeholder ]
          </div>
        </Panel>

        <Separator className="w-1 bg-slate-800" />

        {/* Right: RAM Viewer */}
        <Panel defaultSize={30} className="p-4 overflow-y-auto">
          <h2 className="text-xs text-slate-400 uppercase tracking-wider mb-3">RAM (0-63)</h2>
          <div className="grid grid-cols-2 gap-2 font-mono text-xs">
            {getRamRange(0, 64).map((value, i) => (
              <div key={i} className="bg-slate-950 p-1 px-2 rounded border border-slate-800 flex justify-between">
                <span className="text-slate-600">{i}:</span> 
                <span className={value !== 0 ? "text-indigo-400" : "text-slate-200"}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      </Group>
    </div>
  );
}