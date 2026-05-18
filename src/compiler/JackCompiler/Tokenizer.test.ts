import { describe, expect, test } from 'vitest';
import { JackTokenizer } from './Tokenizer'; 
import { TokenType } from './Token';
import type { Token } from './Token';

describe('Jack Tokenizer', () => {
  test('should tokenize basic keywords and symbols', () => {
    const source = 'class Main {';
    const tokenizer = new JackTokenizer(source);
    const tokens = tokenizer.tokenize();

    // +1 length to account for the appended EOF token
    expect(tokens).toHaveLength(4); 

    expect(tokens[0]).toMatchObject({
      type: TokenType.KEYWORD,
      lexeme: 'class',
      line: 1,
      column: 1,
    });

    expect(tokens[1]).toMatchObject({
      type: TokenType.IDENTIFIER,
      lexeme: 'Main',
      line: 1,
      column: 7,
    });

    expect(tokens[2]).toMatchObject({
      type: TokenType.SYMBOL,
      lexeme: '{',
      line: 1,
      column: 12,
    });

    expect(tokens[3]).toMatchObject({
      type: TokenType.EOF,
      lexeme: 'EOF',
    });
  });

  test('should skip comments and whitespace', () => {
    const source = `
      // This is a comment
      let x = 5; /* block 
                    comment */
    `;
    const tokenizer = new JackTokenizer(source);
    const tokens = tokenizer.tokenize();

    // "let", "x", "=", "5", ";", plus "EOF" should remain
    expect(tokens).toHaveLength(6);
    expect(tokens[0].lexeme).toBe('let');
    expect(tokens[3].type).toBe(TokenType.INT);
    expect(tokens[3].lexeme).toBe('5');
  });

  test('should handle string constants', () => {
    const source = 'let s = "hello world";';
    const tokenizer = new JackTokenizer(source);
    const tokens = tokenizer.tokenize();

    const stringToken = tokens.find((t: Token) => t.type === TokenType.STRING);
    expect(stringToken?.lexeme).toBe('"hello world"');
  });

  test('should throw error on unexpected characters', () => {
    const source = 'let x = #;'; // '#' is not in JackSpec
    const tokenizer = new JackTokenizer(source);

    // Matches the new specific error format
    expect(() => tokenizer.tokenize()).toThrow(/Lexical error/);
  });

  test('Tokenizer gives the correct line numbers', () => {
    const source = `class
    Test
    `;
    const tokenizer = new JackTokenizer(source);
    const tokens = tokenizer.tokenize();

    expect(tokens[0].line).toBe(1);
    expect(tokens[1].line).toBe(2);
  });

  test('Tokenizer gives the correct line numbers with comments', () => {
    const source = `class        //1
    // comment    //2
    /*            //3
    block comment //4
    */            //5
    Test          //6
    `;
    const tokenizer = new JackTokenizer(source);
    const tokens = tokenizer.tokenize();

    expect(tokens[0].line).toBe(1);
    expect(tokens[1].line).toBe(6);
  });
});