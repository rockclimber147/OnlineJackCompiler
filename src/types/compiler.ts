export type TabType = "assembler" | "cpuemulator" | "vmtranslator" | "jackcompiler";

export interface LogMessage {
  text: string;
  type: "info" | "success" | "error";
}

export interface AssemblyResult {
  success: boolean;
  binary: string[];
  errors: string[];
}