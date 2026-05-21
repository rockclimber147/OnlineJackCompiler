import arrayOS from '../languages/jack/os/Array.jack?raw';
import mathOS from '../languages/jack/os/Math.jack?raw';
import memoryOS from '../languages/jack/os/Memory.jack?raw';
import outputOS from '../languages/jack/os/Output.jack?raw';
import screenOS from '../languages/jack/os/Screen.jack?raw';
import keyboardOS from '../languages/jack/os/Keyboard.jack?raw';
import stringOS from '../languages/jack/os/String.jack?raw';
import sysOS from '../languages/jack/os/Sys.jack?raw';

export const JACK_OS_FILES = [
  { name: "Array.jack", content: arrayOS },
  { name: "Math.jack", content: mathOS },
  { name: "Memory.jack", content: memoryOS },
  { name: "Output.jack", content: outputOS },
  { name: "Screen.jack", content: screenOS },
  { name: "Keyboard.jack", content: keyboardOS },
  { name: "String.jack", content: stringOS },
  { name: "Sys.jack", content: sysOS }
];