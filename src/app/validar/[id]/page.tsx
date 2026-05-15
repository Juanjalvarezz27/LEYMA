import { PrismaClient } from "@prisma/client";
import { notFound } from "next/navigation";
import Image from "next/image";

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
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center p-6 md:p-12 font-sans text-[#1D1D1F]">
      
      {/* Contenedor Principal Limpio */}
      <div className="w-full max-w-2xl border border-slate-200 rounded-xl p-8 md:p-12">
        
        {/* Encabezado (Idéntico al PDF) */}
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between border-b-[2.5px] border-black pb-6 mb-8 gap-6">
          <div className="flex items-center gap-5">
            <Image 
              src="/Logo2.png" 
              alt="Logo LEYMA" 
              width={75} 
              height={75} 
              className="object-contain"
              priority
            />
            <div className="flex flex-col justify-center mt-1">
              {/* Usa la variable Montserrat de tu tailwind.config */}
              <h1 className="text-[30px] font-black font-title tracking-tight leading-none mb-1">
                LEYMA S.A.
              </h1>
              <p className="text-[12px] font-bold tracking-widest uppercase">
                Laboratorio Clínico Bacteriológico
              </p>
            </div>
          </div>
          <div className="text-center md:text-right">
             <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Validación Oficial</p>
             <p className="text-xl font-black mt-1">Orden #{orden.id.toString().padStart(6, "0")}</p>
          </div>
        </div>

        {/* Cuerpo del Validador */}
        <div>
          {!orden.resultadosCompletados ? (
            /* ESTADO: EN PROCESO */
            <div className="border border-amber-300 bg-amber-50 p-6 rounded-lg text-center mb-8">
              <h2 className="text-lg font-black text-amber-600 uppercase tracking-widest mb-2">
                Documento en Proceso
              </h2>
              <p className="text-sm font-medium text-amber-800">
                La orden existe en nuestra base de datos, pero los resultados técnicos aún no han sido procesados y certificados por el bioanalista.
              </p>
            </div>
          ) : (
            /* ESTADO: VERIFICADO */
            <>
              <div className="border border-emerald-400 bg-emerald-50 p-4 rounded-lg text-center mb-10">
                <h2 className="text-md font-black text-emerald-600 uppercase tracking-widest">
                  Resultados Auténticos y Verificados
                </h2>
              </div>

              {/* Ficha de Datos Estilo Clínico */}
              <div className="flex flex-col gap-6">
                
                <div className="flex flex-col md:flex-row border-b border-slate-100 pb-4">
                  <div className="w-full md:w-1/3">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Paciente</p>
                  </div>
                  <div className="w-full md:w-2/3">
                    <p className="text-base font-black uppercase">{orden.paciente.nombreCompleto}</p>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row border-b border-slate-100 pb-4">
                  <div className="w-full md:w-1/3">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cédula de Identidad</p>
                  </div>
                  <div className="w-full md:w-2/3">
                    <p className="text-base font-medium">{orden.paciente.cedula || "S/N"}</p>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row border-b border-slate-100 pb-4">
                  <div className="w-full md:w-1/3">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fecha de Emisión</p>
                  </div>
                  <div className="w-full md:w-2/3">
                    <p className="text-base font-medium">{formatFecha(orden.fechaCreacion)}</p>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row border-b border-slate-100 pb-4">
                  <div className="w-full md:w-1/3">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bioanalista Responsable</p>
                  </div>
                  <div className="w-full md:w-2/3">
                    <p className="text-base font-black uppercase">{orden.creadoPor?.nombre || "Bioanalista Titular"}</p>
                  </div>
                </div>

              </div>
            </>
          )}
        </div>

        {/* Footer Legal */}
        <div className="mt-12 pt-6 border-t-[1.5px] border-black text-center">
           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
              Este reporte es un documento electrónico oficial generado por el Sistema LEYMA. Válido únicamente con sello húmedo original.
           </p>
        </div>

      </div>
    </div>
  );
}