import type { VirtualFile } from "../../../types/Vfs";
import { VMParser } from "./Parser";
import { SymbolTable } from "./SymbolTable";
import { InstructionType, type DecodedInstruction, Segment } from "./types";

export class VMEmulator {
  private ram = new Int16Array(32768);
  private rom: string[] = [];
  private program_counter = 0;
  
  private binaryOps = new Map<string, () => void>();
  private unaryOps = new Map<string, () => void>();
  private segmentMap = new Map<string, Segment>();
  
  public symbolTable = new SymbolTable();
  public sourceMap: number[] = [];

  private readonly STACK_POINTER = 0;
  private readonly LCL_PTR = 1;
  private readonly ARG_PTR = 2;
  private readonly THIS_PTR = 3;
  private readonly THAT_PTR = 4;
  private readonly TEMP_BASE = 5;
  private readonly STATIC_BASE = 16;

  constructor() {
    this.ram[0] = 256;
    this.initDispatchTables();
    this.initSegmentMap();
  }
  
  public loadProgram(files: VirtualFile[]): void {
    this.symbolTable.clear();

    const { instructions, sourceMap } = VMParser.parse(files, this.symbolTable);

    this.rom = instructions;
    this.sourceMap = sourceMap;
    this.program_counter = 0;
  }

  public stackPush(val: number): void {
    const sp = this.ram[this.STACK_POINTER];
    this.ram[sp] = val;
    this.ram[this.STACK_POINTER]++;
  }

  public stackPop(): number {
    this.ram[this.STACK_POINTER]--;
    const sp = this.ram[this.STACK_POINTER];
    return this.ram[sp];
  }

  public peek(addr: number): number {
    if (addr >= this.ram.length) return 0;
    return this.ram[addr];
  }

  public peekStack(): number {
    return this.ram[this.ram[this.STACK_POINTER] - 1];
  }

  public poke(addr: number, value: number): void {
    this.ram[addr] = value;
  }

  private initDispatchTables() {
    // Binary Ops
    this.binaryOps.set("add", () => this.stackPush(this.stackPop() + this.stackPop()));
    this.binaryOps.set("and", () => this.stackPush(this.stackPop() & this.stackPop()));
    this.binaryOps.set("or", () => this.stackPush(this.stackPop() | this.stackPop()));
    this.binaryOps.set("sub", () => {
      const y = this.stackPop();
      const x = this.stackPop();
      this.stackPush(x - y);
    });

    const addComp = (name: string, comp: (a: number, b: number) => boolean) => {
      this.binaryOps.set(name, () => {
        const y = this.stackPop();
        const x = this.stackPop();
        this.stackPush(comp(x, y) ? -1 : 0);
      });
    };

    addComp("eq", (a, b) => a === b);
    addComp("gt", (a, b) => a > b);
    addComp("lt", (a, b) => a < b);

    // Unary Ops
    this.unaryOps.set("neg", () => this.stackPush(-this.stackPop()));
    this.unaryOps.set("not", () => this.stackPush(~this.stackPop()));
  }

  private initSegmentMap() {
    this.segmentMap.set("local", Segment.LOCAL);
    this.segmentMap.set("argument", Segment.ARG);
    this.segmentMap.set("this", Segment.THIS);
    this.segmentMap.set("that", Segment.THAT);
    this.segmentMap.set("constant", Segment.CONSTANT);
    this.segmentMap.set("static", Segment.STATIC);
    this.segmentMap.set("pointer", Segment.POINTER);
    this.segmentMap.set("temp", Segment.TEMP);
  }

  public executeNextInstruction() {
    const raw = this.fetch();
    if (!raw) return;
    const decoded = this.decode(raw);
    this.execute(decoded);
  }

  private fetch(): string | null {
    if (this.program_counter >= this.rom.length) return null;
    return this.rom[this.program_counter++];
  }

