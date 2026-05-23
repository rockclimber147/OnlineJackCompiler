import type { VirtualFile } from '../../../types/Vfs';
import { SymbolTable } from './SymbolTable';
import type { ParsedVMLine, VMParseResult } from './types';

export class VMParser {
  public static cleanCode(sourceCode: string): ParsedVMLine[] {
    const lines = sourceCode.split(/\r?\n/);
    const cleanLines: ParsedVMLine[] = [];

    for (let i = 0; i < lines.length; i++) {
      const text = lines[i].split('//')[0].trim();
      if (text) {
        cleanLines.push({ text, originalLine: i });
      }
    }

    return cleanLines;
  }

  public static parse(file: VirtualFile, symbolTable: SymbolTable): VMParseResult {
    const cleanLines = VMParser.cleanCode(file.content);
    
    const instructions: string[] = [];
    const sourceMap: number[] = [];

    // Register where this file begins in the ROM (for labels scoping)
    symbolTable.registerFileRange(file.name, instructions.length);

    for (let i = 0; i < cleanLines.length; i++) {
      const { text, originalLine } = cleanLines[i];
      const parts = text.split(/\s+/);
      const command = parts[0];

      if (command === 'label') {
        // Labels point to the next executable instruction. They are not added to ROM.
        symbolTable.addLabel(file.name, parts[1], instructions.length);
        
      } else if (command === 'function') {
        // Functions point to the next executable instruction. They are not added to ROM.
        const functionName = parts[1];
        const locals = parseInt(parts[2], 10);
        symbolTable.addFunction(functionName, instructions.length, locals);
        
      } else {
        // Executable instruction (push, pop, add, call, return, goto, etc.)
        instructions.push(text);
        
        // CRITICAL: Push the mapping only when an executable instruction is generated
        sourceMap.push(originalLine);
      }
    }

    return { instructions, sourceMap };
  }
}