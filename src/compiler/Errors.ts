import { type Token } from './JackCompiler/Token';

export class JackCompilerError extends Error {
  public readonly token: Token;
  public readonly line: number;
  public readonly column: number;
  public readonly lexeme: string;

  constructor(
    token: Token,
    message: string,
  ) {
    const fullMessage = `[Line ${token.line}:${token.column}] ${message} (Found ${token.type}: '${token.lexeme}')`;
    super(fullMessage);

    this.name = 'CompilerError';
    this.token = token; 
    this.line = token.line;
    this.column = token.column;
    this.lexeme = token.lexeme;

    Object.setPrototypeOf(this, JackCompilerError.prototype);
  }
}