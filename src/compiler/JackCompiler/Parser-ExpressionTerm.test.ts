import { describe, expect, test } from 'vitest';
import { JackTokenizer } from './Tokenizer';
import { JackParser } from './Parser';
import type {
  JackBinaryExpressionNode,
  JackIntegerLiteralNode,
  JackVariableTermNode,
  JackUnaryTermNode,
  JackParenthesizedExpressionNode,
  JackSubroutineCallNode,
  JackExpressionNode,
  JackLetStatementNode,
  JackStringLiteralNode,
} from './AST';
import { ExpressionNodeTypes } from './AST';

describe('JackParser Expressions and Terms', () => {
  const parseExpressionFromSource = (exprSource: string): JackExpressionNode => {
    // We wrap the expression in a dummy class/method to use the full parser
    const source = `class Test { function void run() { let x = ${exprSource}; } }`;
    const tokenizer = new JackTokenizer(source);
    const tokens = tokenizer.tokenize();
    const parser = new JackParser(tokens);
    const ast = parser.parse("Test");

    const stmt = ast.subroutines[0].body.statements[0];
    return (stmt as JackLetStatementNode).valueExpression;
  };

  test('parses simple binary expression', () => {
    const expr = parseExpressionFromSource('1 + 2');

    expect(expr.type).toBe(ExpressionNodeTypes.BINARY_EXPRESSION);
    const binary = expr as JackBinaryExpressionNode;

    expect(binary.term.type).toBe(ExpressionNodeTypes.INTEGER);
    expect((binary.term as JackIntegerLiteralNode).value).toBe(1);

    expect(binary.nextTerms).toHaveLength(1);
    expect(binary.nextTerms[0].op).toBe('+');
    expect(binary.nextTerms[0].term.type).toBe(ExpressionNodeTypes.INTEGER);
    expect((binary.nextTerms[0].term as JackIntegerLiteralNode).value).toBe(2);
  });

  test('parses nested parentheses', () => {
    const expr = parseExpressionFromSource('2 * (3 + 4)');
    const binary = expr as JackBinaryExpressionNode;

    expect(binary.nextTerms[0].op).toBe('*');

    const parenTerm = binary.nextTerms[0].term as JackParenthesizedExpressionNode;
    expect(parenTerm.type).toBe(ExpressionNodeTypes.PAREN_EXPRESSION);

    const innerExpression = parenTerm.expression as JackBinaryExpressionNode;

    expect(innerExpression.nextTerms[0].op).toBe('+');

    const rightOperand = innerExpression.nextTerms[0].term as JackIntegerLiteralNode;
    expect(rightOperand.value).toBe(4);
  });

  test('parses unary operators', () => {
    // Cast the result of the helper to BinaryExpression
    const expr = parseExpressionFromSource('-5') as JackBinaryExpressionNode;
    const term = expr.term as JackUnaryTermNode;

    expect(term.type).toBe(ExpressionNodeTypes.UNARY_OP);
    expect(term.op).toBe('-');

    // Casting the nested term so we can check its type safely
    const operand = term.term as JackIntegerLiteralNode;
    expect(operand.type).toBe(ExpressionNodeTypes.INTEGER);
  });

  test('distinguishes variable vs array vs subroutine call', () => {
    // 1. Simple Variable
    const varExpr = parseExpressionFromSource('myVar') as JackBinaryExpressionNode;
    expect(varExpr.term.type).toBe(ExpressionNodeTypes.VAR_NAME);

    // 2. Array Access
    const arrayExpr = parseExpressionFromSource('myArray[i + 1]') as JackBinaryExpressionNode;
    const arrayTerm = arrayExpr.term as JackVariableTermNode;
    expect(arrayTerm.name).toBe('myArray');

    const indexExpr = arrayTerm.arrayIndex as JackBinaryExpressionNode;
    expect(indexExpr.nextTerms[0].op).toBe('+');

    const callExpr = parseExpressionFromSource('Math.sqrt(x)') as JackBinaryExpressionNode;
    expect(callExpr.term.type).toBe(ExpressionNodeTypes.SUBROUTINE_CALL);

    const callTerm = callExpr.term as JackSubroutineCallNode;
    expect(callTerm.methodName).toBe('sqrt');
  });

  test('parses string literals', () => {
    const expr = parseExpressionFromSource('"Hello Jack"') as JackBinaryExpressionNode;
    expect(expr.term.type).toBe(ExpressionNodeTypes.STRING);
    const stringTerm = expr.term as JackStringLiteralNode;
    expect(stringTerm.value).toBe('Hello Jack');
  });

  test('parses complex mixed expression: -(a + b) * Math.rand()', () => {
    const expr = parseExpressionFromSource('-(a + b) * Math.rand()');
    const binary = expr as JackBinaryExpressionNode;

    expect(binary.term.type).toBe(ExpressionNodeTypes.UNARY_OP);
    const unary = binary.term as JackUnaryTermNode;
    expect(unary.term.type).toBe(ExpressionNodeTypes.PAREN_EXPRESSION);
    expect(binary.nextTerms[0].op).toBe('*');
    expect(binary.nextTerms[0].term.type).toBe(ExpressionNodeTypes.SUBROUTINE_CALL);
  });
});
