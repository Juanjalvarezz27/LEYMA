"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { FileSignature, ArrowLeft } from "lucide-react";

// Hooks y Componentes
import useTasaBCV from "../../hooks/useTasaBcv";
import BuscadorPaciente from "../../components/registro/BuscadorPaciente";
import TarjetaPaciente from "../../components/registro/TarjetaPaciente";
import FormularioPaciente from "../../components/registro/FormularioPaciente";
import SeleccionPruebas from "../../components/registro/SeleccionPruebas";
import ResumenPago from "../../components/registro/ResumenPago";

function RegistroContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  // Estados del Paciente
  const [cedulaBusqueda, setCedulaBusqueda] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<any>(null);
  const [isCreandoNuevo, setIsCreandoNuevo] = useState(false);
  const [guardandoPaciente, setGuardandoPaciente] = useState(false);
  const [formData, setFormData] = useState({
    esBebe: false, cedula: "", nombreCompleto: "", fechaNacimiento: "",
    sexo: "M", telefono: "", correo: "", direccion: "", observaciones: ""
  });

  // Estados de Pruebas y Tasa
  const [pruebasCatalogo, setPruebasCatalogo] = useState<any[]>([]);
  const [pruebasSeleccionadas, setPruebasSeleccionadas] = useState<any[]>([]);
  const { tasa } = useTasaBCV();
  const tasaBCV = tasa ?? 36.5;

  // 1. Cargar Catálogo de Pruebas
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

  // 2. Lógica de Edición: Cargar orden si existe editId
useEffect(() => {
    if (editId) {
      const cargarOrdenParaEdicion = async () => {
        try {
          const res = await fetch(`/api/ordenes/${editId}`); 
          const orden = await res.json();
          
          if (res.ok && orden) {
            setPacienteSeleccionado(orden.paciente);
            setPruebasSeleccionadas(orden.detalles.map((d: any) => ({
              ...d.prueba,
              cantidad: d.cantidad,
              precioUSD: d.precioCongeladoUSD,
              descInd: d.descuento,
              tipoDescInd: d.tipoDescuento?.nombre || "PORCENTAJE"
            })));
            
            // CORRECCIÓN: Le agregamos un toastId único para evitar el doble render en desarrollo
            toast.info(`Editando Orden #${editId}`, { 
              toastId: `edit-toast-${editId}` 
            });
            
          } else {
             toast.error(orden.error || "Error al obtener la orden");
          }
        } catch (error) {
          toast.error("No se pudo cargar la orden para editar");
        }
      };
      cargarOrdenParaEdicion();
    }
  }, [editId]);

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
    if (editId) router.push("/home/registro"); // Limpiar la URL de edición
  };

  const finalizarOrden = async (resumenData: any) => {
    if (resumenData.estado === "CERRADA" && resumenData.restanteUSD > 0.05) {
      toast.error(`La orden no puede ser CERRADA con saldo pendiente.`);
      return;
    }

    toast.info(editId ? "Actualizando orden..." : "Guardando orden...");

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
      // Si editId existe usamos PUT, si no POST
      const url = editId ? `/api/ordenes/${editId}` : "/api/ordenes";
      const method = editId ? "PUT" : "POST";

      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ordenParaGuardar)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success(editId ? "Orden actualizada correctamente" : "Orden guardada correctamente");
      
      if (editId) {
        router.push("/home/diaria"); // Volver a la lista diaria después de editar
      } else {
        limpiarSeleccion();
      }
    } catch (error: any) {
      toast.error(error.message || "Error al procesar la orden");
    }
  };

  return (
    <div className="h-full flex flex-col pb-10 overflow-y-auto pr-4 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="font-title text-4xl font-bold text-[#1D1D1F] tracking-tight flex items-center gap-3">
            <FileSignature className="text-[#0071E3]" size={36} strokeWidth={2.5} />
            {editId ? `Editando Orden #${editId}` : "Nueva Orden de Laboratorio"}
          </h1>
          <p className="text-[#86868B] mt-2 font-medium text-[15px]">
            {editId ? "Modifique los exámenes o datos de la orden seleccionada." : "Gestión integral de pacientes, pruebas y facturación."}
          </p>
        </div>
        {editId && (
          <button 
            onClick={() => router.push("/home/diaria")}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-all"
          >
            <ArrowLeft size={18} /> Volver a Lista Diaria
          </button>
        )}
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
       {pacienteSeleccionado && (
          <TarjetaPaciente 
            paciente={pacienteSeleccionado} 
            limpiarSeleccion={limpiarSeleccion} 
            onActualizarPaciente={setPacienteSeleccionado} // Esto recarga la tarjeta mágicamente al guardar
          />
        )}
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

// Next.js requiere Suspense para usar useSearchParams() en componentes del cliente
export default function RegistroPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center font-bold">Cargando módulo de registro...</div>}>
      <RegistroContent />
    </Suspense>
  );
}