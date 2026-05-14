"use client";

import { X, Plus, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";

export default function ModalPrueba({ isOpen, onClose, onSave, pruebaEditar, categoriasExistentes }: any) {
  const [formData, setFormData] = useState({ categoria: "", subcategoria: "" });
  const [pruebas, setPruebas] = useState<any[]>([]);

  useEffect(() => {
    if (pruebaEditar) {
      setFormData({ 
        categoria: pruebaEditar.categoria.nombre,
        subcategoria: pruebaEditar.nombre 
      });
      setPruebas(pruebaEditar.pruebas.map((p: any) => ({
        id: p.id,
        codigo: p.codigo,
        nombre: p.nombre,
        precioUSD: p.precioUSD.toString(),
        unidades: p.unidades || "",
        valoresReferencia: p.valoresReferencia || ""
      })));
    } else {
      setFormData({ categoria: "", subcategoria: "" });
      setPruebas([{ id: null, codigo: "", nombre: "", precioUSD: "", unidades: "", valoresReferencia: "" }]);
    }
  }, [pruebaEditar, isOpen]);

  if (!isOpen) return null;

  const agregarFila = () => {
    setPruebas([...pruebas, { id: null, codigo: "", nombre: "", precioUSD: "", unidades: "", valoresReferencia: "" }]);
  };

  const actualizarPrueba = (index: number, campo: string, valor: string) => {
    const nuevas = [...pruebas];
    nuevas[index][campo] = valor;
    setPruebas(nuevas);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...formData, pruebas });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#1D1D1F]/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-[1000px] max-h-[90vh] flex flex-col rounded-[32px] shadow-2xl overflow-hidden">
        
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
          <div>
            <h3 className="text-2xl font-black text-[#1D1D1F]">Configurar Catálogo</h3>
            <p className="text-sm text-slate-500">Organiza por Categoría y Subcategoría, definiendo precios individuales.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-slate-300">
          
          {/* SECCIÓN DE ORGANIZACIÓN */}
          <div className="grid grid-cols-2 gap-6 bg-[#F5F5F7] p-6 rounded-2xl border border-slate-200/60">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-black text-[#0071E3] uppercase tracking-widest">Categoría (Organizador)</label>
              <input 
                type="text" required list="cats"
                value={formData.categoria} 
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value.toUpperCase() })} 
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-[#0071E3]/20" 
                placeholder="Ej. HEMATOLOGIA" 
              />
              <datalist id="cats">{categoriasExistentes.map((c: any) => <option key={c} value={c} />)}</datalist>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-black text-[#0071E3] uppercase tracking-widest">Subcategoría (Organizador)</label>
              <input 
                type="text" required
                value={formData.subcategoria} 
                onChange={(e) => setFormData({ ...formData, subcategoria: e.target.value })} 
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-[#0071E3]/20" 
                placeholder="Ej. Hematología Completa" 
              />
            </div>
          </div>

          {/* SECCIÓN DE PRUEBAS INDIVIDUALES CON PRECIO */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-black text-[#1D1D1F] uppercase tracking-widest">Pruebas e Items Individuales</h4>
              <button type="button" onClick={agregarFila} className="text-xs font-bold bg-[#0071E3] text-white px-4 py-2 rounded-lg hover:bg-[#0077ED] transition-all flex items-center gap-2">
                <Plus size={16} strokeWidth={3} /> Agregar Prueba
              </button>
            </div>

            <div className="space-y-3">
              {pruebas.map((p, index) => (
                <div key={index} className="flex gap-3 items-end bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
                  <div className="w-[12%] flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Código</label>
                    <input type="text" required value={p.codigo} onChange={(e) => actualizarPrueba(index, 'codigo', e.target.value.toUpperCase())} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:bg-white" placeholder="HE-01" />
                  </div>
                  <div className="w-[30%] flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Nombre de la Prueba</label>
                    <input type="text" required value={p.nombre} onChange={(e) => actualizarPrueba(index, 'nombre', e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:bg-white" placeholder="Ej. GLOBULOS BLANCOS" />
                  </div>
                  <div className="w-[12%] flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Precio ($)</label>
                    <input type="number" step="0.01" required value={p.precioUSD} onChange={(e) => actualizarPrueba(index, 'precioUSD', e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:bg-white" placeholder="0.00" />
                  </div>
                  <div className="w-[15%] flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Unidades</label>
                    <input type="text" value={p.unidades} onChange={(e) => actualizarPrueba(index, 'unidades', e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white" placeholder="mm3" />
                  </div>
                  <div className="w-[23%] flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Referencia</label>
                    <input type="text" value={p.valoresReferencia} onChange={(e) => actualizarPrueba(index, 'valoresReferencia', e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white" placeholder="4.5 - 10.0" />
                  </div>
                  <button type="button" onClick={() => {
                    const n = [...pruebas]; n.splice(index, 1); setPruebas(n);
                  }} className="p-2 text-slate-300 hover:text-red-500"><Trash2 size={18} /></button>
                </div>
              ))}
            </div>
          </div>
        </form>

        <div className="p-6 bg-slate-50 border-t border-slate-200 flex gap-4">
          <button type="button" onClick={onClose} className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-100">Cancelar</button>
          <button type="submit" onClick={handleSubmit} className="flex-1 py-4 bg-[#0071E3] text-white font-bold rounded-2xl shadow-lg hover:bg-[#0077ED]">Guardar Catálogo</button>
        </div>
      </div>
    </div>
  );
}