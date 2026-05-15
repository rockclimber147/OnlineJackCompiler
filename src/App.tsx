import { useState } from "react";
import { Cpu, Binary, Wrench } from "lucide-react";
import { type TabType } from "./types/compiler";
import { AssemblerPage } from "./pages/AssemblerPage";

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>("assembler");

  return (
    <div className="h-screen w-screen bg-slate-900 text-slate-100 flex flex-col font-sans overflow-hidden">
      
      {/* Universal Desktop Application Bar */}
      <header className="h-14 border-b border-slate-800 bg-slate-950 flex items-center justify-between px-6 shrink-0 shadow-md z-40">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 font-bold tracking-wider text-indigo-400">
            <Wrench size={20} />
            <span className="text-slate-100">Nand2Tetris Suite</span>
          </div>

          {/* Functional Navigation Tabs */}
          <nav className="flex items-center h-full border-l border-slate-800 pl-6 gap-2">
            <button
              onClick={() => setActiveTab("assembler")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === "assembler"
                  ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              <Binary size={16} /> Assembler
            </button>
            <button
              onClick={() => setActiveTab("cpuemulator")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === "cpuemulator"
                  ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              <Cpu size={16} /> CPU Emulator
            </button>
          </nav>
        </div>
      </header>

      {/* Primary Page Viewer Context Container */}
      <div className="flex-grow overflow-hidden relative">
        {activeTab === "assembler" && <AssemblerPage />}
        
        {activeTab === "cpuemulator" && (
          <div className="h-full w-full bg-slate-900 flex items-center justify-center font-mono text-slate-400 italic text-sm">
            CPU Emulator engine workspace placeholder. Ready when you are!
          </div>
        )}
      </div>
    </div>
  );
}