import { SymbolTable } from "./SymbolTable";
import { Parser, InstructionType } from "./Parser";
import { COMP_MAP, DEST_MAP, JUMP_MAP } from "../../languages/asm/AsmSpec";
import { type AssemblyResult, type CompilerError, type ParsedLine } from "../../types/compiler"; 

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
    
    // Using a context object so the address can be mutated by reference inside helper methods
    const ramContext = { address: 16 }; 

    for (let i = 0; i < cleanLines.length; i++) {
      const { text, originalLine } = cleanLines[i]; 
      const type = Parser.instructionType(text);

      try {
        let result: { binary?: string; error?: CompilerError } = {};

        if (type === InstructionType.A_INSTRUCTION) {
          result = this.processAInstruction(text, originalLine, ramContext);
        } else if (type === InstructionType.C_INSTRUCTION) {
          result = this.processCInstruction(text, originalLine);
        }

        if (result.error) {
          errors.push(result.error);
        } else if (result.binary) {
          binary.push(result.binary);
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

  private processAInstruction(
    text: string, 
    originalLine: number, 
    ramContext: { address: number }
  ): { binary?: string; error?: CompilerError } {
    const symbol = Parser.symbol(text, InstructionType.A_INSTRUCTION);
    let numericValue: number;

    if (/^\d+$/.test(symbol)) {
      numericValue = parseInt(symbol, 10);
    } else {
      if (!this.symbolTable.contains(symbol)) {
        if (symbol === symbol.toUpperCase()) {
          return {
            error: {
              message: `Undefined label reference or symbol mismatch: '@${symbol}'`,
              line: originalLine,
              startCol: text.indexOf(symbol) + 1, // +1 because Monaco is 1-indexed
              endCol: text.indexOf(symbol) + 1 + symbol.length
            }
          };
        }
        this.symbolTable.addEntry(symbol, ramContext.address++);
      }
      numericValue = this.symbolTable.getAddress(symbol);
    }

    const binaryString = "0" + numericValue.toString(2).padStart(15, "0");
    return { binary: binaryString };
  }

private processCInstruction(
    text: string, 
    originalLine: number
  ): { binary?: string; error?: CompilerError } {
    const destMnemonic = Parser.dest(text);
    const compMnemonic = Parser.comp(text);
    const jumpMnemonic = Parser.jump(text);

    const destBin = DEST_MAP[destMnemonic];
    const compBin = COMP_MAP[compMnemonic];
    const jumpBin = JUMP_MAP[jumpMnemonic];

    if (!destBin) {
      const destStart = text.indexOf(destMnemonic);
      return {
        error: {
          message: `Invalid dest instruction: '${destMnemonic}'`,
          line: originalLine,
          startCol: destStart !== -1 ? destStart + 1 : 1,
          endCol: destStart !== -1 ? destStart + 1 + destMnemonic.length : text.indexOf('=') + 2
        }
      };
    }

    // 2. Validate Comp
    if (!compBin) {
      const compStart = text.indexOf(compMnemonic);
      return {
        error: {
          message: `Invalid comp instruction: '${compMnemonic}'`,
          line: originalLine,
          startCol: compStart !== -1 && compMnemonic !== "" ? compStart + 1 : 1,
          endCol: compStart !== -1 && compMnemonic !== "" ? compStart + 1 + compMnemonic.length : text.length + 1
        }
      };
    }

    // 3. Validate Jump
    if (!jumpBin) {
      const jumpStart = text.indexOf(';');
      
      const highlightStart = jumpStart !== -1 ? jumpStart + 2 : text.length; 
      const highlightEnd = jumpMnemonic ? highlightStart + jumpMnemonic.length : highlightStart + 1;
      
      return {
        error: {
          message: !jumpMnemonic || jumpMnemonic.trim() === "" 
            ? "Missing jump instruction after ';'" 
            : `Invalid jump instruction: '${jumpMnemonic}'`,
          line: originalLine,
          startCol: highlightStart,
          endCol: highlightEnd
        }
      };
    }

    // If all are valid, construct the 16-bit C-instruction
    return { binary: `111${compBin}${destBin}${jumpBin}` };
  }
}