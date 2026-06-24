import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Inbox, ClipboardList, FileText,
  Users, CheckCircle, AlertTriangle, UserCog, BadgeDollarSign
} from "lucide-react";

export default function Sidebar() {
  return (
    <div className="w-64 min-h-screen bg-red-700 flex flex-col">
      <div className="px-6 py-5 border-b border-red-600">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <span className="text-red-600 text-xs font-bold">CC</span>
          </div>
          <div>
            <h1 className="text-white text-sm font-bold leading-tight">Caja Cusco</h1>
            <p className="text-red-200 text-xs">Core Financiero</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <p className="text-xs font-semibold text-red-300 uppercase px-3 mb-2">Principal</p>
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium mb-1 transition ${
              isActive ? "bg-white text-red-700" : "text-red-100 hover:bg-red-600"
            }`
          }
        >
          <LayoutDashboard size={16} />
          Dashboard
        </NavLink>

        <p className="text-xs font-semibold text-red-300 uppercase px-3 mt-4 mb-2">Gestión</p>
        <NavLink
          to="/usuarios"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium mb-1 transition ${
              isActive ? "bg-white text-red-700" : "text-red-100 hover:bg-red-600"
            }`
          }
        >
          <UserCog size={16} />
          Usuarios
        </NavLink>

        <p className="text-xs font-semibold text-red-300 uppercase px-3 mt-4 mb-2">Otorgamiento de Créditos</p>

        {[
          { to: "/bandeja", icon: Inbox, label: "Bandeja de préstamos" },
          { to: "/bandeja-creditos", icon: BadgeDollarSign, label: "Bandeja de créditos" },
          { to: "/pre-solicitud", icon: ClipboardList, label: "1. Pre-solicitud" },
          { to: "/registro", icon: FileText, label: "2. Registro de solicitud" },
          { to: "/comite", icon: Users, label: "3. Propuesta y comité" },
          { to: "/desembolso", icon: CheckCircle, label: "4. Aprobación y desembolso" },
        ].map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium mb-1 transition ${
                isActive ? "bg-white text-red-700" : "text-red-100 hover:bg-red-600"
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}

        <p className="text-xs font-semibold text-red-300 uppercase px-3 mt-4 mb-2">Recuperaciones</p>
        <NavLink
          to="/mora"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium mb-1 transition ${
              isActive ? "bg-white text-red-700" : "text-red-100 hover:bg-red-600"
            }`
          }
        >
          <AlertTriangle size={16} />
          Bandeja de mora
        </NavLink>
      </nav>

      <div className="px-4 py-4 border-t border-red-600">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white font-bold text-xs">
            AD
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Administrador</p>
            <p className="text-xs text-red-200">Ag. 0001</p>
          </div>
        </div>
      </div>
    </div>
  );
}