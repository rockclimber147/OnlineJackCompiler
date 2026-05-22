import { useRef, useEffect } from "react";
import Editor, { type Monaco, type BeforeMount, type OnMount } from "@monaco-editor/react";
import { registerCustomLanguages } from "../languages"; 
import { type CompilerError } from "../types/compiler"; // <-- Import the new type

export interface CodeDisplayProps {
  title: string;
  value: string;
  onChange?: (value: string) => void;
  language: string;
  readOnly?: boolean;
  errors?: CompilerError[]; // <-- UPDATED: Array of structured objects
  actions?: React.ReactNode; 
  onMount?: OnMount;
}

export function CodeDisplay({ 
  title, 
  value, 
  onChange, 
  language, 
  readOnly = false,
  errors = [],
  actions,
  onMount 
}: CodeDisplayProps) {
  
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<Monaco | null>(null);

  const handleBeforeMount: BeforeMount = (monaco) => {
    registerCustomLanguages(monaco);
  };

  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
  };

  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;
    const model = editorRef.current.getModel();
    if (!model) return;

    // Use the structured error objects to create precise markers
    const markers = errors.map((err) => {
      return {
        startLineNumber: err.line,
        startColumn: err.startCol || 1, // Fallback to beginning of line
        endLineNumber: err.line,
        endColumn: err.endCol || 1000,  // Fallback to end of line
        message: err.message,
        severity: monacoRef.current!.MarkerSeverity.Error,
      };
    });

    // Labeling the owner as "compiler" instead of hardcoding "assembler"
    monacoRef.current.editor.setModelMarkers(model, "compiler", markers);
  }, [errors]);

  return (
    <div className="flex flex-col h-full w-full bg-[#1e1e1e]">
      <div className="flex items-center justify-between px-4 py-1.5 bg-[#252526] border-b border-black/40 shrink-0">
        <span className="text-xs font-semibold text-slate-400 truncate">{title}</span>
        {actions && <div className="flex items-center gap-1.5 shrink-0 ml-2">{actions}</div>}
      </div>
      
      <div className="flex-1 min-h-0 pt-2">
        <Editor
          value={value}
          onChange={(val) => onChange?.(val || "")}
          language={language}
          theme="vs-dark"
          beforeMount={handleBeforeMount}
          onMount={(editor, monaco) => {
            handleEditorDidMount(editor, monaco);
            onMount?.(editor, monaco); 
          }} 
          options={{
            readOnly,
            minimap: { enabled: false },
            automaticLayout: true,
            fixedOverflowWidgets: true,
            fontSize: 13,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            wordWrap: "on",
            scrollBeyondLastLine: false,
            lineNumbersMinChars: 3,
            padding: { top: 8 },
          }}
        />
      </div>
    </div>
  );
}