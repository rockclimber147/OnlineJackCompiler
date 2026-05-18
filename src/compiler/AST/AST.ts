import type { Token } from "../JackCompiler/Token";

export const ASTNodeKind = {
  PROGRAM: 'PROGRAM',

  CLASS: 'CLASS',
  SUBROUTINE: 'SUBROUTINE',
  VAR_DEC: 'VAR_DEC',
  STATEMENT: 'STATEMENT',
  EXPRESSION: 'EXPRESSION',
  PARAMS: 'PARAMS',
  TERM: 'TERM',

  VM_COMMAND: 'VM_COMMAND',

  INSTRUCTION: 'INSTRUCTION',
  LABEL: 'LABEL',

  CHIP_DEFINITION: 'CHIP_DEFINITION',
  PINS: 'PINS',
  PART: 'PART',
} as const;

export type ASTNodeKind = typeof ASTNodeKind[keyof typeof ASTNodeKind];

export interface ASTNode {
  kind: ASTNodeKind;
  startToken: Token;
  endToken: Token;
  children?: ASTNode[];
}