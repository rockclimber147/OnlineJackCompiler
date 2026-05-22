export const MEMORY_SIZE = 32768;
export const ROM_MAX_SIZE = 32768;

export const InstructionType = {
  A_INSTRUCTION: 0,
  C_INSTRUCTION: 1,
} as const;

type InstructionType = typeof InstructionType[keyof typeof InstructionType];

interface DecodedInstruction {
  type: InstructionType;
  addressOrValue?: number;
  jump_JGT?: number; jump_JEQ?: number; jump_JLT?: number;
  dest_M?: number; dest_D?: number; dest_A?: number;
  is_M_bit?: number;
  comp_code?: number;
}

export class HackEmulator {
  private ram = new Int16Array(MEMORY_SIZE);
  private rom = new Int16Array(ROM_MAX_SIZE);
  
  public a_register = 0;
  public d_register = 0;
  public program_counter = 0;

  constructor() {}

  reset(): void {
    this.a_register = 0;
    this.d_register = 0;
    this.program_counter = 0;
    this.ram.fill(0);
  }

  loadProgram(instructions: number[]): void {
    if (instructions.length > ROM_MAX_SIZE) {
      throw new Error("Program size exceeds ROM capacity.");
    }
    this.rom.fill(0);
    this.rom.set(instructions);
    this.program_counter = 0;
  }

  clearMemory(): void {
    this.ram.fill(0);
  }

  executeNextInstruction(): void {
    const instruction = this.rom[this.program_counter];
    const decoded = this.decode(instruction);
    this.execute(decoded);
  }

  private decode(instruction: number): DecodedInstruction {
    if ((instruction & 0x8000) === 0) {
      return { type: InstructionType.A_INSTRUCTION, addressOrValue: instruction & 0x7FFF };
    } else {
      return {
        type: InstructionType.C_INSTRUCTION,
        jump_JGT: (instruction >> 0) & 0x1,
        jump_JEQ: (instruction >> 1) & 0x1,
        jump_JLT: (instruction >> 2) & 0x1,
        dest_M: (instruction >> 3) & 0x1,
        dest_D: (instruction >> 4) & 0x1,
        dest_A: (instruction >> 5) & 0x1,
        comp_code: (instruction >> 6) & 0x3F,
        is_M_bit: (instruction >> 12) & 0x1
      };
    }
  }

  private execute(instr: DecodedInstruction): void {
    if (instr.type === InstructionType.A_INSTRUCTION) {
      this.a_register = instr.addressOrValue!;
      this.program_counter++;
    } else {
      const result = this.alu(!!instr.is_M_bit, instr.comp_code!);
      
      if (instr.dest_D) this.d_register = result;
      if (instr.dest_A) this.a_register = result;
      if (instr.dest_M) this.ram[this.a_register] = result;
      
      const jump = (instr.jump_JGT && result > 0) ||
                   (instr.jump_JEQ && result === 0) ||
                   (instr.jump_JLT && result < 0);
                   
      this.program_counter = jump ? this.a_register : this.program_counter + 1;
    }
  }

  private alu(is_M_bit: boolean, comp_code: number): number {
    const d = this.d_register;
    const a_input = is_M_bit ? this.ram[this.a_register] : this.a_register;
    let result = 0;

    switch (comp_code) {
      case 0b101010: result = 0; break;
      case 0b111111: result = 1; break;
      case 0b111010: result = -1; break;
      case 0b001100: result = d; break;
      case 0b110000: result = a_input; break;
      case 0b001101: result = ~d; break;
      case 0b110001: result = ~a_input; break;
      case 0b001111: result = -d; break;
      case 0b110011: result = -a_input; break;
      case 0b011111: result = d + 1; break;
      case 0b110111: result = a_input + 1; break;
      case 0b001110: result = d - 1; break;
      case 0b110010: result = a_input - 1; break;
      case 0b000010: result = d + a_input; break;
      case 0b010011: result = d - a_input; break;
      case 0b000111: result = a_input - d; break;
      case 0b000000: result = d & a_input; break;
      case 0b010101: result = d | a_input; break;
      default: throw new Error("Invalid ALU comp code");
    }
    // Force 16-bit signed wrapping
    return (result << 16) >> 16;
  }

  // Getters/Setters for UI interaction
  public getRam(addr: number): number { return this.ram[addr]; }
  public setRam(addr: number, val: number) { this.ram[addr] = val }
}