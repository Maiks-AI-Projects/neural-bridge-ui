"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Search, Calendar, Clock, Activity, BrainCircuit, Lightbulb, User, Bot } from "lucide-react";

interface Idea {
  id: string;
  name: string;
}

interface TranscriptPart {
  role: 'user' | 'yasmin';
  text: string;
}

interface Session {
  id: string;
  start_time: Date;
  end_time: Date | null;
  full_transcript: string;
  inferred_mood: string;
  energy_level: number;
  ideas: { idea: Idea }[];
}

interface ConversationsClientProps {
  initialSessions: any[];
}

function ConversationsContent({ initialSessions }: ConversationsClientProps) {
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState<string>(initialSessions[0]?.id || "");

  useEffect(() => {
    const id = searchParams.get("id");
    if (id && initialSessions.some(s => s.id === id)) {
      setSelectedSessionId(id);
    }
  }, [searchParams, initialSessions]);

  const sessions = initialSessions.map(s => {
    let transcript: TranscriptPart[] = [];
    try {
      // Assuming transcript is stored as JSON string or needs parsing
      // If it's just raw text, we might need a different way to display it.
      // For now, let's assume it's structured or we'll just show it as a block.
      transcript = JSON.parse(s.full_transcript);
    } catch (e) {
      transcript = [{ role: 'user', text: s.full_transcript }];
    }

    return {
      ...s,
      date: new Date(s.start_time).toLocaleDateString(),
      time: new Date(s.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      duration: s.end_time ? \`\${Math.round((new Date(s.end_time).getTime() - new Date(s.start_time).getTime()) / 60000)}m\` : "Active",
      transcript,
      displayIdeas: s.ideas.map((i: any) => ({ id: i.idea.id, title: i.idea.name }))
    };
  });

  const filteredSessions = sessions.filter(s => 
    s.date.includes(searchQuery) || 
    s.inferred_mood.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.full_transcript.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedSession = sessions.find(s => s.id === selectedSessionId) || sessions[0];

  if (!selectedSession && sessions.length === 0) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-500 flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p>No voice sessions recorded yet.</p>
          <Link href="/yasmin" className="text-blue-500 hover:underline mt-4 inline-block">Start a conversation with Yasmin</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800 p-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Conversation History</h1>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input 
            type="text" 
            placeholder="Search transcripts, moods..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Session List */}
        <aside className="w-80 bg-zinc-900/50 border-r border-zinc-800 flex flex-col overflow-y-auto shrink-0">
          {filteredSessions.map(session => (
            <button
              key={session.id}
              onClick={() => setSelectedSessionId(session.id)}
              className={`p-4 text-left border-b border-zinc-800/50 transition-colors ${
                selectedSessionId === session.id ? 'bg-zinc-800 border-l-4 border-l-blue-500' : 'hover:bg-zinc-800/50 border-l-4 border-l-transparent'
              }`}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-zinc-400" /> {session.date}
                </span>
                <span className="text-xs text-zinc-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {session.time}
                </span>
              </div>
              <p className="text-sm text-zinc-300 truncate mb-2">
                {session.transcript[0]?.text || "Audio Session"}
              </p>
              <div className="flex gap-2">
                <span className="text-xs px-2 py-1 rounded-full bg-zinc-700 text-zinc-200">
                  {session.inferred_mood}
                </span>
                <span className="text-xs px-2 py-1 rounded-full bg-blue-900/30 text-blue-400">
                  ⚡ {session.energy_level * 10}%
                </span>
              </div>
            </button>
          ))}
          {filteredSessions.length === 0 && (
            <div className="p-8 text-center text-zinc-500">No sessions found.</div>
          )}
        </aside>

        {/* Main Content - Viewer */}
        <main className="flex-1 flex flex-col bg-zinc-950 overflow-hidden">
          {selectedSession && (
            <>
              {/* Metadata Dashboard */}
              <div className="bg-zinc-900/80 p-6 border-b border-zinc-800 flex justify-between items-end shrink-0">
                <div>
                  <h2 className="text-3xl font-bold mb-1">Session Insights</h2>
                  <div className="flex items-center gap-4 text-sm text-zinc-400">
                    <span className="flex items-center gap-1"><Calendar className="w-4 h-4"/> {selectedSession.date}</span>
                    <span className="flex items-center gap-1"><Clock className="w-4 h-4"/> {selectedSession.time} ({selectedSession.duration})</span>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="bg-zinc-800/50 p-3 rounded-xl border border-zinc-700 flex flex-col items-center min-w-[100px]">
                    <span className="text-xs text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Activity className="w-3 h-3"/> Energy</span>
                    <div className="text-2xl font-bold text-blue-400">{selectedSession.energy_level * 10}%</div>
                    <div className="w-full bg-zinc-700 h-1 mt-2 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full" style={{ width: \`\${selectedSession.energy_level * 10}%\` }} />
                    </div>
                  </div>
                  <div className="bg-zinc-800/50 p-3 rounded-xl border border-zinc-700 flex flex-col items-center min-w-[100px]">
                    <span className="text-xs text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1"><BrainCircuit className="w-3 h-3"/> Mood</span>
                    <div className="text-lg font-bold text-emerald-400 mt-1">{selectedSession.inferred_mood}</div>
                  </div>
                </div>
              </div>

              <div className="flex flex-1 overflow-hidden">
                {/* Transcript Area */}
                <div className="flex-1 p-6 overflow-y-auto space-y-6">
                  {selectedSession.transcript.map((msg, idx) => (
                    <div key={idx} className={`flex gap-4 \${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {msg.role === 'yasmin' && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center shrink-0 mt-1">
                          <Bot className="w-5 h-5 text-white" />
                        </div>
                      )}
                      <div className={`max-w-[75%] p-4 rounded-2xl text-[15px] leading-relaxed \${
                        msg.role === 'user' 
                          ? 'bg-blue-600 text-white rounded-tr-sm' 
                          : 'bg-zinc-800 text-zinc-200 border border-zinc-700 rounded-tl-sm'
                      }\`}>
                        {msg.text}
                      </div>
                      {msg.role === 'user' && (
                        <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center shrink-0 mt-1">
                          <User className="w-5 h-5 text-zinc-300" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Artifacts Sidebar */}
                <aside className="w-72 bg-zinc-900 border-l border-zinc-800 p-4 overflow-y-auto shrink-0">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" /> Generated Ideas
                  </h3>
                  {selectedSession.displayIdeas.length > 0 ? (
                    <div className="space-y-3">
                      {selectedSession.displayIdeas.map((idea: any) => (
                        <Link href={\`/admin/ideas?id=\${idea.id}\`} key={idea.id}>
                          <div className="p-3 bg-zinc-800 hover:bg-zinc-700 transition-colors border border-zinc-700 rounded-xl cursor-pointer block">
                            <p className="text-sm font-medium text-blue-300">{idea.title}</p>
                            <p className="text-xs text-zinc-500 mt-1">Click to view in Ideas board</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-zinc-500 italic p-4 bg-zinc-800/30 rounded-xl border border-zinc-800/50">
                      No ideas generated during this session.
                    </div>
                  )}
                </aside>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export function ConversationsClient(props: ConversationsClientProps) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-500 italic">Loading conversation history...</div>}>
      <ConversationsContent {...props} />
    </Suspense>
  );
}
