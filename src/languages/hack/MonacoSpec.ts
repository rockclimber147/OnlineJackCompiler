import { type Monaco } from "@monaco-editor/react";

export function registerBinaryLanguage(monaco: Monaco) {
  if (monaco.languages.getLanguages().some((lang: { id: string; }) => lang.id === "hackbinary")) return;

  monaco.languages.register({ id: "hackbinary" });

  monaco.languages.setMonarchTokensProvider("hackbinary", {
    tokenizer: {
      root: [
        // C-Instruction: 111 a cccccc ddd jjj
        // Groups: 111(pink) a(blue) comp(orange) dest(green) jump(yellow)
        [
          /^(111)([01])([01]{6})([01]{3})([01]{3})/, 
          ["keyword", "type", "string", "number", "tag"]
        ],

        // A-Instruction: 0 value
        // Groups: 0(pink) value(green)
        [
          /^(0)([01]{15})/, 
          ["keyword", "number"]
        ],

        // Comments (in case your assembler leaves comments in the output)
        [/\/\/.*$/, "comment"],
        
        // Fallback
        [/[01]+/, "text"]
      ]
    }
  });

  monaco.languages.setLanguageConfiguration("hackbinary", {
    comments: {
      lineComment: "//",
    }
  });
}