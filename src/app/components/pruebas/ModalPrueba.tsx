"use client";

import { X, Plus, Trash2, ChevronDown, Loader2, Package, LayoutList } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";

export default function ModalPrueba({ isOpen, onClose, onSave, pruebaEditar, categoriasExistentes }: any) {
  const [formData, setFormData] = useState({ 
    categoria: "", 
    subcategoria: "", 
    esPaquete: false, 
    precioPaqueteUSD: "" 
  });
  const [pruebas, setPruebas] = useState<any[]>([]);
  
  const [openDropdownCategoria, setOpenDropdownCategoria] = useState(false);
  const [guardando, setGuardando] = useState(false);
  
  const dropdownCategoriaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownCategoriaRef.current && !dropdownCategoriaRef.current.contains(event.target as Node)) {
        setOpenDropdownCategoria(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (pruebaEditar) {
      setFormData({ 
        categoria: pruebaEditar.categoria.nombre,
        subcategoria: pruebaEditar.nombre,
        esPaquete: pruebaEditar.esPaquete || false,
        precioPaqueteUSD: pruebaEditar.precioUSD ? pruebaEditar.precioUSD.toString() : ""
      });
      setPruebas(pruebaEditar.pruebas.map((p: any) => ({
        id: p.id,
        codigo: p.codigo,
        nombre: p.nombre,
        precioUSD: p.precioUSD ? p.precioUSD.toString() : "",
        unidades: p.unidades || "",
        valoresReferencia: p.valoresReferencia || ""
      })));
    } else {
      setFormData({ categoria: "", subcategoria: "", esPaquete: false, precioPaqueteUSD: "" });
      setPruebas([{ id: null, codigo: "", nombre: "", precioUSD: "", unidades: "", valoresReferencia: "" }]);
    }
    setGuardando(false);
  }, [pruebaEditar, isOpen]);

  if (!isOpen) return null;

  const agregarFila = () => {
    setPruebas([...pruebas, { id: null, codigo: "", nombre: "", precioUSD: "", unidades: "", valoresReferencia: "" }]);
  };

  const eliminarFila = (index: number) => {
    if (pruebas.length === 1) {
      toast.warning("Debe existir al menos una prueba.");
      return;
    }
    const nuevas = [...pruebas];
    nuevas.splice(index, 1);
    setPruebas(nuevas);
  };

  const actualizarPrueba = (index: number, campo: string, valor: string) => {
    const nuevas = [...pruebas];
    nuevas[index][campo] = valor;
    setPruebas(nuevas);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación según la modalidad
    if (formData.esPaquete && !formData.precioPaqueteUSD) {
      toast.error("Debe ingresar el precio total del paquete.");
      return;
    }

    if (pruebas.some(p => !p.nombre.trim() || !p.codigo.trim() || (!formData.esPaquete && !p.precioUSD))) {
      toast.error("Complete los códigos, nombres y precios requeridos.");
      return;
    }
    
    setGuardando(true);
    try {
      await onSave({ ...formData, pruebas });
    } finally {
      setGuardando(false);
    }
  };

  const categoriasFiltradas = categoriasExistentes?.filter((c: string) => 
    c.toLowerCase().includes(formData.categoria.toLowerCase())
  ) || [];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20">
      <div className="bg-white w-full max-w-[1100px] max-h-[90vh] flex flex-col rounded-[32px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] overflow-hidden animate-in zoom-in-95 duration-100">
        
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
          <div>
            <h3 className="text-2xl font-black text-[#1D1D1F]">
              {pruebaEditar ? "Editar Estructura" : "Configurar Catálogo"}
            </h3>
            <p className="text-sm font-medium text-slate-500 mt-1">Organiza por Categoría y define si es un Paquete Cerrado o Ítems Individuales.</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X size={24} strokeWidth={2.5} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-slate-300">
          
          {/* SECTOR DE MODALIDAD (NUEVO) */}
          <div className="flex gap-4 mb-2">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, esPaquete: false })}
              className={`flex-1 flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                !formData.esPaquete 
                  ? 'border-[#0071E3] bg-[#0071E3]/5 text-[#0071E3]' 
                  : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
              }`}
            >
              <div className={`p-2 rounded-xl ${!formData.esPaquete ? 'bg-[#0071E3] text-white' : 'bg-slate-100'}`}>
                <LayoutList size={20} />
              </div>
              <div className="text-left">
                <p className="font-bold text-sm">Ítems Individuales</p>
                <p className="text-xs opacity-70">El paciente paga cada prueba por separado.</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setFormData({ ...formData, esPaquete: true })}
              className={`flex-1 flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                formData.esPaquete 
                  ? 'border-purple-500 bg-purple-50 text-purple-700' 
                  : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
              }`}
            >
              <div className={`p-2 rounded-xl ${formData.esPaquete ? 'bg-purple-500 text-white' : 'bg-slate-100'}`}>
                <Package size={20} />
              </div>
              <div className="text-left">
                <p className="font-bold text-sm">Paquete / Perfil</p>
                <p className="text-xs opacity-70">Se cobra un único precio por todo el combo.</p>
              </div>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-6 bg-[#F5F5F7] p-6 rounded-2xl border border-slate-200/60 relative">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-[#0071E3] rounded-l-2xl"></div>
            
            <div className="flex flex-col gap-1.5 pl-2 relative" ref={dropdownCategoriaRef}>
              <label className="text-[11px] font-black text-[#0071E3] uppercase tracking-widest">Categoría</label>
              <div className="relative">
                <input 
                  type="text" required 
                  value={formData.categoria} 
                  onFocus={() => setOpenDropdownCategoria(true)}
                  onChange={(e) => {
                    setFormData({ ...formData, categoria: e.target.value.toUpperCase() });
                    setOpenDropdownCategoria(true);
                  }} 
                  className="w-full px-4 py-3.5 bg-white border border-slate-200/80 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20" 
                  placeholder="Ej. HEMATOLOGIA" 
                />
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
              </div>
              {openDropdownCategoria && (
                <div className="absolute top-[100%] left-2 right-0 mt-2 bg-white border border-slate-200/80 rounded-2xl shadow-xl overflow-y-auto max-h-[220px] py-1.5 z-50">
                  {categoriasFiltradas.length > 0 ? (
                    categoriasFiltradas.map((cat: string) => (
                      <button key={cat} type="button" onClick={() => { setFormData({ ...formData, categoria: cat }); setOpenDropdownCategoria(false); }} className="w-full text-left px-4 py-3 text-sm font-bold text-slate-600 hover:bg-[#0071E3]/5 hover:text-[#0071E3] transition-colors">
                        {cat}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm font-medium text-slate-400 italic">Se creará como nueva categoría</div>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-black text-[#0071E3] uppercase tracking-widest">Subcategoría (Título)</label>
              <input 
                type="text" required
                value={formData.subcategoria} 
                onChange={(e) => setFormData({ ...formData, subcategoria: e.target.value })} 
                className="w-full px-4 py-3.5 bg-white border border-slate-200/80 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20" 
                placeholder="Ej. Hematología Completa" 
              />
            </div>

            {/* PRECIO DEL PAQUETE (Solo se muestra si es paquete) */}
            <div className={`flex flex-col gap-1.5 transition-opacity ${formData.esPaquete ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
              <label className="text-[11px] font-black text-purple-600 uppercase tracking-widest">Precio del Paquete ($)</label>
              <input 
                type="number" step="0.01"
                required={formData.esPaquete}
                value={formData.precioPaqueteUSD} 
                onChange={(e) => setFormData({ ...formData, precioPaqueteUSD: e.target.value })} 
                className="w-full px-4 py-3.5 bg-white border border-purple-200 rounded-xl text-sm font-black text-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20" 
                placeholder="0.00" 
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-[14px] font-black text-[#1D1D1F] uppercase tracking-widest">
                  {formData.esPaquete ? "Parámetros del Paquete" : "Pruebas e Ítems Individuales"}
                </h4>
              </div>
              <button type="button" onClick={agregarFila} className="text-[13px] font-bold bg-[#0071E3] text-white px-5 py-2.5 rounded-xl hover:bg-[#0077ED] transition-all flex items-center gap-2 shadow-sm">
                <Plus size={18} strokeWidth={3} /> Agregar Prueba
              </button>
            </div>

            <div className="space-y-3">
              {pruebas.map((p, index) => (
                <div key={index} className="flex gap-4 items-center bg-[#F5F5F7]/60 border border-slate-200/80 p-5 rounded-2xl shadow-sm hover:border-[#0071E3]/30 transition-colors">
                  
                  <div className={`${formData.esPaquete ? 'w-[20%]' : 'w-[12%]'} flex flex-col gap-1.5`}>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Código</label>
                    <input type="text" required value={p.codigo} onChange={(e) => actualizarPrueba(index, 'codigo', e.target.value.toUpperCase())} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20" placeholder="HE-01" />
                  </div>

                  <div className="flex-1 flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Nombre de la Prueba</label>
                    <input type="text" required value={p.nombre} onChange={(e) => actualizarPrueba(index, 'nombre', e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20" placeholder="Ej. GLOBULOS BLANCOS" />
                  </div>

                  <div className="w-[20%] flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Referencia</label>
                    <input type="text" value={p.valoresReferencia} onChange={(e) => actualizarPrueba(index, 'valoresReferencia', e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20" placeholder="4.5 - 10.0" />
                  </div>

                  <div className="w-[15%] flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Unidades</label>
                    <input type="text" value={p.unidades} onChange={(e) => actualizarPrueba(index, 'unidades', e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20" placeholder="mm3" />
                  </div>

                  {/* PRECIO INDIVIDUAL (Se oculta si es paquete) */}
                  {!formData.esPaquete && (
                    <div className="w-[15%] flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Precio ($)</label>
                      <input type="number" step="0.01" required value={p.precioUSD} onChange={(e) => actualizarPrueba(index, 'precioUSD', e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-black text-[#0071E3] focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20" placeholder="0.00" />
                    </div>
                  )}

                  <div className="flex justify-end mt-5">
                    <button type="button" onClick={() => eliminarFila(index)} className="p-3 bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-red-500 hover:bg-red-50 transition-colors shadow-sm">
                      <Trash2 size={20} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </form>

        <div className="p-6 bg-white border-t border-slate-100 flex gap-4 shrink-0 rounded-b-[32px]">
          <button type="button" onClick={onClose} disabled={guardando} className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-colors disabled:opacity-50">Cancelar</button>
          <button type="submit" onClick={handleSubmit} disabled={guardando} className="flex-1 py-4 bg-[#0071E3] text-white font-bold rounded-2xl shadow-lg hover:bg-[#0077ED] transition-colors disabled:opacity-70 flex items-center justify-center gap-2">
            {guardando && <Loader2 className="animate-spin" size={20} strokeWidth={3} />}
            {guardando ? "Guardando..." : "Guardar Estructura"}
          </button>
        </div>
      </div>
    </div>
  );
}