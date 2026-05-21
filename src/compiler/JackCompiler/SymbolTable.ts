import { SymbolKind, type ClassVarKind, type SubroutineVarKind, type SymbolEntry } from './Visitors/SymbolTableVisitor/types'
import { JackSpec } from '../../languages/jack/JackSpec';
import { BaseSymbolTable } from '../SymbolTable/SymbolTableBase';
import type { SymbolScope, SymbolMetadata } from '../SymbolTable/types';

export class GlobalSymbolTable extends BaseSymbolTable {
  private classes = new Map<string, ClassLevelTable>();

  public addClass(className: string): ClassLevelTable {
    if (this.classes.has(className) && !this.classes.get(className)?.getBuiltin()) {
      throw new Error(`Class ${className} already defined.`);
    }
    const table = new ClassLevelTable(className);
    this.classes.set(className, table);
    return table;
  }

  public validateVar(name: string, fromClass: string, fromSubroutine: string): string | null {
    const symbol = this.findVar(name, fromClass, fromSubroutine);

    if (!symbol) {
      return `Variable '${name}' is not defined.`;
    }

    if (symbol.kind === SymbolKind.FIELD) {
      const sub = this.classes.get(fromClass)?.lookupSubroutine(fromSubroutine);
      if (sub?.category === JackSpec.FUNCTION) {
        return `Field variable '${name}' cannot be accessed from a static function.`;
      }
    }

    return null;
  }

  public validateSubroutineCall(
    methodName: string,
    fromClass: string,
    fromSubroutine: string,
    target?: string, // The 'x' in x.y()
  ): string | null {
    const callerClass = this.classes.get(fromClass);
    const callerSub = callerClass?.lookupSubroutine(fromSubroutine);

    let targetClassName: string;
    let isInstanceCall = false;

    if (!target) {
      if (callerSub?.category === JackSpec.FUNCTION) {
        return `Cannot call method '${methodName}' from a static function without an instance.`;
      }
      targetClassName = fromClass;
      isInstanceCall = true;
    } else {
      const targetVar = this.findVar(target, fromClass, fromSubroutine);

      if (targetVar) {
        targetClassName = targetVar.type;
        isInstanceCall = true;
      } else {
        targetClassName = target;
        isInstanceCall = false;
      }
    }

    const targetClassTable = this.classes.get(targetClassName);
    if (!targetClassTable) {
      return `Class '${targetClassName}' is not defined.`;
    }

    try {
      const targetSub = targetClassTable.lookupSubroutine(methodName);

      if (isInstanceCall && targetSub.category === JackSpec.FUNCTION) {
        return `Function '${methodName}' must be called using the class name, not an instance.`;
      }
      if (!isInstanceCall && targetSub.category === JackSpec.METHOD) {
        return `Method '${methodName}' must be called using an instance, not the class name.`;
      }
    } catch (e) {
      return `Subroutine '${methodName}' does not exist in class '${targetClassName}'.`;
    }

    return null;
  }

  private findVar(
    name: string,
    fromClass: string,
    fromSubroutine: string,
  ): SymbolEntry | undefined {
    const classTable = this.classes.get(fromClass);
    if (!classTable) return undefined;

    try {
      const subTable = classTable.lookupSubroutine(fromSubroutine);
      return subTable.lookupVar(name);
    } catch {
      try {
        return classTable.lookupVar(name);
      } catch {
        return undefined;
      }
    }
  }

  public validateType(typeName: string): string | null {
    const primitives = ['int', 'char', 'boolean', 'void'];
    if (primitives.includes(typeName)) return null;
    
    if (this.classes.has(typeName)) return null;
    
    return `Class '${typeName}' is not defined.`;
  }

  public toVisual(): SymbolScope {
    const children: Record<string, SymbolScope> = {};
    this.classes.forEach((table, name) => {
      if (!table.getBuiltin()) {
        children[name] = table.toVisual();
      }
    });

    return {
      name: 'Jack Project',
      symbols: {},
      children,
    };
  }
}

