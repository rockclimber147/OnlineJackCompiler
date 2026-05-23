import { Parser } from "./Parser";
import { CodeWriter } from "./CodeWriter";
import { VMCommandType } from "../../languages/vm/VmSpec";
import { type VirtualFile } from "../../types/Vfs";
import { type CompilerError } from "../../types/compiler"; 
import { VMSymbolTable, type VMSymbol } from "./SymbolTable";

export interface VMTranslationResult {
  success: boolean;
  asmOutput: string;
  errors: CompilerError[]; 
  symbols: VMSymbol[]; // <-- NEW: Output symbols for the UI
}

export class VMTranslator {
  private symbolTable = new VMSymbolTable();
  private errors: CompilerError[] = [];

  public translateAll(files: VirtualFile[]): VMTranslationResult {
    this.errors = [];
    this.symbolTable = new VMSymbolTable();
    const writer = new CodeWriter();

    try {
      const vmFiles = files.filter(f => f.name.endsWith(".vm"));
      if (vmFiles.length === 0) {
        return { success: false, asmOutput: "// No VM files found", errors: [], symbols: [] };
      }

      // PASS 1: Build the Symbol Table
      this.symbolPass(vmFiles);

      // Halt if declaration errors were found (e.g., duplicate functions)
      if (this.errors.length > 0) {
        return { success: false, asmOutput: "// Translation failed during symbol pass", errors: this.errors, symbols: this.symbolTable.getUIData() };
      }

      // PASS 2: Translate and Validate
      const requiresBootstrap = vmFiles.length > 1 || vmFiles.some(f => f.name.includes("Sys.vm"));
      if (requiresBootstrap) {
        writer.writeInit();
        // N2T Spec requires Sys.init to exist if bootstrap is generated
        if (!this.symbolTable.hasFunction("Sys.init")) {
          this.errors.push({ message: "[Linker] Missing required function 'Sys.init' for bootstrap code", line: 1 });
        }
      }

      this.translationPass(vmFiles, writer);

      if (this.errors.length > 0) {
        return { success: false, asmOutput: "// Translation failed", errors: this.errors, symbols: this.symbolTable.getUIData() };
      }

      return {
        success: true,
        asmOutput: writer.getOutput(),
        errors: [],
        symbols: this.symbolTable.getUIData()
      };

    } catch (err: any) {
      return {
        success: false,
        asmOutput: "// Fatal Engine Error",
        errors: [{ message: `Fatal: ${err.message}`, line: 1 }],
        symbols: []
      };
    }
  }

  // --- PASS 1: MAP SYMBOLS ---
  private symbolPass(files: VirtualFile[]): void {
    for (const file of files) {
      const parser = new Parser(file.content);
      // Default scope if a label is declared outside a function
      let currentScope = file.name.replace(".vm", ""); 

      while (parser.hasMoreCommands()) {
        parser.advance();
        try {
          const type = parser.commandType();
          const line = parser.currentLineNumber();

          if (type === VMCommandType.C_FUNCTION) {
            currentScope = parser.arg1();
            if (!this.symbolTable.addFunction(currentScope, file.name, line)) {
              this.addError(file.name, `Duplicate function declaration: '${currentScope}'`, parser);
            }
          } else if (type === VMCommandType.C_LABEL) {
            const labelName = parser.arg1();
            if (!this.symbolTable.addLabel(labelName, currentScope, file.name, line)) {
              this.addError(file.name, `Duplicate label declaration: '${labelName}' in scope '${currentScope}'`, parser);
            }
          }
        } catch (e) {
        }
      }
    }
  }

  // --- PASS 2: TRANSLATE & VALIDATE ---
  private translationPass(files: VirtualFile[], writer: CodeWriter): void {
    for (const file of files) {
      writer.setFileName(file.name);
      writer.writeFileName();
      const parser = new Parser(file.content);
      let currentScope = file.name.replace(".vm", "");

      while (parser.hasMoreCommands()) {
        parser.advance();
        try {
          const type = parser.commandType();

          writer.writeComment(parser.currentRawText());
          

          if (type === "C_COMMENT") continue;

          // Update scope tracker so gotos check the right list
          if (type === VMCommandType.C_FUNCTION) currentScope = parser.arg1();

          // VALIDATION: Check Function Calls
          if (type === VMCommandType.C_CALL) {
            const funcName = parser.arg1();
            if (!this.symbolTable.hasFunction(funcName)) {
              this.addError(file.name, `Call to undefined function: '${funcName}'`, parser);
            }
          }

          // VALIDATION: Check Gotos
          if (type === VMCommandType.C_GOTO || type === VMCommandType.C_IF) {
            const labelName = parser.arg1();
            if (!this.symbolTable.hasLabel(labelName, currentScope)) {
              this.addError(file.name, `Jump to undefined label: '${labelName}' in scope '${currentScope}'`, parser);
            }
          }

          // WRITE CODE
          if (type === VMCommandType.C_ARITHMETIC) writer.writeArithmetic(parser.arg1());
          else if (type === VMCommandType.C_PUSH || type === VMCommandType.C_POP) writer.writePushPop(type, parser.arg1(), parser.arg2());
          else if (type === VMCommandType.C_LABEL) writer.writeLabel(parser.arg1());
          else if (type === VMCommandType.C_GOTO) writer.writeGoto(parser.arg1());
          else if (type === VMCommandType.C_IF) writer.writeIf(parser.arg1());
          else if (type === VMCommandType.C_FUNCTION) writer.writeFunction(parser.arg1(), parser.arg2());
          else if (type === VMCommandType.C_CALL) writer.writeCall(parser.arg1(), parser.arg2());
          else if (type === VMCommandType.C_RETURN) writer.writeReturn();

        } catch (err: any) {
          this.addError(file.name, err.message, parser);
        }
      }
    }
  }

  // Helper for consistent error formatting
  private addError(fileName: string, message: string, parser: Parser): void {
    const text = parser.currentLineRawText();
    this.errors.push({
      message: `[${fileName}] ${message}`,
      line: parser.currentLineNumber(),
      startCol: 1,
      endCol: text.length > 0 ? text.length + 1 : 1000
    });
  }
}