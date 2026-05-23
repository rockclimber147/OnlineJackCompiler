import { useState, useRef, useCallback, useEffect } from 'react';
import { VMEmulator } from '../compiler/Emulators/VMEmulator/VMEmulator'; // Adjust path as needed
import { type VirtualFile } from '../types/Vfs';

// Configuration Constants
const MIN_SPEED = 0;
const MAX_SPEED = 100;
export const MIN_IPS = 1;         // Instructions per second at slider 0
export const MAX_IPS = 1000;      // Instructions per second at slider 100
const IPS_EXPONENT = 3;    // Determines the curve (10^3 = 1000)
const BURST_CAP = 500;     // Safety cap to prevent UI freezes
const MS_PER_SECOND = 1000;

export function useVMEmulator() {
  const vm = useRef(new VMEmulator());
  
  // VM-specific State
  const [pc, setPc] = useState(0);
  const [callStack, setCallStack] = useState<string[]>([]);
  const [basePointers, setBasePointers] = useState({
    sp: 256,
    lcl: 0,
    arg: 0,
    this: 0,
    that: 0
  });

  // UI / Loop State
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(50);
  const [frameCount, setFrameCount] = useState(0);

  const clearRam = useCallback(() => {
    // Assuming you have or will add a clearMemory() method to VMEmulator
    // that zeros out the this.ram array
    if (typeof (vm.current as any).clearMemory === 'function') {
      (vm.current as any).clearMemory(); 
    } else {
      // Fallback if not implemented: zero out RAM manually
      for(let i = 0; i < 32768; i++) vm.current.poke(i, 0);
    }
    setFrameCount(f => f + 1); 
  }, []);

  const load = useCallback((files: VirtualFile[], skipBootstrap: boolean = false) => {
    vm.current.loadProgram(files, skipBootstrap);
    setPc(vm.current.program_counter);
    setCallStack(vm.current.getCallStack());
    setBasePointers({
      sp: vm.current.peek(0),
      lcl: vm.current.peek(1),
      arg: vm.current.peek(2),
      this: vm.current.peek(3),
      that: vm.current.peek(4)
    });
    setFrameCount(0);
  }, []);

  const step = useCallback(() => {
    vm.current.executeNextInstruction();
    
    setPc(vm.current.program_counter);
    setCallStack(vm.current.getCallStack());
    setBasePointers({ 
      sp: vm.current.peek(0), 
      lcl: vm.current.peek(1),
      arg: vm.current.peek(2),
      this: vm.current.peek(3),
      that: vm.current.peek(4)
    });
  }, []);

  const getRam = useCallback((addr: number) => {
    return vm.current.peek(addr);
  }, []);

  const setRam = useCallback((addr: number, value: number) => {
    vm.current.poke(addr, value);
    // Force a visual refresh when RAM is modified manually
    setFrameCount(f => f + 1);
  }, []);

  const getRamRange = useCallback((start: number, count: number) => {
    const range = [];
    for (let i = 0; i < count; i++) {
      range.push(vm.current.peek(start + i));
    }
    return range;
  }, []);

  useEffect(() => {
    if (!isRunning) return;

    let animationId: number;
    let lastTimestamp = performance.now();

    const runLoop = (now: number) => {
      // Calculate target instructions per second (IPS)
      const normalizedSpeed = (speed - MIN_SPEED) / (MAX_SPEED - MIN_SPEED);
      const targetIPS = Math.pow(10, normalizedSpeed * IPS_EXPONENT); 
      
      // Calculate elapsed time in seconds
      const elapsedSeconds = (now - lastTimestamp) / MS_PER_SECOND;
      
      // Determine how many cycles to run
      const instructionsToRun = Math.floor(targetIPS * elapsedSeconds);

      if (instructionsToRun > 0) {
        for (let i = 0; i < Math.min(instructionsToRun, BURST_CAP); i++) {
          step();
        }
        setFrameCount(f => f + 1);
        lastTimestamp = now;
      }

      animationId = requestAnimationFrame(runLoop);
    };

    animationId = requestAnimationFrame(runLoop);
    return () => cancelAnimationFrame(animationId);
  }, [isRunning, speed, step]);

  return { 
    pc, 
    callStack,
    basePointers,
    load, 
    clearRam,
    step, 
    getRam, 
    setRam, 
    getRamRange, 
    isRunning, 
    setIsRunning, 
    speed, 
    setSpeed,
    frameCount
  };
}