import { type Monaco } from "@monaco-editor/react";
import { registerHackLanguage } from "./asm/MonacoSpec";

export function registerCustomLanguages(monaco: Monaco) {
  registerHackLanguage(monaco);
}