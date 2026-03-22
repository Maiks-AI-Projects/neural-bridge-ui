import { getTasks, getPeople, getUserContext } from "@/lib/actions";
import { KanbanBoard } from "@/components/KanbanBoard";
import Link from "next/link";
import { CalendarCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [tasks, people, userContext] = await Promise.all([
    getTasks(), 
    getPeople(),
    getUserContext()
  ]);

  return (
    <main className="min-h-screen bg-black">
      <nav className="bg-zinc-900 border-b border-zinc-800 p-4 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <h1 className="text-white font-black uppercase tracking-widest text-xl">Neural Bridge</h1>
          <Link 
            href="/admin/people" 
            className="text-zinc-400 hover:text-white font-bold text-sm uppercase tracking-wider transition-colors"
          >
            People
          </Link>
          <Link 
            href="/admin/recurring" 
            className="text-zinc-400 hover:text-white font-bold text-sm uppercase tracking-wider transition-colors"
          >
            Recurring
          </Link>
        </div>
        <Link 
          href="/approval" 
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold text-sm transition-all"
        >
          <CalendarCheck className="w-4 h-4" />
          Approval UI
        </Link>
      </nav>
      <KanbanBoard 
        initialTasks={tasks} 
        people={people} 
        userContext={userContext} 
      />
    </main>
  );
}
