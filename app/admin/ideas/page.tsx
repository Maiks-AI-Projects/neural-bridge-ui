import { getIdeas } from "@/lib/actions";
import { IdeasClient } from "@/components/IdeasClient";

export const dynamic = "force-dynamic";

export default async function IdeasKanbanPage() {
  const ideas = await getIdeas();

  return <IdeasClient initialIdeas={ideas} />;
}
