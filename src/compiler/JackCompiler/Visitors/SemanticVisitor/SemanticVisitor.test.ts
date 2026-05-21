import { describe, expect, test } from 'vitest';
import { JackTokenizer } from '../../Tokenizer';
import { JackParser } from '../../Parser';
import { SymbolTableVisitor } from '../SymbolTableVisitor/SymbolTableVisitor';
import { JackSemanticVisitor } from './SemanticVisitor';
import { type ASTNode } from '../../../AST/AST';
import { GlobalSymbolTable } from '../../SymbolTable';

describe('SemanticVisitor', () => {
  const validateSource = (sources: string[]) => {
    const asts: ASTNode[] = [];
    sources.forEach((source) => {
      const tokenizer = new JackTokenizer(source);
      const tokens = tokenizer.tokenize();
      const parser = new JackParser(tokens);
      asts.push(parser.parse());
    });
    const table = new GlobalSymbolTable();
    const stVisitor = new SymbolTableVisitor(table);
    let globalTable = new GlobalSymbolTable();
    asts.forEach((ast) => (globalTable = stVisitor.visit(ast)));

    const semanticVisitor = new JackSemanticVisitor(globalTable);
    asts.forEach((ast) => semanticVisitor.visit(ast));

    return semanticVisitor.getErrors();
  };
  test('should report error for undefined variables', () => {
    const source = `
      class Main {
        static int x;
        function void main() {
          let x = y + 1;
        }
      }
    `;
    const errors = validateSource([source]);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].message).toContain("Variable 'y' is not defined");
  });

  test('should allow valid variable access in methods', () => {
    const source = `
      class Square {
        field int size;
        method void update(int newSize) {
          let size = newSize;
        }
      }
    `;
    const errors = validateSource([source]);
    expect(errors.length).toBe(0);
  });

  test('should report error when accessing field in a static function', () => {
    const source = `
      class Square {
        field int size;
        function void staticError() {
          let size = 10;
        }
      }
    `;
    const errors = validateSource([source]);
    expect(
      errors.some((e) => e.message.includes('cannot be accessed from a static function')),
    ).toBe(true);
  });

  test('should validate subroutine calls on current class', () => {
    const source = `
      class Game {
        method void run() { do draw(); }
        method void draw() { return; }
      }
    `;
    const errors = validateSource([source]);
    expect(errors.length).toBe(0);
  });

  test('should validate complex expressions recursively', () => {
    const source = `
      class Test {
        function void main() {
          var int x;
          let x = (y + (z * 2));
        }
      }
    `;
    const errors = validateSource([source]);
    expect(errors.length).toBe(2);
  });

// --- Multi-Source Happy Paths ---

  test('should allow valid cross-class method and function calls', () => {
    const sourceA = `
      class Game {
        function void init() {
          var Player p;
          let p = Player.new();
          do p.move(); // Valid: calling method on instance
          return;
        }
        
        function void beep() { return; }
      }
    `;
    const sourceB = `
      class Player {
        constructor Player new() { return this; }
        
        method void move() {
          do Game.beep(); // Valid: calling function via Class name
          return;
        }
      }
    `;
    const errors = validateSource([sourceA, sourceB]);
    expect(errors.length).toBe(0);
  });

  // --- Multi-Source Unhappy Paths ---

  test('should report error when calling a method using a class name instead of an instance', () => {
    const sourceA = `
      class Main {
        function void main() {
          do Utils.print(); // Error: print is a method, not a function
          return;
        }
      }
    `;
    const sourceB = `
      class Utils {
        method void print() { return; }
      }
    `;
    const errors = validateSource([sourceA, sourceB]);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.message.includes("Method 'print' must be called using an instance"))).toBe(true);
  });

  test('should report error when calling a function using an object instance', () => {
    const sourceA = `
      class Main {
        function void main() {
          var MathUtils u;
          do u.calculate(); // Error: calculate is static, must use MathUtils.calculate()
          return;
        }
      }
    `;
    const sourceB = `
      class MathUtils {
        function void calculate() { return; }
      }
    `;
    const errors = validateSource([sourceA, sourceB]);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.message.includes("Function 'calculate' must be called using the class name"))).toBe(true);
  });

  test('should report error when calling a non-existent subroutine on another class', () => {
    const sourceA = `
      class Main {
        function void main() {
          do Helper.doesNotExist();
          return;
        }
      }
    `;
    const sourceB = `
      class Helper {
        function void exists() { return; }
      }
    `;
    const errors = validateSource([sourceA, sourceB]);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.message.includes("Subroutine 'doesNotExist' does not exist in class 'Helper'"))).toBe(true);
  });

  test('should report error when calling a subroutine on an undefined class', () => {
    const source = `
      class Main {
        function void main() {
          do UnknownClass.run();
          return;
        }
      }
    `;
    const errors = validateSource([source]);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.message.includes("Class 'UnknownClass' is not defined"))).toBe(true);
  });

  test('should report error when defining a class variable of undefined type', () => {
    const source = `
      class Main {
        field Unknown u;
        function void main() {
          return;
        }
      }
    `;
    const errors = validateSource([source]);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.message.includes("Class 'Unknown' is not defined"))).toBe(true);
  });

  test('should report error when defining a subroutine variable of undefined type', () => {
    const source = `
      class Main {
        function void main() {
          var Unknown u;
          return;
        }
      }
    `;
    const errors = validateSource([source]);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.message.includes("Class 'Unknown' is not defined"))).toBe(true);
  });

  test('args are correctly identiffied', () => {
    const source = `
    class Main {
        function int double(int a) {
            return a * 2;
        }
    }
    `
    const errors = validateSource([source]);
    expect(errors.length).toBe(0);
  })
});
