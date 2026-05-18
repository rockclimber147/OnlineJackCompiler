export interface VMSymbol {
  name: string;
  type: "function" | "label";
  file: string;
  scope: string; // The function it belongs to (or "global" for functions)
  line: number;
}

export class VMSymbolTable {
  private functions = new Map<string, VMSymbol>(); 
  
  private labels = new Map<string, Map<string, VMSymbol>>();

  public addFunction(name: string, file: string, line: number): boolean {
    if (this.functions.has(name)) return false; // Duplicate function
    
    this.functions.set(name, { name, type: "function", file, scope: "global", line });
    return true;
  }

  public addLabel(name: string, scope: string, file: string, line: number): boolean {
    if (!this.labels.has(scope)) {
      this.labels.set(scope, new Map());
    }
    
    const scopeLabels = this.labels.get(scope)!;
    if (scopeLabels.has(name)) return false; // Duplicate label in this scope
    
    scopeLabels.set(name, { name, type: "label", file, scope, line });
    return true;
  }

  public hasFunction(name: string): boolean {
    return this.functions.has(name);
  }

  public hasLabel(name: string, scope: string): boolean {
    return this.labels.has(scope) && this.labels.get(scope)!.has(name);
  }

  // Returns a flat array of all symbols for your future UI tab
  public getUIData(): VMSymbol[] {
    const allSymbols: VMSymbol[] = Array.from(this.functions.values());
    for (const scopeMap of this.labels.values()) {
      allSymbols.push(...Array.from(scopeMap.values()));
    }
    return allSymbols;
  }
}