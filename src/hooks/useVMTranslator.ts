import { useState } from "react";
import { type LogMessage } from "../types/Compiler";
import { type VirtualFile } from "../types/vfs";

export function useVMTranslator() {
  const [asmCode, setAsmCode] = useState<string>("// Translated assembly code will appear here");
  const [logs, setLogs] = useState<LogMessage[]>([
    { text: "VM Translator workspace initialized. Ready for translation.", type: "info" }
  ]);

  const addLog = (text: string, type: LogMessage["type"]) => setLogs(prev => [...prev, { text, type }]);
  const clearLogs = () => setLogs([]);

  const runTranslate = (files: VirtualFile[]) => {
    if (files.length === 0) return;
    
    addLog(`Translating ${files.length} .vm file(s)...`, "info");
    
    setTimeout(() => {
      setAsmCode(`// Translated from ${files.length} file(s)\n// Bootstrap Code\n@256\nD=A\n@SP\nM=D\n// ... rest of translation`);
      addLog(`[Success] Translated ${files.length} files into single ASM output.`, "success");
    }, 500);
  };

  return { asmCode, logs, addLog, clearLogs, runTranslate };
}