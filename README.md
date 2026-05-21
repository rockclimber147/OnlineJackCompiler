# Jack Compiler & Hack IDE

A complete, browser-based integrated development environment and compiler toolchain for the Jack programming language and Hack architecture (Nand2Tetris). 

This project implements a full compilation pipeline—from high-level object-oriented code down to raw machine binary—entirely in the browser. It is designed to explore compiler design, low-level systems, and "under-the-hood" software engineering.

## Features

* **Full-Stack Compilation Pipeline:**
  * **Jack Compiler:** Compiles ```.jack``` source code into intermediate ```.vm``` bytecode.
  * **VM Translator:** Translates ```.vm``` stack-machine code into Hack Assembly (```.asm```).
  * **Assembler:** Assembles ```.asm``` files into executable Hack Binary (```.hack```).
* **Advanced Semantic Analysis:**
  * Strict duplicate identifier prevention and scope shadowing checks.
  * Robust control flow analysis (guaranteed return path validation).
  * Strict return-type checking for both ```void``` and typed subroutines.
* **Rich Browser IDE:**
  * **Virtual File System (VFS):** State-managed workspace with robust duplicate file prevention, file importing, and workspace exporting.
  * **Monaco Editor Integration:** Real-time syntax highlighting and precise inline error squigglies mapped directly to AST tokens.
  * **Resizable Interface:** Drag-and-drop panel architecture for side-by-side code authoring, symbol table inspection, and VM output viewing.
* **Jack OS Integration:** 1-click loading of standard library OS classes (```Math```, ```Memory```, ```Screen```, etc.).

## Tech Stack

* **Frontend Framework:** React, TypeScript, Vite
* **Editor Component:** Monaco Editor (```@monaco-editor/react```)
* **UI Utilities:** ```lucide-react```, ```react-resizable-panels```
* **Testing:** Vitest

## Compiler Architecture

The compiler features a classic multi-pass architecture, ensuring clean separation of concerns:

1. **Phase 1: Lexical & Syntax Analysis**
   * **Tokenizer:** Strips whitespace/comments and breaks source into a stream of Jack tokens.
   * **Parser (Recursive Descent):** Constructs a strongly-typed Abstract Syntax Tree (AST).
2. **Phase 2: Symbol Resolution**
   * **Symbol Table Visitor:** Walks the AST to build class-level and subroutine-level symbol tables, mapping variable scopes and assigning memory segments.
3. **Phase 3: Semantic Analysis**
   * **Semantic Visitor:** Validates expression types, subroutine calls, control-flow paths, and variable initialization, throwing targeted ```JackCompilerError```s for the IDE.
4. **Phase 4: Code Generation**
   * **Code Writer Visitor:** Traverses the validated AST to emit stack-based Hack VM bytecode.

## Getting Started

To run the IDE locally:

1. **Clone the repository**
   ```bash
   git clone https://github.com/rockclimber147/OnlineJackCompiler.git
   cd OnlineJackCompiler
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Run the test suite**
   ```bash
   npm run test
   ```

## Author

**Daylen Smith**
*Software Developer*

Built with a passion for learning how complex systems work from the ground up.