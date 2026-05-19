import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { type SymbolScope } from '../compiler/SymbolTable/types';

export function JackSymbolTableViewer({ symbolTable }: { symbolTable: any }) {
  if (!symbolTable) {
    return (
      <div className="flex h-full items-center justify-center text-slate-500 text-sm italic">
        Run compiler to generate the symbol table.
      </div>
    );
  }

  const visualData: SymbolScope = symbolTable.toVisual();

  return (
    <div className="h-full w-full overflow-auto p-4 bg-[#252526] text-slate-300 select-text">
      <ScopeViewer scope={visualData} defaultExpanded={true} />
    </div>
  );
}

function ScopeViewer({ scope, defaultExpanded = false }: { scope: SymbolScope; defaultExpanded?: boolean }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  
  const symbolEntries = Object.entries(scope.symbols || {});
  const childScopes = Object.values(scope.children || {});

  return (
    <div className="mb-2">
      {/* Scope Header */}
      <div 
        className="flex items-center gap-1.5 cursor-pointer text-indigo-400 font-semibold py-1 hover:bg-slate-800/50 rounded transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <span>{scope.name}</span>
        {scope.metadata?.category && (
          <span className="text-slate-500 font-normal text-xs ml-2 uppercase tracking-wide">
            {scope.metadata.category}
          </span>
        )}
      </div>
      
      {/* Scope Content (Variables & Nested Scopes) */}
      {expanded && (
        <div className="ml-2 pl-4 border-l border-slate-700/50 mt-1 mb-3">
          
          {/* Symbols Table */}
          {symbolEntries.length > 0 && (
            <table className="w-full text-left border-collapse mb-4">
              <thead>
                <tr className="text-slate-500 border-b border-slate-700 text-[11px] uppercase tracking-wider">
                  <th className="pb-1.5 font-medium w-1/4">Name</th>
                  <th className="pb-1.5 font-medium w-1/4">Type</th>
                  <th className="pb-1.5 font-medium w-1/4">Kind</th>
                  <th className="pb-1.5 font-medium">Index</th>
                </tr>
              </thead>
              <tbody>
                {symbolEntries.map(([name, meta]) => (
                  <tr key={name} className="border-b border-slate-800/30 hover:bg-slate-800/50 transition-colors">
                    <td className="py-1.5 font-mono text-indigo-300 text-xs">{name}</td>
                    <td className="py-1.5 text-slate-300 text-xs">{meta.type}</td>
                    <td className="py-1.5 text-slate-400 text-xs">{meta.kind}</td>
                    <td className="py-1.5 text-slate-500 font-mono text-xs">{meta.index}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Empty State */}
          {symbolEntries.length === 0 && childScopes.length === 0 && (
            <div className="text-slate-600 italic text-xs mb-3">No symbols defined in this scope.</div>
          )}

          {/* Render Children Scopes */}
          {childScopes.map(child => (
            <ScopeViewer key={child.name} scope={child} defaultExpanded={true} />
          ))}
        </div>
      )}
    </div>
  );
}