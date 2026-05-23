import { describe, it, expect, beforeEach } from 'vitest';
import { VMEmulator } from './VMEmulator';
import { type VirtualFile } from '../../../types/Vfs';

import BasicTestRaw from '../test/Project7/MemoryAccess/BasicTest/BasicTest.vm?raw';
import PointerTestRaw from '../test/Project7/MemoryAccess/PointerTest/PointerTest.vm?raw';
import StaticTestRaw from '../test/Project7/MemoryAccess/StaticTest/StaticTest.vm?raw';

import SimpleAddRaw from '../test/Project7/StackArithmetic/SimpleAdd/SimpleAdd.vm?raw';
import StackTestRaw from '../test/Project7/StackArithmetic/StackTest/StackTest.vm?raw';

import FibonacciMainRaw from '../test/Project8/Function Calls/FibonacciElement/Main.vm?raw';
import FibonacciSysRaw from '../test/Project8/Function Calls/FibonacciElement/Sys.vm?raw';

import NestedCallRaw from '../test/Project8/Function Calls/NestedCall/Sys.vm?raw';
import SimpleFunctionRaw from '../test/Project8/Function Calls/SimpleFunction/SimpleFunction.vm?raw';

import StaticsTestSysRaw from '../test/Project8/Function Calls/StaticsTest/Sys.vm?raw';
import StaticsTestClass1Raw from '../test/Project8/Function Calls/StaticsTest/Class1.vm?raw';
import StaticsTestClass2Raw from '../test/Project8/Function Calls/StaticsTest/Class2.vm?raw';

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
    cycles: number,
    skipBootstrap: boolean = false
  ) => {
    emu.loadProgram(files, skipBootstrap);
    setup(emu);

    for (let i = 0; i < cycles; i++) {
      emu.executeNextInstruction();
    }
  };

  it('runs Project8/Function Calls/FibonacciElement Test Case', () => {
    const mainFile: VirtualFile = {
      id: 'FibonacciMain',
      name: 'Main.vm',
      language: 'vm',
      content: FibonacciMainRaw
    };

    const sysFile: VirtualFile = {
      id: 'FibonacciSys',
      name: 'Sys.vm',
      language: 'vm',
      content: FibonacciSysRaw
    };

    runIntegrationTest([mainFile, sysFile], (_) => {
    }, 111); // 110 cycles (from the .tst file) + 1 cycle for our manual bootstrap call

    expect(emu.peek(0)).toBe(262);
    expect(emu.peek(261)).toBe(3);
  });

  it('runs Project8/Function Calls/NestedCall Test Case', () => {
    const nestedCallFile: VirtualFile = {
      id: 'NestedCall',
      name: 'Sys.vm',
      language: 'vm',
      content: NestedCallRaw
    };

    runIntegrationTest([nestedCallFile], (e) => {
      // Base pointers
      e.poke(0, 261); // SP
      e.poke(1, 261); // LCL
      e.poke(2, 256); // ARG
      e.poke(3, -3);  // THIS
      e.poke(4, -4);  // THAT
      
      // Temp variables testing
      e.poke(5, -1);
      e.poke(6, -1);

      // Fake stack frame from call Sys.init
      e.poke(256, 1234);
      e.poke(257, -1);
      e.poke(258, -2);
      e.poke(259, -3);
      e.poke(260, -4);

      // Initialize stack to -1 to check for local segment being cleared to zero.
      for (let i = 261; i <= 299; i++) {
        e.poke(i, -1);
      }
    }, 50, true);

    // Exact memory verifications from NestedCall.cmp
    expect(emu.peek(0)).toBe(261);
    expect(emu.peek(1)).toBe(261);
    expect(emu.peek(2)).toBe(256);
    expect(emu.peek(3)).toBe(4000);
    expect(emu.peek(4)).toBe(5000);
    expect(emu.peek(5)).toBe(135);
    expect(emu.peek(6)).toBe(246);
  });
  
  it('runs Project8/Function Calls/SimpleFunction Test Case', () => {
    const simpleFunctionFile: VirtualFile = {
      id: 'SimpleFunction',
      name: 'SimpleFunction.vm',
      language: 'vm',
      content: SimpleFunctionRaw
    };

    runIntegrationTest([simpleFunctionFile], (e) => {
      // Base pointers
      e.poke(0, 317);  // SP
      e.poke(1, 317);  // LCL
      e.poke(2, 310);  // ARG
      e.poke(3, 3000); // THIS
      e.poke(4, 4000); // THAT

      // Setup the arguments (and the fake caller frame) relative to the ARG pointer
      e.poke(310, 1234); // argument[0]
      e.poke(311, 37);   // argument[1]
      e.poke(312, 9);    // argument[2]
      e.poke(313, 305);  // argument[3] (fake saved LCL)
      e.poke(314, 300);  // argument[4] (fake saved ARG)
      e.poke(315, 3010); // argument[5] (fake saved THIS)
      e.poke(316, 4010); // argument[6] (fake saved THAT)
    }, 10);

    // Exact memory verifications from SimpleFunction.cmp
    expect(emu.peek(0)).toBe(311);   // SP
    expect(emu.peek(1)).toBe(305);   // LCL
    expect(emu.peek(2)).toBe(300);   // ARG
    expect(emu.peek(3)).toBe(3010);  // THIS
    expect(emu.peek(4)).toBe(4010);  // THAT
    expect(emu.peek(310)).toBe(1196); // Return value
  });

  it('runs Project8/Function Calls/StaticsTest Test Case', () => {
    const sysFile: VirtualFile = {
      id: 'StaticsTestSys',
      name: 'Sys.vm',
      language: 'vm',
      content: StaticsTestSysRaw
    };

    const class1File: VirtualFile = {
      id: 'StaticsTestClass1',
      name: 'Class1.vm',
      language: 'vm',
      content: StaticsTestClass1Raw
    };

    const class2File: VirtualFile = {
      id: 'StaticsTestClass2',
      name: 'Class2.vm',
      language: 'vm',
      content: StaticsTestClass2Raw
    };

    runIntegrationTest([sysFile, class1File, class2File], (_) => {
    }, 37); // 36 cycles (from .tst file) + 1 cycle for our bootstrap call

    // Exact memory verifications from StaticsTest.cmp
    expect(emu.peek(0)).toBe(263);
    expect(emu.peek(261)).toBe(-2);
    expect(emu.peek(262)).toBe(8);
  });

  it('runs Project8/Function Calls/StaticsTest Test Case (Catenated Files)', () => {
    // Combine all contents into a single massive string, separated by newlines
    const catenatedContent = [
      StaticsTestSysRaw, 
      StaticsTestClass1Raw, 
      StaticsTestClass2Raw
    ].join('\n');

    const catenatedFile: VirtualFile = {
      id: 'StaticsTestCatenated',
      name: 'StaticsTestCatenated.vm',
      language: 'vm',
      content: catenatedContent
    };

    runIntegrationTest([catenatedFile], (_) => {
    }, 37); // 36 cycles (from .tst file) + 1 cycle for our bootstrap call

    // Exact memory verifications from StaticsTest.cmp
    expect(emu.peek(0)).toBe(263);
    expect(emu.peek(261)).toBe(-2);
    expect(emu.peek(262)).toBe(8);
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