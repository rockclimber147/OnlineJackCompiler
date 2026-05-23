import { describe, it, expect, beforeEach } from 'vitest';
import { VMEmulator } from './VMEmulator';
import type { VirtualFile } from '../../../types/Vfs';

describe('Program Flow (Branching)', () => {
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

    it('executes unconditional goto and skips instructions', () => {
      // 1. push 10
      // 2. goto SKIP
      // 3. push 20 (Skipped)
      // 4. push 30 (Executed)
      runCode(`
        push constant 10
        goto SKIP
        push constant 20
        label SKIP
        push constant 30
      `, 3);

      // Stack should contain 10, then 30. (20 was skipped)
      expect(emu.peek(0)).toBe(258); // SP moved by 2
      expect(emu.peek(256)).toBe(10);
      expect(emu.peek(257)).toBe(30);
    });

    it('jumps on if-goto when condition is true (non-zero)', () => {
      // 1. push 0
      // 2. not (-1, which is true)
      // 3. if-goto JUMP (pops the true, jumps to JUMP)
      // 4. push 99 (Skipped)
      // 5. push 42 (Executed)
      runCode(`
        push constant 0
        not
        if-goto JUMP
        push constant 99
        label JUMP
        push constant 42
      `, 4);

      // Stack should only contain 42 (the condition was popped)
      expect(emu.peek(0)).toBe(257); // SP moved by 1
      expect(emu.peek(256)).toBe(42);
    });

    it('does not jump on if-goto when condition is false (zero)', () => {
      // 1. push 0 (false)
      // 2. if-goto JUMP (pops the false, does NOT jump)
      // 3. push 99 (Executed)
      runCode(`
        push constant 0
        if-goto JUMP
        push constant 99
        label JUMP
      `, 3);

      // Stack should only contain 99
      expect(emu.peek(0)).toBe(257); // SP moved by 1
      expect(emu.peek(256)).toBe(99);
    });
  });