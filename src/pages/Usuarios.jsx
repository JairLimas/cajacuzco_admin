import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { Pencil, Trash2, Plus, X, Check } from "lucide-react";

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({
    nombre: "", dni: "", email: "", telefono: "", clave: "",
    numero_cuenta: "", tipo_cuenta: "Ahorro", saldo: "",
  });
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    const { data: usuariosData } = await supabase.from("usuarios").select("*");
    if (!usuariosData) return;

    const usuariosConCuentas = await Promise.all(
      usuariosData.map(async (u) => {
        const { data: cuentasData } = await supabase
          .from("cuentas")
          .select("*")
          .eq("usuario_id", u.id);
        return { ...u, cuentas: cuentasData || [] };
      })
    );

    setUsuarios(usuariosConCuentas);
    setCargando(false);
  };

  const abrirModalNuevo = () => {
    setEditando(null);
    setForm({ nombre: "", dni: "", email: "", telefono: "", clave: "", numero_cuenta: "", tipo_cuenta: "Ahorro", saldo: "" });
    setError("");
    setModal(true);
  };

  const abrirModalEditar = (u) => {
    setEditando(u);
    setForm({
      nombre: u.nombre,
      dni: u.dni,
      email: u.email,
      telefono: u.telefono,
      clave: u.clave,
      numero_cuenta: u.cuentas?.[0]?.numero || "",
      tipo_cuenta: u.cuentas?.[0]?.tipo || "Ahorro",
      saldo: u.cuentas?.[0]?.saldo || "",
    });
    setError("");
    setModal(true);
  };

  const guardar = async () => {
    if (!form.nombre || !form.dni || !form.clave) {
      setError("Nombre, DNI y clave son obligatorios.");
      return;
    }
    setGuardando(true);
    setError("");

    if (editando) {
      const { error: errUpdate } = await supabase.from("usuarios").update({
        nombre: form.nombre,
        dni: form.dni,
        email: form.email,
        telefono: form.telefono,
        clave: form.clave,
      }).eq("id", editando.id);

      if (errUpdate) {
        setError("Error al editar: " + errUpdate.message);
        setGuardando(false);
        return;
      }

      if (editando.cuentas?.[0]) {
        await supabase.from("cuentas").update({
          numero: form.numero_cuenta,
          tipo: form.tipo_cuenta,
          saldo: parseFloat(form.saldo || 0),
        }).eq("id", editando.cuentas[0].id);
      }
    } else {
      const { data: nuevoUsuario, error: errInsert } = await supabase
        .from("usuarios")
        .insert({
          nombre: form.nombre,
          dni: form.dni,
          email: form.email,
          telefono: form.telefono,
          clave: form.clave,
        })
        .select()
        .single();

      if (errInsert) {
        setError("Error al crear usuario: " + errInsert.message);
        setGuardando(false);
        return;
      }

      if (nuevoUsuario && form.numero_cuenta) {
        const { error: errCuenta } = await supabase.from("cuentas").insert({
          usuario_id: nuevoUsuario.id,
          numero: form.numero_cuenta,
          tipo: form.tipo_cuenta,
          saldo: parseFloat(form.saldo || 0),
        });

        if (errCuenta) {
          setError("Usuario creado pero error en cuenta: " + errCuenta.message);
          setGuardando(false);
          return;
        }

        const nombreTitular = form.nombre.toUpperCase();
        const { error: errTarjetas } = await supabase.from("tarjetas").insert([
          {
            usuario_id: nuevoUsuario.id,
            tipo: "Débito",
            numero: "**** **** **** " + form.numero_cuenta.slice(-4),
            titular: nombreTitular,
            vencimiento: "12/28",
            limite: 0,
            bloqueada: false,
          },
          {
            usuario_id: nuevoUsuario.id,
            tipo: "Crédito",
            numero: "**** **** **** " + String(Math.floor(1000 + Math.random() * 9000)),
            titular: nombreTitular,
            vencimiento: "12/28",
            limite: 5000,
            bloqueada: false,
          },
        ]);

        if (errTarjetas) {
          setError("Usuario y cuenta creados pero error en tarjetas: " + errTarjetas.message);
          setGuardando(false);
          return;
        }
      }
    }

    setGuardando(false);
    setModal(false);
    cargarUsuarios();
  };

  const eliminar = async (u) => {
    if (!confirm(`¿Eliminar a ${u.nombre}? Se eliminarán todos sus datos.`)) return;

    if (u.cuentas?.[0]) {
      await supabase.from("movimientos").delete().eq("cuenta_id", u.cuentas[0].id);
    }
    await supabase.from("tarjetas").delete().eq("usuario_id", u.id);
    await supabase.from("cuentas").delete().eq("usuario_id", u.id);
    await supabase.from("usuarios").delete().eq("id", u.id);
    cargarUsuarios();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Usuarios</h1>
          <p className="text-sm text-gray-400">Gestión de clientes del sistema</p>
        </div>
        <button
          onClick={abrirModalNuevo}
          className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition"
        >
          <Plus size={16} />
          Nuevo usuario
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {cargando ? (
          <p className="p-6 text-sm text-gray-400">Cargando...</p>
        ) : usuarios.length === 0 ? (
          <p className="p-6 text-sm text-gray-400">No hay usuarios registrados.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-6 py-3 text-left">Nombre</th>
                <th className="px-6 py-3 text-left">DNI</th>
                <th className="px-6 py-3 text-left">Email</th>
                <th className="px-6 py-3 text-left">Teléfono</th>
                <th className="px-6 py-3 text-left">N° Cuenta</th>
                <th className="px-6 py-3 text-left">Tipo</th>
                <th className="px-6 py-3 text-left">Saldo</th>
                <th className="px-6 py-3 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {usuarios.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-medium text-gray-800">{u.nombre}</td>
                  <td className="px-6 py-4 text-gray-500">{u.dni}</td>
                  <td className="px-6 py-4 text-gray-500">{u.email}</td>
                  <td className="px-6 py-4 text-gray-500">{u.telefono}</td>
                  <td className="px-6 py-4 text-gray-500">**** {u.cuentas?.[0]?.numero?.slice(-4)}</td>
                  <td className="px-6 py-4 text-gray-500">{u.cuentas?.[0]?.tipo}</td>
                  <td className="px-6 py-4 font-bold text-green-600">S/ {Number(u.cuentas?.[0]?.saldo || 0).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => abrirModalEditar(u)}
                        className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => eliminar(u)}
                        className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-800">
                {editando ? "Editar usuario" : "Nuevo usuario"}
              </h2>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs text-gray-500 mb-1 block">Nombre completo</label>
                <input type="text" value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">DNI</label>
                <input type="text" value={form.dni}
                  onChange={(e) => setForm({ ...form, dni: e.target.value })}
                  maxLength={9}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Clave (6 dígitos)</label>
                <input type="text" value={form.clave}
                  onChange={(e) => setForm({ ...form, clave: e.target.value })}
                  maxLength={6}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Email</label>
                <input type="email" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Teléfono</label>
                <input type="text" value={form.telefono}
                  onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
              </div>

              <div className="col-span-2">
                <p className="text-xs font-semibold text-gray-400 uppercase mb-2 mt-2">Cuenta bancaria</p>
              </div>

              <div className="col-span-2">
                <label className="text-xs text-gray-500 mb-1 block">N° de cuenta (16 dígitos)</label>
                <input type="text" value={form.numero_cuenta}
                  onChange={(e) => setForm({ ...form, numero_cuenta: e.target.value })}
                  maxLength={16}
                  placeholder="Ej: 4821000000001234"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Tipo de cuenta</label>
                <select value={form.tipo_cuenta}
                  onChange={(e) => setForm({ ...form, tipo_cuenta: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400">
                  <option>Ahorro</option>
                  <option>Corriente</option>
                  <option>Plazo Fijo</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Saldo inicial (S/)</label>
                <input type="number" value={form.saldo}
                  onChange={(e) => setForm({ ...form, saldo: e.target.value })}
                  placeholder="Ej: 1000"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
              </div>
            </div>

            {error && <p className="text-xs text-red-500 mt-3">{error}</p>}

            <div className="flex gap-3 mt-6">
              <button onClick={() => setModal(false)}
                className="flex-1 border border-gray-200 text-gray-600 rounded-lg py-2 text-sm font-semibold hover:bg-gray-50 transition">
                Cancelar
              </button>
              <button onClick={guardar} disabled={guardando}
                className="flex-1 bg-red-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
                <Check size={16} />
                {guardando ? "Guardando..." : editando ? "Guardar cambios" : "Crear usuario"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}