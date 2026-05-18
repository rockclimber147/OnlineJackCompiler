import { Parser } from "./Parser";
import { CodeWriter } from "./CodeWriter";
import { VMCommandType } from "../../languages/vm/VmSpec";
import { type VirtualFile } from "../../types/Vfs";

export interface VMTranslationResult {
  success: boolean;
  asmOutput: string;
  errors: string[];
}

export class VMTranslator {
  public translateAll(files: VirtualFile[]): VMTranslationResult {
    const errors: string[] = [];
    const writer = new CodeWriter();

    try {
      // If there are multiple files, or if there is a Sys.vm, N2T spec requires Bootstrap code.
      const requiresBootstrap = files.length > 1 || files.some(f => f.name.includes("Sys.vm"));
      if (requiresBootstrap) {
        writer.writeInit();
      }

      for (const file of files) {
        if (!file.name.endsWith(".vm")) continue;

        writer.setFileName(file.name);
        const parser = new Parser(file.content);

        let lineNum = 1;
        while (parser.hasMoreCommands()) {
          parser.advance();
          try {
            const type = parser.commandType();

            if (type === VMCommandType.C_ARITHMETIC) {
              writer.writeArithmetic(parser.arg1());
            } else if (type === VMCommandType.C_PUSH || type === VMCommandType.C_POP) {
              writer.writePushPop(type, parser.arg1(), parser.arg2());
            } else if (type === VMCommandType.C_LABEL) {
              writer.writeLabel(parser.arg1());
            } else if (type === VMCommandType.C_GOTO) {
              writer.writeGoto(parser.arg1());
            } else if (type === VMCommandType.C_IF) {
              writer.writeIf(parser.arg1());
            } else if (type === VMCommandType.C_FUNCTION) {
              writer.writeFunction(parser.arg1(), parser.arg2());
            } else if (type === VMCommandType.C_CALL) {
              writer.writeCall(parser.arg1(), parser.arg2());
            } else if (type === VMCommandType.C_RETURN) {
              writer.writeReturn();
            }
          } catch (err: any) {
             errors.push(`Error in ${file.name} at command index ${lineNum}: ${err.message}`);
          }
          lineNum++;
        }
      }

      if (errors.length > 0) {
        return { success: false, asmOutput: "// Translation failed", errors };
      }

      return {
        success: true,
        asmOutput: writer.getOutput(),
        errors: []
      };

    } catch (err: any) {
      return {
        success: false,
        asmOutput: "// Fatal Engine Error",
        errors: [err.message]
      };
    }
  }
}