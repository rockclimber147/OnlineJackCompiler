export const TokenType = {
  KEYWORD: 'KEYWORD',
  SYMBOL: 'SYMBOL',
  IDENTIFIER: 'IDENTIFIER',
  INT: 'INT',
  STRING: 'STRING',
  NEWLINE: 'NEWLINE',
  SKIP: 'SKIP',
  EOF: 'EOF',
} as const;

export type TokenType = typeof TokenType[keyof typeof TokenType];

export interface Token {
  type: TokenType;
  lexeme: string;
  line: number;
  column: number;
}