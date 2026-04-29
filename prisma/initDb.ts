import { PrismaClient } from '@prisma/client';
import { seedRoles } from './seeders/rolSeeder';
import { seedEstados } from './seeders/estadoSeeder';
import { seedMetodosPago } from './seeders/metodoPagoSeeder';
import { seedTiposDescuento } from './seeders/tipoDescuentoSeeder';
import { seedUsuarios } from './seeders/usuarioSeeder';
import { seedPruebas } from './seeders/pruebaSeeder';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando carga de datos (InitDB)...');

  try {
    await seedRoles(prisma);
    console.log('Roles cargados correctamente.');

    await seedEstados(prisma);
    console.log('Estados de orden cargados correctamente.');

    await seedMetodosPago(prisma);
    console.log('Metodos de pago cargados correctamente.');

    await seedTiposDescuento(prisma);
    console.log('Tipos de descuento cargados correctamente.');

    await seedUsuarios(prisma);
    console.log('Usuarios base cargados correctamente.');

    await seedPruebas(prisma);
    console.log('Pruebas de laboratorio cargadas correctamente.');

    console.log('Sistema inicializado con exito.');
  } catch (error) {
    console.error('Error en la carga de datos iniciales:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();