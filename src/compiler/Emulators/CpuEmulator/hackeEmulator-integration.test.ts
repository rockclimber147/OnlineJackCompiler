import { describe, it, expect } from 'vitest';
import { HackEmulator } from './hackEmulator';

import BasicTestRaw from '../test/Project7/MemoryAccess/BasicTest/BasicTest.hack?raw';
import PointerTestRaw from '../test/Project7/MemoryAccess/PointerTest/PointerTest.hack?raw';
import StaticTestRaw from '../test/Project7/MemoryAccess/StaticTest/StaticTest.hack?raw';

import SimpleAddRaw from '../test/Project7/StackArithmetic/SimpleAdd/SimpleAdd.hack?raw';
import StackTestRaw from '../test/Project7/StackArithmetic/StackTest/StackTest.hack?raw';

import FibonacciRaw from '../test/Project8/Function Calls/FibonacciElement/FibonacciElement.hack?raw';
import NestedCallRaw from '../test/Project8/Function Calls/NestedCall/Sys.hack?raw';
import SimpleFunctionRaw from '../test/Project8/Function Calls/SimpleFunction/SimpleFunction.hack?raw';
import StaticsTestRaw from '../test/Project8/Function Calls/StaticsTest/StaticsTest.hack?raw';

import BasicLoopRaw from '../test/Project8/Program Flow/BasicLoop/BasicLoop.hack?raw';
import FibonacciSeriesRaw from '../test/Project8/Program Flow/FibonacciSeries/FibonacciSeries.hack?raw';

export function parseHackFile(fileContent: string): number[] {
  return fileContent
    .split(/\r?\n/)          // Split by line
    .map(line => line.trim())
    .filter(line => line.length > 0) // Remove empty lines
    .map(line => parseInt(line, 2)); // Convert binary string to number
}

describe('Hack Emulator Integration Tests - Project 7', () => {
  it('runs Project7/MemoryAccess/BasicTest', () => {
    const emu = new HackEmulator();
    
    // Parse the raw string into numeric instructions
    const commands = parseHackFile(BasicTestRaw);
    emu.loadProgram(commands);

    // Set initial memory state
    emu.setRam(0, 256);
    emu.setRam(1, 300);
    emu.setRam(2, 400);
    emu.setRam(3, 3000);
    emu.setRam(4, 3010);

    // Run the loop (600 instructions as per your C++ test)
    for (let i = 0; i < 600; i++) {
      emu.executeNextInstruction();
    }

    // Assertions
    expect(emu.getRam(256)).toBe(472);
    expect(emu.getRam(300)).toBe(10);
    expect(emu.getRam(401)).toBe(21);
    expect(emu.getRam(402)).toBe(22);
    expect(emu.getRam(3006)).toBe(36);
    expect(emu.getRam(3012)).toBe(42);
    expect(emu.getRam(3015)).toBe(45);
    expect(emu.getRam(11)).toBe(510);
  });

  it('runs Project7/MemoryAccess/PointerTest', () => {
    const emu = new HackEmulator();
    const commands = parseHackFile(PointerTestRaw);
    emu.loadProgram(commands);

    emu.setRam(0, 256);

    for (let i = 0; i < 450; i++) {
      emu.executeNextInstruction();
    }

    expect(emu.getRam(256)).toBe(6084);
    expect(emu.getRam(3)).toBe(3030);
    expect(emu.getRam(4)).toBe(3040);
    expect(emu.getRam(3032)).toBe(32);
    expect(emu.getRam(3046)).toBe(46);
  });

  it('runs Project7/MemoryAccess/StaticTest', () => {
    const emu = new HackEmulator();
    const commands = parseHackFile(StaticTestRaw);
    emu.loadProgram(commands);

    emu.setRam(0, 256);

    for (let i = 0; i < 200; i++) {
      emu.executeNextInstruction();
    }

    expect(emu.getRam(256)).toBe(1110);
  });

  it('runs Project7/StackArithmetic/SimpleAdd', () => {
    const emu = new HackEmulator();
    const commands = parseHackFile(SimpleAddRaw);
    emu.loadProgram(commands);

    emu.setRam(0, 256);

    for (let i = 0; i < 600; i++) {
      emu.executeNextInstruction();
    }

    expect(emu.getRam(0)).toBe(257);
    expect(emu.getRam(256)).toBe(15);
  });

  it('runs Project7/StackArithmetic/StackTest', () => {
    const emu = new HackEmulator();
    const commands = parseHackFile(StackTestRaw);
    emu.loadProgram(commands);

    emu.setRam(0, 256);

    for (let i = 0; i < 600; i++) {
      emu.executeNextInstruction();
    }

    expect(emu.getRam(0)).toBe(266);
    expect(emu.getRam(256)).toBe(-1);
    expect(emu.getRam(257)).toBe(0);
    expect(emu.getRam(258)).toBe(0);
    expect(emu.getRam(259)).toBe(0);
    expect(emu.getRam(260)).toBe(-1);
    expect(emu.getRam(261)).toBe(0);
    expect(emu.getRam(262)).toBe(-1);
    expect(emu.getRam(263)).toBe(0);
    expect(emu.getRam(264)).toBe(0);
    expect(emu.getRam(265)).toBe(-91);
  });
});

