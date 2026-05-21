import { ASTNodeKind, type ASTNode } from "../AST/AST";
import { JackSpec } from '../../languages/jack/JackSpec';
import type { Token } from './Token';

export interface JackClassNode extends ASTNode {
  kind: typeof ASTNodeKind.CLASS;
  name: string;
  nameToken: Token;
  classVarDecs: JackClassVarDecNode[];
  subroutines: JackSubroutineNode[];
}

export type ClassVarKind = typeof JackSpec.STATIC | typeof JackSpec.FIELD;
export interface JackClassVarDecNode extends ASTNode {
  kind: typeof ASTNodeKind.VAR_DEC;
  varKind: ClassVarKind;
  type: string;
  typeToken: Token;
  names: string[];
//   nameTokens: Token[];
}

export type SubroutineKind =
  | typeof JackSpec.CONSTRUCTOR
  | typeof JackSpec.FUNCTION
  | typeof JackSpec.METHOD;

export interface JackSubroutineNode extends ASTNode {
  kind: typeof ASTNodeKind.SUBROUTINE;
  subroutineKind: SubroutineKind;
  returnType: string;
  returnTypeToken: Token; // <-- Added
  name: string;
  nameToken: Token; // <-- Added
  parameters: JackParameterNode[];
  body: JackSubroutineBodyNode;
}

export interface JackParameterNode extends ASTNode {
  type: string;
  typeToken: Token;
  name: string;
  nameToken: Token;
}

export interface JackSubroutineBodyNode extends ASTNode {
  varDecs: JackSubroutineVarDecNode[];
  statements: JackStatementNode[];
}

export type SubroutineVarKind = typeof JackSpec.VAR;
export interface JackSubroutineVarDecNode extends ASTNode {
  kind: typeof ASTNodeKind.VAR_DEC;
  varKind: SubroutineVarKind;
  type: string;
  typeToken: Token;
  names: string[];
//   nameTokens: Token[];
}

export type JackStatementNode =
  | JackLetStatementNode
  | JackIfStatementNode
  | JackWhileStatementNode
  | JackDoStatementNode
  | JackReturnStatementNode;

export interface JackLetStatementNode extends ASTNode {
  kind: typeof ASTNodeKind.STATEMENT;
  statementType: typeof JackSpec.LET;
  varName: string;
  varNameToken: Token; // <-- Added for precise assignment errors
  indexExpression?: JackExpressionNode;
  valueExpression: JackExpressionNode;
}

export interface JackIfStatementNode extends ASTNode {
  kind: typeof ASTNodeKind.STATEMENT;
  statementType: typeof JackSpec.IF;
  condition: JackExpressionNode;
  ifStatements: JackStatementNode[];
  elseStatements?: JackStatementNode[];
}

export interface JackWhileStatementNode extends ASTNode {
  kind: typeof ASTNodeKind.STATEMENT;
  statementType: typeof JackSpec.WHILE;
  condition: JackExpressionNode;
  statements: JackStatementNode[];
}

export interface JackDoStatementNode extends ASTNode {
  kind: typeof ASTNodeKind.STATEMENT;
  statementType: typeof JackSpec.DO;
  subroutineCall: JackSubroutineCallNode;
}

export interface JackReturnStatementNode extends ASTNode {
  kind: typeof ASTNodeKind.STATEMENT;
  statementType: typeof JackSpec.RETURN;
  expression?: JackExpressionNode;
}

export type JackExpressionNode =
  | JackIntegerLiteralNode
  | JackStringLiteralNode
  | JackKeywordLiteralNode
  | JackVariableTermNode
  | JackUnaryTermNode
  | JackSubroutineCallNode
  | JackParenthesizedExpressionNode
  | JackBinaryExpressionNode;

export class ExpressionNodeTypes {
  static readonly INTEGER = 'INTEGER';
  static readonly STRING = 'STRING';
  static readonly KEYWORD = 'KEYWORD';
  static readonly VAR_NAME = 'VAR_NAME';
  static readonly UNARY_OP = 'UNARY_OP';
  static readonly PAREN_EXPRESSION = 'PAREN_EXPRESSION';
  static readonly SUBROUTINE_CALL = 'SUBROUTINE_CALL';
  static readonly BINARY_EXPRESSION = 'BINARY_EXPRESSION';
}

export interface JackBinaryExpressionNode extends ASTNode {
  kind: typeof ASTNodeKind.EXPRESSION;
  type: typeof ExpressionNodeTypes.BINARY_EXPRESSION;
  term: JackExpressionNode;
  nextTerms: { op: string; term: JackExpressionNode }[];
}

export interface JackIntegerLiteralNode extends ASTNode {
  kind: typeof ASTNodeKind.TERM;
  type: typeof ExpressionNodeTypes.INTEGER;
  value: number;
}

export interface JackStringLiteralNode extends ASTNode {
  kind: typeof ASTNodeKind.TERM;
  type: typeof ExpressionNodeTypes.STRING;
  value: string;
}

export interface JackKeywordLiteralNode extends ASTNode {
  kind: typeof ASTNodeKind.TERM;
  type: typeof ExpressionNodeTypes.KEYWORD;
  keyword: string;
}

export interface JackVariableTermNode extends ASTNode {
  kind: typeof ASTNodeKind.TERM;
  type: typeof ExpressionNodeTypes.VAR_NAME;
  name: string;
  nameToken: Token;
  arrayIndex?: JackExpressionNode;
}

export interface JackUnaryTermNode extends ASTNode {
  kind: typeof ASTNodeKind.TERM;
  type: typeof ExpressionNodeTypes.UNARY_OP;
  op: string;
  term: JackExpressionNode;
}

export interface JackParenthesizedExpressionNode extends ASTNode {
  kind: typeof ASTNodeKind.TERM;
  type: typeof ExpressionNodeTypes.PAREN_EXPRESSION;
  expression: JackExpressionNode;
}

export interface JackSubroutineCallNode extends ASTNode {
  kind: typeof ASTNodeKind.TERM;
  type: typeof ExpressionNodeTypes.SUBROUTINE_CALL;
  target?: string;
  targetToken?: Token;
  methodName: string;
  methodNameToken: Token;
  arguments: JackExpressionNode[];
}