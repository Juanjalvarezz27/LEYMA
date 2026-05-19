"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  Calculator, Users, Wallet, Landmark, Filter, Search, Loader2, CheckCircle, 
  AlertTriangle, ChevronLeft, ChevronRight, Lock, AlertCircle, Save, X, 
  ChevronDown, ChevronUp, Activity, History
} from "lucide-react";
import { toast } from "react-toastify";
import useTasaBCV from "../../hooks/useTasaBcv";

type VistaType = "HOY" | "HISTORIAL";
type PeriodoType = "HOY" | "CUSTOM";

const formatearMetodo = (str: string) => {
  if (!str || str === "NINGUNO") return "Ninguno";
  return str.split('_').map(p => (p === 'USD' || p === 'BS') ? p : p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ');
};

export default function CierreCajaPage() {
  const { tasa: tasaBCV, loading: loadingTasa } = useTasaBCV();

  const [vista, setVista] = useState<VistaType>("HOY");
  const [periodo, setPeriodo] = useState<PeriodoType>("HOY");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  
  const [data, setData] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  
  const [busqueda, setBusqueda] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);
  const ELEMENTOS_POR_PAGINA = 30;

  // Modal de Cierre
  const [showModalCierre, setShowModalCierre] = useState(false);
  const [declaradosPorMetodo, setDeclaradosPorMetodo] = useState<Record<string, { usd: string, bs: string }>>({});
  const [declaradoGlobalUSD, setDeclaradoGlobalUSD] = useState("");
  const [declaradoGlobalBS, setDeclaradoGlobalBS] = useState("");
  const [obsCierre, setObsCierre] = useState("");
  const [guardandoCierre, setGuardandoCierre] = useState(false);

  const [isDiarioOpen, setIsDiarioOpen] = useState(true);

  const fetchCierre = async () => {
    setCargando(true);
    try {
      const timestamp = new Date().getTime();
      let url = `/api/cierre-caja?tasa=${tasaBCV || 39}&t=${timestamp}`;
      if (periodo === "CUSTOM") {
        if (!fechaInicio || !fechaFin) { setCargando(false); return; }
        url += `&periodo=CUSTOM&inicio=${fechaInicio}&fin=${fechaFin}`;
      }
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error("Error de red");
      setData(await res.json());
      setPaginaActual(1);
    } catch (error) {
      toast.error("Error al cargar el arqueo");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (!loadingTasa) fetchCierre();
  }, [periodo, loadingTasa, tasaBCV]);

  useEffect(() => {
    if (showModalCierre && data?.desglosesCaja) {
      const initialDeclaraciones: Record<string, { usd: string, bs: string }> = {};
      data.desglosesCaja.forEach((box: any) => {
        initialDeclaraciones[box.nombre] = { usd: "", bs: "" };
      });
      setDeclaradosPorMetodo(initialDeclaraciones);
      setObsCierre("");
      setDeclaradoGlobalUSD("");
      setDeclaradoGlobalBS("");
    }
  }, [showModalCierre, data]);

  const aplicarFiltroCustom = () => {
    if (!fechaInicio || !fechaFin) return toast.warning("Seleccione fechas");
    fetchCierre();
  };

  // Corrección Anti-NaN
  const formatMoney = (amount: number, isBs = false) => {
    const validAmount = Number(amount) || 0;
    if (isBs) return new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'VES' }).format(validAmount).replace('VES', 'Bs.');
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(validAmount);
  };

  const handleMetodoChange = (metodo: string, moneda: 'usd' | 'bs', valor: string) => {
    setDeclaradosPorMetodo(prev => ({
      ...prev,
      [metodo]: { ...prev[metodo], [moneda]: valor }
    }));
  };

  const calculoUSD = data?.resumen?.totalEnCajaUSD || 0;
  
  const totalDeclaradoDinamicamenteUSD = data?.desglosesCaja?.length > 0 
    ? Object.values(declaradosPorMetodo).reduce((sum, val) => sum + (parseFloat(val.usd) || 0), 0)
    : parseFloat(declaradoGlobalUSD || "0");
    
  const totalDeclaradoDinamicamenteBS = data?.desglosesCaja?.length > 0
    ? Object.values(declaradosPorMetodo).reduce((sum, val) => sum + (parseFloat(val.bs) || 0), 0)
    : parseFloat(declaradoGlobalBS || "0");

  const descuadreCalculadoUSD = totalDeclaradoDinamicamenteUSD - calculoUSD;

  const ejecutarCierre = async () => {
    if (data?.desglosesCaja?.length > 0) {
      const algunCampoVacio = Object.values(declaradosPorMetodo).some(m => m.usd === "" && m.bs === "");
      if (algunCampoVacio) return toast.warning("Complete todos los campos por método (puede ingresar 0).");
    } else {
      if (declaradoGlobalUSD === "" || declaradoGlobalBS === "") return toast.warning("Declare el monto físico.");
    }

    setGuardandoCierre(true);
    try {
      const desgloseEnriquecido = (data?.desglosesCaja || []).map((box: any) => ({
        ...box,
        declaradoUSD: parseFloat(declaradosPorMetodo[box.nombre]?.usd || "0"),
        declaradoBS: parseFloat(declaradosPorMetodo[box.nombre]?.bs || "0")
      }));

      const payload = {
        totalCalculadoUSD: data.resumen.totalEnCajaUSD,
        totalCalculadoBS: data.resumen.totalEnCajaBS,
        totalDeclaradoUSD: totalDeclaradoDinamicamenteUSD,
        totalDeclaradoBS: totalDeclaradoDinamicamenteBS,
        observaciones: obsCierre,
        tasaBCV,
        desglose: desgloseEnriquecido
      };
      
      const res = await fetch("/api/cierre-caja", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Falló el cierre");
      
      toast.success("Cierre de caja guardado exitosamente");
      setShowModalCierre(false);
      fetchCierre();
    } catch (error: any) {
      toast.error(error.message || "Error al guardar el cierre");
    } finally {
      setGuardandoCierre(false);
    }
  };

  const pacientesFiltrados = useMemo(() => {
    const lista = data?.flujoPacientes || [];
    if (!busqueda) return lista;
    return lista.filter((p: any) => 
      p.paciente.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.cedula.includes(busqueda) || p.ordenId.toString().includes(busqueda)
    );
  }, [data, busqueda]);

  const pacientesPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * ELEMENTOS_POR_PAGINA;
    return pacientesFiltrados.slice(inicio, inicio + ELEMENTOS_POR_PAGINA);
  }, [pacientesFiltrados, paginaActual]);

  const totalPaginas = Math.ceil(pacientesFiltrados.length / ELEMENTOS_POR_PAGINA) || 1;

  return (
    <div className="w-full min-h-screen p-4 md:p-8 bg-[#FAFAFA] animate-in fade-in duration-300">
      
      {showModalCierre && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#111827]/80 transition-opacity" onClick={() => !guardandoCierre && setShowModalCierre(false)}></div>
          <div className="relative w-full max-w-lg bg-white rounded-[32px] shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden max-h-[90vh]">
            <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <Lock size={24} strokeWidth={2.5} />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-[#111827]">Cuadre de Turno</h2>
                  <p className="text-sm font-bold text-slate-500">Sistema espera global: {formatMoney(calculoUSD)}</p>
                </div>
              </div>
              <button onClick={() => setShowModalCierre(false)} disabled={guardandoCierre} className="p-2 text-slate-400 hover:bg-slate-200 rounded-full transition-all"><X size={20} /></button>
            </div>
            
            <div className="p-8 flex flex-col gap-6 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
              
              <div className="flex flex-col gap-4">
                {data?.desglosesCaja?.length > 0 ? (
                  <>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Declare Montos por Método</label>
                    {data.desglosesCaja.map((box: any) => (
                      <div key={box.nombre} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="text-sm font-extrabold text-[#111827] uppercase tracking-wide">{formatearMetodo(box.nombre)}</h4>
                          <span className="text-xs font-bold text-slate-400">Esperado: <strong className="text-slate-600">{formatMoney(box.netoUSD)}</strong></span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">$</span>
                            <input type="number" step="0.01" value={declaradosPorMetodo[box.nombre]?.usd || ""} onChange={(e) => handleMetodoChange(box.nombre, 'usd', e.target.value)} className="w-full pl-7 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-black text-[#111827] outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" placeholder="0.00" />
                          </div>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">Bs</span>
                            <input type="number" step="0.01" value={declaradosPorMetodo[box.nombre]?.bs || ""} onChange={(e) => handleMetodoChange(box.nombre, 'bs', e.target.value)} className="w-full pl-8 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-black text-[#111827] outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" placeholder="0.00" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center">
                    <p className="text-sm font-bold text-slate-500 mb-4">No hay métodos registrados hoy. Declare $0.00 para cerrar.</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Global USD</label>
                        <input type="number" step="0.01" value={declaradoGlobalUSD} onChange={(e) => setDeclaradoGlobalUSD(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-black outline-none focus:ring-2 focus:ring-indigo-500/20" placeholder="0.00" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Global BS</label>
                        <input type="number" step="0.01" value={declaradoGlobalBS} onChange={(e) => setDeclaradoGlobalBS(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-black outline-none focus:ring-2 focus:ring-indigo-500/20" placeholder="0.00" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {(totalDeclaradoDinamicamenteUSD > 0 || totalDeclaradoDinamicamenteBS > 0 || declaradoGlobalUSD === "0") && (
                <div className={`p-4 rounded-2xl border flex items-start gap-3 ${descuadreCalculadoUSD === 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                  {descuadreCalculadoUSD === 0 ? <CheckCircle size={24} className="shrink-0" /> : <AlertTriangle size={24} className="shrink-0" />}
                  <div>
                    <h4 className="text-sm font-extrabold">{descuadreCalculadoUSD === 0 ? 'Cuadre Global Perfecto' : 'Descuadre Detectado en Totales'}</h4>
                    <p className="text-xs font-bold opacity-80 mt-0.5">
                      Físico Total: {formatMoney(totalDeclaradoDinamicamenteUSD)} | Diferencia: {formatMoney(descuadreCalculadoUSD)}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Observaciones</label>
                <textarea value={obsCierre} onChange={(e) => setObsCierre(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-[#111827] outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all h-20 resize-none" placeholder="Motivo del descuadre o nota adicional..."></textarea>
              </div>

              <button onClick={ejecutarCierre} disabled={guardandoCierre} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-extrabold rounded-2xl transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 shrink-0">
                {guardandoCierre ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />} Confirmar y Cerrar Turno
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-8 gap-6 pt-2">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#111827] flex items-center gap-3">
            <Calculator className="text-indigo-600" size={36} strokeWidth={2.5} />
            Arqueo y Cierre
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-2 flex flex-wrap items-center gap-3">
            <span>Tasa Aplicada: <strong className="text-[#111827]">Bs. {tasaBCV?.toFixed(2) || "---"}</strong></span>
            {data?.ultimoCierre && (
              <>
                <span className="hidden md:inline w-1 h-1 rounded-full bg-slate-300"></span>
                <span>Último cierre: <strong className="text-[#111827]">{new Date(data.ultimoCierre.fecha).toLocaleString('es-VE')}</strong> por {data.ultimoCierre.por}</span>
              </>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm w-max">
            {[
              { id: "HOY", label: "Caja de Hoy", icon: <Wallet size={16}/> }, 
              { id: "HISTORIAL", label: "Historial de Cierres", icon: <History size={16}/> }
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => setVista(opt.id as VistaType)}
                className={`px-5 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
                  vista === opt.id ? "bg-indigo-50 text-indigo-700" : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                }`}
              >
                {opt.icon} {opt.label}
              </button>
            ))}
          </div>

          {vista === "HOY" && (
            <button 
              onClick={() => setShowModalCierre(true)} 
              disabled={data?.yaCerroHoy}
              className={`px-6 py-3 text-white text-xs font-extrabold rounded-2xl transition-all shadow-md flex items-center gap-2 ${data?.yaCerroHoy ? 'bg-emerald-500 cursor-not-allowed' : 'bg-[#111827] hover:bg-black'}`}
            >
              {data?.yaCerroHoy ? <CheckCircle size={16} strokeWidth={2.5} /> : <Lock size={16} strokeWidth={2.5} />}
              {data?.yaCerroHoy ? "Turno Cerrado" : "Ejecutar Cierre"}
            </button>
          )}
        </div>
      </div>

      {(cargando || loadingTasa) ? (
        <div className="flex-1 flex flex-col items-center justify-center py-32 text-slate-400 font-bold gap-3">
          <Loader2 className="animate-spin text-indigo-600" size={48} /> {vista === "HOY" ? "Auditando registros..." : "Cargando historial..."}
        </div>
      ) : vista === "HISTORIAL" ? (
        
        <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="px-8 py-6 border-b border-slate-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <History size={24} />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-[#111827]">Historial de Cierres</h2>
              <p className="text-sm font-medium text-slate-500">Registro inmutable de cortes de caja pasados.</p>
            </div>
          </div>
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50/50 text-[11px] uppercase tracking-widest text-slate-400 font-extrabold border-b border-slate-100">
                  <th className="px-8 py-5">Fecha y Hora</th>
                  <th className="px-8 py-5">Responsable</th>
                  <th className="px-8 py-5 text-right">Sistema (USD)</th>
                  <th className="px-8 py-5 text-right">Físico Declarado (USD)</th>
                  <th className="px-8 py-5 text-center">Estatus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(data?.historialCierres || []).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-16 text-center text-slate-500 font-bold text-base">
                      No hay cierres de caja registrados aún.
                    </td>
                  </tr>
                ) : (
                  (data?.historialCierres || []).map((c: any) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-8 py-5 whitespace-nowrap text-base font-extrabold text-[#111827]">
                        {new Date(c.fechaCierre).toLocaleDateString('es-VE')}
                        <span className="text-xs font-bold text-slate-400 ml-2">{new Date(c.fechaCierre).toLocaleTimeString('es-VE', {hour:'2-digit', minute:'2-digit'})}</span>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap text-sm font-bold text-slate-600">
                        {c.realizadoPor?.nombre || "N/A"}
                      </td>
                      <td className="px-8 py-5 text-right whitespace-nowrap text-base font-black text-slate-800">
                        {formatMoney(c.totalCalculadoUSD)}
                      </td>
                      <td className="px-8 py-5 text-right whitespace-nowrap text-base font-black text-indigo-600">
                        {formatMoney(c.totalDeclaradoUSD)}
                      </td>
                      <td className="px-8 py-5 text-center whitespace-nowrap">
                        {c.descuadreUSD === 0 ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 text-xs font-black rounded-xl border border-emerald-100">
                            <CheckCircle size={12} /> Cuadrado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 text-xs font-black rounded-xl border border-red-100" title={`Descuadre: ${formatMoney(c.descuadreUSD)}`}>
                            <AlertTriangle size={12} /> Descuadre
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      ) : (

        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {data?.yaCerroHoy && (
            <div className="w-full bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-4 text-emerald-800 shadow-sm">
              <div className="p-2 bg-emerald-100 rounded-xl"><CheckCircle size={24} /></div>
              <div>
                <h3 className="font-extrabold text-sm uppercase tracking-wide">El turno de hoy ha sido cerrado</h3>
                <p className="text-xs font-medium opacity-80">El dinero físico fue auditado. Los nuevos movimientos que registres entrarán en la caja de mañana.</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard title="Dinero Líquido Real" usd={data?.resumen?.totalEnCajaUSD} bs={data?.resumen?.totalEnCajaBS} icon={<Landmark size={24} />} color="text-emerald-600" bgColor="bg-emerald-50" />
            <StatCard title="Por Cobrar (Pendiente)" usd={data?.resumen?.cuentasPorCobrarUSD} bs={data?.resumen?.cuentasPorCobrarBS} icon={<AlertCircle size={24} />} color="text-amber-600" bgColor="bg-amber-50" />
            <StatCard title="Flujo de Pacientes" usd={data?.resumen?.pacientesAtendidos} icon={<Users size={24} />} color="text-indigo-600" bgColor="bg-indigo-50" isCount subtitle="Atenciones hoy" />
          </div>

          <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm relative overflow-hidden">
            <h3 className="text-xl font-extrabold text-[#111827] mb-6 flex items-center gap-3 relative z-10">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><Activity size={24} /></div>
              Flujo de Caja por Método
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 relative z-10">
              {(data?.desglosesCaja || []).map((box: any, index: number) => (
                <div key={index} className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100 hover:border-indigo-100 hover:bg-white hover:shadow-lg hover:shadow-indigo-50 transition-all duration-300 group flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-sm font-extrabold text-slate-800 truncate uppercase tracking-wider group-hover:text-indigo-600 transition-colors">{formatearMetodo(box.nombre)}</h4>
                    <div className="w-10 h-10 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors">
                      <Wallet size={18} />
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center text-xs font-bold bg-white border border-slate-100 p-2.5 rounded-xl">
                      <span className="text-slate-500">Ingresos</span><span className="text-emerald-600">{formatMoney(box.ingresosUSD)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-bold bg-white border border-slate-100 p-2.5 rounded-xl">
                      <span className="text-slate-500">Egresos</span><span className="text-red-500">-{formatMoney(box.gastosUSD)}</span>
                    </div>
                    <div className="mt-3 pt-4 border-t border-slate-200 flex justify-between items-end">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">En Caja</span>
                      <span className="text-2xl font-extrabold text-[#111827]">{formatMoney(box.netoUSD)}</span>
                    </div>
                  </div>
                </div>
              ))}
              {(data?.desglosesCaja || []).length === 0 && (
                <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                  <Wallet size={40} className="mb-3 text-slate-300" />
                  <p className="text-base font-bold text-slate-500">Caja vacía. No hay movimientos hoy.</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden transition-all duration-300">
            <div className="px-8 py-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setIsDiarioOpen(!isDiarioOpen)}>
              <div className="flex items-center gap-5">
                <div className={`p-3 rounded-2xl transition-colors ${isDiarioOpen ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-slate-100 text-slate-500'}`}>
                  <Users size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-[#111827]">Diario de Pacientes</h2>
                  <p className="text-sm font-medium text-slate-500 mt-1">Detalle de atenciones, facturación y cuentas por cobrar.</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {isDiarioOpen && (
                  <div className="relative w-full lg:w-80" onClick={e => e.stopPropagation()}>
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input type="text" placeholder="Buscar cédula, paciente..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm transition-all" />
                  </div>
                )}
                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-[#111827] transition-colors">
                  {isDiarioOpen ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                </div>
              </div>
            </div>

            <div className={`grid transition-all duration-300 ease-in-out ${isDiarioOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none'}`}>
              <div className="overflow-hidden">
                <div className="overflow-x-auto w-full border-t border-slate-100">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                      <tr className="bg-slate-50/50 text-[11px] uppercase tracking-widest text-slate-400 font-extrabold border-b border-slate-100">
                        <th className="px-8 py-5">ID / Registro</th>
                        <th className="px-8 py-5">Paciente</th>
                        <th className="px-8 py-5">Método Aplicado</th>
                        <th className="px-8 py-5">Estado Financiero</th>
                        <th className="px-8 py-5 text-right">Facturación</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {pacientesPaginados.length === 0 ? (
                        <tr><td colSpan={5} className="px-8 py-16 text-center text-slate-500 font-bold text-base">No se encontraron pacientes para este filtro.</td></tr>
                      ) : (
                        pacientesPaginados.map((p: any) => (
                          <tr key={p.ordenId} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-8 py-5 whitespace-nowrap">
                              <span className="text-base font-extrabold text-[#111827] block">#{p.ordenId.toString().padStart(5, '0')}</span>
                              <span className="text-xs font-bold text-slate-400 mt-1 block">Reg: {p.registradoPor}</span>
                            </td>
                            <td className="px-8 py-5 max-w-[280px] whitespace-normal break-words">
                              <span className="text-sm font-extrabold text-[#111827] uppercase tracking-wide block">{p.paciente}</span>
                              <span className="text-xs font-bold text-slate-500 mt-0.5 block">V-{p.cedula}</span>
                            </td>
                            <td className="px-8 py-5 whitespace-nowrap">
                              <span className="text-sm font-bold text-slate-600 px-3 py-1.5 bg-slate-100 rounded-lg">{formatearMetodo(p.metodoUsado)}</span>
                            </td>
                            <td className="px-8 py-5 whitespace-nowrap">
                              {p.estadoPago === 'PAGADO' ? (
                                <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-black rounded-xl border border-emerald-200"><CheckCircle size={14} /> Pagado / Cerrado</span>
                              ) : (
                                <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 text-xs font-black rounded-xl border border-amber-200"><AlertTriangle size={14} /> Por Cobrar</span>
                              )}
                            </td>
                            <td className="px-8 py-5 text-right whitespace-nowrap">
                              <span className="text-lg font-extrabold text-[#111827] block">{formatMoney(p.totalUSD)}</span>
                              <span className="text-xs font-bold text-slate-400 block mt-0.5">{formatMoney(p.totalBS, true)}</span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {totalPaginas > 1 && (
                  <div className="px-8 py-5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-500">Página <strong className="text-[#111827]">{paginaActual}</strong> de <strong className="text-[#111827]">{totalPaginas}</strong></span>
                    <div className="flex gap-2">
                      <button onClick={() => setPaginaActual(p => Math.max(p - 1, 1))} disabled={paginaActual === 1} className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-[#111827] disabled:opacity-40 transition-colors shadow-sm"><ChevronLeft size={18} strokeWidth={2.5}/></button>
                      <button onClick={() => setPaginaActual(p => Math.min(p + 1, totalPaginas))} disabled={paginaActual === totalPaginas} className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-[#111827] disabled:opacity-40 transition-colors shadow-sm"><ChevronRight size={18} strokeWidth={2.5}/></button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

function StatCard({ title, usd, bs, icon, color, bgColor, isCount, subtitle }: any) {
  return (
    <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
      <div>
        <div className={`w-14 h-14 rounded-2xl ${bgColor} ${color} flex items-center justify-center mb-6`}>{icon}</div>
        <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">{title}</p>
        <h3 className="text-3xl font-extrabold text-[#111827] mt-2">
          {isCount ? usd : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(usd || 0)}
        </h3>
      </div>
      <div className="mt-4 pt-4 border-t border-slate-100">
        <p className="text-sm font-bold text-slate-500">
          {isCount ? subtitle : new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'VES' }).format(bs || 0).replace('VES', 'Bs.')}
        </p>
      </div>
    </div>
  );
}