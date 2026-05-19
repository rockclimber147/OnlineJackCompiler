import { JackVisitorAll } from '../JackVisitorBase';
import type {
  JackClassNode,
  JackSubroutineNode,
  JackLetStatementNode,
  JackIfStatementNode,
  JackWhileStatementNode,
  JackDoStatementNode,
  JackReturnStatementNode,
  JackBinaryExpressionNode,
  JackIntegerLiteralNode,
  JackStringLiteralNode,
  JackKeywordLiteralNode,
  JackVariableTermNode,
  JackUnaryTermNode,
  JackParenthesizedExpressionNode,
  JackSubroutineCallNode,
} from '../../AST';
import { JackSpec } from '../../../../languages/jack/JackSpec';
import { GlobalSymbolTable } from '../SymbolTableVisitor/SymbolTable';
import type { SymbolEntry } from '../SymbolTableVisitor/types';

export class CodeWriterVisitor extends JackVisitorAll<void> {
  private vmOutput: string[] = [];
  private currentClassName: string = '';
  private currentSubroutineName: string = '';
  private labelCounter: number = 0;
  private table: GlobalSymbolTable;

  constructor(table: GlobalSymbolTable) {
    super();
    this.table = table;
  }

  public getVMCode(): string {
    return this.vmOutput.join('\n');
  }

  private writeCmd(cmd: string): void {
    this.vmOutput.push(cmd);
  }

  private generateLabel(prefix: string): string {
    return `${prefix}${this.labelCounter++}`;
  }

  // --- Top Level ---

  protected override visitClass(node: JackClassNode): void {
    this.currentClassName = node.name;
    node.subroutines.forEach((subroutine) => this.visit(subroutine));
    this.currentClassName = '';
  }

  protected override visitSubroutine(node: JackSubroutineNode): void {
    this.currentSubroutineName = node.name;
    
    // Access the private counts using any-casting to avoid modifying your SymbolTable class
    const classTable = (this.table as any).classes.get(this.currentClassName);
    const subTable = classTable.lookupSubroutine(node.name);
    
    const localCount = (subTable as any).counts['VAR'] || 0;
    
    // function ClassName.subroutineName localCount
    this.writeCmd(`function ${this.currentClassName}.${node.name} ${localCount}`);

    // Object/Constructor initialization
    if (node.subroutineKind === JackSpec.CONSTRUCTOR) {
      const fieldCount = (classTable as any).counts['FIELD'] || 0;
      this.writeCmd(`push constant ${fieldCount}`);
      this.writeCmd(`call Memory.alloc 1`);
      this.writeCmd(`pop pointer 0`);
    } else if (node.subroutineKind === JackSpec.METHOD) {
      this.writeCmd(`push argument 0`);
      this.writeCmd(`pop pointer 0`);
    }

    // Visit body statements (ignoring varDecs as they don't generate VM code)
    node.body.statements?.forEach((statement) => this.visit(statement));

    this.currentSubroutineName = '';
  }

  protected override visitVarDec(): void {}

  // --- Statements ---

  protected override visitLetStatement(node: JackLetStatementNode): void {
    // Note: If you add array indexing (let a[i] = expr) to your compiler, 
    // you will need to handle the pointer 1 and that 0 logic here using node.indexExpression
    
    // Evaluate RHS
    this.visit(node.valueExpression);

    const symbol = this.lookupSymbol(node.varName);
    if (!symbol) throw new Error(`Undeclared variable ${node.varName}`);

    this.writeCmd(`pop ${this.segmentName(symbol.kind)} ${symbol.index}`);
  }

  protected override visitIfStatement(node: JackIfStatementNode): void {
    const labelTrue = this.generateLabel("IF_TRUE_");
    const labelFalse = this.generateLabel("IF_FALSE_");
    const labelEnd = this.generateLabel("IF_END_");

    this.visit(node.condition);
    this.writeCmd(`if-goto ${labelTrue}`);
    this.writeCmd(`goto ${labelFalse}`);
    
    this.writeCmd(`label ${labelTrue}`);
    node.ifStatements?.forEach((statement) => this.visit(statement));
    
    if (node.elseStatements && node.elseStatements.length > 0) {
      this.writeCmd(`goto ${labelEnd}`);
      this.writeCmd(`label ${labelFalse}`);
      node.elseStatements.forEach((statement) => this.visit(statement));
      this.writeCmd(`label ${labelEnd}`);
    } else {
      this.writeCmd(`label ${labelFalse}`);
    }
  }

  protected override visitWhileStatement(node: JackWhileStatementNode): void {
    const labelExp = this.generateLabel("WHILE_EXP_");
    const labelEnd = this.generateLabel("WHILE_END_");

    this.writeCmd(`label ${labelExp}`);
    this.visit(node.condition);
    this.writeCmd(`not`);
    this.writeCmd(`if-goto ${labelEnd}`);
    
    node.statements?.forEach((statement) => this.visit(statement));
    
    this.writeCmd(`goto ${labelExp}`);
    this.writeCmd(`label ${labelEnd}`);
  }

