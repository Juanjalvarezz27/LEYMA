"use client";

import { useState, useEffect } from "react";
import { X, Printer, Download, MessageCircle } from "lucide-react";
import { toast } from "react-toastify";
import { Document, Page, Text, View, StyleSheet, Image, PDFViewer, pdf, Font } from '@react-pdf/renderer';
import QRCodeNode from "qrcode";

interface ModalPreviewPDFProps {
  orden: any;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// 1. REGISTRO DE FUENTES
// ---------------------------------------------------------------------------
Font.register({
  family: 'Montserrat',
  src: 'https://cdn.jsdelivr.net/fontsource/fonts/montserrat@latest/latin-900-normal.ttf' 
});

Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-400-normal.ttf', fontWeight: 400 },
    { src: 'https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-700-normal.ttf', fontWeight: 700 }
  ]
});

// ---------------------------------------------------------------------------
// 2. ESTILOS NATIVOS DE REACT-PDF (COMPRIMIDOS PARA AHORRAR ESPACIO)
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  page: {
    paddingTop: 25, // Reducido de 40
    paddingBottom: 90, // Reducido para dar justo el espacio del footer
    paddingHorizontal: 30, // Reducido de 40
    fontFamily: 'Inter',
    fontSize: 9, // Reducido de 10
    color: '#000'
  },
  topContact: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 4,
    marginBottom: 6, // Reducido de 10
  },
  topContactText: { fontSize: 6.5, color: '#64748B', fontWeight: 700 },
  topContactRight: { flexDirection: 'row', gap: 10 },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1.5,
    borderBottomColor: '#000',
    paddingBottom: 8, // Reducido de 12
    marginBottom: 10 // Reducido de 15
  },
  logoRow: { flexDirection: 'row', alignItems: 'center' },
  logoImage: { width: 50, height: 50, objectFit: 'contain', marginRight: 12 }, // Reducido de 65
  
  logoTitle: { fontSize: 22, fontFamily: 'Montserrat', marginBottom: 1 }, // Reducido de 26
  logoSubtitle: { fontSize: 7.5, fontWeight: 700, letterSpacing: 0.5 }, 
  
  headerData: { textAlign: 'right', fontSize: 9 },
  headerDataRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 2 },
  headerDataLabel: { fontWeight: 700, marginRight: 4 },

  patientBox: {
    flexDirection: 'row',
    borderBottomWidth: 1.5,
    borderBottomColor: '#000',
    paddingBottom: 8, // Reducido de 12
    marginBottom: 10 // Reducido de 15
  },
  patientColLeft: { width: '55%', paddingRight: 10 },
  patientColRight: { width: '45%', borderLeftWidth: 1, borderLeftColor: '#E2E8F0', paddingLeft: 15 },
  patientRow: { flexDirection: 'row', marginBottom: 3 }, // Reducido de 5
  patientLabel: { width: 80, fontWeight: 700, fontSize: 9.5 }, // Reducido de 11
  patientValue: { flex: 1, fontSize: 9.5, textTransform: 'uppercase' },

  catTitle: {
    fontSize: 12, // Reducido de 14
    fontWeight: 700,
    borderBottomWidth: 1.5,
    borderBottomColor: '#000',
    paddingBottom: 2,
    marginBottom: 6, // Reducido de 10
    marginTop: 6, // Reducido de 10
    textTransform: 'uppercase'
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    paddingBottom: 3,
    marginBottom: 4 // Reducido de 6
  },
  colDesc: { width: '45%', fontWeight: 700, fontSize: 8 },
  colRes: { width: '15%', fontWeight: 700, fontSize: 8, textAlign: 'center' },
  colUni: { width: '15%', fontWeight: 700, fontSize: 8, textAlign: 'center' },
  colRef: { width: '25%', fontWeight: 700, fontSize: 8, textAlign: 'right' },
  
  subcatTitle: { fontSize: 8, fontWeight: 700, paddingVertical: 2, paddingLeft: 5 },
  
  row: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 2, paddingVertical: 1 }, // Más compacto
  rowDesc: { width: '45%', fontSize: 8, fontWeight: 700 },
  rowDescSub: { width: '45%', fontSize: 8, fontWeight: 700, paddingLeft: 15 },
  multiRowDesc: { width: '45%', fontSize: 7.5, fontWeight: 400, paddingLeft: 25, color: '#334155' },
  rowRes: { width: '15%', fontSize: 9.5, fontWeight: 700, textAlign: 'center' }, // Resaltado pero un poco menor
  rowUni: { width: '15%', fontSize: 8, textAlign: 'center' },
  rowRef: { width: '25%', fontSize: 8, textAlign: 'right' },
  
  obsContainer: { marginLeft: 15, marginBottom: 3, marginTop: 1, flexDirection: 'row' },
  obsLabel: { fontSize: 7.5, fontWeight: 700, color: '#475569' },
  obsText: { fontSize: 7.5, fontWeight: 400, color: '#475569' },

  // Footer en dos columnas (Más compacto y apegado al fondo)
  footer: {
    position: 'absolute',
    bottom: 20, // Pegado más al borde
    left: 30, // Ajustado a los nuevos márgenes
    right: 30,
    flexDirection: 'column',
    alignItems: 'center'
  },
  footerColumns: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    width: '100%',
    marginBottom: 8 // Reducido de 15
  },
  footerLeft: {
    width: '50%',
    alignItems: 'center'
  },
  footerRight: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderLeftWidth: 1,
    borderLeftColor: '#E2E8F0',
    paddingLeft: 10
  },
  signatureLine: {
    width: 180,
    borderTopWidth: 1.5,
    borderTopColor: '#000',
    paddingTop: 4,
    alignItems: 'center'
  },
  bioanalista: { fontSize: 9.5, fontWeight: 700, letterSpacing: 1 },
  labNameFooter: { fontSize: 8, marginTop: 1 },
  
  qrImage: {
    width: 45, // QR más pequeño
    height: 45
  },
  qrLabelBox: {
    flexDirection: 'column',
    justifyContent: 'center'
  },
  qrTitle: { fontSize: 7.5, fontWeight: 700, color: '#1D1D1F' },
  qrSubtitle: { fontSize: 6, color: '#64748B', marginTop: 1, maxWidth: 130 },

  legalBox: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    width: '100%',
    paddingTop: 4,
    alignItems: 'center'
  },
  legalText: { fontSize: 6.5, fontWeight: 700, color: '#64748B', textAlign: 'center' }
});

