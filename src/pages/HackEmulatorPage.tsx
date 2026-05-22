import { useState, useRef, useEffect } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { Virtuoso } from 'react-virtuoso';
import * as monaco from "monaco-editor";
import { useHackEmulator } from "../hooks/useHackEmulator";
import { Assembler } from "../compiler/HackAssembler/Assembler";
import { DebuggerCodeDisplay } from "../components/DebuggerCodeDisplay";
import type { CompilerError } from "../types/compiler";

export function HackEmulatorPage() {
  const { pc, registers, load, step, getRamRange } = useHackEmulator();
  const [source, setSource] = useState("// Write your Hack ASM here\n@10\nD=A\n@0\nM=D");
  const [errors, setErrors] = useState<CompilerError[]>([]);

  const assembler = useRef(new Assembler());
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const decorationCollectionRef = useRef<monaco.editor.IEditorDecorationsCollection | null>(null)
  const sourceMapRef = useRef<number[]>([]);
  
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
        <Panel defaultSize={40}>
          <DebuggerCodeDisplay 
            title="Hack Assembly"
            language="hackasm"
            value={source}
            onChange={setSource}
            pc={pc}
            sourceMap={sourceMapRef.current}
            errors={errors}
            onMount={(editor) => { editorRef.current = editor; }}
          />
        </Panel>

        <Separator className="w-1 bg-slate-800" />

        <Panel defaultSize={30} className="p-4 flex flex-col gap-4">
          <div className="flex-1 bg-slate-950 rounded border border-slate-800 flex items-center justify-center text-slate-600 font-mono text-sm">
            [ Screen Placeholder ]
          </div>
          <div className="bg-slate-950 p-4 rounded border border-slate-800">
            <h2 className="text-xs text-slate-400 uppercase tracking-wider mb-3">Registers</h2>
            <div className="font-mono text-lg space-y-1">
              <div className="flex justify-between"><span>PC:</span> <span className="text-indigo-400">{pc}</span></div>
              <div className="flex justify-between"><span>A:</span> <span className="text-emerald-400">{registers.a}</span></div>
              <div className="flex justify-between"><span>D:</span> <span className="text-amber-400">{registers.d}</span></div>
            </div>
          </div>
        </Panel>

        <Separator className="w-1 bg-slate-800" />

        <Panel defaultSize={30} className="flex flex-col p-4 bg-slate-900 border-l border-slate-800">
          <h2 className="text-xs text-slate-400 uppercase tracking-wider mb-3">RAM</h2>
          <div className="flex-1 overflow-hidden">
            <Virtuoso
              style={{ height: '100%' }}
              totalCount={16384}
              itemContent={(index) => {
                const val = getRamRange(index, 1)[0];
                return (
                  <div className="flex items-center justify-between px-2 py-1 border-b border-slate-800/50 font-mono text-xs">
                    <span className="text-slate-600 w-12 shrink-0">{index}:</span>
                    <span className={val !== 0 ? "text-indigo-400 font-bold" : "text-slate-200"}>
                      {val}
                    </span>
                  </div>
                );
              }}
            />
          </div>
        </Panel>
      </Group>
    </div>
  );
}