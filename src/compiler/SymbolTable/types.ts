export interface SymbolMetadata {
  [key: string]: string | number | boolean;
}

export interface SymbolScope {
  name: string;
  metadata?: SymbolMetadata;
  symbols: Record<string, SymbolMetadata>;
  children: Record<string, SymbolScope>;
}
