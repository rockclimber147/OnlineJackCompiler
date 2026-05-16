import { useRef, useEffect } from "react";
import Editor, { type Monaco } from "@monaco-editor/react";

interface CodeDisplayProps {
  title: string;
  value: string;
  onChange?: (value: string) => void;
  language: string;
  readOnly?: boolean;
  errors?: string[]; // New optional prop for our squigglies
}

export function CodeDisplay({ 
  title, 
  value, 
  onChange, 
  language, 
  readOnly = false,
  errors = [] 
}: CodeDisplayProps) {
  
  // Hold onto the editor and monaco instances
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<Monaco | null>(null);

  // Capture the instances when the editor loads
  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
  };

  // Effect to paint the red squiggly markers whenever 'errors' change
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;

    const model = editorRef.current.getModel();
    if (!model) return;

    // Map our string errors into Monaco Marker objects
    const markers = errors.map((errStr) => {
      // Extract the line number from our string format (e.g., "Line 12: ...")
      const match = errStr.match(/Line (\d+)/);
      const lineNum = match ? parseInt(match[1], 10) : 1;

      return {
        startLineNumber: lineNum,
        startColumn: 1,
        endLineNumber: lineNum,
        endColumn: 1000, // High number ensures the whole line is underlined
        message: errStr,
        severity: monacoRef.current!.MarkerSeverity.Error,
      };
    });

    // Apply the markers to the editor
    monacoRef.current.editor.setModelMarkers(model, "assembler", markers);

  }, [errors]);

  return (
    <div className="flex flex-col h-full w-full bg-[#1e1e1e]">
      {/* File Header */}
      <div className="px-4 py-2 text-xs font-semibold text-slate-400 bg-[#252526] border-b border-black/40 shrink-0">
        {title}
      </div>
      
      {/* Monaco Editor */}
      <div className="flex-1 min-h-0 pt-2">
        <Editor
          value={value}
          onChange={(val) => onChange?.(val || "")}
          language={language}
          theme="vs-dark"
          onMount={handleEditorDidMount} // Bind our mount handler
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