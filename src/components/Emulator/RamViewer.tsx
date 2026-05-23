import { Virtuoso } from 'react-virtuoso';
import { useState } from 'react';

interface RamViewerProps {
  getRamRange: (start: number, len: number) => number[];
  setRam: (addr: number, val: number) => void;
  clearRam: () => void;
}

export function RamViewer({ getRamRange, setRam, clearRam }: RamViewerProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-800">
      {/* Header Container */}
      <div className="flex items-center justify-between p-4">
        <h2 className="text-xs text-slate-400 uppercase tracking-wider">RAM</h2>
        <button 
          onClick={clearRam}
          className="text-[10px] bg-red-900/30 text-red-400 hover:bg-red-800/50 px-2 py-1 rounded transition-colors uppercase font-bold"
        >
          Clear
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        <Virtuoso
          totalCount={16384}
          itemContent={(index) => {
            const val = getRamRange(index, 1)[0];
            const isEditing = editingIndex === index;
            return (
              <div className="flex items-center justify-between px-4 py-1 border-b border-slate-800/50 font-mono text-xs">
                <span className="text-slate-600 w-12">{index}:</span>
                {isEditing ? (
                  <input
                    autoFocus
                    type="number"
                    className="w-20 bg-slate-800 text-indigo-400 px-1 rounded border border-indigo-500 outline-none"
                    defaultValue={val}
                    onBlur={(e) => { setRam(index, parseInt(e.target.value) || 0); setEditingIndex(null); }}
                    onKeyDown={(e) => { if(e.key === 'Enter') e.currentTarget.blur(); if(e.key === 'Escape') setEditingIndex(null); }}
                  />
                ) : (
                  <span 
                    className={`${val !== 0 ? "text-indigo-400 font-bold" : "text-slate-200"} cursor-pointer hover:bg-slate-800 px-1 rounded`} 
                    onClick={() => setEditingIndex(index)}
                  >
                    {val}
                  </span>
                )}
              </div>
            );
          }}
        />
      </div>
    </div>
  );
}