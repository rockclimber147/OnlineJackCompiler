import { describe, it, expect } from 'vitest';
import { Parser, InstructionType } from './Parser';

describe('Hack Assembler Parser', () => {
  
  describe('cleanCode()', () => {
    it('should strip comments, whitespace, and track original line numbers', () => {
      const rawAsm = `
        // Initial setup
        @100  // Set A to 100
        D=A
        
        (LOOP) // Start of loop
      `;

      const result = Parser.cleanCode(rawAsm);

      expect(result).toHaveLength(3);
      
      // Line 3: @100
      expect(result[0].text).toBe('@100');
      expect(result[0].originalLine).toBe(3);

      // Line 4: D=A
      expect(result[1].text).toBe('D=A');
      expect(result[1].originalLine).toBe(4);

      // Line 6: (LOOP)
      expect(result[2].text).toBe('(LOOP)');
      expect(result[2].originalLine).toBe(6);
    });
  });

  describe('instructionType()', () => {
    it('should correctly identify A-Instructions', () => {
      expect(Parser.instructionType('@100')).toBe(InstructionType.A_INSTRUCTION);
      expect(Parser.instructionType('@LOOP')).toBe(InstructionType.A_INSTRUCTION);
    });

    it('should correctly identify L-Instructions', () => {
      expect(Parser.instructionType('(END)')).toBe(InstructionType.L_INSTRUCTION);
    });

    it('should correctly identify C-Instructions', () => {
      expect(Parser.instructionType('D=M+1;JMP')).toBe(InstructionType.C_INSTRUCTION);
      expect(Parser.instructionType('0;JMP')).toBe(InstructionType.C_INSTRUCTION);
    });
  });
});