import { JackTokenizer } from "./Tokenizer";
import { JackParser } from "./Parser";
import { type VirtualFile } from "../../types/Vfs";
import { type CompilerError } from "../../types/compiler"; 
import { type JackClassNode } from "./AST";
import { JackCompilerError } from "../Errors";
import { GlobalSymbolTable } from "./SymbolTable";
import { SymbolTableBuiltinBuilder } from "./Visitors/SymbolTableVisitor/SymbolTableBuiltInBuilder";
import { SymbolTableVisitor } from "./Visitors/SymbolTableVisitor/SymbolTableVisitor";
import { JackSemanticVisitor } from "./Visitors/SemanticVisitor/SemanticVisitor";
import { CodeWriterVisitor } from "./Visitors/CodeWriterVisitor/CodeWriterVisitor";

export interface JackCompilationResult {
  success: boolean;
  errors: CompilerError[];
  asts: Record<string, JackClassNode | null>;
  symbolTable?: GlobalSymbolTable;
  compiledFiles: VirtualFile[];
}

export class JackCompiler {
  public compileAll(files: VirtualFile[], generateVM: boolean = true): JackCompilationResult {
    const jackFiles = files.filter(f => f.name.endsWith(".jack"));

    // Phase 1: Syntax
    const { asts, errors: syntaxErrors } = this.runParserPass(jackFiles);
    if (syntaxErrors.length > 0) {
      return { success: false, errors: syntaxErrors, asts, compiledFiles: [] };
    }

    // Phase 2: Symbols
    const { globalTable, errors: symbolErrors } = this.runSymbolTablePass(asts);
    if (symbolErrors.length > 0) {
      return { success: false, errors: symbolErrors, asts, symbolTable: globalTable, compiledFiles: [] };
    }

    // Phase 3: Semantics
    const semanticErrors = this.runSemanticPass(asts, globalTable);
    if (semanticErrors.length > 0) {
      return { success: false, errors: semanticErrors, asts, symbolTable: globalTable, compiledFiles: [] };
    }

    // Phase 4: Code Generation (NEW)
    let compiledFiles: VirtualFile[] = [];

    if (generateVM) {
      const codegenResult = this.runCodeWriterPass(asts, globalTable);
      compiledFiles = codegenResult.compiledFiles;
      
      if (codegenResult.errors.length > 0) {
        return { success: false, errors: codegenResult.errors, asts, symbolTable: globalTable, compiledFiles: [] };
      }
    }

    // Success
    return {
      success: true,
      errors: [],
      asts,
      symbolTable: globalTable,
      compiledFiles
    };
  }

  private runParserPass(files: VirtualFile[]): { asts: Record<string, JackClassNode | null>, errors: CompilerError[] } {
    const asts: Record<string, JackClassNode | null> = {};
    const errors: CompilerError[] = [];

    for (const file of files) {
      try {
        const tokenizer = new JackTokenizer(file.content);
        const tokens = tokenizer.tokenize();
        const parser = new JackParser(tokens);
        asts[file.name] = parser.parse(file.name.split(".")[0]);
      } catch (err: any) {
        asts[file.name] = null;

        if (err instanceof JackCompilerError) {
          errors.push(this.formatError(file.name, err));
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

    return { asts, errors };
  }

  private runSymbolTablePass(asts: Record<string, JackClassNode | null>): { globalTable: GlobalSymbolTable, errors: CompilerError[] } {
    const globalTable = new GlobalSymbolTable();
    const errors: CompilerError[] = [];
    
    SymbolTableBuiltinBuilder.populate(globalTable);
    const stVisitor = new SymbolTableVisitor(globalTable);

    for (const [fileName, ast] of Object.entries(asts)) {
      if (ast) {
        try {
          stVisitor.visit(ast);
        } catch (err: any) {
          if (err instanceof JackCompilerError) {
            errors.push(this.formatError(fileName, err));
          }
        }
      }
    }

    return { globalTable, errors };
  }

  private runSemanticPass(asts: Record<string, JackClassNode | null>, globalTable: GlobalSymbolTable): CompilerError[] {
    const errors: CompilerError[] = [];
    const semanticVisitor = new JackSemanticVisitor(globalTable);

    for (const [fileName, ast] of Object.entries(asts)) {
      if (ast) {
        try {
          semanticVisitor.visit(ast);
          
          const semanticErrors = semanticVisitor.getErrorsForCurrentPass();
          for (const err of semanticErrors) {
            errors.push(this.formatError(fileName, err as JackCompilerError));
          }
        } catch (err: any) {
          if (err instanceof JackCompilerError) {
            errors.push(this.formatError(fileName, err));
          }
        }
      }
    }

    return errors;
  }

  private runCodeWriterPass(asts: Record<string, JackClassNode | null>, globalTable: GlobalSymbolTable): { compiledFiles: VirtualFile[], errors: CompilerError[] } {
    const compiledFiles: VirtualFile[] = [];
    const errors: CompilerError[] = [];

    for (const [fileName, ast] of Object.entries(asts)) {
      if (ast) {
        try {
          const codeWriter = new CodeWriterVisitor(globalTable);
          codeWriter.visit(ast);
          
          const vmCode = codeWriter.getVMCode();
          const vmFileName = fileName.replace(".jack", ".vm");

          compiledFiles.push({
            id: `compiled-${vmFileName}`, // Unique ID for the VFS
            name: vmFileName,
            language: "hackvm",
            content: vmCode
          });
        } catch (err: any) {
          if (err instanceof JackCompilerError) {
            errors.push(this.formatError(fileName, err));
          } else {
            // Fallback for unexpected generator errors
            errors.push({
              message: `[${fileName}] VM Generation Error: ${err.message}`,
              line: 1,
              startCol: 1,
              endCol: 10
            });
          }
        }
      }
    }

    return { compiledFiles, errors };
  }

  // ==========================================
  // UTILS
  // ==========================================
  private formatError(fileName: string, err: JackCompilerError): CompilerError {
    const line = err.line || 1;
    const col = err.column || 1;
    const length = err.lexeme?.length || 5;

    return {
      message: `[${fileName}] ${err.message}`,
      line: line,
      startCol: col,
      endCol: col + length
    };
  }
}