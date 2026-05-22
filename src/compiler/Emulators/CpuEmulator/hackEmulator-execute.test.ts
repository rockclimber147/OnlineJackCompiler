import { describe, it, expect, beforeEach } from 'vitest';
import { HackEmulator, InstructionType } from './hackEmulator';

describe('HackEmulator.execute()', () => {
  let emu: HackEmulator;

  beforeEach(() => {
    emu = new HackEmulator();
    emu.reset();
  });

  describe('A-Instructions', () => {
    it('sets A register and increments PC', () => {
      emu.execute({ type: InstructionType.A_INSTRUCTION, addressOrValue: 123 });
      expect(emu.a_register).toBe(123);
      expect(emu.program_counter).toBe(1);
    });
  });

  describe('C-Instructions (ALU & Destination)', () => {
    it('executes D=A, storing in D register', () => {
      emu.a_register = 50;
      emu.execute({
        type: InstructionType.C_INSTRUCTION,
        is_M_bit: 0,
        comp_code: 0b110000, // A
        dest_D: 1,
        dest_A: 0,
        dest_M: 0
      });
      expect(emu.d_register).toBe(50);
      expect(emu.program_counter).toBe(1);
    });

    it('executes M=D+1, storing in RAM', () => {
      emu.a_register = 100; // Point to RAM[100]
      emu.d_register = 10;
      emu.execute({
        type: InstructionType.C_INSTRUCTION,
        is_M_bit: 0,
        comp_code: 0b011111, // D+1
        dest_D: 0,
        dest_A: 0,
        dest_M: 1
      });
      expect(emu.getRam(100)).toBe(11);
    });
  });

  describe('Jump Logic', () => {
    it('jumps (JMP) when condition is unconditional', () => {
      emu.a_register = 500;
      // We need a comp_code that results in 0 so we can test jump flags
      emu.execute({
        type: InstructionType.C_INSTRUCTION,
        is_M_bit: 0,
        comp_code: 0b101010, // 0
        jump_JGT: 1, jump_JEQ: 1, jump_JLT: 1, // JMP
        dest_D: 0, dest_A: 0, dest_M: 0
      });
      expect(emu.program_counter).toBe(500);
    });

    it('jumps JEQ when result is 0', () => {
      // 1. Setup State: A=5, D=5
      emu.a_register = 5; 
      emu.d_register = 5;
      emu.program_counter = 0;

      // 2. Execute exactly once
      emu.execute({
        type: InstructionType.C_INSTRUCTION,
        is_M_bit: 0,
        comp_code: 0b010011, // D - A
        jump_JGT: 0,
        jump_JEQ: 1, // We want this to jump
        jump_JLT: 0,
        dest_D: 0, 
        dest_A: 0, 
        dest_M: 0
      });

      // 3. Assert
      expect(emu.program_counter).toBe(5); // Should jump to A_register (5)
    });

    it('does not jump JGT when result is 0', () => {
      emu.a_register = 99;
      emu.d_register = 10;
      emu.execute({
        type: InstructionType.C_INSTRUCTION,
        is_M_bit: 0,
        comp_code: 0b101010, // 0
        jump_JGT: 1, // Jump if > 0
        dest_D: 0, dest_A: 0, dest_M: 0
      });
      expect(emu.program_counter).toBe(1); // Should not have jumped
    });
  });

  describe('HackEmulator.execute() - Robust Edge Cases', () => {
  let emu: HackEmulator;

  beforeEach(() => {
    emu = new HackEmulator();
    emu.reset();
  });

  describe('Multi-Destination Logic', () => {
    it('executes AM=M+1 (Multiple destinations)', () => {
      emu.a_register = 10;
      emu.setRam(10, 50); // RAM[10] = 50
      
      // AM = M + 1
      emu.execute({
        type: InstructionType.C_INSTRUCTION,
        is_M_bit: 1,         // Use M
        comp_code: 0b110111, // M + 1
        dest_A: 1,           // Write to A
        dest_M: 1,           // Write to M
        dest_D: 0,
      });

      expect(emu.getRam(10)).toBe(51); // M updated
      expect(emu.a_register).toBe(51);  // A updated
    });
  });

  describe('ALU Edge Cases', () => {
    it('handles negative results (Signed 16-bit)', () => {
      emu.d_register = 5;
      emu.a_register = 10;
      // D - A = 5 - 10 = -5
      emu.execute({
        type: InstructionType.C_INSTRUCTION,
        is_M_bit: 0,
        comp_code: 0b010011, // D - A
        dest_D: 1
      });
      expect(emu.d_register).toBe(-5);
    });

    it('handles wrapping/overflow (16-bit)', () => {
      // 0x7FFF is 32767. Adding 1 should wrap to -32768
      emu.d_register = 32767;
      emu.execute({
        type: InstructionType.C_INSTRUCTION,
        is_M_bit: 0,
        comp_code: 0b011111, // D + 1
        dest_D: 1
      });
      // (32767 + 1) << 16 >> 16 in JS results in -32768
      expect(emu.d_register).toBe(-32768);
    });
  });

  describe('Instruction Field Independence', () => {
    it('does not trigger jump if destination is set but condition is false', () => {
      emu.d_register = 5;
      // D=D;JGT (Jump if D > 0)
      emu.execute({
        type: InstructionType.C_INSTRUCTION,
        is_M_bit: 0,
        comp_code: 0b001100, // D
        dest_D: 1,
        jump_JGT: 0, jump_JEQ: 0, jump_JLT: 0 // NO JUMP
      });
      expect(emu.program_counter).toBe(1); // Should not have jumped
    });

    it('performs NO operation on destination if not specified', () => {
      emu.d_register = 100;
      emu.a_register = 200;
      // Comp without dest: 111 0 001100 000 000 (D)
      emu.execute({
        type: InstructionType.C_INSTRUCTION,
        is_M_bit: 0,
        comp_code: 0b001100, // D
        dest_A: 0, dest_D: 0, dest_M: 0
      });
      expect(emu.d_register).toBe(100); // D remains unchanged
      expect(emu.a_register).toBe(200); // A remains unchanged
    });
  });
});
});