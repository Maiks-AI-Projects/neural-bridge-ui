import { getPeople, getHAEntities } from "@/lib/actions";
import { PeopleList } from "@/components/PeopleList";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PeopleAdminPage() {
  const [people, haEntities] = await Promise.all([
    getPeople(),
    getHAEntities()
  ]);

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <header className="mb-4 md:mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter italic">
            User Management
          </h1>
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-sm">
            Neural Bridge Access Control
          </p>
        </div>
        <div className="flex gap-6">
          <Link 
            href="/admin/knowledge" 
            className="text-emerald-500 hover:text-emerald-400 font-bold text-sm uppercase tracking-wider transition-colors"
          >
            Knowledgebase
          </Link>
          <Link 
            href="/admin/recurring" 
            className="text-zinc-400 hover:text-white font-bold text-sm uppercase tracking-wider transition-colors"
          >
            Recurring Tasks
          </Link>
          <Link 
            href="/" 
            className="text-zinc-400 hover:text-white font-bold text-sm uppercase tracking-wider transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </header>

      <main>
        <PeopleList 
          initialPeople={people} 
          haEntities={haEntities} 
        />
      </main>
    </div>
  );
}
