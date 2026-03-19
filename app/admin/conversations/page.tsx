import { getVoiceSessions } from "@/lib/actions";
import { ConversationsClient } from "@/components/ConversationsClient";

export const dynamic = "force-dynamic";

export default async function ConversationsHistoryPage() {
  const sessions = await getVoiceSessions();

  return <ConversationsClient initialSessions={sessions} />;
}
