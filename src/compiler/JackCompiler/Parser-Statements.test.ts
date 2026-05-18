import { describe, expect, test } from 'vitest';
import { JackTokenizer } from './Tokenizer';
import { JackParser } from './Parser';
import { JackSpec } from '../../languages/jack/JackSpec';
import type {
  JackClassNode,
  JackLetStatementNode,
  JackWhileStatementNode,
  JackIfStatementNode,
} from './AST';

const parseToClassAST = (source: string): JackClassNode => {
  const tokenizer = new JackTokenizer(source);
  const tokens = tokenizer.tokenize();
  const parser = new JackParser(tokens);
  return parser.parse();
};

describe('JackParser Statements', () => {
  test('parses Return and Do statements', () => {
    const source = `
        class Test {
            function void main() {
                do test();
                return;
            }
        }`;

    const ast = parseToClassAST(source);
    expect(ast.subroutines).toHaveLength(1);
    const statements = ast.subroutines[0].body.statements;

    expect(statements).toHaveLength(2);
    expect(statements[0].statementType).toBe(JackSpec.DO);
    expect(statements[1].statementType).toBe(JackSpec.RETURN);
  });

  test('parses Let statements (simple and array)', () => {
    const source = `
        class Test {
            function void main() {
                let x = true;
                let arr[true] = true;
            }
        }`;

    const ast = parseToClassAST(source);
    const statements = ast.subroutines[0].body.statements;

    expect(statements).toHaveLength(2);

    const letSimple = statements[0] as JackLetStatementNode;
    expect(letSimple.statementType).toBe(JackSpec.LET);
    expect(letSimple.varName).toBe('x');
    expect(letSimple.indexExpression).toBeUndefined();

    const letArray = statements[1] as JackLetStatementNode;
    expect(letArray.statementType).toBe(JackSpec.LET);
    expect(letArray.varName).toBe('arr');
    // Note: indexExpression check will work once parseExpression/parseTerm (identifier) is implemented
    expect(letArray.indexExpression).toBeDefined();
  });

  test('parses While loops', () => {
    const source = `
        class Test {
            function void main() {
                while (true) {
                    let x = true;
                }
            }
        }`;

    const ast = parseToClassAST(source);
    const statements = ast.subroutines[0].body.statements;

    expect(statements).toHaveLength(1);
    const whileStmt = statements[0] as JackWhileStatementNode;
    expect(whileStmt.statementType).toBe(JackSpec.WHILE);

    expect(whileStmt.statements).toHaveLength(1);
    expect(whileStmt.statements[0].statementType).toBe(JackSpec.LET);
  });

  test('parses If/Else blocks', () => {
    const source = `
        class Test {
            function void main() {
                if (false) {
                    do test();
                } else {
                    do test();
                    return;
                }
            }
        }`;

    const ast = parseToClassAST(source);
    const statements = ast.subroutines[0].body.statements;

    expect(statements).toHaveLength(1);
    const ifStmt = statements[0] as JackIfStatementNode;
    expect(ifStmt.statementType).toBe(JackSpec.IF);

    // If block contents
    expect(ifStmt.ifStatements).toHaveLength(1);
    expect(ifStmt.ifStatements[0].statementType).toBe(JackSpec.DO);

    // Else block contents
    expect(ifStmt.elseStatements).toBeDefined();
    expect(ifStmt.elseStatements).toHaveLength(2);
    expect(ifStmt.elseStatements![0].statementType).toBe(JackSpec.DO);
    expect(ifStmt.elseStatements![1].statementType).toBe(JackSpec.RETURN);
  });

  test('handles deeply nested statements', () => {
    const source = `
        class Test {
            function void main() {
                while (true) {
                    if (false) {
                        while (true) { do test(); }
                    }
                }
            }
        }`;

    const ast = parseToClassAST(source);
    const statements = ast.subroutines[0].body.statements;

    // Outer While
    const while1 = statements[0] as JackWhileStatementNode;
    expect(while1.statements).toHaveLength(1);

    // Inner If
    const if1 = while1.statements[0] as JackIfStatementNode;
    expect(if1.ifStatements).toHaveLength(1);

    // Deepest While
    const while2 = if1.ifStatements[0] as JackWhileStatementNode;
    expect(while2.statements).toHaveLength(1);
    expect(while2.statements[0].statementType).toBe(JackSpec.DO);
  });
});
