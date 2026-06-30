import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabase";

export default function Comite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const id = searchParams.get("id");

  const [solicitud, setSolicitud] = useState(null);
  const [decision, setDecision] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [cargando, setCargando] = useState(false);

  const adminRol = localStorage.getItem("admin_rol") || "";
  const adminNombre = localStorage.getItem("admin_nombre") || "Usuario";

  useEffect(() => {
    if (id) cargarSolicitud();
  }, [id]);

  const cargarSolicitud = async () => {
    const { data } = await supabase.from("prestamos").select("*").eq("id", id).single();
    setSolicitud(data);
  };

  const resolverComite = async () => {
    if (!decision || !puedeAprobar) return;
    setCargando(true);
    await supabase.from("prestamos").update({
      estado: decision,
      observaciones: observaciones || solicitud.observaciones,
      aprobado_por: adminNombre,
      aprobado_rol: adminRol,
    }).eq("id", id);
    setCargando(false);
    if (decision === "aprobado") navigate("/desembolso?id=" + id);
    else navigate("/bandeja");
  };

  const cuotaMensual = () => {
    if (!solicitud) return 0;
    const tasa = (parseFloat(solicitud.tasa_interes) || 1.8) / 100;
    const n = solicitud.plazo;
    const c = solicitud.monto;
    return ((c * tasa * Math.pow(1 + tasa, n)) / (Math.pow(1 + tasa, n) - 1)).toFixed(2);
  };

  const getNivelAprobacion = (monto) => {
    if (monto <= 5000) return {
      nivel: "Asesor",
      rolRequerido: "asesor",
      descripcion: "Montos hasta S/ 5,000 — aprobación directa del asesor",
      color: "bg-blue-50 text-blue-700 border-blue-200",
      icono: "👤",
    };
    if (monto <= 20000) return {
      nivel: "Administrador",
      rolRequerido: "administrador",
      descripcion: "Montos S/ 5,001 – S/ 20,000 — requiere aprobación del administrador",
      color: "bg-yellow-50 text-yellow-700 border-yellow-200",
      icono: "👔",
    };
    if (monto <= 50000) return {
      nivel: "Jefe Regional",
      rolRequerido: "jefe_regional",
      descripcion: "Montos S/ 20,001 – S/ 50,000 — requiere aprobación del Jefe Regional",
      color: "bg-orange-50 text-orange-700 border-orange-200",
      icono: "🏢",
    };
    return {
      nivel: "Comité de Riesgos",
      rolRequerido: "riesgos",
      descripcion: "Montos mayores a S/ 50,000 — requiere aprobación del Comité de Riesgos",
      color: "bg-red-50 text-red-700 border-red-200",
      icono: "🏛️",
    };
  };

  const jerarquia = {
    asesor: ["asesor"],
    administrador: ["asesor", "administrador"],
    jefe_regional: ["asesor", "administrador", "jefe_regional"],
    riesgos: ["asesor", "administrador", "jefe_regional", "riesgos"],
  };

  const nivelAprobacion = solicitud ? getNivelAprobacion(Number(solicitud.monto)) : null;
  const puedeAprobar = nivelAprobacion
    ? (jerarquia[adminRol] || []).includes(nivelAprobacion.rolRequerido)
    : false;

  const getRDSSemaforo = () => {
    if (!solicitud?.ingresos || !solicitud?.monto) return null;
    const cuota = parseFloat(cuotaMensual());
    const rds = (cuota / solicitud.ingresos) * 100;
    if (rds <= 20) return { color: "bg-green-500", texto: `${rds.toFixed(1)}% — Bajo riesgo`, bg: "bg-green-50 text-green-700" };
    if (rds <= 30) return { color: "bg-yellow-400", texto: `${rds.toFixed(1)}% — Riesgo medio`, bg: "bg-yellow-50 text-yellow-700" };
    return { color: "bg-red-500", texto: `${rds.toFixed(1)}% — Alto riesgo`, bg: "bg-red-50 text-red-700" };
  };

  const rdsSem = getRDSSemaforo();

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-800 mb-1">3. Propuesta y Comité</h1>
      <p className="text-sm text-gray-400 mb-6">Resolución del comité de créditos</p>

      {!id ? (
        <div className="bg-white rounded-xl p-6 shadow-sm text-sm text-gray-400">
          Selecciona una solicitud desde la{" "}
          <span className="text-red-600 cursor-pointer underline" onClick={() => navigate("/bandeja")}>Bandeja</span>.
        </div>
      ) : !solicitud ? (
        <p className="text-sm text-gray-400">Cargando...</p>
      ) : (
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-sm font-bold text-gray-700 mb-4">Expediente del crédito</h2>
            <div className="space-y-3 mb-4">
              {[
                { label: "Solicitante", value: solicitud.nombre },
                { label: "DNI", value: solicitud.dni },
                { label: "Monto", value: `S/ ${Number(solicitud.monto).toLocaleString()}` },
                { label: "Plazo", value: `${solicitud.plazo} meses` },
                { label: "Tasa mensual", value: `${solicitud.tasa_interes || 1.8}%` },
                { label: "Cuota mensual", value: `S/ ${cuotaMensual()}` },
                { label: "Ingresos", value: `S/ ${Number(solicitud.ingresos || 0).toLocaleString()}` },
                { label: "Gastos", value: `S/ ${Number(solicitud.gastos || 0).toLocaleString()}` },
                { label: "Garantía", value: solicitud.garantia || "Sin garantía" },
                { label: "Asesor", value: solicitud.asesor || "-" },
                { label: "Scoring", value: `${solicitud.scoring}/100` },
              ].map((item) => (
                <div key={item.label} className="flex justify-between text-sm border-b border-gray-50 pb-2">
                  <span className="text-gray-400">{item.label}</span>
                  <span className="font-medium text-gray-800">{item.value}</span>
                </div>
              ))}
            </div>

            {rdsSem && (
              <div className={`rounded-lg p-3 mb-4 flex items-center gap-3 ${rdsSem.bg}`}>
                <div className={`w-3 h-3 rounded-full shrink-0 ${rdsSem.color}`} />
                <div>
                  <p className="text-xs font-semibold">RDS — Ratio Deuda/Salario</p>
                  <p className="text-xs">{rdsSem.texto}</p>
                </div>
              </div>
            )}

            {nivelAprobacion && (
              <div className={`rounded-lg p-3 border ${nivelAprobacion.color}`}>
                <p className="text-xs font-semibold mb-1">Nivel de aprobación requerido</p>
                <p className="text-sm font-bold">{nivelAprobacion.icono} {nivelAprobacion.nivel}</p>
                <p className="text-xs mt-1">{nivelAprobacion.descripcion}</p>
              </div>
            )}

            {solicitud.observaciones && (
              <div className="mt-4 bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1">Observaciones del asesor</p>
                <p className="text-sm text-gray-700">{solicitud.observaciones}</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-sm font-bold text-gray-700 mb-4">Resolución del comité</h2>

            <div className="bg-gray-50 rounded-lg px-4 py-3 mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">Usuario en sesión</p>
                <p className="text-sm font-semibold text-gray-700">{adminNombre}</p>
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                adminRol === "riesgos" ? "bg-red-100 text-red-700" :
                adminRol === "jefe_regional" ? "bg-orange-100 text-orange-700" :
                adminRol === "administrador" ? "bg-yellow-100 text-yellow-700" :
                "bg-blue-100 text-blue-700"
              }`}>
                {adminRol === "jefe_regional" ? "Jefe Regional" :
                 adminRol === "administrador" ? "Administrador" :
                 adminRol === "riesgos" ? "Comité de Riesgos" :
                 "Asesor"}
              </span>
            </div>

            <div className="space-y-4">
              <div className={`rounded-lg p-4 text-center ${
                solicitud.scoring >= 75 ? "bg-green-50" :
                solicitud.scoring >= 60 ? "bg-yellow-50" : "bg-red-50"
              }`}>
                <p className="text-xs text-gray-400 mb-1">Scoring</p>
                <p className={`text-3xl font-bold ${
                  solicitud.scoring >= 75 ? "text-green-600" :
                  solicitud.scoring >= 60 ? "text-yellow-600" : "text-red-600"
                }`}>{solicitud.scoring}/100</p>
                <p className="text-xs text-gray-500 mt-1">
                  {solicitud.scoring >= 75 ? "✅ Recomendado para aprobación" :
                   solicitud.scoring >= 60 ? "⚠️ Análisis adicional requerido" :
                   "❌ No recomendado"}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs font-semibold text-gray-500 mb-3">Tabla de umbrales por monto</p>
                <div className="space-y-2">
                  {[
                    { rango: "Hasta S/ 5,000", nivel: "Asesor", activo: Number(solicitud.monto) <= 5000 },
                    { rango: "S/ 5,001 – S/ 20,000", nivel: "Administrador", activo: Number(solicitud.monto) > 5000 && Number(solicitud.monto) <= 20000 },
                    { rango: "S/ 20,001 – S/ 50,000", nivel: "Jefe Regional", activo: Number(solicitud.monto) > 20000 && Number(solicitud.monto) <= 50000 },
                    { rango: "Mayor a S/ 50,000", nivel: "Comité de Riesgos", activo: Number(solicitud.monto) > 50000 },
                  ].map((u) => (
                    <div key={u.rango} className={`flex justify-between text-xs px-3 py-2 rounded-lg ${
                      u.activo ? "bg-red-100 text-red-700 font-bold" : "text-gray-400"
                    }`}>
                      <span>{u.rango}</span>
                      <span>{u.nivel} {u.activo ? "← Este crédito" : ""}</span>
                    </div>
                  ))}
                </div>
              </div>

              {!puedeAprobar ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                  <p className="text-2xl mb-2">🔒</p>
                  <p className="text-sm font-bold text-red-700">Sin autorización</p>
                  <p className="text-xs text-red-500 mt-1">
                    Este crédito requiere aprobación de{" "}
                    <span className="font-semibold">{nivelAprobacion?.nivel}</span>.
                    Tu rol actual ({adminRol === "jefe_regional" ? "Jefe Regional" : adminRol}) no tiene permisos para montos de{" "}
                    S/ {Number(solicitud.monto).toLocaleString()}.
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-xs text-gray-500 mb-2 block">Decisión del comité</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setDecision("aprobado")}
                        className={`py-3 rounded-lg text-sm font-semibold border-2 transition ${
                          decision === "aprobado"
                            ? "border-green-500 bg-green-50 text-green-700"
                            : "border-gray-200 text-gray-500 hover:border-green-300"
                        }`}
                      >
                        ✅ Aprobar
                      </button>
                      <button
                        onClick={() => setDecision("rechazado")}
                        className={`py-3 rounded-lg text-sm font-semibold border-2 transition ${
                          decision === "rechazado"
                            ? "border-red-500 bg-red-50 text-red-700"
                            : "border-gray-200 text-gray-500 hover:border-red-300"
                        }`}
                      >
                        ❌ Rechazar
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Observaciones del comité</label>
                    <textarea
                      value={observaciones}
                      onChange={(e) => setObservaciones(e.target.value)}
                      placeholder="Resolución y comentarios del comité..."
                      rows={4}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                    />
                  </div>

                  <button
                    onClick={resolverComite}
                    disabled={!decision || cargando}
                    className="w-full bg-red-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-red-700 transition disabled:opacity-50"
                  >
                    {cargando ? "Guardando..." : decision === "aprobado" ? "Aprobar y continuar →" : "Confirmar resolución"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}