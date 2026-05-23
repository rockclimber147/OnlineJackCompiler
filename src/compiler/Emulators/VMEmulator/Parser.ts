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
      // 1. Scope defaults to the file name
      let currentScope = file.name.split('.')[0]; 
      symbolTable.registerScopeRange(currentScope, instructions.length);

      const cleanLines = VMParser.cleanCode(file.content);

      for (let i = 0; i < cleanLines.length; i++) {
        const { text, originalLine } = cleanLines[i];
        const parts = text.split(/\s+/);
        const command = parts[0];

        if (command === 'function') {
          const functionName = parts[1];
          const locals = parseInt(parts[2], 10);
          
          // 2. The scope is now the function name!
          currentScope = functionName;
          
          // Register the new scope starting at this exact ROM address
          symbolTable.registerScopeRange(currentScope, instructions.length);
          symbolTable.addFunction(functionName, instructions.length, locals);
          
        } else if (command === 'label') {
          // 3. Add the label under the current active scope
          symbolTable.addLabel(currentScope, parts[1], instructions.length);
          
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