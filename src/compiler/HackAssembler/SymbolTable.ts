import { PREDEFINED_SYMBOLS } from "../../languages/asm/AsmSpec";

export class SymbolTable {
  private table: Map<string, number>;

  constructor() {
    this.table = new Map<string, number>();
    
    // Seed the table with predefined Hack symbols
    for (const [symbol, address] of Object.entries(PREDEFINED_SYMBOLS)) {
      this.table.set(symbol, address);
    }
  }

  public addEntry(symbol: string, address: number): void {
    this.table.set(symbol, address);
  }

  public contains(symbol: string): boolean {
    return this.table.has(symbol);
  }

  public getAddress(symbol: string): number {
    const address = this.table.get(symbol);
    if (address === undefined) {
      throw new Error(`Symbol '${symbol}' not found in table.`);
    }
    return address;
  }
}