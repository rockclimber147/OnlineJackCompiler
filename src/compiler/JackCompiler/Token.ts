import type { TokenType } from "../../languages/jack/JackSpec";

export interface Token {
  type: TokenType;
  lexeme: string;
  line: number;
  column: number;
}