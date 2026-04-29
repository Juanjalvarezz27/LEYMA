import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

export async function seedUsuarios(prisma: PrismaClient) {
  const adminRol = await prisma.rol.findUnique({ where: { nombre: 'ADMIN' } });

  if (!adminRol) {
    throw new Error('El rol ADMIN debe crearse antes que los usuarios.');
  }

  const saltRounds = 10;
  const claveHasheada = await bcrypt.hash('1234', saltRounds);

  await prisma.usuario.upsert({
    where: { correo: 'admin@admin' },
    update: {}, 
    create: {
      nombre: 'Administrador Principal',
      correo: 'admin@admin',
      clave: claveHasheada,
      rolId: adminRol.id,
      activo: true,
    },
  });
}