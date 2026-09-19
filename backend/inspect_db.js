import { getDB } from "./src/config/db.js";

async function run() {
  const p = getDB();
  const staff = await p.staff.findMany({
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
      business: { select: { id: true, name: true, slug: true } },
    },
  });
  console.log("--- STAFF (" + staff.length + ") ---");
  staff.forEach((s) => {
    console.log(`Staff ID: ${s.id} | Name: ${s.displayName} | Email: ${s.user?.email} | Business: ${s.business?.name} (${s.businessId})`);
  });

  const queues = await p.queue.findMany({
    include: {
      business: { select: { id: true, name: true } },
      entries: {
        include: {
          customer: { select: { user: { select: { name: true, email: true } } } },
        },
      },
    },
  });
  console.log("\n--- QUEUES (" + queues.length + ") ---");
  queues.forEach((q) => {
    console.log(`Queue: ${q.name} | Business: ${q.business.name} (${q.businessId}) | Entries: ${q.entries.length}`);
    q.entries.forEach((e) => {
      console.log(`  - Token #${e.tokenNumber} | Status: ${e.status} | Customer: ${e.customer?.user?.name}`);
    });
  });

  const appointments = await p.appointment.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
    include: {
      staff: { select: { id: true, displayName: true } },
      customer: { select: { user: { select: { name: true, email: true } } } },
      business: { select: { id: true, name: true } },
      appointmentServices: { include: { service: { select: { name: true } } } },
    },
  });
  console.log("\n--- RECENT APPOINTMENTS (" + appointments.length + ") ---");
  appointments.forEach((a) => {
    console.log(`Appt ID: ${a.id} | Status: ${a.status} | Date: ${a.appointmentDate.toISOString().slice(0, 10)} ${a.startTime} | Staff: ${a.staff?.displayName || "Unassigned"} | Customer: ${a.customer?.user?.name} | Biz: ${a.business.name}`);
  });

  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
