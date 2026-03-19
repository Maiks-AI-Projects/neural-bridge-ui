"use server";

import { prisma } from "./prisma";
import { revalidatePath } from "next/cache";
import { reconciliation_proposals_status } from "@prisma/client";

// --- KANBAN ACTIONS ---

export async function getTasks() {
  return await prisma.task.findMany({
    where: {
      deletedAt: null,
    },
    include: {
      assigned_to: true,
      parent_task: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function deleteTask(taskId: number, reason: string) {
  await prisma.task.update({
    where: { id: taskId },
    data: {
      deletedAt: new Date(),
      deletionReason: reason,
    },
  });
  revalidatePath("/");
}

export async function getPeople() {
  return await prisma.person.findMany({
    include: {
      schedules: true,
    },
  });
}

export async function getHAEntities() {
  try {
    const response = await fetch("http://192.168.187.12:8080/ha/presence-entities", {
      next: { revalidate: 60 } // Cache for 60 seconds
    });
    const data = await response.json();
    return data.entities || [];
  } catch (error) {
    console.error("Failed to fetch HA entities:", error);
    return [];
  }
}

export async function updateTaskColumn(taskId: number, newColumn: string) {
  await prisma.task.update({
    where: { id: taskId },
    data: { column: newColumn },
  });
  revalidatePath("/");
}

export async function updateTask(taskId: number, data: {
  title?: string;
  description?: string;
  energy_tag?: string;
  deadline?: Date | null;
  is_flexible?: boolean;
  estimated_duration?: number | null;
  depends_on_id?: number | null;
}) {
  await prisma.task.update({
    where: { id: taskId },
    data,
  });
  revalidatePath("/");
}

// --- USER CONTEXT ACTIONS ---

export async function getUserContext(key: string = "primary_user") {
  let context = await prisma.userContext.findUnique({
    where: { key },
  });
  
  if (!context) {
    context = await prisma.userContext.create({
      data: { key, is_son_present: false, current_energy: 5 },
    });
  }
  
  return context;
}

export async function updateUserContext(key: string, data: {
  is_son_present?: boolean;
  current_energy?: number;
}) {
  await prisma.userContext.update({
    where: { key },
    data,
  });
  revalidatePath("/");
}

// --- SCHEDULE ACTIONS ---

export async function addSchedule(data: {
  person_id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
}) {
  await prisma.schedule.create({
    data,
  });
  revalidatePath("/admin/people");
  revalidatePath("/");
}

export async function updateSchedule(id: number, data: {
  day_of_week?: number;
  start_time?: string;
  end_time?: string;
}) {
  await prisma.schedule.update({
    where: { id },
    data,
  });
  revalidatePath("/admin/people");
  revalidatePath("/");
}

export async function deleteSchedule(id: number) {
  await prisma.schedule.delete({
    where: { id },
  });
  revalidatePath("/admin/people");
  revalidatePath("/");
}

export async function createTask(data: {
  title: string;
  description?: string;
  column: string;
  assigned_to_id?: number;
  energy_tag?: string;
  deadline?: Date | null;
  is_flexible?: boolean;
  estimated_duration?: number | null;
  depends_on_id?: number | null;
}) {
  await prisma.task.create({
    data,
  });
  revalidatePath("/");
}

// --- APPROVAL CALENDAR ACTIONS ---

export async function getCalendarData(startDate: string, endDate: string) {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  const [rawEvents, proposals] = await Promise.all([
    prisma.rawCalendarEvent.findMany({
      where: {
        start_time: { gte: start, lte: end },
      },
    }),
    prisma.reconciliationProposal.findMany({
      where: {
        proposed_start: { gte: start, lte: end }, 
      },
    }),
  ]);

  return { rawEvents, proposals };
}

export async function updateProposalStatus(proposalId: number, status: reconciliation_proposals_status, reason?: string) {
  const data: any = { status };
  if (reason !== undefined) data.reason = reason;
  
  await prisma.reconciliationProposal.update({
    where: { id: proposalId },
    data,
  });
  revalidatePath("/approval");
}

export async function updateProposalTimes(proposalId: number, start: Date, end: Date) {
  await prisma.reconciliationProposal.update({
    where: { id: proposalId },
    data: { proposed_start: start, proposed_end: end },
  });
  revalidatePath("/approval");
}

// --- RECURRING TASK ACTIONS ---

export async function getRecurringTasks() {
  return await prisma.recurringTask.findMany({
    include: {
      parent_task: true,
    },
    orderBy: {
      id: "desc",
    },
  });
}

export async function addRecurringTask(data: {
  title: string;
  description?: string | null;
  frequency: string;
  starting_date: Date;
  assignee_id?: number | null;
  energy_cost: string;
  estimated_duration: number;
  next_run_at: Date;
  depends_on_id?: number | null;
}) {
  await prisma.recurringTask.create({
    data: {
      ...data,
      is_active: true,
    },
  });
  revalidatePath("/admin/recurring");
}

export async function updateRecurringTask(id: number, data: {
  title?: string;
  description?: string | null;
  frequency?: string;
  starting_date?: Date;
  assignee_id?: number | null;
  energy_cost?: string;
  estimated_duration?: number;
  next_run_at?: Date;
  is_active?: boolean;
  depends_on_id?: number | null;
}) {
  await prisma.recurringTask.update({
    where: { id },
    data,
  });
  revalidatePath("/admin/recurring");
}

export async function deleteRecurringTask(id: number) {
  await prisma.recurringTask.delete({
    where: { id },
  });
  revalidatePath("/admin/recurring");
}

export async function triggerRecurringTask(id: number) {
  try {
    const template = await prisma.recurringTask.findUnique({
      where: { id },
    });

    if (!template) return { success: false, error: "Template not found" };

    if (new Date() < template.starting_date) {
      return { success: false, error: "Starting date not reached yet" };
    }

    let dependsOnTaskId: number | undefined = undefined;

    if (template.depends_on_id) {
      const parentTemplate = await prisma.recurringTask.findUnique({
        where: { id: template.depends_on_id },
      });

      if (parentTemplate) {
        const lastParentTask = await prisma.task.findFirst({
          where: {
            title: parentTemplate.title,
            deletedAt: null,
          },
          orderBy: { createdAt: "desc" },
        });
        if (lastParentTask) {
          dependsOnTaskId = lastParentTask.id;
        }
      }
    }

    await prisma.task.create({
      data: {
        title: template.title,
        description: template.description,
        column: "Soon",
        assigned_to_id: template.assignee_id,
        energy_tag: template.energy_cost,
        estimated_duration: template.estimated_duration,
        depends_on_id: dependsOnTaskId,
      },
    });

    await prisma.recurringTask.update({
      where: { id },
      data: { last_run_at: new Date() },
    });

    revalidatePath("/");
    revalidatePath("/admin/recurring");
    return { success: true };
  } catch (error) {
    console.error("Trigger error:", error);
    return { success: false, error: "Failed to trigger task" };
  }
}

// --- YASMIN ACTIONS ---

export async function getVoiceSessions() {
  return await prisma.voice_Session.findMany({
    include: {
      ideas: {
        include: {
          idea: true,
        }
      }
    },
    orderBy: {
      start_time: "desc",
    },
  });
}

export async function getIdeas() {
  return await prisma.idea.findMany({
    include: {
      sessions: {
        include: {
          session: true,
        }
      }
    },
    orderBy: {
      created_at: "desc",
    },
  });
}

export async function updateIdea(id: string, data: {
  name?: string;
  markdown?: string;
  status?: string;
}) {
  await prisma.idea.update({
    where: { id },
    data,
  });
  revalidatePath("/admin/ideas");
  revalidatePath("/admin/conversations");
}

export async function deleteIdea(id: string) {
  await prisma.idea.delete({
    where: { id },
  });
  revalidatePath("/admin/ideas");
  revalidatePath("/admin/conversations");
}

export async function createIdea(data: {
  name: string;
  base_idea: string;
  markdown: string;
  status: string;
}) {
  const idea = await prisma.idea.create({
    data,
  });
  revalidatePath("/admin/ideas");
  return idea;
}

// --- PERSON ACTIONS ---

export async function addPerson(data: {
  name: string;
  role: string;
  ha_entity_id?: string;
  guest_token?: string;
  acl?: string;
  bedtime?: string;
}) {
  await prisma.person.create({
    data,
  });
  revalidatePath("/admin/people");
  revalidatePath("/");
}

export async function updatePerson(id: number, data: {
  name?: string;
  role?: string;
  ha_entity_id?: string | null;
  guest_token?: string | null;
  acl?: string | null;
  bedtime?: string | null;
}) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { schedules, ...rest } = data as any;
  await prisma.person.update({
    where: { id },
    data: rest,
  });
  revalidatePath("/admin/people");
  revalidatePath("/");
}

export async function deletePerson(id: number) {
  await prisma.person.delete({
    where: { id },
  });
  revalidatePath("/admin/people");
  revalidatePath("/");
}

export async function commitChanges() {
  try {
    const response = await fetch("http://192.168.187.12:8080/safety/commit", {
      method: "POST",
    });
    
    if (response.ok) {
      await prisma.reconciliationProposal.updateMany({
        where: { status: "APPROVED" },
        data: { status: "COMMITTED" },
      });
      revalidatePath("/approval");
      return { success: true };
    }
    return { success: false, error: "Backend rejected the commit" };
  } catch (error) {
    console.error("Commit error:", error);
    return { success: false, error: "Failed to reach backend commit endpoint" };
  }
}
