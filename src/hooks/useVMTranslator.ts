import { useState } from "react";
import { type LogMessage } from "../types/Compiler";
import { type VirtualFile } from "../types/Vfs";
import { VMTranslator } from "../compiler/VMTranslator/VMTranslator"; // <-- Import engine

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
    
    const translator = new VMTranslator();
    const result = translator.translateAll(files);

    if (result.success) {
      setAsmCode(result.asmOutput);
      addLog(`[Success] Translated ${files.length} files successfully.`, "success");
    } else {
      setAsmCode("// Translation Failed");
      addLog("[Build Failure] Translation failed with errors:", "error");
      result.errors.forEach(err => addLog(` -> ${err}`, "error"));
    }
  };

  return { asmCode, logs, addLog, clearLogs, runTranslate };
}