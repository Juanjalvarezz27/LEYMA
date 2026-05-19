"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  Calculator, Users,Wallet, Landmark, Filter, Search, Loader2, CheckCircle, AlertTriangle, FileText, ChevronLeft, ChevronRight, Lock, AlertCircle, Save, X, ChevronDown, ChevronUp, Activity
} from "lucide-react";
import { toast } from "react-toastify";
import useTasaBCV from "../../hooks/useTasaBcv";

type PeriodoType = "HOY" | "CUSTOM";

const formatearMetodo = (str: string) => {
  if (!str || str === "NINGUNO") return "Ninguno";
  return str.split('_').map(p => (p === 'USD' || p === 'BS') ? p : p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ');
};

export default function CierreCajaPage() {
  const { tasa: tasaBCV, loading: loadingTasa } = useTasaBCV();

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
  const [declaradoUSD, setDeclaradoUSD] = useState("");
  const [declaradoBS, setDeclaradoBS] = useState("");
  const [obsCierre, setObsCierre] = useState("");
  const [guardandoCierre, setGuardandoCierre] = useState(false);

  // Acordeón Diario de Pacientes
  const [isDiarioOpen, setIsDiarioOpen] = useState(false);

  const fetchCierre = async () => {
    setCargando(true);
    try {
      const timestamp = new Date().getTime();
      let url = `/api/cierre-caja?periodo=${periodo}&tasa=${tasaBCV || 39}&t=${timestamp}`;
      if (periodo === "CUSTOM") {
        if (!fechaInicio || !fechaFin) { setCargando(false); return; }
        url += `&inicio=${fechaInicio}&fin=${fechaFin}`;
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
    if (periodo !== "CUSTOM" && !loadingTasa) fetchCierre();
  }, [periodo, loadingTasa, tasaBCV]);

  const aplicarFiltroCustom = () => {
    if (!fechaInicio || !fechaFin) return toast.warning("Seleccione fechas");
    fetchCierre();
  };

  const formatMoney = (amount: number, isBs = false) => {
    if (isBs) return new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'VES' }).format(amount).replace('VES', 'Bs.');
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const ejecutarCierre = async () => {
    if (!declaradoUSD || !declaradoBS) return toast.warning("Declare los montos físicos.");
    setGuardandoCierre(true);
    try {
      const payload = {
        totalCalculadoUSD: data.resumen.totalEnCajaUSD,
        totalCalculadoBS: data.resumen.totalEnCajaBS,
        totalDeclaradoUSD: parseFloat(declaradoUSD),
        totalDeclaradoBS: parseFloat(declaradoBS),
        observaciones: obsCierre,
        tasaBCV,
        desglose: data.desglosesCaja
      };
      
      const res = await fetch("/api/cierre-caja", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Falló el cierre");
      
      toast.success("Cierre de caja guardado exitosamente");
      setShowModalCierre(false);
      fetchCierre();
    } catch (error) {
      toast.error("Error al guardar el cierre");
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

  // CÁLCULOS DEL MODAL DE CIERRE
  const calculoUSD = data?.resumen?.totalEnCajaUSD || 0;
  const descuadreCalculadoUSD = parseFloat(declaradoUSD || "0") - calculoUSD;

  return (
    <div className="w-full min-h-screen pb-20 pr-4 animate-in fade-in duration-300">
      
      {/* MODAL DE CIERRE */}
      {showModalCierre && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#1D1D1F]/70 transition-opacity" onClick={() => !guardandoCierre && setShowModalCierre(false)}></div>
          <div className="relative w-full max-w-md bg-white rounded-[24px] shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50 rounded-t-[24px]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                  <Lock size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-[#1D1D1F]">Cuadre de Turno</h2>
                  <p className="text-xs font-bold text-slate-400">Sistema espera: {formatMoney(calculoUSD)}</p>
                </div>
              </div>
              <button onClick={() => setShowModalCierre(false)} disabled={guardandoCierre} className="p-2 text-slate-400 hover:bg-slate-200 rounded-full transition-all"><X size={18} /></button>
            </div>
            <div className="p-6 flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Efectivo Físico USD</label>
                  <input type="number" step="0.01" value={declaradoUSD} onChange={(e) => setDeclaradoUSD(e.target.value)} className="w-full px-4 py-3 bg-[#F5F5F7] border border-slate-200 rounded-xl text-sm font-black text-[#1D1D1F] outline-none focus:ring-2 focus:ring-[#0071E3]/20" placeholder="0.00" />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Efectivo Físico BS</label>
                  <input type="number" step="0.01" value={declaradoBS} onChange={(e) => setDeclaradoBS(e.target.value)} className="w-full px-4 py-3 bg-[#F5F5F7] border border-slate-200 rounded-xl text-sm font-black text-[#1D1D1F] outline-none focus:ring-2 focus:ring-[#0071E3]/20" placeholder="0.00" />
                </div>
              </div>
              
              {declaradoUSD && (
                <div className={`p-4 rounded-xl border flex items-start gap-3 ${descuadreCalculadoUSD === 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                  {descuadreCalculadoUSD === 0 ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                  <div>
                    <h4 className="text-sm font-black">{descuadreCalculadoUSD === 0 ? 'Caja Cuadrada Perfectamente' : 'Descuadre Detectado'}</h4>
                    <p className="text-xs font-bold opacity-80">Diferencia: {formatMoney(descuadreCalculadoUSD)}</p>
                  </div>
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Observaciones / Motivo de Descuadre</label>
                <textarea value={obsCierre} onChange={(e) => setObsCierre(e.target.value)} className="w-full px-4 py-3 bg-[#F5F5F7] border border-slate-200 rounded-xl text-sm font-bold text-[#1D1D1F] outline-none h-24 resize-none" placeholder="Opcional..."></textarea>
              </div>

              <button onClick={ejecutarCierre} disabled={guardandoCierre} className="w-full py-4 bg-[#1D1D1F] hover:bg-black text-white text-sm font-black rounded-xl transition-all flex items-center justify-center gap-2">
                {guardandoCierre ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Guardar Cierre Inmutable
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER PRINCIPAL */}
      <div className="mb-6 flex flex-col 2xl:flex-row 2xl:items-center 2xl:justify-between gap-4 pt-2">
        <div>
          <h1 className="font-title text-3xl font-bold text-[#1D1D1F] tracking-tight flex items-center gap-3">
            <Calculator className="text-[#0071E3]" size={32} strokeWidth={2.5} />
            Arqueo y Cierre
          </h1>
          <p className="text-[#86868B] mt-1.5 font-medium text-sm">
            Tasa Aplicada: <span className="font-bold text-[#1D1D1F]">Bs. {tasaBCV?.toFixed(2) || "---"}</span> 
            {data?.ultimoCierre && <span className="ml-4 pl-4 border-l border-slate-300">Último cierre: {new Date(data.ultimoCierre.fecha).toLocaleString('es-VE')} por {data.ultimoCierre.por}</span>}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-start 2xl:justify-end gap-3">
          <button onClick={() => setShowModalCierre(true)} className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-2">
            <Lock size={16} strokeWidth={2.5} /> Ejecutar Cierre
          </button>

          <div className="flex items-center bg-[#F5F5F7] p-1.5 rounded-xl border border-slate-200/60 w-max">
            {["HOY", "CUSTOM"].map((opt) => (
              <button
                key={opt}
                onClick={() => setPeriodo(opt as PeriodoType)}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
                  periodo === opt ? "bg-white text-[#0071E3] shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {opt === "CUSTOM" ? "Otro Día" : "Caja de Hoy"}
              </button>
            ))}
          </div>

          {periodo === "CUSTOM" && (
            <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm animate-in fade-in w-max">
              <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="px-2 py-1.5 bg-[#F5F5F7] rounded-lg text-xs font-bold outline-none" />
              <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="px-2 py-1.5 bg-[#F5F5F7] rounded-lg text-xs font-bold outline-none" />
              <button onClick={aplicarFiltroCustom} className="p-2 bg-[#0071E3] text-white rounded-lg hover:bg-[#0077ED]"><Filter size={14} /></button>
            </div>
          )}
        </div>
      </div>

      {(cargando || loadingTasa) ? (
        <div className="flex-1 flex flex-col items-center justify-center py-32 text-slate-400 font-bold gap-3">
          <Loader2 className="animate-spin text-[#0071E3]" size={48} /> Auditando registros de caja...
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* TOTALES ESTRICTOS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white p-5 rounded-[24px] border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dinero Líquido Real</p>
                <h3 className="text-2xl font-black text-emerald-600 mt-1">{formatMoney(data?.resumen?.totalEnCajaUSD || 0)}</h3>
                <p className="text-xs font-bold text-slate-400">{formatMoney(data?.resumen?.totalEnCajaBS || 0, true)}</p>
              </div>
              <Landmark size={36} className="text-emerald-500/20" />
            </div>
            <div className="bg-white p-5 rounded-[24px] border border-orange-200/80 shadow-sm bg-orange-50/30 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest flex items-center gap-1"><AlertCircle size={12}/> Por Cobrar (Pendiente)</p>
                <h3 className="text-2xl font-black text-orange-600 mt-1">{formatMoney(data?.resumen?.cuentasPorCobrarUSD || 0)}</h3>
                <p className="text-xs font-bold text-orange-400">{formatMoney(data?.resumen?.cuentasPorCobrarBS || 0, true)}</p>
              </div>
              <Wallet size={36} className="text-orange-500/20" />
            </div>
            <div className="bg-white p-5 rounded-[24px] border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Flujo de Pacientes</p>
                <h3 className="text-2xl font-black text-slate-800 mt-1">{data?.resumen?.pacientesAtendidos || 0} Registros</h3>
              </div>
              <Users size={36} className="text-slate-500/20" />
            </div>
          </div>

          {/* DESGLOSE TÉCNICO NETO (Ingresos - Gastos por método) */}
          <div className="bg-white p-6 rounded-[24px] border border-slate-200/80 shadow-md bg-gradient-to-br from-white to-slate-50 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
              <Activity size={120} />
            </div>
            <h3 className="text-xl font-black text-[#1D1D1F] mb-6 flex items-center gap-3 relative z-10">
              <div className="p-2 bg-[#0071E3]/10 text-[#0071E3] rounded-xl">
                <Activity size={24} />
              </div>
              Flujo de Caja por Método de Pago
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 relative z-10">
              {(data?.desglosesCaja || []).map((box: any, index: number) => (
                <div key={index} className="p-5 bg-white rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300 group flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-black text-slate-800 truncate uppercase tracking-wide group-hover:text-[#0071E3] transition-colors">{formatearMetodo(box.nombre)}</h4>
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-[#0071E3]/10 group-hover:text-[#0071E3] transition-colors">
                      <Wallet size={14} />
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2.5">
                    <div className="flex justify-between items-center text-xs font-bold bg-emerald-50/50 p-2 rounded-lg">
                      <span className="text-slate-500">Ingresos</span>
                      <span className="text-emerald-600">{formatMoney(box.ingresosUSD)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-bold bg-red-50/50 p-2 rounded-lg">
                      <span className="text-slate-500">Egresos</span>
                      <span className="text-red-500">-{formatMoney(box.gastosUSD)}</span>
                    </div>
                    <div className="mt-2 pt-3 border-t border-slate-100 flex justify-between items-end">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saldo Neto</span>
                      <span className="text-xl font-black text-[#1D1D1F]">{formatMoney(box.netoUSD)}</span>
                    </div>
                  </div>
                </div>
              ))}
              {(data?.desglosesCaja || []).length === 0 && (
                <div className="col-span-full py-10 flex flex-col items-center justify-center text-slate-400 bg-white/50 rounded-2xl border border-dashed border-slate-300">
                  <Wallet size={32} className="mb-2 opacity-50" />
                  <p className="text-sm font-bold">Caja vacía. No hay movimientos registrados.</p>
                </div>
              )}
            </div>
          </div>

          {/* TABLA DE PACIENTES */}
          <div className="bg-white rounded-[24px] border border-slate-200/80 shadow-sm overflow-hidden transition-all duration-300">
            <div 
              className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col lg:flex-row lg:items-center justify-between gap-4 cursor-pointer hover:bg-slate-100/50 transition-colors"
              onClick={() => setIsDiarioOpen(!isDiarioOpen)}
            >
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-xl transition-colors ${isDiarioOpen ? 'bg-[#0071E3] text-white' : 'bg-slate-200 text-slate-500'}`}>
                  <Users size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-[#1D1D1F] flex items-center gap-2">
                    Diario de Pacientes
                  </h2>
                  <p className="text-xs font-medium text-slate-500 mt-1">Detalle de atenciones y cuentas por cobrar.</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {isDiarioOpen && (
                  <div className="relative w-full lg:w-80" onClick={e => e.stopPropagation()}>
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="text" placeholder="Buscar cédula, paciente..."
                      value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-[#0071E3]/20 shadow-sm"
                    />
                  </div>
                )}
                <div className="w-10 h-10 rounded-full bg-white shadow-sm border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors">
                  {isDiarioOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </div>
            </div>

            <div className={`grid transition-all duration-300 ease-in-out ${isDiarioOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none'}`}>
              <div className="overflow-hidden">
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                      <tr className="bg-white text-xs uppercase tracking-widest text-slate-400 font-black border-b border-slate-100">
                        <th className="px-6 py-4">ID</th>
                        <th className="px-6 py-4">Paciente</th>
                        <th className="px-6 py-4">Método de Pago</th>
                        <th className="px-6 py-4">Estatus Cuentas</th>
                        <th className="px-6 py-4 text-right">Facturado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {pacientesPaginados.map((p: any) => (
                        <tr key={p.ordenId} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-base font-black text-slate-400">#{p.ordenId.toString().padStart(5, '0')}</td>
                          <td className="px-6 py-4 max-w-[260px] whitespace-normal break-words">
                            <span className="text-base font-black text-[#1D1D1F] uppercase tracking-wide block">{p.paciente}</span>
                            <span className="text-xs font-bold text-slate-400">V-{p.cedula}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-bold text-slate-600 block">{formatearMetodo(p.metodoUsado)}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {p.estadoPago === 'PAGADO' ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 text-xs font-black rounded-lg border border-emerald-100"><CheckCircle size={12} /> Pagado</span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-50 text-orange-500 text-xs font-black rounded-lg border border-orange-100"><AlertTriangle size={12} /> Por Cobrar</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right whitespace-nowrap">
                            <span className="text-lg font-black text-slate-800 block">{formatMoney(p.totalUSD)}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {totalPaginas > 1 && (
                  <div className="px-6 py-4 bg-white border-t flex justify-between">
                    <span className="text-sm font-bold text-slate-500">Pág {paginaActual} de {totalPaginas}</span>
                    <div className="flex gap-2">
                      <button onClick={() => setPaginaActual(p => Math.max(p - 1, 1))} disabled={paginaActual === 1} className="p-2 border rounded-xl disabled:opacity-40"><ChevronLeft size={18}/></button>
                      <button onClick={() => setPaginaActual(p => Math.min(p + 1, totalPaginas))} disabled={paginaActual === totalPaginas} className="p-2 border rounded-xl disabled:opacity-40"><ChevronRight size={18}/></button>
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