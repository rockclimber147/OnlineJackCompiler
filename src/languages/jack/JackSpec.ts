import { TokenType } from "../../compiler/JackCompiler/Token";

export const JackTokenMatcher: [RegExp, TokenType][] = [
  [/^\/\/.*/, TokenType.SKIP],
  [/^\/\*[\s\S]*?\*\//, TokenType.SKIP],
  [/^\s+/, TokenType.SKIP],
  [
    /^(class|constructor|method|function|int|boolean|char|void|var|static|field|let|do|if|else|while|return|true|false|null|this)\b/,
    TokenType.KEYWORD,
  ],
  [/^[{}()\[\].,;+\-*/&|<>=~]/, TokenType.SYMBOL],
  [/^\d+/, TokenType.INT],
  [/^"[^"]*"/, TokenType.STRING],
  [/^[a-zA-Z_][a-zA-Z0-9_]*/, TokenType.IDENTIFIER],
];

export class JackSpec {
  static readonly L_BRACE = '{';
  static readonly R_BRACE = '}';
  static readonly L_PAREN = '(';
  static readonly R_PAREN = ')';
  static readonly L_BRACKET = '[';
  static readonly R_BRACKET = ']';
  static readonly DOT = '.';
  static readonly COMMA = ',';
  static readonly SEMI = ';';
  static readonly PLUS = '+';
  static readonly MINUS = '-';
  static readonly MULT = '*';
  static readonly DIV = '/';
  static readonly AND = '&';
  static readonly OR = '|';
  static readonly LT = '<';
  static readonly GT = '>';
  static readonly EQ = '=';
  static readonly NOT = '~';

  static readonly SYMBOLS = new Set([
    JackSpec.L_BRACE,
    JackSpec.R_BRACE,
    JackSpec.L_PAREN,
    JackSpec.R_PAREN,
    JackSpec.L_BRACKET,
    JackSpec.R_BRACKET,
    JackSpec.DOT,
    JackSpec.COMMA,
    JackSpec.SEMI,
    JackSpec.PLUS,
    JackSpec.MINUS,
    JackSpec.MULT,
    JackSpec.DIV,
    JackSpec.AND,
    JackSpec.OR,
    JackSpec.LT,
    JackSpec.GT,
    JackSpec.EQ,
    JackSpec.NOT,
  ]);

  // --- Keywords ---
  // Program structure
  static readonly CLASS = 'class';
  static readonly CONSTRUCTOR = 'constructor';
  static readonly METHOD = 'method';
  static readonly FUNCTION = 'function';

  // Types
  static readonly INT = 'int';
  static readonly BOOLEAN = 'boolean';
  static readonly CHAR = 'char';
  static readonly VOID = 'void';

  // Variable declarations
  static readonly VAR = 'var';
  static readonly STATIC = 'static';
  static readonly FIELD = 'field';

  // Statements
  static readonly LET = 'let';
  static readonly DO = 'do';
  static readonly IF = 'if';
  static readonly ELSE = 'else';
  static readonly WHILE = 'while';
  static readonly RETURN = 'return';

  // Constants & This
  static readonly TRUE = 'true';
  static readonly FALSE = 'false';
  static readonly NULL = 'null';
  static readonly THIS = 'this';

  static readonly KEYWORDS = new Set([
    JackSpec.CLASS,
    JackSpec.CONSTRUCTOR,
    JackSpec.METHOD,
    JackSpec.FUNCTION,
    JackSpec.INT,
    JackSpec.BOOLEAN,
    JackSpec.CHAR,
    JackSpec.VOID,
    JackSpec.VAR,
    JackSpec.STATIC,
    JackSpec.FIELD,
    JackSpec.LET,
    JackSpec.DO,
    JackSpec.IF,
    JackSpec.ELSE,
    JackSpec.WHILE,
    JackSpec.RETURN,
    JackSpec.TRUE,
    JackSpec.FALSE,
    JackSpec.NULL,
    JackSpec.THIS,
  ]);

  // --- Useful Subsets for the Parser ---
  static readonly STATEMENTS = new Set([
    JackSpec.LET,
    JackSpec.DO,
    JackSpec.IF,
    JackSpec.WHILE,
    JackSpec.RETURN,
  ]);

  static readonly TYPES = new Set([JackSpec.INT, JackSpec.BOOLEAN, JackSpec.CHAR]);

  static readonly RETURN_TYPES = new Set([...this.TYPES, this.VOID]);

  static readonly OP = new Set([
    JackSpec.PLUS,
    JackSpec.MINUS,
    JackSpec.MULT,
    JackSpec.DIV,
    JackSpec.AND,
    JackSpec.OR,
    JackSpec.LT,
    JackSpec.GT,
    JackSpec.EQ,
  ]);

  static readonly UNARY_OP = new Set([JackSpec.MINUS, JackSpec.NOT]);
}