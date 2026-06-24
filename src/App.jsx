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

const PrivateRoute = ({ children }) => {
  return isAuth() ? children : <Navigate to="/login" />;
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
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="bandeja" element={<Bandeja />} />
          <Route path="bandeja-creditos" element={<BandejaCreditos />} />
          <Route path="pre-solicitud" element={<PreSolicitud />} />
          <Route path="registro" element={<Registro />} />
          <Route path="comite" element={<Comite />} />
          <Route path="desembolso" element={<Desembolso />} />
          <Route path="mora" element={<BandejaMora />} />
          <Route path="usuarios" element={<Usuarios />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}