import { useState, useEffect } from "react";
import { Assembler } from "../compiler/HackAssembler/Assembler";
import { type LogMessage } from "../types/Compiler";

export function useAssembler(activeContent?: string) {
  const [binaryCode, setBinaryCode] = useState<string>("// Binary machine code output will appear here");
  const [symbolTableData, setSymbolTableData] = useState<Array<{symbol: string, address: number}>>([]);
  const [compilerErrors, setCompilerErrors] = useState<string[]>([]);
  const [logs, setLogs] = useState<LogMessage[]>([
    { text: "Assembler workspace initialized. Ready for source compilation.", type: "info" }
  ]);

  const addLog = (text: string, type: LogMessage["type"]) => setLogs(prev => [...prev, { text, type }]);
  const clearLogs = () => setLogs([]);

  // Background Syntax Checker
  useEffect(() => {
    if (activeContent === undefined) {
      setCompilerErrors([]);
      return;
    }

    const debounceTimer = setTimeout(() => {
      const bgAssembler = new Assembler();
      const result = bgAssembler.assemble(activeContent);
      setCompilerErrors(result.errors);
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [activeContent]);

  // Main Assemble Action
  const runAssemble = (filename: string, content: string): boolean => {
    addLog(`Compiling ${filename}...`, "info");
    
    const assembler = new Assembler();
    const result = assembler.assemble(content);
    setSymbolTableData(assembler.symbolTable.getEntries());

    if (result.success) {
      setBinaryCode(result.binary.join("\n"));
      setCompilerErrors([]); 
      addLog(`[Success] Compiled ${result.binary.length} instructions smoothly.`, "success");
      return true;
    } else {
      setBinaryCode("// Compilation Failed");
      setCompilerErrors(result.errors); 
      addLog("[Build Failure] Assembly failed with errors:", "error");
      result.errors.forEach(err => addLog(` -> ${err}`, "error"));
      return false;
    }
  };

  return { binaryCode, symbolTableData, compilerErrors, logs, addLog, clearLogs, runAssemble };
}