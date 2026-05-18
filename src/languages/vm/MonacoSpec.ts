import { type Monaco } from "@monaco-editor/react";

export function registerVMLanguage(monaco: Monaco) {
  if (monaco.languages.getLanguages().some((lang: { id: string; }) => lang.id === "hackvm")) return;

  monaco.languages.register({ id: "hackvm" });

  monaco.languages.setMonarchTokensProvider("hackvm", {
    tokenizer: {
      root: [
        // Stack Commands
        [/\b(push|pop)\b/, "keyword"],
        
        // Arithmetic & Logical Commands
        [/\b(add|sub|neg|eq|gt|lt|and|or|not)\b/, "operator"],
        
        // Branching Commands
        [/\b(label|goto|if-goto)\b/, "keyword.control"],
        
        // Function Commands
        [/\b(function|call|return)\b/, "keyword.function"],

        // Memory Segments
        [/\b(argument|local|static|constant|this|that|pointer|temp)\b/, "type.identifier"],

        // Numbers
        [/\b\d+\b/, "number"],

        // Custom function/label names
        [/[a-zA-Z_.$:][a-zA-Z0-9_.$:]*/, "variable"],

        // Comments
        [/\/\/.*$/, "comment"],
      ]
    }
  });

  monaco.languages.setLanguageConfiguration("hackvm", {
    comments: {
      lineComment: "//",
    }
  });
}