  private decode(instruction: string): DecodedInstruction {
    const parts = instruction.trim().split(/\s+/);
    const firstWord = parts[0];

    if (firstWord === "push" || firstWord === "pop") {
      return {
        type: firstWord === "push" ? InstructionType.PUSH : InstructionType.POP,
        segment: this.segmentMap.get(parts[1]),
        value: parseInt(parts[2], 10)
      };
    }

    if (firstWord === "goto" || firstWord === "if-goto") {
      return {
        type: firstWord === "goto" ? InstructionType.GOTO : InstructionType.IF_GOTO,
        command: parts[1]
      };
    }

    if (firstWord === "call") {
      return {
        type: InstructionType.FUNCTION_CALL,
        command: parts[1],
        value: parseInt(parts[2], 10)
      };
    }

    if (firstWord === "return") return { type: InstructionType.RETURN };

    if (this.binaryOps.has(firstWord)) {
      return { type: InstructionType.BINARY_ARITHMETIC, command: firstWord };
    }
    
    if (this.unaryOps.has(firstWord)) {
      return { type: InstructionType.UNARY_ARITHMETIC, command: firstWord };
    }

    throw new Error(`Unknown instruction: ${instruction}`);
  }

  private execute(decoded: DecodedInstruction) {
    switch (decoded.type) {
      case InstructionType.PUSH: this.executePush(decoded); break;
      case InstructionType.POP: this.executePop(decoded); break;
      case InstructionType.UNARY_ARITHMETIC: this.unaryOps.get(decoded.command!)?.(); break;
      case InstructionType.BINARY_ARITHMETIC: this.binaryOps.get(decoded.command!)?.(); break;
      case InstructionType.GOTO: this.executeGoto(decoded); break;
      case InstructionType.IF_GOTO: this.executeIfGoto(decoded); break;
      case InstructionType.FUNCTION_CALL: this.executeFunctionCall(decoded); break;
      case InstructionType.RETURN: this.executeReturn(decoded); break;
    }
  }

  private executePush(decoded: DecodedInstruction): void {
    let valueToPush = 0;
    const index = decoded.value!; 

    switch (decoded.segment) {
      case Segment.CONSTANT: valueToPush = index; break;
      case Segment.LOCAL:    valueToPush = this.peekLocal(index); break;
      case Segment.ARG:      valueToPush = this.peekArgument(index); break;
      case Segment.THIS:     valueToPush = this.peekThis(index); break;
      case Segment.THAT:     valueToPush = this.peekThat(index); break;
      case Segment.POINTER:  valueToPush = this.peekPointer(index); break;
      case Segment.TEMP:     valueToPush = this.peekTemp(index); break;
      case Segment.STATIC:   valueToPush = this.peekStatic(index); break;
      default: 
        throw new Error(`Unknown segment for push: ${decoded.segment}`);
    }

    this.stackPush(valueToPush);
  }

  private executePop(decoded: DecodedInstruction): void {
    const val = this.stackPop();
    const index = decoded.value!;

    switch (decoded.segment) {
      case Segment.CONSTANT: 
        throw new Error("Cannot pop into constant segment");
      case Segment.LOCAL:    this.pokeLocal(index, val); break;
      case Segment.ARG:      this.pokeArgument(index, val); break;
      case Segment.THIS:     this.pokeThis(index, val); break;
      case Segment.THAT:     this.pokeThat(index, val); break;
      case Segment.POINTER:  this.pokePointer(index, val); break;
      case Segment.TEMP:     this.pokeTemp(index, val); break;
      case Segment.STATIC:   this.pokeStatic(index, val); break;
      default: 
        throw new Error(`Unknown segment for pop: ${decoded.segment}`);
    }
  }

  private executeGoto(decoded: DecodedInstruction): void {
    const labelName = decoded.command!;
    // program_counter - 1 ensures we check the file scope of the current instruction
    this.program_counter = this.symbolTable.getAddressFromLabel(this.program_counter - 1, labelName);
  }

