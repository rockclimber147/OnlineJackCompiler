import { VMCommandType, ARITHMETIC_COMMANDS } from "../../languages/vm/VmSpec";

export class Parser {
  private lines: string[] = [];
  private currentCommandIndex: number = -1;
  private currentTokens: string[] = [];

  constructor(input: string) {
    // Split by newlines, remove comments, trim, and filter out empty lines
    this.lines = input
      .split(/\r?\n/)
      .map(line => line.split("//")[0].trim())
      .filter(line => line.length > 0);
  }

  public hasMoreCommands(): boolean {
    return this.currentCommandIndex < this.lines.length - 1;
  }

  public advance(): void {
    if (this.hasMoreCommands()) {
      this.currentCommandIndex++;
      const currentLine = this.lines[this.currentCommandIndex];
      // Split by whitespace to get the parts of the command (e.g., ["push", "constant", "7"])
      this.currentTokens = currentLine.split(/\s+/);
    }
  }

  public commandType(): VMCommandType {
    const cmd = this.currentTokens[0];

    if (ARITHMETIC_COMMANDS.has(cmd)) return VMCommandType.C_ARITHMETIC;
    if (cmd === "push") return VMCommandType.C_PUSH;
    if (cmd === "pop") return VMCommandType.C_POP;
    if (cmd === "label") return VMCommandType.C_LABEL;
    if (cmd === "goto") return VMCommandType.C_GOTO;
    if (cmd === "if-goto") return VMCommandType.C_IF;
    if (cmd === "function") return VMCommandType.C_FUNCTION;
    if (cmd === "return") return VMCommandType.C_RETURN;
    if (cmd === "call") return VMCommandType.C_CALL;

    throw new Error(`Unknown command type: ${cmd}`);
  }

  public arg1(): string {
    if (this.commandType() === VMCommandType.C_RETURN) {
      throw new Error("arg1 should not be called on C_RETURN");
    }
    // For arithmetic, the command itself is arg1 (e.g., "add")
    if (this.commandType() === VMCommandType.C_ARITHMETIC) {
      return this.currentTokens[0];
    }
    return this.currentTokens[1];
  }

  public arg2(): number {
    const type = this.commandType();
    if (
      type === VMCommandType.C_PUSH ||
      type === VMCommandType.C_POP ||
      type === VMCommandType.C_FUNCTION ||
      type === VMCommandType.C_CALL
    ) {
      return parseInt(this.currentTokens[2], 10);
    }
    throw new Error(`arg2 called on invalid command type: ${type}`);
  }
}