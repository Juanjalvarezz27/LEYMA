"use client";

import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import QRCodeNode from "qrcode";
import ReporteDocument from "../../components/resultados/ReporteDocument";

interface DescargarPDFButtonProps {
  ordenId: number;
  nombrePaciente: string;
}

export default function DescargarPDFButton({ ordenId, nombrePaciente }: DescargarPDFButtonProps) {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const descargarPDF = async () => {
    setCargando(true);
    setError("");

    try {
      // 1. Obtener los datos completos de la orden desde la API
      const res = await fetch(`/api/resultados/pdf-data/${ordenId}`);
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "No se pudo obtener los datos");
      }

      const orden = await res.json();

      // 2. Generar la fecha de impresión
      const ahora = new Date();
      const fechaImpresa = ahora.toLocaleDateString('es-VE', { 
        year: 'numeric', month: '2-digit', day: '2-digit' 
      }) + ' ' + ahora.toLocaleTimeString('es-VE', { 
        hour: '2-digit', minute: '2-digit', hour12: true 
      });

      // 3. Generar el QR de validación
      const urlValidacion = `${window.location.origin}/validar/${ordenId}`;
      const qrCodeUrl = await QRCodeNode.toDataURL(urlValidacion, {
        margin: 1,
        width: 200,
        color: { dark: "#000000", light: "#FFFFFF" }
      });

      // 4. Generar el blob del PDF y descargarlo
      const blob = await pdf(
        <ReporteDocument orden={orden} fechaImpresa={fechaImpresa} qrCodeUrl={qrCodeUrl} />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Resultados_${nombrePaciente.replace(/\s+/g, '_')}_#${ordenId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (err: any) {
      console.error("Error al descargar PDF:", err);
      setError(err.message || "Ocurrió un error al generar el PDF");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={descargarPDF}
        disabled={cargando}
        className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-[#1D1D1F] text-white text-base font-black uppercase tracking-wider rounded-xl hover:bg-black transition-all duration-300 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {cargando ? (
          <>
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Generando PDF...
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Descargar Resultados en PDF
          </>
        )}
      </button>

      {error && (
        <p className="text-sm font-medium text-red-600 text-center">{error}</p>
      )}
    </div>
  );
}
