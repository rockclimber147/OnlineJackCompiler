import { BoxSelect, Tag } from "lucide-react";
import { type VMSymbol } from "../compiler/VMTranslator/SymbolTable";

interface VMSymbolTableViewerProps {
  symbols: VMSymbol[];
}

export function VMSymbolTableViewer({ symbols }: VMSymbolTableViewerProps) {
  // Separate functions and labels for cleaner grouping
  const functions = symbols.filter(s => s.type === "function");
  const labels = symbols.filter(s => s.type === "label");

  return (
    <div className="flex flex-col h-full bg-[#181818] select-none text-slate-300">
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {symbols.length === 0 ? (
          <div className="px-4 py-4 text-xs text-slate-600 italic text-center">
            No symbols found.
          </div>
        ) : (
          <div className="flex flex-col pb-4">
            
            {/* Functions Section */}
            {functions.length > 0 && (
              <div className="mb-4">
                <div className="sticky top-0 bg-[#181818]/90 backdrop-blur px-3 py-1.5 text-[10px] font-bold text-slate-500 tracking-wider border-b border-black/20 z-10">
                  FUNCTIONS ({functions.length})
                </div>
                <div className="flex flex-col">
                  {functions.map((sym, idx) => (
                    <div key={`fn-${idx}`} className="flex items-center justify-between px-3 py-1.5 text-xs border-b border-white/5 hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <BoxSelect size={12} className="text-emerald-500 shrink-0" />
                        <span className="font-mono text-emerald-400 truncate">{sym.name}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 shrink-0 ml-2">
                        {sym.file}:{sym.line}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Labels Section */}
            {labels.length > 0 && (
              <div>
                <div className="sticky top-0 bg-[#181818]/90 backdrop-blur px-3 py-1.5 text-[10px] font-bold text-slate-500 tracking-wider border-b border-black/20 z-10">
                  LABELS ({labels.length})
                </div>
                <div className="flex flex-col">
                  {labels.map((sym, idx) => (
                    <div key={`lbl-${idx}`} className="flex items-center justify-between px-3 py-1.5 text-xs border-b border-white/5 hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <Tag size={12} className="text-amber-500 shrink-0" />
                        <span className="font-mono text-amber-400 truncate">{sym.name}</span>
                      </div>
                      <div className="flex flex-col items-end shrink-0 ml-2">
                        <span className="text-[10px] text-slate-500">{sym.scope}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}