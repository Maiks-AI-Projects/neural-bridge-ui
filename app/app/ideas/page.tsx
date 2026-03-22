"use client";
import MobileNav from "@/components/MobileNav";
import { Lightbulb, Plus } from "lucide-react";

export default function IdeasPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white px-6 pt-16 pb-24">
      <header className="mb-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-yellow-500/20 p-3 rounded-2xl">
            <Lightbulb className="text-yellow-500" size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Ideas</h1>
            <p className="text-gray-400">Captured brainstorms.</p>
          </div>
        </div>
        <button className="bg-yellow-500 text-black w-14 h-14 rounded-2xl flex items-center justify-center font-bold">
          <Plus size={32} />
        </button>
      </header>
      
      <div className="grid grid-cols-1 gap-4">
        {[
          "Automated Grocery List via WhatsApp",
          "Solar Panel Energy Optimization",
          "Home Assistant Presence Tuning",
        ].map((idea, i) => (
          <div key={i} className="bg-[#151515] p-5 rounded-2xl border border-gray-800/50">
            <h3 className="font-bold text-lg mb-2">{idea}</h3>
            <div className="flex gap-2">
              <span className="text-[10px] bg-gray-800 px-2 py-1 rounded-full uppercase tracking-tighter text-gray-400 font-bold">Draft</span>
              <span className="text-[10px] bg-gray-800 px-2 py-1 rounded-full uppercase tracking-tighter text-gray-400 font-bold">2026-03-15</span>
            </div>
          </div>
        ))}
      </div>
      
      <MobileNav />
    </main>
  );
}
