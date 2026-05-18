import { GlobalSymbolTable } from './SymbolTable';

export class SymbolTableBuiltinBuilder {
  public static populate(table: GlobalSymbolTable): void {
    // --- MATH ---
    const math = table.addClass('Math');
    math.setBuiltIn();
    math.defineSubroutine('multiply', 'function');
    math.defineSubroutine('divide', 'function');
    math.defineSubroutine('abs', 'function');
    math.defineSubroutine('min', 'function');
    math.defineSubroutine('max', 'function');
    math.defineSubroutine('sqrt', 'function');

    // --- STRING ---
    const string = table.addClass('String');
    string.setBuiltIn();
    string.defineSubroutine('new', 'constructor');
    string.defineSubroutine('dispose', 'method');
    string.defineSubroutine('length', 'method');
    string.defineSubroutine('charAt', 'method');
    string.defineSubroutine('setCharAt', 'method');
    string.defineSubroutine('appendChar', 'method');
    string.defineSubroutine('eraseLastChar', 'method');
    string.defineSubroutine('intValue', 'method');
    string.defineSubroutine('setInt', 'method');
    string.defineSubroutine('backSpace', 'function');
    string.defineSubroutine('doubleQuote', 'function');
    string.defineSubroutine('newLine', 'function');

    // --- ARRAY ---
    const array = table.addClass('Array');
    array.setBuiltIn();
    array.defineSubroutine('new', 'function');
    array.defineSubroutine('dispose', 'method');

    // --- OUTPUT ---
    const output = table.addClass('Output');
    output.setBuiltIn();
    output.defineSubroutine('moveCursor', 'function');
    output.defineSubroutine('printChar', 'function');
    output.defineSubroutine('printString', 'function');
    output.defineSubroutine('printInt', 'function');
    output.defineSubroutine('println', 'function');
    output.defineSubroutine('backSpace', 'function');

    // --- SCREEN ---
    const screen = table.addClass('Screen');
    screen.setBuiltIn();
    screen.defineSubroutine('clearScreen', 'function');
    screen.defineSubroutine('setColor', 'function');
    screen.defineSubroutine('drawPixel', 'function');
    screen.defineSubroutine('drawLine', 'function');
    screen.defineSubroutine('drawRectangle', 'function');
    screen.defineSubroutine('drawCircle', 'function');

    // --- KEYBOARD ---
    const keyboard = table.addClass('Keyboard');
    keyboard.setBuiltIn();
    keyboard.defineSubroutine('keyPressed', 'function');
    keyboard.defineSubroutine('readChar', 'function');
    keyboard.defineSubroutine('readLine', 'function');
    keyboard.defineSubroutine('readInt', 'function');

    // --- MEMORY ---
    const memory = table.addClass('Memory');
    memory.setBuiltIn();
    memory.defineSubroutine('peek', 'function');
    memory.defineSubroutine('poke', 'function');
    memory.defineSubroutine('alloc', 'function');
    memory.defineSubroutine('deAlloc', 'function');

    // --- SYS ---
    const sys = table.addClass('Sys');
    sys.setBuiltIn();
    sys.defineSubroutine('halt', 'function');
    sys.defineSubroutine('error', 'function');
    sys.defineSubroutine('wait', 'function');
  }
}
