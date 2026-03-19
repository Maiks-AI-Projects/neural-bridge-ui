import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { person: personName, status } = data;

    if (!personName || !status) {
      return new Response("Missing person or status", { status: 400 });
    }

    const isPresent = status === "home";

    const person = await prisma.person.findFirst({
      where: { name: personName },
    });

    if (person) {
      // Parse current ACL if it exists
      let currentAcl: any = {};
      try {
        if (person.acl) {
          currentAcl = JSON.parse(person.acl);
        }
      } catch (e) {
        console.error("Error parsing ACL for person:", personName, e);
      }

      currentAcl.is_present = isPresent;

      await prisma.person.update({
        where: { id: person.id },
        data: {
          acl: JSON.stringify(currentAcl),
        },
      });
      revalidatePath("/");
      return new Response("OK", { status: 200 });
    }

    return new Response("Person not found", { status: 404 });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response("Error", { status: 500 });
  }
}
