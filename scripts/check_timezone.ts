import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const ordenes = await prisma.orden.findMany({
    take: 5,
    orderBy: { fechaCreacion: "desc" },
    select: { id: true, fechaCreacion: true }
  });

  const ahora = new Date();
  console.log(`\n=== HORA ACTUAL ===`);
  console.log(`UTC:        ${ahora.toISOString()}`);
  console.log(`Venezuela:  ${ahora.toLocaleString("es-VE", { timeZone: "America/Caracas" })}`);

  console.log(`\n=== ÚLTIMAS 5 ÓRDENES EN BD ===`);
  for (const o of ordenes) {
    const fechaUTC = new Date(o.fechaCreacion);
    const fechaVE = fechaUTC.toLocaleString("es-VE", { timeZone: "America/Caracas" });
    console.log(`Orden #${o.id} | BD (UTC): ${fechaUTC.toISOString()} | Venezuela: ${fechaVE}`);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
