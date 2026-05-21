"use client";

import { useState } from "react";

interface DescargarPDFButtonProps {
  ordenId: number;
  nombrePaciente: string;
}

export default function DescargarPDFButton({ ordenId }: DescargarPDFButtonProps) {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const verPDF = async () => {
    setCargando(true);
    setError("");

    try {
      // Verificar que los resultados existen antes de abrir
      const check = await fetch(`/api/resultados/pdf-data/${ordenId}`);
      if (!check.ok) {
        const data = await check.json();
        throw new Error(data.error || "No se pudo obtener los resultados");
      }

      // Abrir el PDF directamente en el navegador.
      // El browser lo muestra en su visor nativo (funciona en iOS, Android, Chrome, Safari).
      window.open(`/api/resultados/pdf/${ordenId}`, "_blank");
    } catch (err: any) {
      setError(err.message || "Ocurrió un error al abrir el PDF");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3 mt-4">
      <button
        onClick={verPDF}
        disabled={cargando}
        className="w-full flex items-center justify-center gap-3 px-6 py-4 
          text-[14px] sm:text-[15px] font-black uppercase tracking-wider 
          rounded-2xl transition-all duration-300 bg-primario text-white
          hover:bg-[#005bb5] hover:shadow-apple-hover hover:-translate-y-0.5 
          active:translate-y-0 active:shadow-apple
          disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
      >
        {cargando ? (
          <>
            <svg className="animate-spin h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span>Cargando PDF...</span>
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            <span>Ver Resultados en PDF</span>
          </>
        )}
      </button>

      {error && (
        <div className="w-full bg-red-50 border border-red-200/60 rounded-xl p-3 text-center">
          <p className="text-sm font-medium text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}
