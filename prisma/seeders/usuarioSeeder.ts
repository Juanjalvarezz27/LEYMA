import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

export async function seedUsuarios(prisma: PrismaClient) {
  // 1. Buscamos los roles necesarios
  const adminRol = await prisma.rol.findUnique({ where: { nombre: 'ADMIN' } });
  const usuarioRol = await prisma.rol.findUnique({ where: { nombre: 'USUARIO' } });

  if (!adminRol || !usuarioRol) {
    throw new Error('Los roles ADMIN y USUARIO deben crearse antes que los usuarios.');
  }

  const saltRounds = 10;
  // Hasheamos la clave genérica "1234" para todos los usuarios iniciales
  const claveHasheada = await bcrypt.hash('1234', saltRounds);

  // 2. Administrador Principal (El que ya tenías)
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

  // 3. Leslie Alvarez (ADMIN)
  await prisma.usuario.upsert({
    where: { correo: 'hleslieag@gmail.com' },
    update: {}, 
    create: {
      nombre: 'Leslie Alvarez',
      correo: 'hleslieag@gmail.com',
      clave: claveHasheada,
      rolId: adminRol.id,
      activo: true,
    },
  });

  // 4. Mayira (ADMIN)
  await prisma.usuario.upsert({
    where: { correo: 'mayira@gmail.com' },
    update: {}, 
    create: {
      nombre: 'Mayira', 
      correo: 'mayira@gmail.com',
      clave: claveHasheada,
      rolId: adminRol.id,
      activo: true,
    },
  });

  // 5. Asistente General (USUARIO)
  await prisma.usuario.upsert({
    where: { correo: 'asistente@gmail.com' },
    update: {}, 
    create: {
      nombre: 'Asistente de Laboratorio',
      correo: 'asistente@gmail.com',
      clave: claveHasheada,
      rolId: usuarioRol.id,
      activo: true,
    },
  });

  console.log(' Usuarios semilla creados correctamente.');
}