"use client";

import { X } from "lucide-react";
import { useState, useEffect } from "react";

interface ModalPruebaProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  pruebaEditar?: any;
}

export default function ModalPrueba({ isOpen, onClose, onSave, pruebaEditar }: ModalPruebaProps) {
  const [formData, setFormData] = useState({ codigo: "", nombre: "", precioUSD: "" });

  // Sincronizar datos si estamos editando
  useEffect(() => {
    if (pruebaEditar) {
      setFormData({ 
        codigo: pruebaEditar.codigo, 
        nombre: pruebaEditar.nombre, 
        precioUSD: pruebaEditar.precioUSD.toString() 
      });
    } else {
      setFormData({ codigo: "", nombre: "", precioUSD: "" });
    }
  }, [pruebaEditar, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20">
      <div className="bg-white/95 border border-white/50 w-full max-w-[450px] rounded-[32px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] animate-in zoom-in-95 duration-200">
        
        <div className="p-6 pb-4 flex justify-between items-center border-b border-slate-100">
          <h3 className="font-title text-xl font-bold text-[#1D1D1F]">
            {pruebaEditar ? "Editar Prueba" : "Nueva Prueba"}
          </h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="w-1/3 flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-[#1D1D1F]/50 uppercase ml-2 tracking-[0.15em]">Código</label>
                <input
                  type="text"
                  required
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-3 bg-[#F5F5F7] border border-slate-200/60 rounded-2xl text-[#1D1D1F] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20 focus:border-[#0071E3]/50"
                  placeholder="EX-01"
                />
              </div>
              <div className="w-2/3 flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-[#1D1D1F]/50 uppercase ml-2 tracking-[0.15em]">Precio ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.precioUSD}
                  onChange={(e) => setFormData({ ...formData, precioUSD: e.target.value })}
                  className="w-full px-4 py-3 bg-[#F5F5F7] border border-slate-200/60 rounded-2xl text-[#1D1D1F] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20 focus:border-[#0071E3]/50"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-[#1D1D1F]/50 uppercase ml-2 tracking-[0.15em]">Nombre de la Prueba</label>
              <input
                type="text"
                required
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="w-full px-4 py-3 bg-[#F5F5F7] border border-slate-200/60 rounded-2xl text-[#1D1D1F] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20 focus:border-[#0071E3]/50"
                placeholder="Ej. Hematología Completa"
              />
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 font-semibold rounded-2xl hover:bg-slate-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" className="flex-1 py-3 bg-[#0071E3] text-white font-semibold rounded-2xl shadow-[0_4px_10px_rgba(0,113,227,0.2)] hover:bg-[#0077ED] transition-colors">
              Guardar
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}