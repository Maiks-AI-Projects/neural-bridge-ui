"use client";

import React, { useState, useMemo } from "react";
import { format, startOfDay, addHours, isSameDay, differenceInMinutes, addDays, eachDayOfInterval, endOfDay, addWeeks, subWeeks } from "date-fns";
import { ReconciliationProposal, RawCalendarEvent, reconciliation_proposals_status } from "@prisma/client";
import { updateProposalStatus, commitChanges } from "@/lib/actions";
import { Check, X, AlertTriangle, ArrowRight, Save, Loader2, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useRouter } from "next/navigation";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const START_HOUR = 7;
const END_HOUR = 23;
const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

interface ApprovalCalendarProps {
  initialProposals: ReconciliationProposal[];
  initialRawEvents: RawCalendarEvent[];
  weekStart: Date;
}

export function ApprovalCalendar({ initialProposals, initialRawEvents, weekStart }: ApprovalCalendarProps) {
  const [proposals, setProposals] = useState(initialProposals);
  const [isCommitting, setIsCommitting] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<ReconciliationProposal | null>(null);
  const router = useRouter();

  // Sync state with props when week changes
  React.useEffect(() => {
    setProposals(initialProposals);
  }, [initialProposals]);

  const days = useMemo(() => {
    return eachDayOfInterval({
      start: weekStart,
      end: addDays(weekStart, 6),
    });
  }, [weekStart]);

  const handleStatusUpdate = async (id: number, status: reconciliation_proposals_status, reason?: string) => {
    setProposals(prev => prev.map(p => p.id === id ? { ...p, status } : p));
    await updateProposalStatus(id, status, reason);
    if (selectedProposal?.id === id) {
      setSelectedProposal(null);
    }
  };

  const handleApproveAll = async () => {
    const pendingIds = proposals
      .filter(p => p.status === "PENDING")
      .map(p => p.id);
    
    // Batch update state
    setProposals(prev => prev.map(p => pendingIds.includes(p.id) ? { ...p, status: "APPROVED" } : p));
    
    // In a real app we might want a batch server action
    for (const id of pendingIds) {
      await updateProposalStatus(id, "APPROVED");
    }
  };

  const handleCommit = async () => {
    setIsCommitting(true);
    const res = await commitChanges();
    if (res.success) {
      setProposals(prev => prev.map(p => p.status === "APPROVED" ? { ...p, status: "COMMITTED" } : p));
    } else {
      alert(res.error || "Commit failed");
    }
    setIsCommitting(false);
  };

  const navigateWeek = (direction: 'next' | 'prev') => {
    const newDate = direction === 'next' ? addWeeks(weekStart, 1) : subWeeks(weekStart, 1);
    router.push(`/approval?date=${format(newDate, "yyyy-MM-dd")}`);
  };

  const getEventStyle = (start: Date, end: Date, dayStart: Date) => {
    const startMinutes = differenceInMinutes(start, addHours(dayStart, START_HOUR));
    const durationMinutes = differenceInMinutes(end, start);
    
    // Compressed height for weekly view: 1 hour = 60px
    const top = (startMinutes / 60) * 60;
    const height = (durationMinutes / 60) * 60;

    return {
      top: `${top}px`,
      height: `${height}px`,
    };
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-white font-sans overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center gap-6">
          <h1 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-blue-500" />
            Approval 
            <span className="text-zinc-500 font-medium">Weekly</span>
          </h1>
          
          <div className="flex items-center bg-zinc-800 rounded-lg p-1">
            <button onClick={() => navigateWeek('prev')} className="p-2 hover:bg-zinc-700 rounded-md transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="px-4 font-bold text-sm min-w-[200px] text-center">
              {format(weekStart, "MMM d")} - {format(addDays(weekStart, 6), "MMM d, yyyy")}
            </span>
            <button onClick={() => navigateWeek('next')} className="p-2 hover:bg-zinc-700 rounded-md transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleApproveAll}
            className="px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest bg-zinc-800 hover:bg-zinc-700 transition-all border border-zinc-700"
          >
            Approve All Pending
          </button>
          <button
            onClick={handleCommit}
            disabled={isCommitting || !proposals.some(p => p.status === "APPROVED")}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-600 px-6 py-2 rounded-lg font-black uppercase tracking-widest transition-all shadow-[0_4px_0_0_rgba(37,99,235,1)] active:shadow-none active:translate-y-1 text-sm"
          >
            {isCommitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Commit changes
          </button>
        </div>
      </div>

      {/* Weekly Grid */}
      <div className="flex-1 overflow-y-auto relative">
        <div className="flex min-w-[1200px] h-full">
          {/* Time Gutter */}
          <div className="w-16 sticky left-0 bg-zinc-950 z-20 border-r border-zinc-900">
            {HOURS.map(hour => (
              <div key={hour} className="h-[60px] flex items-start justify-end pr-3">
                <span suppressHydrationWarning className="text-[10px] font-bold text-zinc-600 mt-[-7px]">
                  {format(addHours(startOfDay(new Date()), hour), "HH:mm")}
                </span>
              </div>
            ))}
          </div>

          {/* Days Columns */}
          <div className="flex-1 grid grid-cols-7 divide-x divide-zinc-900">
            {days.map((day) => {
              const dayStart = startOfDay(day);
              const dayRawEvents = initialRawEvents.filter(e => isSameDay(new Date(e.start_time), day));
              const dayProposals = proposals.filter(p => p.proposed_start && isSameDay(new Date(p.proposed_start), day));

              return (
                <div key={day.toISOString()} className="relative min-h-[1020px] group">
                  {/* Day Header */}
                  <div className="sticky top-0 bg-zinc-900/50 backdrop-blur-sm p-2 text-center border-b border-zinc-800 z-10">
                    <span className="block text-[10px] font-black uppercase text-zinc-500 tracking-widest">
                      {format(day, "EEE")}
                    </span>
                    <span suppressHydrationWarning className={cn(
                      "text-lg font-black",
                      isSameDay(day, new Date()) ? "text-blue-500" : "text-zinc-200"
                    )}>
                      {format(day, "d")}
                    </span>
                  </div>

                  {/* Hour Lines */}
                  {HOURS.map(hour => (
                    <div key={hour} className="h-[60px] border-b border-zinc-900/30" />
                  ))}

                  {/* Ghost Layer */}
                  {dayRawEvents.map(event => (
                    <div
                      key={`${event.id}-${event.start_time.toISOString()}`}
                      className="absolute left-1 right-1 bg-zinc-800/20 border border-zinc-700/30 rounded p-1 text-[9px] text-zinc-600 overflow-hidden z-0 pointer-events-none"
                      style={getEventStyle(new Date(event.start_time), new Date(event.end_time || addHours(event.start_time, 1)), dayStart)}
                    >
                      <div className="truncate font-bold opacity-40 uppercase mb-0.5">{event.calendar_name}</div>
                      <div className="truncate italic">{event.summary}</div>
                    </div>
                  ))}

                  {/* Active Layer */}
                  {dayProposals.map(prop => {
                    const isUpdate = prop.proposed_action === "UPDATE";
                    const isDelete = prop.proposed_action === "DELETE";
                    const isKeep = prop.proposed_action === "KEEP";
                    
                    return (
                      <div
                        key={prop.id}
                        onClick={() => setSelectedProposal(prop)}
                        className={cn(
                          "absolute left-2 right-2 rounded-lg p-2 shadow-xl cursor-pointer transition-all hover:scale-[1.02] z-10 border",
                          isKeep && "bg-green-900/40 border-green-500/50 text-green-100",
                          isUpdate && "bg-orange-900/40 border-orange-500/50 text-orange-100",
                          isDelete && "bg-red-900/40 border-red-500/50 text-red-100 line-through opacity-60",
                          prop.status === "APPROVED" && "ring-2 ring-blue-500 ring-offset-2 ring-offset-zinc-950",
                          prop.status === "REJECTED" && "opacity-20 grayscale"
                        )}
                        style={getEventStyle(new Date(prop.proposed_start!), new Date(prop.proposed_end!), dayStart)}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <h3 className="text-[10px] font-black leading-tight uppercase truncate">
                            {prop.original_summary || "Event"}
                          </h3>
                          {prop.status === "APPROVED" && <Check className="w-3 h-3 text-blue-400 shrink-0" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Proposal Detail Modal */}
      {selectedProposal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="text-2xl font-black uppercase tracking-tighter">
                {selectedProposal.original_summary}
              </h2>
              <button onClick={() => setSelectedProposal(null)} className="p-2 hover:bg-zinc-800 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-700">
                <p className="text-lg font-medium italic text-zinc-300">
                  "{selectedProposal.reason || selectedProposal.change_description}"
                </p>
              </div>

              <div className="flex items-center gap-4 text-center">
                <div className="flex-1 p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                  <span className="block text-[10px] text-zinc-500 uppercase font-black">Original</span>
                  <span suppressHydrationWarning className="text-sm font-mono tracking-tighter">
                    {format(new Date(selectedProposal.original_start || 0), "HH:mm")} - {format(new Date(selectedProposal.original_end || 0), "HH:mm")}
                  </span>
                </div>
                <ArrowRight className="w-5 h-5 text-zinc-700" />
                <div className="flex-1 p-3 bg-blue-900/20 rounded-lg border border-blue-500/30">
                  <span className="block text-[10px] text-blue-400 uppercase font-black">Proposed</span>
                  <span suppressHydrationWarning className="text-sm font-mono text-blue-100 tracking-tighter">
                    {format(new Date(selectedProposal.proposed_start!), "HH:mm")} - {format(new Date(selectedProposal.proposed_end!), "HH:mm")}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleStatusUpdate(selectedProposal.id, "REJECTED")}
                  className="bg-zinc-800 hover:bg-zinc-700 py-4 rounded-xl text-lg font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                >
                  <X className="w-5 h-5 text-red-500" />
                  Reject
                </button>
                <button
                  onClick={() => handleStatusUpdate(selectedProposal.id, "APPROVED")}
                  className="bg-green-600 hover:bg-green-500 py-4 rounded-xl text-lg font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
