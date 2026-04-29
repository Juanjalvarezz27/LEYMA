import { PrismaClient } from '@prisma/client';

export async function seedPruebas(prisma: PrismaClient) {
  await prisma.prueba.createMany({
    data: [
      { codigo: 'HEM-01', nombre: 'Hematologia Completa', precioUSD: 5.00 },
      { codigo: 'PER-20', nombre: 'Perfil 20', precioUSD: 15.00 },
      { codigo: 'GLI-01', nombre: 'Glicemia Basal', precioUSD: 3.00 },
      { codigo: 'COL-01', nombre: 'Colesterol Total', precioUSD: 4.00 },
      { codigo: 'TRI-01', nombre: 'Trigliceridos', precioUSD: 4.00 },
      { codigo: 'ACU-01', nombre: 'Acido Urico', precioUSD: 3.50 },
      { codigo: 'CRE-01', nombre: 'Creatinina', precioUSD: 4.00 },
      { codigo: 'URE-01', nombre: 'Urea', precioUSD: 3.00 },
      { codigo: 'ORI-01', nombre: 'Examen de Orina', precioUSD: 3.00 },
      { codigo: 'HEC-01', nombre: 'Examen de Heces', precioUSD: 3.00 }
    ],
    skipDuplicates: true,
  });
}