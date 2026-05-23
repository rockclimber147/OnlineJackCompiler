import { describe, it, expect, beforeEach } from 'vitest';
import { VMEmulator } from './VMEmulator';
import { type VirtualFile } from '../../../types/Vfs';

import BasicTestRaw from '../test/Project7/MemoryAccess/BasicTest/BasicTest.vm?raw';
import PointerTestRaw from '../test/Project7/MemoryAccess/PointerTest/PointerTest.vm?raw';
import StaticTestRaw from '../test/Project7/MemoryAccess/StaticTest/StaticTest.vm?raw';

describe('VM Emulator Integration Tests (Project 7)', () => {
  let emu: VMEmulator;

  beforeEach(() => {
    emu = new VMEmulator();
  });

  const runIntegrationTest = (
    files: VirtualFile[],
    setup: (e: VMEmulator) => void,
    cycles: number
  ) => {
    emu.loadProgram(files);
    setup(emu);

    for (let i = 0; i < cycles; i++) {
      emu.executeNextInstruction();
    }
  };

  it('runs Project7/MemoryAccess/BasicTest Test Case', () => {
    const basicTestFile: VirtualFile = {
      id: 'BasicTest',
      name: 'BasicTest.vm',
      language: 'vm',
      content: BasicTestRaw
    };

    runIntegrationTest([basicTestFile], (e) => {
      e.poke(0, 256);
      e.poke(1, 300);
      e.poke(2, 400);
      e.poke(3, 3000);
      e.poke(4, 3010);
    }, 600);

    expect(emu.peek(256)).toBe(472);
    expect(emu.peek(300)).toBe(10);
    expect(emu.peek(401)).toBe(21);
    expect(emu.peek(402)).toBe(22);
    expect(emu.peek(3006)).toBe(36);
    expect(emu.peek(3012)).toBe(42);
    expect(emu.peek(3015)).toBe(45);
    expect(emu.peek(11)).toBe(510);
  });

  it('runs Project7/MemoryAccess/PointerTest Test Case', () => {
    const pointerTestFile: VirtualFile = {
      id: 'PointerTest',
      name: 'PointerTest.vm',
      language: 'vm',
      content: PointerTestRaw
    };

    runIntegrationTest([pointerTestFile], (e) => {
      e.poke(0, 256);
    }, 450);

    expect(emu.peek(256)).toBe(6084);
    expect(emu.peek(3)).toBe(3030);
    expect(emu.peek(4)).toBe(3040);
    expect(emu.peek(3032)).toBe(32);
    expect(emu.peek(3046)).toBe(46);
  });

  it('runs Project7/MemoryAccess/StaticTest Test Case', () => {
    const staticTestFile: VirtualFile = {
      id: 'StaticTest',
      name: 'StaticTest.vm',
      language: 'vm',
      content: StaticTestRaw
    };

    runIntegrationTest([staticTestFile], (e) => {
      e.poke(0, 256);
    }, 200);

    expect(emu.peek(256)).toBe(1110);
  });
});