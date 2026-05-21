import { describe, expect, test } from 'vitest';
import { JackTokenizer } from '../../Tokenizer';
import { JackParser } from '../../Parser';
import { SymbolTableVisitor } from './SymbolTableVisitor';
import { SymbolKind } from './types';
import { GlobalSymbolTable } from '../../SymbolTable';

describe('SymbolTableVisitor', () => {
  const getTableFromSource = (source: string, fileName: string) => {
    const tokenizer = new JackTokenizer(source);
    const tokens = tokenizer.tokenize();
    const parser = new JackParser(tokens);
    const ast = parser.parse(fileName);
    const table = new GlobalSymbolTable();
    const visitor = new SymbolTableVisitor(table);
    return visitor.visit(ast);
  };

  const getAstFromSource = (source: string, fileName: string) => {
    const tokenizer = new JackTokenizer(source);
    const tokens = tokenizer.tokenize();
    const parser = new JackParser(tokens);
    return parser.parse(fileName);
  };

  test('should populate class-level fields and statics', () => {
    const source = `
      class Square {
        field int x, y;
        static int count;
        
        function void main() {}
      }
    `;
    const globalTable = getTableFromSource(source, 'Square');
    // Note: You'll need to expose a getClass method or make classes public in GlobalSymbolTable
    const squareTable = (globalTable as any).classes.get('Square');

    expect(squareTable.lookupVar('x')).toMatchObject({
      kind: SymbolKind.FIELD,
      index: 0,
      type: 'int',
    });
    expect(squareTable.lookupVar('y')).toMatchObject({
      kind: SymbolKind.FIELD,
      index: 1,
      type: 'int',
    });
    expect(squareTable.lookupVar('count')).toMatchObject({
      kind: SymbolKind.STATIC,
      index: 0,
      type: 'int',
    });
  });

  test('should handle implicit "this" in methods but not functions', () => {
    const source = `
      class Square {
        method void draw() {}
        function void reset() {}
      }
    `;
    const globalTable = getTableFromSource(source, 'Square');
    const squareTable = (globalTable as any).classes.get('Square');

    const drawTable = squareTable.lookupSubroutine('draw');
    const resetTable = squareTable.lookupSubroutine('reset');

    // draw is a method, should have 'this' at ARG 0
    expect(drawTable.lookupVar('this')).toMatchObject({
      kind: SymbolKind.ARG,
      index: 0,
      type: 'Square',
    });

    // reset is a function, 'this' should not exist
    expect(() => resetTable.lookupVar('this')).toThrow();
  });

  test('should populate subroutine arguments and local variables', () => {
    const source = `
      class Math {
        function int add(int a, int b) {
          var int sum;
          let sum = a + b;
          return sum;
        }
      }
    `;
    const globalTable = getTableFromSource(source, 'Math');
    const mathTable = (globalTable as any).classes.get('Math');
    const addTable = mathTable.lookupSubroutine('add');

    expect(addTable.lookupVar('a')).toMatchObject({ kind: SymbolKind.ARG, index: 0 });
    expect(addTable.lookupVar('b')).toMatchObject({ kind: SymbolKind.ARG, index: 1 });
    expect(addTable.lookupVar('sum')).toMatchObject({ kind: SymbolKind.VAR, index: 0 });
  });

  test('should maintain separate indices for different subroutines', () => {
    const source = `
      class Test {
        method void first(int a) { var int x; }
        method void second(int b) { var int x, y; }
      }
    `;
    const globalTable = getTableFromSource(source, 'Test');
    const testTable = (globalTable as any).classes.get('Test');

    const first = testTable.lookupSubroutine('first');
    const second = testTable.lookupSubroutine('second');

    // 'this' is at index 0 for both because they are methods
    expect(first.lookupVar('a').index).toBe(1);
    expect(second.lookupVar('b').index).toBe(1);

    expect(first.lookupVar('x').index).toBe(0);
    expect(second.lookupVar('y').index).toBe(1);
  });

  test('should throw error on duplicate class variable definition', () => {
    const source = `
      class Bad {
        field int x;
        static int x;
      }
    `;
    expect(() => getTableFromSource(source, 'Bad')).toThrow(/already defined in class scope/);
  });

  test('should be ok with multiple valid asts', () => {
    const source1 = `
      class Square {
        field int x, y;
        static int count;
        function void main() {}
      }
    `;
    const ast1 = getAstFromSource(source1, "Square");

    const source2 = `
      class Rectangle {
        field int width, height;
        static int rectCount;
        function void init() {}
      }
    `;
    const ast2 = getAstFromSource(source2, 'Rectangle');
    const table = new GlobalSymbolTable();
    const visitor = new SymbolTableVisitor(table);

    // Visit first AST
    visitor.visit(ast1);
    // Visit second AST
    const globalTable = visitor.visit(ast2);

    // 1. Verify Square still exists and is correct
    const squareTable = (globalTable as any).classes.get('Square');
    expect(squareTable).toBeDefined();
    expect(squareTable.lookupVar('x').kind).toBe(SymbolKind.FIELD);
    expect(squareTable.lookupSubroutine('main')).toBeDefined();

    // 2. Verify Rectangle was added correctly
    const rectTable = (globalTable as any).classes.get('Rectangle');
    expect(rectTable).toBeDefined();
    expect(rectTable.lookupVar('width')).toMatchObject({
      kind: SymbolKind.FIELD,
      index: 0,
    });
    expect(rectTable.lookupSubroutine('init')).toBeDefined();

    // 3. Verify total class count
    expect((globalTable as any).classes.size).toBe(2);
  });
});
