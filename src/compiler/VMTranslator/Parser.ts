import { VMCommandType, ARITHMETIC_COMMANDS } from "../../languages/vm/VmSpec";
import { type ParsedLine } from "../../types/Compiler";

export class Parser {
  private lines: ParsedLine[] = [];
  private currentCommandIndex: number = -1;
  private currentTokens: string[] = [];

  constructor(input: string) {
    const rawLines = input.split(/\r?\n/);
    
    for (let i = 0; i < rawLines.length; i++) {
      const raw = rawLines[i];
      const text = raw.split("//")[0].trim();
      
      if (text.length > 0) {
        this.lines.push({
          text,
          originalLine: i + 1 
        });
      }
    }
  }

  public hasMoreCommands(): boolean {
    return this.currentCommandIndex < this.lines.length - 1;
  }

  public advance(): void {
    if (this.hasMoreCommands()) {
      this.currentCommandIndex++;
      const currentLineText = this.lines[this.currentCommandIndex].text;
      // Split by whitespace to get the parts of the command
      this.currentTokens = currentLineText.split(/\s+/);
    }
  }

  // NEW: Helper to get the original line number for error reporting
  public currentLineNumber(): number {
    if (this.currentCommandIndex >= 0 && this.currentCommandIndex < this.lines.length) {
      return this.lines[this.currentCommandIndex].originalLine;
    }
    return 1;
  }

  // NEW: Helper to get the cleaned text for column width mapping
  public currentLineText(): string {
    if (this.currentCommandIndex >= 0 && this.currentCommandIndex < this.lines.length) {
      return this.lines[this.currentCommandIndex].text;
    }
    return "";
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