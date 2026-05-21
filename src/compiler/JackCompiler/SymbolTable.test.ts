import { describe, expect, test, beforeEach } from 'vitest';
import { GlobalSymbolTable } from './SymbolTable';
import { SymbolKind } from './Visitors/SymbolTableVisitor/types';
import { JackSpec } from '../../languages/jack/JackSpec';

describe('SymbolTable', () => {
  let globalTable: GlobalSymbolTable;

  beforeEach(() => {
    globalTable = new GlobalSymbolTable();
  });

  test('should define and retrieve class-level variables with correct indices', () => {
    const classTable = globalTable.addClass('Main');

    classTable.defineVar('x', 'int', SymbolKind.FIELD);
    classTable.defineVar('y', 'int', SymbolKind.FIELD);
    classTable.defineVar('v', 'boolean', SymbolKind.STATIC);

    const x = classTable.lookupVar('x');
    const y = classTable.lookupVar('y');
    const v = classTable.lookupVar('v');

    expect(x).toEqual({ name: 'x', type: 'int', kind: SymbolKind.FIELD, index: 0 });
    expect(y).toEqual({ name: 'y', type: 'int', kind: SymbolKind.FIELD, index: 1 });
    expect(v).toEqual({ name: 'v', type: 'boolean', kind: SymbolKind.STATIC, index: 0 });
  });

  test('should define and retrieve subroutine variables', () => {
    const classTable = globalTable.addClass('Main');
    const subTable = classTable.defineSubroutine('main', JackSpec.FUNCTION);

    subTable.defineVar('a', 'int', SymbolKind.ARG);
    subTable.defineVar('b', 'int', SymbolKind.ARG);
    subTable.defineVar('i', 'int', SymbolKind.VAR);

    expect(subTable.lookupVar('a').index).toBe(0);
    expect(subTable.lookupVar('b').index).toBe(1);
    expect(subTable.lookupVar('i').index).toBe(0);
  });

  test('should throw error when defining duplicate names in same scope', () => {
    const classTable = globalTable.addClass('Main');
    classTable.defineVar('duplicate', 'int', SymbolKind.FIELD);

    expect(() => {
      classTable.defineVar('duplicate', 'boolean', SymbolKind.STATIC);
    }).toThrow(/already defined in class scope/);
  });

  test('should allow same variable name in different subroutines', () => {
    const classTable = globalTable.addClass('Main');

    const sub1 = classTable.defineSubroutine('first', JackSpec.FUNCTION);
    const sub2 = classTable.defineSubroutine('second', JackSpec.FUNCTION);

    sub1.defineVar('counter', 'int', SymbolKind.VAR);
    sub2.defineVar('counter', 'int', SymbolKind.VAR);

    expect(sub1.lookupVar('counter').index).toBe(0);
    expect(sub2.lookupVar('counter').index).toBe(0);
  });

  test('should maintain separate indices for different kinds in same scope', () => {
    const classTable = globalTable.addClass('Main');
    const subTable = classTable.defineSubroutine('test', JackSpec.FUNCTION);

    subTable.defineVar('arg0', 'int', SymbolKind.ARG);
    subTable.defineVar('var0', 'int', SymbolKind.VAR);
    subTable.defineVar('arg1', 'int', SymbolKind.ARG);

    expect(subTable.lookupVar('arg0').index).toBe(0);
    expect(subTable.lookupVar('arg1').index).toBe(1);
    expect(subTable.lookupVar('var0').index).toBe(0);
  });

  test('should throw error on looking up non-existent variable', () => {
    const classTable = globalTable.addClass('Main');
    expect(() => classTable.lookupVar('ghost')).toThrow(/does not exist/);
  });
});
