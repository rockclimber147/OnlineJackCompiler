import { describe, it, expect, beforeEach } from 'vitest';
import { Assembler } from './Assembler';

describe('Hack Assembler Engine', () => {
  let assembler: Assembler;

  beforeEach(() => {
    // Instantiate a fresh assembler before every test so the SymbolTable is clean
    assembler = new Assembler();
  });

  // ==========================================
  // 1. Basic Symbol-less Assembly
  // ==========================================
  describe('Literal Values and C-Instructions', () => {
    it('should assemble literal A-instructions correctly', () => {
      const source = `
        @2
        @7
      `;
      const result = assembler.assemble(source);

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.binary).toHaveLength(2);
      
      // @2 -> 0000000000000010
      expect(result.binary[0]).toBe('0000000000000010');
      // @7 -> 0000000000000111
      expect(result.binary[1]).toBe('0000000000000111');
    });

    it('should assemble basic C-instructions correctly', () => {
      const source = `
        D=A
        0;JMP
      `;
      const result = assembler.assemble(source);

      expect(result.success).toBe(true);
      expect(result.binary).toHaveLength(2);

      // D=A   -> 111 0110000 010 000
      expect(result.binary[0]).toBe('1110110000010000');
      // 0;JMP -> 111 0101010 000 111
      expect(result.binary[1]).toBe('1110101010000111');
    });
  });

  // ==========================================
  // 2. Predefined Symbols
  // ==========================================
  describe('Predefined Symbol Handling', () => {
    it('should correctly map predefined registers', () => {
      const source = `
        @R0
        @SCREEN
      `;
      const result = assembler.assemble(source);

      expect(result.success).toBe(true);
      // @R0 -> 0
      expect(result.binary[0]).toBe('0000000000000000');
      // @SCREEN -> 16384 -> 0100000000000000
      expect(result.binary[1]).toBe('0100000000000000');
    });
  });

  // ==========================================
  // 3. Variable Allocation (RAM)
  // ==========================================
  describe('Variable Allocation (Pass 2)', () => {
    it('should assign new variables to RAM starting at address 16', () => {
      const source = `
        @i
        M=1
        @sum
        M=D
      `;
      const result = assembler.assemble(source);

      expect(result.success).toBe(true);
      
      // @i should be assigned to 16
      expect(result.binary[0]).toBe('0000000000010000'); 
      
      // @sum should be assigned to 17
      expect(result.binary[2]).toBe('0000000000010001'); 
    });

    it('should reuse the same address for previously declared variables', () => {
      const source = `
        @counter
        M=1
        @counter
        D=M
      `;
      const result = assembler.assemble(source);

      expect(result.success).toBe(true);
      // Both @counter calls should point to address 16
      expect(result.binary[0]).toBe('0000000000010000');
      expect(result.binary[2]).toBe('0000000000010000');
    });
  });

  // ==========================================
  // 4. Label Resolution (ROM)
  // ==========================================
  describe('Label Mapping (Pass 1 & Pass 2)', () => {
    it('should map forward and backward label references correctly without taking up ROM space', () => {
      const source = `
        @FORWARD
        0;JMP
        (BACKWARD)
        D=0
        (FORWARD)
        @BACKWARD
        0;JMP
      `;
      const result = assembler.assemble(source);

      expect(result.success).toBe(true);
      
      // The labels should NOT generate binary lines themselves
      expect(result.binary).toHaveLength(5); 

      // Line 1: @FORWARD -> (FORWARD) points to instruction index 3
      expect(result.binary[0]).toBe('0000000000000011');
      
      // Line 4: @BACKWARD -> (BACKWARD) points to instruction index 2
      expect(result.binary[3]).toBe('0000000000000010');
    });
  });

  // ==========================================
  // 5. Error Handling & Edge Cases
  // ==========================================
  describe('Error Handling', () => {
    it('should fail elegantly with an invalid computation mnemonic', () => {
      const source = `
        @10
        D=INVALID_COMP
      `;
      const result = assembler.assemble(source);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
    });

    it('should trigger the Strict Label Heuristic for uppercase undefined labels', () => {
      const source = `
        @2
        D=A
        @TYPO_LABEL
        0;JMP
      `;
      const result = assembler.assemble(source);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      
      // It should NOT have allocated @TYPO_LABEL to the symbol table as a variable
      expect(assembler.symbolTable.contains('TYPO_LABEL')).toBe(false);
    });

    it('should recover and report multiple errors in a single pass', () => {
      const source = `
        @UNDEFINED_1
        D=BAD
        @UNDEFINED_2
      `;
      const result = assembler.assemble(source);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(3); // Expecting 3 distinct errors
    });
  });

  // ==========================================
  // 6. Full Program Integration Test
  // ==========================================
  describe('Full Program Compilation', () => {
    it('should correctly compile a standard Multiplier program (Add.asm)', () => {
      // Computes R2 = R0 + R1
      const source = `
        // Add two numbers
        @R0
        D=M
        @R1
        D=D+M
        @R2
        M=D
        (END)
        @END
        0;JMP
      `;
      
      const result = assembler.assemble(source);

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.binary).toEqual([
        '0000000000000000', // @R0
        '1111110000010000', // D=M
        '0000000000000001', // @R1
        '1111000010010000', // D=D+M
        '0000000000000010', // @R2
        '1110001100001000', // M=D
        '0000000000000110', // @END (Points to ROM address 6)
        '1110101010000111', // 0;JMP
      ]);
    });
  });

});