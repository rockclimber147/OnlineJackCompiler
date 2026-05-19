import { useState, useEffect } from "react";
import { type LogMessage, type CompilerError } from "../types/Compiler";
import { type VirtualFile } from "../types/Vfs";
import { JackCompiler } from "../compiler/JackCompiler/JackCompiler";

export function useJackCompiler(files: VirtualFile[]) {
  const [compilerErrors, setCompilerErrors] = useState<CompilerError[]>([]);
  const [compiledFiles, setCompiledFiles] = useState<VirtualFile[]>([]); // <-- NEW STATE
  const [logs, setLogs] = useState<LogMessage[]>([
    { text: "Jack Compiler workspace initialized. Ready for syntax checking.", type: "info" }
  ]);

  const addLog = (text: string, type: LogMessage["type"]) => setLogs(prev => [...prev, { text, type }]);
  const clearLogs = () => setLogs([]);

  // Auto-compile on typing
  useEffect(() => {
    if (!files || files.length === 0) {
      setCompilerErrors([]);
      setCompiledFiles([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      const compiler = new JackCompiler();
      const result = compiler.compileAll(files, false);
      setCompilerErrors(result.errors);
      
      // Auto-update VM files if it successfully compiles
      if (result.success) {
        setCompiledFiles(result.compiledFiles);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [files]);

  // Manual compile button
const runCompile = () => {
    if (files.length === 0) return;
    const compiler = new JackCompiler();
    
    const result = compiler.compileAll(files, true);

    setCompilerErrors(result.errors);

    if (result.success) {
      setCompiledFiles(result.compiledFiles);
      addLog(`[Success] Compiled ${result.compiledFiles.length} files to VM successfully.`, "success");
    } else {
      addLog(`[Build Failure] Found ${result.errors.length} errors. Fix them before compiling:`, "error");
    
      result.errors.forEach(err => {
        addLog(`  -> ${err.message}`, "error");
      });
    }
  };

  return { logs, compilerErrors, compiledFiles, addLog, clearLogs, runCompile };
}