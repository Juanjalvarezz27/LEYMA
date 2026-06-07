import { PrismaClient } from '@prisma/client';

export async function seedPruebas(prisma: PrismaClient) {
  console.log('Iniciando seeder de pruebas...');

  async function upsertPruebaHelper(p: any, subId: string) {
    const exist = await prisma.prueba.findFirst({ where: { codigo: p.codigo, subcategoriaId: subId } });
    if (exist) {
      await prisma.prueba.update({
        where: { id: exist.id },
        data: {
          nombre: p.nombre,
          precioUSD: p.precioUSD,
          unidades: p.unidades,
          valoresReferencia: p.valoresReferencia,
          ordenVisual: p.ordenVisual,
          subcategoriaId: subId,
        }
      });
    } else {
      await prisma.prueba.create({
        data: {
          codigo: p.codigo,
          nombre: p.nombre,
          precioUSD: p.precioUSD,
          unidades: p.unidades,
          valoresReferencia: p.valoresReferencia,
          ordenVisual: p.ordenVisual,
          subcategoriaId: subId,
        }
      });
    }
  }


  // 1. Crear Categorías (Nivel 1: Organizadores)
  const quimica = await prisma.categoriaPrueba.upsert({
    where: { nombre: 'QUIMICA' },
    update: {},
    create: { nombre: 'QUIMICA' },
  });

  // 2. Crear Subcategorías con UPSERT (Nivel 2: Agrupadores)
  // Nota: Como no tienen un campo @unique nativo en el esquema aparte del ID, 
  // la mejor estrategia para el seeder es buscarlas por su nombre combinado con la categoría.
  
  // Para hacerlo limpio y compatible, usamos un findFirst o un upsert basado en una consulta previa
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

  // =============================================
  // PRUEBAS INDIVIDUALES de Química Sanguínea
  // (Cada una tiene su propio precio y se factura sola)
  // =============================================
  const pruebasQui = [
    { codigo: 'QS-AUR', nombre: 'ACIDO URICO', precioUSD: 2.5, unidades: 'mg/dL', valoresReferencia: '3.5 - 7.5 mg/dL', ordenVisual: 1 },
    { codigo: 'QS-AMI', nombre: 'AMILASA', precioUSD: 5.0, unidades: 'U/L', valoresReferencia: 'Hasta 140 U/L', ordenVisual: 2 },
    { codigo: 'QS-COL', nombre: 'COLESTEROL TOTAL', precioUSD: 3.0, unidades: 'mg/dL', valoresReferencia: 'Menor a 150 mg/dL', ordenVisual: 3 },
    { codigo: 'QS-HDL', nombre: 'COLESTEROL HDL', precioUSD: 3.0, unidades: 'mg/dL', valoresReferencia: 'Hombres 26 - 63 mg/dL | Mujeres 33 - 75 mg/dL', ordenVisual: 4 },
    { codigo: 'QS-CAL', nombre: 'CALCIO', precioUSD: 3.0, unidades: 'mg/dL', valoresReferencia: '8.5 - 11.0 mg/dL', ordenVisual: 5 },
    { codigo: 'QS-CALI', nombre: 'CALCIO IONICO', precioUSD: 4.0, unidades: 'mg/dL', valoresReferencia: '4.6 - 5.3 mg/dL', ordenVisual: 6 },
    { codigo: 'QS-CRE', nombre: 'CREATININA', precioUSD: 2.0, unidades: 'mg/dL', valoresReferencia: 'Hombres 0.7 - 1.63 mg/dL | Mujeres 0.5 - 1.1 mg/dL', ordenVisual: 7 },
    { codigo: 'QS-CLO', nombre: 'CLORO', precioUSD: 4.0, unidades: 'mEq/L', valoresReferencia: '96 - 106 mEq/L', ordenVisual: 8 },
    { codigo: 'QS-DD', nombre: 'DIMERO D', precioUSD: 10.0, unidades: 'ng/mL', valoresReferencia: 'Menor a 500 ng/mL', ordenVisual: 9 },
    { codigo: 'QS-FIB', nombre: 'FIBRINOGENO', precioUSD: 4.5, unidades: '%', valoresReferencia: '200 - 450%', ordenVisual: 10 },
    { codigo: 'QS-FOS', nombre: 'FOSFORO', precioUSD: 2.5, unidades: 'mg/dL', valoresReferencia: 'Adultos 2.5 - 4.5 mg/dL | Niños 4.0 - 7.0 mg/dL', ordenVisual: 11 },
    { codigo: 'QS-FA', nombre: 'FOSFATASAS ALCALINAS', precioUSD: 4.5, unidades: 'UI/L', valoresReferencia: 'Adultos 40 - 140 UI/L', ordenVisual: 12 },
    { codigo: 'QS-GLU', nombre: 'GLUCOSA BASAL (AYUNO)', precioUSD: 2.0, unidades: 'mg/dL', valoresReferencia: '70 - 110 mg/dL', ordenVisual: 13 },
    { codigo: 'QS-GPC30', nombre: 'GLUCOSA POST CARGA 30 MIN', precioUSD: 2.0, unidades: 'mg/dL', valoresReferencia: null, ordenVisual: 14 },
    { codigo: 'QS-GPC60', nombre: 'GLUCOSA POST CARGA 60 MIN', precioUSD: 2.0, unidades: 'mg/dL', valoresReferencia: null, ordenVisual: 15 },
    { codigo: 'QS-GPC120', nombre: 'GLUCOSA POST CARGA 120 MIN', precioUSD: 2.0, unidades: 'mg/dL', valoresReferencia: null, ordenVisual: 16 },
    { codigo: 'QS-GGT', nombre: 'GAMMA GLUTAMIL TRANSFERASA (GGT)', precioUSD: 4.5, unidades: 'U/L', valoresReferencia: '5 - 40 U/L', ordenVisual: 17 },
    { codigo: 'QS-HBA1C', nombre: 'HEMOGLOBINA GLICADA (HbA1c)', precioUSD: 10.0, unidades: '%', valoresReferencia: 'Normal menor a 5.7%', ordenVisual: 18 },
    { codigo: 'QS-FE', nombre: 'HIERRO SERICO', precioUSD: 4.0, unidades: 'mg/dL', valoresReferencia: 'Hombres 65 - 175 mg/dL | Mujeres 50 - 175 mg/dL', ordenVisual: 19 },
    { codigo: 'QS-INS', nombre: 'INSULINA BASAL (AYUNAS)', precioUSD: 6.5, unidades: 'mg/mL', valoresReferencia: '2 - 25 mg/mL', ordenVisual: 20 },
    { codigo: 'QS-INSP', nombre: 'INSULINA POSPRANDIAL (2 HORAS)', precioUSD: 6.5, unidades: 'mg/mL', valoresReferencia: null, ordenVisual: 21 },
    { codigo: 'QS-LDH', nombre: 'LACTATO DESHIDROGENASA (LDH)', precioUSD: 3.0, unidades: 'UI/L', valoresReferencia: '105 - 333 UI/L', ordenVisual: 22 },
    { codigo: 'QS-MG', nombre: 'MAGNESIO', precioUSD: 7.0, unidades: 'mEq/dL', valoresReferencia: '1.7 - 2.2 mEq/dL', ordenVisual: 23 },
    { codigo: 'QS-NTBNP', nombre: 'NT-PRO BNP', precioUSD: 17.0, unidades: 'mg/dL', valoresReferencia: 'Menor a 125 pm/mL', ordenVisual: 24 },
    { codigo: 'QS-K', nombre: 'POTASIO', precioUSD: 6.5, unidades: 'mEq/dL', valoresReferencia: '3.5 - 5.2 mEq/dL', ordenVisual: 25 },
    { codigo: 'QS-PCR', nombre: 'PROTEINA C REACTIVA (PCR)', precioUSD: 6.5, unidades: 'mg/dL', valoresReferencia: 'Menor 0.6 mg/dL', ordenVisual: 26 },
    { codigo: 'QS-TG', nombre: 'TRIGLICERIDOS', precioUSD: 4.5, unidades: 'mg/dL', valoresReferencia: 'Menor a 136 mg/dL', ordenVisual: 27 },
    { codigo: 'QS-URE', nombre: 'UREA', precioUSD: 2.0, unidades: 'mg/dL', valoresReferencia: '10 - 40 mg/dL', ordenVisual: 28 },
  ];

  // Recorremos con UPSERT usando el campo único 'codigo'
  for (const p of pruebasQui) {
    await upsertPruebaHelper(p, subQuimicaBasica.id);
  }

  // =============================================
  // PAQUETES de Química Sanguínea
  // (Subcategorías tipo paquete: agrupan sub-pruebas bajo un solo precio)
  // =============================================

  // --- PAQUETE: Bilirrubina Total y Fraccionada ($4.5) ---
  let subBilirrubina = await prisma.subcategoriaPrueba.findFirst({
    where: { nombre: 'Bilirrubina Total y Fraccionada', categoriaId: quimica.id }
  });
  if (!subBilirrubina) {
    subBilirrubina = await prisma.subcategoriaPrueba.create({
      data: {
        nombre: 'Bilirrubina Total y Fraccionada',
        categoriaId: quimica.id,
        esPaquete: true,
        precioUSD: 4.5,
      }
    });
  } else {
    await prisma.subcategoriaPrueba.update({
      where: { id: subBilirrubina.id },
      data: { esPaquete: true, precioUSD: 4.5 },
    });
  }

  const pruebasBilirrubina = [
    { codigo: 'QS-BILT', nombre: 'BILIRRUBINA TOTAL', precioUSD: null, unidades: 'mg/dL', valoresReferencia: '0.1 - 1.2 mg/dL', ordenVisual: 1 },
    { codigo: 'QS-BILD', nombre: 'BILIRRUBINA DIRECTA', precioUSD: null, unidades: 'mg/dL', valoresReferencia: '0.0 - 0.4 mg/dL', ordenVisual: 2 },
    { codigo: 'QS-BILI', nombre: 'BILIRRUBINA INDIRECTA', precioUSD: null, unidades: 'mg/dL', valoresReferencia: '0.1 - 1.0 mg/dL', ordenVisual: 3 },
  ];

  for (const p of pruebasBilirrubina) {
    await upsertPruebaHelper(p, subBilirrubina.id);
  }

  // --- PAQUETE: Proteínas Totales y Fraccionadas ($3.5) ---
  let subProteinas = await prisma.subcategoriaPrueba.findFirst({
    where: { nombre: 'Proteínas Totales y Fraccionadas', categoriaId: quimica.id }
  });
  if (!subProteinas) {
    subProteinas = await prisma.subcategoriaPrueba.create({
      data: {
        nombre: 'Proteínas Totales y Fraccionadas',
        categoriaId: quimica.id,
        esPaquete: true,
        precioUSD: 3.5,
      }
    });
  } else {
    await prisma.subcategoriaPrueba.update({
      where: { id: subProteinas.id },
      data: { esPaquete: true, precioUSD: 3.5 },
    });
  }

  const pruebasProteinas = [
    { codigo: 'QS-PROT', nombre: 'PROTEINAS TOTALES', precioUSD: null, unidades: 'g/dL', valoresReferencia: '6.0 - 8.0 g/dL', ordenVisual: 1 },
    { codigo: 'QS-ALB', nombre: 'ALBUMINA', precioUSD: null, unidades: 'g/dL', valoresReferencia: '3.0 - 5.0 g/dL', ordenVisual: 2 },
    { codigo: 'QS-GLOB', nombre: 'GLOBULINAS', precioUSD: null, unidades: 'g/dL', valoresReferencia: '2.0 - 4.0 g/dL', ordenVisual: 3 },
  ];

  for (const p of pruebasProteinas) {
    await upsertPruebaHelper(p, subProteinas.id);
  }

  // --- PAQUETE: Transaminasas ($3.5) ---
  let subTransaminasas = await prisma.subcategoriaPrueba.findFirst({
    where: { nombre: 'Transaminasas', categoriaId: quimica.id }
  });
  if (!subTransaminasas) {
    subTransaminasas = await prisma.subcategoriaPrueba.create({
      data: {
        nombre: 'Transaminasas',
        categoriaId: quimica.id,
        esPaquete: true,
        precioUSD: 3.5,
      }
    });
  } else {
    await prisma.subcategoriaPrueba.update({
      where: { id: subTransaminasas.id },
      data: { esPaquete: true, precioUSD: 3.5 },
    });
  }

  const pruebasTransaminasas = [
    { codigo: 'QS-ALT', nombre: 'PIRUVICA (ALT)', precioUSD: null, unidades: 'U/L', valoresReferencia: '4 - 36 U/L', ordenVisual: 1 },
    { codigo: 'QS-AST', nombre: 'OXALOACETICA (AST)', precioUSD: null, unidades: 'U/L', valoresReferencia: '8 - 33 U/L', ordenVisual: 2 },
  ];

  for (const p of pruebasTransaminasas) {
    await upsertPruebaHelper(p, subTransaminasas.id);
  }

  console.log('Seeder de pruebas completado con éxito.');
}