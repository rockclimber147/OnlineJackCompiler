import { useState, useEffect } from "react";
import { type LogMessage, type CompilerError } from "../types/Compiler";
import { type VirtualFile } from "../types/Vfs";
import { JackCompiler } from "../compiler/JackCompiler/JackCompiler";

export function useJackCompiler(files: VirtualFile[]) {
  const [compilerErrors, setCompilerErrors] = useState<CompilerError[]>([]);
  const [logs, setLogs] = useState<LogMessage[]>([
    { text: "Jack Compiler workspace initialized. Ready for syntax checking.", type: "info" }
  ]);

  const addLog = (text: string, type: LogMessage["type"]) => setLogs(prev => [...prev, { text, type }]);
  const clearLogs = () => setLogs([]);

  useEffect(() => {
    if (!files || files.length === 0) {
      setCompilerErrors([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      const compiler = new JackCompiler();
      const result = compiler.compileAll(files);
      setCompilerErrors(result.errors);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [files]);

  const runCompile = () => {
    if (files.length === 0) return;
    const compiler = new JackCompiler();
    const result = compiler.compileAll(files);

    if (result.success) {
      addLog(`[Success] Parsed ${files.length} Jack files with 0 syntax errors.`, "success");
    } else {
      addLog(`[Build Failure] Found ${result.errors.length} syntax errors.`, "error");
    }
  };

  return { logs, compilerErrors, addLog, clearLogs, runCompile };
}