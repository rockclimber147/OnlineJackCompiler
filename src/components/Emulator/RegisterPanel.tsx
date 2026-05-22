export function RegisterPanel({ pc, registers }: { pc: number, registers: any }) {
  return (
    <div className="bg-slate-950 p-4 rounded border border-slate-800">
      <h2 className="text-xs text-slate-400 uppercase tracking-wider mb-3">Registers</h2>
      <div className="font-mono text-lg space-y-1">
        <div className="flex justify-between"><span>PC:</span> <span className="text-indigo-400">{pc}</span></div>
        <div className="flex justify-between"><span>A:</span> <span className="text-emerald-400">{registers.a}</span></div>
        <div className="flex justify-between"><span>D:</span> <span className="text-amber-400">{registers.d}</span></div>
      </div>
    </div>
  );
}