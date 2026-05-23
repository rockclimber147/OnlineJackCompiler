import { describe, it, expect, beforeEach } from 'vitest';
import { VMEmulator } from './VMEmulator';
import { type VirtualFile } from '../../../types/Vfs';

describe('VMEmulator - Function Calls', () => {
  let emu: VMEmulator;

  beforeEach(() => {
    emu = new VMEmulator();
  });

  it('executes a function call, passes arguments, and returns a value', () => {
    const code = `
      // Main script execution
      push constant 10
      push constant 20
      call Math.add 2      // Call the function with 2 arguments

      label END
      goto END

      // Function definition
      function Math.add 0
      push argument 0      // 10
      push argument 1      // 20
      add                  // 30
      return
    `;
    
    const file: VirtualFile = { id: '1', name: 'Test.vm', language: 'vm', content: code };
    emu.loadProgram([file]);

    // Manually set up memory base pointers to simulate a caller's environment
    emu.poke(0, 256);  // SP
    emu.poke(1, 300);  // LCL
    emu.poke(2, 400);  // ARG
    emu.poke(3, 3000); // THIS
    emu.poke(4, 4000); // THAT

    // Execute enough cycles to complete the call, addition, and return
    for (let i = 0; i < 12; i++) {
      emu.executeNextInstruction();
    }

    // 1. The return value (30) should be placed at the caller's original ARG 0 (RAM[256])
    expect(emu.peek(256)).toBe(30);
    
    // 2. SP should be repositioned right after the return value
    expect(emu.peek(0)).toBe(257);
    
    // 3. The caller's original frame pointers MUST be perfectly restored
    expect(emu.peek(1)).toBe(300);
    expect(emu.peek(2)).toBe(400);
    expect(emu.peek(3)).toBe(3000);
    expect(emu.peek(4)).toBe(4000);
  });

  it('allocates local variables and initializes them to 0', () => {
    const code = `
      call Func.withLocals 0
      
      label END
      goto END

      function Func.withLocals 3
      // Pushes the 3rd local variable to prove it was initialized to 0
      push local 2
      return
    `;
    
    const file: VirtualFile = { id: '2', name: 'Test.vm', language: 'vm', content: code };
    emu.loadProgram([file]);
    
    // Set SP to 256
    emu.poke(0, 256);

    // Execute exactly 2 cycles:
    // 1. call Func.withLocals 0
    // 2. push local 2
    emu.executeNextInstruction();
    emu.executeNextInstruction();

    // Check the stack state inside the function BEFORE it returns:
    // SP 256-260: saved frame (retAddr, LCL, ARG, THIS, THAT)
    // SP 261-263: 3 local variables initialized to 0
    // SP 264: the value pushed by 'push local 2'
    expect(emu.peek(0)).toBe(265);   // SP advanced by 5 + 3 + 1
    expect(emu.peek(264)).toBe(0);   // The pushed local 2 value should be 0

    // Execute the return instruction
    emu.executeNextInstruction();

    // The returned value (0) should sit at RAM[256] and SP should be 257
    expect(emu.peek(0)).toBe(257);
    expect(emu.peek(256)).toBe(0);
  });

  it('pushes to the call stack on call and pops on return', () => {
    const code = `
      call Simple.func 0
      label END
      goto END

      function Simple.func 0
      push constant 0
      return
    `;
    
    const file: VirtualFile = { id: '3', name: 'Test.vm', language: 'vm', content: code };
    emu.loadProgram([file]);
    emu.poke(0, 256); // SP

    expect(emu.getCallStack()).toEqual([]);

    emu.executeNextInstruction(); // execute: call Simple.func 0
    expect(emu.getCallStack()).toEqual(['Simple.func']);

    emu.executeNextInstruction(); // execute: push constant 0
    expect(emu.getCallStack()).toEqual(['Simple.func']);

    emu.executeNextInstruction(); // execute: return
    expect(emu.getCallStack()).toEqual([]);
  });

  it('maintains the call stack accurately during nested function calls', () => {
    const code = `
      call Outer.func 0
      label END
      goto END

      function Outer.func 0
      call Inner.func 0
      push constant 0
      return

      function Inner.func 0
      push constant 0
      return
    `;
    
    const file: VirtualFile = { id: '4', name: 'Test.vm', language: 'vm', content: code };
    emu.loadProgram([file]);
    emu.poke(0, 256); // SP

    expect(emu.getCallStack()).toEqual([]);

    emu.executeNextInstruction(); // execute: call Outer.func 0
    expect(emu.getCallStack()).toEqual(['Outer.func']);

    emu.executeNextInstruction(); // execute: call Inner.func 0
    expect(emu.getCallStack()).toEqual(['Outer.func', 'Inner.func']);

    emu.executeNextInstruction(); // execute: push constant 0 (inside Inner.func)
    emu.executeNextInstruction(); // execute: return (from Inner.func)
    
    // Stack should unwind back to Outer.func
    expect(emu.getCallStack()).toEqual(['Outer.func']);

    emu.executeNextInstruction(); // execute: push constant 0 (inside Outer.func)
    emu.executeNextInstruction(); // execute: return (from Outer.func)

    // Stack should be fully empty
    expect(emu.getCallStack()).toEqual([]);
  });
});