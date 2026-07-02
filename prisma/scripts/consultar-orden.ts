import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const orden = await prisma.orden.findUnique({
    where: { id: 50 },
    include: { pagos: true }
  });
  console.log(JSON.stringify(orden?.pagos, null, 2));
}

main().finally(() => prisma.$disconnect());
