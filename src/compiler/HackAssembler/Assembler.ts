import { SymbolTable } from "./SymbolTable";
import { Parser, InstructionType } from "./Parser";
import { COMP_MAP, DEST_MAP, JUMP_MAP } from "../../languages/asm/AsmSpec";
import { type AssemblyResult, type CompilerError, type ParsedLine } from "../../types/Compiler"; 

export class Assembler {
  public symbolTable: SymbolTable;

  constructor() {
    this.symbolTable = new SymbolTable();
  }

  public assemble(sourceCode: string): AssemblyResult {
    const cleanLines: ParsedLine[] = Parser.cleanCode(sourceCode);
    
    // Pass 1: Register all (LABEL) declarations
    this.symbolPass(cleanLines);

    // Pass 2: Translate A and C instructions into binary
    const { binary, errors } = this.translationPass(cleanLines);

    return {
      success: errors.length === 0,
      binary,
      errors
    };
  }

  private symbolPass(cleanLines: ParsedLine[]): void {
    let romAddress = 0;
    
    for (let i = 0; i < cleanLines.length; i++) {
      const { text } = cleanLines[i];
      const type = Parser.instructionType(text);
      
      if (type === InstructionType.L_INSTRUCTION) {
        const symbol = Parser.symbol(text, type);
        this.symbolTable.addEntry(symbol, romAddress); 
      } else {
        romAddress++; 
      }
    }
  }

  private translationPass(cleanLines: ParsedLine[]): { binary: string[], errors: CompilerError[] } {
    const errors: CompilerError[] = [];
    const binary: string[] = [];
    let nextRamAddress = 16; 

    for (let i = 0; i < cleanLines.length; i++) {
      const { text, originalLine } = cleanLines[i]; 
      const type = Parser.instructionType(text);

      try {
        if (type === InstructionType.A_INSTRUCTION) {
          const symbol = Parser.symbol(text, type);
          let numericValue: number;

          if (/^\d+$/.test(symbol)) {
            numericValue = parseInt(symbol, 10);
          } else {
            if (!this.symbolTable.contains(symbol)) {
              if (symbol === symbol.toUpperCase()) {
                errors.push({
                  message: `Undefined label reference or symbol mismatch: '@${symbol}'`,
                  line: originalLine,
                  startCol: text.indexOf(symbol) + 1, // +1 because Monaco is 1-indexed
                  endCol: text.indexOf(symbol) + 1 + symbol.length
                });
                continue; 
              }
              this.symbolTable.addEntry(symbol, nextRamAddress++);
            }
            numericValue = this.symbolTable.getAddress(symbol);
          }

          const binaryString = "0" + numericValue.toString(2).padStart(15, "0");
          binary.push(binaryString);

        } else if (type === InstructionType.C_INSTRUCTION) {
          const destMnemonic = Parser.dest(text);
          const compMnemonic = Parser.comp(text);
          const jumpMnemonic = Parser.jump(text);

          const destBin = DEST_MAP[destMnemonic] || "000";
          const jumpBin = JUMP_MAP[jumpMnemonic] || "000";
          const compBin = COMP_MAP[compMnemonic];

          if (!compBin) {
            // HIGHLIGHT: Just the invalid comp part (e.g., in "D=M+D;JMP", highlight "M+D")
            const compStart = text.indexOf(compMnemonic);
            errors.push({
              message: `Invalid comp instruction: '${compMnemonic}'`,
              line: originalLine,
              startCol: compStart !== -1 ? compStart + 1 : 1,
              endCol: compStart !== -1 ? compStart + 1 + compMnemonic.length : text.length + 1
            });
            continue;
          }

          binary.push(`111${compBin}${destBin}${jumpBin}`);
        }
      } catch (err: any) {
        // Fallback for generic parsing errors (highlight the whole instruction)
        errors.push({
          message: err.message,
          line: originalLine,
          startCol: 1,
          endCol: text.length + 1
        });
      }
    }

    return { binary, errors };
  }
}