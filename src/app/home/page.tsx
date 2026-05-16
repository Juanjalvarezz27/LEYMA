"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  Calendar as CalendarIcon, 
  TrendingUp, 
  Activity, 
  ArrowRight,
  FileSignature,
  CalendarDays,
  Microscope,
  TestTube
} from "lucide-react";
import useTasaBCV from "../hooks/useTasaBcv";

export default function HomeDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { tasa } = useTasaBCV();
  
  const [fechaActual, setFechaActual] = useState("");

  useEffect(() => {
    const opciones: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const fechaString = new Date().toLocaleDateString('es-VE', opciones);
    setFechaActual(fechaString.charAt(0).toUpperCase() + fechaString.slice(1));
  }, []);

  const nombreUsuario = session?.user?.name || "";

  const accesosRapidos = [
    {
      titulo: "Nueva Orden",
      descripcion: "Registrar paciente y facturar",
      icono: <FileSignature size={24} strokeWidth={2} />,
      color: "bg-[#0071E3]",
      bgLigero: "bg-[#0071E3]/10",
      texto: "text-[#0071E3]",
      ruta: "/home/registro"
    },
    {
      titulo: "Lista Diaria",
      descripcion: "Control de pagos y estados",
      icono: <CalendarDays size={24} strokeWidth={2} />,
      color: "bg-orange-500",
      bgLigero: "bg-orange-100",
      texto: "text-orange-600",
      ruta: "/home/diaria"
    },
    {
      titulo: "Resultados",
      descripcion: "Transcribir y generar PDF",
      icono: <Microscope size={24} strokeWidth={2} />,
      color: "bg-purple-500",
      bgLigero: "bg-purple-100",
      texto: "text-purple-600",
      ruta: "/home/resultados"
    },
    {
      titulo: "Catálogo",
      descripcion: "Gestionar pruebas y precios",
      icono: <TestTube size={24} strokeWidth={2} />,
      color: "bg-emerald-500",
      bgLigero: "bg-emerald-100",
      texto: "text-emerald-600",
      ruta: "/home/pruebas"
    }
  ];

  return (
    // Se agregó 'outline-none' para quitar el borde negro al hacer clic
    <div className="h-full flex flex-col pb-10 overflow-y-auto outline-none pr-4 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full animate-in fade-in duration-500">
      
      {/* BANNER DE BIENVENIDA */}
      <div className="relative bg-white border border-slate-200/80 rounded-[32px] p-8 md:p-12 mb-8 overflow-hidden shadow-sm shrink-0">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-50 rounded-full blur-[100px] opacity-80 -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            {/* LOGO MÁS GRANDE Y ACTUALIZADO A Logo2.png */}
            <div className="shrink-0">
              <img 
                src="/Logo2.png" 
                alt="Logo LEYMA" 
                className="h-20 md:h-24 w-auto object-contain drop-shadow-sm" 
              />
            </div>
            
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-[#1D1D1F] tracking-tight mb-2 leading-tight">
                Hola, <span className="text-[#0071E3]">{status === "loading" ? "..." : nombreUsuario}</span>
              </h1>
              <p className="text-lg font-medium text-slate-500 max-w-xl">
                Bienvenido al panel principal de LEYMA S.A. ¿Qué te gustaría hacer hoy?
              </p>
            </div>
          </div>
          
          <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 flex items-center gap-4 shrink-0 shadow-sm">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
              <Activity size={24} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Estado del Sistema</p>
              <p className="text-sm font-black text-[#1D1D1F] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Operativo
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* TARJETAS DE INFORMACIÓN VITAL */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 shrink-0">
        <div className="bg-white border border-slate-200/80 rounded-[24px] p-6 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-[#0071E3] shrink-0">
            <CalendarIcon size={28} strokeWidth={2} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Fecha Actual</p>
            <h3 className="text-xl font-black text-[#1D1D1F] leading-none">{fechaActual}</h3>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-[24px] p-6 shadow-sm flex items-center gap-5 relative overflow-hidden">
          <div className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-50 opacity-50 scale-150 -translate-x-4 pointer-events-none">
            <TrendingUp size={100} />
          </div>
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0 relative z-10">
            <TrendingUp size={28} strokeWidth={2} />
          </div>
          <div className="relative z-10">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tasa de Cambio BCV</p>
            <div className="flex items-end gap-2">
              <h3 className="text-3xl font-black text-[#1D1D1F] leading-none">
                {!tasa ? "..." : `Bs ${tasa.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`}
              </h3>
              <span className="text-sm font-bold text-slate-400 mb-0.5">/ USD</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN DE ACCESOS RÁPIDOS */}
      <div>
        <h2 className="text-lg font-black text-[#1D1D1F] mb-6 flex items-center gap-2">
          Accesos Rápidos
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {accesosRapidos.map((acceso, idx) => (
            <button
              key={idx}
              onClick={() => router.push(acceso.ruta)}
              className="group bg-white border border-slate-200/80 rounded-[24px] p-6 text-left shadow-sm hover:shadow-xl hover:border-transparent transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between h-48 relative overflow-hidden"
            >
              <div className={`w-14 h-14 rounded-2xl ${acceso.bgLigero} ${acceso.texto} flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110`}>
                {acceso.icono}
              </div>
              <div>
                <h3 className="text-lg font-black text-[#1D1D1F] mb-1 group-hover:text-[#0071E3] transition-colors">{acceso.titulo}</h3>
                <p className="text-[13px] font-medium text-slate-500 relative z-10">{acceso.descripcion}</p>
              </div>
              <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300 text-[#0071E3]">
                <ArrowRight size={20} strokeWidth={2.5} />
              </div>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}