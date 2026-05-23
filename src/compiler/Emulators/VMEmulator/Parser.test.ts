import { describe, it, expect, beforeEach } from 'vitest';
import { VMParser } from './Parser';
import { SymbolTable } from './SymbolTable';
import { type VirtualFile } from '../../../types/Vfs';

describe('VMParser', () => {
  let symbolTable: SymbolTable;

  beforeEach(() => {
    symbolTable = new SymbolTable();
  });

  describe('cleanCode', () => {
    it('strips full-line comments and empty lines, retaining correct original line indices', () => {
      const sourceCode = `// This is a comment file

push constant 10 // push a value
pop local 0
      
add`;

      const cleanLines = VMParser.cleanCode(sourceCode);

      expect(cleanLines).toHaveLength(3);
      expect(cleanLines[0]).toEqual({ text: 'push constant 10', originalLine: 2 });
      expect(cleanLines[1]).toEqual({ text: 'pop local 0', originalLine: 3 });
      expect(cleanLines[2]).toEqual({ text: 'add', originalLine: 5 });
    });

    it('handles carriage returns (Windows style CRLF) correctly', () => {
      const sourceCode = "push constant 5\r\n\r\npop local 1\r\n";
      const cleanLines = VMParser.cleanCode(sourceCode);

      expect(cleanLines).toHaveLength(2);
      expect(cleanLines[0]).toEqual({ text: 'push constant 5', originalLine: 0 });
      expect(cleanLines[1]).toEqual({ text: 'pop local 1', originalLine: 2 });
    });
  });

  describe('parse', () => {
    it('parses basic arithmetic and memory commands without symbols', () => {
      const file: VirtualFile = {
        id: '1',
        name: 'Basic.vm',
        language: 'vm',
        content: `push constant 10
push constant 20
add // Add them together
pop local 0`
      };

      const result = VMParser.parse([file], symbolTable);

      expect(result.instructions).toEqual([
        'push constant 10',
        'push constant 20',
        'add',
        'pop local 0'
      ]);

      // All 4 lines map exactly to lines 0, 1, 2, 3
      expect(result.sourceMap).toEqual([0, 1, 2, 3]);
    });

    it('strips pseudo-instructions (label/function) from ROM and updates SymbolTable', () => {
      const file: VirtualFile = {
        id: '2',
        name: 'Math.vm',
        language: 'vm',
        content: `// Math implementation
function Math.multiply 2
push constant 0
pop local 0
label LOOP
push argument 0
push constant 1
sub
pop argument 0`
      };

      const result = VMParser.parse([file], symbolTable);

      // 'function' (line 1) and 'label' (line 4) are omitted from ROM
      expect(result.instructions).toEqual([
        'push constant 0',
        'pop local 0',
        'push argument 0',
        'push constant 1',
        'sub',
        'pop argument 0'
      ]);

      // The source map should skip original lines 0 (comment), 1 (function), and 4 (label)
      expect(result.sourceMap).toEqual([
        2, // push constant 0
        3, // pop local 0
        5, // push argument 0
        6, // push constant 1
        7, // sub
        8  // pop argument 0
      ]);

      // Verify SymbolTable correctly stored the function
      const funcEntry = symbolTable.getFunctionAddress('Math.multiply');
      expect(funcEntry.address).toBe(0); // function points to the first executable instruction
      expect(funcEntry.locals).toBe(2);

      // Verify SymbolTable correctly stored the label
      // The label was declared right after 'pop local 0' (address 1), so it points to address 2
      const labelAddress = symbolTable.getAddressFromLabel(0, 'LOOP'); 
      expect(labelAddress).toBe(2);
    });

    it('handles multiple files correctly in the SymbolTable file ranges', () => {
      const file1: VirtualFile = {
        id: '1',
        name: 'Main.vm',
        language: 'vm',
        content: `function Main.main 0
push constant 5
call Sys.init 1`
      };

      const file2: VirtualFile = {
        id: '2',
        name: 'Sys.vm',
        language: 'vm',
        content: `function Sys.init 1
push argument 0
label END
goto END`
      };

      const result1 = VMParser.parse([file1, file2], symbolTable);
      expect(result1.instructions).toHaveLength(4);
      expect(symbolTable.getFunctionAddress('Main.main')).toEqual({ address: 0, locals: 0 });
    });
  });
});