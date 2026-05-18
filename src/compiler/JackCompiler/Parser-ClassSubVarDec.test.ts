import { describe, expect, test } from 'vitest';
import { JackTokenizer } from './Tokenizer';
import { JackParser } from './Parser'
import { ASTNodeKind } from '../AST/AST';

describe('JackParser', () => {
  const parseSource = (source: string) => {
    const tokenizer = new JackTokenizer(source);
    const tokens = tokenizer.tokenize();
    const parser = new JackParser(tokens);
    return parser.parse();
  };

  test('should parse an empty class', () => {
    const source = 'class Main { }';
    const ast = parseSource(source);

    expect(ast.kind).toBe(ASTNodeKind.CLASS);
    expect(ast.name).toBe('Main');
    expect(ast.classVarDecs).toHaveLength(0);
    expect(ast.subroutines).toHaveLength(0);

    // Test source mapping
    expect(ast.startToken.lexeme).toBe('class');
    expect(ast.endToken.lexeme).toBe('}');
  });

  test('should parse class variable declarations', () => {
    const source = `
            class Square {
                field int x, y;
                static boolean isLarge;
            }
        `;
    const ast = parseSource(source);

    expect(ast.classVarDecs).toHaveLength(2);

    const firstDec = ast.classVarDecs[0];
    expect(firstDec.varKind).toBe('field');
    expect(firstDec.type).toBe('int');
    expect(firstDec.names).toEqual(['x', 'y']);
    expect(firstDec.endToken.lexeme).toBe(';');
  });

  test('should parse subroutine signatures and empty bodies', () => {
    const source = `
            class Main {
                function void main(int argc, Array argv) {
                    var int i;
                }
            }
        `;
    const ast = parseSource(source);

    expect(ast.subroutines).toHaveLength(1);
    const main = ast.subroutines[0];

    expect(main.name).toBe('main');
    expect(main.subroutineKind).toBe('function');
    expect(main.returnType).toBe('void');

    // Check parameters
    expect(main.parameters).toHaveLength(2);
    expect(main.parameters[0].name).toBe('argc');
    expect(main.parameters[0].type).toBe('int');

    // Check body var decs
    expect(main.body.varDecs).toHaveLength(1);
    expect(main.body.varDecs[0].varKind).toBe('var');
  });

  test('should throw a CompilerError on missing semicolon', () => {
    const source = 'class Err { field int x }'; // Missing ;

    // We expect the parser to throw because it uses validator.expectLexeme
    expect(() => parseSource(source)).toThrow(/;/);
  });
});
