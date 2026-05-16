"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { 
  Home, 
  FileSignature, 
  CalendarDays, 
  Microscope, 
  TestTubes, 
  Users, 
  Award, 
  BarChart3, 
  Wallet, 
  Calculator, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  UserCog // <-- NUEVO ÍCONO
} from "lucide-react";
import ModalConfirmacion from "./ModalConfirmacion";

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const rolUsuario = (session?.user as any)?.rol || "USUARIO";

  // AGREGAMOS "Mi Perfil" AL MENÚ MAESTRO
  const menuMaestro = [
    { nombre: "Inicio", ruta: "/home", icono: Home }, 
    { nombre: "Registro", ruta: "/home/registro", icono: FileSignature },
    { nombre: "Lista Diaria", ruta: "/home/diaria", icono: CalendarDays },
    { nombre: "Resultados", ruta: "/home/resultados", icono: Microscope },
    { nombre: "Pruebas", ruta: "/home/pruebas", icono: TestTubes },
    { nombre: "Pacientes", ruta: "/home/pacientes", icono: Users },
    { nombre: "Constancias", ruta: "/home/constancias", icono: Award },
    { nombre: "Estadísticas", ruta: "/home/estadisticas", icono: BarChart3 },
    { nombre: "Monedero", ruta: "/home/monedero", icono: Wallet },
    { nombre: "Cierre de Caja", ruta: "/home/cierre", icono: Calculator },
    { nombre: "Mi Perfil", ruta: "/home/perfil", icono: UserCog }, // <-- NUEVA RUTA
  ];

  const rutasPermitidasUsuario = [
    "/home", "/home/registro", "/home/diaria", "/home/resultados", "/home/pacientes", "/home/constancias", "/home/cierre"
  ];

  const menuItems = rolUsuario === "ADMIN" 
    ? menuMaestro 
    : menuMaestro.filter(item => rutasPermitidasUsuario.includes(item.ruta));

  return (
    <>
      <aside 
        className={`relative h-screen bg-white/80 border-r border-[#D2D2D7]/50 flex flex-col shrink-0 transition-[width] duration-300 ease-in-out z-50 ${
          isCollapsed ? "w-[88px]" : "w-[280px]"
        }`}
      >
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-4 top-10 w-8 h-8 bg-white border border-slate-200 shadow-sm rounded-full flex items-center justify-center hover:bg-slate-50 hover:scale-105 transition-all z-50 text-slate-500"
          aria-label="Alternar menú lateral"
        >
          {isCollapsed ? <ChevronRight size={18} strokeWidth={2.5} /> : <ChevronLeft size={18} strokeWidth={2.5} />}
        </button>

        <div className={`h-24 flex items-center border-b border-[#D2D2D7]/30 transition-all duration-300 overflow-hidden ${
          isCollapsed ? "justify-center px-0" : "px-8"
        }`}>
          <div className="flex items-center gap-3 w-full">
            <div className={`relative shrink-0 drop-shadow-sm transition-all duration-300 ${
              isCollapsed ? "w-10 h-10 mx-auto" : "w-12 h-12"
            }`}>
              <Image src="/Logo2.png" alt="Leyma" fill className="object-contain" />
            </div>
            
            <div className={`flex flex-col whitespace-nowrap transition-all duration-300 overflow-hidden ${
              isCollapsed ? "w-0 opacity-0" : "w-[120px] opacity-100"
            }`}>
              <span className="font-title text-xl font-black text-[#1D1D1F] tracking-tight leading-none">
                LEYMA <span className="text-sm font-black text-[#1D1D1F]">C.A.</span>
              </span>
              <span className="text-[10px] font-bold text-[#86868B] uppercase tracking-[0.2em] mt-1">
                Laboratorio
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-1 space-y-1 px-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        
          
          {menuItems.map((item) => {
            const isActive = item.ruta === "/home" 
              ? pathname === "/home" 
              : pathname.startsWith(item.ruta);
            
            const Icon = item.icono;

            return (
              <Link
                key={item.ruta}
                href={item.ruta}
                title={isCollapsed ? item.nombre : ""}
                className={`flex items-center rounded-2xl transition-all duration-300 group overflow-hidden whitespace-nowrap ${
                  isCollapsed ? "justify-center px-0 py-3" : "px-4 py-3"
                } ${
                  isActive 
                    ? "bg-[#0071E3]/10 text-[#0071E3]" 
                    : "text-[#86868B] hover:bg-slate-100/80"
                }`}
              >
                <div className="flex items-center justify-center shrink-0 w-6">
                  <Icon 
                    size={20} 
                    strokeWidth={isActive ? 2.5 : 2} 
                    className={`transition-colors ${isActive ? "text-[#0071E3]" : "text-[#86868B] group-hover:text-[#1D1D1F]"}`} 
                  />
                </div>
                
                <span className={`text-[15px] font-medium transition-all duration-300 overflow-hidden ${
                  isCollapsed ? "w-0 opacity-0 ml-0" : "w-auto opacity-100 ml-3"
                } ${isActive ? "font-semibold" : "group-hover:text-[#1D1D1F]"}`}>
                  {item.nombre}
                </span>
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-[#D2D2D7]/30">
          <button
            onClick={() => setShowLogoutModal(true)}
            title={isCollapsed ? "Cerrar Sesión" : ""}
            className={`w-full flex items-center rounded-2xl bg-red-50/50 text-red-500 hover:bg-red-100 hover:text-red-600 transition-colors font-semibold group overflow-hidden whitespace-nowrap ${
              isCollapsed ? "justify-center px-0 py-3" : "px-4 py-2.5"
            }`}
          >
            <div className="flex items-center justify-center shrink-0 w-6">
              <LogOut size={20} strokeWidth={2.5} className="group-hover:scale-110 transition-transform" />
            </div>
            
            <span className={`transition-all duration-300 overflow-hidden ${
              isCollapsed ? "w-0 opacity-0 ml-0" : "w-auto opacity-100 ml-3"
            }`}>
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
        textoCancelar="Cancelar"
        colorBoton="red"
      />
    </>
  );
}