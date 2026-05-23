export interface FunctionEntry {
  address: number;
  locals: number;
}

export interface ScopeRange {
  startAddress: number;
  scopeName: string;
}

export class SymbolTable {
  private labels = new Map<string, Map<string, number>>();
  private functions = new Map<string, FunctionEntry>();
  private scopeRanges: ScopeRange[] = [];

  public addLabel(scopeName: string, labelName: string, address: number): void {
    if (!this.labels.has(scopeName)) {
      this.labels.set(scopeName, new Map<string, number>());
    }
    this.labels.get(scopeName)!.set(labelName, address);
  }

  public addFunction(functionName: string, address: number, locals: number): void {
    this.functions.set(functionName, { address, locals });
  }

  public hasFunction(functionName: string): boolean {
    return this.functions.has(functionName);
  }

  // REPLACED registerFileRange with registerScopeRange
  public registerScopeRange(scopeName: string, startAddress: number): void {
    this.scopeRanges.push({ startAddress, scopeName });
    // Sort array to ensure the lookup logic works
    this.scopeRanges.sort((a, b) => a.startAddress - b.startAddress);
  }

  // REPLACED getFileNameFromPC with getScopeFromPC
  public getScopeFromPC(pc: number): string {
    if (this.scopeRanges.length === 0) return "";
    for (let i = this.scopeRanges.length - 1; i >= 0; i--) {
      if (this.scopeRanges[i].startAddress <= pc) {
        return this.scopeRanges[i].scopeName;
      }
    }
    return this.scopeRanges[0].scopeName;
  }

  public getAddressFromLabel(currentPC: number, labelName: string): number {
    const currentScope = this.getScopeFromPC(currentPC);
    
    const scopeLabels = this.labels.get(currentScope);
    if (scopeLabels) {
      const address = scopeLabels.get(labelName);
      if (address !== undefined) {
        return address;
      }
    }
    throw new Error(`Label not found: ${labelName} in scope: ${currentScope}`);
  }

  public getFunctionAddress(functionName: string): FunctionEntry {
    const entry = this.functions.get(functionName);
    if (entry !== undefined) {
      return entry;
    }
    throw new Error(`Function not found: ${functionName}`);
  }

  public clear(): void {
    this.labels.clear();
    this.functions.clear();
    this.scopeRanges = [];
  }
}