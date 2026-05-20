import { PrismaClient } from "@prisma/client";
import { notFound } from "next/navigation";
import Image from "next/image";
import DescargarPDFButton from "./DescargarPDFButton";

const prisma = new PrismaClient();

export default async function ValidarPage({ params }: { params: any }) {
  const resolvedParams = await params;
  const ordenId = parseInt(resolvedParams.id, 10);

  if (isNaN(ordenId)) return notFound();

  const orden = await prisma.orden.findUnique({
    where: { id: ordenId },
    include: {
      paciente: true,
      creadoPor: true,
    },
  });

  if (!orden) return notFound();

  const formatFecha = (date: Date) => {
    return date.toLocaleDateString("es-VE", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const esVerificado = orden.resultadosCompletados;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex flex-col items-center justify-center px-4 py-8 sm:py-12 font-sans text-[#1D1D1F]">

      {/* CONTENEDOR PRINCIPAL — CARD PREMIUM */}
      <div className="w-full max-w-xl">

        {/* HEADER BRAND */}
        <div className="flex flex-col items-center mb-8 sm:mb-10">
          <div className="relative w-[72px] h-[72px] sm:w-[88px] sm:h-[88px] mb-4">
            <div className="absolute inset-0 bg-gradient-to-br from-[#0071E3] to-[#00C7BE] rounded-2xl sm:rounded-3xl opacity-10" />
            <div className="relative w-full h-full flex items-center justify-center">
              <Image 
                src="/Logo2.png" 
                alt="Logo LEYMA" 
                width={60} 
                height={60} 
                className="object-contain drop-shadow-sm"
                priority
              />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-title tracking-tight leading-none">
            LEYMA C.A.
          </h1>
          <p className="text-[11px] sm:text-xs font-bold tracking-[0.25em] uppercase text-slate-400 mt-1.5">
            Laboratorio Clínico Bacteriológico
          </p>
        </div>

        {/* CARD PRINCIPAL */}
        <div className="bg-white rounded-3xl shadow-[0_4px_40px_rgba(0,0,0,0.06)] border border-slate-200/60 overflow-hidden">
          
          {/* BADGE DE ESTADO — BANNER SUPERIOR */}
          {esVerificado ? (
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-4 sm:py-5 flex items-center justify-center gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <div>
                <p className="text-white font-black text-sm sm:text-[15px] uppercase tracking-wider">
                  Documento Verificado
                </p>
                <p className="text-emerald-100 text-[11px] sm:text-xs font-medium mt-0.5">
                  Resultados auténticos y certificados
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-amber-400 to-amber-500 px-6 py-4 sm:py-5 flex items-center justify-center gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <div>
                <p className="text-white font-black text-sm sm:text-[15px] uppercase tracking-wider">
                  En Proceso
                </p>
                <p className="text-amber-100 text-[11px] sm:text-xs font-medium mt-0.5">
                  Los resultados aún están siendo procesados
                </p>
              </div>
            </div>
          )}

          {/* CUERPO DE LA CARD */}
          <div className="p-6 sm:p-8">

            {/* NÚMERO DE ORDEN — BADGE CENTRAL */}
            <div className="flex justify-center mb-6 sm:mb-8">
              <div className="bg-[#F5F5F7] border border-slate-200/80 rounded-2xl px-6 py-3 sm:px-8 sm:py-4 text-center">
                <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Orden N°
                </p>
                <p className="text-xl sm:text-2xl font-black tracking-tight text-[#1D1D1F] font-title">
                  #{orden.id.toString().padStart(6, "0")}
                </p>
              </div>
            </div>

            {!esVerificado ? (
              /* ESTADO: EN PROCESO — MENSAJE DETALLADO */
              <div className="bg-amber-50/60 border border-amber-200/60 rounded-2xl p-5 sm:p-6 text-center">
                <p className="text-sm sm:text-[15px] font-medium text-amber-800 leading-relaxed">
                  La orden existe en nuestra base de datos, pero los resultados técnicos aún no han sido procesados y certificados por el bioanalista.
                </p>
                <p className="text-xs text-amber-600 font-bold mt-3">
                  Por favor, intente más tarde.
                </p>
              </div>
            ) : (
              /* ESTADO: VERIFICADO — FICHA DE DATOS */
              <>
                {/* GRID DE DATOS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 mb-8">
                  
                  {/* Paciente */}
                  <div className="bg-[#F5F5F7] rounded-2xl p-4 sm:col-span-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      Paciente
                    </p>
                    <p className="text-base sm:text-lg font-black uppercase text-[#1D1D1F] leading-tight">
                      {orden.paciente.nombreCompleto}
                    </p>
                  </div>

                  {/* Cédula */}
                  <div className="bg-[#F5F5F7] rounded-2xl p-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      Cédula de Identidad
                    </p>
                    <p className="text-[15px] font-bold text-[#1D1D1F]">
                      {orden.paciente.cedula || "S/N"}
                    </p>
                  </div>

                  {/* Fecha de Emisión */}
                  <div className="bg-[#F5F5F7] rounded-2xl p-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      Fecha de Emisión
                    </p>
                    <p className="text-[15px] font-bold text-[#1D1D1F]">
                      {formatFecha(orden.fechaCreacion)}
                    </p>
                  </div>

                  {/* Bioanalista */}
                  <div className="bg-[#F5F5F7] rounded-2xl p-4 sm:col-span-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      Bioanalista Responsable
                    </p>
                    <p className="text-[15px] font-black uppercase text-[#1D1D1F]">
                      {orden.creadoPor?.nombre || "Bioanalista Titular"}
                    </p>
                  </div>
                </div>

                {/* SEPARADOR + SECCIÓN DE DESCARGA */}
                <div className="border-t border-slate-200/80 pt-6 sm:pt-8">
                  <div className="flex flex-col items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-[#0071E3]/10 rounded-2xl flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0071E3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10 9 9 9 8 9" />
                      </svg>
                    </div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center">
                      Descarga tus resultados
                    </p>
                  </div>
                  <DescargarPDFButton ordenId={orden.id} nombrePaciente={orden.paciente.nombreCompleto} />
                </div>
              </>
            )}
          </div>
        </div>

        {/* FOOTER LEGAL */}
        <div className="mt-6 sm:mt-8 text-center px-4">
          <p className="text-[10px] sm:text-[11px] font-semibold text-slate-400 leading-relaxed">
            Este reporte es un documento electrónico oficial generado por el Sistema LEYMA C.A.
          </p>
          <p className="text-[9px] sm:text-[10px] text-slate-300 font-medium mt-1">
            Válido únicamente con sello húmedo original.
          </p>
        </div>

      </div>
    </div>
  );
}