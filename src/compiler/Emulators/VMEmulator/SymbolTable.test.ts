import { describe, it, expect, beforeEach } from 'vitest';
import { SymbolTable } from './SymbolTable';

describe('SymbolTable', () => {
  let symbolTable: SymbolTable;

  beforeEach(() => {
    symbolTable = new SymbolTable();
  });

  describe('Functions (Global Scope)', () => {
    it('stores and retrieves function addresses and locals', () => {
      symbolTable.addFunction('Sys.init', 0, 0);
      symbolTable.addFunction('Math.multiply', 25, 2);

      expect(symbolTable.getFunctionAddress('Sys.init')).toEqual({ address: 0, locals: 0 });
      expect(symbolTable.getFunctionAddress('Math.multiply')).toEqual({ address: 25, locals: 2 });
    });

    it('throws an error if a function is not found', () => {
      expect(() => symbolTable.getFunctionAddress('Unknown.func')).toThrowError('Function not found: Unknown.func');
    });
  });

  describe('File Ranges and PC Resolution', () => {
    it('correctly maps a Program Counter to the corresponding file name', () => {
      symbolTable.registerFileRange('Sys.vm', 0);
      symbolTable.registerFileRange('Main.vm', 15);
      symbolTable.registerFileRange('Math.vm', 40);

      // PC within the first file
      expect(symbolTable.getFileNameFromPC(0)).toBe('Sys.vm');
      expect(symbolTable.getFileNameFromPC(14)).toBe('Sys.vm');

      // PC exactly on the boundary of the second file
      expect(symbolTable.getFileNameFromPC(15)).toBe('Main.vm');
      
      // PC deep within the second file
      expect(symbolTable.getFileNameFromPC(30)).toBe('Main.vm');

      // PC in the last file and beyond
      expect(symbolTable.getFileNameFromPC(40)).toBe('Math.vm');
      expect(symbolTable.getFileNameFromPC(1000)).toBe('Math.vm');
    });

    it('sorts file ranges correctly even if registered out of order', () => {
      // Register in mixed order
      symbolTable.registerFileRange('Math.vm', 40);
      symbolTable.registerFileRange('Sys.vm', 0);
      symbolTable.registerFileRange('Main.vm', 15);

      expect(symbolTable.getFileNameFromPC(10)).toBe('Sys.vm');
      expect(symbolTable.getFileNameFromPC(20)).toBe('Main.vm');
      expect(symbolTable.getFileNameFromPC(50)).toBe('Math.vm');
    });

    it('returns empty string if no ranges are registered', () => {
      expect(symbolTable.getFileNameFromPC(10)).toBe('');
    });
  });

  describe('Labels (File Scope)', () => {
    it('resolves labels based on the current PC file context', () => {
      // Setup files
      symbolTable.registerFileRange('Main.vm', 0);
      symbolTable.registerFileRange('Math.vm', 50);

      // Add labels with the SAME name but in different files
      symbolTable.addLabel('Main.vm', 'LOOP', 12);
      symbolTable.addLabel('Math.vm', 'LOOP', 65);

      // If PC is 5, we are in Main.vm, so LOOP should resolve to 12
      expect(symbolTable.getAddressFromLabel(5, 'LOOP')).toBe(12);

      // If PC is 55, we are in Math.vm, so LOOP should resolve to 65
      expect(symbolTable.getAddressFromLabel(55, 'LOOP')).toBe(65);
    });

    it('throws an error if the label does not exist in the current file scope', () => {
      symbolTable.registerFileRange('Main.vm', 0);
      symbolTable.addLabel('Main.vm', 'START', 10);

      expect(() => symbolTable.getAddressFromLabel(5, 'MISSING_LABEL')).toThrowError('Label not found: MISSING_LABEL');
    });
  });

  describe('clear()', () => {
    it('wipes all stored data', () => {
      symbolTable.addFunction('Sys.init', 0, 0);
      symbolTable.registerFileRange('Main.vm', 0);
      symbolTable.addLabel('Main.vm', 'LOOP', 5);

      symbolTable.clear();

      expect(() => symbolTable.getFunctionAddress('Sys.init')).toThrow();
      expect(() => symbolTable.getAddressFromLabel(0, 'LOOP')).toThrow();
      expect(symbolTable.getFileNameFromPC(0)).toBe('');
    });
  });
});