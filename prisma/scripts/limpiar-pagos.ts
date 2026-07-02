import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Revisando órdenes de hoy...");
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const ordenes = await prisma.orden.findMany({
    where: { fechaCreacion: { gte: hoy } },
    include: { pagos: true }
  });

  for (const orden of ordenes) {
    const sumPagos = orden.pagos.reduce((acc, p) => acc + p.montoUSD, 0);
    // Tolerancia de 0.1 USD
    if (sumPagos > orden.totalUSD + 0.1) {
      console.log(`Orden ${orden.id} tiene pagos inflados: Factura=${orden.totalUSD}, Pagos=${sumPagos}`);
      await prisma.pago.deleteMany({
        where: { ordenId: orden.id }
      });
      console.log(`Borrados pagos de la orden ${orden.id}.`);
    }
  }
}

main().finally(() => prisma.$disconnect());
