import { PrismaClient } from '@prisma/client';

export async function seedPruebas(prisma: PrismaClient) {
  console.log('Iniciando seeder de pruebas...');

  // 1. Crear Categorías (Nivel 1: Organizadores)
  const hematologia = await prisma.categoriaPrueba.upsert({
    where: { nombre: 'HEMATOLOGIA' },
    update: {},
    create: { nombre: 'HEMATOLOGIA' },
  });

  const quimica = await prisma.categoriaPrueba.upsert({
    where: { nombre: 'QUIMICA' },
    update: {},
    create: { nombre: 'QUIMICA' },
  });

  // 2. Crear Subcategorías con UPSERT (Nivel 2: Agrupadores)
  // Nota: Como no tienen un campo @unique nativo en el esquema aparte del ID, 
  // la mejor estrategia para el seeder es buscarlas por su nombre combinado con la categoría.
  
  // Para hacerlo limpio y compatible, usamos un findFirst o un upsert basado en una consulta previa
  let subHematologia = await prisma.subcategoriaPrueba.findFirst({
    where: { nombre: 'Hematología Completa', categoriaId: hematologia.id }
  });
  
  if (!subHematologia) {
    subHematologia = await prisma.subcategoriaPrueba.create({
      data: {
        nombre: 'Hematología Completa',
        categoriaId: hematologia.id,
      }
    });
  }

  let subQuimicaBasica = await prisma.subcategoriaPrueba.findFirst({
    where: { nombre: 'Química Sanguínea', categoriaId: quimica.id }
  });

  if (!subQuimicaBasica) {
    subQuimicaBasica = await prisma.subcategoriaPrueba.create({
      data: {
        nombre: 'Química Sanguínea',
        categoriaId: quimica.id,
      }
    });
  }

  // 3. Crear Pruebas Individuales (Nivel 3: Ítems facturables con Precio y Código)
  
  // Pruebas para la subcategoría de Hematología
  const pruebasHem = [
    { 
      codigo: 'GB-01', 
      nombre: 'GLOBULOS BLANCOS', 
      precioUSD: 2.0, 
      unidades: '10^3/mm3', 
      valoresReferencia: '4.8 - 10.8', 
      ordenVisual: 1 
    },
    { 
      codigo: 'GR-01', 
      nombre: 'GLOBULOS ROJOS', 
      precioUSD: 2.0, 
      unidades: '10^6/mm3', 
      valoresReferencia: '4.2 - 5.4', 
      ordenVisual: 2 
    },
    { 
      codigo: 'HGB-01', 
      nombre: 'HEMOGLOBINA', 
      precioUSD: 3.0, 
      unidades: 'g/dL', 
      valoresReferencia: '11.5 - 14.0', 
      ordenVisual: 3 
    },
    { 
      codigo: 'PLQ-01', 
      nombre: 'PLAQUETAS', 
      precioUSD: 3.0, 
      unidades: '10^3/uL', 
      valoresReferencia: '140 - 440', 
      ordenVisual: 4 
    },
  ];

  // Recorremos con UPSERT usando el campo único 'codigo'
  for (const p of pruebasHem) {
    await prisma.prueba.upsert({
      where: { codigo: p.codigo },
      update: {
        nombre: p.nombre,
        precioUSD: p.precioUSD,
        unidades: p.unidades,
        valoresReferencia: p.valoresReferencia,
        ordenVisual: p.ordenVisual,
        subcategoriaId: subHematologia.id,
      },
      create: {
        codigo: p.codigo,
        nombre: p.nombre,
        precioUSD: p.precioUSD,
        unidades: p.unidades,
        valoresReferencia: p.valoresReferencia,
        ordenVisual: p.ordenVisual,
        subcategoriaId: subHematologia.id,
      },
    });
  }

  // Pruebas para la subcategoría de Química
  const pruebasQui = [
    { 
      codigo: 'GLI-01', 
      nombre: 'GLICEMIA AYUNA', 
      precioUSD: 4.0, 
      unidades: 'mg/dl', 
      valoresReferencia: '70 - 100', 
      ordenVisual: 1 
    },
    { 
      codigo: 'CRE-01', 
      nombre: 'CREATININA', 
      precioUSD: 4.5, 
      unidades: 'mg/dl', 
      valoresReferencia: '0.57 - 1.30', 
      ordenVisual: 2 
    },
    { 
      codigo: 'AUR-01', 
      nombre: 'ACIDO URICO', 
      precioUSD: 5.0, 
      unidades: 'mg/dl', 
      valoresReferencia: '1.5 - 7.0', 
      ordenVisual: 3 
    },
    { 
      codigo: 'URE-01', 
      nombre: 'UREA', 
      precioUSD: 4.0, 
      unidades: 'mg/dl', 
      valoresReferencia: '10.0 - 50.0', 
      ordenVisual: 4 
    },
  ];

  // Recorremos con UPSERT usando el campo único 'codigo'
  for (const p of pruebasQui) {
    await prisma.prueba.upsert({
      where: { codigo: p.codigo },
      update: {
        nombre: p.nombre,
        precioUSD: p.precioUSD,
        unidades: p.unidades,
        valoresReferencia: p.valoresReferencia,
        ordenVisual: p.ordenVisual,
        subcategoriaId: subQuimicaBasica.id,
      },
      create: {
        codigo: p.codigo,
        nombre: p.nombre,
        precioUSD: p.precioUSD,
        unidades: p.unidades,
        valoresReferencia: p.valoresReferencia,
        ordenVisual: p.ordenVisual,
        subcategoriaId: subQuimicaBasica.id,
      },
    });
  }

  console.log('Seeder de pruebas completado con éxito.');
}