// ---------------------------------------------------------------------------
// 3. COMPONENTE DEL DOCUMENTO PDF
// ---------------------------------------------------------------------------
const ReporteDocument = ({ orden, fechaImpresa, qrCodeUrl }: { orden: any, fechaImpresa: string, qrCodeUrl: string }) => {
  const formatFechaHora = (dateString: string) => {
    const d = new Date(dateString);
    const dateStr = d.toLocaleDateString('es-VE', { year: 'numeric', month: '2-digit', day: '2-digit' });
    const timeStr = d.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${dateStr} ${timeStr}`;
  };

  const calcularEdad = (fechaNac: string, esBebe: boolean) => {
    if (!fechaNac) return "N/A";
    const hoy = new Date();
    const nacimiento = new Date(fechaNac);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const m = hoy.getMonth() - nacimiento.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
    return `${edad} ${esBebe ? 'Meses' : 'Años'}`;
  };

  const groupedDetalles = orden.detalles.reduce((acc: any, det: any) => {
    const catNombre = det.prueba?.subcategoria?.categoria?.nombre || "OTROS";
    const subcatNombre = det.prueba?.subcategoria?.nombre || "PRUEBAS INDIVIDUALES";
    if (!acc[catNombre]) acc[catNombre] = {};
    if (!acc[catNombre][subcatNombre]) acc[catNombre][subcatNombre] = [];
    acc[catNombre][subcatNombre].push(det);
    return acc;
  }, {});

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        
        {/* INFO CONTACTO SUPERIOR */}
        <View style={styles.topContact}>
          <Text style={styles.topContactText}>DIRECCIÓN: AV. BOLÍVAR, SECTOR CARMONA, EDIF. LEYMA.</Text>
          <View style={styles.topContactRight}>
            <Text style={styles.topContactText}>TELÉFONO: 0412-9164371</Text>
            <Text style={styles.topContactText}>CORREO: CONTACTO@LEYMA.COM</Text>
            <Text style={styles.topContactText}>RIF: J-00000000-0</Text>
          </View>
        </View>

        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <Image src="/Logo2.png" style={styles.logoImage} />
            <View>
              <Text style={styles.logoTitle}>LEYMA S.A.</Text>
              <Text style={styles.logoSubtitle}>LABORATORIO CLÍNICO BACTERIOLÓGICO</Text>
            </View>
          </View>
          <View style={styles.headerData}>
            <View style={styles.headerDataRow}>
              <Text style={styles.headerDataLabel}>Orden N°:</Text>
              <Text>#{orden.id.toString().padStart(6, '0')}</Text>
            </View>
            <View style={styles.headerDataRow}>
              <Text style={styles.headerDataLabel}>Ingreso:</Text>
              <Text>{formatFechaHora(orden.fechaCreacion)}</Text>
            </View>
            <View style={styles.headerDataRow}>
              <Text style={styles.headerDataLabel}>Impreso:</Text>
              <Text>{fechaImpresa}</Text>
            </View>
          </View>
        </View>

        {/* FICHA DEL PACIENTE */}
        <View style={styles.patientBox}>
          <View style={styles.patientColLeft}>
            <View style={styles.patientRow}>
              <Text style={styles.patientLabel}>Paciente:</Text>
              <Text style={styles.patientValue}>{orden.paciente.nombreCompleto}</Text>
            </View>
            <View style={styles.patientRow}>
              <Text style={styles.patientLabel}>Edad:</Text>
              <Text style={styles.patientValue}>{calcularEdad(orden.paciente.fechaNacimiento, orden.paciente.esBebe)}</Text>
            </View>
            <View style={styles.patientRow}>
              <Text style={styles.patientLabel}>Dirección:</Text>
              <Text style={styles.patientValue}>{orden.paciente.direccion || 'No registrada'}</Text>
            </View>
            <View style={styles.patientRow}>
              <Text style={styles.patientLabel}>Observaciones:</Text>
              <Text style={styles.patientValue}>{orden.paciente.observaciones || '---'}</Text>
            </View>
          </View>
          
          <View style={styles.patientColRight}>
            <View style={styles.patientRow}>
              <Text style={styles.patientLabel}>C.I:</Text>
              <Text style={styles.patientValue}>{orden.paciente.cedula || 'S/N'}</Text>
            </View>
            <View style={styles.patientRow}>
              <Text style={styles.patientLabel}>Sexo:</Text>
              <Text style={styles.patientValue}>{orden.paciente.sexo === 'M' ? 'Masculino' : 'Femenino'}</Text>
            </View>
            <View style={styles.patientRow}>
              <Text style={styles.patientLabel}>Teléfono:</Text>
              <Text style={styles.patientValue}>{orden.paciente.telefono || 'No registrado'}</Text>
            </View>
            <View style={styles.patientRow}>
              <Text style={styles.patientLabel}>Ubicación:</Text>
              <Text style={styles.patientValue}>MATRIZ</Text>
            </View>
          </View>
        </View>

        {/* CUERPO DEL REPORTE */}
        {Object.entries(groupedDetalles).map(([catNombre, subcategorias]) => (
          <View key={catNombre} wrap={false}>
            <Text style={styles.catTitle}>{catNombre}</Text>

            {Object.entries(subcategorias as any).map(([subCatNombre, detalles]: [string, any]) => (
              <View key={subCatNombre} style={{ marginBottom: 10 }}>
                
                <View style={styles.tableHeader}>
                  <Text style={styles.colDesc}>DESCRIPCIÓN DEL EXAMEN</Text>
                  <Text style={styles.colRes}>RESULTADO</Text>
                  <Text style={styles.colUni}>UNIDADES</Text>
                  <Text style={styles.colRef}>VALORES DE REFERENCIA</Text>
                </View>

                {detalles[0]?.prueba?.subcategoria?.esPaquete && (
                  <Text style={styles.subcatTitle}>{subCatNombre}</Text>
                )}

                {detalles.map((det: any) => {
                  const isPaquete = detalles[0]?.prueba?.subcategoria?.esPaquete;
                  const listaValores = det.resultado?.valores || [];
                  
                  return (
                    <View key={det.id} wrap={false}>
                      {det.cantidad > 1 ? (
                        <View>
                          <View style={styles.row}>
                            <Text style={isPaquete ? styles.rowDescSub : styles.rowDesc}>{det.prueba.nombre}</Text>
                            <Text style={styles.rowRes}></Text>
                            <Text style={styles.rowUni}>{det.prueba.unidades || ''}</Text>
                            <Text style={styles.rowRef}>{det.prueba.valoresReferencia || ''}</Text>
                          </View>
                          
                          {Array(det.cantidad).fill(0).map((_, i) => {
                            const valorMuestra = listaValores[i]?.valorIngresado || "-";
                            return (
                              <View key={i} style={styles.row}>
                                <Text style={styles.multiRowDesc}>Muestra {i + 1}</Text>
                                <Text style={styles.rowRes}>{valorMuestra}</Text>
                                <Text style={styles.rowUni}></Text>
                                <Text style={styles.rowRef}></Text>
                              </View>
                            );
                          })}
                        </View>
                      ) : (
                        <View style={styles.row}>
                          <Text style={isPaquete ? styles.rowDescSub : styles.rowDesc}>{det.prueba.nombre}</Text>
                          <Text style={styles.rowRes}>{listaValores[0]?.valorIngresado || "-"}</Text>
                          <Text style={styles.rowUni}>{det.prueba.unidades || ''}</Text>
                          <Text style={styles.rowRef}>{det.prueba.valoresReferencia || ''}</Text>
                        </View>
                      )}
                      
                      {det.resultado?.observaciones && (
                        <View style={styles.obsContainer}>
                          <Text style={styles.obsLabel}>Nota ({det.prueba.nombre}): </Text>
                          <Text style={styles.obsText}>{det.resultado.observaciones}</Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        ))}

        {/* FOOTER CONDICIONAL DE LA ÚLTIMA PÁGINA */}
        <View style={styles.footer} fixed render={(props: any) => {
          const { pageNumber, totalPages } = props;
          if (pageNumber === totalPages) {
            return (
              <View style={{ width: '100%' }}>
                <View style={styles.footerColumns}>
                  
                  {/* LADO IZQUIERDO: FIRMA */}
                  <View style={styles.footerLeft}>
                    <View style={styles.signatureLine}>
                      <Text style={styles.bioanalista}>{orden.creadoPor?.nombre || 'BIOANALISTA TITULAR'}</Text>
                      <Text style={styles.labNameFooter}>Laboratorio Clínico LEYMA S.A.</Text>
                    </View>
                  </View>

                  {/* LADO DERECHO: QR EN BASE64 NATIVO */}
                  <View style={styles.footerRight}>
                    {qrCodeUrl ? (
                      <Image src={qrCodeUrl} style={styles.qrImage} />
                    ) : <View style={styles.qrImage} />}
                    <View style={styles.qrLabelBox}>
                      <Text style={styles.qrTitle}>DOCUMENTO VERIFICADO</Text>
                      <Text style={styles.qrSubtitle}>
                        Escanee este código QR para validar la autenticidad de los resultados directamente desde el servidor central de LEYMA S.A.
                      </Text>
                    </View>
                  </View>

                </View>

                <View style={styles.legalBox}>
                  <Text style={styles.legalText}>
                    ESTE REPORTE ES UN DOCUMENTO ELECTRÓNICO OFICIAL GENERADO POR EL SISTEMA LEYMA. VÁLIDO ÚNICAMENTE CON SELLO HÚMEDO ORIGINAL.
                  </Text>
                </View>
              </View>
            );
          }
          return <View />;
        }} />

      </Page>
    </Document>
  );
};

// ---------------------------------------------------------------------------
// 4. COMPONENTE PRINCIPAL (MODAL)
// ---------------------------------------------------------------------------
export default function ModalPreviewPDF({ orden, onClose }: ModalPreviewPDFProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [fechaImpresa, setFechaImpresa] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");

  useEffect(() => {
    setIsMounted(true);
    const ahora = new Date();
    setFechaImpresa(ahora.toLocaleDateString('es-VE', { year: 'numeric', month: '2-digit', day: '2-digit' }) + ' ' + ahora.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', hour12: true }));

    const generarQR = async () => {
      try {
        const urlValidacion = `${window.location.origin}/validar/${orden.id}`;
        const base64Data = await QRCodeNode.toDataURL(urlValidacion, {
          margin: 1,
          width: 200,
          color: { dark: "#000000", light: "#FFFFFF" }
        });
        setQrCodeUrl(base64Data);
      } catch (err) {
        console.error("Error generando QR", err);
      }
    };

    if (orden?.id) generarQR();
  }, [orden]);

  const handleDownloadBlob = async () => {
    const toastId = toast.loading("Generando PDF en alta calidad...");
    try {
      const blob = await pdf(<ReporteDocument orden={orden} fechaImpresa={fechaImpresa} qrCodeUrl={qrCodeUrl} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Resultados_${orden.paciente.nombreCompleto.replace(/\s+/g, '_')}_#${orden.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.update(toastId, { render: "¡PDF descargado exitosamente!", type: "success", isLoading: false, autoClose: 3000 });
    } catch (error) {
      toast.update(toastId, { render: "Error al generar el PDF", type: "error", isLoading: false, autoClose: 3000 });
    }
  };

  const handlePrintBlob = async () => {
    const toastId = toast.loading("Preparando impresión...");
    try {
      const blob = await pdf(<ReporteDocument orden={orden} fechaImpresa={fechaImpresa} qrCodeUrl={qrCodeUrl} />).toBlob();
      const url = URL.createObjectURL(blob);
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = url;
      document.body.appendChild(iframe);
      iframe.onload = () => {
        iframe.contentWindow?.print();
        toast.dismiss(toastId);
      };
    } catch (error) {
      toast.update(toastId, { render: "Error al preparar impresión", type: "error", isLoading: false, autoClose: 3000 });
    }
  };

  const enviarWhatsAppText = () => {
    if (!orden.paciente.telefono) {
      toast.warning("El paciente no tiene número de teléfono registrado.");
      return;
    }
    let cleaned = orden.paciente.telefono.replace(/\D/g, "");
    if (cleaned.startsWith("0")) cleaned = "58" + cleaned.substring(1);
    else if (!cleaned.startsWith("58")) cleaned = "58" + cleaned;
    
    let mensaje = `*Laboratorio LEYMA S.A.*\nHola ${orden.paciente.nombreCompleto},\n\n`;
    mensaje += `Tus resultados ya están listos y procesados.\n\n`;
    mensaje += `Adjuntamos a este chat tu informe oficial en formato PDF.\n\n`;
    mensaje += `¡Cualquier consulta estamos a tu orden. Feliz día!`;

    const url = `https://wa.me/${cleaned}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, "_blank"); 
  };

  if (!isMounted) return null;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center p-4 sm:p-8 bg-[#1D1D1F]/95">
      
      <div className="w-full max-w-[850px] flex justify-between items-center bg-[#2D2D2F] p-4 rounded-2xl mb-6 shrink-0 shadow-lg border border-white/10">
        <div className="flex gap-3">
          <button onClick={handlePrintBlob} className="flex items-center gap-2 bg-white text-[#1D1D1F] hover:bg-slate-200 px-4 py-2 rounded-xl text-sm font-bold transition-colors">
            <Printer size={18} /> Imprimir
          </button>
          <button onClick={handleDownloadBlob} className="flex items-center gap-2 bg-[#0071E3] text-white hover:bg-[#0077ED] px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-sm">
            <Download size={18} /> Descargar
          </button>
          <button onClick={enviarWhatsAppText} className="flex items-center gap-2 bg-emerald-500 text-white hover:bg-emerald-600 px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-sm">
            <MessageCircle size={18} /> Enviar WS
          </button>
        </div>
        <button onClick={onClose} className="p-2 bg-white/10 hover:bg-red-500 text-white rounded-full transition-colors">
          <X size={20} strokeWidth={2.5} />
        </button>
      </div>

      <div className="w-full max-w-[850px] flex-1 bg-white rounded-xl overflow-hidden shadow-2xl">
        <PDFViewer width="100%" height="100%" showToolbar={false}>
          <ReporteDocument orden={orden} fechaImpresa={fechaImpresa} qrCodeUrl={qrCodeUrl} />
        </PDFViewer>
      </div>

    </div>
  );
}