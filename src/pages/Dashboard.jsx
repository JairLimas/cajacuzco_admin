import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

export default function Dashboard() {
  const [stats, setStats] = useState({
    total: 0, pendientes: 0, aprobados: 0,
    rechazados: 0, desembolsados: 0, mora: 0,
  });
  const [montos, setMontos] = useState({ total: 0, aprobado: 0, mora: 0 });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    const { data } = await supabase.from("prestamos").select("*");
    if (!data) return;

    const pendientes = data.filter(p => p.estado === "pendiente").length;
    const aprobados = data.filter(p => p.estado === "aprobado").length;
    const rechazados = data.filter(p => p.estado === "rechazado").length;
    const desembolsados = data.filter(p => p.estado === "desembolsado").length;
    const mora = data.filter(p => p.dias_mora > 0).length;

    const totalMonto = data.reduce((a, p) => a + Number(p.monto), 0);
    const aprobadoMonto = data.filter(p => ["aprobado", "desembolsado"].includes(p.estado)).reduce((a, p) => a + Number(p.monto), 0);
    const moraMonto = data.filter(p => p.dias_mora > 0).reduce((a, p) => a + Number(p.monto), 0);

    setStats({ total: data.length, pendientes, aprobados, rechazados, desembolsados, mora });
    setMontos({ total: totalMonto, aprobado: aprobadoMonto, mora: moraMonto });
  };

  const pieData = [
    { name: "Pendientes", value: stats.pendientes, color: "#f59e0b" },
    { name: "Rechazados", value: stats.rechazados, color: "#ef4444" },
    { name: "Desembolsados", value: stats.desembolsados, color: "#3b82f6" },
  ].filter(d => d.value > 0);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Mi cartera</h1>
          <p className="text-sm text-gray-400">Indicadores de créditos · Administrador AS0001</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Período</p>
          <p className="text-sm font-bold text-gray-700">
            {new Date().toLocaleDateString("es-PE", { month: "long", year: "numeric" })}
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        {[
          { label: "Cartera Total (S/)", value: `S/ ${montos.total.toLocaleString()}`, border: "border-l-4 border-gray-300" },
          { label: "Monto Aprobado", value: `S/ ${montos.aprobado.toLocaleString()}`, border: "border-l-4 border-green-500" },
          { label: "En Mora (S/)", value: `S/ ${montos.mora.toLocaleString()}`, border: "border-l-4 border-red-500" },
          { label: "N° Créditos", value: stats.total, border: "border-l-4 border-blue-500" },
          { label: "En Mora", value: stats.mora, border: "border-l-4 border-yellow-500" },
        ].map((k) => (
          <div key={k.label} className={`bg-white rounded-xl p-4 shadow-sm ${k.border}`}>
            <p className="text-xs text-gray-400 mb-1">{k.label}</p>
            <p className="text-xl font-bold text-gray-800">{k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Gráfico */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-sm font-bold text-gray-700 mb-4">Composición de cartera</h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value">
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [`${v} créditos`]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-400 text-center py-10">Sin datos aún</p>
          )}
        </div>

        {/* Estados */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-sm font-bold text-gray-700 mb-4">Créditos por estado</h2>
          <div className="space-y-3">
            {[
              { label: "Pendientes", value: stats.pendientes, color: "bg-yellow-400", total: stats.total },
              { label: "Desembolsados", value: stats.desembolsados, color: "bg-blue-500", total: stats.total },
              { label: "Rechazados", value: stats.rechazados, color: "bg-red-500", total: stats.total },
            ].map((e) => (
              <div key={e.label}>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{e.label}</span>
                  <span>{e.value}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className={`${e.color} h-2 rounded-full`}
                    style={{ width: e.total > 0 ? `${(e.value / e.total) * 100}%` : "0%" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}