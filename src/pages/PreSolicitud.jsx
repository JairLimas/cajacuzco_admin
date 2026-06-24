import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabase";

export default function PreSolicitud() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const id = searchParams.get("id");

  const [solicitud, setSolicitud] = useState(null);
  const [ingresos, setIngresos] = useState("");
  const [gastos, setGastos] = useState("");
  const [garantia, setGarantia] = useState("");
  const [scoring, setScoring] = useState(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (id) cargarSolicitud();
  }, [id]);

  const cargarSolicitud = async () => {
    const { data } = await supabase.from("prestamos").select("*").eq("id", id).single();
    setSolicitud(data);
    if (data?.ingresos) setIngresos(data.ingresos);
    if (data?.gastos) setGastos(data.gastos);
    if (data?.garantia) setGarantia(data.garantia);
    if (data?.scoring) setScoring(data.scoring);
  };

  const calcularScoring = () => {
    const ing = parseFloat(ingresos) || 0;
    const gas = parseFloat(gastos) || 0;
    const monto = parseFloat(solicitud?.monto) || 0;
    const capacidad = ing - gas;
    const ratio = capacidad / (monto / solicitud?.plazo);
    let score = 0;
    if (ratio >= 2) score = 90;
    else if (ratio >= 1.5) score = 75;
    else if (ratio >= 1) score = 60;
    else score = 30;
    if (garantia) score += 10;
    setScoring(Math.min(score, 100));
  };

  const enviarEvaluacion = async () => {
    if (!scoring) return;
    setCargando(true);
    await supabase.from("prestamos").update({
      ingresos: parseFloat(ingresos),
      gastos: parseFloat(gastos),
      garantia,
      scoring,
      estado: "en_evaluacion",
    }).eq("id", id);
    setCargando(false);
    navigate("/registro?id=" + id);
  };

  const colorScoring = (s) => {
    if (s >= 75) return "text-green-600";
    if (s >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-800 mb-1">1. Pre-solicitud</h1>
      <p className="text-sm text-gray-400 mb-6">Elegibilidad y pre-scoring del solicitante</p>

      {!id ? (
        <div className="bg-white rounded-xl p-6 shadow-sm text-sm text-gray-400">
          Selecciona una solicitud desde la <span className="text-red-600 cursor-pointer underline" onClick={() => navigate("/bandeja")}>Bandeja</span>.
        </div>
      ) : !solicitud ? (
        <p className="text-sm text-gray-400">Cargando...</p>
      ) : (
        <div className="grid grid-cols-2 gap-6">
          {/* Datos del solicitante */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-sm font-bold text-gray-700 mb-4">Datos del solicitante</h2>
            <div className="space-y-3">
              {[
                { label: "Nombre", value: solicitud.nombre },
                { label: "DNI", value: solicitud.dni },
                { label: "Monto solicitado", value: `S/ ${Number(solicitud.monto).toLocaleString()}` },
                { label: "Plazo", value: `${solicitud.plazo} meses` },
                { label: "Motivo", value: solicitud.motivo },
              ].map((item) => (
                <div key={item.label} className="flex justify-between text-sm border-b border-gray-50 pb-2">
                  <span className="text-gray-400">{item.label}</span>
                  <span className="font-medium text-gray-800">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Evaluación */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-sm font-bold text-gray-700 mb-4">Evaluación financiera</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Ingresos mensuales (S/)</label>
                <input
                  type="number"
                  value={ingresos}
                  onChange={(e) => setIngresos(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Gastos mensuales (S/)</label>
                <input
                  type="number"
                  value={gastos}
                  onChange={(e) => setGastos(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Garantía (opcional)</label>
                <input
                  type="text"
                  value={garantia}
                  onChange={(e) => setGarantia(e.target.value)}
                  placeholder="Ej: Inmueble, vehículo..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                />
              </div>

              <button
                onClick={calcularScoring}
                className="w-full bg-gray-800 text-white rounded-lg py-2 text-sm font-semibold hover:bg-gray-700 transition"
              >
                Calcular scoring
              </button>

              {scoring !== null && (
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-xs text-gray-400 mb-1">Scoring calculado</p>
                  <p className={`text-4xl font-bold ${colorScoring(scoring)}`}>{scoring}<span className="text-lg">/100</span></p>
                  <p className="text-xs text-gray-400 mt-1">
                    {scoring >= 75 ? "✅ Elegible" : scoring >= 60 ? "⚠️ Riesgo medio" : "❌ No elegible"}
                  </p>
                </div>
              )}

              <button
                onClick={enviarEvaluacion}
                disabled={!scoring || cargando}
                className="w-full bg-red-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-red-700 transition disabled:opacity-50"
              >
                {cargando ? "Guardando..." : "Enviar a evaluación →"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}