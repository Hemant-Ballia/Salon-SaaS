import { getDB } from "./src/config/db.js";

async function verifyRelationships() {
  const db = getDB();
  try {
    console.log("=== VERIFYING DATABASE RELATIONSHIPS ===");
    
    // 1. Businesses
    const businesses = await db.business.findMany({
      where: { deletedAt: null },
      include: {
        owner: { select: { id: true, name: true, email: true, role: true } },
        _count: {
          select: {
            staff: true,
            services: true,
            appointments: true,
            queues: true,
            payments: true,
          }
        }
      }
    });
    console.log(`Found ${businesses.length} active businesses:`);
    for (const b of businesses) {
      console.log(`- Business: [${b.id}] "${b.name}" (slug: ${b.slug}, type: ${b.businessType}, status: ${b.status}, active: ${b.isActive})`);
      console.log(`  Owner: [${b.owner?.id}] ${b.owner?.name} (${b.owner?.email})`);
      console.log(`  Counts: Staff=${b._count.staff}, Services=${b._count.services}, Appointments=${b._count.appointments}, Queues=${b._count.queues}, Payments=${b._count.payments}`);
    }

    // 2. Staff
    const staffList = await db.staff.findMany({
      where: { deletedAt: null },
      include: {
        user: { select: { id: true, name: true, email: true, role: true, isActive: true } },
        business: { select: { id: true, name: true } },
        _count: { select: { schedules: true, appointments: true } }
      }
    });
    console.log(`\nFound ${staffList.length} active staff members:`);
    for (const s of staffList) {
      console.log(`- Staff: [${s.id}] "${s.displayName}" (${s.designation || "No designation"}) | Business: "${s.business?.name}" | User: [${s.user?.id}] ${s.user?.email} (role: ${s.user?.role}, active: ${s.user?.isActive}) | Schedules: ${s._count.schedules} | Appointments: ${s._count.appointments}`);
    }

    // 3. Customers
    const customers = await db.customer.findMany({
      where: { deletedAt: null },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        _count: { select: { appointments: true, queueEntries: true, payments: true } }
      }
    });
    console.log(`\nFound ${customers.length} active customers:`);
    for (const c of customers) {
      console.log(`- Customer: [${c.id}] User: [${c.user?.id}] ${c.user?.name} (${c.user?.email}, ${c.user?.phone}) | Appts: ${c._count.appointments}, QueueEntries: ${c._count.queueEntries}`);
    }

    // 4. Services
    const services = await db.service.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true, price: true, durationMinutes: true, businessId: true }
    });
    console.log(`\nFound ${services.length} active services.`);

    // 5. Queues
    const queues = await db.queue.findMany({
      where: { deletedAt: null },
      include: {
        business: { select: { id: true, name: true } },
        _count: { select: { entries: true } }
      }
    });
    console.log(`\nFound ${queues.length} active queues:`);
    for (const q of queues) {
      console.log(`- Queue: [${q.id}] "${q.name}" | Business: "${q.business?.name}" | Entries: ${q._count.entries}`);
    }

    // 6. Appointments
    const appointments = await db.appointment.findMany({
      where: { deletedAt: null },
      take: 5,
      include: {
        business: { select: { id: true, name: true } },
        customer: { select: { id: true, user: { select: { name: true } } } },
        staff: { select: { id: true, displayName: true } },
        appointmentServices: { include: { service: { select: { name: true } } } },
        queueEntry: true,
        payment: true,
      }
    });
    console.log(`\nFound sample ${appointments.length} appointments:`);
    for (const a of appointments) {
      console.log(`- Appointment: [${a.id}] Date: ${a.appointmentDate.toISOString().slice(0, 10)} ${a.startTime}-${a.endTime} | Status: ${a.status} | Business: ${a.business?.name} | Customer: ${a.customer?.user?.name} | Staff: ${a.staff?.displayName || 'None'} | QueueEntry: ${a.queueEntry?.id || 'None'} | Payment: ${a.payment?.status || 'None'}`);
    }

    console.log("\nRelationship verification completed successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Error verifying relationships:", err);
    process.exit(1);
  }
}

verifyRelationships();
