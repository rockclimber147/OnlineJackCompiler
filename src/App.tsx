import { useState, useEffect } from "react";
import { Cpu, Binary, Wrench, FileCode2, Braces } from "lucide-react";
import { type TabType } from "./types/compiler";
import { AssemblerPage } from "./pages/AssemblerPage";
import { VMTranslatorPage } from "./pages/VMTranslatorPage";
import { JackCompilerPage } from "./pages/JackCompilerPage";

export default function App() {
  // 1. Initialize state from localStorage (or default to "assembler")
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const savedTab = localStorage.getItem("nand2tetris_active_tab");
    return (savedTab as TabType) || "assembler";
  });

  // 2. Save to localStorage whenever the tab changes
  useEffect(() => {
    localStorage.setItem("nand2tetris_active_tab", activeTab);
  }, [activeTab]);

  return (
    <div className="h-screen w-screen bg-slate-900 text-slate-100 flex flex-col font-sans overflow-hidden">
      
      <header className="h-14 border-b border-slate-800 bg-slate-950 flex items-center justify-between px-6 shrink-0 shadow-md z-40">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 font-bold tracking-wider text-indigo-400">
            <Wrench size={20} />
            <span className="text-slate-100">Nand2Tetris Suite</span>
          </div>

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
              onClick={() => setActiveTab("vmtranslator")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === "vmtranslator"
                  ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              <FileCode2 size={16} /> VM Translator
            </button>

            <button
              onClick={() => setActiveTab("jackcompiler")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === "jackcompiler"
                  ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              <Braces size={16} /> Jack Compiler
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

      {/* 3. Render ALL pages, but use CSS to hide the inactive ones */}
      <div className="flex-grow overflow-hidden relative">
        
        <div className={`h-full w-full ${activeTab === "assembler" ? "block" : "hidden"}`}>
          <AssemblerPage />
        </div>
        
        <div className={`h-full w-full ${activeTab === "vmtranslator" ? "block" : "hidden"}`}>
          <VMTranslatorPage />
        </div>

        <div className={`h-full w-full ${activeTab === "jackcompiler" ? "block" : "hidden"}`}>
          <JackCompilerPage />
        </div>
        
        <div className={`h-full w-full ${activeTab === "cpuemulator" ? "flex" : "hidden"} bg-slate-900 items-center justify-center font-mono text-slate-400 italic text-sm`}>
          CPU Emulator engine workspace placeholder. Ready when you are!
        </div>

      </div>
    </div>
  );
}