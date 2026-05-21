import { type Token, TokenType } from './Token';
import { TokenValidator } from './TokenValidator';
import { JackSpec } from '../../languages/jack/JackSpec';
import {
  type JackClassNode,
  type JackClassVarDecNode,
  type ClassVarKind,
  type JackSubroutineNode,
  type SubroutineKind,
  type JackParameterNode,
  type JackSubroutineBodyNode,
  type SubroutineVarKind,
  type JackSubroutineVarDecNode,
  type JackStatementNode,
  type JackLetStatementNode,
  type JackExpressionNode,
  type JackIfStatementNode,
  type JackWhileStatementNode,
  type JackReturnStatementNode,
  type JackDoStatementNode,
  type JackSubroutineCallNode,
  ExpressionNodeTypes,
} from './AST';
import { ASTNodeKind } from '../AST/AST';

export abstract class BaseParser<T_AST> {
  protected validator: TokenValidator;

  constructor(tokens: Token[]) {
    this.validator = new TokenValidator(tokens);
  }

  abstract parse(fileName: string): T_AST;

  protected check(type: TokenType, lexeme?: string): boolean {
    const token = this.validator.peek(0);
    if (token.type === TokenType.EOF) return false;
    if (lexeme) return token.type === type && token.lexeme === lexeme;
    return token.type === type;
  }

  protected match(type: TokenType, lexeme?: string): boolean {
    if (this.check(type, lexeme)) {
      this.validator.expectType(type);
      return true;
    }
    return false;
  }

  protected skipNewlines(): void {
    while (this.check(TokenType.NEWLINE)) {
      this.validator.expectType(TokenType.NEWLINE);
    }
  }
}


export class JackParser extends BaseParser<JackClassNode> {
  public parse(fileName: string): JackClassNode {
    return this.parseClass(fileName);
  }

  private parseClass(fileName: string): JackClassNode {
    const startToken = this.validator.expectLexeme(JackSpec.CLASS);
    const classToken = this.validator.expectLexeme(fileName)
    const className = classToken.lexeme;

    this.validator.expectLexeme(JackSpec.L_BRACE);

    const classVarDecs: JackClassVarDecNode[] = [];
    const subroutines: JackSubroutineNode[] = [];

    while (
      this.check(TokenType.KEYWORD, JackSpec.STATIC) ||
      this.check(TokenType.KEYWORD, JackSpec.FIELD)
    ) {
      classVarDecs.push(this.parseClassVarDec());
    }

    while (
      this.check(TokenType.KEYWORD, JackSpec.CONSTRUCTOR) ||
      this.check(TokenType.KEYWORD, JackSpec.FUNCTION) ||
      this.check(TokenType.KEYWORD, JackSpec.METHOD)
    ) {
      subroutines.push(this.parseSubroutine());
    }

    const endToken = this.validator.expectLexeme(JackSpec.R_BRACE);

    return {
      kind: ASTNodeKind.CLASS,
      startToken,
      endToken,
      name: className,
      nameToken: startToken,
      classVarDecs,
      subroutines,
    };
  }

  private parseClassVarDec(): JackClassVarDecNode {
    const varKinds = new Set([JackSpec.STATIC, JackSpec.FIELD]);
    const startToken = this.validator.expectOneOfLexemes(varKinds);
    const varKind = startToken.lexeme as ClassVarKind;

    let type: string;
    const next = this.validator.peek();
    if (next.type === TokenType.KEYWORD) {
      type = this.validator.expectOneOfLexemes(JackSpec.TYPES).lexeme;
    } else {
      type = this.validator.expectType(TokenType.IDENTIFIER).lexeme;
    }

    const nameTokens: Token[] = [];
    const names: string[] = [];
    let identifierToken = this.validator.expectType(TokenType.IDENTIFIER);

    nameTokens.push(identifierToken)
    names.push(identifierToken.lexeme);

    while (this.match(TokenType.SYMBOL, JackSpec.COMMA)) {
      identifierToken = this.validator.expectType(TokenType.IDENTIFIER);
      nameTokens.push(identifierToken)
      names.push(identifierToken.lexeme);
    }

    const endToken = this.validator.expectLexeme(JackSpec.SEMI);

    return {
      kind: ASTNodeKind.VAR_DEC,
      startToken,
      typeToken: next,
      endToken,
      varKind,
      type,
      names,
      nameTokens
    };
  }

