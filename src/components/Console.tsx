import { useRef, useEffect } from "react";
import { Terminal as TerminalIcon, Trash2 } from "lucide-react";
import { type LogMessage } from "../types/compiler";

interface ConsoleProps {
  logs: LogMessage[];
}

export function Console({ logs }: ConsoleProps) {
  // 1. Create a reference to the bottom of the scroll container
  const bottomRef = useRef<HTMLDivElement>(null);

  // 2. Trigger a smooth scroll whenever the logs array changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div className="h-full bg-slate-950 flex flex-col">
      {/* Header Container */}
      <div className="bg-slate-900/80 px-4 py-2 text-xs text-slate-400 font-mono border-b border-slate-800 flex items-center justify-between select-none tracking-wider">
        <div className="flex items-center gap-2">
          <TerminalIcon size={12} className="text-indigo-400" /> CONSOLE OUTPUT
        </div>
      </div>
      
      {/* Log Output Area */}
      <div className="p-4 font-mono text-xs space-y-1.5 overflow-y-auto flex-grow select-text selection:bg-indigo-500/30">
        {logs.map((log, index) => (
          <div
            key={index}
            className={`leading-relaxed border-l-2 pl-3 ${
              log.type === "success"
                ? "border-emerald-500 text-emerald-400/90 bg-emerald-500/5"
                : log.type === "error"
                ? "border-rose-500 text-rose-400 bg-rose-500/5"
                : "border-indigo-500 text-slate-300"
            }`}
          >
            {log.text}
          </div>
        ))}
        
        {logs.length === 0 && (
          <div className="text-slate-600 italic">Console is clear...</div>
        )}

        {/* 3. Invisible anchor div at the very bottom of the list */}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}