  protected override visitDoStatement(node: JackDoStatementNode): void {
    this.visit(node.subroutineCall);
    // 'do' statements ignore the return value, so we must discard it
    this.writeCmd(`pop temp 0`);
  }

  protected override visitReturnStatement(node: JackReturnStatementNode): void {
    if (node.expression) {
      this.visit(node.expression);
    } else {
      // Void functions must return 0
      this.writeCmd(`push constant 0`);
    }
    this.writeCmd(`return`);
  }

  // --- Expressions ---

  protected override visitBinaryExpression(node: JackBinaryExpressionNode): void {
    // Left-most term
    this.visit(node.term);

    // Subsequent operations (assuming node.nextTerms holds { operator, term })
    node.nextTerms.forEach((nextOp) => {
      this.visit(nextOp.term);
      
      // Determine the operator lexeme. Adjust `nextOp.operator` if your AST uses a Token object here instead of a string
      const op = typeof nextOp.op === 'string' ? nextOp.op : (nextOp.op as any).lexeme;

      switch (op) {
        case '+': this.writeCmd('add'); break;
        case '-': this.writeCmd('sub'); break;
        case '*': this.writeCmd('call Math.multiply 2'); break;
        case '/': this.writeCmd('call Math.divide 2'); break;
        case '&': this.writeCmd('and'); break;
        case '|': this.writeCmd('or'); break;
        case '<': this.writeCmd('lt'); break;
        case '>': this.writeCmd('gt'); break;
        case '=': this.writeCmd('eq'); break;
      }
    });
  }

  protected override visitIntegerLiteral(node: JackIntegerLiteralNode): void {
    this.writeCmd(`push constant ${node.value}`);
  }

  protected override visitStringLiteral(node: JackStringLiteralNode): void {
    const str = node.value;
    this.writeCmd(`push constant ${str.length}`);
    this.writeCmd(`call String.new 1`);
    
    for (let i = 0; i < str.length; i++) {
      this.writeCmd(`push constant ${str.charCodeAt(i)}`);
      this.writeCmd(`call String.appendChar 2`);
    }
  }

  protected override visitKeywordLiteral(node: JackKeywordLiteralNode): void {
    switch (node.keyword) {
      case JackSpec.TRUE:
        this.writeCmd(`push constant 0`);
        this.writeCmd(`not`); // -1
        break;
      case JackSpec.FALSE:
      case JackSpec.NULL:
        this.writeCmd(`push constant 0`);
        break;
      case JackSpec.THIS:
        this.writeCmd(`push pointer 0`);
        break;
    }
  }

  protected override visitVariable(node: JackVariableTermNode): void {
    const symbol = this.lookupSymbol(node.name);
    if (!symbol) throw new Error(`Undeclared variable ${node.name}`);
    
    this.writeCmd(`push ${this.segmentName(symbol.kind)} ${symbol.index}`);
    
    if (node.arrayIndex) {
      // TODO: Implement Array Read (a[i])
      this.visit(node.arrayIndex);
    }
  }

  protected override visitUnaryExpression(node: JackUnaryTermNode): void {
    this.visit(node.term);
    
    const op = typeof node.op === 'string' ? node.op : (node.op as any).lexeme;
    switch (op) {
      case '-': this.writeCmd('neg'); break;
      case '~': this.writeCmd('not'); break;
    }
  }

  protected override visitParenthesizedExpression(node: JackParenthesizedExpressionNode): void {
    this.visit(node.expression);
  }

  protected override visitSubroutineCall(node: JackSubroutineCallNode): void {
    let callTarget = "";
    let argCount = node.arguments?.length || 0;

    if (node.target) {
      const symbol = this.lookupSymbol(node.target);
      if (symbol) {
        // Method call on an object instance: obj.method()
        this.writeCmd(`push ${this.segmentName(symbol.kind)} ${symbol.index}`);
        callTarget = `${symbol.type}.${node.methodName}`;
        argCount += 1;
      } else {
        // Static function call: ClassName.function()
        callTarget = `${node.target}.${node.methodName}`;
      }
    } else {
      // Implicit method call on current object: method()
      this.writeCmd(`push pointer 0`);
      callTarget = `${this.currentClassName}.${node.methodName}`;
      argCount += 1;
    }

    // Push arguments
    node.arguments?.forEach((arg) => this.visit(arg));

    this.writeCmd(`call ${callTarget} ${argCount}`);
  }

  // --- Symbol Resolution Utilities ---

  private lookupSymbol(name: string): SymbolEntry | undefined {
    // Utilize the private findVar method safely via casting
    return (this.table as any).findVar(name, this.currentClassName, this.currentSubroutineName);
  }

  private segmentName(kind: string): string {
    switch (kind) {
      case 'VAR': return 'local';
      case 'ARG': return 'argument';
      case 'FIELD': return 'this';
      case 'STATIC': return 'static';
      default: throw new Error(`Unknown memory segment for kind: ${kind}`);
    }
  }
}