import { useState, useRef, useCallback, useEffect } from 'react';
import { HackEmulator } from '../compiler/Emulators/CpuEmulator/hackEmulator';

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

  const step = () => {
    cpu.current.executeNextInstruction();
    setPc(cpu.current.program_counter);
    setRegisters({ 
      a: cpu.current.a_register, 
      d: cpu.current.d_register 
    });
  };

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

    const runLoop = () => {
      const cyclesPerFrame = speed === 100 ? 1000 : Math.ceil(speed / 2);

      for (let i = 0; i < cyclesPerFrame; i++) {
        step();
      }
      animationId = requestAnimationFrame(runLoop);
    };

    animationId = requestAnimationFrame(runLoop);
    return () => cancelAnimationFrame(animationId);
  }, [isRunning, speed]);

  return { pc, registers, load, step, getRam, setRam, getRamRange, isRunning, setIsRunning, speed, setSpeed };
}