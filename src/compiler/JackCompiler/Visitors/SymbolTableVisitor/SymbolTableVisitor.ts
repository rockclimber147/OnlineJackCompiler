import type {
  JackClassNode,
  JackClassVarDecNode,
  JackSubroutineNode,
  JackSubroutineVarDecNode,
} from '../../AST';
import { JackSpec } from '../../../../languages/jack/JackSpec';
import { JackVisitorTopLevel } from '../JackVisitorBase';
import { ClassLevelTable, GlobalSymbolTable } from '../../SymbolTable';
import { SymbolKind } from './types';
import { JackCompilerError } from '../../../Errors';

export class SymbolTableVisitor extends JackVisitorTopLevel<GlobalSymbolTable> {
  private table: GlobalSymbolTable;
  private currentClass: ClassLevelTable | undefined = undefined;

  constructor(table: GlobalSymbolTable) {
    super();
    this.table = table;
  }

  protected visitClass(node: JackClassNode): GlobalSymbolTable {
    try {
      this.currentClass = this.table.addClass(node.name);
    } catch (err: any) {
      // Catch duplicate class definitions
      const token = node.nameToken || node.startToken;
      throw new JackCompilerError(token, err.message);
    }

    const classTable = this.currentClass;

    node.classVarDecs?.forEach((varDecNode) => {
      varDecNode.names.forEach((name, index) => {
        const kind = varDecNode.varKind === JackSpec.STATIC ? SymbolKind.STATIC : SymbolKind.FIELD;
        try {
          classTable.defineVar(name, varDecNode.type, kind);
        } catch (err: any) {
          // Use the index to grab the exact token that caused the collision
          const token = varDecNode.nameTokens ? varDecNode.nameTokens[index] : varDecNode.startToken;
          throw new JackCompilerError(token, err.message);
        }
      });
    });

    node.subroutines?.forEach((subroutineNode) => {
      this.visitSubroutine(subroutineNode);
    });

    this.currentClass = undefined;
    return this.table;
  }

  protected visitSubroutine(node: JackSubroutineNode): GlobalSymbolTable {
    const classTable = this.currentClass!;
    let subroutineTable;

    try {
      subroutineTable = classTable.defineSubroutine(node.name, node.subroutineKind);
    } catch (err: any) {
      // Catch duplicate subroutine definitions (e.g. method vs field collision)
      const token = node.nameToken || node.startToken;
      throw new JackCompilerError(token, err.message);
    }

    if (node.subroutineKind === JackSpec.METHOD) {
      // 'this' is implicit and safe from user duplicates
      subroutineTable.defineVar(JackSpec.THIS, classTable.className, SymbolKind.ARG);
    }

    node.parameters?.forEach((param) => {
      try {
        subroutineTable.defineVar(param.name, param.type, SymbolKind.ARG);
      } catch (err: any) {
        const token = param.nameToken || param.startToken;
        throw new JackCompilerError(token, err.message);
      }
    });

    node.body?.varDecs?.forEach((varDecNode) => {
      varDecNode.names.forEach((name, index) => {
        try {
          subroutineTable.defineVar(name, varDecNode.type, SymbolKind.VAR);
        } catch (err: any) {
          // Use the index to grab the exact token that caused the collision
          const token = varDecNode.nameTokens ? varDecNode.nameTokens[index] : varDecNode.startToken;
          throw new JackCompilerError(token, err.message);
        }
      });
    });

    return this.table;
  }

  protected visitVarDec(_node: JackClassVarDecNode | JackSubroutineVarDecNode): GlobalSymbolTable {
    return this.table;
  }
}