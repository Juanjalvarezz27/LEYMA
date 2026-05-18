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
// 2. ESTILOS NATIVOS DE REACT-PDF
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  page: {
    paddingTop: 25,
    paddingBottom: 70, 
    paddingHorizontal: 30,
    fontFamily: 'Inter',
    fontSize: 10, 
    color: '#000'
  },
  topContact: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 4,
    marginBottom: 6,
  },
  topContactText: { fontSize: 7, color: '#64748B', fontWeight: 700 }, 
  topContactRight: { flexDirection: 'row', gap: 10 },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1.5,
    borderBottomColor: '#000',
    paddingBottom: 8,
    marginBottom: 10
  },
  logoRow: { flexDirection: 'row', alignItems: 'center' },
  logoImage: { width: 50, height: 50, objectFit: 'contain', marginRight: 12 },
  
  logoTitle: { fontSize: 24, fontFamily: 'Montserrat', marginBottom: 1 }, 
  logoSubtitle: { fontSize: 8, fontWeight: 700, letterSpacing: 0.5 }, 
  
  headerData: { textAlign: 'right', fontSize: 10 }, 
  headerDataRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 2 },
  headerDataLabel: { fontWeight: 700, marginRight: 4 },

  patientBox: {
    flexDirection: 'row',
    borderBottomWidth: 1.5,
    borderBottomColor: '#000',
    paddingBottom: 8,
    marginBottom: 10
  },
  patientColLeft: { width: '55%', paddingRight: 10 },
  patientColRight: { width: '45%', borderLeftWidth: 1, borderLeftColor: '#E2E8F0', paddingLeft: 15 },
  patientRow: { flexDirection: 'row', marginBottom: 3 },
  patientLabel: { width: 85, fontWeight: 700, fontSize: 10.5 }, 
  patientValue: { flex: 1, fontSize: 10.5, textTransform: 'uppercase' }, 

  // --- ESTRUCTURA DE BLOQUE POR CATEGORÍA ---
  categoryBlock: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 20, 
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 10
  },
  tableSide: {
    width: '74%', 
    paddingRight: 15 
  },
  signatureSide: {
    width: '26%', 
    justifyContent: 'center', 
    alignItems: 'center',
    borderLeftWidth: 1,
    borderLeftColor: '#CBD5E1', 
    paddingLeft: 15, 
    paddingBottom: 5
  },

  catTitle: {
    fontSize: 13, 
    fontWeight: 700,
    borderBottomWidth: 1.5,
    borderBottomColor: '#000',
    paddingBottom: 4,
    marginBottom: 8,
    textTransform: 'uppercase'
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    paddingBottom: 4,
    marginBottom: 6
  },
  
  colDesc: { width: '38%', fontWeight: 700, fontSize: 8.5 }, 
  colRes: { width: '17%', fontWeight: 700, fontSize: 8.5, textAlign: 'center' }, 
  colUni: { width: '15%', fontWeight: 700, fontSize: 8.5, textAlign: 'center' }, 
  colRef: { width: '30%', fontWeight: 700, fontSize: 8.5, textAlign: 'right' }, 
  
  subcatTitle: { fontSize: 9.5, fontWeight: 700, paddingVertical: 3, paddingLeft: 5 }, 
  
  row: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4, paddingVertical: 3 },
  rowDesc: { width: '38%', fontSize: 8.5, fontWeight: 700 }, 
  rowDescSub: { width: '38%', fontSize: 8.5, fontWeight: 700, paddingLeft: 10 }, 
  multiRowDesc: { width: '38%', fontSize: 8, fontWeight: 400, paddingLeft: 15, color: '#334155' }, 
  rowRes: { width: '17%', fontSize: 10.5, fontWeight: 700, textAlign: 'center' }, 
  rowUni: { width: '15%', fontSize: 8.5, textAlign: 'center' }, 
  rowRef: { width: '30%', fontSize: 8.5, textAlign: 'right' }, 
  
  obsContainer: { marginLeft: 10, marginBottom: 5, marginTop: 2, flexDirection: 'row' },
  obsLabel: { fontSize: 8.5, fontWeight: 700, color: '#475569' }, 
  obsText: { fontSize: 8.5, fontWeight: 400, color: '#475569' }, 

  // ESTILOS DE FIRMAS LATERALES
  inlineSignatureBlock: {
    alignItems: 'center',
    width: '100%',
    marginBottom: 5
  },
  inlineFirmaImage: {
    width: 85,
    height: 40,
    objectFit: 'contain',
    marginBottom: 2, 
  },
  inlineSignatureLine: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#000',
    paddingTop: 6, 
    alignItems: 'center'
  },
  inlineBioanalista: { fontSize: 8.5, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', textAlign: 'center' }, 
  inlineLabName: { fontSize: 7, color: '#64748B', marginTop: 1.5, textAlign: 'center' }, 

  // FOOTER GENERAL (Uno al lado del otro)
  footer: {
    position: 'absolute',
    bottom: 25, 
    left: 30, 
    right: 30,
  },
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 10,
    width: '100%'
  },
  qrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '50%'
  },
  qrImage: { width: 45, height: 45 },
  qrLabelBox: { flexDirection: 'column', justifyContent: 'center' },
  qrTitle: { fontSize: 8.5, fontWeight: 700, color: '#1D1D1F' }, 
  qrSubtitle: { fontSize: 7, color: '#64748B', marginTop: 1, maxWidth: 160 }, 

  legalBox: {
    width: '50%',
    alignItems: 'flex-end',
  },
  legalText: { fontSize: 7.5, fontWeight: 700, color: '#64748B', textAlign: 'right', textTransform: 'uppercase' } 
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

  const groupedByCategory = orden.detalles.reduce((acc: any, det: any) => {
    const catNombre = det.prueba?.subcategoria?.categoria?.nombre || "OTROS";
    const subcatNombre = det.prueba?.subcategoria?.nombre || "PRUEBAS INDIVIDUALES";
    
    if (!acc[catNombre]) {
      acc[catNombre] = {
        subcategorias: {},
        signers: new Map() 
      };
    }
    
    if (!acc[catNombre].subcategorias[subcatNombre]) {
      acc[catNombre].subcategorias[subcatNombre] = [];
    }
    
    acc[catNombre].subcategorias[subcatNombre].push(det);

    if (det.resultado?.firmado && det.resultado?.procesadoPor) {
      acc[catNombre].signers.set(det.resultado.procesadoPor.id, det.resultado.procesadoPor);
    }

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
              <Text style={styles.logoTitle}>LEYMA C.A.</Text>
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

        {/* CUERPO DEL REPORTE - DISEÑO DE COLUMNAS (TABLA IZQ / FIRMA DER) */}
        {Object.entries(groupedByCategory).map(([catNombre, catData]: [string, any]) => (
          <View key={catNombre} style={styles.categoryBlock} wrap={false}>
            
            {/* LADO IZQUIERDO: LA TABLA */}
            <View style={styles.tableSide}>
              <Text style={styles.catTitle}>{catNombre}</Text>

              {Object.entries(catData.subcategorias).map(([subCatNombre, detalles]: [string, any]) => (
                <View key={subCatNombre} style={{ marginBottom: 10 }}>
                  
                  <View style={styles.tableHeader}>
                    <Text style={styles.colDesc}>PARAMETRO</Text>
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

            {/* LADO DERECHO: LA FIRMA */}
            <View style={styles.signatureSide}>
              {catData.signers.size > 0 ? (
                Array.from(catData.signers.values()).map((bio: any) => (
                  <View key={bio.id} style={styles.inlineSignatureBlock}>
                    {bio.firmaUrl ? (
                      <Image src={bio.firmaUrl} style={styles.inlineFirmaImage} />
                    ) : (
                      <View style={{ height: 35 }} /> 
                    )}
                    <View style={styles.inlineSignatureLine}>
                      <Text style={styles.inlineBioanalista}>{bio.nombre}</Text>
                      <Text style={styles.inlineLabName}>Bioanalista LEYMA C.A.</Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.inlineSignatureBlock}>
                  <View style={{ height: 35 }} /> 
                  <View style={styles.inlineSignatureLine}>
                    <Text style={styles.inlineBioanalista}>BIOANALISTA</Text>
                    <Text style={styles.inlineLabName}>LEYMA C.A.</Text>
                  </View>
                </View>
              )}
            </View>

          </View>
        ))}

        {/* FOOTER GENERAL DE LA ÚLTIMA PÁGINA (QR a la izq y Legal a la der) */}
        <View style={styles.footer} fixed render={(props: any) => {
          const { pageNumber, totalPages } = props;
          if (pageNumber === totalPages) {
            return (
              <View style={styles.footerContent}>
                
                <View style={styles.qrRow}>
                  {qrCodeUrl ? (
                    <Image src={qrCodeUrl} style={styles.qrImage} />
                  ) : <View style={styles.qrImage} />}
                  <View style={styles.qrLabelBox}>
                    <Text style={styles.qrTitle}>DOC. VERIFICADO</Text>
                    <Text style={styles.qrSubtitle}>
                      Escanee este código para validar la autenticidad en el servidor de LEYMA C.A.
                    </Text>
                  </View>
                </View>

                <View style={styles.legalBox}>
                  <Text style={styles.legalText}>
                    ESTE REPORTE ES UN DOCUMENTO ELECTRÓNICO OFICIAL{"\n"}GENERADO POR EL SISTEMA LEYMA C.A.
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
// 4. COMPONENTE PRINCIPAL (MODAL VISOR)
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
    
    let mensaje = `*Laboratorio LEYMA C.A.*\nHola ${orden.paciente.nombreCompleto},\n\n`;
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