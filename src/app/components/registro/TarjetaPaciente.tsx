"use client";

import { X, Baby, User, UserCheck } from "lucide-react";

interface TarjetaPacienteProps {
  paciente: any;
  limpiarSeleccion: () => void;
}

export default function TarjetaPaciente({ paciente, limpiarSeleccion }: TarjetaPacienteProps) {
  const calcularEdad = (fechaNac: string) => {
    const hoy = new Date();
    const nacimiento = new Date(fechaNac);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const m = hoy.getMonth() - nacimiento.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  };

  return (
    <div className="bg-[#F5F5F7] border border-slate-200/60 rounded-[20px] p-6 relative flex items-center justify-between animate-in fade-in zoom-in-95 duration-200">
      <button 
        onClick={limpiarSeleccion}
        className="absolute top-4 right-4 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
        title="Cambiar paciente"
      >
        <X size={20} strokeWidth={2.5} />
      </button>
      
      <div className="flex items-center gap-5">
        <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${paciente.esBebe ? 'bg-orange-100 text-orange-600' : 'bg-[#0071E3]/10 text-[#0071E3]'}`}>
          {paciente.esBebe ? <Baby size={28} strokeWidth={2.5} /> : <User size={28} strokeWidth={2.5} />}
        </div>
        <div>
          <h3 className="text-xl font-bold text-[#1D1D1F] flex items-center gap-2">
            {paciente.nombreCompleto}
            <UserCheck size={18} className="text-green-500" strokeWidth={3} />
          </h3>
          <div className="flex items-center gap-3 mt-1 text-sm font-medium text-slate-500">
            {!paciente.esBebe && (
              <><span>C.I: {paciente.cedula}</span> <span className="w-1 h-1 bg-slate-300 rounded-full"></span></>
            )}
            <span>{calcularEdad(paciente.fechaNacimiento)} {paciente.esBebe ? 'Meses/Días' : 'Años'}</span>
            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
            <span>{paciente.sexo === 'M' ? 'Masculino' : 'Femenino'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}