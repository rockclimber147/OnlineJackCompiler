import { describe, it, expect, beforeEach } from 'vitest';
import { VMEmulator } from './VMEmulator';
import { type VirtualFile } from '../../../types/Vfs';

import BasicTestRaw from '../test/Project7/MemoryAccess/BasicTest/BasicTest.vm?raw';
import PointerTestRaw from '../test/Project7/MemoryAccess/PointerTest/PointerTest.vm?raw';
import StaticTestRaw from '../test/Project7/MemoryAccess/StaticTest/StaticTest.vm?raw';

import SimpleAddRaw from '../test/Project7/StackArithmetic/SimpleAdd/SimpleAdd.vm?raw';
import StackTestRaw from '../test/Project7/StackArithmetic/StackTest/StackTest.vm?raw';

import FibonacciMain from '../test/Project8/Function Calls/FibonacciElement/Main.vm?raw';
import FibonacciSys from '../test/Project8/Function Calls/FibonacciElement/Sys.vm?raw';

import NestedCallRaw from '../test/Project8/Function Calls/NestedCall/Sys.hack?raw';
import SimpleFunctionRaw from '../test/Project8/Function Calls/SimpleFunction/SimpleFunction.hack?raw';
import StaticsTestRaw from '../test/Project8/Function Calls/StaticsTest/StaticsTest.hack?raw';

import BasicLoopRaw from '../test/Project8/Program Flow/BasicLoop/BasicLoop.vm?raw';
import FibonacciSeriesRaw from '../test/Project8/Program Flow/FibonacciSeries/FibonacciSeries.vm?raw';


describe('VM Emulator Integration Tests - Project 7', () => {
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

  it('runs Project7/StackArithmetic/SimpleAdd Test Case', () => {
    const simpleAddFile: VirtualFile = {
      id: 'SimpleAdd',
      name: 'SimpleAdd.vm',
      language: 'vm',
      content: SimpleAddRaw
    };

    runIntegrationTest([simpleAddFile], (e) => {
      e.poke(0, 256);
    }, 600);

    expect(emu.peek(0)).toBe(257);
    expect(emu.peek(256)).toBe(15);
  });

  it('runs Project7/StackArithmetic/StackTest Test Case', () => {
    const stackTestFile: VirtualFile = {
      id: 'StackTest',
      name: 'StackTest.vm',
      language: 'vm',
      content: StackTestRaw
    };

    runIntegrationTest([stackTestFile], (e) => {
      e.poke(0, 256);
    }, 600);

    expect(emu.peek(0)).toBe(266);
    expect(emu.peek(256)).toBe(-1);
    expect(emu.peek(257)).toBe(0);
    expect(emu.peek(258)).toBe(0);
    expect(emu.peek(259)).toBe(0);
    expect(emu.peek(260)).toBe(-1);
    expect(emu.peek(261)).toBe(0);
    expect(emu.peek(262)).toBe(-1);
    expect(emu.peek(263)).toBe(0);
    expect(emu.peek(264)).toBe(0);
    expect(emu.peek(265)).toBe(-91);
  }); 
});

describe('VM Emulator Integration Tests - Project 8', () => {
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

  it('runs Project8/Function Calls/FibonacciElement Test Case', () => {
    // Inject the bootstrap call so the VM starts by executing Sys.init
    const bootstrapFile: VirtualFile = {
      id: 'Bootstrap',
      name: 'Bootstrap.vm',
      language: 'vm',
      content: 'call Sys.init 0'
    };
    
    const mainFile: VirtualFile = {
      id: 'FibonacciMain',
      name: 'Main.vm',
      language: 'vm',
      content: FibonacciMain
    };

    const sysFile: VirtualFile = {
      id: 'FibonacciSys',
      name: 'Sys.vm',
      language: 'vm',
      content: FibonacciSys
    };

    runIntegrationTest([bootstrapFile, mainFile, sysFile], (e) => {
      // Start SP at 256. The bootstrap 'call' will push 5 values, leaving SP at 261 
      // exactly as the official .tst file expects before entering Sys.init.
      e.poke(0, 256); 
    }, 111); // 110 cycles (from the .tst file) + 1 cycle for our manual bootstrap call

    expect(emu.peek(0)).toBe(262);
    expect(emu.peek(261)).toBe(3);
  });
  
  it('runs Project8/Program Flow/BasicLoop Test Case', () => {
    const basicLoopFile: VirtualFile = {
      id: 'BasicLoop',
      name: 'BasicLoop.vm',
      language: 'vm',
      content: BasicLoopRaw
    };

    runIntegrationTest([basicLoopFile], (e) => {
      e.poke(0, 256);
      e.poke(1, 300);
      e.poke(2, 400);
      e.poke(400, 3);
    }, 600);

    expect(emu.peek(0)).toBe(257);
    expect(emu.peek(256)).toBe(6);
  });

  it('runs Project8/Program Flow/FibonacciSeries Test Case', () => {
    const fibonacciSeriesFile: VirtualFile = {
      id: 'FibonacciSeries',
      name: 'FibonacciSeries.vm',
      language: 'vm',
      content: FibonacciSeriesRaw
    };

    runIntegrationTest([fibonacciSeriesFile], (e) => {
      e.poke(0, 256);
      e.poke(1, 300);
      e.poke(2, 400);
      e.poke(400, 6);
      e.poke(401, 3000);
    }, 1100);

    expect(emu.peek(3000)).toBe(0);
    expect(emu.peek(3001)).toBe(1);
    expect(emu.peek(3002)).toBe(1);
    expect(emu.peek(3003)).toBe(2);
    expect(emu.peek(3004)).toBe(3);
    expect(emu.peek(3005)).toBe(5);
  });
});