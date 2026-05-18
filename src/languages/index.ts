import { type Monaco } from "@monaco-editor/react";
import { registerHackLanguage } from "./asm/MonacoSpec";
import { registerJackLanguage } from "./jack/MonacoSpec";
import { registerVMLanguage } from "./vm/MonacoSpec";
import { registerBinaryLanguage } from "./hack/MonacoSpec";

export function registerCustomLanguages(monaco: Monaco) {
  registerHackLanguage(monaco);
  registerJackLanguage(monaco);
  registerVMLanguage(monaco);
  registerBinaryLanguage(monaco);
}