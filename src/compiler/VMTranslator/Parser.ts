import { VMCommandType, ARITHMETIC_COMMANDS } from "../../languages/vm/VmSpec";

export class Parser {
  private lines: { text: string; originalLine: number; rawText: string }[] = [];
  private currentCommandIndex: number = -1;
  private currentTokens: string[] = [];

  constructor(input: string) {
    const rawLines = input.split(/\r?\n/);
    
    for (let i = 0; i < rawLines.length; i++) {
      const raw = rawLines[i].trim();
      const text = raw.split("//")[0].trim();
      
      // Keep the line if it has code OR if it's a comment-only line
      if (raw.length > 0) {
        this.lines.push({
          text,
          originalLine: i + 1,
          rawText: raw 
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
      this.currentTokens = currentLineText.split(/\s+/);
    }
  }

  public currentLineNumber(): number {
    return this.lines[this.currentCommandIndex]?.originalLine || 1;
  }

  public currentLineText(): string {
    return this.lines[this.currentCommandIndex]?.text || "";
  }

  // NEW: Expose the raw, unstripped text for the CodeWriter
  public currentRawText(): string {
    return this.lines[this.currentCommandIndex]?.rawText || "";
  }

  public commandType(): VMCommandType | "C_COMMENT" {
    const cmd = this.currentTokens[0];

    // If the stripped text is empty, it was a comment-only line
    if (cmd === "") return "C_COMMENT";

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
    if (this.commandType() === VMCommandType.C_RETURN || this.commandType() === "C_COMMENT") {
      throw new Error("arg1 should not be called on this type");
    }
    if (this.commandType() === VMCommandType.C_ARITHMETIC) {
      return this.currentTokens[0];
    }
    return this.currentTokens[1];
  }

  public arg2(): number {
    const type = this.commandType();
    if (type === VMCommandType.C_PUSH || type === VMCommandType.C_POP || type === VMCommandType.C_FUNCTION || type === VMCommandType.C_CALL) {
      return parseInt(this.currentTokens[2], 10);
    }
    throw new Error(`arg2 called on invalid command type: ${type}`);
  }
}