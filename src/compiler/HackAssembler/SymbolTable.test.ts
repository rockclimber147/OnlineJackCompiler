import { describe, it, expect, beforeEach } from 'vitest';
import { SymbolTable } from './SymbolTable';

describe('Hack Assembler SymbolTable', () => {
  let symbolTable: SymbolTable;

  // Run this before every single 'it' block to ensure a clean state
  beforeEach(() => {
    symbolTable = new SymbolTable();
  });

  // ==========================================
  // 1. Initialization Tests
  // ==========================================
  describe('Constructor & Predefined Symbols', () => {
    it('should initialize with standard virtual registers', () => {
      expect(symbolTable.contains('SP')).toBe(true);
      expect(symbolTable.getAddress('SP')).toBe(0);
      
      expect(symbolTable.contains('LCL')).toBe(true);
      expect(symbolTable.getAddress('LCL')).toBe(1);
    });

    it('should initialize with standard RAM registers (R0-R15)', () => {
      expect(symbolTable.contains('R0')).toBe(true);
      expect(symbolTable.getAddress('R0')).toBe(0);

      expect(symbolTable.contains('R15')).toBe(true);
      expect(symbolTable.getAddress('R15')).toBe(15);
    });

    it('should initialize with I/O pointers', () => {
      expect(symbolTable.contains('SCREEN')).toBe(true);
      expect(symbolTable.getAddress('SCREEN')).toBe(16384);

      expect(symbolTable.contains('KBD')).toBe(true);
      expect(symbolTable.getAddress('KBD')).toBe(24576);
    });
  });

  // ==========================================
  // 2. addEntry() & contains() Tests
  // ==========================================
  describe('addEntry() and contains()', () => {
    it('should return false for symbols that do not exist', () => {
      expect(symbolTable.contains('MY_VAR')).toBe(false);
      expect(symbolTable.contains('LOOP_START')).toBe(false);
    });

    it('should successfully add new variables and labels', () => {
      symbolTable.addEntry('i', 16);
      symbolTable.addEntry('LOOP', 42);

      expect(symbolTable.contains('i')).toBe(true);
      expect(symbolTable.contains('LOOP')).toBe(true);
    });

    it('should overwrite existing entries if added again', () => {
      symbolTable.addEntry('COUNTER', 16);
      expect(symbolTable.getAddress('COUNTER')).toBe(16);

      symbolTable.addEntry('COUNTER', 17); // Overwrite
      expect(symbolTable.getAddress('COUNTER')).toBe(17);
    });
  });

  // ==========================================
  // 3. getAddress() Tests
  // ==========================================
  describe('getAddress()', () => {
    it('should return the correct address for a newly added symbol', () => {
      symbolTable.addEntry('sum', 18);
      expect(symbolTable.getAddress('sum')).toBe(18);
    });

    it('should throw a descriptive error if the symbol is missing', () => {
      expect(() => {
        symbolTable.getAddress('MISSING_LABEL');
      }).toThrow("Symbol 'MISSING_LABEL' not found in table.");
    });
  });

  // ==========================================
  // 4. getEntries() Tests
  // ==========================================
  describe('getEntries()', () => {
    it('should return an array containing all predefined symbols initially', () => {
      const entries = symbolTable.getEntries();
      
      // We know there are at least 23 predefined symbols in Hack 
      // (R0-R15, SP, LCL, ARG, THIS, THAT, SCREEN, KBD)
      expect(entries.length).toBeGreaterThanOrEqual(23);
      
      // Check if a specific predefined one is in the array output
      const screenEntry = entries.find(e => e.symbol === 'SCREEN');
      expect(screenEntry).toEqual({ symbol: 'SCREEN', address: 16384 });
    });

    it('should include newly added user symbols in the returned array', () => {
      symbolTable.addEntry('myNewVar', 999);
      
      const entries = symbolTable.getEntries();
      const customEntry = entries.find(e => e.symbol === 'myNewVar');
      
      expect(customEntry).toEqual({ symbol: 'myNewVar', address: 999 });
    });
  });

});