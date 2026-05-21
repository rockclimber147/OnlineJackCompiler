import type { ParsedLine } from "../../types/compiler";

export const InstructionType = {
  A_INSTRUCTION: 0, // @xxx
  C_INSTRUCTION: 1, // dest=comp;jump
  L_INSTRUCTION: 2, // (LABEL)
} as const;
export type InstructionType = (typeof InstructionType)[keyof typeof InstructionType];

export class Parser {
  /**
   * Strips all whitespace and comments from the raw source code.
   * Returns an array of clean, executable instruction lines.
   */
  public static cleanCode(rawCode: string): ParsedLine[] {
    const parsedLines: ParsedLine[] = [];
    const lines = rawCode.split(/\r?\n/);

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      
      // Remove comments
      const commentIndex = line.indexOf("//");
      if (commentIndex !== -1) {
        line = line.substring(0, commentIndex);
      }
      
      // Strip spaces
      line = line.replace(/\s+/g, ""); 

      // If line isn't empty, store it with its true line number (1-based index)
      if (line.length > 0) {
        parsedLines.push({
          text: line,
          originalLine: i + 1 
        });
      }
    }

    return parsedLines;
  }

  /**
   * Determines the type of the given instruction.
   */
  public static instructionType(instruction: string): InstructionType {
    if (instruction.startsWith("@")) {
      return InstructionType.A_INSTRUCTION;
    } else if (instruction.startsWith("(") && instruction.endsWith(")")) {
      return InstructionType.L_INSTRUCTION;
    } else {
      return InstructionType.C_INSTRUCTION;
    }
  }

  /**
   * Extracts the symbol from an A-Instruction or L-Instruction.
   * Ex: "@100" -> "100" | "(LOOP)" -> "LOOP"
   */
  public static symbol(instruction: string, type: InstructionType): string {
    if (type === InstructionType.A_INSTRUCTION) {
      return instruction.substring(1);
    }
    if (type === InstructionType.L_INSTRUCTION) {
      return instruction.substring(1, instruction.length - 1);
    }
    throw new Error("symbol() only applies to A or L instructions.");
  }

  /**
   * Extracts the dest mnemonic from a C-Instruction.
   */
  public static dest(instruction: string): string {
    const equalsIndex = instruction.indexOf("=");
    return equalsIndex !== -1 ? instruction.substring(0, equalsIndex) : "null";
  }

  /**
   * Extracts the comp mnemonic from a C-Instruction.
   */
  public static comp(instruction: string): string {
    const equalsIndex = instruction.indexOf("=");
    const semiIndex = instruction.indexOf(";");
    
    const start = equalsIndex !== -1 ? equalsIndex + 1 : 0;
    const end = semiIndex !== -1 ? semiIndex : instruction.length;
    
    return instruction.substring(start, end);
  }

  /**
   * Extracts the jump mnemonic from a C-Instruction.
   */
  public static jump(instruction: string): string {
    const semiIndex = instruction.indexOf(";");
    return semiIndex !== -1 ? instruction.substring(semiIndex + 1) : "null";
  }
}