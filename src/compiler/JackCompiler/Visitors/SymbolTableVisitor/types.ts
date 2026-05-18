import { JackSpec } from "../../../../languages/jack/JackSpec";
export const SymbolKind = {
  STATIC: 'STATIC',
  FIELD: 'FIELD',
  ARG: 'ARG',
  VAR: 'VAR',
} as const;

export type SymbolKind = (typeof SymbolKind)[keyof typeof SymbolKind];
export type ClassVarKind = typeof SymbolKind.STATIC | typeof SymbolKind.FIELD;
export type SubroutineVarKind = typeof SymbolKind.ARG | typeof SymbolKind.VAR;
export type SubroutineKind =
  | typeof JackSpec.CONSTRUCTOR
  | typeof JackSpec.METHOD
  | typeof JackSpec.FUNCTION;

export interface SymbolEntry {
  name: string;
  type: string;
  kind: SymbolKind;
  index: number;
}
