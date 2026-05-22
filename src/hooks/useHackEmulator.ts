import { useState, useRef, useCallback, useEffect } from 'react';
import { HackEmulator } from '../compiler/Emulators/CpuEmulator/hackEmulator';

const MIN_SPEED = 1;
const MAX_SPEED = 100;

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
    let lastTimestamp = performance.now();

    const runLoop = (now: number) => {
      // 1. Calculate target instructions per second (IPS)
      // Map speed 0 -> 1 IPS, speed 100 -> 1000 IPS
      const targetIPS = Math.pow(10, (speed / 100) * 3); 
      
      // 2. Calculate elapsed time in seconds
      const elapsedSeconds = (now - lastTimestamp) / 1000;
      
      // 3. Determine how many cycles to run this frame
      // We want: targetIPS * elapsedSeconds
      const instructionsToRun = Math.floor(targetIPS * elapsedSeconds);

      if (instructionsToRun > 0) {
        for (let i = 0; i < Math.min(instructionsToRun, 500); i++) {
          step();
        }
        lastTimestamp = now;
      }

      animationId = requestAnimationFrame(runLoop);
    };

    animationId = requestAnimationFrame(runLoop);
    return () => cancelAnimationFrame(animationId);
  }, [isRunning, speed, step]);

  return { pc, registers, load, step, getRam, setRam, getRamRange, isRunning, setIsRunning, speed, setSpeed };
}