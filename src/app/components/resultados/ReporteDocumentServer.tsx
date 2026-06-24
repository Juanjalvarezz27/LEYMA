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
    paddingTop: 40,
    paddingBottom: 50,
    paddingLeft: 20,
    paddingRight: 40,
    fontFamily: "Inter",
    fontSize: 10,
    color: "#000",
  },
  topContact: {
    flexDirection: "column",
    alignItems: "center",
    gap: 3,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingBottom: 4,
    marginBottom: 6,
  },
  topContactText: { fontSize: 7, color: "#000000", fontWeight: 700 },
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
    width: "100%",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingBottom: 10,
  },

  catTitleView: {
    backgroundColor: "#BFDBFE",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1.5,
    borderBottomColor: "#000",
  },
  catTitleText: {
    fontSize: 13,
    fontWeight: 700,
    textTransform: "uppercase",
  },

  catBioanalistaText: {
    fontSize: 8.5,
    fontWeight: 700,
    color: "#000",
    letterSpacing: 0.5,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    paddingBottom: 2,
  },
  colDesc: { width: "27%", fontWeight: 700, fontSize: 8.5 },
  colRes: { width: "32%", fontWeight: 700, fontSize: 8.5, textAlign: "center" },
  colUni: { width: "15%", fontWeight: 700, fontSize: 8.5, textAlign: "center" },
  colRef: { width: "26%", fontWeight: 700, fontSize: 8.5, textAlign: "center" },

  subcatTitleView: {
    backgroundColor: "#DBEAFE",
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  subcatTitleText: {
    fontSize: 9.5,
    fontWeight: 700,
  },

  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 4,
    paddingVertical: 4,
  },
  rowDesc: { width: "27%", fontSize: 8.5, fontWeight: 700 },
  rowDescSub: { width: "27%", fontSize: 8.5, fontWeight: 700, paddingLeft: 10 },
  multiRowDesc: {
    width: "27%",
    fontSize: 8,
    fontWeight: 400,
    paddingLeft: 15,
    color: "#000000",
  },
  rowRes: { width: "32%", fontSize: 9, fontWeight: 700, textAlign: "center", lineHeight: 1.2 },
  rowUni: { width: "15%", fontSize: 8.5, textAlign: "center", lineHeight: 1.2 },
  rowRef: { width: "26%", fontSize: 8.5, textAlign: "center", lineHeight: 1.2 },

  obsContainer: {
    marginLeft: 10,
    marginBottom: 5,
    marginTop: 2,
    flexDirection: "row",
  },
  obsLabel: { fontSize: 8.5, fontWeight: 700, color: "#000000" },
  obsText: { fontSize: 8.5, fontWeight: 400, color: "#000000" },

  footerSignaturesContainer: {
    marginTop: 40,
    paddingBottom: 20,
  },
  footerSignaturesRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 40,
  },
  footerSignatureBlock: {
    alignItems: "center",
    width: 140,
  },
  footerFirmaImage: {
    width: 110,
    height: 45,
    objectFit: "contain",
    marginBottom: 4,
  },
  footerSignatureLine: {
    width: "100%",
    borderTopWidth: 1,
    borderTopColor: "#000",
    paddingTop: 6,
    alignItems: "center",
  },
  footerBioanalista: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    textAlign: "center",
  },
  footerLabName: {
    fontSize: 7,
    color: "#000000",
    marginTop: 2,
    textAlign: "center",
  },

  footerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingTop: 10,
    marginTop: 30,
    width: "100%",
  },
  qrRow: { flexDirection: "row", alignItems: "center", gap: 10, width: "50%" },
  qrImage: { width: 45, height: 45 },
  qrLabelBox: { flexDirection: "column", justifyContent: "center" },
  qrTitle: { fontSize: 8.5, fontWeight: 700, color: "#1D1D1F" },
  qrSubtitle: { fontSize: 7, color: "#000000", marginTop: 1, maxWidth: 160 },
  legalBox: { width: "50%", alignItems: "flex-end" },
  legalText: {
    fontSize: 7.5,
    fontWeight: 700,
    color: "#000000",
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
  const allSigners = new Map();
  const groupedByCategory = orden.detalles.reduce((acc: any, det: any) => {
    const catNombre = det.prueba?.categoriaVisual || det.prueba?.subcategoria?.categoria?.nombre || "OTROS";
    const subcatNombre = det.prueba?.subcategoriaVisual || det.prueba?.subcategoria?.nombre || "PRUEBAS INDIVIDUALES";

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
      allSigners.set(
        det.resultado.procesadoPor.id,
        det.resultado.procesadoPor
      );
    }

    return acc;
  }, {});

  const renderDetalleRow = (det: any, subCatNombre: string) => {
    const isPaquete = subCatNombre !== "PRUEBAS INDIVIDUALES";
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
              {listaValores.length > 0 
                ? listaValores.map((v: any) => v.valorIngresado || " ").join("\n").trim() || "-"
                : "-"}
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
  };

  return (
    <Document>
      <Page size="LETTER" style={pdfStyles.page}>

        {/* INFO CONTACTO SUPERIOR */}
        <View style={pdfStyles.topContact}>
          <Text style={pdfStyles.topContactText}>
            DIRECCIÓN: AVENIDA CORO, LOCAL 4-79, SECTOR SANTA ROSA.
          </Text>
          <View style={pdfStyles.topContactRight}>
            <Text style={pdfStyles.topContactText}>TELÉFONO: 0422 - 8164371</Text>
            <Text style={pdfStyles.topContactText}>CORREO: LABORATORIOLEYMA@GMAIL.COM</Text>
            <Text style={pdfStyles.topContactText}>RIF: J - 508463315</Text>
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
          ([catNombre, catData]: [string, any]) => {
            const bioanalistasText = catData.signers.size > 0 
              ? ` - PROCESADO POR: ${Array.from(catData.signers.values()).map((b: any) => b.nombre).join(" / ")}` 
              : "";

            return (
              <View key={catNombre} style={pdfStyles.categoryBlock}>
                <View style={{ width: "100%" }}>
                  {/* HACK: Forzar salto de página si queda poco espacio (aprox 180 puntos) */}
                  <Text style={{ fontSize: 1, color: "white" }} minPresenceAhead={180}> </Text>
                  
                  <View style={pdfStyles.catTitleView}>
                    <Text style={pdfStyles.catTitleText}>
                      {catNombre}
                      {bioanalistasText && (
                        <Text style={pdfStyles.catBioanalistaText}>{bioanalistasText}</Text>
                      )}
                    </Text>
                  </View>

                  {Object.entries(catData.subcategorias).map(
                    ([subCatNombre, detalles]: [string, any], index: number) => (
                      <View key={subCatNombre} style={{ marginBottom: 10 }}>
                        {index === 0 && subCatNombre === "PRUEBAS INDIVIDUALES" && (
                          <View style={{ height: 8 }} />
                        )}

                        {/* HACK: Forzar salto de página si no caben las subcategorías */}
                        <Text style={{ fontSize: 1, color: "white", lineHeight: 0 }} minPresenceAhead={80}>{" "}</Text>

                        {subCatNombre !== "PRUEBAS INDIVIDUALES" && (
                          <View>
                            <View style={pdfStyles.subcatTitleView}>
                              <Text style={pdfStyles.subcatTitleText}>{subCatNombre}</Text>
                            </View>
                            <View style={{ height: 4 }} />
                          </View>
                        )}

                        <View style={pdfStyles.tableHeader}>
                          <Text style={pdfStyles.colDesc}>PARAMETRO</Text>
                          <Text style={pdfStyles.colRes}>RESULTADO</Text>
                          <Text style={pdfStyles.colUni}>UNIDADES</Text>
                          <Text style={pdfStyles.colRef}>VALORES DE REFERENCIA</Text>
                        </View>

                        <View style={{ height: 3 }} />
                        
                        {detalles.map((det: any) => renderDetalleRow(det, subCatNombre))}
                      </View>
                    )
                  )}
                </View>
              </View>
            );
          }
        )}

        {/* FIRMAS Y FOOTER FINAL (SIEMPRE JUNTOS) */}
        <View wrap={false}>
          {/* FIRMAS AL FINAL DEL DOCUMENTO */}
          <View style={pdfStyles.footerSignaturesContainer}>
            <View style={pdfStyles.footerSignaturesRow}>
              {allSigners.size > 0 ? (
                Array.from(allSigners.values()).map((bio: any) => (
                  <View key={bio.id} style={pdfStyles.footerSignatureBlock}>
                    {bio.firmaUrl ? (
                      <Image src={bio.firmaUrl} style={pdfStyles.footerFirmaImage} />
                    ) : (
                      <View style={{ height: 49 }} />
                    )}
                    <View style={pdfStyles.footerSignatureLine}>
                      <Text style={pdfStyles.footerBioanalista}>{bio.nombre}</Text>
                      <Text style={pdfStyles.footerLabName}>
                        BIOANALISTA LEYMA C.A.
                      </Text>
                      {(bio.mpps || bio.col) && (
                        <Text style={pdfStyles.footerLabName}>
                          {bio.mpps ? `MPPS: ${bio.mpps}` : ""} {bio.mpps && bio.col ? " - " : ""} {bio.col ? `Col: ${bio.col}` : ""}
                        </Text>
                      )}
                    </View>
                  </View>
                ))
              ) : (
                <View style={pdfStyles.footerSignatureBlock}>
                  <View style={{ height: 49 }} />
                  <View style={pdfStyles.footerSignatureLine}>
                    <Text style={pdfStyles.footerBioanalista}>BIOANALISTA</Text>
                    <Text style={pdfStyles.footerLabName}>LEYMA C.A.</Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* FOOTER */}
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
        </View>
      </Page>
    </Document>
  );
};

export default ReporteDocumentServer;
