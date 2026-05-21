"use client";

import { useState } from "react";

interface DescargarPDFButtonProps {
  ordenId: number;
  nombrePaciente: string;
}

export default function DescargarPDFButton({
  ordenId,
  nombrePaciente,
}: DescargarPDFButtonProps) {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [descargado, setDescargado] = useState(false);

  const descargarPDF = async () => {
    setCargando(true);
    setError("");
    setDescargado(false);

    try {
      // Verificar que el PDF se puede generar antes de abrir la URL
      const check = await fetch(`/api/resultados/pdf-data/${ordenId}`);
      if (!check.ok) {
        const data = await check.json();
        throw new Error(data.error || "No se pudo obtener los resultados");
      }

      // La URL del servidor genera y sirve el PDF directamente.
      // El navegador (móvil o escritorio) lo descarga de forma nativa.
      const pdfUrl = `/api/resultados/pdf/${ordenId}`;

      // window.open funciona en todos los navegadores móviles:
      // - Android Chrome: inicia descarga directamente
      // - iOS Safari: abre el visor de PDF nativo con opción de guardar
      window.open(pdfUrl, "_blank");

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
          ${
            descargado
              ? "bg-primario text-white shadow-[0_4px_20px_rgba(0,113,227,0.3)]"
              : "bg-primario text-white hover:bg-[#005bb5] hover:shadow-apple-hover hover:-translate-y-0.5 active:translate-y-0 active:shadow-apple"
          }
        `}
      >
        {cargando ? (
          <>
            <svg
              className="animate-spin h-5 w-5 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <span>Generando PDF...</span>
          </>
        ) : descargado ? (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>¡PDF Listo!</span>
          </>
        ) : (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0"
            >
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
          onClick={() => {
            setDescargado(false);
            descargarPDF();
          }}
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
