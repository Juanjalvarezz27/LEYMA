"use client";

import { useState } from "react";

interface DescargarPDFButtonProps {
  ordenId: number;
  nombrePaciente: string;
}

export default function DescargarPDFButton({ ordenId, nombrePaciente }: DescargarPDFButtonProps) {
  const [cargando, setCargando] = useState(false);
  const [compartiendo, setCompartiendo] = useState(false);
  const [error, setError] = useState("");

  const pdfUrl = `/api/resultados/pdf/${ordenId}`;
  const nombreArchivo = `Resultados_${nombrePaciente.replace(/\s+/g, "_")}_#${ordenId}.pdf`;

  // Abre el PDF en el visor nativo del navegador
  const verPDF = async () => {
    setCargando(true);
    setError("");
    try {
      const check = await fetch(`/api/resultados/pdf-data/${ordenId}`);
      if (!check.ok) {
        const data = await check.json();
        throw new Error(data.error || "No se pudo obtener los resultados");
      }
      window.open(pdfUrl, "_blank");
    } catch (err: any) {
      setError(err.message || "Ocurrió un error al abrir el PDF");
    } finally {
      setCargando(false);
    }
  };

  // Menú nativo de compartir del teléfono (WhatsApp, correo, AirDrop, etc.)
  // En desktop sin soporte: copia el enlace al portapapeles
  const compartir = async () => {
    setCompartiendo(true);
    setError("");
    try {
      const urlCompleta = `${window.location.origin}${pdfUrl}`;

      // Intentar compartir el archivo PDF directamente
      if (navigator.share && navigator.canShare) {
        try {
          const response = await fetch(pdfUrl);
          const blob = await response.blob();
          const file = new File([blob], nombreArchivo, { type: "application/pdf" });

          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: `Resultados - ${nombrePaciente}`,
              text: "Resultados del Laboratorio LEYMA C.A.",
              files: [file],
            });
            return;
          }
        } catch {
          // Si falla compartir el archivo, caer al compartir por enlace
        }
      }

      // Fallback 1: compartir solo el enlace (funciona en más dispositivos)
      if (navigator.share) {
        await navigator.share({
          title: `Resultados - ${nombrePaciente}`,
          text: "Laboratorio LEYMA C.A. — Mis resultados están disponibles.",
          url: `${window.location.origin}/validar/${ordenId}`,
        });
        return;
      }

      // Fallback 2 (desktop): copiar enlace al portapapeles
      await navigator.clipboard.writeText(urlCompleta);
      setError("✅ Enlace copiado al portapapeles");
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        setError(err.message || "No se pudo compartir");
      }
    } finally {
      setCompartiendo(false);
    }
  };

  const iconoDoc = (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
      strokeLinejoin="round" className="shrink-0">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );

  const iconoCompartir = (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
      strokeLinejoin="round" className="shrink-0">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );

  const iconoSpin = (
    <svg className="animate-spin h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );

  return (
    <div className="flex flex-col items-center gap-3 mt-4">

      {/* BOTÓN PRINCIPAL: Ver PDF */}
      <button
        onClick={verPDF}
        disabled={cargando || compartiendo}
        className="w-full flex items-center justify-center gap-3 px-6 py-4 
          text-[14px] sm:text-[15px] font-black uppercase tracking-wider 
          rounded-2xl transition-all duration-300 bg-primario text-white
          hover:bg-[#005bb5] hover:shadow-apple-hover hover:-translate-y-0.5 
          active:translate-y-0 active:shadow-apple
          disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
      >
        {cargando ? <>{iconoSpin}<span>Cargando PDF...</span></> : <>{iconoDoc}<span>Ver Resultados en PDF</span></>}
      </button>

      {/* BOTÓN SECUNDARIO: Compartir */}
      <button
        onClick={compartir}
        disabled={cargando || compartiendo}
        className="w-full flex items-center justify-center gap-3 px-6 py-3.5
          text-[13px] sm:text-[14px] font-black uppercase tracking-wider
          rounded-2xl transition-all duration-300
          bg-superficie border-2 border-borde text-texto-principal
          hover:border-primario hover:text-primario hover:-translate-y-0.5
          active:translate-y-0
          disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
      >
        {compartiendo ? <>{iconoSpin}<span>Preparando...</span></> : <>{iconoCompartir}<span>Compartir PDF</span></>}
      </button>

      {error && (
        <div className={`w-full rounded-xl p-3 text-center border ${
          error.startsWith("✅")
            ? "bg-green-50 border-green-200/60"
            : "bg-red-50 border-red-200/60"
        }`}>
          <p className={`text-sm font-medium ${error.startsWith("✅") ? "text-green-700" : "text-red-600"}`}>
            {error}
          </p>
        </div>
      )}
    </div>
  );
}
