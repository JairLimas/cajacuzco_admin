import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Bandeja from "./pages/Bandeja";
import BandejaCreditos from "./pages/BandejaCreditos";
import PreSolicitud from "./pages/PreSolicitud";
import Registro from "./pages/Registro";
import Comite from "./pages/Comite";
import Desembolso from "./pages/Desembolso";
import BandejaMora from "./pages/BandejaMora";
import Usuarios from "./pages/Usuarios";

const isAuth = () => localStorage.getItem("admin_auth") === "true";
const getAdminRol = () => localStorage.getItem("admin_rol") || "";

// Protege por autenticación
const PrivateRoute = ({ children }) => {
  return isAuth() ? children : <Navigate to="/login" />;
};

// Protege por rol — si no tiene permiso muestra pantalla de acceso denegado
const RolRoute = ({ children, rolesPermitidos }) => {
  if (!isAuth()) return <Navigate to="/login" />;
  const rol = getAdminRol();
  if (!rolesPermitidos.includes(rol)) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 text-center">
        <p className="text-5xl mb-4">🔒</p>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Acceso denegado</h2>
        <p className="text-sm text-gray-400">
          Tu rol <span className="font-semibold text-red-600">({rol})</span> no tiene permisos para acceder a esta sección.
        </p>
      </div>
    );
  }
  return children;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/" element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }>
          {/* Todos los roles */}
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="bandeja" element={<Bandeja />} />
          <Route path="bandeja-creditos" element={<BandejaCreditos />} />
          <Route path="pre-solicitud" element={<PreSolicitud />} />
          <Route path="registro" element={<Registro />} />

          {/* Solo administrador, jefe_regional y riesgos pueden ver comité */}
          <Route path="comite" element={
            <RolRoute rolesPermitidos={["administrador", "jefe_regional", "riesgos", "asesor"]}>
              <Comite />
            </RolRoute>
          } />

          {/* Solo administrador, jefe_regional y riesgos pueden desembolsar */}
          <Route path="desembolso" element={
            <RolRoute rolesPermitidos={["administrador", "jefe_regional", "riesgos"]}>
              <Desembolso />
            </RolRoute>
          } />

          {/* Solo riesgos y jefe_regional gestionan mora */}
          <Route path="mora" element={
            <RolRoute rolesPermitidos={["riesgos", "jefe_regional", "administrador"]}>
              <BandejaMora />
            </RolRoute>
          } />

          {/* Solo administrador gestiona usuarios */}
          <Route path="usuarios" element={
            <RolRoute rolesPermitidos={["administrador"]}>
              <Usuarios />
            </RolRoute>
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}