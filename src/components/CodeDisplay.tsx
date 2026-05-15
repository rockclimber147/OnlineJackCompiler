import Editor from "@monaco-editor/react";
import { registerCustomLanguages } from "../languages";

interface CodeDisplayProps {
  title: string;
  value: string;
  onChange?: (val: string) => void;
  language?: string;
  readOnly?: boolean;
}

export function CodeDisplay({
  title,
  value,
  onChange,
  language = "plaintext",
  readOnly = false,
}: CodeDisplayProps) {
  return (
    <div className="h-full flex flex-col bg-slate-950">
      <div className="bg-slate-900/60 px-4 py-2 text-xs text-slate-400 font-mono border-b border-slate-800/80 tracking-wide select-none">
        {title}
      </div>
      <div className="flex-grow pt-2">
        <Editor
          height="100%"
          language={language}
          theme="vs-dark"
          value={value}
          onChange={(val) => onChange?.(val || "")}
          beforeMount={registerCustomLanguages}
          options={{
            readOnly,
            minimap: { enabled: false },
            fontSize: 14,
            automaticLayout: true,
            lineNumbersMinChars: 3,
            padding: { top: 8 },
            domReadOnly: readOnly,
          }}
        />
      </div>
    </div>
  );
}