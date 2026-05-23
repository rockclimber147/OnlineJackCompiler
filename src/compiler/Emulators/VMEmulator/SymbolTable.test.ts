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

  describe('Scope Ranges and PC Resolution', () => {
    it('correctly maps a Program Counter to the corresponding scope name', () => {
      symbolTable.registerScopeRange('Sys.init', 0);
      symbolTable.registerScopeRange('Main.main', 15);
      symbolTable.registerScopeRange('Math.multiply', 40);

      // PC within the first scope
      expect(symbolTable.getScopeFromPC(0)).toBe('Sys.init');
      expect(symbolTable.getScopeFromPC(14)).toBe('Sys.init');

      // PC exactly on the boundary of the second scope
      expect(symbolTable.getScopeFromPC(15)).toBe('Main.main');
      
      // PC deep within the second scope
      expect(symbolTable.getScopeFromPC(30)).toBe('Main.main');

      // PC in the last scope and beyond
      expect(symbolTable.getScopeFromPC(40)).toBe('Math.multiply');
      expect(symbolTable.getScopeFromPC(1000)).toBe('Math.multiply');
    });

    it('sorts scope ranges correctly even if registered out of order', () => {
      // Register in mixed order
      symbolTable.registerScopeRange('Math.multiply', 40);
      symbolTable.registerScopeRange('Sys.init', 0);
      symbolTable.registerScopeRange('Main.main', 15);

      expect(symbolTable.getScopeFromPC(10)).toBe('Sys.init');
      expect(symbolTable.getScopeFromPC(20)).toBe('Main.main');
      expect(symbolTable.getScopeFromPC(50)).toBe('Math.multiply');
    });

    it('returns empty string if no ranges are registered', () => {
      expect(symbolTable.getScopeFromPC(10)).toBe('');
    });
  });

  describe('Labels (Function Scope)', () => {
    it('resolves labels based on the current PC scope context', () => {
      // Setup scopes
      symbolTable.registerScopeRange('Main.main', 0);
      symbolTable.registerScopeRange('Math.multiply', 50);

      // Add labels with the SAME name but in different scopes
      symbolTable.addLabel('Main.main', 'LOOP', 12);
      symbolTable.addLabel('Math.multiply', 'LOOP', 65);

      // If PC is 5, we are in Main.main, so LOOP should resolve to 12
      expect(symbolTable.getAddressFromLabel(5, 'LOOP')).toBe(12);

      // If PC is 55, we are in Math.multiply, so LOOP should resolve to 65
      expect(symbolTable.getAddressFromLabel(55, 'LOOP')).toBe(65);
    });

    it('throws an error if the label does not exist in the current scope', () => {
      symbolTable.registerScopeRange('Main.main', 0);
      symbolTable.addLabel('Main.main', 'START', 10);

      expect(() => symbolTable.getAddressFromLabel(5, 'MISSING_LABEL')).toThrowError('Label not found: MISSING_LABEL in scope: Main.main');
    });
  });

  describe('clear()', () => {
    it('wipes all stored data', () => {
      symbolTable.addFunction('Sys.init', 0, 0);
      symbolTable.registerScopeRange('Main.main', 0);
      symbolTable.addLabel('Main.main', 'LOOP', 5);

      symbolTable.clear();

      expect(() => symbolTable.getFunctionAddress('Sys.init')).toThrow();
      expect(() => symbolTable.getAddressFromLabel(0, 'LOOP')).toThrow();
      expect(symbolTable.getScopeFromPC(0)).toBe('');
    });
  });
});