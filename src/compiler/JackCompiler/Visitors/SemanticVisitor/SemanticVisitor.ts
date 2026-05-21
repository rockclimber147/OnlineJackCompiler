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
  JackStatementNode,
} from '../../AST';
import { JackVisitorAll } from '../JackVisitorBase';
import { GlobalSymbolTable } from '../../SymbolTable';
import { JackCompilerError } from '../../../Errors';
import { JackSpec } from '../../../../languages/jack/JackSpec';

export class JackSemanticVisitor extends JackVisitorAll<void> {
  private errors: JackCompilerError[] = [];
  private newErrors: JackCompilerError[] = [];
  private currentClassName: string = '';
  private currentSubroutineName: string = '';
  private table: GlobalSymbolTable;

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

    const guaranteesReturn = this.doesBlockReturn(node.body.statements);

    if (!guaranteesReturn) {
      this.newErrors.push(new JackCompilerError(
        node.nameToken || node.startToken,
        `Semantic Error: Subroutine '${node.name}' does not return a value in all control paths.`
      ));
    }

    this.currentSubroutineName = '';
  }

  protected visitLetStatement(node: JackLetStatementNode): void {
    const error = this.table.validateVar(
      node.varName,
      this.currentClassName,
      this.currentSubroutineName,
    );
    if (error) {
      // IDE target: The exact variable name being assigned
      this.newErrors.push(new JackCompilerError(node.varNameToken, error));
    }
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
    if (error) {
      // IDE target: The exact variable being used
      this.newErrors.push(new JackCompilerError(node.nameToken, error));
    }
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
    if (error) {
      const token = node.targetToken || node.methodNameToken;
      this.newErrors.push(new JackCompilerError(token, error));
    }
    node.arguments?.forEach((argExpr) => this.visit(argExpr));
  }

  protected visitIntegerLiteral(): void {}
  protected visitStringLiteral(): void {}
  protected visitKeywordLiteral(): void {}

  protected override visitVarDec(node: any): void {
    const typeName = typeof node.type === 'string' ? node.type : node.type.lexeme;
    
    const error = this.table.validateType(typeName);
    
    if (error) {
      // IDE target: The undefined type name ('Unknown')
      this.newErrors.push(new JackCompilerError(node.typeToken, error));
    }
  }

  private doesBlockReturn(statements: JackStatementNode[]): boolean {
    if (!statements || statements.length === 0) return false;

    for (const stmt of statements) {
      if (stmt.statementType === JackSpec.RETURN) {
        return true;
      }
      
      if (stmt.statementType === JackSpec.IF) {
        const ifStmt = stmt as JackIfStatementNode;
        const ifReturns = this.doesBlockReturn(ifStmt.ifStatements || []);
        const elseReturns = this.doesBlockReturn(ifStmt.elseStatements || []);
        
        // If both branches return, the whole if/else block acts as a guaranteed return
        if (ifReturns && elseReturns) {
          return true;
        }
      }
    }

    return false;
  }
}