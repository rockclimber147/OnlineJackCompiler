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

public static parse(files: VirtualFile[], symbolTable: SymbolTable): VMParseResult {
    const instructions: string[] = [];
    const sourceMap: number[] = [];
    let globalLineOffset = 0;

    for (const file of files) {
      // Register where this file begins in the ROM (for labels scoping)
      symbolTable.registerFileRange(file.name, instructions.length);

      const cleanLines = VMParser.cleanCode(file.content);

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
          instructions.push(text);
          sourceMap.push(globalLineOffset + originalLine + 1);
        }
      }

      const rawLinesCount = file.content.split(/\r?\n/).length;
      globalLineOffset += rawLinesCount;
    }

    return { instructions, sourceMap };
  }
}