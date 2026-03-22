"use client";
import MobileNav from "@/components/MobileNav";
import { MessageSquare } from "lucide-react";

export default function ConversationsPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white px-6 pt-16 pb-24">
      <header className="mb-10 flex items-center gap-4">
        <div className="bg-blue-600/20 p-3 rounded-2xl">
          <MessageSquare className="text-blue-500" size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Conversations</h1>
          <p className="text-gray-400">Recent transcripts and AI logs.</p>
        </div>
      </header>
      
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-[#151515] p-5 rounded-2xl border border-gray-800/50">
            <h3 className="font-bold text-lg mb-1 italic text-blue-400">Chat Session #{i}04</h3>
            <p className="text-gray-400 text-sm line-clamp-2">The AI discussed the schedule with Yasmin and resolved the conflict between the cleaners and the helpers...</p>
          </div>
        ))}
      </div>
      
      <MobileNav />
    </main>
  );
}
