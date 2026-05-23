export const InstructionType = {
  PUSH: "PUSH",
  POP: "POP",
  UNARY_ARITHMETIC: "UNARY_ARITHMETIC",
  BINARY_ARITHMETIC: "BINARY_ARITHMETIC",
  GOTO: "GOTO",
  IF_GOTO: "IF_GOTO",
  FUNCTION_CALL: "FUNCTION_CALL",
  RETURN: "RETURN",
} as const;

export type InstructionType = typeof InstructionType[keyof typeof InstructionType];

export const Segment = {
  LOCAL: "LOCAL",
  ARG: "ARG",
  THIS: "THIS",
  THAT: "THAT",
  CONSTANT: "CONSTANT",
  STATIC: "STATIC",
  POINTER: "POINTER",
  TEMP: "TEMP",
} as const;

export type Segment = typeof Segment[keyof typeof Segment];

export interface DecodedInstruction {
  type: InstructionType;
  segment?: Segment;
  command?: string;
  value?: number;
}