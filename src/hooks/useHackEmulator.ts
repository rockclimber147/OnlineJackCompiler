import { useState, useRef, useCallback, useEffect } from 'react';
import { HackEmulator } from '../compiler/Emulators/CpuEmulator/hackEmulator';

// Configuration constants for emulator behavior
const MIN_SPEED = 1;
const MAX_SPEED = 100;
const MIN_CYCLES_PER_FRAME = 1;
const MAX_CYCLES_PER_FRAME = 1000;
const SPEED_EXPONENT = Math.log10(MAX_CYCLES_PER_FRAME / MIN_CYCLES_PER_FRAME);

export function useHackEmulator() {
  const cpu = useRef(new HackEmulator());
  const [pc, setPc] = useState(0);
  const [registers, setRegisters] = useState({ a: 0, d: 0 });
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(50);

  const load = (binary: number[]) => {
    cpu.current.loadProgram(binary);
    setPc(0);
    setRegisters({ a: 0, d: 0 });
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
    let lastExecutionTime = performance.now();

    const runLoop = (currentTime: number) => {
      const normalizedSpeed = (speed - MIN_SPEED) / (MAX_SPEED - MIN_SPEED);
      
      // Logarithmic delay: 1000ms at speed 0, ~0ms at speed 100
      const delayPerCycle = 1000 * Math.pow(0.01, normalizedSpeed);
      
      const deltaTime = currentTime - lastExecutionTime;

      if (deltaTime >= delayPerCycle) {
        // Execute the step
        step();
        lastExecutionTime = currentTime;
      }

      animationId = requestAnimationFrame(runLoop);
    };

    animationId = requestAnimationFrame(runLoop);
    return () => cancelAnimationFrame(animationId);
  }, [isRunning, speed, step]);

  return { pc, registers, load, step, getRam, setRam, getRamRange, isRunning, setIsRunning, speed, setSpeed };
}