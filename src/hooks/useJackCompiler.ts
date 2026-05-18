import { useState } from "react";
import { type LogMessage } from "../types/Compiler";
import { type VirtualFile } from "../types/vfs";

export function useJackCompiler() {
  const [compiledFiles, setCompiledFiles] = useState<VirtualFile[]>([]);
  const [logs, setLogs] = useState<LogMessage[]>([
    { text: "Jack Compiler workspace initialized. Ready to compile.", type: "info" }
  ]);

  const addLog = (text: string, type: LogMessage["type"]) => setLogs(prev => [...prev, { text, type }]);
  const clearLogs = () => setLogs([]);

  const runCompile = (jackFiles: VirtualFile[]) => {
    if (jackFiles.length === 0) return;
    
    addLog(`Compiling ${jackFiles.length} .jack file(s)...`, "info");
    
    // Simulate compilation
    setTimeout(() => {
      const outputFiles: VirtualFile[] = jackFiles.map(file => ({
        id: crypto.randomUUID(),
        name: file.name.replace(".jack", ".vm"),
        language: "plaintext",
        content: `// Compiled VM code for ${file.name}\npush constant 0\nreturn`
      }));

      setCompiledFiles(outputFiles);
      addLog(`[Success] Compiled ${jackFiles.length} files successfully.`, "success");
    }, 600);
  };

  return { compiledFiles, logs, addLog, clearLogs, runCompile };
}