"use client";

import React, { useState } from "react";
import { type RecurringTask, type Person } from "@prisma/client";
import { 
  addRecurringTask, 
  updateRecurringTask, 
  deleteRecurringTask, 
  triggerRecurringTask 
} from "@/lib/actions";
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Clock, 
  Play, 
  Zap, 
  Calendar, 
  User,
  Power,
  PowerOff
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface RecurringTaskListProps {
  initialRecurringTasks: RecurringTask[];
  people: Person[];
}

export function RecurringTaskList({ initialRecurringTasks, people }: RecurringTaskListProps) {
  const [tasks, setTasks] = useState(initialRecurringTasks);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<RecurringTask>>({});

  // Adding form states
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newFreq, setNewFreq] = useState("Daily");
  const [newStartingDate, setNewStartingDate] = useState(new Date().toISOString().split('T')[0]);
  const [newAssignee, setNewAssignee] = useState(0);
  const [newEnergy, setNewEnergy] = useState("Medium");
  const [newDuration, setNewDuration] = useState(30);
  const [newDependsOn, setNewDependsOn] = useState(0);

  const FREQUENCY_OPTIONS = [
    'Daily',
    'Weekly',
    'Bi-weekly',
    'Every 3 weeks',
    'Every 4 weeks',
    'Monthly'
  ];

  const handleAdd = async () => {
    if (!newTitle) return;
    await addRecurringTask({
      title: newTitle,
      description: newDesc || undefined,
      frequency: newFreq,
      starting_date: new Date(newStartingDate),
      assignee_id: newAssignee || undefined,
      energy_cost: newEnergy,
      estimated_duration: newDuration,
      next_run_at: new Date(), // Default to now for the first run
      depends_on_id: newDependsOn || undefined,
    });
    window.location.reload();
  };

  const handleEdit = (task: RecurringTask) => {
    setEditingId(task.id);
    setEditForm(task);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editForm.title) return;
    const { id, ...data } = editForm as RecurringTask;
    await updateRecurringTask(editingId, data);
    setEditingId(null);
    window.location.reload();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this template?")) return;
    await deleteRecurringTask(id);
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleTrigger = async (id: number) => {
    const result = await triggerRecurringTask(id);
    if (result.success) {
      alert("Task triggered successfully!");
    } else {
      alert(`Trigger failed: ${result.error || "Unknown error"}`);
    }
  };

  const handleToggleActive = async (task: RecurringTask) => {
    await updateRecurringTask(task.id, { is_active: !task.is_active });
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, is_active: !task.is_active } : t));
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Add New Template Section */}
      {!isAdding ? (
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-6 py-6 rounded-[2rem] font-black uppercase tracking-widest transition-all shadow-[0_8px_0_0_rgba(126,34,206,1)] active:shadow-none active:translate-y-2 w-full justify-center mb-8"
        >
          <Plus className="w-8 h-8" />
          Create New Recurring Task
        </button>
      ) : (
        <div className="bg-zinc-900 border-4 border-purple-600 p-4 md:p-8 rounded-[3rem] space-y-4 mb-8 shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-zinc-500 ml-2">Title</label>
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full bg-black border-2 border-zinc-800 rounded-2xl p-4 text-xl font-bold focus:border-purple-500 outline-none text-white"
                placeholder="e.g. Clean the Kitchen"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-zinc-500 ml-2">Frequency</label>
              <select
                value={newFreq}
                onChange={(e) => setNewFreq(e.target.value)}
                className="w-full bg-black border-2 border-zinc-800 rounded-2xl p-4 text-xl font-bold focus:border-purple-500 outline-none text-white appearance-none"
              >
                {FREQUENCY_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-zinc-500 ml-2">Starting Date</label>
              <input
                type="date"
                value={newStartingDate}
                onChange={(e) => setNewStartingDate(e.target.value)}
                className="w-full bg-black border-2 border-zinc-800 rounded-2xl p-4 text-xl font-bold focus:border-purple-500 outline-none text-white appearance-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-zinc-500 ml-2">Depends On</label>
              <select
                value={newDependsOn}
                onChange={(e) => setNewDependsOn(parseInt(e.target.value))}
                className="w-full bg-black border-2 border-zinc-800 rounded-2xl p-4 text-xl font-bold focus:border-purple-500 outline-none appearance-none text-white"
              >
                <option value={0}>None</option>
                {tasks.map(t => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-zinc-500 ml-2">Assignee</label>
              <select
                value={newAssignee}
                onChange={(e) => setNewAssignee(parseInt(e.target.value))}
                className="w-full bg-black border-2 border-zinc-800 rounded-2xl p-4 text-xl font-bold focus:border-purple-500 outline-none appearance-none text-white"
              >
                <option value={0}>Unassigned</option>
                {people.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-zinc-500 ml-2">Energy Cost</label>
              <select
                value={newEnergy}
                onChange={(e) => setNewEnergy(e.target.value)}
                className="w-full bg-black border-2 border-zinc-800 rounded-2xl p-4 text-xl font-bold focus:border-purple-500 outline-none appearance-none text-white"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-zinc-500 ml-2">Duration (mins)</label>
              <input
                type="number"
                value={newDuration}
                onChange={(e) => setNewDuration(parseInt(e.target.value))}
                className="w-full bg-black border-2 border-zinc-800 rounded-2xl p-4 text-xl font-bold focus:border-purple-500 outline-none text-white"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-black uppercase text-zinc-500 ml-2">Description</label>
              <textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full bg-black border-2 border-zinc-800 rounded-2xl p-4 text-lg font-bold focus:border-purple-500 outline-none text-white h-24"
              />
            </div>
          </div>
          <div className="flex gap-4 pt-2">
            <button
              onClick={() => setIsAdding(false)}
              className="flex-1 bg-zinc-800 hover:bg-zinc-700 py-5 rounded-2xl font-black uppercase tracking-widest transition-all text-zinc-400"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              className="flex-1 bg-purple-600 hover:bg-purple-500 py-5 rounded-2xl font-black uppercase tracking-widest transition-all text-white shadow-[0_8px_0_0_rgba(126,34,206,1)] active:shadow-none active:translate-y-2"
            >
              Save Template
            </button>
          </div>
        </div>
      )}

      {/* Templates List */}
      <div className="grid grid-cols-1 gap-6">
        {tasks.map((task) => {
          const isEditing = editingId === task.id;
          const assignee = people.find(p => p.id === task.assignee_id);

          if (isEditing) {
            return (
              <div key={task.id} className="bg-zinc-900 border-4 border-yellow-500 p-4 md:p-8 rounded-[3rem] space-y-4 shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-zinc-500 ml-2">Title</label>
                    <input
                      value={editForm.title || ""}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      className="w-full bg-black border-2 border-zinc-800 rounded-2xl p-4 text-xl font-bold focus:border-yellow-500 outline-none text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-zinc-500 ml-2">Frequency</label>
                    <select
                      value={editForm.frequency || ""}
                      onChange={(e) => setEditForm({ ...editForm, frequency: e.target.value })}
                      className="w-full bg-black border-2 border-zinc-800 rounded-2xl p-4 text-xl font-bold focus:border-yellow-500 outline-none text-white appearance-none"
                    >
                      {FREQUENCY_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-zinc-500 ml-2">Starting Date</label>
                    <input
                      type="date"
                      value={editForm.starting_date ? new Date(editForm.starting_date).toISOString().split('T')[0] : ""}
                      onChange={(e) => setEditForm({ ...editForm, starting_date: new Date(e.target.value) })}
                      className="w-full bg-black border-2 border-zinc-800 rounded-2xl p-4 text-xl font-bold focus:border-yellow-500 outline-none text-white appearance-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-zinc-500 ml-2">Depends On</label>
                    <select
                      value={editForm.depends_on_id || 0}
                      onChange={(e) => setEditForm({ ...editForm, depends_on_id: parseInt(e.target.value) })}
                      className="w-full bg-black border-2 border-zinc-800 rounded-2xl p-4 text-xl font-bold focus:border-yellow-500 outline-none appearance-none text-white"
                    >
                      <option value={0}>None</option>
                      {tasks.filter(t => t.id !== editingId).map(t => (
                        <option key={t.id} value={t.id}>{t.title}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-zinc-500 ml-2">Assignee</label>
                    <select
                      value={editForm.assignee_id || 0}
                      onChange={(e) => setEditForm({ ...editForm, assignee_id: parseInt(e.target.value) })}
                      className="w-full bg-black border-2 border-zinc-800 rounded-2xl p-4 text-xl font-bold focus:border-yellow-500 outline-none appearance-none text-white"
                    >
                      <option value={0}>Unassigned</option>
                      {people.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-zinc-500 ml-2">Energy Cost</label>
                    <select
                      value={editForm.energy_cost || "Medium"}
                      onChange={(e) => setEditForm({ ...editForm, energy_cost: e.target.value })}
                      className="w-full bg-black border-2 border-zinc-800 rounded-2xl p-4 text-xl font-bold focus:border-yellow-500 outline-none appearance-none text-white"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-zinc-500 ml-2">Duration (mins)</label>
                    <input
                      type="number"
                      value={editForm.estimated_duration || 0}
                      onChange={(e) => setEditForm({ ...editForm, estimated_duration: parseInt(e.target.value) })}
                      className="w-full bg-black border-2 border-zinc-800 rounded-2xl p-4 text-xl font-bold focus:border-yellow-500 outline-none text-white"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-black uppercase text-zinc-500 ml-2">Description</label>
                    <textarea
                      value={editForm.description || ""}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      className="w-full bg-black border-2 border-zinc-800 rounded-2xl p-4 text-lg font-bold focus:border-yellow-500 outline-none text-white h-24"
                    />
                  </div>
                </div>
                <div className="flex gap-4 pt-2">
                  <button
                    onClick={() => setEditingId(null)}
                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 py-5 rounded-2xl font-black uppercase tracking-widest transition-all text-zinc-400"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="flex-1 bg-yellow-600 hover:bg-yellow-500 py-5 rounded-2xl font-black uppercase tracking-widest transition-all text-black shadow-[0_8px_0_0_rgba(180,83,9,1)] active:shadow-none active:translate-y-2"
                  >
                    Update Template
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div
              key={task.id}
              className={cn(
                "group bg-zinc-900 border-[6px] p-4 md:p-8 rounded-[3.5rem] shadow-xl flex flex-col gap-6 transition-all hover:translate-y-[-4px]",
                task.is_active ? "border-zinc-800 hover:border-zinc-700" : "border-zinc-950 opacity-60 grayscale"
              )}
            >
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8">
                <div className="flex items-center gap-8">
                  <div className={cn(
                    "w-20 h-20 rounded-full flex items-center justify-center border-4 shadow-inner transition-all",
                    task.is_active ? "bg-purple-900/30 border-purple-500 text-purple-500" : "bg-zinc-800 border-zinc-700 text-zinc-600"
                  )}>
                    <Calendar className="w-10 h-10" />
                  </div>
                  <div>
                    <div className="flex items-center gap-4">
                      <h2 className="text-4xl font-black uppercase tracking-tighter italic">{task.title}</h2>
                      <span className="bg-zinc-800 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-[0.2em] border border-zinc-700 text-zinc-400">
                        {task.frequency}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-6 mt-4 text-zinc-500 font-bold uppercase text-xs tracking-widest">
                      <span className="flex items-center gap-2">
                        <User className="w-4 h-4 text-blue-500" />
                        {assignee ? assignee.name : "Unassigned"}
                      </span>
                      <span className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-yellow-500" />
                        {task.energy_cost}
                      </span>
                      <span className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-green-500" />
                        {task.estimated_duration}m
                      </span>
                      <span suppressHydrationWarning className="flex items-center gap-2 italic">
                        Start: {new Date(task.starting_date).toLocaleDateString()}
                      </span>
                      <span suppressHydrationWarning className="flex items-center gap-2 italic">
                        Next: {new Date(task.next_run_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <button
                    onClick={() => handleTrigger(task.id)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white px-8 py-5 rounded-[1.5rem] font-black uppercase tracking-widest transition-all shadow-[0_6px_0_0_rgba(22,101,52,1)] active:shadow-none active:translate-y-1"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    Run Now
                  </button>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleToggleActive(task)}
                      className={cn(
                        "p-5 rounded-2xl border transition-all group/btn",
                        task.is_active 
                          ? "bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-red-500 hover:border-red-500" 
                          : "bg-green-900/20 border-green-500/30 text-green-500 hover:bg-green-600 hover:text-white"
                      )}
                      title={task.is_active ? "Deactivate" : "Activate"}
                    >
                      {task.is_active ? <PowerOff className="w-8 h-8" /> : <Power className="w-8 h-8" />}
                    </button>
                    <button
                      onClick={() => handleEdit(task)}
                      className="p-5 bg-zinc-800 hover:bg-yellow-900/30 rounded-2xl border border-zinc-700 hover:border-yellow-500 transition-all text-yellow-500 group/btn"
                      title="Edit Template"
                    >
                      <Edit2 className="w-8 h-8 group-hover/btn:scale-110 transition-transform" />
                    </button>
                    <button
                      onClick={() => handleDelete(task.id)}
                      className="p-5 bg-zinc-800 hover:bg-red-900/50 rounded-2xl border border-zinc-700 hover:border-red-500 transition-all text-zinc-500 hover:text-red-500 group/btn"
                      title="Delete Template"
                    >
                      <Trash2 className="w-8 h-8 group-hover/btn:scale-110 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>

              {task.description && (
                <div className="border-t-2 border-zinc-800/50 pt-6">
                  <p className="text-zinc-400 font-bold text-lg leading-relaxed">{task.description}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
