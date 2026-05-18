import { type Monaco } from "@monaco-editor/react";

export function registerJackLanguage(monaco: Monaco) {
  if (monaco.languages.getLanguages().some((lang: { id: string; }) => lang.id === "jack")) return;

  monaco.languages.register({ id: "jack" });

  monaco.languages.setMonarchTokensProvider("jack", {
    keywords: [
      'class', 'constructor', 'function', 'method', 'field', 'static', 'var',
      'int', 'char', 'boolean', 'void', 'true', 'false', 'null', 'this',
      'let', 'do', 'if', 'else', 'while', 'return'
    ],
    operators: [
      '+', '-', '*', '/', '&', '|', '<', '>', '=', '~'
    ],
    symbols: /[=><!~?:&|+\-*\/\^%]+/,
    tokenizer: {
      root: [
        // Identifiers and keywords
        [/[a-zA-Z_]\w*/, {
          cases: {
            '@keywords': 'keyword',
            '@default': 'identifier'
          }
        }],

        // Whitespace
        { include: '@whitespace' },

        // Delimiters and operators
        [/[{}()\[\]]/, '@brackets'],
        [/[<>](?!@symbols)/, '@brackets'],
        [/@symbols/, {
          cases: {
            '@operators': 'operator',
            '@default': ''
          }
        }],

        // Numbers
        [/\d+/, 'number'],

        // Strings
        [/"([^"\\]|\\.)*$/, 'string.invalid'],  
        [/"/, 'string', '@string'],
      ],
      whitespace: [
        [/[ \t\r\n]+/, 'white'],
        [/\/\*/, 'comment', '@comment'],
        [/\/\/.*$/, 'comment'],
      ],
      comment: [
        [/[^\/*]+/, 'comment'],
        [/\*\//, 'comment', '@pop'],
        [/[\/*]/, 'comment']
      ],
      string: [
        [/[^\\"]+/, 'string'],
        [/\\./, 'string.escape'],
        [/"/, 'string', '@pop']
      ],
    }
  });

  monaco.languages.setLanguageConfiguration("jack", {
    comments: {
      lineComment: "//",
      blockComment: ["/*", "*/"]
    },
    brackets: [
      ["{", "}"], ["[", "]"], ["(", ")"]
    ],
    autoClosingPairs: [
      { open: "{", close: "}" },
      { open: "[", close: "]" },
      { open: "(", close: ")" },
      { open: '"', close: '"' }
    ]
  });
}