import { describe, it, expect, beforeEach } from 'vitest';
import { VMEmulator } from './VMEmulator';
import { type VirtualFile } from '../../../types/Vfs';

describe('VMEmulator', () => {
  let emu: VMEmulator;

  beforeEach(() => {
    emu = new VMEmulator();
  });

  // Helper to load and run a snippet of VM code
  const runCode = (code: string, cycles: number) => {
    const file: VirtualFile = {
      id: '1',
      name: 'Test.vm',
      language: 'vm',
      content: code
    };
    emu.loadProgram([file]);
    for (let i = 0; i < cycles; i++) {
      emu.executeNextInstruction();
    }
  };

  describe('Stack Arithmetic', () => {
    it('pushes constants and adds them correctly', () => {
      runCode(`
        push constant 7
        push constant 8
        add
      `, 3);

      // Stack pointer should be at 257 (256 + 1 element)
      expect(emu.peek(0)).toBe(257);
      // Top of stack should be 15
      expect(emu.peek(256)).toBe(15);
    });

    it('handles subtraction and unary negation', () => {
      runCode(`
        push constant 10
        push constant 15
        sub
        neg
      `, 4); // 10 - 15 = -5, neg(-5) = 5

      expect(emu.peekStack()).toBe(5);
    });

    it('evaluates logical commands (eq, gt, lt)', () => {
      runCode(`
        push constant 10
        push constant 10
        eq
        push constant 10
        push constant 5
        gt
        push constant 5
        push constant 10
        lt
      `, 9);

      // eq -> true (-1)
      // gt -> true (-1)
      // lt -> true (-1)
      expect(emu.peek(256)).toBe(-1); 
      expect(emu.peek(257)).toBe(-1);
      expect(emu.peek(258)).toBe(-1);
      expect(emu.peek(0)).toBe(259); // SP
    });
  });

  describe('Memory Segments', () => {
    it('pushes and pops to the local segment', () => {
      // Set LCL base pointer to 300
      emu.poke(1, 300); 

      runCode(`
        push constant 42
        pop local 2
        push local 2
      `, 3);

      // The value 42 should be stored at RAM[300 + 2]
      expect(emu.peek(302)).toBe(42);
      // It should also be pushed back onto the stack
      expect(emu.peekStack()).toBe(42);
    });

    it('pushes and pops to the temp segment', () => {
      // TEMP segment is fixed at base address 5
      runCode(`
        push constant 99
        pop temp 3
      `, 2);

      // RAM[5 + 3]
      expect(emu.peek(8)).toBe(99);
    });

    it('pushes and pops to the pointer segment (THIS/THAT)', () => {
      runCode(`
        push constant 3030
        pop pointer 0
        push constant 4040
        pop pointer 1
      `, 4);

      // pointer 0 maps to THIS (RAM[3])
      expect(emu.peek(3)).toBe(3030);
      // pointer 1 maps to THAT (RAM[4])
      expect(emu.peek(4)).toBe(4040);
    });
    
    it('throws an error if popping into a constant', () => {
      const file: VirtualFile = {
        id: '1',
        name: 'Error.vm',
        language: 'vm',
        content: `
          push constant 10
          pop constant 5
        `
      };
      
      emu.loadProgram([file]);
      emu.executeNextInstruction(); // execute push
      
      expect(() => emu.executeNextInstruction()).toThrow("Cannot pop into constant segment");
    });
  });
});