"use client";

import React, { useState, useMemo } from "react";
import { type KnowledgeEntry } from "@prisma/client";
import { 
  addKnowledgeEntry, 
  updateKnowledgeEntry, 
  deleteKnowledgeEntry 
} from "@/lib/actions";
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Search, 
  CheckCircle, 
  Circle,
  X,
  BookOpen,
  Link as LinkIcon,
  Clock
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface KnowledgeListProps {
  initialEntries: KnowledgeEntry[];
}

export function KnowledgeList({ initialEntries }: KnowledgeListProps) {
  const [entries, setEntries] = useState(initialEntries);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<KnowledgeEntry>>({});

  // Form states for adding
  const [newTopic, setNewTopic] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newSource, setNewSource] = useState("");
  const [newVerified, setNewVerified] = useState(false);

  const filteredEntries = useMemo(() => {
    return entries.filter(entry => 
      entry.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.content.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [entries, searchTerm]);

  const handleAdd = async () => {
    if (!newTopic || !newContent) return;
    await addKnowledgeEntry({
      topic: newTopic,
      content: newContent,
      source: newSource || undefined,
      verified: newVerified,
    });
    window.location.reload();
  };

  const handleEdit = (entry: KnowledgeEntry) => {
    setEditingId(entry.id);
    setEditForm(entry);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editForm.topic || !editForm.content) return;
    const { id, ...data } = editForm as KnowledgeEntry;
    await updateKnowledgeEntry(editingId, data);
    setEditingId(null);
    window.location.reload();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    await deleteKnowledgeEntry(id);
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  const handleToggleVerified = async (entry: KnowledgeEntry) => {
    const updatedVerified = !entry.verified;
    await updateKnowledgeEntry(entry.id, { verified: updatedVerified });
    setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, verified: updatedVerified } : e));
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Search Bar */}
      <div className="relative group">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-8 h-8 text-zinc-600 group-focus-within:text-blue-500 transition-colors" />
        <input 
          type="text"
          placeholder="SEARCH KNOWLEDGE..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-zinc-900 border-[6px] border-zinc-800 rounded-[2.5rem] py-8 pl-18 pr-8 text-2xl font-black uppercase tracking-tighter italic placeholder:text-zinc-700 focus:border-blue-600 outline-none transition-all shadow-2xl"
        />
      </div>

      {/* Add New Section */}
      {!isAdding ? (
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-4 bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-8 rounded-[2.5rem] font-black uppercase tracking-[0.2em] transition-all shadow-[0_12px_0_0_rgba(5,150,105,1)] active:shadow-none active:translate-y-3 w-full justify-center text-2xl italic border-4 border-emerald-400/20"
        >
          <Plus className="w-10 h-10" />
          Add Knowledge Entry
        </button>
      ) : (
        <div className="bg-zinc-900 border-[6px] border-emerald-600 p-6 md:p-10 rounded-[3.5rem] space-y-6 shadow-2xl animate-in fade-in slide-in-from-top-10 duration-500">
          <div className="flex justify-between items-center mb-4">
             <h3 className="text-3xl font-black uppercase tracking-tighter italic text-emerald-500">New Entry</h3>
             <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-zinc-800 rounded-full text-zinc-500"><X className="w-8 h-8" /></button>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-black uppercase text-zinc-500 ml-4 tracking-widest">Topic / Heading</label>
              <input
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                className="w-full bg-black border-4 border-zinc-800 rounded-3xl p-6 text-2xl font-black uppercase tracking-tighter focus:border-emerald-500 outline-none text-white transition-all shadow-inner"
                placeholder="E.G. GUEST WIFI PASSWORD"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-black uppercase text-zinc-500 ml-4 tracking-widest">Content / Facts</label>
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                className="w-full bg-black border-4 border-zinc-800 rounded-3xl p-6 text-xl font-bold focus:border-emerald-500 outline-none text-white min-h-[200px] transition-all shadow-inner"
                placeholder="THE PASSWORD IS 'NEURALBRIDGE123'..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-black uppercase text-zinc-500 ml-4 tracking-widest">Source (URL or Name)</label>
                <input
                  value={newSource}
                  onChange={(e) => setNewSource(e.target.value)}
                  className="w-full bg-black border-4 border-zinc-800 rounded-3xl p-6 text-lg font-bold focus:border-emerald-500 outline-none text-white transition-all"
                  placeholder="https://example.com"
                />
              </div>
              
              <div className="flex items-center gap-6 bg-black border-4 border-zinc-800 rounded-3xl p-6 self-end cursor-pointer hover:border-emerald-900 transition-all" onClick={() => setNewVerified(!newVerified)}>
                <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all",
                    newVerified ? "bg-emerald-600 border-emerald-400 text-white" : "bg-zinc-800 border-zinc-700 text-zinc-500"
                )}>
                    {newVerified && <CheckCircle className="w-6 h-6" />}
                </div>
                <span className="text-lg font-black uppercase tracking-widest text-zinc-400">Verified Entry</span>
              </div>
            </div>
          </div>

          <div className="flex gap-6 pt-6">
            <button
              onClick={() => setIsAdding(false)}
              className="flex-1 bg-zinc-800 hover:bg-zinc-700 py-6 rounded-3xl font-black uppercase tracking-widest transition-all text-zinc-500 border-4 border-zinc-700"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              className="flex-2 bg-emerald-600 hover:bg-emerald-500 py-6 rounded-3xl font-black uppercase tracking-widest transition-all text-white shadow-[0_12px_0_0_rgba(5,150,105,1)] active:shadow-none active:translate-y-3"
            >
              Save Entry
            </button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="grid grid-cols-1 gap-8">
        {filteredEntries.map((entry) => {
          const isEditing = editingId === entry.id;

          if (isEditing) {
            return (
              <div key={entry.id} className="bg-zinc-900 border-[6px] border-yellow-500 p-6 md:p-10 rounded-[3.5rem] space-y-6 shadow-2xl animate-in zoom-in duration-300">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-black uppercase text-zinc-500 ml-4">Topic</label>
                    <input
                      value={editForm.topic || ""}
                      onChange={(e) => setEditForm({ ...editForm, topic: e.target.value })}
                      className="w-full bg-black border-4 border-zinc-800 rounded-3xl p-6 text-2xl font-black uppercase tracking-tighter focus:border-yellow-500 outline-none text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-black uppercase text-zinc-500 ml-4">Content</label>
                    <textarea
                      value={editForm.content || ""}
                      onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                      className="w-full bg-black border-4 border-zinc-800 rounded-3xl p-6 text-xl font-bold focus:border-yellow-500 outline-none text-white min-h-[200px]"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-black uppercase text-zinc-500 ml-4">Source</label>
                      <input
                        value={editForm.source || ""}
                        onChange={(e) => setEditForm({ ...editForm, source: e.target.value })}
                        className="w-full bg-black border-4 border-zinc-800 rounded-3xl p-6 text-lg font-bold focus:border-yellow-500 outline-none text-white"
                      />
                    </div>
                    <div className="flex items-center gap-6 bg-black border-4 border-zinc-800 rounded-3xl p-6 self-end cursor-pointer hover:border-yellow-900 transition-all" onClick={() => setEditForm({ ...editForm, verified: !editForm.verified })}>
                        <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all",
                            editForm.verified ? "bg-emerald-600 border-emerald-400 text-white" : "bg-zinc-800 border-zinc-700 text-zinc-500"
                        )}>
                            {editForm.verified && <CheckCircle className="w-6 h-6" />}
                        </div>
                        <span className="text-lg font-black uppercase tracking-widest text-zinc-400">Verified Entry</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-6 pt-6">
                  <button
                    onClick={() => setEditingId(null)}
                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 py-6 rounded-3xl font-black uppercase tracking-widest transition-all text-zinc-500 border-4 border-zinc-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="flex-2 bg-yellow-600 hover:bg-yellow-500 py-6 rounded-3xl font-black uppercase tracking-widest transition-all text-black shadow-[0_12px_0_0_rgba(202,138,4,1)] active:shadow-none active:translate-y-3"
                  >
                    Update Entry
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div
              key={entry.id}
              className="group bg-zinc-900 border-[6px] border-zinc-800 p-6 md:p-10 rounded-[4rem] shadow-xl flex flex-col gap-8 transition-all hover:border-zinc-700 hover:translate-y-[-8px]"
            >
              <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-10">
                <div className="space-y-6 flex-1">
                  <div className="flex flex-wrap items-center gap-6">
                    <h2 className="text-5xl font-black uppercase tracking-tighter italic leading-none">{entry.topic}</h2>
                    {entry.verified && (
                        <span className="bg-emerald-900/40 text-emerald-400 border-2 border-emerald-500/30 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
                           <CheckCircle className="w-4 h-4" />
                           Verified
                        </span>
                    )}
                  </div>
                  
                  <div className="bg-black border-4 border-zinc-800/50 p-8 rounded-[2.5rem] relative overflow-hidden group/content">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-zinc-900/50 rounded-bl-[2rem] flex items-center justify-center border-b-4 border-l-4 border-zinc-800 group-hover/content:bg-blue-900/20 group-hover/content:border-blue-500/30 transition-all">
                        <BookOpen className="w-10 h-10 text-zinc-700 group-hover/content:text-blue-500 group-hover/content:scale-110 transition-all" />
                    </div>
                    <p className="text-2xl font-bold text-zinc-200 leading-relaxed whitespace-pre-wrap">
                      {entry.content}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-10 mt-6">
                    {entry.source && (
                        <div className="flex items-center gap-4 text-zinc-500 hover:text-blue-400 transition-colors cursor-pointer group/link">
                           <LinkIcon className="w-6 h-6 group-hover/link:rotate-12 transition-transform" />
                           <span className="text-sm font-black uppercase tracking-[0.2em]">{entry.source}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-4 text-zinc-600">
                        <Clock className="w-6 h-6" />
                        <span className="text-sm font-black uppercase tracking-[0.2em]">
                           {new Date(entry.updated_at).toLocaleDateString()}
                        </span>
                    </div>
                  </div>
                </div>

                <div className="flex xl:flex-col gap-4 self-end xl:self-start">
                   <button
                    onClick={() => handleToggleVerified(entry)}
                    className={cn(
                        "p-8 rounded-[2rem] border-b-8 transition-all active:translate-y-2 active:border-b-0",
                        entry.verified 
                            ? "bg-emerald-600 border-emerald-800 text-white" 
                            : "bg-zinc-800 border-zinc-950 text-zinc-600"
                    )}
                    title={entry.verified ? "Mark Unverified" : "Mark Verified"}
                  >
                    {entry.verified ? <CheckCircle className="w-10 h-10" /> : <Circle className="w-10 h-10" />}
                  </button>
                  <button
                    onClick={() => handleEdit(entry)}
                    className="p-8 bg-zinc-800 hover:bg-yellow-900/30 rounded-[2rem] border-4 border-zinc-700 hover:border-yellow-500 transition-all text-yellow-500"
                    title="Edit Entry"
                  >
                    <Edit2 className="w-10 h-10" />
                  </button>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="p-8 bg-zinc-800 hover:bg-red-900/50 rounded-[2rem] border-4 border-zinc-700 hover:border-red-500 transition-all text-zinc-500 hover:text-red-500"
                    title="Delete Entry"
                  >
                    <Trash2 className="w-10 h-10" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredEntries.length === 0 && (
            <div className="text-center py-20 bg-zinc-900/50 border-8 border-dashed border-zinc-800 rounded-[4rem]">
                <Search className="w-24 h-24 text-zinc-800 mx-auto mb-6" />
                <h3 className="text-4xl font-black uppercase tracking-tighter italic text-zinc-700">No Knowledge Found</h3>
                <p className="text-zinc-600 font-bold uppercase tracking-widest mt-2">Try a different search term or add a new entry.</p>
            </div>
        )}
      </div>
    </div>
  );
}
