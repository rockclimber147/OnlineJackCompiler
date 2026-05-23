import { useEffect, useRef } from "react";
import { CodeDisplay, type CodeDisplayProps } from "../CodeDisplay";

// components/DebuggerCodeDisplay.tsx
interface DebuggerCodeDisplayProps extends CodeDisplayProps {
  pc: number;
  sourceMap: number[];
}

export function DebuggerCodeDisplay({ pc, sourceMap, ...props }: DebuggerCodeDisplayProps) {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const decorationRef = useRef<string[]>([]);

  useEffect(() => {
    if (editorRef.current && monacoRef.current && sourceMap[pc]) {
      const lineNumber = sourceMap[pc];
      decorationRef.current = editorRef.current.deltaDecorations(
        decorationRef.current,
        [{
          range: new monacoRef.current.Range(lineNumber, 1, lineNumber, 1),
          options: {
            isWholeLine: true,
            className: 'asm-line-highlight',
          },
        }]
      );
      editorRef.current.revealLineInCenter(lineNumber);
    }
  }, [pc, sourceMap]);

  return (
    <CodeDisplay
      {...props}
      onMount={(editor, monaco) => {
        editorRef.current = editor;
        monacoRef.current = monaco;
      }}
    />
  );
}