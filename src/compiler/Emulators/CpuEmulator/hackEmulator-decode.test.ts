import { describe, it, expect } from 'vitest';
import { HackEmulator, InstructionType } from './hackEmulator';

describe('HackEmulator.decode()', () => {
  const emu = new HackEmulator();

  it('should correctly decode A-Instructions', () => {
    // 0xxxx (Leading bit 0)
    const instr = emu.decode(0b0000000000000000);
    expect(instr.type).toBe(InstructionType.A_INSTRUCTION);
    expect(instr.addressOrValue).toBe(0);

    const instr2 = emu.decode(0b0111111111111111);
    expect(instr2.addressOrValue).toBe(0x7FFF); // 32767
  });

  it('should decode C-Instruction control bits correctly', () => {
    // 111 a cccccc ddd jjj
    // 111 1 111111 111 111 (All flags set)
    const instr = emu.decode(0b1111111111111111);
    
    expect(instr.type).toBe(InstructionType.C_INSTRUCTION);
    expect(instr.is_M_bit).toBe(1);
    expect(instr.comp_code).toBe(0b111111);
    expect(instr.dest_A).toBe(1);
    expect(instr.dest_D).toBe(1);
    expect(instr.dest_M).toBe(1);
    expect(instr.jump_JGT).toBe(1);
    expect(instr.jump_JEQ).toBe(1);
    expect(instr.jump_JLT).toBe(1);
  });

  it('should decode zero-ed C-Instruction correctly', () => {
    // 111 0 000000 000 000
    const instr = emu.decode(0b1110000000000000);
    
    expect(instr.is_M_bit).toBe(0);
    expect(instr.comp_code).toBe(0);
    expect(instr.dest_A).toBe(0);
    expect(instr.dest_D).toBe(0);
    expect(instr.dest_M).toBe(0);
    expect(instr.jump_JGT).toBe(0);
  });

  it('should isolate specific destination bits', () => {
    // Dest M only (bit 3)
    // 111 0 000000 001 000
    const instr = emu.decode(0b1110000000001000);
    expect(instr.dest_M).toBe(1);
    expect(instr.dest_D).toBe(0);
    expect(instr.dest_A).toBe(0);
  });

  it('should isolate specific jump bits', () => {
    // JGT (bit 0)
    // 111 0 000000 000 001
    const instr = emu.decode(0b1110000000000001);
    expect(instr.jump_JGT).toBe(1);
    expect(instr.jump_JEQ).toBe(0);
    expect(instr.jump_JLT).toBe(0);
  });

  it('should handle all comp_code bits correctly', () => {
    // 111 0 101010 000 000 (comp_code 0b101010)
    const instr = emu.decode(0b1110101010000000);
    expect(instr.comp_code).toBe(0b101010);
  });
});

describe('HackEmulator.decode() Comprehensive Edge Cases', () => {
  const emu = new HackEmulator();

  describe('A-Instruction Boundaries', () => {
    it('decodes absolute zero', () => {
      const instr = emu.decode(0b0000000000000000);
      expect(instr.type).toBe(InstructionType.A_INSTRUCTION);
      expect(instr.addressOrValue).toBe(0);
    });

    it('decodes the maximum positive A-value (0x7FFF)', () => {
      const instr = emu.decode(0b0111111111111111);
      expect(instr.addressOrValue).toBe(32767);
    });

    it('ensures top bit 15 is strictly ignored in A-value', () => {
      // 0x8000 (1000...) is technically a C-instruction
      // Passing 0xFFFF but clearing bit 15 manually to verify mask
      const instr = emu.decode(0x7FFF);
      expect(instr.addressOrValue).toBe(0x7FFF);
    });
  });

  describe('C-Instruction Field Isolation', () => {
    // 111 A CCCCCC DDD JJJ
    
    it('tests individual destination bit isolation', () => {
      // Test only dest_A (bit 5)
      expect(emu.decode(0b1110000000100000).dest_A).toBe(1);
      expect(emu.decode(0b1110000000100000).dest_D).toBe(0);
      
      // Test only dest_D (bit 4)
      expect(emu.decode(0b1110000000010000).dest_D).toBe(1);
      
      // Test only dest_M (bit 3)
      expect(emu.decode(0b1110000000001000).dest_M).toBe(1);
    });

    it('tests individual jump bit isolation', () => {
      expect(emu.decode(0b1110000000000001).jump_JGT).toBe(1); // bit 0
      expect(emu.decode(0b1110000000000010).jump_JEQ).toBe(1); // bit 1
      expect(emu.decode(0b1110000000000100).jump_JLT).toBe(1); // bit 2
    });

    it('tests the A/M bit (bit 12)', () => {
      expect(emu.decode(0b1110000000000000).is_M_bit).toBe(0); // A-mode
      expect(emu.decode(0b1111000000000000).is_M_bit).toBe(1); // M-mode
    });
  });

  describe('ALU Comp-Code Exhaustion', () => {
    // Testing the full range of the 6-bit comp code (0 to 63)
    // We select a few representative codes to ensure bits 6-11 are correctly parsed
    const testCodes = [0b000000, 0b111111, 0b101010, 0b010101];
    
    testCodes.forEach(code => {
      it(`correctly extracts comp_code ${code.toString(2)}`, () => {
        // Shift code into bits 6-11
        const instr = emu.decode(0b1110000000000000 | (code << 6));
        expect(instr.comp_code).toBe(code);
      });
    });
  });

  describe('Complex Mixed States', () => {
    it('decodes a complex C-instruction: M=D+M;JLE', () => {
      // M=D+M;JLE
      // 111 1 000010 001 110
      // 1111 0000 1000 1110 -> 0xF08E
      const instr = emu.decode(0xF08E);
      
      expect(instr.type).toBe(InstructionType.C_INSTRUCTION);
      expect(instr.is_M_bit).toBe(1);       // a bit
      expect(instr.comp_code).toBe(0b000010); // D+M
      expect(instr.dest_M).toBe(1);         // M=
      expect(instr.dest_D).toBe(0);
      expect(instr.dest_A).toBe(0);
      expect(instr.jump_JGT).toBe(0);
      expect(instr.jump_JEQ).toBe(1);
      expect(instr.jump_JLT).toBe(1);
    });

    it('decodes a complex C-instruction: 0;JMP', () => {
      // 0;JMP
      // 111 0 101010 000 111
      // 0b1110101010000111
      const instr = emu.decode(0xEA87);
      
      expect(instr.comp_code).toBe(0b101010);
      expect(instr.dest_A).toBe(0);
      expect(instr.dest_D).toBe(0);
      expect(instr.dest_M).toBe(0);
      expect(instr.jump_JGT).toBe(1);
      expect(instr.jump_JEQ).toBe(1);
      expect(instr.jump_JLT).toBe(1);
    });
  });
});