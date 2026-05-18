import { useState, useEffect } from "react";
import { type LogMessage, type CompilerError } from "../types/Compiler";
import { type VirtualFile } from "../types/Vfs";
import { VMTranslator } from "../compiler/VMTranslator/VMTranslator";
import type { VMSymbol } from "../compiler/VMTranslator/SymbolTable";

export function useVMTranslator(files: VirtualFile[]) {
  const [asmCode, setAsmCode] = useState<string>("// Translated assembly code will appear here");
  const [compilerErrors, setCompilerErrors] = useState<CompilerError[]>([]);
  const [symbols, setSymbols] = useState<VMSymbol[]>([]);
  const [logs, setLogs] = useState<LogMessage[]>([
    { text: "VM Translator workspace initialized. Ready for translation.", type: "info" }
  ]);

  useEffect(() => {
    if (!files || files.length === 0) {
      setCompilerErrors([]);
      setSymbols([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      const translator = new VMTranslator();
      const result = translator.translateAll(files);
      setCompilerErrors(result.errors);
      setSymbols(result.symbols);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [files]);

  const addLog = (text: string, type: LogMessage["type"]) => setLogs(prev => [...prev, { text, type }]);
  const clearLogs = () => setLogs([]);

  // Removed files argument since it's now accessed from the hook scope
  const runTranslate = () => {
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
      result.errors.forEach(err => addLog(` -> ${err.message} (Line ${err.line})`, "error"));
    }
  };

  return { asmCode, logs, compilerErrors, symbols, addLog, clearLogs, runTranslate };
}