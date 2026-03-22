"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateTaskColumn } from "@/lib/actions";
import { type Task, type Person, type UserContext } from "@prisma/client";
import { ArrowLeft, ArrowRight, CheckCircle2, Layout, Calendar, Clock, Edit2, Zap, Baby, Trash2 } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { updateTask, updateUserContext, deleteTask } from "@/lib/actions";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type TaskWithAssigned = Task & { assigned_to: Person | null; parent_task: Task | null };

export function KanbanBoard({ initialTasks, people, userContext }: { initialTasks: TaskWithAssigned[], people: Person[], userContext: UserContext }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [context, setContext] = useState(userContext);
  const [editingTask, setEditingTask] = useState<TaskWithAssigned | null>(null);
  const [deletingTask, setDeletingTask] = useState<TaskWithAssigned | null>(null);
  const router = useRouter();

  // Update local tasks and context state when initialTasks or userContext changes
  useEffect(() => {
    setTasks(initialTasks);
    setContext(userContext);
  }, [initialTasks, userContext]);

  const handleToggleSon = async () => {
    const newVal = !context.is_son_present;
    setContext({ ...context, is_son_present: newVal });
    await updateUserContext("primary_user", { is_son_present: newVal });
  };

  const handleEnergyChange = async (newVal: number) => {
    setContext({ ...context, current_energy: newVal });
    await updateUserContext("primary_user", { current_energy: newVal });
  };

  // Check for present helpers
  const presentHelpers = people.filter(p => {
    try {
      const acl = p.acl ? JSON.parse(p.acl) : {};
      return p.role === "Helper" && acl.is_present;
    } catch (e) {
      return false;
    }
  });

  const handleMoveTask = async (taskId: number, newColumn: string) => {
    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, column: newColumn } : t))
    );
    await updateTaskColumn(taskId, newColumn);
  };

  const getEnergyColor = (tag: string | null) => {
    switch (tag?.toLowerCase()) {
      case "red":
        return "bg-red-500 border-red-700 text-white";
      case "yellow":
        return "bg-yellow-400 border-yellow-600 text-black";
      case "green":
        return "bg-green-500 border-green-700 text-white";
      default:
        return "bg-gray-200 border-gray-400 text-gray-800";
    }
  };

  const baseColumns = ["Today", "Tomorrow", "Soon", "Done"];
  const allColumns = [...baseColumns];
  
  // Inject helper columns at the second position if they are present
  if (presentHelpers.length > 0) {
    presentHelpers.forEach((helper) => {
      allColumns.splice(1, 0, `${helper.name}'s Today`);
    });
  }

  // 🔄 REAL-TIME SYNC: Refresh the data every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 10000);

    return () => clearInterval(interval);
  }, [router]);

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 font-sans">
      {/* 🧬 CONTEXT BAR */}
      <div className="bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800 p-4 flex flex-wrap items-center justify-between gap-4 text-white">
        <div className="flex items-center gap-8">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Current Energy</span>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
                <button
                  key={level}
                  onClick={() => handleEnergyChange(level)}
                  className={cn(
                    "w-8 h-8 rounded-md transition-all font-black text-xs border-2",
                    context.current_energy >= level 
                      ? "bg-yellow-500 border-yellow-400 text-black scale-110 shadow-[0_0_15px_rgba(234,179,8,0.3)]" 
                      : "bg-zinc-800 border-zinc-700 text-zinc-600 hover:border-zinc-500"
                  )}
                >
                  {level}
                </button>
              ))}
              <Zap className={cn("ml-2 w-5 h-5", context.current_energy > 7 ? "text-yellow-400 animate-pulse" : "text-zinc-700")} />
            </div>
          </div>

          <div className="h-10 w-px bg-zinc-800 hidden md:block" />

          <button 
            onClick={handleToggleSon}
            className={cn(
              "flex items-center gap-3 px-6 py-3 rounded-2xl border-4 transition-all active:scale-95",
              context.is_son_present 
                ? "bg-blue-600/20 border-blue-500 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.2)]" 
                : "bg-zinc-800 border-zinc-700 text-zinc-500 grayscale opacity-50 hover:grayscale-0 hover:opacity-100"
            )}
          >
            <Baby className={cn("w-6 h-6", context.is_son_present && "animate-bounce")} />
            <span className="font-black uppercase tracking-widest text-sm">
              Son {context.is_son_present ? "Present" : "Away"}
            </span>
          </button>
        </div>

        <div className="text-right hidden sm:block">
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600 block">Last Sync</span>
          <span suppressHydrationWarning className="text-xs font-bold text-zinc-400 tabular-nums">
            {new Date(context.last_updated).toLocaleTimeString()}
          </span>
        </div>
      </div>

      <div className={cn(
        "grid gap-4 p-4 md:p-8 flex-1 text-white",
        allColumns.length > 4 ? "grid-cols-1 lg:grid-cols-5" : "grid-cols-1 md:grid-cols-4"
      )}>
        {allColumns.map((colName) => (
          <div
            key={colName}
            className="flex flex-col gap-4 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 shadow-xl"
          >
            <div className="flex items-center gap-2 mb-2">
              <Layout className="w-5 h-5 text-zinc-500" />
              <h2 className="text-xl font-bold uppercase tracking-widest text-zinc-300">
                {colName}
              </h2>
            </div>

            <div className="flex flex-col gap-4 overflow-y-auto max-h-[calc(100vh-160px)] scrollbar-hide">
              {tasks
                .filter((t) => {
                  if (baseColumns.includes(colName)) {
                    return t.column === colName;
                  } else {
                    const helperName = colName.split("'s")[0];
                    return t.assigned_to?.name === helperName && t.column === "Today";
                  }
                })
                .map((task) => (
                  <div
                    key={task.id}
                    className="bg-zinc-800 p-5 rounded-lg border border-zinc-700 shadow-md hover:border-zinc-500 transition-all group relative cursor-pointer"
                    onClick={() => setEditingTask(task)}
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h3 className="text-xl font-bold leading-tight line-clamp-2">
                        {task.title}
                      </h3>
                      <div className="flex flex-col items-end gap-2">
                        {task.parent_task && task.parent_task.column !== "Done" && (
                          <span className="bg-red-900/30 border-2 border-red-500 text-red-500 text-[10px] px-2 py-1 rounded-full font-black uppercase flex items-center gap-1">
                            ⚠️ Blocked
                          </span>
                        )}
                        {task.energy_tag && (
                          <span
                            className={cn(
                              "text-xs px-2 py-1 rounded-full font-black border-2 uppercase",
                              getEnergyColor(task.energy_tag)
                            )}
                          >
                            {task.energy_tag}
                          </span>
                        )}
                        {!task.is_flexible && (
                          <span title="Fixed Deadline">
                            <Clock className="w-4 h-4 text-orange-500" />
                          </span>
                        )}

                      </div>
                    </div>

                    {task.description && (
                      <p className="text-zinc-400 mb-4 text-lg leading-relaxed line-clamp-3">
                        {task.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-zinc-500 mb-4">
                      {task.deadline && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span suppressHydrationWarning className="text-sm font-bold">
                            {new Date(task.deadline).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {task.estimated_duration && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span className="text-sm font-bold">
                            {task.estimated_duration}m
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-zinc-700/50">
                      <div className="flex items-center gap-2 text-zinc-500">
                        {task.assigned_to ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-medium">@</span>
                            <span className="text-sm font-bold uppercase truncate max-w-[80px]">
                              {task.assigned_to.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs italic">Unassigned</span>
                        )}
                      </div>

                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        {baseColumns.includes(colName) && colName !== "Today" && (
                          <button
                            onClick={() => handleMoveTask(task.id, baseColumns[baseColumns.indexOf(colName) - 1])}
                            className="p-2 hover:bg-zinc-700 rounded-md transition-colors text-zinc-400 hover:text-white"
                            title="Move Left"
                          >
                            <ArrowLeft className="w-5 h-5" />
                          </button>
                        )}
                        {baseColumns.includes(colName) && colName !== "Done" && (
                          <button
                            onClick={() => handleMoveTask(task.id, baseColumns[baseColumns.indexOf(colName) + 1])}
                            className="p-2 hover:bg-zinc-700 rounded-md transition-colors text-zinc-400 hover:text-white"
                            title="Move Right"
                          >
                            <ArrowRight className="w-5 h-5" />
                          </button>
                        )}
                        {colName !== "Done" && (
                          <button
                            onClick={() => handleMoveTask(task.id, "Done")}
                            className="p-2 hover:bg-green-600 rounded-md transition-colors text-green-500 hover:text-white"
                            title="Mark Done"
                          >
                            <CheckCircle2 className="w-6 h-6" />
                          </button>
                        )}
                        <button
                          onClick={() => setDeletingTask(task)}
                          className="p-2 hover:bg-red-600 rounded-md transition-colors text-red-500/70 hover:text-white"
                          title="Delete Task"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>

      {editingTask && (
        <EditTaskModal 
          task={editingTask} 
          people={people} 
          onClose={() => setEditingTask(null)} 
          allTasks={tasks}
        />
      )}

      {deletingTask && (
        <DeleteTaskModal 
          task={deletingTask} 
          onClose={() => setDeletingTask(null)} 
        />
      )}
    </div>
  );
}

function DeleteTaskModal({ task, onClose }: { task: TaskWithAssigned, onClose: () => void }) {
  const [reason, setReason] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    await deleteTask(task.id, reason);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-zinc-900 border-4 border-red-900/30 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <form onSubmit={handleSubmit} className="p-8">
          <div className="flex items-center gap-4 mb-6 text-red-500">
            <div className="bg-red-500/10 p-3 rounded-2xl">
              <Trash2 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tighter text-white leading-none">Remove Task</h2>
              <span className="text-[10px] font-black uppercase tracking-widest text-red-500/70">Logging for reference</span>
            </div>
          </div>

          <p className="text-zinc-400 font-bold mb-8 leading-relaxed">
            Why are you removing <span className="text-white italic">"{task.title}"</span>?
          </p>

          <div className="space-y-4">
            <textarea
              autoFocus
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. No longer necessary, moved to next month, or not possible..."
              className="w-full bg-black border-2 border-zinc-800 rounded-2xl p-4 text-white font-bold focus:border-red-500 outline-none h-32 resize-none placeholder:text-zinc-700"
              required
            />
          </div>

          <div className="mt-8 flex flex-col gap-3">
            <button
              type="submit"
              disabled={!reason.trim()}
              className="w-full bg-red-600 text-white font-black uppercase py-5 rounded-2xl hover:bg-red-500 transition-all shadow-[0_4px_0_0_rgba(153,27,27,1)] active:shadow-none active:translate-y-1 disabled:opacity-50 disabled:grayscale"
            >
              Confirm Removal
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-4 text-zinc-500 font-black uppercase tracking-widest text-xs hover:text-white transition-colors"
            >
              Wait, Keep it
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditTaskModal({ task, people, onClose, allTasks }: { task: TaskWithAssigned, people: Person[], onClose: () => void, allTasks: TaskWithAssigned[] }) {
  const [formData, setFormData] = useState({
    title: task.title,
    description: task.description || "",
    energy_tag: task.energy_tag || "green",
    deadline: task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : "",
    is_flexible: task.is_flexible,
    assigned_to_id: task.assigned_to_id || 0,
    estimated_duration: task.estimated_duration || 0,
    depends_on_id: task.depends_on_id || 0
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateTask(task.id, {
      ...formData,
      deadline: formData.deadline ? new Date(formData.deadline) : null,
      assigned_to_id: formData.assigned_to_id || null,
      estimated_duration: formData.estimated_duration || null,
      depends_on_id: formData.depends_on_id || null
    } as any);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <form onSubmit={handleSubmit} className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-black uppercase tracking-tighter text-white">Edit Task</h2>
            <button type="button" onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
              ✕
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-xs font-black uppercase text-zinc-500 mb-2">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white font-bold focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-zinc-500 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none h-24"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black uppercase text-zinc-500 mb-2">Energy</label>
                <select
                  value={formData.energy_tag}
                  onChange={(e) => setFormData({ ...formData, energy_tag: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white font-bold outline-none"
                >
                  <option value="green">Green (Low)</option>
                  <option value="yellow">Yellow (Medium)</option>
                  <option value="red">Red (High)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-black uppercase text-zinc-500 mb-2">Assigned To</label>
                <select
                  value={formData.assigned_to_id}
                  onChange={(e) => setFormData({ ...formData, assigned_to_id: parseInt(e.target.value) })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white font-bold outline-none"
                >
                  <option value={0}>Unassigned</option>
                  {people.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-black uppercase text-zinc-500 mb-2">Depends On</label>
                <select
                  value={formData.depends_on_id}
                  onChange={(e) => setFormData({ ...formData, depends_on_id: parseInt(e.target.value) })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white font-bold outline-none"
                >
                  <option value={0}>None</option>
                  {allTasks.filter(t => t.id !== task.id).map(t => (
                    <option key={t.id} value={t.id}>{t.title} ({t.column})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black uppercase text-zinc-500 mb-2">Deadline</label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white font-bold outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase text-zinc-500 mb-2">Duration (mins)</label>
                <input
                  type="number"
                  value={formData.estimated_duration}
                  onChange={(e) => setFormData({ ...formData, estimated_duration: parseInt(e.target.value) })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white font-bold outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={formData.is_flexible}
                  onChange={(e) => setFormData({ ...formData, is_flexible: e.target.checked })}
                  className="w-5 h-5 rounded bg-zinc-800 border-zinc-700 text-blue-600 focus:ring-offset-zinc-900"
                />
                <span className="text-sm font-bold text-zinc-300 group-hover:text-white transition-colors uppercase">Flexible Scheduling</span>
              </label>
            </div>
          </div>

          <div className="mt-10 flex gap-4">
            <button
              type="submit"
              className="flex-1 bg-white text-black font-black uppercase py-4 rounded-xl hover:bg-zinc-200 transition-colors"
            >
              Save Changes
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 border border-zinc-700 text-zinc-400 font-bold uppercase rounded-xl hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
