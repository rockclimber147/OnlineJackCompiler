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
      
      // Automatically derive the filename from the class name in the source code
      const match = source.match(/class\s+([A-Za-z0-9_]+)/);
      const fileName = match ? `${match[1]}` : 'Unknown';
      
      // Pass the derived filename to the parser
      asts.push(parser.parse(fileName)); 
    });

    const table = new GlobalSymbolTable();
    const stVisitor = new SymbolTableVisitor(table);
    let globalTable = new GlobalSymbolTable();
    
    asts.forEach((ast) => {
      globalTable = stVisitor.visit(ast);
    });

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
          return;
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
        method void run() { do draw(); return; }
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
          return;
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

test('should pass when a straight-line subroutine has a return statement', () => {
    const source = `
      class Main {
        function int getNumber() {
          var int x;
          let x = 5;
          return x;
        }
      }
    `;
    const errors = validateSource([source]);
    expect(errors.length).toBe(0);
  });

  test('should report error when a subroutine is missing a return statement entirely', () => {
    const source = `
      class Main {
        function void noReturn() {
          var int x;
          let x = 5;
          // Missing return;
        }
      }
    `;
    const errors = validateSource([source]);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.message.includes('does not return a value in all control paths'))).toBe(true);
  });

  test('should pass when both branches of an if/else block guarantee a return', () => {
    const source = `
      class Main {
        function int check(int x) {
          if (x > 5) {
            return 1;
          } else {
            return 0;
          }
        }
      }
    `;
    const errors = validateSource([source]);
    expect(errors.length).toBe(0);
  });

  test('should report error when an if block lacks an else and has no fallback return', () => {
    const source = `
      class Main {
        function int check(int x) {
          if (x > 5) {
            return 1;
          }
          // Error: what if x <= 5?
        }
      }
    `;
    const errors = validateSource([source]);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.message.includes('does not return a value in all control paths'))).toBe(true);
  });

  test('should pass when an if block lacks an else BUT has a fallback return later', () => {
    const source = `
      class Main {
        function int check(int x) {
          if (x > 5) {
            return 1;
          }
          return 0; // Fallback return catches the remaining path
        }
      }
    `;
    const errors = validateSource([source]);
    expect(errors.length).toBe(0);
  });

  test('should report error when a return is trapped inside a while loop with no fallback', () => {
    const source = `
      class Main {
        function int loop(int count) {
          while (count > 0) {
            return 1; 
          }
          // Error: while condition might be false initially, bypassing the return
        }
      }
    `;
    const errors = validateSource([source]);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.message.includes('does not return a value in all control paths'))).toBe(true);
  });

  test('should pass when a return is in a while loop but also has a safe fallback after the loop', () => {
    const source = `
      class Main {
        function int loop(int count) {
          while (count > 0) {
            return 1; 
          }
          return 0; // Safe fallback
        }
      }
    `;
    const errors = validateSource([source]);
    expect(errors.length).toBe(0);
  });

  test('should handle nested if/else logic correctly', () => {
    const source = `
      class Main {
        function int nested(int x, int y) {
          if (x > 0) {
            if (y > 0) {
              return 1;
            } else {
              return 2;
            }
          } else {
            return 3;
          }
        }
      }
    `;
    const errors = validateSource([source]);
    expect(errors.length).toBe(0);
  });

  test('should report error when a void subroutine tries to return a value', () => {
    const source = `
      class Main {
        function void doSomething() {
          return 5; // Error: void cannot return value
        }
      }
    `;
    const errors = validateSource([source]);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.message.includes('is void and cannot return a value'))).toBe(true);
  });

  test('should report error when a non-void subroutine returns without a value', () => {
    const source = `
      class Main {
        function int getNum() {
          return; // Error: missing int
        }
      }
    `;
    const errors = validateSource([source]);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.message.includes("must return a value of type 'int'"))).toBe(true);
  });

  test('should allow returning "this" when the return type matches the class', () => {
    const source = `
      class Point {
        constructor Point new() {
          return this; // OK: 'this' evaluates to 'Point'
        }
      }
    `;
    const errors = validateSource([source]);
    expect(errors.length).toBe(0);
  });
});
