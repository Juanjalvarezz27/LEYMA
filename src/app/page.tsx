"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { toast } from "react-toastify";

export default function LoginPage() {
  const router = useRouter();
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [verClave, setVerClave] = useState(false);
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);

    const respuesta = await signIn("credentials", {
      correo,
      clave,
      redirect: false,
    });

    setCargando(false);

    if (respuesta?.error) {
      // Notificación de error corporativa con Toastify
      toast.error(respuesta.error);
    } else {
      toast.success("¡Bienvenido al sistema!");
      router.push("/home");
      router.refresh();
    }
  };

  return (
    <main className="min-h-screen w-full flex bg-[#F5F5F7] font-sans overflow-hidden relative selection:bg-primario/10">
      
      {/* Luces de fondo sutiles estilo macOS */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[70%] rounded-full bg-blue-100/40 blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[50%] rounded-full bg-orange-50/30 blur-[120px] pointer-events-none"></div>

      <div className="flex w-full max-w-[1200px] mx-auto z-10">
        
        {/* COLUMNA IZQUIERDA: LEYMA S.A. */}
        <div className="hidden lg:flex w-[45%] flex-col justify-center px-16">
          <div className="relative w-32 h-32 mb-10 drop-shadow-2xl">
            <Image
              src="/Logo.png" 
              alt="Logo Leyma"
              fill
              className="object-contain"
              priority
            />
          </div>
          <div className="flex items-baseline gap-3">
            <h1 className="font-title text-8xl font-black text-[#1D1D1F] tracking-tighter leading-none">
              LEYMA
            </h1>
            <span className="text-3xl font-black text-[#1D1D1F] tracking-tight">
              S.A.
            </span>
          </div>
          <h2 className="text-2xl font-medium text-[#86868B] mt-4 leading-relaxed tracking-tight">
            Laboratorio Clínico Bacteriológico.
          </h2>
        </div>

        {/* COLUMNA DERECHA: Panel de Acceso */}
        <div className="w-full lg:w-[55%] flex items-center justify-center p-6">
          <div className="w-full max-w-[480px] bg-white/80 backdrop-blur-[30px] rounded-[44px] shadow-[0_40px_80px_rgba(0,0,0,0.06),_inset_0_0_0_1px_rgba(255,255,255,0.6)] p-12 border border-white/40">
            
            {/* Encabezado del Panel con Icono de Lucide Alineado */}
            <div className="mb-12">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 bg-primario/10 rounded-2xl flex items-center justify-center shrink-0">
                  <Lock className="text-primario w-6 h-6" strokeWidth={3} />
                </div>
                <h3 className="font-title text-3xl font-bold text-[#1D1D1F] tracking-tight">
                  Acceso al Sistema
                </h3>
              </div>
              <p className="text-[#86868B] font-medium ml-16">
                Introduce tus credenciales autorizadas.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-5">
                {/* Campo Usuario */}
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-bold text-[#1D1D1F]/40 uppercase ml-4 tracking-[0.2em]">Usuario</label>
                  <input
                    type="email"
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    className="w-full px-6 py-5 bg-[#F5F5F7] border border-[#D2D2D7]/50 rounded-[28px] text-[#1D1D1F] text-lg font-medium shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] focus:bg-white focus:outline-none focus:ring-4 focus:ring-primario/10 focus:border-primario transition-all duration-300"
                    placeholder="admin@admin"
                    required
                    disabled={cargando}
                  />
                </div>

                {/* Campo Contraseña con Ojo */}
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-bold text-[#1D1D1F]/40 uppercase ml-4 tracking-[0.2em]">Contraseña</label>
                  <div className="relative">
                    <input
                      type={verClave ? "text" : "password"}
                      value={clave}
                      onChange={(e) => setClave(e.target.value)}
                      className="w-full px-6 py-5 bg-[#F5F5F7] border border-[#D2D2D7]/50 rounded-[28px] text-[#1D1D1F] text-lg font-medium shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] focus:bg-white focus:outline-none focus:ring-4 focus:ring-primario/10 focus:border-primario transition-all duration-300"
                      placeholder="••••••••"
                      required
                      disabled={cargando}
                    />
                    <button
                      type="button"
                      onClick={() => setVerClave(!verClave)}
                      className="absolute right-6 top-1/2 -translate-y-1/2 p-2 text-[#86868B] hover:text-primario transition-colors"
                    >
                      {verClave ? <EyeOff size={22} strokeWidth={2.5} /> : <Eye size={22} strokeWidth={2.5} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Botón de Acción Principal */}
              <button
                type="submit"
                disabled={cargando}
                className="group w-full bg-primario text-white text-xl font-bold py-5 rounded-[28px] shadow-[0_20px_40px_rgba(0,113,227,0.2)] hover:bg-[#0077ED] hover:shadow-[0_25px_50px_rgba(0,113,227,0.3)] transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 active:scale-[0.98]"
              >
                <span>{cargando ? "Iniciando..." : "Entrar al Laboratorio"}</span>
                {!cargando && <ArrowRight size={22} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />}
              </button>
            </form>

            {/* Footer de Marca */}
            <div className="mt-14 pt-8 border-t border-[#D2D2D7]/40 flex justify-between items-center">
              <span className="text-[11px] font-black text-[#1D1D1F]/30 uppercase tracking-[0.4em]">LEYMA</span>
              <span className="text-[11px] font-bold text-[#1D1D1F]/20 uppercase tracking-[0.4em]">Trujillo, VZLA</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}