import { useState, useRef, useEffect } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { Virtuoso } from 'react-virtuoso';
import * as monaco from "monaco-editor";
import { useHackEmulator } from "../hooks/useHackEmulator";
import { Assembler } from "../compiler/HackAssembler/Assembler";
import { DebuggerCodeDisplay } from "../components/Emulator/DebuggerCodeDisplay";
import type { CompilerError } from "../types/compiler";
import { RegisterPanel } from "../components/Emulator/RegisterPanel";
import { RamViewer } from "../components/Emulator/RamViewer";

export function HackEmulatorPage() {
  const { pc, registers, load, step, getRamRange, setRam } = useHackEmulator();
  const [source, setSource] = useState("// Write your Hack ASM here\n@10\nD=A\n@0\nM=D");
  const [errors, setErrors] = useState<CompilerError[]>([]);

  const assembler = useRef(new Assembler());
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const decorationCollectionRef = useRef<monaco.editor.IEditorDecorationsCollection | null>(null)
  const sourceMapRef = useRef<number[]>([]);

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  
  const handleAssembleAndLoad = () => {
    try {
      const result = assembler.current.assemble(source);
      setErrors(result.errors);
      
      if (result.success && result.binary) {
        sourceMapRef.current = result.sourceMap;
        const numericInstructions = result.binary.map((bin) => {
          const val = parseInt(bin, 2);
          return (val << 16) >> 16;
        });
        
        load(numericInstructions);
      } else {
        console.error("Assembly errors:", result.errors);
      }
    } catch (e) {
      console.error("Assembler crash:", e);
      alert("Assembler encountered an error.");
    }
  };

  useEffect(() => {
    const editor = editorRef.current;
    const lineNumber = sourceMapRef.current[pc];

    if (editor && lineNumber) {
      if (!decorationCollectionRef.current) {
        decorationCollectionRef.current = editor.createDecorationsCollection();
      }

      decorationCollectionRef.current.set([
        {
          range: new monaco.Range(lineNumber, 1, lineNumber, 1),
          options: {
            isWholeLine: true,
            className: 'asm-line-highlight',
          },
        },
      ]);
      
      editor.revealLineInCenter(lineNumber);
    }
  }, [pc]);

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
        {/* Left: Code Editor */}
        <Panel defaultSize={40}>
          <DebuggerCodeDisplay 
            title="Hack Assembly"
            language="asm"
            value={source}
            onChange={setSource}
            pc={pc}
            sourceMap={sourceMapRef.current}
            errors={errors}
          />
        </Panel>

        <Separator className="w-1 bg-slate-800" />

        {/* Center: Screen & Registers */}
        <Panel defaultSize={30} className="p-4 flex flex-col gap-4">
          <div className="flex-1 bg-slate-950 rounded border border-slate-800 flex items-center justify-center text-slate-600 font-mono text-sm">
            [ Screen Placeholder ]
          </div>
          <RegisterPanel pc={pc} registers={registers} />
        </Panel>

        <Separator className="w-1 bg-slate-800" />

        {/* Right: RAM Viewer */}
        <Panel defaultSize={30}>
          <RamViewer getRamRange={getRamRange} setRam={setRam} />
        </Panel>
      </Group>
    </div>
  );
}