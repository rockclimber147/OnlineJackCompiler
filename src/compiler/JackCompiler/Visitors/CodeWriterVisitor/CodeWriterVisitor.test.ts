import { describe, expect, test } from 'vitest';
import { JackTokenizer } from '../../Tokenizer';
import { JackParser } from '../../Parser';
import { SymbolTableVisitor } from '../SymbolTableVisitor/SymbolTableVisitor';
import { GlobalSymbolTable } from '../../SymbolTable';
import { SymbolTableBuiltinBuilder } from '../SymbolTableVisitor/SymbolTableBuiltInBuilder';
import { CodeWriterVisitor } from './CodeWriterVisitor';

describe('CodeWriterVisitor', () => {
  // Helper to compile a single Jack snippet down to a VM string
  const compileSource = (source: string, fileName: string): string => {
    const tokenizer = new JackTokenizer(source);
    const tokens = tokenizer.tokenize();
    const parser = new JackParser(tokens);
    const ast = parser.parse(fileName);

    const globalTable = new GlobalSymbolTable();
    // Populate OS built-ins (Memory, Math, etc.) so the compiler knows they exist
    SymbolTableBuiltinBuilder.populate(globalTable);
    
    const stVisitor = new SymbolTableVisitor(globalTable);
    stVisitor.visit(ast);

    const codeWriter = new CodeWriterVisitor(globalTable);
    codeWriter.visit(ast);

    return codeWriter.getVMCode();
  };

  test('should generate basic function and void return', () => {
    const source = `
      class Main {
        function void main() {
          return;
        }
      }
    `;
    const vm = compileSource(source, "Main");
    
    expect(vm).toContain('function Main.main 0');
    expect(vm).toContain('push constant 0'); // Void functions push 0
    expect(vm).toContain('return');
  });

  test('should allocate memory for constructors and return this', () => {
    const source = `
      class Point {
        field int x, y; // 2 fields
        constructor Point new() {
          return this;
        }
      }
    `;
    const vm = compileSource(source, 'Point');
    const lines = vm.split('\n');

    expect(lines).toContain('function Point.new 0');
    expect(lines).toContain('push constant 2'); // 2 fields to allocate
    expect(lines).toContain('call Memory.alloc 1');
    expect(lines).toContain('pop pointer 0'); // Anchor 'this'
    expect(lines).toContain('push pointer 0'); // push 'this' for the return
    expect(lines).toContain('return');
  });

  test('should anchor method calls to passed instance', () => {
    const source = `
      class Point {
        field int x;
        method void setX(int newX) {
          let x = newX;
          return;
        }
      }
    `;
    const vm = compileSource(source, 'Point');
    const lines = vm.split('\n');

    expect(lines).toContain('function Point.setX 0'); // 0 local vars
    expect(lines).toContain('push argument 0'); // push hidden 'this' argument
    expect(lines).toContain('pop pointer 0'); // Anchor 'this'
    
    // let x = newX
    expect(lines).toContain('push argument 1'); // newX
    expect(lines).toContain('pop this 0'); // x
  });

  test('should compile basic arithmetic expressions and local variables', () => {
    const source = `
      class MathTest {
        function void calc() {
          var int a;
          let a = 2 + 3;
          return;
        }
      }
    `;
    const vm = compileSource(source, 'MathTest');
    const lines = vm.split('\n');

    expect(lines).toContain('function MathTest.calc 1'); // 1 local var
    expect(lines).toContain('push constant 2');
    expect(lines).toContain('push constant 3');
    expect(lines).toContain('add');
    expect(lines).toContain('pop local 0');
  });

  test('should compile string literals correctly', () => {
    const source = `
      class Main {
        function void print() {
          do Output.printString("Hi");
          return;
        }
      }
    `;
    const vm = compileSource(source, 'Main');
    const lines = vm.split('\n');

    expect(lines).toContain('push constant 2'); // Length of "Hi"
    expect(lines).toContain('call String.new 1');
    
    expect(lines).toContain('push constant 72'); // 'H'
    expect(lines).toContain('call String.appendChar 2');
    
    expect(lines).toContain('push constant 105'); // 'i'
    expect(lines).toContain('call String.appendChar 2');
    
    expect(lines).toContain('call Output.printString 1');
    expect(lines).toContain('pop temp 0'); // Discard return value from 'do'
  });

  test('should generate correct control flow for While statements', () => {
    const source = `
      class Loop {
        function void test() {
          while (false) {
            do Output.printInt(1);
          }
          return;
        }
      }
    `;
    const vm = compileSource(source, "Loop");
    
    // We expect certain labels, but we use regex or partial matches 
    // because the label counters (WHILE_EXP_0) might change.
    expect(vm).toMatch(/label WHILE_EXP_\d+/);
    expect(vm).toMatch(/if-goto WHILE_END_\d+/);
    expect(vm).toMatch(/goto WHILE_EXP_\d+/);
    expect(vm).toMatch(/label WHILE_END_\d+/);
    expect(vm).toContain('push constant 0'); // false
    expect(vm).toContain('not'); // While condition is negated for the if-goto exit
  });

  test('should generate correct control flow for If-Else statements', () => {
    const source = `
      class Logic {
        function void test() {
          if (true) {
            return;
          } else {
            return;
          }
        }
      }
    `;
    const vm = compileSource(source, 'Logic');
    
    expect(vm).toMatch(/if-goto IF_TRUE_\d+/);
    expect(vm).toMatch(/goto IF_FALSE_\d+/);
    expect(vm).toMatch(/label IF_TRUE_\d+/);
    expect(vm).toMatch(/goto IF_END_\d+/); // skip else block
    expect(vm).toMatch(/label IF_FALSE_\d+/);
    expect(vm).toMatch(/label IF_END_\d+/);
  });
});