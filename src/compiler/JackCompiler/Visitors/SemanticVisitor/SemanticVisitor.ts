import {
  type JackLetStatementNode,
  type JackIfStatementNode,
  type JackWhileStatementNode,
  type JackDoStatementNode,
  type JackReturnStatementNode,
  type JackBinaryExpressionNode,
  type JackVariableTermNode,
  type JackUnaryTermNode,
  type JackParenthesizedExpressionNode,
  type JackSubroutineCallNode,
  type JackClassNode,
  type JackSubroutineNode,
  type JackStatementNode,
  type JackExpressionNode,
  ExpressionNodeTypes,
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
  private currentSubroutineReturnType: string = '';
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
    this.currentSubroutineReturnType = typeof node.returnType === 'string' 
    ? node.returnType 
    : (node.returnType as any).lexeme;

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
    this.currentSubroutineReturnType = '';
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

  protected override visitReturnStatement(node: JackReturnStatementNode): void {
    if (node.expression) this.visit(node.expression);

    const isVoid = this.currentSubroutineReturnType === JackSpec.VOID;

    // 1. Void returning a value
    if (isVoid && node.expression) {
      this.newErrors.push(new JackCompilerError(
        node.startToken,
        `Semantic Error: Subroutine '${this.currentSubroutineName}' is void and cannot return a value.`
      ));
      return;
    }

    // 2. Non-void NOT returning a value
    if (!isVoid && !node.expression) {
      this.newErrors.push(new JackCompilerError(
        node.startToken,
        `Semantic Error: Subroutine '${this.currentSubroutineName}' must return a value of type '${this.currentSubroutineReturnType}'.`
      ));
      return;
    }

    // 3. Type Validation (if we are returning a value)
    if (!isVoid && node.expression) {
      const exprType = this.getExpressionType(node.expression);
      
      // Only throw an error if we successfully inferred the type AND it's a mismatch.
      // If exprType is null, it means it's a complex expression we can't safely infer yet.
      if (exprType && !this.isTypeCompatible(exprType, this.currentSubroutineReturnType)) {
        this.newErrors.push(new JackCompilerError(
          node.startToken,
          `Semantic Error: Cannot return type '${exprType}' from a subroutine returning '${this.currentSubroutineReturnType}'.`
        ));
      }
    }
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

  private isTypeCompatible(actual: string, expected: string): boolean {
    if (actual === expected) return true;
    
    // In Jack, 'null' is a valid return value for ANY object/class, but NOT primitives
    if (actual === JackSpec.NULL && !['int', 'boolean', 'char'].includes(expected)) {
      return true;
    }
    
    return false;
  }

  private getExpressionType(node: JackExpressionNode): string | null {
    if (!node) return null;

    // Use ExpressionNodeTypes to allow TypeScript to narrow the union type
    if (node.type === ExpressionNodeTypes.VAR_NAME) {
      const varName = node.name;
      const symbol = (this.table as any).findVar(varName, this.currentClassName, this.currentSubroutineName);
      return symbol ? symbol.type : null;
    }

    // Literals have obvious types
    if (node.type === ExpressionNodeTypes.INTEGER) return 'int';
    if (node.type === ExpressionNodeTypes.STRING) return 'String';
    
    if (node.type === ExpressionNodeTypes.KEYWORD) {
      if (node.keyword === JackSpec.TRUE || node.keyword === JackSpec.FALSE) return 'boolean';
      if (node.keyword === JackSpec.NULL) return 'null';
      if (node.keyword === JackSpec.THIS) return this.currentClassName;
    }
    
    return null; 
  }
}