export class ClassLevelTable {
  private vars = new Map<string, SymbolEntry>();
  private subroutines = new Map<string, SubroutineLevelTable>();
  private counts: Record<ClassVarKind, number> = { STATIC: 0, FIELD: 0 };

  // 1. Explicitly declare the fields here
  public readonly className: string;
  private isBuiltIn: boolean;

  constructor(
    className: string,          // 2. Remove 'public readonly'
    isBuiltIn: boolean = false, // 2. Remove 'private'
  ) {
    // 3. Explicitly assign them
    this.className = className;
    this.isBuiltIn = isBuiltIn;
  }

  public setBuiltIn() {
    this.isBuiltIn = true;
  }
  public getBuiltin() {
    return this.isBuiltIn;
  }

  public defineVar(name: string, type: string, kind: ClassVarKind): void {
    if (this.vars.has(name)) {
      throw new Error(`Identifier '${name}' is already defined in class scope.`);
    }

    this.vars.set(name, {
      name,
      type,
      kind,
      index: this.counts[kind]++,
    });
  }

  public lookupVar(name: string): SymbolEntry {
    if (!this.vars.has(name)) {
      throw new Error(`Var ${name} does not exist in class ${this.className}`);
    }
    return this.vars.get(name)!;
  }

  public defineSubroutine(name: string, category: string): SubroutineLevelTable {
    if (this.subroutines.has(name)) {
      throw new Error(`Subroutine '${name}' is already defined in class ${this.className}.`);
    }
    const table = new SubroutineLevelTable(name, this.className, category);
    this.subroutines.set(name, table);
    return table;
  }

  public lookupSubroutine(name: string): SubroutineLevelTable {
    if (!this.subroutines.has(name)) {
      throw new Error(`Method/Function ${name} does not exist in class ${this.className}`);
    }
    return this.subroutines.get(name)!;
  }

  public toVisual(): SymbolScope {
    const symbols: Record<string, SymbolMetadata> = {};
    this.vars.forEach((entry, name) => {
      symbols[name] = { type: entry.type, kind: entry.kind, index: entry.index };
    });

    const children: Record<string, SymbolScope> = {};
    this.subroutines.forEach((sub, name) => {
      children[name] = sub.toVisual();
    });

    return {
      name: this.className,
      metadata: { scope: 'class' },
      symbols,
      children,
    };
  }
}

export class SubroutineLevelTable {
  private vars: Map<string, SymbolEntry> = new Map();
  private counts: Record<SubroutineVarKind, number> = { VAR: 0, ARG: 0 };
  public readonly subroutineName: string;
  public readonly className: string;
  public readonly category: string;

  constructor(
    subroutineName: string,
    className: string,   
    category: string,       
  ) {
    this.subroutineName = subroutineName;
    this.className = className;
    this.category = category;
  }

  public defineVar(name: string, type: string, kind: SubroutineVarKind): void {
    if (this.vars.has(name)) {
      throw new Error(
        `Identifier '${name}' is already defined in ${this.className}.${this.subroutineName}`,
      );
    }

    this.vars.set(name, {
      name,
      type,
      kind,
      index: this.counts[kind]++,
    });
  }

  public lookupVar(name: string): SymbolEntry {
    if (!this.vars.has(name)) {
      throw new Error(
        `Var ${name} does not exist in class ${this.className}.${this.subroutineName}`,
      );
    }
    return this.vars.get(name)!;
  }

  public toVisual(): SymbolScope {
    const symbols: Record<string, SymbolMetadata> = {};
    this.vars.forEach((entry, name) => {
      symbols[name] = { type: entry.type, kind: entry.kind, index: entry.index };
    });

    return {
      name: this.subroutineName,
      metadata: { category: this.category },
      symbols,
      children: {},
    };
  }
}
