import type {
  JackClassNode,
  JackClassVarDecNode,
  JackSubroutineNode,
  JackSubroutineVarDecNode,
} from '../../AST';
import { JackSpec } from '../../JackSpec';
import { JackVisitorTopLevel } from '../JackVisitorBase';
import { ClassLevelTable, GlobalSymbolTable } from './SymbolTable';
import { SymbolKind } from './types';

export class SymbolTableVisitor extends JackVisitorTopLevel<GlobalSymbolTable> {
  private table: GlobalSymbolTable;
  private currentClass: ClassLevelTable | undefined = undefined;

  constructor(table: GlobalSymbolTable) {
    super();
    this.table = table;
  }

  protected visitClass(node: JackClassNode): GlobalSymbolTable {
    const classTable = this.table.addClass(node.name);
    this.currentClass = classTable;

    node.classVarDecs.forEach((varDecNode) => {
      varDecNode.names.forEach((name) => {
        const kind = varDecNode.varKind === JackSpec.STATIC ? SymbolKind.STATIC : SymbolKind.FIELD;
        classTable.defineVar(name, varDecNode.type, kind);
      });
    });

    node.subroutines.forEach((subroutineNode) => {
      this.visitSubroutine(subroutineNode);
    });

    this.currentClass = undefined;
    return this.table;
  }

  protected visitSubroutine(node: JackSubroutineNode): GlobalSymbolTable {
    const classTable = this.currentClass!;
    const subroutineTable = classTable.defineSubroutine(node.name, node.subroutineKind);

    if (node.subroutineKind === JackSpec.METHOD) {
      subroutineTable.defineVar(JackSpec.THIS, classTable.className, SymbolKind.ARG);
    }

    node.parameters.forEach((param) => {
      subroutineTable.defineVar(param.name, param.type, SymbolKind.ARG);
    });

    node.body?.varDecs.forEach((varDecNode) => {
      varDecNode.names.forEach((name) => {
        subroutineTable.defineVar(name, varDecNode.type, SymbolKind.VAR);
      });
    });

    return this.table;
  }

  protected visitVarDec(_node: JackClassVarDecNode | JackSubroutineVarDecNode): GlobalSymbolTable {
    return this.table;
  }
}
