import { useRef, useEffect } from "react";
import Editor, { type Monaco, type BeforeMount } from "@monaco-editor/react";
import { registerCustomLanguages } from "../languages"; 

interface CodeDisplayProps {
  title: string;
  value: string;
  onChange?: (value: string) => void;
  language: string;
  readOnly?: boolean;
  errors?: string[];
  actions?: React.ReactNode; // <-- NEW: Injected buttons
}

export function CodeDisplay({ 
  title, 
  value, 
  onChange, 
  language, 
  readOnly = false,
  errors = [],
  actions 
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

    const markers = errors.map((errStr) => {
      const match = errStr.match(/Line (\d+)/);
      const lineNum = match ? parseInt(match[1], 10) : 1;
      return {
        startLineNumber: lineNum,
        startColumn: 1,
        endLineNumber: lineNum,
        endColumn: 1000, 
        message: errStr,
        severity: monacoRef.current!.MarkerSeverity.Error,
      };
    });

    monacoRef.current.editor.setModelMarkers(model, "assembler", markers);
  }, [errors]);

  return (
    <div className="flex flex-col h-full w-full bg-[#1e1e1e]">
      {/* UPDATE: Header with Flexbox for Actions */}
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
          onMount={handleEditorDidMount} 
          options={{
            readOnly,
            minimap: { enabled: false },
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