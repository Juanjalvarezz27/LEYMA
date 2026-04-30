"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { 
  FileSignature, CalendarDays, Microscope, TestTubes, Users, 
  Award, BarChart3, Wallet, Calculator, LogOut, ChevronLeft, ChevronRight
} from "lucide-react";
import ModalConfirmacion from "./ModalConfirmacion";

export default function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const menuItems = [
    { nombre: "Registro", ruta: "/home/registro", icono: FileSignature },
    { nombre: "Lista Diaria", ruta: "/home/diaria", icono: CalendarDays },
    { nombre: "Resultados", ruta: "/home/resultados", icono: Microscope },
    { nombre: "Pruebas", ruta: "/home/pruebas", icono: TestTubes },
    { nombre: "Pacientes", ruta: "/home/pacientes", icono: Users },
    { nombre: "Constancias", ruta: "/home/constancias", icono: Award },
    { nombre: "Estadísticas", ruta: "/home/estadisticas", icono: BarChart3 },
    { nombre: "Monedero", ruta: "/home/monedero", icono: Wallet },
    { nombre: "Cierre de Caja", ruta: "/home/cierre", icono: Calculator },
  ];

  return (
    <>
      <aside 
        className={`relative h-screen bg-white/80 backdrop-blur-xl border-r border-[#D2D2D7]/50 flex flex-col shrink-0 transition-all duration-300 ease-in-out ${
          isCollapsed ? "w-[90px]" : "w-[280px]"
        }`}
      >
        {/* Botón Flotante para Colapsar/Expandir */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-4 top-10 w-8 h-8 bg-white border border-slate-200 shadow-sm rounded-full flex items-center justify-center hover:bg-slate-50 hover:scale-105 transition-all z-50 text-slate-500"
          aria-label="Alternar menú lateral"
        >
          {isCollapsed ? <ChevronRight size={18} strokeWidth={2.5} /> : <ChevronLeft size={18} strokeWidth={2.5} />}
        </button>

        {/* Cabecera del Sidebar (Logo) */}
        <div className={`h-24 flex items-center border-b border-[#D2D2D7]/30 transition-all overflow-hidden ${isCollapsed ? "justify-center px-0" : "gap-3 px-8"}`}>
          <div className="relative w-10 h-10 shrink-0 drop-shadow-sm">
            <Image src="/Logo.png" alt="Leyma" fill className="object-contain" />
          </div>
          
          <div className={`flex flex-col whitespace-nowrap transition-all duration-300 ${isCollapsed ? "opacity-0 w-0 hidden" : "opacity-100 w-auto"}`}>
            <span className="font-title text-xl font-black text-[#1D1D1F] tracking-tight leading-none">
              LEYMA <span className="text-sm font-black text-[#1D1D1F]">S.A.</span>
            </span>
            <span className="text-[10px] font-bold text-[#86868B] uppercase tracking-[0.2em] mt-1">
              Laboratorio
            </span>
          </div>
        </div>

        {/* Menú de Navegación (Scroll oculto nativamente) */}
        <div className="flex-1 overflow-y-auto py-5 space-y-1 px-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <p className={`text-[10px] font-bold text-[#1D1D1F]/30 uppercase tracking-[0.15em] mb-3 transition-all duration-300 overflow-hidden whitespace-nowrap ${isCollapsed ? "opacity-0 h-0 m-0" : "opacity-100 px-4"}`}>
            Módulos del Sistema
          </p>
          
          {menuItems.map((item) => {
            const isActive = pathname.startsWith(item.ruta);
            const Icon = item.icono;

            return (
              <Link
                key={item.ruta}
                href={item.ruta}
                title={isCollapsed ? item.nombre : ""}
                className={`flex items-center rounded-2xl transition-all duration-200 group overflow-hidden ${
                  isCollapsed ? "justify-center p-3" : "gap-3 px-4 py-3"
                } ${
                  isActive 
                    ? "bg-[#0071E3]/10 text-[#0071E3]" 
                    : "text-[#86868B] hover:bg-slate-100/80"
                }`}
              >
                <Icon 
                  size={20} 
                  strokeWidth={isActive ? 2.5 : 2} 
                  className={`shrink-0 ${isActive ? "text-[#0071E3]" : "text-[#86868B] group-hover:text-[#1D1D1F] transition-colors"}`} 
                />
                <span className={`text-[15px] font-medium whitespace-nowrap transition-all duration-300 ${
                  isCollapsed ? "opacity-0 w-0 hidden" : "opacity-100 w-auto"
                } ${isActive ? "font-semibold" : "group-hover:text-[#1D1D1F]"}`}>
                  {item.nombre}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Footer del Sidebar */}
        <div className="p-4 border-t border-[#D2D2D7]/30">
          <button
            onClick={() => setShowLogoutModal(true)}
            title={isCollapsed ? "Cerrar Sesión" : ""}
            className={`w-full flex items-center rounded-2xl bg-red-50/50 text-red-500 hover:bg-red-100 hover:text-red-600 transition-colors font-semibold group overflow-hidden ${
              isCollapsed ? "justify-center p-3" : "gap-3 px-4 py-2.5"
            }`}
          >
            <LogOut size={20} strokeWidth={2.5} className="shrink-0 group-hover:scale-110 transition-transform" />
            <span className={`whitespace-nowrap transition-all duration-300 ${isCollapsed ? "opacity-0 w-0 hidden" : "opacity-100 w-auto"}`}>
              Cerrar Sesión
            </span>
          </button>
        </div>
      </aside>

      <ModalConfirmacion 
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={() => signOut({ callbackUrl: '/' })}
        titulo="Cerrar Sesión"
        mensaje="¿Estás seguro de que deseas salir del sistema? Tendrás que volver a ingresar tus credenciales para acceder."
        textoConfirmar="Cerrar Sesión"
        textoCancelar="Permanecer"
        colorBoton="red"
      />
    </>
  );
}