  /**
   * ('constructor'|'function'|'method') ('void'|type) subroutineName '(' parameterList ')' subroutineBody
   */
  private parseSubroutine(): JackSubroutineNode {
    const subroutineKinds = new Set([JackSpec.CONSTRUCTOR, JackSpec.METHOD, JackSpec.FUNCTION]);
    const startToken = this.validator.expectOneOfLexemes(subroutineKinds);
    const subroutineKind = startToken.lexeme as SubroutineKind;

    let returnType: string;
    const next = this.validator.peek();
    if (next.type === TokenType.KEYWORD) {
      returnType = this.validator.expectOneOfLexemes(JackSpec.RETURN_TYPES).lexeme;
    } else {
      returnType = this.validator.expectType(TokenType.IDENTIFIER).lexeme;
    }

    const subroutineNameToken = this.validator.expectType(TokenType.IDENTIFIER);
    const parameters: JackParameterNode[] = this.parseParameterList();
    const body: JackSubroutineBodyNode = this.parseSubroutineBody();
    return {
      kind: ASTNodeKind.SUBROUTINE,
      startToken: startToken,
      returnTypeToken: next,
      nameToken: subroutineNameToken,
      subroutineKind: subroutineKind,
      name: subroutineNameToken.lexeme,
      returnType: returnType,
      parameters: parameters,
      body: body,
      endToken: body.endToken,
    };
  }

  private parseParameterList(): JackParameterNode[] {
    const params: JackParameterNode[] = [];

    this.validator.expectLexeme(JackSpec.L_PAREN);

    if (!this.check(TokenType.SYMBOL, JackSpec.R_PAREN)) {
      do {
        const paramStart = this.validator.peek(0);

        let type: Token;
        if (this.check(TokenType.KEYWORD)) {
          type = this.validator.expectOneOfLexemes(JackSpec.TYPES);
        } else {
          type = this.validator.expectType(TokenType.IDENTIFIER);
        }

        const nameToken = this.validator.expectType(TokenType.IDENTIFIER);
        const name = nameToken.lexeme;

        params.push({
          kind: ASTNodeKind.PARAMS,
          startToken: paramStart,
          typeToken: type,
          nameToken: nameToken,
          endToken: nameToken,
          type: type.lexeme,
          name: name,
        });
      } while (this.match(TokenType.SYMBOL, JackSpec.COMMA));
    }

    this.validator.expectLexeme(JackSpec.R_PAREN);
    return params;
  }

  private parseSubroutineBody(): JackSubroutineBodyNode {
    const startToken = this.validator.expectLexeme(JackSpec.L_BRACE);
    const subroutineVarDecs: JackSubroutineVarDecNode[] = [];
    while (this.check(TokenType.KEYWORD, JackSpec.VAR)) {
      subroutineVarDecs.push(this.parseSubroutineVarDec());
    }
    const subroutineStatements: JackStatementNode[] = [];
    while (JackSpec.STATEMENTS.has(this.validator.peek().lexeme)) {
      subroutineStatements.push(this.parseStatement());
    }
    const endToken = this.validator.expectLexeme(JackSpec.R_BRACE);
    return {
      kind: ASTNodeKind.SUBROUTINE,
      startToken: startToken,
      varDecs: subroutineVarDecs,
      statements: subroutineStatements,
      endToken: endToken,
    };
  }

  private parseSubroutineVarDec(): JackSubroutineVarDecNode {
    const startToken = this.validator.expectLexeme(JackSpec.VAR);
    const varKind = startToken.lexeme as SubroutineVarKind;

    let type: string;
    const next = this.validator.peek();
    if (next.type === TokenType.KEYWORD) {
      type = this.validator.expectOneOfLexemes(JackSpec.TYPES).lexeme;
    } else {
      type = this.validator.expectType(TokenType.IDENTIFIER).lexeme;
    }

    const nameTokens: Token[] = [];
    const names: string[] = [];
    let identifierToken = this.validator.expectType(TokenType.IDENTIFIER);

    nameTokens.push(identifierToken)
    names.push(identifierToken.lexeme);

    while (this.match(TokenType.SYMBOL, JackSpec.COMMA)) {
      identifierToken = this.validator.expectType(TokenType.IDENTIFIER);
      nameTokens.push(identifierToken)
      names.push(identifierToken.lexeme);
    }

    const endToken = this.validator.expectLexeme(JackSpec.SEMI);

    return {
      kind: ASTNodeKind.VAR_DEC,
      startToken,
      typeToken: next,
      endToken,
      varKind,
      type,
      names,
      nameTokens
    };
  }

  private parseStatement(): JackStatementNode {
    const token = this.validator.peek(0);

    switch (token.lexeme) {
      case JackSpec.LET:
        return this.parseLet();
      case JackSpec.IF:
        return this.parseIf();
      case JackSpec.WHILE:
        return this.parseWhile();
      case JackSpec.RETURN:
        return this.parseReturn();
      case JackSpec.DO:
        return this.parseDo();
    }
    this.validator.throwCompilerError(token, 'Expected statement');
  }

