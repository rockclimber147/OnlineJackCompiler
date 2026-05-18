import { VMCommandType, SEGMENT_POINTERS, SEGMENT_BASES } from "../../languages/vm/VmSpec";

export class CodeWriter {
  private output: string[] = [];
  private fileName: string = "";
  private labelCounter: number = 0;
  private currentFunction: string = "";

  public setFileName(fileName: string): void {
    this.fileName = fileName.replace(".vm", "");
  }

  public writeInit(): void {
    this.output.push("// BOOTSTRAP CODE");
    this.output.push("@256", "D=A", "@SP", "M=D");
    this.writeCall("Sys.init", 0);
  }

  public writeArithmetic(command: string): void {
    this.output.push(`// ${command}`);

    if (command === "add" || command === "sub" || command === "and" || command === "or") {
      this.output.push("@SP", "AM=M-1", "D=M", "A=A-1");
      if (command === "add") this.output.push("M=D+M");
      if (command === "sub") this.output.push("M=M-D");
      if (command === "and") this.output.push("M=D&M");
      if (command === "or") this.output.push("M=D|M");
    } else if (command === "neg" || command === "not") {
      this.output.push("@SP", "A=M-1");
      if (command === "neg") this.output.push("M=-M");
      if (command === "not") this.output.push("M=!M");
    } else if (command === "eq" || command === "gt" || command === "lt") {
      const labelTrue = `JUMP_TRUE_${this.labelCounter}`;
      const labelEnd = `JUMP_END_${this.labelCounter}`;
      this.labelCounter++;

      const jumpCmd = command === "eq" ? "JEQ" : command === "gt" ? "JGT" : "JLT";

      this.output.push(
        "@SP", "AM=M-1", "D=M", "A=A-1", "D=M-D",
        `@${labelTrue}`, `D;${jumpCmd}`,
        "@SP", "A=M-1", "M=0", // False (0)
        `@${labelEnd}`, "0;JMP",
        `(${labelTrue})`,
        "@SP", "A=M-1", "M=-1", // True (-1)
        `(${labelEnd})`
      );
    }
  }

  public writePushPop(command: VMCommandType, segment: string, index: number): void {
    this.output.push(`// ${command === VMCommandType.C_PUSH ? "push" : "pop"} ${segment} ${index}`);

    if (command === VMCommandType.C_PUSH) {
      if (segment === "constant") {
        this.output.push(`@${index}`, "D=A");
      } else if (segment === "local" || segment === "argument" || segment === "this" || segment === "that") {
        this.output.push(`@${index}`, "D=A", `@${SEGMENT_POINTERS[segment]}`, "A=D+M", "D=M");
      } else if (segment === "pointer" || segment === "temp") {
        const base = segment === "pointer" ? SEGMENT_BASES["pointer"] : SEGMENT_BASES["temp"];
        this.output.push(`@${base + index}`, "D=M");
      } else if (segment === "static") {
        this.output.push(`@${this.fileName}.${index}`, "D=M");
      }

      // Push D to stack
      this.output.push("@SP", "A=M", "M=D", "@SP", "M=M+1");

    } else if (command === VMCommandType.C_POP) {
      if (segment === "local" || segment === "argument" || segment === "this" || segment === "that") {
        this.output.push(`@${index}`, "D=A", `@${SEGMENT_POINTERS[segment]}`, "D=D+M", "@R13", "M=D"); // Store target address in R13
        this.output.push("@SP", "AM=M-1", "D=M"); // Pop value into D
        this.output.push("@R13", "A=M", "M=D"); // Move D to target address
      } else if (segment === "pointer" || segment === "temp") {
        const base = segment === "pointer" ? SEGMENT_BASES["pointer"] : SEGMENT_BASES["temp"];
        this.output.push("@SP", "AM=M-1", "D=M", `@${base + index}`, "M=D");
      } else if (segment === "static") {
        this.output.push("@SP", "AM=M-1", "D=M", `@${this.fileName}.${index}`, "M=D");
      }
    }
  }

  public writeLabel(label: string): void {
    this.output.push(`(${this.currentFunction}$${label})`);
  }

  public writeGoto(label: string): void {
    this.output.push(`@${this.currentFunction}$${label}`, "0;JMP");
  }

  public writeIf(label: string): void {
    this.output.push("@SP", "AM=M-1", "D=M", `@${this.currentFunction}$${label}`, "D;JNE");
  }

  public writeFunction(functionName: string, numLocals: number): void {
    this.output.push(`// function ${functionName} ${numLocals}`);
    this.currentFunction = functionName;
    this.output.push(`(${functionName})`);
    for (let i = 0; i < numLocals; i++) {
      this.output.push("@SP", "A=M", "M=0", "@SP", "M=M+1");
    }
  }

  public writeCall(functionName: string, numArgs: number): void {
    this.output.push(`// call ${functionName} ${numArgs}`);
    const returnAddress = `${functionName}$ret.${this.labelCounter++}`;

    // Push return address
    this.output.push(`@${returnAddress}`, "D=A", "@SP", "A=M", "M=D", "@SP", "M=M+1");
    
    // Push LCL, ARG, THIS, THAT
    ["LCL", "ARG", "THIS", "THAT"].forEach(seg => {
      this.output.push(`@${seg}`, "D=M", "@SP", "A=M", "M=D", "@SP", "M=M+1");
    });

    // ARG = SP - 5 - numArgs
    this.output.push("@SP", "D=M", `@${5 + numArgs}`, "D=D-A", "@ARG", "M=D");
    
    // LCL = SP
    this.output.push("@SP", "D=M", "@LCL", "M=D");
    
    // goto function
    this.output.push(`@${functionName}`, "0;JMP");
    
    // (returnAddress)
    this.output.push(`(${returnAddress})`);
  }

  public writeReturn(): void {
    this.output.push("// return");
    // LCL -> R14 (endFrame)
    this.output.push("@LCL", "D=M", "@R14", "M=D");
    // *(endFrame - 5) -> R15 (retAddr)
    this.output.push("@5", "A=D-A", "D=M", "@R15", "M=D");
    // *ARG = pop()
    this.output.push("@SP", "AM=M-1", "D=M", "@ARG", "A=M", "M=D");
    // SP = ARG + 1
    this.output.push("@ARG", "D=M+1", "@SP", "M=D");
    
    // Restore THAT, THIS, ARG, LCL
    ["THAT", "THIS", "ARG", "LCL"].forEach((seg, idx) => {
      this.output.push("@R14", "D=M", `@${idx + 1}`, "A=D-A", "D=M", `@${seg}`, "M=D");
    });

    // goto retAddr
    this.output.push("@R15", "A=M", "0;JMP");
  }

  public getOutput(): string {
    return this.output.join("\n");
  }
}