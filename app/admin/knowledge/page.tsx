import { getKnowledgeEntries } from "@/lib/actions";
import { KnowledgeList } from "@/components/KnowledgeList";
import Link from "next/link";
import { Book } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function KnowledgeAdminPage() {
  const entries = await getKnowledgeEntries();

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <header className="mb-8 md:mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <Book className="w-10 h-10 text-emerald-500" />
            <h1 className="text-6xl font-black uppercase tracking-tighter italic leading-none">
              Knowledgebase
            </h1>
          </div>
          <p className="text-zinc-500 font-bold uppercase tracking-[0.3em] text-sm ml-14">
            Yasmin Cognitive Core Admin
          </p>
        </div>
        <div className="flex gap-8 ml-14 md:ml-0">
          <Link 
            href="/admin/people" 
            className="text-zinc-400 hover:text-white font-black text-sm uppercase tracking-widest transition-colors border-b-2 border-transparent hover:border-white pb-1"
          >
            Users
          </Link>
          <Link 
            href="/admin/recurring" 
            className="text-zinc-400 hover:text-white font-black text-sm uppercase tracking-widest transition-colors border-b-2 border-transparent hover:border-white pb-1"
          >
            Recurring
          </Link>
          <Link 
            href="/" 
            className="text-zinc-400 hover:text-white font-black text-sm uppercase tracking-widest transition-colors border-b-2 border-transparent hover:border-white pb-1"
          >
            Dashboard
          </Link>
        </div>
      </header>

      <main>
        <KnowledgeList initialEntries={entries} />
      </main>
    </div>
  );
}