  private executeIfGoto(decoded: DecodedInstruction): void {
    const condition = this.stackPop();
    // In Hack, any non-zero value is treated as true for branching
    if (condition !== 0) {
      const labelName = decoded.command!;
      this.program_counter = this.symbolTable.getAddressFromLabel(this.program_counter - 1, labelName);
    }
  }

  private executeFunctionCall(decoded: DecodedInstruction): void {
    const functionName = decoded.command!;
    const numArgs = decoded.value!;
    
    // Look up the function in the symbol table to get its ROM address and local count
    const entry = this.symbolTable.getFunctionAddress(functionName);

    // 1. Push return address (this.program_counter is already pointing to the next instruction)
    this.stackPush(this.program_counter);

    // 2. Save the caller's frame (LCL, ARG, THIS, THAT)
    this.stackPush(this.ram[this.LCL_PTR]);
    this.stackPush(this.ram[this.ARG_PTR]);
    this.stackPush(this.ram[this.THIS_PTR]);
    this.stackPush(this.ram[this.THAT_PTR]);

    // 3. Reposition ARG (SP - 5 - number of arguments)
    this.ram[this.ARG_PTR] = this.ram[this.STACK_POINTER] - 5 - numArgs;

    // 4. Reposition LCL (LCL = SP)
    this.ram[this.LCL_PTR] = this.ram[this.STACK_POINTER];

    // 5. Initialize local variables to 0
    for (let i = 0; i < entry.locals; ++i) {
      this.stackPush(0);
    }

    // 6. Jump to function execution
    this.program_counter = entry.address;
  }

  private executeReturn(_decoded: DecodedInstruction): void {
    const endFrame = this.ram[this.LCL_PTR];
    
    // Gets the return address (saved just before the frame pointers)
    const retAddr = this.ram[endFrame - 5];
    
    // Pop the function's return value into the caller's ARG 0
    this.ram[this.ram[this.ARG_PTR]] = this.stackPop();
    
    // Restore the caller's SP (right after the return value)
    this.ram[this.STACK_POINTER] = this.ram[this.ARG_PTR] + 1;

    // Restore the caller's frame pointers
    this.ram[this.THAT_PTR] = this.ram[endFrame - 1];
    this.ram[this.THIS_PTR] = this.ram[endFrame - 2];
    this.ram[this.ARG_PTR]  = this.ram[endFrame - 3];
    this.ram[this.LCL_PTR]  = this.ram[endFrame - 4];

    // Jump back to the caller
    this.program_counter = retAddr;
  }

  private peekLocal(index: number): number { return this.ram[this.ram[this.LCL_PTR] + index]; }
  private pokeLocal(index: number, val: number): void { this.ram[this.ram[this.LCL_PTR] + index] = val; }

  private peekArgument(index: number): number { return this.ram[this.ram[this.ARG_PTR] + index]; }
  private pokeArgument(index: number, val: number): void { this.ram[this.ram[this.ARG_PTR] + index] = val; }

  private peekThis(index: number): number { return this.ram[this.ram[this.THIS_PTR] + index]; }
  private pokeThis(index: number, val: number): void { this.ram[this.ram[this.THIS_PTR] + index] = val; }

  private peekThat(index: number): number { return this.ram[this.ram[this.THAT_PTR] + index]; }
  private pokeThat(index: number, val: number): void { this.ram[this.ram[this.THAT_PTR] + index] = val; }

  private peekPointer(index: number): number { return this.ram[this.THIS_PTR + index]; }
  private pokePointer(index: number, val: number): void { this.ram[this.THIS_PTR + index] = val; }

  private peekTemp(index: number): number { return this.ram[this.TEMP_BASE + index]; }
  private pokeTemp(index: number, val: number): void { this.ram[this.TEMP_BASE + index] = val; }

  private peekStatic(index: number): number { return this.ram[this.STATIC_BASE + index]; }
  private pokeStatic(index: number, val: number): void { this.ram[this.STATIC_BASE + index] = val; }
}