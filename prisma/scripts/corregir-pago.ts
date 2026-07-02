import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Actualizando los registros de la orden 50 a los valores correctos solicitados...");
  
  // 1. Borramos el de 0.01 porque no es necesario si la cuenta queda en 7.13
  await prisma.pago.delete({
    where: { id: "cmr3ihccx0006jo048v0ac0p2" }
  });
  console.log("[OK] Pago fantasma de 0.01 eliminado.");

  // 2. Actualizamos el de 711.5 a 7.13 (y su respectivo en BS)
  await prisma.pago.update({
    where: { id: "cmr3iwkkh000jjo045z0v58qf" },
    data: {
      montoUSD: 7.13,
      montoBS: 6678.67
    }
  });
  console.log("[OK] Pago inflado de 711.5 corregido a 7.13 USD y 6678.67 BS.");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    console.log("Desconectado de Prisma");
  });
