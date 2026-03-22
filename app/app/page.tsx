import { getTasks, getVoiceSessions } from "@/lib/actions";
import MobileNav from "@/components/MobileNav";
import { Plus, List, CheckCircle2, Clock, User, Mic } from "lucide-react";
import { cookies } from "next/headers";
import Link from "next/link";

export default async function MobileDashboard() {
  const tasks = await getTasks();
  const voiceSessions = await getVoiceSessions();
  
  // Filter for "Today's Focus" (e.g., tasks in 'Soon' or 'In Progress' columns)
  const focusTasks = tasks
    .filter(t => t.column === "Soon" || t.column === "In Progress")
    .slice(0, 3);
    
  const cookieStore = await cookies();
  const userName = cookieStore.get("user_name")?.value || "User";

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-[#ededed] pb-24 px-6 pt-10">
      <header className="mb-10 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black tracking-tighter italic text-blue-500 underline decoration-blue-500/30 underline-offset-8">BRIDGE</h1>
          <p className="text-gray-400 font-medium mt-1">Welcome back, {userName}</p>
        </div>
        <div className="w-12 h-12 bg-gray-800 rounded-2xl flex items-center justify-center border border-gray-700 shadow-xl">
          <User size={24} className="text-gray-400" />
        </div>
      </header>

      <div className="grid grid-cols-2 gap-4 mb-10">
        <Link href="/app/yasmin" className="bg-blue-600 aspect-square rounded-[2rem] flex flex-col items-center justify-center space-y-3 active:scale-95 transition-all shadow-lg shadow-blue-900/20">
          <div className="bg-white/20 p-3 rounded-2xl">
            <Mic size={32} strokeWidth={3} />
          </div>
          <span className="font-bold text-lg">Talk to Yasmin</span>
        </Link>
        <Link href="/app/ideas" className="bg-purple-600 aspect-square rounded-[2rem] flex flex-col items-center justify-center space-y-3 active:scale-95 transition-all shadow-lg shadow-purple-900/20">
          <div className="bg-white/20 p-3 rounded-2xl">
            <List size={32} strokeWidth={3} />
          </div>
          <span className="font-bold text-lg">Review Ideas</span>
        </Link>
      </div>

      <section className="space-y-6 mb-10">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <Clock size={24} className="text-yellow-500" />
            Today's Focus
          </h2>
          <span className="text-blue-500 font-bold text-sm bg-blue-500/10 px-3 py-1 rounded-full uppercase tracking-widest">{focusTasks.length} Tasks</span>
        </div>
        
        <div className="space-y-4">
          {focusTasks.length > 0 ? (
            focusTasks.map((task) => (
              <div 
                key={task.id}
                className="bg-[#151515] p-5 rounded-[1.5rem] border border-gray-800/50 flex items-center justify-between active:bg-[#202020] transition-colors group shadow-sm"
              >
                <div className="flex flex-col">
                  <span className="text-lg font-bold group-active:text-blue-400 transition-colors">{task.title}</span>
                  <span className="text-sm text-gray-500 font-medium">
                    {task.energy_tag ? `${task.energy_tag} • ` : ""}{task.column}
                  </span>
                </div>
                <div className="w-10 h-10 border-2 border-gray-700 rounded-full flex items-center justify-center group-active:border-blue-500 group-active:bg-blue-500/10 transition-all">
                  <CheckCircle2 className="text-gray-700 group-active:text-blue-500" size={24} />
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 italic text-center py-6 bg-zinc-900/50 rounded-2xl border border-dashed border-zinc-800">No active tasks for today. Take a break!</p>
          )}
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <Mic size={24} className="text-green-500" />
            Recent Brainstorms
          </h2>
        </div>
        
        <div className="space-y-4">
          {voiceSessions.slice(0, 2).map((session) => (
            <div 
              key={session.id}
              className="bg-[#151515] p-5 rounded-[1.5rem] border border-gray-800/50 flex flex-col active:bg-[#202020] transition-colors group shadow-sm"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-lg font-bold text-green-400">
                  {new Date(session.start_time).toLocaleDateString()}
                </span>
                <span className="text-xs bg-green-500/10 text-green-500 px-2 py-1 rounded-full font-bold">
                  {session.ideas.length} IDEAS
                </span>
              </div>
              <p className="text-gray-400 text-sm line-clamp-2 italic">
                {session.transcription || "Voice session recording..."}
              </p>
            </div>
          ))}
        </div>
      </section>

      <MobileNav />
    </main>
  );
}