  private parseLet(): JackLetStatementNode {
    const startToken = this.validator.expectLexeme(JackSpec.LET);
    const varToken = this.validator.expectType(TokenType.IDENTIFIER);

    let indexExpression: JackExpressionNode | undefined;
    if (this.match(TokenType.SYMBOL, JackSpec.L_BRACKET)) {
      indexExpression = this.parseExpression();
      this.validator.expectLexeme(JackSpec.R_BRACKET);
    }

    this.validator.expectLexeme(JackSpec.EQ);
    const valueExpression = this.parseExpression();
    const endToken = this.validator.expectLexeme(JackSpec.SEMI);

    return {
      kind: ASTNodeKind.STATEMENT,
      statementType: JackSpec.LET,
      startToken,
      varNameToken: varToken,
      endToken,
      varName: varToken.lexeme,
      indexExpression,
      valueExpression,
    };
  }

  private parseIf(): JackIfStatementNode {
    const startToken = this.validator.expectLexeme(JackSpec.IF);

    this.validator.expectLexeme(JackSpec.L_PAREN);
    const condition = this.parseExpression();
    this.validator.expectLexeme(JackSpec.R_PAREN);

    this.validator.expectLexeme(JackSpec.L_BRACE);
    const ifStatements: JackStatementNode[] = [];
    while (!this.check(TokenType.SYMBOL, JackSpec.R_BRACE)) {
      ifStatements.push(this.parseStatement());
    }
    let endToken = this.validator.expectLexeme(JackSpec.R_BRACE);

    let elseStatements: JackStatementNode[] | undefined;
    if (this.match(TokenType.KEYWORD, JackSpec.ELSE)) {
      this.validator.expectLexeme(JackSpec.L_BRACE);
      elseStatements = [];
      while (!this.check(TokenType.SYMBOL, JackSpec.R_BRACE)) {
        elseStatements.push(this.parseStatement());
      }
      endToken = this.validator.expectLexeme(JackSpec.R_BRACE);
    }

    return {
      kind: ASTNodeKind.STATEMENT,
      statementType: JackSpec.IF,
      startToken,
      endToken,
      condition,
      ifStatements: ifStatements,
      elseStatements: elseStatements,
    };
  }

  private parseWhile(): JackWhileStatementNode {
    const startToken = this.validator.expectLexeme(JackSpec.WHILE);

    this.validator.expectLexeme(JackSpec.L_PAREN);
    const condition = this.parseExpression();
    this.validator.expectLexeme(JackSpec.R_PAREN);

    this.validator.expectLexeme(JackSpec.L_BRACE);
    const statements: JackStatementNode[] = [];
    while (!this.check(TokenType.SYMBOL, JackSpec.R_BRACE)) {
      statements.push(this.parseStatement());
    }
    const endToken = this.validator.expectLexeme(JackSpec.R_BRACE);

    return {
      kind: ASTNodeKind.STATEMENT,
      statementType: JackSpec.WHILE,
      startToken,
      endToken,
      condition,
      statements,
    };
  }

  private parseReturn(): JackReturnStatementNode {
    const startToken = this.validator.expectLexeme(JackSpec.RETURN);

    let expression: JackExpressionNode | undefined;
    if (!this.check(TokenType.SYMBOL, JackSpec.SEMI)) {
      expression = this.parseExpression();
    }

    const endToken = this.validator.expectLexeme(JackSpec.SEMI);

    return {
      kind: ASTNodeKind.STATEMENT,
      statementType: JackSpec.RETURN,
      startToken,
      endToken,
      expression,
    };
  }

  private parseDo(): JackDoStatementNode {
    const startToken = this.validator.expectLexeme(JackSpec.DO);
    const subroutineCall = this.parseSubroutineCall();
    const endToken = this.validator.expectLexeme(JackSpec.SEMI);

    return {
      kind: ASTNodeKind.STATEMENT,
      statementType: JackSpec.DO,
      startToken: startToken,
      subroutineCall: subroutineCall,
      endToken: endToken,
    };
  }

private parseSubroutineCall(): JackSubroutineCallNode {
    const startToken = this.validator.peek(0);
    const firstToken = this.validator.expectType(TokenType.IDENTIFIER);
    let target: string | undefined;
    let targetToken: Token | undefined;
    let methodName: string;
    let methodNameToken: Token;

    if (this.match(TokenType.SYMBOL, JackSpec.DOT)) {
      target = firstToken.lexeme;
      targetToken = firstToken;
    
      const secondToken = this.validator.expectType(TokenType.IDENTIFIER);
      methodName = secondToken.lexeme;
      methodNameToken = secondToken;
    } else {
      target = undefined;
      targetToken = undefined;
      
      methodName = firstToken.lexeme;
      methodNameToken = firstToken;
    }

    this.validator.expectLexeme(JackSpec.L_PAREN);
    const args = this.parseExpressionList();
    const endToken = this.validator.expectLexeme(JackSpec.R_PAREN);

    return {
      kind: ASTNodeKind.TERM,
      type: ExpressionNodeTypes.SUBROUTINE_CALL,
      startToken,
      endToken,
      target,
      targetToken, // Pass the token!
      methodName,
      methodNameToken, // Pass the token!
      arguments: args,
    };
  }

