import { getRecurringTasks, getPeople } from "@/lib/actions";
import { RecurringTaskList } from "@/components/RecurringTaskList";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function RecurringAdminPage() {
  const [tasks, people] = await Promise.all([
    getRecurringTasks(),
    getPeople()
  ]);

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <header className="mb-4 md:mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter italic">
            Recurring Tasks
          </h1>
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-sm">
            Template Management & Automation
          </p>
        </div>
        <div className="flex gap-6 items-center">
          <Link 
            href="/admin/knowledge" 
            className="text-emerald-500 hover:text-emerald-400 font-bold text-sm uppercase tracking-wider transition-colors"
          >
            Knowledgebase
          </Link>
          <Link 
            href="/admin/people" 
            className="flex items-center gap-2 text-zinc-500 hover:text-white font-black uppercase tracking-widest text-xs transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to People
          </Link>
        </div>
      </header>

      <main>
        <RecurringTaskList 
          initialRecurringTasks={tasks} 
          people={people} 
        />
      </main>
    </div>
  );
}
