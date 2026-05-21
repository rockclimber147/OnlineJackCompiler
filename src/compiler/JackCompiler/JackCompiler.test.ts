import { describe, expect, test } from 'vitest';
import { JackCompiler } from './JackCompiler';
import { type VirtualFile } from '../../types/Vfs';

describe('JackCompiler Orchestrator', () => {
  // Helper to quickly create VirtualFiles for testing
  const createVirtualFile = (name: string, content: string): VirtualFile => ({
    id: `test-${name}`,
    name,
    language: 'jack',
    content,
  });

  test('should successfully compile a valid Jack file through all 4 phases', () => {
    const files = [
      createVirtualFile('Main.jack', `
        class Main {
          function void main() {
            var int x;
            let x = 42;
            do Output.printInt(x);
            return;
          }
        }
      `)
    ];

    const compiler = new JackCompiler();
    const result = compiler.compileAll(files, true);

    expect(result.success).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.compiledFiles).toHaveLength(1);
    
    // Verify the output VM file metadata
    const vmFile = result.compiledFiles[0];
    expect(vmFile.name).toBe('Main.vm');
    expect(vmFile.language).toBe('hackvm');
    expect(vmFile.content).toContain('function Main.main 1');
    expect(vmFile.content).toContain('push constant 42');
  });

  test('should successfully compile multiple interdependent Jack files', () => {
    const files = [
      createVirtualFile('Main.jack', `
        class Main {
          function void main() {
            var Point p;
            let p = Point.new(10, 20);
            return;
          }
        }
      `),
      createVirtualFile('Point.jack', `
        class Point {
          field int x, y;
          constructor Point new(int ax, int ay) {
            let x = ax;
            let y = ay;
            return this;
          }
        }
      `)
    ];

    const compiler = new JackCompiler();
    const result = compiler.compileAll(files, true);

    expect(result.success).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.compiledFiles).toHaveLength(2);
    
    const fileNames = result.compiledFiles.map(f => f.name);
    expect(fileNames).toContain('Main.vm');
    expect(fileNames).toContain('Point.vm');
  });

  test('should halt at Phase 1 and return syntax errors without generating VM', () => {
    const files = [
      createVirtualFile('Main.jack', `
        class Main {
          function void main() 
            let x = 5; // Missing opening brace {
            return;
          }
        }
      `)
    ];

    const compiler = new JackCompiler();
    const result = compiler.compileAll(files, true);

    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.compiledFiles).toHaveLength(0);
    // The error should mention the file name
    expect(result.errors[0].message).toContain('[Main.jack]');
  });

  test('should halt at Phase 3 and return semantic errors without generating VM', () => {
    const files = [
      createVirtualFile('Main.jack', `
        class Main {
          function void main() {
            let x = 5; // Valid syntax, but 'x' is completely undeclared
            return;
          }
        }
      `)
    ];

    const compiler = new JackCompiler();
    const result = compiler.compileAll(files, true);

    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.compiledFiles).toHaveLength(0);
    // Should catch the undeclared variable from the semantic pass
    expect(result.errors.some(e => e.message.includes('x'))).toBe(true);
  });

  test('should skip Code Generation Phase 4 when generateVM is false', () => {
    const files = [
      createVirtualFile('Main.jack', `
        class Main {
          function void main() {
            return;
          }
        }
      `)
    ];

    const compiler = new JackCompiler();
    
    // Pass false to simulate the background linting pass
    const result = compiler.compileAll(files, false);

    expect(result.success).toBe(true);
    expect(result.errors).toHaveLength(0);
    
    // It should have built the AST and Symbol Table, but NOT the VM code
    expect(result.asts['Main.jack']).toBeDefined();
    expect(result.symbolTable).toBeDefined();
    expect(result.compiledFiles).toHaveLength(0);
  });

  test('should ignore non-Jack files in the workspace', () => {
    const files = [
      createVirtualFile('Main.jack', `class Main { function void main() { return; } }`),
      createVirtualFile('notes.txt', `Just some notes about my compiler.`),
      createVirtualFile('README.md', `# Jack Compiler`)
    ];

    const compiler = new JackCompiler();
    const result = compiler.compileAll(files, true);

    expect(result.success).toBe(true);
    // It should only compile Main.jack
    expect(result.compiledFiles).toHaveLength(1);
    expect(result.compiledFiles[0].name).toBe('Main.vm');
  });
});