describe('Hack Emulator Integration Tests - Project 8', () => {
  it('runs Project8/FunctionCalls/FibonacciElement', () => {
    const emu = new HackEmulator();
    const commands = parseHackFile(FibonacciRaw);
    emu.loadProgram(commands);

    for (let i = 0; i < 6000; i++) {
      emu.executeNextInstruction();
    }

    expect(emu.getRam(0)).toBe(262);
    expect(emu.getRam(261)).toBe(3);
  });

  it('runs Project8/FunctionCalls/NestedCall', () => {
    const emu = new HackEmulator();
    const commands = parseHackFile(NestedCallRaw);
    emu.loadProgram(commands);

    // Initial State Setup
    emu.setRam(0, 261); // SP
    emu.setRam(1, 261); // LCL
    emu.setRam(2, 256); // ARG
    emu.setRam(3, -3);  // THIS
    emu.setRam(4, -4);  // THAT

    emu.setRam(5, -1);
    emu.setRam(6, -1);

    emu.setRam(256, 1234);
    emu.setRam(257, -1);
    emu.setRam(258, -2);
    emu.setRam(259, -3);
    emu.setRam(260, -4);

    for (let i = 261; i <= 299; i++) {
      emu.setRam(i, -1);
    }

    // Run for 4000 cycles
    for (let i = 0; i < 4000; i++) {
      emu.executeNextInstruction();
    }

    expect(emu.getRam(0)).toBe(261);
    expect(emu.getRam(1)).toBe(261);
    expect(emu.getRam(2)).toBe(256);
    expect(emu.getRam(3)).toBe(4000);
    expect(emu.getRam(4)).toBe(5000);
    expect(emu.getRam(5)).toBe(135);
    expect(emu.getRam(6)).toBe(246);
  });

it('runs Project8/FunctionCalls/SimpleFunction', () => {
    const emu = new HackEmulator();
    const commands = parseHackFile(SimpleFunctionRaw);
    emu.loadProgram(commands);

    // Initial State Setup
    emu.setRam(0, 317);
    emu.setRam(1, 317);
    emu.setRam(2, 310);
    emu.setRam(3, 3000);
    emu.setRam(4, 4000);
    emu.setRam(310, 1234);
    emu.setRam(311, 37);
    emu.setRam(312, 1000);
    emu.setRam(313, 305);
    emu.setRam(314, 300);
    emu.setRam(315, 3010);
    emu.setRam(316, 4010);

    for (let i = 0; i < 300; i++) {
      emu.executeNextInstruction();
    }

    expect(emu.getRam(0)).toBe(311);
    expect(emu.getRam(1)).toBe(305);
    expect(emu.getRam(2)).toBe(300);
    expect(emu.getRam(3)).toBe(3010);
    expect(emu.getRam(4)).toBe(4010);
    expect(emu.getRam(310)).toBe(1196);
  });

  it('runs Project8/FunctionCalls/StaticsTest', () => {
    const emu = new HackEmulator();
    const commands = parseHackFile(StaticsTestRaw);
    emu.loadProgram(commands);

    emu.setRam(0, 256);

    for (let i = 0; i < 2500; i++) {
      emu.executeNextInstruction();
    }

    expect(emu.getRam(0)).toBe(263);
    expect(emu.getRam(261)).toBe(-2);
    expect(emu.getRam(262)).toBe(8);
  });

it('runs Project8/ProgramFlow/BasicLoop', () => {
    const emu = new HackEmulator();
    const commands = parseHackFile(BasicLoopRaw);
    emu.loadProgram(commands);

    // Initial State
    emu.setRam(0, 256);
    emu.setRam(1, 300);
    emu.setRam(2, 400);
    emu.setRam(400, 3);

    for (let i = 0; i < 600; i++) {
      emu.executeNextInstruction();
    }

    expect(emu.getRam(0)).toBe(257);
    expect(emu.getRam(256)).toBe(6);
  });

  it('runs Project8/ProgramFlow/FibonacciSeries', () => {
    const emu = new HackEmulator();
    const commands = parseHackFile(FibonacciSeriesRaw);
    emu.loadProgram(commands);

    // Initial State
    emu.setRam(0, 256);
    emu.setRam(1, 300);
    emu.setRam(2, 400);
    emu.setRam(400, 6);
    emu.setRam(401, 3000);

    for (let i = 0; i < 1100; i++) {
      emu.executeNextInstruction();
    }

    expect(emu.getRam(3000)).toBe(0);
    expect(emu.getRam(3001)).toBe(1);
    expect(emu.getRam(3002)).toBe(1);
    expect(emu.getRam(3003)).toBe(2);
    expect(emu.getRam(3004)).toBe(3);
    expect(emu.getRam(3005)).toBe(5);
  });
})