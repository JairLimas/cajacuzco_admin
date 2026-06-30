import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";

export default function BandejaCreditos() {
  const [creditos, setCreditos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    cargarCreditos();
  }, []);

  const cargarCreditos = async () => {
    const { data } = await supabase
      .from("prestamos")
      .select("*")
      .eq("estado", "desembolsado")
      .order("fecha_desembolso", { ascending: false });
    setCreditos(data || []);
    setCargando(false);
  };

  const cuotaMensual = (c) => {
    const tasa = (parseFloat(c.tasa_interes) || 1.8) / 100;
    const n = c.plazo;
    const monto = c.monto;
    return ((monto * tasa * Math.pow(1 + tasa, n)) / (Math.pow(1 + tasa, n) - 1)).toFixed(2);
  };

  const totalCartera = creditos.reduce((a, c) => a + Number(c.monto), 0);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Créditos Activos</h1>
          <p className="text-sm text-gray-400">Créditos ya desembolsados, en seguimiento</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-gray-300">
          <p className="text-xs text-gray-400 mb-1">Créditos activos</p>
          <p className="text-xl font-bold text-gray-800">{creditos.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-green-500">
          <p className="text-xs text-gray-400 mb-1">Cartera total</p>
          <p className="text-xl font-bold text-gray-800">S/ {totalCartera.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {cargando ? (
          <p className="p-6 text-sm text-gray-400">Cargando...</p>
        ) : creditos.length === 0 ? (
          <p className="p-6 text-sm text-gray-400">No hay créditos desembolsados todavía.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-6 py-3 text-left">Solicitante</th>
                <th className="px-6 py-3 text-left">DNI</th>
                <th className="px-6 py-3 text-left">Monto</th>
                <th className="px-6 py-3 text-left">Plazo</th>
                <th className="px-6 py-3 text-left">Cuota mensual</th>
                <th className="px-6 py-3 text-left">Fecha desembolso</th>
                <th className="px-6 py-3 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {creditos.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-medium text-gray-800">{c.nombre}</td>
                  <td className="px-6 py-4 text-gray-500">{c.dni}</td>
                  <td className="px-6 py-4 font-bold text-gray-800">S/ {Number(c.monto).toLocaleString()}</td>
                  <td className="px-6 py-4 text-gray-500">{c.plazo} meses</td>
                  <td className="px-6 py-4 text-gray-500">S/ {cuotaMensual(c)}</td>
                  <td className="px-6 py-4 text-gray-400 text-xs">
                    {c.fecha_desembolso ? new Date(c.fecha_desembolso).toLocaleDateString("es-PE") : "-"}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => navigate(`/mora`)}
                      className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-100 transition"
                    >
                      Ver seguimiento
                    </button>
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