// ReporteDocumentServer.tsx
// Versión del ReporteDocument para uso en el SERVIDOR (API routes).
// NO tiene "use client". Acepta logoBase64 como prop para evitar
// leer archivos del filesystem desde dentro del componente.

import { Document, Page, Text, View, StyleSheet, Image, Font } from "@react-pdf/renderer";

// ---------------------------------------------------------------------------
// 1. REGISTRO DE FUENTES
// ---------------------------------------------------------------------------
Font.register({
  family: "Montserrat",
  src: "https://cdn.jsdelivr.net/fontsource/fonts/montserrat@latest/latin-900-normal.ttf",
});

Font.register({
  family: "Inter",
  fonts: [
    {
      src: "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-400-normal.ttf",
      fontWeight: 400,
    },
    {
      src: "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-700-normal.ttf",
      fontWeight: 700,
    },
  ],
});

// ---------------------------------------------------------------------------
// 2. ESTILOS (idénticos a ReporteDocument.tsx)
// ---------------------------------------------------------------------------
const pdfStyles = StyleSheet.create({
  page: {
    paddingTop: 25,
    paddingBottom: 70,
    paddingHorizontal: 30,
    fontFamily: "Inter",
    fontSize: 10,
    color: "#000",
  },
  topContact: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingBottom: 4,
    marginBottom: 6,
  },
  topContactText: { fontSize: 7, color: "#64748B", fontWeight: 700 },
  topContactRight: { flexDirection: "row", gap: 10 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1.5,
    borderBottomColor: "#000",
    paddingBottom: 8,
    marginBottom: 10,
  },
  logoRow: { flexDirection: "row", alignItems: "center" },
  logoImage: { width: 50, height: 50, objectFit: "contain", marginRight: 12 },
  logoTitle: { fontSize: 24, fontFamily: "Montserrat", marginBottom: 1 },
  logoSubtitle: { fontSize: 8, fontWeight: 700, letterSpacing: 0.5 },

  headerData: { textAlign: "right", fontSize: 10 },
  headerDataRow: { flexDirection: "row", justifyContent: "flex-end", marginBottom: 2 },
  headerDataLabel: { fontWeight: 700, marginRight: 4 },

  patientBox: {
    flexDirection: "row",
    borderBottomWidth: 1.5,
    borderBottomColor: "#000",
    paddingBottom: 8,
    marginBottom: 10,
  },
  patientColLeft: { width: "55%", paddingRight: 10 },
  patientColRight: {
    width: "45%",
    borderLeftWidth: 1,
    borderLeftColor: "#E2E8F0",
    paddingLeft: 15,
  },
  patientRow: { flexDirection: "row", marginBottom: 3 },
  patientLabel: { width: 85, fontWeight: 700, fontSize: 10.5 },
  patientValue: { flex: 1, fontSize: 10.5, textTransform: "uppercase" },

  categoryBlock: {
    flexDirection: "row",
    width: "100%",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingBottom: 10,
  },
  tableSide: { width: "74%", paddingRight: 15 },
  signatureSide: {
    width: "26%",
    justifyContent: "center",
    alignItems: "center",
    borderLeftWidth: 1,
    borderLeftColor: "#CBD5E1",
    paddingLeft: 15,
    paddingBottom: 5,
  },

  catTitle: {
    fontSize: 13,
    fontWeight: 700,
    borderBottomWidth: 1.5,
    borderBottomColor: "#000",
    paddingBottom: 4,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    paddingBottom: 4,
    marginBottom: 6,
  },
  colDesc: { width: "38%", fontWeight: 700, fontSize: 8.5 },
  colRes: { width: "17%", fontWeight: 700, fontSize: 8.5, textAlign: "center" },
  colUni: { width: "15%", fontWeight: 700, fontSize: 8.5, textAlign: "center" },
  colRef: { width: "30%", fontWeight: 700, fontSize: 8.5, textAlign: "right" },

  subcatTitle: { fontSize: 9.5, fontWeight: 700, paddingVertical: 3, paddingLeft: 5 },

  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 4,
    paddingVertical: 3,
  },
  rowDesc: { width: "38%", fontSize: 8.5, fontWeight: 700 },
  rowDescSub: { width: "38%", fontSize: 8.5, fontWeight: 700, paddingLeft: 10 },
  multiRowDesc: {
    width: "38%",
    fontSize: 8,
    fontWeight: 400,
    paddingLeft: 15,
    color: "#334155",
  },
  rowRes: { width: "17%", fontSize: 10.5, fontWeight: 700, textAlign: "center" },
  rowUni: { width: "15%", fontSize: 8.5, textAlign: "center" },
  rowRef: { width: "30%", fontSize: 8.5, textAlign: "right" },

  obsContainer: {
    marginLeft: 10,
    marginBottom: 5,
    marginTop: 2,
    flexDirection: "row",
  },
  obsLabel: { fontSize: 8.5, fontWeight: 700, color: "#475569" },
  obsText: { fontSize: 8.5, fontWeight: 400, color: "#475569" },

  inlineSignatureBlock: { alignItems: "center", width: "100%", marginBottom: 5 },
  inlineFirmaImage: { width: 85, height: 40, objectFit: "contain", marginBottom: 2 },
  inlineSignatureLine: {
    width: "100%",
    borderTopWidth: 1,
    borderTopColor: "#000",
    paddingTop: 6,
    alignItems: "center",
  },
  inlineBioanalista: {
    fontSize: 8.5,
    fontWeight: 700,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    textAlign: "center",
  },
  inlineLabName: { fontSize: 7, color: "#64748B", marginTop: 1.5, textAlign: "center" },

  footer: { position: "absolute", bottom: 25, left: 30, right: 30 },
  footerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingTop: 10,
    width: "100%",
  },
  qrRow: { flexDirection: "row", alignItems: "center", gap: 10, width: "50%" },
  qrImage: { width: 45, height: 45 },
  qrLabelBox: { flexDirection: "column", justifyContent: "center" },
  qrTitle: { fontSize: 8.5, fontWeight: 700, color: "#1D1D1F" },
  qrSubtitle: { fontSize: 7, color: "#64748B", marginTop: 1, maxWidth: 160 },
  legalBox: { width: "50%", alignItems: "flex-end" },
  legalText: {
    fontSize: 7.5,
    fontWeight: 700,
    color: "#64748B",
    textAlign: "right",
    textTransform: "uppercase",
  },
});

