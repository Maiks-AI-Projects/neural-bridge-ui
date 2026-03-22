"use client";

import React, { useState, useEffect } from "react";
import { type Person, type Schedule } from "@prisma/client";
import { addPerson, updatePerson, deletePerson, addSchedule, updateSchedule, deleteSchedule, getHAEntities } from "@/lib/actions";
import { Plus, Trash2, Edit2, Shield, User, MapPin, Key, Check, X, Calendar, Clock } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type PersonWithSchedules = Person & {
  schedules: Schedule[];
};

interface PeopleListProps {
  initialPeople: PersonWithSchedules[];
  haEntities: { id: string; name: string }[];
}

export function PeopleList({ initialPeople, haEntities }: PeopleListProps) {
  const [people, setPeople] = useState(initialPeople);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<Person>>({});

  // Schedule adding state
  const [addingScheduleFor, setAddingScheduleFor] = useState<number | null>(null);
  const [newSchedule, setNewSchedule] = useState({
    day_of_week: 1,
    start_time: "09:00",
    end_time: "17:00",
  });

  // Form states for adding
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("Helper");
  const [newHA, setNewHA] = useState("");
  const [newACL, setNewACL] = useState('{"is_present": false}');
  const [newBedtime, setNewBedtime] = useState("");

  const handleAdd = async () => {
    if (!newName) return;
    const guestToken = Math.random().toString(36).substring(2, 15);
    await addPerson({
      name: newName,
      role: newRole,
      ha_entity_id: newHA,
      guest_token: guestToken,
      acl: newACL,
      bedtime: newBedtime || undefined,
    });
    window.location.reload();
  };

  const handleEdit = (person: Person) => {
    setEditingId(person.id);
    setEditForm(person);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editForm.name) return;
    const { id, ...data } = editForm as Person;
    await updatePerson(editingId, data);
    setEditingId(null);
    window.location.reload();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure?")) return;
    await deletePerson(id);
    setPeople(prev => prev.filter(p => p.id !== id));
  };

  const handleTogglePresence = async (person: Person) => {
    const acl = person.acl ? JSON.parse(person.acl) : {};
    acl.is_present = !acl.is_present;
    const updatedAcl = JSON.stringify(acl);
    await updatePerson(person.id, { acl: updatedAcl });
    setPeople(prev => prev.map(p => p.id === person.id ? { ...p, acl: updatedAcl } : p));
  };

  const handleAddSchedule = async (personId: number) => {
    await addSchedule({
      person_id: personId,
      ...newSchedule,
    });
    setAddingScheduleFor(null);
    window.location.reload();
  };

  const handleDeleteSchedule = async (scheduleId: number) => {
    if (!confirm("Delete this schedule?")) return;
    await deleteSchedule(scheduleId);
    window.location.reload();
  };

  const copyGuestUrl = (token: string | null) => {
    if (!token) return;
    const url = `${window.location.origin}/guest/${token}`;
    navigator.clipboard.writeText(url);
    alert("Guest URL copied!");
  };

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="space-y-6 pb-20">
      {/* Add New Section */}
      {!isAdding ? (
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-6 rounded-[2rem] font-black uppercase tracking-widest transition-all shadow-[0_8px_0_0_rgba(30,64,175,1)] active:shadow-none active:translate-y-2 w-full justify-center mb-8"
        >
          <Plus className="w-8 h-8" />
          Add New Person
        </button>
      ) : (
        <div className="bg-zinc-900 border-4 border-blue-600 p-4 md:p-8 rounded-[3rem] space-y-4 mb-8 shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-zinc-500 ml-2">Name</label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-black border-2 border-zinc-800 rounded-2xl p-4 text-xl font-bold focus:border-blue-500 outline-none text-white"
                placeholder="e.g. Justin"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-zinc-500 ml-2">Role</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full bg-black border-2 border-zinc-800 rounded-2xl p-4 text-xl font-bold focus:border-blue-500 outline-none appearance-none text-white"
              >
                <option value="Admin">Admin</option>
                <option value="Son">Son</option>
                <option value="Helper">Helper</option>
                <option value="Cleaner">Cleaner</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-zinc-500 ml-2">Home Assistant Entity</label>
              <select
                value={newHA}
                onChange={(e) => setNewHA(e.target.value)}
                className="w-full bg-black border-2 border-zinc-800 rounded-2xl p-4 text-xl font-bold focus:border-blue-500 outline-none appearance-none text-white"
              >
                <option value="">No Linking</option>
                {haEntities.map(entity => (
                  <option key={entity.id} value={entity.id}>
                    {entity.name} ({entity.id})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-zinc-500 ml-2">ACL (JSON)</label>
              <input
                value={newACL}
                onChange={(e) => setNewACL(e.target.value)}
                className="w-full bg-black border-2 border-zinc-800 rounded-2xl p-4 text-sm font-mono focus:border-blue-500 outline-none text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-zinc-500 ml-2">Bedtime</label>
              <input
                type="time"
                value={newBedtime}
                onChange={(e) => setNewBedtime(e.target.value)}
                className="w-full bg-black border-2 border-zinc-800 rounded-2xl p-4 text-xl font-bold focus:border-blue-500 outline-none text-white"
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
              className="flex-1 bg-blue-600 hover:bg-blue-500 py-5 rounded-2xl font-black uppercase tracking-widest transition-all text-white shadow-[0_8px_0_0_rgba(30,64,175,1)] active:shadow-none active:translate-y-2"
            >
              Save Person
            </button>
          </div>
        </div>
      )}

      {/* People List */}
      <div className="grid grid-cols-1 gap-6">
        {people.map((person) => {
          const acl = person.acl ? JSON.parse(person.acl) : {};
          const isPresent = acl.is_present;
          const isEditing = editingId === person.id;

          if (isEditing) {
            return (
              <div key={person.id} className="bg-zinc-900 border-4 border-yellow-500 p-4 md:p-8 rounded-[3rem] space-y-4 shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-zinc-500 ml-2">Name</label>
                    <input
                      value={editForm.name || ""}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full bg-black border-2 border-zinc-800 rounded-2xl p-4 text-xl font-bold focus:border-yellow-500 outline-none text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-zinc-500 ml-2">Role</label>
                    <select
                      value={editForm.role || ""}
                      onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                      className="w-full bg-black border-2 border-zinc-800 rounded-2xl p-4 text-xl font-bold focus:border-yellow-500 outline-none appearance-none text-white"
                    >
                      <option value="Admin">Admin</option>
                      <option value="Son">Son</option>
                      <option value="Helper">Helper</option>
                      <option value="Cleaner">Cleaner</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-zinc-500 ml-2">Home Assistant Entity</label>
                    <select
                      value={editForm.ha_entity_id || ""}
                      onChange={(e) => setEditForm({ ...editForm, ha_entity_id: e.target.value })}
                      className="w-full bg-black border-2 border-zinc-800 rounded-2xl p-4 text-xl font-bold focus:border-yellow-500 outline-none appearance-none text-white"
                    >
                      <option value="">No Linking</option>
                      {haEntities.map(entity => (
                        <option key={entity.id} value={entity.id}>
                          {entity.name} ({entity.id})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-zinc-500 ml-2">Guest Token</label>
                    <input
                      value={editForm.guest_token || ""}
                      onChange={(e) => setEditForm({ ...editForm, guest_token: e.target.value })}
                      className="w-full bg-black border-2 border-zinc-800 rounded-2xl p-4 text-lg font-mono focus:border-yellow-500 outline-none text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-zinc-500 ml-2">Bedtime</label>
                    <input
                      type="time"
                      value={editForm.bedtime || ""}
                      onChange={(e) => setEditForm({ ...editForm, bedtime: e.target.value })}
                      className="w-full bg-black border-2 border-zinc-800 rounded-2xl p-4 text-xl font-bold focus:border-yellow-500 outline-none text-white"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-black uppercase text-zinc-500 ml-2">ACL (JSON)</label>
                    <textarea
                      value={editForm.acl || ""}
                      onChange={(e) => setEditForm({ ...editForm, acl: e.target.value })}
                      className="w-full bg-black border-2 border-zinc-800 rounded-2xl p-4 text-sm font-mono focus:border-yellow-500 outline-none text-white min-h-[100px]"
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
                    Update Person
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div
              key={person.id}
              className="group bg-zinc-900 border-[6px] border-zinc-800 p-4 md:p-8 rounded-[3.5rem] shadow-xl flex flex-col gap-6 transition-all hover:border-zinc-700 hover:translate-y-[-4px]"
            >
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8">
                <div className="flex items-center gap-8">
                  <div className={cn(
                    "w-24 h-24 rounded-full flex items-center justify-center border-4 shadow-inner transition-all",
                    person.role === "Admin" ? "bg-red-900/30 border-red-500 text-red-500" : "bg-zinc-800 border-zinc-700 text-zinc-400"
                  )}>
                    <User className="w-12 h-12" />
                  </div>
                  <div>
                    <div className="flex items-center gap-4">
                      <h2 className="text-5xl font-black uppercase tracking-tighter italic">{person.name}</h2>
                      <span className="bg-zinc-800 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-[0.2em] border border-zinc-700 text-zinc-400">
                        {person.role}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-6 mt-4 text-zinc-500 font-bold uppercase text-xs tracking-widest">
                      <span className="flex items-center gap-2 italic">
                        <MapPin className="w-4 h-4 text-blue-500" />
                        {person.ha_entity_id || "no-ha-link"}
                      </span>
                      <span className="flex items-center gap-2">
                        <Key className="w-4 h-4 text-yellow-500" />
                        {person.guest_token ? `${person.guest_token}` : "no-token"}
                      </span>
                      {person.bedtime && (
                        <span className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-purple-500" />
                          {person.bedtime}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <button
                    onClick={() => handleTogglePresence(person)}
                    className={cn(
                      "flex-1 md:flex-none px-10 py-5 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-sm border-b-8 transition-all active:translate-y-1 active:border-b-0 min-w-[180px]",
                      isPresent 
                        ? "bg-green-600 border-green-800 text-white" 
                        : "bg-zinc-800 border-zinc-950 text-zinc-600 opacity-40"
                    )}
                  >
                    {isPresent ? "Present" : "Away"}
                  </button>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => copyGuestUrl(person.guest_token)}
                      className="p-5 bg-zinc-800 hover:bg-blue-900/30 rounded-2xl border border-zinc-700 hover:border-blue-500 transition-all text-blue-400 group/btn"
                      title="Copy Guest URL"
                    >
                      <Shield className="w-8 h-8 group-hover/btn:scale-110 transition-transform" />
                    </button>
                    <button
                      onClick={() => handleEdit(person)}
                      className="p-5 bg-zinc-800 hover:bg-yellow-900/30 rounded-2xl border border-zinc-700 hover:border-yellow-500 transition-all text-yellow-500 group/btn"
                      title="Edit Person"
                    >
                      <Edit2 className="w-8 h-8 group-hover/btn:scale-110 transition-transform" />
                    </button>
                    <button
                      onClick={() => handleDelete(person.id)}
                      className="p-5 bg-zinc-800 hover:bg-red-900/50 rounded-2xl border border-zinc-700 hover:border-red-500 transition-all text-zinc-500 hover:text-red-500 group/btn"
                      title="Delete Person"
                    >
                      <Trash2 className="w-8 h-8 group-hover/btn:scale-110 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Schedules Section */}
              <div className="border-t-4 border-zinc-800 pt-8 mt-2">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3">
                    <Calendar className="w-6 h-6 text-zinc-600" />
                    Weekly Schedule
                  </h3>
                  <button
                    onClick={() => setAddingScheduleFor(addingScheduleFor === person.id ? null : person.id)}
                    className="text-xs font-black uppercase tracking-widest bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-lg transition-colors"
                  >
                    {addingScheduleFor === person.id ? "Cancel" : "+ Add Slot"}
                  </button>
                </div>

                {addingScheduleFor === person.id && (
                  <div className="bg-black border-2 border-zinc-800 p-6 rounded-3xl mb-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end animate-in slide-in-from-top-4 duration-300">
                    <div>
                      <label className="text-[10px] font-black uppercase text-zinc-500 ml-1 mb-1 block">Day</label>
                      <select
                        value={newSchedule.day_of_week}
                        onChange={(e) => setNewSchedule({ ...newSchedule, day_of_week: parseInt(e.target.value) })}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-sm font-bold text-white"
                      >
                        {days.map((day, idx) => (
                          <option key={day} value={idx + 1}>{day}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-zinc-500 ml-1 mb-1 block">Start</label>
                      <input
                        type="time"
                        value={newSchedule.start_time}
                        onChange={(e) => setNewSchedule({ ...newSchedule, start_time: e.target.value })}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-sm font-bold text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-zinc-500 ml-1 mb-1 block">End</label>
                      <input
                        type="time"
                        value={newSchedule.end_time}
                        onChange={(e) => setNewSchedule({ ...newSchedule, end_time: e.target.value })}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-sm font-bold text-white"
                      />
                    </div>
                    <button
                      onClick={() => handleAddSchedule(person.id)}
                      className="bg-blue-600 hover:bg-blue-500 text-white font-black uppercase p-3 rounded-xl transition-all shadow-[0_4px_0_0_rgba(30,64,175,1)] active:shadow-none active:translate-y-1"
                    >
                      Save Slot
                    </button>
                  </div>
                )}

                <div className="flex flex-wrap gap-4">
                  {person.schedules.length === 0 ? (
                    <p className="text-zinc-600 font-bold uppercase text-xs italic">No scheduled shifts</p>
                  ) : (
                    person.schedules
                      .sort((a, b) => a.day_of_week - b.day_of_week || a.start_time.localeCompare(b.start_time))
                      .map((slot) => (
                        <div key={slot.id} className="bg-zinc-800 border-2 border-zinc-700 px-6 py-4 rounded-2xl flex items-center gap-6 group/slot hover:border-zinc-500 transition-all">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{days[slot.day_of_week - 1]}</span>
                            <span className="text-lg font-black tracking-tighter flex items-center gap-2">
                              {slot.start_time} - {slot.end_time}
                            </span>
                          </div>
                          <button
                            onClick={() => handleDeleteSchedule(slot.id)}
                            className="opacity-0 group-hover/slot:opacity-100 p-2 hover:bg-red-900/30 rounded-lg text-red-500 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
