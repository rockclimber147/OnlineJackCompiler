import { type Monaco } from "@monaco-editor/react";

export function registerHackLanguage(monaco: Monaco) {
  if (monaco.languages.getLanguages().some((lang: { id: string; }) => lang.id === "hackasm")) return;

  monaco.languages.register({ id: "hackasm" });

  monaco.languages.setMonarchTokensProvider("hackasm", {
    tokenizer: {
      root: [
        // A-instructions (@value or @symbol)
        [/@[a-zA-Z0-9_.$:]+/, "keyword"],
        
        // Labels (LOOP)
        [/\([a-zA-Z0-9_.$:]+\)/, "type.identifier"],
        
        // C-instruction fields (Dest, Comp, Jump)
        [/\b(AMD|AM|AD|MD|A|D|M)\b/, "variable.predefined"],
        [/\b(JGT|JEQ|JGE|JLT|JNE|JLE|JMP)\b/, "tag"],
        
        // Numbers
        [/\b\d+\b/, "number"],
        
        // Comments
        [/\/\/.*$/, "comment"],
      ]
    }
  });

  monaco.languages.setLanguageConfiguration("hackasm", {
    comments: {
      lineComment: "//",
    }
  });
}