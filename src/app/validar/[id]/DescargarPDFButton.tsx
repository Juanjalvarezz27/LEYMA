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
  const [descargado, setDescargado] = useState(false);

  const descargarPDF = async () => {
    setCargando(true);
    setError("");
    setDescargado(false);

    try {
      const res = await fetch(`/api/resultados/pdf-data/${ordenId}`);
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "No se pudo obtener los datos");
      }

      const orden = await res.json();

      const ahora = new Date();
      const fechaImpresa = ahora.toLocaleDateString('es-VE', { 
        year: 'numeric', month: '2-digit', day: '2-digit' 
      }) + ' ' + ahora.toLocaleTimeString('es-VE', { 
        hour: '2-digit', minute: '2-digit', hour12: true 
      });

      const urlValidacion = `${window.location.origin}/validar/${ordenId}`;
      const qrCodeUrl = await QRCodeNode.toDataURL(urlValidacion, {
        margin: 1,
        width: 200,
        color: { dark: "#000000", light: "#FFFFFF" }
      });

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
      setDescargado(true);

    } catch (err: any) {
      console.error("Error al descargar PDF:", err);
      setError(err.message || "Ocurrió un error al generar el PDF");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3 mt-4">
      <button
        onClick={descargarPDF}
        disabled={cargando}
        className={`
          w-full flex items-center justify-center gap-3 px-6 py-4 
          text-[14px] sm:text-[15px] font-black uppercase tracking-wider 
          rounded-2xl transition-all duration-300 
          disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
          ${descargado 
            ? 'bg-primario text-white shadow-[0_4px_20px_rgba(0,113,227,0.3)]' 
            : 'bg-primario text-white hover:bg-[#005bb5] hover:shadow-apple-hover hover:-translate-y-0.5 active:translate-y-0 active:shadow-apple'
          }
        `}
      >
        {cargando ? (
          <>
            <svg className="animate-spin h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span>Generando PDF...</span>
          </>
        ) : descargado ? (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>¡Descargado Exitosamente!</span>
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>Descargar Resultados en PDF</span>
          </>
        )}
      </button>

      {descargado && (
        <button
          onClick={() => { setDescargado(false); descargarPDF(); }}
          className="text-xs font-bold text-primario hover:text-[#005bb5] transition-colors underline underline-offset-2"
        >
          Descargar de nuevo
        </button>
      )}

      {error && (
        <div className="w-full bg-red-50 border border-red-200/60 rounded-xl p-3 text-center">
          <p className="text-sm font-medium text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}

