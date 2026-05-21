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
});
