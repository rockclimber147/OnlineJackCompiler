export type TabType = "assembler" | "cpuemulator" | "vmtranslator" | "jackcompiler";

export interface LogMessage {
  text: string;
  type: "info" | "success" | "error";
}

export interface AssemblyResult {
  success: boolean;
  binary: string[];
  errors: CompilerError[];
}

export interface VMTranslationResult {
  success: boolean;
  asmOutput: string;
  errors: CompilerError[];
}

export interface CompilerError {
  message: string;
  line: number;
  startCol?: number; // Optional: defaults to 1
  endCol?: number;   // Optional: defaults to end of line
}

export interface ParsedLine {
  text: string;
  originalLine: number;
}