import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { useNavigate } from "react-router-dom";

export default function Bandeja() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState("todos");
  const navigate = useNavigate();

  useEffect(() => {
    cargarSolicitudes();
  }, []);

  const cargarSolicitudes = async () => {
    const { data } = await supabase
      .from("prestamos")
      .select("*")
      .order("created_at", { ascending: false });
    setSolicitudes(data || []);
    setCargando(false);
  };

  const colorEstado = (estado) => {
    if (estado === "aprobado") return "bg-green-100 text-green-700";
    if (estado === "rechazado") return "bg-red-100 text-red-700";
    if (estado === "desembolsado") return "bg-blue-100 text-blue-700";
    if (estado === "en_comite") return "bg-purple-100 text-purple-700";
    if (estado === "en_evaluacion") return "bg-orange-100 text-orange-700";
    return "bg-yellow-100 text-yellow-700";
  };

  const filtradas = filtro === "todos"
    ? solicitudes
    : solicitudes.filter(s => s.estado === filtro);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Bandeja de solicitudes</h1>
          <p className="text-sm text-gray-400">Gestiona todas las solicitudes de crédito</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-6">
        {[
          { value: "todos", label: "Todos" },
          { value: "pendiente", label: "Pendientes" },
          { value: "en_evaluacion", label: "En Evaluación" },
          { value: "en_comite", label: "En Comité" },
          { value: "aprobado", label: "Aprobados" },
          { value: "desembolsado", label: "Desembolsados" },
          { value: "rechazado", label: "Rechazados" },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFiltro(f.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              filtro === f.value
                ? "bg-red-600 text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {cargando ? (
          <p className="p-6 text-sm text-gray-400">Cargando...</p>
        ) : filtradas.length === 0 ? (
          <p className="p-6 text-sm text-gray-400">No hay solicitudes.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-6 py-3 text-left">Solicitante</th>
                <th className="px-6 py-3 text-left">DNI</th>
                <th className="px-6 py-3 text-left">Monto</th>
                <th className="px-6 py-3 text-left">Plazo</th>
                <th className="px-6 py-3 text-left">Motivo</th>
                <th className="px-6 py-3 text-left">Estado</th>
                <th className="px-6 py-3 text-left">Fecha</th>
                <th className="px-6 py-3 text-left">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtradas.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-medium text-gray-800">{s.nombre}</td>
                  <td className="px-6 py-4 text-gray-500">{s.dni}</td>
                  <td className="px-6 py-4 font-bold text-gray-800">S/ {Number(s.monto).toLocaleString()}</td>
                  <td className="px-6 py-4 text-gray-500">{s.plazo} meses</td>
                  <td className="px-6 py-4 text-gray-500 max-w-xs truncate">{s.motivo}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colorEstado(s.estado)}`}>
                      {s.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-xs">
                    {new Date(s.created_at).toLocaleDateString("es-PE")}
                  </td>
                  <td className="px-6 py-4">
                    {s.estado === "pendiente" && (
                      <button
                        onClick={() => navigate(`/pre-solicitud?id=${s.id}`)}
                        className="px-3 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100 transition"
                      >
                        Evaluar
                      </button>
                    )}
                    {s.estado === "en_evaluacion" && (
                      <button
                        onClick={() => navigate(`/pre-solicitud?id=${s.id}`)}
                        className="px-3 py-1 bg-orange-50 text-orange-600 rounded-lg text-xs font-semibold hover:bg-orange-100 transition"
                      >
                        Continuar registro
                      </button>
                    )}
                    {s.estado === "en_comite" && (
                      <button
                        onClick={() => navigate(`/comite?id=${s.id}`)}
                        className="px-3 py-1 bg-purple-50 text-purple-600 rounded-lg text-xs font-semibold hover:bg-purple-100 transition"
                      >
                        Ir a comité
                      </button>
                    )}
                    {s.estado === "aprobado" && (
                      <button
                        onClick={() => navigate(`/desembolso?id=${s.id}`)}
                        className="px-3 py-1 bg-green-50 text-green-600 rounded-lg text-xs font-semibold hover:bg-green-100 transition"
                      >
                        Desembolsar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}