export interface FunctionEntry {
  address: number;
  locals: number;
}

export interface FileRange {
  startAddress: number;
  fileName: string;
}

export class SymbolTable {
  private labels = new Map<string, Map<string, number>>();
  private functions = new Map<string, FunctionEntry>();
  private fileRanges: FileRange[] = [];

  public addLabel(fileName: string, labelName: string, address: number): void {
    if (!this.labels.has(fileName)) {
      this.labels.set(fileName, new Map<string, number>());
    }
    this.labels.get(fileName)!.set(labelName, address);
  }

  public addFunction(functionName: string, address: number, locals: number): void {
    this.functions.set(functionName, { address, locals });
  }

  public registerFileRange(fileName: string, startAddress: number): void {
    this.fileRanges.push({ startAddress, fileName });
    // Sort array to ensure the lookup logic works even if ranges are registered out of order
    this.fileRanges.sort((a, b) => a.startAddress - b.startAddress);
  }

  public getFileNameFromPC(pc: number): string {
    if (this.fileRanges.length === 0) return "";
    for (let i = this.fileRanges.length - 1; i >= 0; i--) {
      if (this.fileRanges[i].startAddress <= pc) {
        return this.fileRanges[i].fileName;
      }
    }
    
    // Fallback if PC is somehow before the first registered range
    return this.fileRanges[0].fileName;
  }

  public getAddressFromLabel(currentPC: number, labelName: string): number {
    const currentFile = this.getFileNameFromPC(currentPC);
    
    const fileLabels = this.labels.get(currentFile);
    if (fileLabels) {
      const address = fileLabels.get(labelName);
      if (address !== undefined) {
        return address;
      }
    }
    throw new Error(`Label not found: ${labelName}`);
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
    this.fileRanges = [];
  }
}