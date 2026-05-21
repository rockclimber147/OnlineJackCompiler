import type {
  JackLetStatementNode,
  JackIfStatementNode,
  JackWhileStatementNode,
  JackDoStatementNode,
  JackReturnStatementNode,
  JackBinaryExpressionNode,
  JackVariableTermNode,
  JackUnaryTermNode,
  JackParenthesizedExpressionNode,
  JackSubroutineCallNode,
  JackClassNode,
  JackSubroutineNode,
} from '../../AST';
import { JackVisitorAll } from '../JackVisitorBase';
import { GlobalSymbolTable } from '../../SymbolTable';
import { JackCompilerError } from '../../../Errors';

export class JackSemanticVisitor extends JackVisitorAll<void> {
  private errors: JackCompilerError[] = [];
  private newErrors: JackCompilerError[] = [];
  private currentClassName: string = '';
  private currentSubroutineName: string = '';
  private table: GlobalSymbolTable
  constructor(table: GlobalSymbolTable) {
    super();
    this.table = table;
  }

  public getErrors(): JackCompilerError[] {
    return this.errors;
  }

  public getErrorsForCurrentPass() {
    return [...this.newErrors];
  }

  protected override visitClass(node: JackClassNode): void {
    this.currentClassName = node.name;
    this.newErrors = [];
    node.classVarDecs?.forEach((varDec) => this.visit(varDec));
    node.subroutines.forEach((subroutine) => this.visit(subroutine));
    this.errors.push(...this.newErrors);
    this.currentClassName = '';
  }

  protected override visitSubroutine(node: JackSubroutineNode): void {
    this.currentSubroutineName = node.name;

    this.visitMany(node.body.varDecs);
    this.visitMany(node.body.statements);

    this.currentSubroutineName = '';
  }

  protected visitLetStatement(node: JackLetStatementNode): void {
    const error = this.table.validateVar(
      node.varName,
      this.currentClassName,
      this.currentSubroutineName,
    );
    if (error) this.newErrors.push(new JackCompilerError(node.endToken, error));
    if (node.indexExpression) this.visit(node.indexExpression);
    this.visit(node.valueExpression);
  }
  protected visitIfStatement(node: JackIfStatementNode): void {
    this.visit(node.condition);
    node.ifStatements?.forEach((statement) => this.visit(statement));
    node.elseStatements?.forEach((statement) => this.visit(statement));
  }
  protected visitWhileStatement(node: JackWhileStatementNode): void {
    this.visit(node.condition);
    node.statements?.forEach((statement) => this.visit(statement));
  }
  protected visitDoStatement(node: JackDoStatementNode): void {
    this.visit(node.subroutineCall);
  }
  protected visitReturnStatement(node: JackReturnStatementNode): void {
    if (node.expression) this.visit(node.expression);
  }
  protected visitBinaryExpression(node: JackBinaryExpressionNode): void {
    this.visit(node.term);
    node.nextTerms.forEach((expr) => this.visit(expr.term));
  }
  protected visitVariable(node: JackVariableTermNode): void {
    const error = this.table.validateVar(
      node.name,
      this.currentClassName,
      this.currentSubroutineName,
    );
    if (error) this.newErrors.push(new JackCompilerError(node.endToken, error));
    if (node.arrayIndex) {
      this.visit(node.arrayIndex);
    }
  }
  protected visitUnaryExpression(node: JackUnaryTermNode): void {
    this.visit(node.term);
  }
  protected visitParenthesizedExpression(node: JackParenthesizedExpressionNode): void {
    this.visit(node.expression);
  }
  protected visitSubroutineCall(node: JackSubroutineCallNode): void {
    const error = this.table.validateSubroutineCall(
      node.methodName,
      this.currentClassName,
      this.currentSubroutineName,
      node.target,
    );
    if (error) this.newErrors.push(new JackCompilerError(node.endToken, error));
    node.arguments?.forEach((argExpr) => this.visit(argExpr));
  }

  protected visitIntegerLiteral(): void {}
  protected visitStringLiteral(): void {}
  protected visitKeywordLiteral(): void {}
  protected override visitVarDec(node: any): void {
    const typeName = typeof node.type === 'string' ? node.type : node.type.lexeme;
    
    const error = this.table.validateType(typeName);
    
    if (error) {
      this.newErrors.push(new JackCompilerError(node.endToken, error));
    }
  }
}
