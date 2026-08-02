import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const usuario = await prisma.usuario.update({
    where: { id: "cmq6xn9n400053su0lampiq4t" },
    data: { activo: false }
  });

  console.log(`Usuario desactivado: ${usuario.nombre} (${usuario.correo}) — activo: ${usuario.activo}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
