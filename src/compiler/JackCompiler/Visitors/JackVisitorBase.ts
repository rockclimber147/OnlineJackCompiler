import { VisitorBase } from '../../AST/VisitorBase';
import { type ASTNode, ASTNodeKind } from '../../AST/AST';
import * as JackAST from '../AST';
import { JackSpec } from '../../../languages/jack/JackSpec';

export abstract class JackVisitorTopLevel<T> extends VisitorBase<T> {
  public override visit(node: ASTNode): T {
    switch (node.kind) {
      case ASTNodeKind.CLASS:
        return this.visitClass(node as JackAST.JackClassNode);
      case ASTNodeKind.SUBROUTINE:
        return this.visitSubroutine(node as JackAST.JackSubroutineNode);
      case ASTNodeKind.VAR_DEC:
        return this.visitVarDec(
          node as JackAST.JackClassVarDecNode | JackAST.JackSubroutineVarDecNode,
        );
      default:
        throw new Error(`JackVisitor does not support node kind: ${ASTNodeKind[node.kind]}`);
    }
  }

  protected abstract visitClass(node: JackAST.JackClassNode): T;
  protected abstract visitSubroutine(node: JackAST.JackSubroutineNode): T;
  protected abstract visitVarDec(
    node: JackAST.JackClassVarDecNode | JackAST.JackSubroutineVarDecNode,
  ): T;
}

export abstract class JackVisitorAll<T> extends JackVisitorTopLevel<T> {
  public override visit(node: ASTNode): T {
    switch (node.kind) {
      case ASTNodeKind.STATEMENT:
        return this.visitStatement(node as JackAST.JackStatementNode);
      case ASTNodeKind.EXPRESSION:
      case ASTNodeKind.TERM:
        return this.visitExpression(node as JackAST.JackExpressionNode);
      case ASTNodeKind.CLASS:
      case ASTNodeKind.SUBROUTINE:
      case ASTNodeKind.VAR_DEC:
        return super.visit(node);
      default:
        throw new Error(`JackVisitorAll does not support node kind: ${ASTNodeKind[node.kind]}`);
    }
  }

  // --- Statement Dispatcher ---
  protected visitStatement(node: JackAST.JackStatementNode): T {
    switch (node.statementType) {
      case JackSpec.LET:
        return this.visitLetStatement(node as JackAST.JackLetStatementNode);
      case JackSpec.IF:
        return this.visitIfStatement(node as JackAST.JackIfStatementNode);
      case JackSpec.WHILE:
        return this.visitWhileStatement(node as JackAST.JackWhileStatementNode);
      case JackSpec.DO:
        return this.visitDoStatement(node as JackAST.JackDoStatementNode);
      case JackSpec.RETURN:
        return this.visitReturnStatement(node as JackAST.JackReturnStatementNode);
      default:
        throw new Error(`Unknown statement type: ${(node as any).statementType}`);
    }
  }

  // --- Expression/Term Dispatcher ---
  protected visitExpression(node: JackAST.JackExpressionNode): T {
    switch (node.type) {
      case JackAST.ExpressionNodeTypes.BINARY_EXPRESSION:
        return this.visitBinaryExpression(node as JackAST.JackBinaryExpressionNode);
      case JackAST.ExpressionNodeTypes.INTEGER:
        return this.visitIntegerLiteral(node as JackAST.JackIntegerLiteralNode);
      case JackAST.ExpressionNodeTypes.STRING:
        return this.visitStringLiteral(node as JackAST.JackStringLiteralNode);
      case JackAST.ExpressionNodeTypes.KEYWORD:
        return this.visitKeywordLiteral(node as JackAST.JackKeywordLiteralNode);
      case JackAST.ExpressionNodeTypes.VAR_NAME:
        return this.visitVariable(node as JackAST.JackVariableTermNode);
      case JackAST.ExpressionNodeTypes.UNARY_OP:
        return this.visitUnaryExpression(node as JackAST.JackUnaryTermNode);
      case JackAST.ExpressionNodeTypes.PAREN_EXPRESSION:
        return this.visitParenthesizedExpression(node as JackAST.JackParenthesizedExpressionNode);
      case JackAST.ExpressionNodeTypes.SUBROUTINE_CALL:
        return this.visitSubroutineCall(node as JackAST.JackSubroutineCallNode);
      default:
        throw new Error(`Unknown expression type: ${(node as any).type}`);
    }
  }

  protected abstract visitLetStatement(node: JackAST.JackLetStatementNode): T;
  protected abstract visitIfStatement(node: JackAST.JackIfStatementNode): T;
  protected abstract visitWhileStatement(node: JackAST.JackWhileStatementNode): T;
  protected abstract visitDoStatement(node: JackAST.JackDoStatementNode): T;
  protected abstract visitReturnStatement(node: JackAST.JackReturnStatementNode): T;

  protected abstract visitBinaryExpression(node: JackAST.JackBinaryExpressionNode): T;
  protected abstract visitIntegerLiteral(node: JackAST.JackIntegerLiteralNode): T;
  protected abstract visitStringLiteral(node: JackAST.JackStringLiteralNode): T;
  protected abstract visitKeywordLiteral(node: JackAST.JackKeywordLiteralNode): T;
  protected abstract visitVariable(node: JackAST.JackVariableTermNode): T;
  protected abstract visitUnaryExpression(node: JackAST.JackUnaryTermNode): T;
  protected abstract visitParenthesizedExpression(node: JackAST.JackParenthesizedExpressionNode): T;
  protected abstract visitSubroutineCall(node: JackAST.JackSubroutineCallNode): T;
}
