export type TabType = "assembler" | "cpuemulator" | "vmemulator";

export interface LogMessage {
  text: string;
  type: "info" | "success" | "error";
}

export interface AssemblyResult {
  success: boolean;
  binary: string[];
  errors: string[];
}