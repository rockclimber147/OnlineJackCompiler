import { type Token } from './Token';
import { CompilerError } from '../Errors';
import { TokenType } from './Token';

export class TokenValidator {
  private tokens: Token[];
  private cursor: number = 0;
  public constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  public peek(offset: number = 0): Token {
    const index = this.cursor + offset;
    if (index >= this.tokens.length) {
      throw new Error('Peeking past token stream termination');
    }
    return this.tokens[index];
  }

  public expectType(type: TokenType): Token {
    const next: Token = this.advance();
    if (next.type != type) {
      this.throwCompilerError(next, `Expected type ${type}`);
    }
    return next;
  }

  public expectOneOfTypes(types: Set<TokenType>): Token {
    const next: Token = this.advance();
    if (!types.has(next.type)) {
      this.throwCompilerError(next, `Expected one of types ${this.formatSet(types)}`);
    }
    return next;
  }

  public expectLexeme(lexeme: string): Token {
    const next: Token = this.advance();
    if (next.lexeme != lexeme) {
      this.throwCompilerError(next, `Expected ${lexeme}`);
    }
    return next;
  }

  public expectOneOfLexemes(lexemes: Set<string>): Token {
    const next: Token = this.advance();
    if (!lexemes.has(next.lexeme)) {
      this.throwCompilerError(next, `Expected one of lexemes: [${this.formatSet(lexemes)}]`);
    }
    return next;
  }

  public throwCompilerError(t: Token, message: string): never {
    throw new CompilerError(t, message);
  }

  public advance(): Token {
    if (this.cursor >= this.tokens.length) {
      return {
        type: TokenType.EOF,
        lexeme: '',
        line: -1,
        column: -1,
      };
    }
    return this.tokens[this.cursor++];
  }

  private formatSet(set: Set<string | TokenType>): string {
    return [...set].join(', ');
  }
}
