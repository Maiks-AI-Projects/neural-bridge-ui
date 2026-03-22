import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { updateTaskColumn } from "@/lib/actions";
import { revalidatePath } from "next/cache";

export default async function GuestPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const person = await prisma.person.findUnique({
    where: { guest_token: token },
    include: {
      tasks: {
        where: { column: "Today" },
      },
    },
  });

  if (!person) {
    return notFound();
  }

  async function markAsDone(taskId: number) {
    "use server";
    await updateTaskColumn(taskId, "Done");
    revalidatePath(`/guest/${token}`);
  }

  const getEnergyStyle = (tag: string) => {
    const t = tag.toLowerCase();
    if (t.includes('high')) return 'bg-red-600 text-white border-red-400';
    if (t.includes('med')) return 'bg-yellow-400 text-black border-yellow-200';
    if (t.includes('low')) return 'bg-green-500 text-black border-green-300';
    return 'bg-zinc-700 text-white border-zinc-500';
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 p-4 pb-20 font-sans selection:bg-green-500 selection:text-black">
      <header className="mb-12 pt-8 px-2 border-b-8 border-zinc-900 pb-8">
        <div className="flex items-center gap-3 mb-2">
            <div className="w-3 h-12 bg-green-500 rounded-full"></div>
            <h1 className="text-5xl font-black uppercase italic tracking-tighter leading-none">
              {person.name}
            </h1>
        </div>
        <p className="text-zinc-500 text-xl font-black uppercase tracking-[0.2em] ml-6">
          Daily Mission
        </p>
      </header>

      <main className="flex flex-col gap-10">
        {person.tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center bg-zinc-900/50 rounded-[3rem] border-4 border-dashed border-zinc-800">
            <CheckCircle2 className="w-32 h-32 text-green-500 mb-8 animate-pulse" />
            <p className="text-4xl font-black text-zinc-400 uppercase tracking-tighter">
              Area Clear
            </p>
          </div>
        ) : (
          person.tasks.map((task) => (
            <div
              key={task.id}
              className="group relative bg-zinc-900 border-[6px] border-zinc-800 p-4 md:p-8 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col gap-4 md:gap-8 transition-all active:translate-y-1 active:shadow-inner"
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  {task.energy_tag && (
                    <span className={`${getEnergyStyle(task.energy_tag)} px-6 py-2 rounded-2xl text-xl font-black uppercase border-b-4 shadow-lg`}>
                      {task.energy_tag}
                    </span>
                  )}
                </div>
                <h2 className="text-5xl font-black leading-[1.05] tracking-tight text-white mt-2">
                  {task.title}
                </h2>
              </div>
              
              {task.description && (
                <p className="text-2xl text-zinc-400 font-bold leading-relaxed border-l-4 border-zinc-800 pl-6">
                  {task.description}
                </p>
              )}

              <form action={markAsDone.bind(null, task.id)} className="mt-4">
                <button
                  type="submit"
                  className="w-full bg-green-500 hover:bg-green-400 active:bg-green-600 text-black py-10 rounded-[2.5rem] text-4xl font-black uppercase tracking-widest transition-all active:scale-[0.95] flex items-center justify-center gap-6 shadow-[0_16px_0_0_rgba(20,83,45,1)] active:shadow-none active:translate-y-4"
                >
                  <CheckCircle2 className="w-12 h-12 stroke-[4px]" />
                  Done
                </button>
              </form>
            </div>
          ))
        )}
      </main>

      <footer className="mt-20 mb-10 text-center">
        <div className="inline-block bg-zinc-900 px-6 py-3 rounded-full border-2 border-zinc-800">
            <p className="text-zinc-600 text-sm font-black uppercase tracking-[0.3em]">
              Neural Bridge Protocol v1.0
            </p>
        </div>
      </footer>
    </div>
  );
}
