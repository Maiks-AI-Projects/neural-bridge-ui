import { getCalendarData } from "@/lib/actions";
import { ApprovalCalendar } from "@/components/ApprovalCalendar";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from "date-fns";

export const dynamic = "force-dynamic";

export default async function ApprovalPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  const pivotDate = date ? new Date(date) : new Date();
  
  // Calculate the week range (starting Monday)
  const weekStart = startOfWeek(pivotDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(pivotDate, { weekStartsOn: 1 });
  
  const { rawEvents, proposals } = await getCalendarData(
    format(weekStart, "yyyy-MM-dd"),
    format(weekEnd, "yyyy-MM-dd")
  );

  return (
    <main className="h-screen overflow-hidden flex flex-col">
      <ApprovalCalendar 
        key={format(weekStart, "yyyy-MM-dd")}
        initialProposals={proposals} 
        initialRawEvents={rawEvents} 
        weekStart={weekStart} 
      />
    </main>
  );
}
