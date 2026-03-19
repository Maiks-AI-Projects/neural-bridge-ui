import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const adapter = new PrismaMariaDb({
  host: "192.168.188.64",
  user: "nb_app",
  password: "NB_App_Pass_2026!",
  database: "neural_bridge",
  port: 6033,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database via HA ProxySQL...");

  // Upsert Michael (Admin)
  const michael = await prisma.person.upsert({
    where: { guest_token: "michael-admin-token" },
    update: {},
    create: {
      name: "Michael",
      role: "Admin",
      ha_entity_id: "person.michael",
      guest_token: "michael-admin-token",
      acl: JSON.stringify({
        can_edit_tasks: true,
        can_see_private_calendar: true,
      }),
    },
  });

  // Upsert Cleaner
  const cleaner = await prisma.person.upsert({
    where: { guest_token: "cleaner-token-123" },
    update: {},
    create: {
      name: "Cleaner",
      role: "Helper",
      ha_entity_id: "person.cleaner",
      guest_token: "cleaner-token-123",
      acl: JSON.stringify({
        can_edit_tasks: false,
        can_see_private_calendar: false,
      }),
      schedules: {
        create: [
          { day_of_week: 2, start_time: "09:00", end_time: "12:00" }, // Tuesday
        ],
      },
    },
  });

  // Sample Tasks
  const tasks = [
    {
      title: "Clean Kitchen",
      description: "Deep clean surfaces and floor",
      column: "Today",
      assigned_to_id: cleaner.id,
      energy_tag: "Yellow",
    },
    {
      title: "Grocery Shopping",
      description: "Milk, Bread, Eggs",
      column: "Tomorrow",
      assigned_to_id: michael.id,
      energy_tag: "Green",
    },
    {
      title: "Fix Bicycle",
      description: "Check tires and brakes",
      column: "Soon",
      assigned_to_id: michael.id,
      energy_tag: "Red",
    },
  ];

  for (const task of tasks) {
    await prisma.task.create({
      data: task,
    });
  }

  console.log("Seeding complete via ProxySQL.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