  private parseExpressionList(): JackExpressionNode[] {
    const expressions: JackExpressionNode[] = [];

    if (this.check(TokenType.SYMBOL, JackSpec.R_PAREN)) {
      return expressions;
    }

    expressions.push(this.parseExpression());
    while (this.match(TokenType.SYMBOL, JackSpec.COMMA)) {
      expressions.push(this.parseExpression());
    }

    return expressions;
  }

  private parseExpression(): JackExpressionNode {
    const startToken = this.validator.peek(0);
    const term = this.parseTerm();
    const nextTerms: { op: string; term: JackExpressionNode }[] = [];

    while (this.check(TokenType.SYMBOL) && JackSpec.OP.has(this.validator.peek(0).lexeme)) {
      const op = this.validator.expectOneOfLexemes(JackSpec.OP).lexeme;
      const nextTerm = this.parseTerm();
      nextTerms.push({ op, term: nextTerm });
    }

    return {
      kind: ASTNodeKind.EXPRESSION,
      type: ExpressionNodeTypes.BINARY_EXPRESSION,
      startToken,
      endToken:
        nextTerms.length > 0 ? nextTerms[nextTerms.length - 1].term.endToken : term.endToken,
      term,
      nextTerms,
    };
  }

  private parseTerm(): JackExpressionNode {
    const token = this.validator.peek(0);
    if (this.match(TokenType.INT)) {
      return {
        kind: ASTNodeKind.TERM,
        type: ExpressionNodeTypes.INTEGER,
        value: Number(token.lexeme),
        startToken: token,
        endToken: token,
      };
    }
    if (this.match(TokenType.STRING)) {
      const content = token.lexeme.slice(1, -1);
      return {
        kind: ASTNodeKind.TERM,
        type: ExpressionNodeTypes.STRING,
        value: content,
        startToken: token,
        endToken: token,
      };
    }

    const keywordConstants = new Set([JackSpec.TRUE, JackSpec.FALSE, JackSpec.NULL, JackSpec.THIS]);
    if (token.type === TokenType.KEYWORD && keywordConstants.has(token.lexeme)) {
      this.validator.advance();
      return {
        kind: ASTNodeKind.TERM,
        type: ExpressionNodeTypes.KEYWORD,
        keyword: token.lexeme,
        startToken: token,
        endToken: token,
      };
    }

    if (this.check(TokenType.SYMBOL) && JackSpec.UNARY_OP.has(token.lexeme)) {
      const op = this.validator.advance().lexeme;
      const term = this.parseTerm(); // Recursive call
      return {
        kind: ASTNodeKind.TERM,
        type: ExpressionNodeTypes.UNARY_OP,
        op,
        term,
        startToken: token,
        endToken: term.endToken,
      };
    }

    if (this.match(TokenType.SYMBOL, JackSpec.L_PAREN)) {
      const expression = this.parseExpression();
      const endToken = this.validator.expectLexeme(JackSpec.R_PAREN);
      return {
        kind: ASTNodeKind.TERM,
        type: ExpressionNodeTypes.PAREN_EXPRESSION,
        expression,
        startToken: token,
        endToken,
      };
    }

    if (token.type === TokenType.IDENTIFIER) {
      const nextToken = this.validator.peek(1);

      if (nextToken.lexeme === JackSpec.L_BRACKET) {
        const nameToken = this.validator.advance();
        this.validator.expectLexeme(JackSpec.L_BRACKET);
        const indexExpression = this.parseExpression();
        const endToken = this.validator.expectLexeme(JackSpec.R_BRACKET);
        return {
          kind: ASTNodeKind.TERM,
          type: ExpressionNodeTypes.VAR_NAME,
          name: nameToken.lexeme,
          nameToken,
          arrayIndex: indexExpression,
          startToken: token,
          endToken,
        };
      }

      if (nextToken.lexeme === JackSpec.L_PAREN || nextToken.lexeme === JackSpec.DOT) {
        return this.parseSubroutineCall();
      }

      this.validator.advance();
      return {
        kind: ASTNodeKind.TERM,
        type: ExpressionNodeTypes.VAR_NAME,
        nameToken: token,
        name: token.lexeme,
        startToken: token,
        endToken: token,
      };
    }

    this.validator.throwCompilerError(token, `Unexpected token in term: ${token.lexeme}`);
  }
}