// ---------------------------------------------------------------------------
// 3. HELPERS
// ---------------------------------------------------------------------------
function formatFechaHora(dateString: string): string {
  const d = new Date(dateString);
  const dateStr = d.toLocaleDateString("es-VE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "America/Caracas"
  });
  const timeStr = d.toLocaleTimeString("es-VE", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/Caracas"
  });
  return `${dateStr} ${timeStr}`;
}

function calcularEdad(fechaNac: string, esBebe: boolean): string {
  if (!fechaNac) return "N/A";
  const hoy = new Date();
  const nacimiento = new Date(fechaNac);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const m = hoy.getMonth() - nacimiento.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
  return `${edad} ${esBebe ? "Meses" : "Años"}`;
}

// ---------------------------------------------------------------------------
// 4. PROPS
// ---------------------------------------------------------------------------
interface ReporteDocumentServerProps {
  orden: any;
  fechaImpresa: string;
  qrCodeUrl: string;
  logoBase64?: string;
}

// ---------------------------------------------------------------------------
// 5. COMPONENTE PRINCIPAL
// ---------------------------------------------------------------------------
const ReporteDocumentServer = ({
  orden,
  fechaImpresa,
  qrCodeUrl,
  logoBase64,
}: ReporteDocumentServerProps) => {
  const groupedByCategory = orden.detalles.reduce((acc: any, det: any) => {
    const catNombre = det.prueba?.subcategoria?.categoria?.nombre || "OTROS";
    const subcatNombre = det.prueba?.subcategoria?.nombre || "PRUEBAS INDIVIDUALES";

    if (!acc[catNombre]) {
      acc[catNombre] = { subcategorias: {}, signers: new Map() };
    }
    if (!acc[catNombre].subcategorias[subcatNombre]) {
      acc[catNombre].subcategorias[subcatNombre] = [];
    }
    acc[catNombre].subcategorias[subcatNombre].push(det);

    if (det.resultado?.firmado && det.resultado?.procesadoPor) {
      acc[catNombre].signers.set(
        det.resultado.procesadoPor.id,
        det.resultado.procesadoPor
      );
    }

    return acc;
  }, {});

  return (
    <Document>
      <Page size="LETTER" style={pdfStyles.page}>

        {/* INFO CONTACTO SUPERIOR */}
        <View style={pdfStyles.topContact}>
          <Text style={pdfStyles.topContactText}>
            DIRECCIÓN: AV. BOLÍVAR, SECTOR CARMONA, EDIF. LEYMA.
          </Text>
          <View style={pdfStyles.topContactRight}>
            <Text style={pdfStyles.topContactText}>TELÉFONO: 0412-9164371</Text>
            <Text style={pdfStyles.topContactText}>CORREO: CONTACTO@LEYMA.COM</Text>
            <Text style={pdfStyles.topContactText}>RIF: J-00000000-0</Text>
          </View>
        </View>

        {/* HEADER */}
        <View style={pdfStyles.header}>
          <View style={pdfStyles.logoRow}>
            {logoBase64 ? (
              <Image src={logoBase64} style={pdfStyles.logoImage} />
            ) : null}
            <View>
              <Text style={pdfStyles.logoTitle}>LEYMA C.A.</Text>
              <Text style={pdfStyles.logoSubtitle}>
                LABORATORIO CLÍNICO BACTERIOLÓGICO
              </Text>
            </View>
          </View>
          <View style={pdfStyles.headerData}>
            <View style={pdfStyles.headerDataRow}>
              <Text style={pdfStyles.headerDataLabel}>Orden N°:</Text>
              <Text>#{orden.id.toString().padStart(6, "0")}</Text>
            </View>
            <View style={pdfStyles.headerDataRow}>
              <Text style={pdfStyles.headerDataLabel}>Ingreso:</Text>
              <Text>{formatFechaHora(orden.fechaCreacion)}</Text>
            </View>
            <View style={pdfStyles.headerDataRow}>
              <Text style={pdfStyles.headerDataLabel}>Impreso:</Text>
              <Text>{fechaImpresa}</Text>
            </View>
          </View>
        </View>

        {/* FICHA DEL PACIENTE */}
        <View style={pdfStyles.patientBox}>
          <View style={pdfStyles.patientColLeft}>
            <View style={pdfStyles.patientRow}>
              <Text style={pdfStyles.patientLabel}>Paciente:</Text>
              <Text style={pdfStyles.patientValue}>{orden.paciente.nombreCompleto}</Text>
            </View>
            <View style={pdfStyles.patientRow}>
              <Text style={pdfStyles.patientLabel}>Edad:</Text>
              <Text style={pdfStyles.patientValue}>
                {calcularEdad(orden.paciente.fechaNacimiento, orden.paciente.esBebe)}
              </Text>
            </View>
            <View style={pdfStyles.patientRow}>
              <Text style={pdfStyles.patientLabel}>Dirección:</Text>
              <Text style={pdfStyles.patientValue}>
                {orden.paciente.direccion || "No registrada"}
              </Text>
            </View>
            <View style={pdfStyles.patientRow}>
              <Text style={pdfStyles.patientLabel}>Observaciones:</Text>
              <Text style={pdfStyles.patientValue}>
                {orden.paciente.observaciones || "---"}
              </Text>
            </View>
          </View>

          <View style={pdfStyles.patientColRight}>
            <View style={pdfStyles.patientRow}>
              <Text style={pdfStyles.patientLabel}>C.I:</Text>
              <Text style={pdfStyles.patientValue}>
                {orden.paciente.cedula || "S/N"}
              </Text>
            </View>
            <View style={pdfStyles.patientRow}>
              <Text style={pdfStyles.patientLabel}>Sexo:</Text>
              <Text style={pdfStyles.patientValue}>
                {orden.paciente.sexo === "M" ? "Masculino" : "Femenino"}
              </Text>
            </View>
            <View style={pdfStyles.patientRow}>
              <Text style={pdfStyles.patientLabel}>Teléfono:</Text>
              <Text style={pdfStyles.patientValue}>
                {orden.paciente.telefono || "No registrado"}
              </Text>
            </View>
            <View style={pdfStyles.patientRow}>
              <Text style={pdfStyles.patientLabel}>Ubicación:</Text>
              <Text style={pdfStyles.patientValue}>MATRIZ</Text>
            </View>
          </View>
        </View>

        {/* CUERPO DEL REPORTE */}
        {Object.entries(groupedByCategory).map(
          ([catNombre, catData]: [string, any]) => (
            <View key={catNombre} style={pdfStyles.categoryBlock} wrap={false}>

              {/* LADO IZQUIERDO: LA TABLA */}
              <View style={pdfStyles.tableSide}>
                <Text style={pdfStyles.catTitle}>{catNombre}</Text>

                {Object.entries(catData.subcategorias).map(
                  ([subCatNombre, detalles]: [string, any]) => (
                    <View key={subCatNombre} style={{ marginBottom: 10 }}>
                      <View style={pdfStyles.tableHeader}>
                        <Text style={pdfStyles.colDesc}>PARAMETRO</Text>
                        <Text style={pdfStyles.colRes}>RESULTADO</Text>
                        <Text style={pdfStyles.colUni}>UNIDADES</Text>
                        <Text style={pdfStyles.colRef}>VALORES DE REFERENCIA</Text>
                      </View>

                      {detalles[0]?.prueba?.subcategoria?.esPaquete && (
                        <Text style={pdfStyles.subcatTitle}>{subCatNombre}</Text>
                      )}

                      {detalles.map((det: any) => {
                        const isPaquete =
                          detalles[0]?.prueba?.subcategoria?.esPaquete;
                        const listaValores = det.resultado?.valores || [];

                        return (
                          <View key={det.id} wrap={false}>
                            {det.cantidad > 1 ? (
                              <View>
                                <View style={pdfStyles.row}>
                                  <Text
                                    style={
                                      isPaquete
                                        ? pdfStyles.rowDescSub
                                        : pdfStyles.rowDesc
                                    }
                                  >
                                    {det.prueba.nombre}
                                  </Text>
                                  <Text style={pdfStyles.rowRes}></Text>
                                  <Text style={pdfStyles.rowUni}>
                                    {det.prueba.unidades || ""}
                                  </Text>
                                  <Text style={pdfStyles.rowRef}>
                                    {det.resultado?.valoresReferencia ||
                                      det.prueba.valoresReferencia ||
                                      ""}
                                  </Text>
                                </View>
                                {Array(det.cantidad)
                                  .fill(0)
                                  .map((_: any, i: number) => {
                                    const valorMuestra =
                                      listaValores[i]?.valorIngresado || "-";
                                    return (
                                      <View key={i} style={pdfStyles.row}>
                                        <Text style={pdfStyles.multiRowDesc}>
                                          Muestra {i + 1}
                                        </Text>
                                        <Text style={pdfStyles.rowRes}>
                                          {valorMuestra}
                                        </Text>
                                        <Text style={pdfStyles.rowUni}></Text>
                                        <Text style={pdfStyles.rowRef}></Text>
                                      </View>
                                    );
                                  })}
                              </View>
                            ) : (
                              <View style={pdfStyles.row}>
                                <Text
                                  style={
                                    isPaquete
                                      ? pdfStyles.rowDescSub
                                      : pdfStyles.rowDesc
                                  }
                                >
                                  {det.prueba.nombre}
                                </Text>
                                <Text style={pdfStyles.rowRes}>
                                  {listaValores[0]?.valorIngresado || "-"}
                                </Text>
                                <Text style={pdfStyles.rowUni}>
                                  {det.prueba.unidades || ""}
                                </Text>
                                <Text style={pdfStyles.rowRef}>
                                  {det.resultado?.valoresReferencia ||
                                    det.prueba.valoresReferencia ||
                                    ""}
                                </Text>
                              </View>
                            )}

                            {det.resultado?.observaciones && (
                              <View style={pdfStyles.obsContainer}>
                                <Text style={pdfStyles.obsLabel}>
                                  Nota ({det.prueba.nombre}):{" "}
                                </Text>
                                <Text style={pdfStyles.obsText}>
                                  {det.resultado.observaciones}
                                </Text>
                              </View>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  )
                )}
              </View>

              {/* LADO DERECHO: LA FIRMA */}
              <View style={pdfStyles.signatureSide}>
                {catData.signers.size > 0 ? (
                  Array.from(catData.signers.values()).map((bio: any) => (
                    <View key={bio.id} style={pdfStyles.inlineSignatureBlock}>
                      {bio.firmaUrl ? (
                        <Image
                          src={bio.firmaUrl}
                          style={pdfStyles.inlineFirmaImage}
                        />
                      ) : (
                        <View style={{ height: 35 }} />
                      )}
                      <View style={pdfStyles.inlineSignatureLine}>
                        <Text style={pdfStyles.inlineBioanalista}>{bio.nombre}</Text>
                        <Text style={pdfStyles.inlineLabName}>
                          Bioanalista LEYMA C.A.
                        </Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={pdfStyles.inlineSignatureBlock}>
                    <View style={{ height: 35 }} />
                    <View style={pdfStyles.inlineSignatureLine}>
                      <Text style={pdfStyles.inlineBioanalista}>BIOANALISTA</Text>
                      <Text style={pdfStyles.inlineLabName}>LEYMA C.A.</Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          )
        )}

        {/* FOOTER */}
        <View
          style={pdfStyles.footer}
          fixed
          render={(props: any) => {
            const { pageNumber, totalPages } = props;
            if (pageNumber === totalPages) {
              return (
                <View style={pdfStyles.footerContent}>
                  <View style={pdfStyles.qrRow}>
                    {qrCodeUrl ? (
                      <Image src={qrCodeUrl} style={pdfStyles.qrImage} />
                    ) : (
                      <View style={pdfStyles.qrImage} />
                    )}
                    <View style={pdfStyles.qrLabelBox}>
                      <Text style={pdfStyles.qrTitle}>DOC. VERIFICADO</Text>
                      <Text style={pdfStyles.qrSubtitle}>
                        Escanee este código para validar la autenticidad en el
                        servidor de LEYMA C.A.
                      </Text>
                    </View>
                  </View>
                  <View style={pdfStyles.legalBox}>
                    <Text style={pdfStyles.legalText}>
                      ESTE REPORTE ES UN DOCUMENTO ELECTRÓNICO OFICIAL{"\n"}
                      GENERADO POR EL SISTEMA LEYMA C.A.
                    </Text>
                  </View>
                </View>
              );
            }
            return <View />;
          }}
        />
      </Page>
    </Document>
  );
};

export default ReporteDocumentServer;
