import { InstructionType, type DecodedInstruction, Segment } from "./types";

export class VMEmulator {
  private ram = new Int16Array(32768);
  private rom: string[] = [];
  private program_counter = 0;
  
  private binaryOps = new Map<string, () => void>();
  private unaryOps = new Map<string, () => void>();
  private segmentMap = new Map<string, Segment>();
  
  private STACK_POINTER = 0;

  constructor() {
    this.ram[0] = 256; // Stack Pointer initialization
    this.initDispatchTables();
    this.initSegmentMap();
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
      // case InstructionType.PUSH: this.executePush(decoded); break;
      // case InstructionType.POP: this.executePop(decoded); break;
      // case InstructionType.UNARY_ARITHMETIC: this.unaryOps.get(decoded.command!)?.(); break;
      // case InstructionType.BINARY_ARITHMETIC: this.binaryOps.get(decoded.command!)?.(); break;
    }
  }
}