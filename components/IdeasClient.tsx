"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Plus, MessageSquare, Edit3, Save, X, Lightbulb, Trash2 } from "lucide-react";
import { updateIdea, deleteIdea, createIdea } from "@/lib/actions";

type IdeaStatus = "Inbox" | "Reviewed" | "Actioned";

interface Idea {
  id: string;
  name: string;
  markdown: string;
  status: string;
  sessions: { session: { id: string } }[];
}

interface IdeasClientProps {
  initialIdeas: any[];
}

function IdeasContent({ initialIdeas }: IdeasClientProps) {
  const searchParams = useSearchParams();
  const [ideas, setIdeas] = useState<any[]>(initialIdeas);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{name: string, markdown: string}>({name: "", markdown: ""});

  useEffect(() => {
    const id = searchParams.get("id");
    if (id) {
      setHighlightedId(id);
      // Auto-clear highlight after 5 seconds
      const timer = setTimeout(() => setHighlightedId(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  const statuses: IdeaStatus[] = ["Inbox", "Reviewed", "Actioned"];

  const handleEditClick = (idea: any) => {
    setEditingId(idea.id);
    setEditForm({ name: idea.name, markdown: idea.markdown });
  };

  const handleSave = async (id: string) => {
    try {
      await updateIdea(id, { name: editForm.name, markdown: editForm.markdown });
      setIdeas(ideas.map(idea => 
        idea.id === id 
          ? { ...idea, name: editForm.name, markdown: editForm.markdown } 
          : idea
      ));
      setEditingId(null);
    } catch (error) {
      console.error("Failed to update idea:", error);
      alert("Failed to save changes.");
    }
  };

  const handleCancel = () => {
    setEditingId(null);
  };

  const moveIdea = async (id: string, newStatus: IdeaStatus) => {
    try {
      await updateIdea(id, { status: newStatus });
      setIdeas(ideas.map(idea => 
        idea.id === id ? { ...idea, status: newStatus } : idea
      ));
    } catch (error) {
      console.error("Failed to move idea:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this idea?")) return;
    try {
      await deleteIdea(id);
      setIdeas(ideas.filter(idea => idea.id !== id));
    } catch (error) {
      console.error("Failed to delete idea:", error);
    }
  };

  const handleCreateNew = async () => {
    try {
      const name = prompt("Enter a name for the new idea:");
      if (!name) return;
      const newIdea = await createIdea({
        name,
        base_idea: "Manually created",
        markdown: "New idea details...",
        status: "Inbox"
      });
      setIdeas([newIdea, ...ideas]);
    } catch (error) {
      console.error("Failed to create idea:", error);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800 p-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Lightbulb className="w-6 h-6 text-yellow-500" /> Ideas Browser
          </h1>
        </div>
        <button 
          onClick={handleCreateNew}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" /> New Idea
        </button>
      </header>

      {/* Kanban Board */}
      <main className="flex-1 p-4 md:p-6 overflow-x-auto snap-x snap-mandatory">
        <div className="flex gap-4 md:gap-6 h-full items-start">
          {statuses.map(status => (
            <div key={status} className="w-[85vw] md:w-96 flex-shrink-0 snap-center bg-zinc-900/50 rounded-2xl flex flex-col border border-zinc-800 h-full max-h-[85vh]">
              <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900 rounded-t-2xl">
                <h2 className="font-bold text-lg text-zinc-200">{status}</h2>
                <span className="bg-zinc-800 text-zinc-400 text-xs px-2 py-1 rounded-full">
                  {ideas.filter(i => i.status === status).length}
                </span>
              </div>
              
              <div className="p-4 flex-1 overflow-y-auto space-y-4">
                {ideas.filter(i => i.status === status).map(idea => (
                  <div 
                    key={idea.id} 
                    id={`idea-${idea.id}`}
                    className={`bg-zinc-800 rounded-xl p-4 border transition-all duration-500 shadow-sm hover:border-zinc-500 group relative ${
                      highlightedId === idea.id ? 'border-yellow-500 ring-2 ring-yellow-500/20 scale-[1.02]' : 'border-zinc-700'
                    }`}
                  >
                    {editingId === idea.id ? (
                      <div className="space-y-3">
                        <input 
                          type="text" 
                          value={editForm.name} 
                          onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-sm text-white"
                        />
                        <textarea 
                          value={editForm.markdown}
                          onChange={(e) => setEditForm({...editForm, markdown: e.target.value})}
                          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-sm text-zinc-300 h-32 resize-none"
                        />
                        <div className="flex gap-2 justify-end">
                          <button onClick={handleCancel} className="p-2 text-zinc-400 hover:text-white"><X className="w-4 h-4"/></button>
                          <button onClick={() => handleSave(idea.id)} className="p-2 text-green-400 hover:text-green-300"><Save className="w-4 h-4"/></button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-white">{idea.name}</h3>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEditClick(idea)} className="text-zinc-500 hover:text-zinc-300">
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(idea.id)} className="text-zinc-500 hover:text-red-400">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="prose prose-invert prose-sm text-zinc-400 mb-4 bg-zinc-900/50 p-3 rounded-lg border border-zinc-800 max-h-48 overflow-y-auto whitespace-pre-wrap">
                          {idea.markdown}
                        </div>

                        <div className="flex justify-between items-center mt-4 pt-4 border-t border-zinc-700/50">
                          {idea.sessions && idea.sessions.length > 0 ? (
                            <Link href={\`/admin/conversations?id=\${idea.sessions[0].session.id}\`} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 bg-blue-900/20 px-2 py-1 rounded-md">
                              <MessageSquare className="w-3 h-3" /> Origin Context
                            </Link>
                          ) : (
                            <span className="text-xs text-zinc-600 italic">No origin context</span>
                          )}

                          <select 
                            value={idea.status}
                            onChange={(e) => moveIdea(idea.id, e.target.value as IdeaStatus)}
                            className="bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs rounded-lg p-1"
                          >
                            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                {ideas.filter(i => i.status === status).length === 0 && (
                  <div className="text-center text-zinc-600 text-sm py-8 border-2 border-dashed border-zinc-800 rounded-xl">
                    No ideas in {status}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export function IdeasClient(props: IdeasClientProps) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-500 italic">Loading ideas...</div>}>
      <IdeasContent {...props} />
    </Suspense>
  );
}
