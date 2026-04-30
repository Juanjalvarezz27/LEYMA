"use client";

import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { FileSignature } from "lucide-react";
import useTasaBCV from "../../hooks/useTasaBcv";

import BuscadorPaciente from "../../components/registro/BuscadorPaciente";
import TarjetaPaciente from "../../components/registro/TarjetaPaciente";
import FormularioPaciente from "../../components/registro/FormularioPaciente";
import SeleccionPruebas from "../../components/registro/SeleccionPruebas";
import ResumenPago from "../../components/registro/ResumenPago";

export default function RegistroPage() {
  const [cedulaBusqueda, setCedulaBusqueda] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<any>(null);
  const [isCreandoNuevo, setIsCreandoNuevo] = useState(false);
  const [guardandoPaciente, setGuardandoPaciente] = useState(false);
  const [formData, setFormData] = useState({
    esBebe: false, cedula: "", nombreCompleto: "", fechaNacimiento: "",
    sexo: "M", telefono: "", correo: "", direccion: "", observaciones: ""
  });

  const [pruebasCatalogo, setPruebasCatalogo] = useState<any[]>([]);
  const [pruebasSeleccionadas, setPruebasSeleccionadas] = useState<any[]>([]);
  const { tasa } = useTasaBCV();
  const tasaBCV = tasa ?? 36.5; 

  useEffect(() => {
    const fetchCatalogo = async () => {
      try {
        const res = await fetch("/api/pruebas");
        const data = await res.json();
        setPruebasCatalogo(data.filter((p: any) => p.activa));
      } catch (e) {
        toast.error("Error al cargar el catálogo de pruebas");
      }
    };
    fetchCatalogo();
  }, []);

  const buscarPaciente = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!cedulaBusqueda.trim()) return;
    setBuscando(true);
    try {
      const res = await fetch(`/api/pacientes?cedula=${cedulaBusqueda}`);
      const data = await res.json();
      if (data) {
        setPacienteSeleccionado(data);
        setIsCreandoNuevo(false);
        toast.success("Paciente encontrado");
      } else {
        toast.info("Paciente no registrado. Complete los datos.");
        setFormData({ ...formData, cedula: cedulaBusqueda, esBebe: false });
        setIsCreandoNuevo(true);
      }
    } catch (error) { 
      toast.error("Error de conexión al buscar paciente"); 
    } finally { 
      setBuscando(false); 
    }
  };

  const iniciarRegistroSinCedula = () => {
    setFormData({ ...formData, esBebe: true, cedula: "" });
    setIsCreandoNuevo(true);
  };

  const registrarNuevoPaciente = async (e: React.FormEvent) => {
    e.preventDefault();
    const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    if (!dateRegex.test(formData.fechaNacimiento)) {
      toast.error("Formato de fecha inválido. Use DD/MM/AAAA");
      return;
    }
    const [dia, mes, ano] = formData.fechaNacimiento.split('/');
    const fechaISO = `${ano}-${mes}-${dia}`;
    
    setGuardandoPaciente(true);
    try {
      const res = await fetch("/api/pacientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, fechaNacimiento: fechaISO }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success("Paciente registrado exitosamente");
      setPacienteSeleccionado(data);
      setIsCreandoNuevo(false);
    } catch (error: any) { 
      toast.error(error.message); 
    } finally { 
      setGuardandoPaciente(false); 
    }
  };

  const limpiarSeleccion = () => {
    setPacienteSeleccionado(null);
    setCedulaBusqueda("");
    setIsCreandoNuevo(false);
    setPruebasSeleccionadas([]);
    setFormData({
      esBebe: false, cedula: "", nombreCompleto: "", fechaNacimiento: "",
      sexo: "M", telefono: "", correo: "", direccion: "", observaciones: ""
    });
  };

  // --- FUNCIÓN REAL DE GUARDADO EN BD ---
  const finalizarOrden = async (resumenData: any) => {
    
    if (resumenData.estado === "CERRADA") {
      if (resumenData.restanteUSD > 0.05) {
         toast.error(`La orden no puede ser CERRADA porque aún hay un saldo pendiente de $${resumenData.restanteUSD.toFixed(2)}.`);
         return;
      }
    }

    toast.info(resumenData.estado === "BORRADOR" ? "Guardando borrador..." : "Procesando y cerrando orden...");

    const ordenParaGuardar = {
      pacienteId: pacienteSeleccionado.id,
      estado: resumenData.estado, 
      tasaBCV: tasaBCV,
      subtotalUSD: resumenData.subtotalUSD,
      totalUSD: resumenData.totalFinalUSD,
      totalBS: resumenData.totalFinalBS,
      descuentoGeneral: resumenData.descuentoGeneral,
      tipoDescuentoGral: resumenData.tipoDescGral,
      pruebas: pruebasSeleccionadas.map(p => ({
        pruebaId: p.id,
        cantidad: p.cantidad,
        precioCongelado: p.precioUSD,
        descuentoInd: p.descInd || 0,
        tipoDescuentoInd: p.tipoDescInd || "PORCENTAJE"
      })),
      pagos: resumenData.pagos.filter((p: any) => p.metodoId && p.monto > 0).map((p: any) => ({
        metodoId: p.metodoId,
        monto: p.monto,
        moneda: p.moneda || "USD",
        referencia: p.referencia || ""
      }))
    };

    try {
      // LLAMADA AL ENDPOINT POST
      const res = await fetch("/api/ordenes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ordenParaGuardar)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      if (resumenData.estado === "BORRADOR") {
         toast.success("Borrador guardado. La orden quedó pendiente.");
      } else {
         toast.success("¡Orden Cerrada y Procesada con éxito!");
      }
      
      limpiarSeleccion(); 
    } catch (error: any) {
      toast.error(error.message || "Error al guardar la orden en la BD");
    }
  };

  return (
    <div className="h-full flex flex-col pb-10 overflow-y-auto pr-4 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full">
      <div className="mb-8">
        <h1 className="font-title text-4xl font-bold text-[#1D1D1F] tracking-tight flex items-center gap-3">
          <FileSignature className="text-[#0071E3]" size={36} strokeWidth={2.5} />
          Nueva Orden de Laboratorio
        </h1>
        <p className="text-[#86868B] mt-2 font-medium text-[15px]">Gestión integral de pacientes, pruebas y facturación.</p>
      </div>

      <section className="bg-white rounded-[24px] border border-slate-200/80 shadow-sm p-8 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-full bg-[#0071E3]/10 flex items-center justify-center text-[#0071E3] font-bold shrink-0">1</div>
          <h2 className="text-xl font-bold text-[#1D1D1F]">Datos del Paciente</h2>
        </div>
        {!pacienteSeleccionado && !isCreandoNuevo && (
          <BuscadorPaciente 
            cedulaBusqueda={cedulaBusqueda} setCedulaBusqueda={setCedulaBusqueda}
            buscando={buscando} buscarPaciente={buscarPaciente}
            iniciarRegistroSinCedula={iniciarRegistroSinCedula}
          />
        )}
        {pacienteSeleccionado && <TarjetaPaciente paciente={pacienteSeleccionado} limpiarSeleccion={limpiarSeleccion} />}
        {!pacienteSeleccionado && isCreandoNuevo && (
          <FormularioPaciente 
            formData={formData} setFormData={setFormData}
            registrarNuevoPaciente={registrarNuevoPaciente}
            guardandoPaciente={guardandoPaciente} limpiarSeleccion={limpiarSeleccion}
          />
        )}
      </section>

      {pacienteSeleccionado && (
        <SeleccionPruebas 
          pruebasCatalogo={pruebasCatalogo} pruebasSeleccionadas={pruebasSeleccionadas}
          setPruebasSeleccionadas={setPruebasSeleccionadas} tasaBCV={tasaBCV}
        />
      )}

      {pruebasSeleccionadas.length > 0 && (
        <ResumenPago 
          pruebasSeleccionadas={pruebasSeleccionadas} setPruebasSeleccionadas={setPruebasSeleccionadas}
          tasaBCV={tasaBCV} onFinalizar={finalizarOrden}
        />
      )}

      {!pacienteSeleccionado && (
        <div className="mt-10 p-12 border-2 border-dashed border-slate-200 rounded-[32px] flex flex-col items-center justify-center text-slate-400">
          <p className="font-medium">Seleccione un paciente para habilitar las secciones de pruebas y pagos.</p>
        </div>
      )}
    </div>
  );
}