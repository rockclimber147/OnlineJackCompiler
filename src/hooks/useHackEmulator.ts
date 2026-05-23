import { useState, useRef, useCallback, useEffect } from 'react';
import { HackEmulator } from '../compiler/Emulators/CpuEmulator/hackEmulator';

// Configuration Constants
const MIN_SPEED = 0;
const MAX_SPEED = 100;
export const MIN_IPS = 1;         // Instructions per second at slider 0
export const MAX_IPS = 1000;      // Instructions per second at slider 100
const IPS_EXPONENT = 3;    // Determines the curve (10^3 = 1000)
const BURST_CAP = 500;     // Safety cap to prevent UI freezes
const MS_PER_SECOND = 1000;

export function useHackEmulator() {
  const cpu = useRef(new HackEmulator());
  const [pc, setPc] = useState(0);
  const [registers, setRegisters] = useState({ a: 0, d: 0 });
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(50);
  const [frameCount, setFrameCount] = useState(0);

  const clearRam = useCallback(() => {
    cpu.current.clearMemory(); 
    setFrameCount(f => f + 1); 
  }, []);

  const load = (binary: number[]) => {
    cpu.current.loadProgram(binary);
    setPc(0);
    setRegisters({ a: 0, d: 0 });
    setFrameCount(0);
  };

  const step = useCallback(() => {
    cpu.current.executeNextInstruction();
    setPc(cpu.current.program_counter);
    setRegisters({ 
      a: cpu.current.a_register, 
      d: cpu.current.d_register 
    });
  }, []);

  const getRam = useCallback((addr: number) => {
    return cpu.current.getRam(addr);
  }, []);

  const setRam = useCallback((addr: number, value: number) => {
    cpu.current.setRam(addr, value);
    // Force a visual refresh when RAM is modified manually
    setFrameCount(f => f + 1);
  }, []);

  const getRamRange = useCallback((start: number, count: number) => {
    const range = [];
    for (let i = 0; i < count; i++) {
      range.push(cpu.current.getRam(start + i));
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
    registers, 
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