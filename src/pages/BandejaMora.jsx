import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { AlertTriangle, FileText, Gavel, X } from "lucide-react";

export default function BandejaMora() {
  const [prestamos, setPrestamos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalGestion, setModalGestion] = useState(null); // préstamo seleccionado para gestión
  const [historial, setHistorial] = useState([]);
  const [tipoGestion, setTipoGestion] = useState("");
  const [resultado, setResultado] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [filtro, setFiltro] = useState("todos");

  const adminNombre = localStorage.getItem("admin_nombre") || "Usuario";
  const adminRol = localStorage.getItem("admin_rol") || "";

  useEffect(() => {
    cargarMora();
  }, []);

  const cargarMora = async () => {
    const { data } = await supabase
      .from("prestamos")
      .select("*")
      .in("estado", ["desembolsado", "judicial", "castigado"])
      .order("dias_mora", { ascending: false });
    setPrestamos(data || []);
    setCargando(false);
  };

  // R1 — Bandas normativas reales
  const getBanda = (dias) => {
    if (!dias || dias === 0) return {
      label: "Al día", codigo: "al_dia",
      color: "bg-green-100 text-green-700",
      barra: "bg-green-500",
    };
    if (dias <= 8) return {
      label: "Preventiva", codigo: "preventiva",
      color: "bg-blue-100 text-blue-700",
      barra: "bg-blue-500",
    };
    if (dias <= 30) return {
      label: "Temprana", codigo: "temprana",
      color: "bg-yellow-100 text-yellow-700",
      barra: "bg-yellow-400",
    };
    if (dias <= 90) return {
      label: "Tardía", codigo: "tardia",
      color: "bg-orange-100 text-orange-700",
      barra: "bg-orange-500",
    };
    if (dias <= 120) return {
      label: "Pre-judicial", codigo: "pre_judicial",
      color: "bg-red-100 text-red-700",
      barra: "bg-red-500",
    };
    if (dias <= 180) return {
      label: "Judicial", codigo: "judicial",
      color: "bg-purple-100 text-purple-700",
      barra: "bg-purple-600",
    };
    return {
      label: "Castigo", codigo: "castigo",
      color: "bg-gray-200 text-gray-600",
      barra: "bg-gray-500",
    };
  };

  const cuotaMensual = (p) => {
    const tasa = 0.018;
    const n = p.plazo;
    const c = p.monto;
    return ((c * tasa * Math.pow(1 + tasa, n)) / (Math.pow(1 + tasa, n) - 1)).toFixed(2);
  };

  // KPIs por banda
  const porBanda = (codigo) => prestamos.filter(p => getBanda(p.dias_mora || 0).codigo === codigo).length;
  const enMora = prestamos.filter(p => (p.dias_mora || 0) > 0).length;
  const totalMora = prestamos.filter(p => (p.dias_mora || 0) > 0).reduce((a, p) => a + Number(p.monto), 0);
  const ratioMora = prestamos.length > 0 ? ((enMora / prestamos.length) * 100).toFixed(1) : 0;

  // Filtro por banda
  const prestamosFiltrados = filtro === "todos"
    ? prestamos
    : prestamos.filter(p => getBanda(p.dias_mora || 0).codigo === filtro);

  // R2 — Abrir modal de gestión y cargar historial
  const abrirGestion = async (prestamo) => {
    setModalGestion(prestamo);
    setTipoGestion("");
    setResultado("");
    setObservaciones("");
    const { data } = await supabase
      .from("gestiones_mora")
      .select("*")
      .eq("prestamo_id", prestamo.id)
      .order("fecha", { ascending: false });
    setHistorial(data || []);
  };

  const registrarGestion = async () => {
    if (!tipoGestion || !resultado) return;
    setGuardando(true);
    await supabase.from("gestiones_mora").insert({
      prestamo_id: modalGestion.id,
      tipo_gestion: tipoGestion,
      resultado,
      observaciones,
      gestionado_por: adminNombre,
      gestionado_rol: adminRol,
    });
    // Recargar historial
    const { data } = await supabase
      .from("gestiones_mora")
      .select("*")
      .eq("prestamo_id", modalGestion.id)
      .order("fecha", { ascending: false });
    setHistorial(data || []);
    setTipoGestion("");
    setResultado("");
    setObservaciones("");
    setGuardando(false);
  };

  // R3 — Transición judicial (≥121 días) — requiere jefe_regional o riesgos
  const derivarJudicial = async (p) => {
    if (!["jefe_regional", "riesgos", "administrador"].includes(adminRol)) {
      alert("Solo el Jefe Regional, Administrador o Riesgos puede derivar a judicial.");
      return;
    }
    if ((p.dias_mora || 0) < 121) {
      alert("El crédito debe tener al menos 121 días de mora para derivar a judicial.");
      return;
    }
    await supabase.from("prestamos").update({
      estado: "judicial",
      banda_mora: "judicial",
      fecha_judicial: new Date().toISOString(),
    }).eq("id", p.id);
    await supabase.from("gestiones_mora").insert({
      prestamo_id: p.id,
      tipo_gestion: "Derivación Judicial",
      resultado: "Derivado a cobranza judicial por superar 120 días de mora",
      observaciones: `Días de mora al momento de derivación: ${p.dias_mora}`,
      gestionado_por: adminNombre,
      gestionado_rol: adminRol,
    });
    cargarMora();
    if (modalGestion?.id === p.id) {
      const { data } = await supabase
        .from("gestiones_mora")
        .select("*")
        .eq("prestamo_id", p.id)
        .order("fecha", { ascending: false });
      setHistorial(data || []);
    }
  };

  // R3 — Castigo contable (>180 días) — solo riesgos
  const castigarCredito = async (p) => {
    if (adminRol !== "riesgos") {
      alert("Solo el Comité de Riesgos puede registrar el castigo contable.");
      return;
    }
    if ((p.dias_mora || 0) <= 180) {
      alert("El crédito debe superar los 180 días de mora para ser castigado.");
      return;
    }
    await supabase.from("prestamos").update({
      estado: "castigado",
      banda_mora: "castigo",
      fecha_castigo: new Date().toISOString(),
    }).eq("id", p.id);
    await supabase.from("gestiones_mora").insert({
      prestamo_id: p.id,
      tipo_gestion: "Castigo Contable",
      resultado: "Crédito castigado por superar 180 días de mora",
      observaciones: `Días de mora al momento del castigo: ${p.dias_mora}`,
      gestionado_por: adminNombre,
      gestionado_rol: adminRol,
    });
    cargarMora();
  };

  const puedeJudicial = (p) => (p.dias_mora || 0) >= 121 && p.estado !== "judicial" && p.estado !== "castigado";
  const puedeCastigo = (p) => (p.dias_mora || 0) > 180 && p.estado !== "castigado";

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-800 mb-1">Bandeja de Mora</h1>
      <p className="text-sm text-gray-400 mb-6">Seguimiento y recuperación de créditos vencidos — R1 · R2 · R3</p>

      {/* R1 — KPIs por banda */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        {[
          { label: "Total cartera", value: prestamos.length, color: "border-l-4 border-gray-300" },
          { label: "En mora", value: enMora, color: "border-l-4 border-red-500" },
          { label: "Ratio de mora", value: `${ratioMora}%`, color: "border-l-4 border-orange-500" },
          { label: "Monto en riesgo", value: `S/ ${totalMora.toLocaleString()}`, color: "border-l-4 border-purple-500" },
        ].map((k) => (
          <div key={k.label} className={`bg-white rounded-xl p-4 shadow-sm ${k.color}`}>
            <p className="text-xs text-gray-400 mb-1">{k.label}</p>
            <p className="text-xl font-bold text-gray-800">{k.value}</p>
          </div>
        ))}
      </div>

      {/* Bandas de mora */}
      <div className="grid grid-cols-6 gap-3 mb-6">
        {[
          { codigo: "preventiva", label: "Preventiva", rango: "1–8 días", color: "bg-blue-500" },
          { codigo: "temprana", label: "Temprana", rango: "9–30 días", color: "bg-yellow-400" },
          { codigo: "tardia", label: "Tardía", rango: "31–90 días", color: "bg-orange-500" },
          { codigo: "pre_judicial", label: "Pre-judicial", rango: "91–120 días", color: "bg-red-500" },
          { codigo: "judicial", label: "Judicial", rango: "121–180 días", color: "bg-purple-600" },
          { codigo: "castigo", label: "Castigo", rango: ">180 días", color: "bg-gray-500" },
        ].map((b) => (
          <div key={b.codigo} className="bg-white rounded-xl p-3 shadow-sm text-center">
            <div className={`w-3 h-3 rounded-full ${b.color} mx-auto mb-2`} />
            <p className="text-xs font-bold text-gray-700">{b.label}</p>
            <p className="text-xs text-gray-400">{b.rango}</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{porBanda(b.codigo)}</p>
          </div>
        ))}
      </div>

      {/* Alerta */}
      {enMora > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <AlertTriangle size={18} className="text-red-500" />
          <p className="text-sm text-red-700">
            <span className="font-bold">{enMora} crédito(s)</span> en mora —{" "}
            <span className="font-bold">S/ {totalMora.toLocaleString()}</span> en riesgo.
            {prestamos.filter(p => (p.dias_mora || 0) >= 121).length > 0 && (
              <span className="ml-2 text-purple-700 font-bold">
                ⚠️ {prestamos.filter(p => (p.dias_mora || 0) >= 121).length} apto(s) para judicial.
              </span>
            )}
          </p>
        </div>
      )}

      {/* Filtro por banda */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {["todos", "preventiva", "temprana", "tardia", "pre_judicial", "judicial", "castigo"].map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
              filtro === f ? "bg-red-600 text-white" : "bg-white text-gray-500 border border-gray-200 hover:border-red-300"
            }`}
          >
            {f === "todos" ? "Todos" :
             f === "preventiva" ? "Preventiva" :
             f === "temprana" ? "Temprana" :
             f === "tardia" ? "Tardía" :
             f === "pre_judicial" ? "Pre-judicial" :
             f === "judicial" ? "Judicial" : "Castigo"}
          </button>
        ))}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
        {cargando ? (
          <p className="p-6 text-sm text-gray-400">Cargando...</p>
        ) : prestamosFiltrados.length === 0 ? (
          <p className="p-6 text-sm text-gray-400">Sin créditos en esta banda.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Deudor</th>
                <th className="px-4 py-3 text-left">Monto</th>
                <th className="px-4 py-3 text-left">Días mora</th>
                <th className="px-4 py-3 text-left">Banda</th>
                <th className="px-4 py-3 text-left">Estado</th>
                <th className="px-4 py-3 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {prestamosFiltrados.map((p) => {
                const banda = getBanda(p.dias_mora || 0);
                return (
                  <tr key={p.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{p.nombre}</p>
                      <p className="text-xs text-gray-400">{p.dni}</p>
                    </td>
                    <td className="px-4 py-3 font-bold text-gray-800">S/ {Number(p.monto).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-gray-800">{p.dias_mora || 0}</span>
                      <span className="text-gray-400 text-xs"> días</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${banda.color}`}>
                        {banda.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${
                        p.estado === "castigado" ? "text-gray-500" :
                        p.estado === "judicial" ? "text-purple-600" : "text-green-600"
                      }`}>
                        {p.estado === "castigado" ? "Castigado" :
                         p.estado === "judicial" ? "Judicial" : "Activo"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {/* R2 — Gestión */}
                        <button
                          onClick={() => abrirGestion(p)}
                          className="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-100 flex items-center gap-1"
                        >
                          <FileText size={12} /> Gestionar
                        </button>
                        {/* R3 — Judicial */}
                        {puedeJudicial(p) && (
                          <button
                            onClick={() => derivarJudicial(p)}
                            className="px-2 py-1 bg-purple-50 text-purple-600 rounded-lg text-xs font-semibold hover:bg-purple-100 flex items-center gap-1"
                          >
                            <Gavel size={12} /> Judicial
                          </button>
                        )}
                        {/* R3 — Castigo */}
                        {puedeCastigo(p) && (
                          <button
                            onClick={() => castigarCredito(p)}
                            className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-200 flex items-center gap-1"
                          >
                            ✂️ Castigar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* R2 — Modal de gestión */}
      {modalGestion && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <div>
                <h2 className="text-sm font-bold text-gray-800">Gestión de Cobranza</h2>
                <p className="text-xs text-gray-400">{modalGestion.nombre} — {modalGestion.dias_mora || 0} días mora</p>
              </div>
              <button onClick={() => setModalGestion(null)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* R3 acciones rápidas dentro del modal */}
              {puedeJudicial(modalGestion) && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 flex justify-between items-center">
                  <div>
                    <p className="text-xs font-bold text-purple-700">⚠️ Apto para derivación judicial</p>
                    <p className="text-xs text-purple-500">{modalGestion.dias_mora} días ≥ 121</p>
                  </div>
                  <button
                    onClick={() => derivarJudicial(modalGestion)}
                    className="px-3 py-1 bg-purple-600 text-white rounded-lg text-xs font-semibold hover:bg-purple-700"
                  >
                    Derivar
                  </button>
                </div>
              )}
              {puedeCastigo(modalGestion) && (
                <div className="bg-gray-100 border border-gray-300 rounded-lg p-3 flex justify-between items-center">
                  <div>
                    <p className="text-xs font-bold text-gray-700">✂️ Apto para castigo contable</p>
                    <p className="text-xs text-gray-500">{modalGestion.dias_mora} días {">"} 180</p>
                  </div>
                  <button
                    onClick={() => castigarCredito(modalGestion)}
                    className="px-3 py-1 bg-gray-700 text-white rounded-lg text-xs font-semibold hover:bg-gray-800"
                  >
                    Castigar
                  </button>
                </div>
              )}

              {/* Registrar gestión */}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Tipo de gestión</label>
                <select
                  value={tipoGestion}
                  onChange={(e) => setTipoGestion(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                >
                  <option value="">Seleccionar...</option>
                  <option value="Llamada telefónica">Llamada telefónica</option>
                  <option value="Visita domiciliaria">Visita domiciliaria</option>
                  <option value="Carta notarial">Carta notarial</option>
                  <option value="Acuerdo de pago">Acuerdo de pago</option>
                  <option value="Refinanciamiento">Refinanciamiento</option>
                  <option value="Derivación Judicial">Derivación Judicial</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Resultado</label>
                <select
                  value={resultado}
                  onChange={(e) => setResultado(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                >
                  <option value="">Seleccionar...</option>
                  <option value="Contactado — promesa de pago">Contactado — promesa de pago</option>
                  <option value="Contactado — sin compromiso">Contactado — sin compromiso</option>
                  <option value="No contactado">No contactado</option>
                  <option value="Pago parcial recibido">Pago parcial recibido</option>
                  <option value="Pago total recibido">Pago total recibido</option>
                  <option value="Acuerdo firmado">Acuerdo firmado</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Observaciones</label>
                <textarea
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Detalle de la gestión..."
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                />
              </div>
              <button
                onClick={registrarGestion}
                disabled={!tipoGestion || !resultado || guardando}
                className="w-full bg-red-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-red-700 transition disabled:opacity-50"
              >
                {guardando ? "Guardando..." : "Registrar gestión"}
              </button>

              {/* Historial */}
              {historial.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-gray-500 mb-3 mt-2">Historial de gestiones</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {historial.map((g) => (
                      <div key={g.id} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-xs font-semibold text-gray-700">{g.tipo_gestion}</span>
                          <span className="text-xs text-gray-400">
                            {new Date(g.fecha).toLocaleDateString("es-PE")}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600">{g.resultado}</p>
                        {g.observaciones && <p className="text-xs text-gray-400 mt-1">{g.observaciones}</p>}
                        <p className="text-xs text-gray-300 mt-1">Por: {g.gestionado_por} ({g.gestionado_rol})</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}