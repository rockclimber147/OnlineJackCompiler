import { TokenType, JackTokenMatcher } from "../../languages/jack/JackSpec";
import type { Token } from "./Token";

export class JackTokenizer {
  private input: string;
  private cursor: number = 0;
  private line: number = 1;
  private column: number = 1;

  constructor(input: string) {
    this.input = input;
  }

  /**
   * Processes the entire input string and returns an array of valid tokens.
   */
  public tokenize(): Token[] {
    const tokens: Token[] = [];

    while (this.cursor < this.input.length) {
      const matchResult = this.matchNext();

      if (!matchResult) {
        // If no regex matched, we've hit an invalid character
        const snippet = this.input.slice(this.cursor, this.cursor + 10).replace(/\n/g, '\\n');
        throw new Error(`Lexical error at line ${this.line}, col ${this.column}: Unexpected token near '${snippet}'`);
      }

      const { type, lexeme } = matchResult;

      // Only push the token if it's not whitespace or a comment
      if (type !== TokenType.SKIP) {
        tokens.push({
          type,
          lexeme,
          line: this.line,
          // Record the column where the token *starts*
          column: this.column, 
        });
      }

      // Move the cursor forward and update line/column counters
      this.advanceCursor(lexeme);
    }

    // Always append an EOF token to make the Parser's job easier
    tokens.push({
      type: TokenType.EOF,
      lexeme: "EOF",
      line: this.line,
      column: this.column,
    });

    return tokens;
  }

  /**
   * Tests the remaining string against all predefined regex matchers.
   */
  private matchNext(): { type: TokenType; lexeme: string } | null {
    const remaining = this.input.slice(this.cursor);

    for (const [regex, type] of JackTokenMatcher) {
      const match = regex.exec(remaining);
      
      // Because all our regexes start with '^', a match will always be at index 0
      if (match) {
        return { type, lexeme: match[0] };
      }
    }

    return null;
  }

  /**
   * Updates the internal cursor, line, and column state based on the consumed string.
   */
  private advanceCursor(lexeme: string): void {
    this.cursor += lexeme.length;

    const lines = lexeme.split('\n');
    
    if (lines.length > 1) {
      // If the lexeme spans multiple lines (e.g., a block comment or whitespace)
      this.line += lines.length - 1;
      // The new column is the length of the final line segment + 1
      this.column = lines[lines.length - 1].length + 1;
    } else {
      // If it's on the same line, just shift the column over
      this.column += lexeme.length;
    }
  }
}