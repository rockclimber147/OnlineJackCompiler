import { describe, it, expect } from 'vitest';
import { Parser, InstructionType } from './Parser';

describe('Hack Assembler Parser', () => {

  // ==========================================
  // 1. instructionType() Tests
  // ==========================================
  describe('instructionType()', () => {
    it('should identify A-instructions', () => {
      expect(Parser.instructionType('@100')).toBe(InstructionType.A_INSTRUCTION);
      expect(Parser.instructionType('@LOOP_START')).toBe(InstructionType.A_INSTRUCTION);
      expect(Parser.instructionType('@R0')).toBe(InstructionType.A_INSTRUCTION);
    });

    it('should identify L-instructions (Labels)', () => {
      expect(Parser.instructionType('(LOOP)')).toBe(InstructionType.L_INSTRUCTION);
      expect(Parser.instructionType('(END_1)')).toBe(InstructionType.L_INSTRUCTION);
    });

    it('should identify C-instructions', () => {
      expect(Parser.instructionType('D=M')).toBe(InstructionType.C_INSTRUCTION);
      expect(Parser.instructionType('0;JMP')).toBe(InstructionType.C_INSTRUCTION);
      expect(Parser.instructionType('MD=D+1;JLE')).toBe(InstructionType.C_INSTRUCTION);
    });
  });

  // ==========================================
  // 2. symbol() Tests
  // ==========================================
  describe('symbol()', () => {
    it('should extract literal numbers from A-instructions', () => {
      expect(Parser.symbol('@12345', InstructionType.A_INSTRUCTION)).toBe('12345');
    });

    it('should extract variable/label names from A-instructions', () => {
      expect(Parser.symbol('@my_var.1', InstructionType.A_INSTRUCTION)).toBe('my_var.1');
    });

    it('should extract label names from L-instructions', () => {
      expect(Parser.symbol('(MAIN_LOOP)', InstructionType.L_INSTRUCTION)).toBe('MAIN_LOOP');
    });

    it('should throw an error if called on a C-instruction', () => {
      // Wrap the function call in an anonymous function so Vitest can catch the thrown error
      expect(() => {
        Parser.symbol('D=M', InstructionType.C_INSTRUCTION);
      }).toThrow('symbol() only applies to A or L instructions.');
    });
  });

  // ==========================================
  // 3. C-Instruction Parts (dest, comp, jump)
  // ==========================================
  describe('C-Instruction Parsing', () => {
    
    describe('dest()', () => {
      it('should return the destination when present', () => {
        expect(Parser.dest('D=M')).toBe('D');
        expect(Parser.dest('AMD=D+A')).toBe('AMD');
      });

      it('should return "null" when destination is missing', () => {
        expect(Parser.dest('0;JMP')).toBe('null');
        expect(Parser.dest('D;JGT')).toBe('null');
      });
    });

    describe('comp()', () => {
      it('should return the computation for dest=comp formats', () => {
        expect(Parser.comp('D=M')).toBe('M');
        expect(Parser.comp('AM=M-1')).toBe('M-1');
      });

      it('should return the computation for comp;jump formats', () => {
        expect(Parser.comp('0;JMP')).toBe('0');
        expect(Parser.comp('D;JEQ')).toBe('D');
      });

      it('should return the computation for dest=comp;jump formats', () => {
        expect(Parser.comp('MD=D+1;JLE')).toBe('D+1');
      });
    });

    describe('jump()', () => {
      it('should return the jump mnemonic when present', () => {
        expect(Parser.jump('0;JMP')).toBe('JMP');
        expect(Parser.jump('D=D-1;JNE')).toBe('JNE');
      });

      it('should return "null" when jump is missing', () => {
        expect(Parser.jump('D=A')).toBe('null');
        expect(Parser.jump('M=D+M')).toBe('null');
      });
    });
  });

  // ==========================================
  // 4. cleanCode() Tests (Complex Scenarios)
  // ==========================================
  describe('cleanCode()', () => {
    it('should handle an empty string', () => {
      expect(Parser.cleanCode('')).toEqual([]);
    });

    it('should completely ignore blank lines and full-line comments', () => {
      const rawAsm = `
        // This is a comment
        
        // Another comment
      `;
      expect(Parser.cleanCode(rawAsm)).toEqual([]);
    });

    it('should strip inline comments and whitespace', () => {
      const rawAsm = `  @100   // Set i to 100  `;
      const result = Parser.cleanCode(rawAsm);
      
      expect(result).toHaveLength(1);
      expect(result[0].text).toBe('@100');
    });

    it('should accurately track original line numbers for error logging', () => {
      const rawAsm = `// Initialize
@10
D=A // D = 10

(LOOP)
@LOOP
0;JMP`;

      // Expected line mapping (1-based):
      // Line 1: // Initialize (Ignored)
      // Line 2: @10           (Kept)
      // Line 3: D=A // D = 10 (Kept)
      // Line 4:               (Ignored)
      // Line 5: (LOOP)        (Kept)
      // Line 6: @LOOP         (Kept)
      // Line 7: 0;JMP         (Kept)

      const result = Parser.cleanCode(rawAsm);

      expect(result).toHaveLength(5);

      expect(result[0]).toEqual({ text: '@10', originalLine: 2 });
      expect(result[1]).toEqual({ text: 'D=A', originalLine: 3 });
      expect(result[2]).toEqual({ text: '(LOOP)', originalLine: 5 });
      expect(result[3]).toEqual({ text: '@LOOP', originalLine: 6 });
      expect(result[4]).toEqual({ text: '0;JMP', originalLine: 7 });
    });
  });

});