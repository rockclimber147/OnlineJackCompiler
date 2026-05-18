export const VMCommandType = {
  C_ARITHMETIC: "C_ARITHMETIC",
  C_PUSH: "C_PUSH",
  C_POP: "C_POP",
  C_LABEL: "C_LABEL",
  C_GOTO: "C_GOTO",
  C_IF: "C_IF",
  C_FUNCTION: "C_FUNCTION",
  C_RETURN: "C_RETURN",
  C_CALL: "C_CALL",
} as const;

export type VMCommandType = typeof VMCommandType[keyof typeof VMCommandType];

// The 9 specific arithmetic and logical commands in the VM language
export const ARITHMETIC_COMMANDS = new Set([
  "add", 
  "sub", 
  "neg", 
  "eq", 
  "gt", 
  "lt", 
  "and", 
  "or", 
  "not"
]);

// Maps standard VM memory segments to their Hack Assembly predefined pointer symbols
export const SEGMENT_POINTERS: Record<string, string> = {
  "local": "LCL",
  "argument": "ARG",
  "this": "THIS",
  "that": "THAT",
};

// Fixed base addresses for specific memory segments
export const SEGMENT_BASES = {
  "temp": 5,      // Temp segment mapped to RAM[5] - RAM[12]
  "pointer": 3,   // Pointer 0 maps to THIS (RAM[3]), Pointer 1 maps to THAT (RAM[4])
};

// Types of memory segments to help validate syntax
export const MEMORY_SEGMENTS = new Set([
  "argument", 
  "local", 
  "static", 
  "constant", 
  "this", 
  "that", 
  "pointer", 
  "temp"
]);