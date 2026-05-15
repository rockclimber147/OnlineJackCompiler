import { SymbolTable } from "./SymbolTable";
import { Parser, InstructionType } from "./Parser";
import { COMP_MAP, DEST_MAP, JUMP_MAP } from "../../languages/asm/AsmSpec";
import { type AssemblyResult } from "../../types/compiler"; 

export class Assembler {
  public static assemble(sourceCode: string): AssemblyResult {
    const errors: string[] = [];
    const binary: string[] = [];
    const symbolTable = new SymbolTable();
    
    const cleanLines = Parser.cleanCode(sourceCode);
    
    // ==========================================
    // PASS 1: Build the Symbol Table (Labels)
    // ==========================================
    let romAddress = 0;
    
    for (let i = 0; i < cleanLines.length; i++) {
      const line = cleanLines[i];
      const type = Parser.instructionType(line);
      
      if (type === InstructionType.L_INSTRUCTION) {
        const symbol = Parser.symbol(line, type);
        // Do not increment ROM address for labels
        symbolTable.addEntry(symbol, romAddress); 
      } else {
        romAddress++; // Only A and C instructions take up ROM space
      }
    }

    // ==========================================
    // PASS 2: Translate to Binary Machine Code
    // ==========================================
    let nextRamAddress = 16; // Variables start at RAM[16]

    for (let i = 0; i < cleanLines.length; i++) {
      const line = cleanLines[i];
      const type = Parser.instructionType(line);

      try {
        if (type === InstructionType.A_INSTRUCTION) {
          const symbol = Parser.symbol(line, type);
          let numericValue: number;

          // Check if symbol is a raw number (e.g., @100) or a variable (e.g., @i)
          if (/^\d+$/.test(symbol)) {
            numericValue = parseInt(symbol, 10);
          } else {
            if (!symbolTable.contains(symbol)) {
              symbolTable.addEntry(symbol, nextRamAddress++);
            }
            numericValue = symbolTable.getAddress(symbol);
          }

          // Convert to 15-bit binary and prepend with '0' for A-instruction
          const binaryString = "0" + numericValue.toString(2).padStart(15, "0");
          binary.push(binaryString);

        } else if (type === InstructionType.C_INSTRUCTION) {
          const destMnemonic = Parser.dest(line);
          const compMnemonic = Parser.comp(line);
          const jumpMnemonic = Parser.jump(line);

          const destBin = DEST_MAP[destMnemonic] || "000";
          const jumpBin = JUMP_MAP[jumpMnemonic] || "000";
          const compBin = COMP_MAP[compMnemonic];

          if (!compBin) {
            errors.push(`Line ${i+1}: Invalid comp instruction '${compMnemonic}' in '${line}'`);
            continue;
          }

          // C-instruction format: 111 a c1 c2 c3 c4 c5 c6 d1 d2 d3 j1 j2 j3
          binary.push(`111${compBin}${destBin}${jumpBin}`);
        }
        // L-instructions are ignored in Pass 2
      } catch (err: any) {
        errors.push(`Line ${i+1} (${line}): ${err.message}`);
      }
    }

    return {
      success: errors.length === 0,
      binary,
      errors
    };
  }
}