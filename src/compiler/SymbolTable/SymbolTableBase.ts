import type { SymbolScope } from './types';

export abstract class BaseSymbolTable {
  public abstract toVisual(): SymbolScope;
}
