import { JackTokenizer } from "./Tokenizer";
import { JackParser } from "./Parser";
import { type VirtualFile } from "../../types/Vfs";
import { type CompilerError } from "../../types/Compiler"; 
import { type JackClassNode } from "./AST";
import { JackCompilerError } from "../Errors";

export interface JackCompilationResult {
  success: boolean;
  errors: CompilerError[];
  asts: Record<string, JackClassNode | null>; // Saved for when you add visitors later!
}

export class JackCompiler {
  public compileAll(files: VirtualFile[]): JackCompilationResult {
    const errors: CompilerError[] = [];
    const asts: Record<string, JackClassNode | null> = {};

    const jackFiles = files.filter(f => f.name.endsWith(".jack"));

    for (const file of jackFiles) {
      try {
        const tokenizer = new JackTokenizer(file.content);
        const tokens = tokenizer.tokenize();
        const parser = new JackParser(tokens);
        const ast = parser.parse();

        // Store AST for future visitor passes
        asts[file.name] = ast;

      } catch (err: any) {
        asts[file.name] = null;

        if (err instanceof JackCompilerError) {
          errors.push({
            message: `[${file.name}] ${err.message}`,
            line: err.line,
            startCol: err.column,
            endCol: err.column + err.lexeme.length
          });
        } else {
          const lexicalMatch = err.message.match(/line (\d+), col (\d+)/);
          const line = lexicalMatch ? parseInt(lexicalMatch[1], 10) : 1;
          const col = lexicalMatch ? parseInt(lexicalMatch[2], 10) : 1;

          errors.push({
            message: `[${file.name}] ${err.message}`,
            line: line,
            startCol: col,
            endCol: col + 10
          });
        }
      }
    }

    // Future implementation: 
    // If errors.length === 0, iterate over `asts` and run SymbolTableVisitor, etc.

    return {
      success: errors.length === 0,
      errors,
      asts
    };
  }
}