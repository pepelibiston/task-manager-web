import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // ✅ Cargar usuario si hay token guardado
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      api
        .get("/user")
        .then((res) => {
          setUser(res.data);
        })
        .catch(() => {
          setUser(null);
          localStorage.removeItem("token");
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // ✅ Login
  const login = async (email, password) => {
    try {
      const res = await api.post("/login", { email, password });
      const token = res.data.authorization.token || res.data.authorization.access_token;

      // Guarda token
      localStorage.setItem("token", token);
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      // Obtén usuario
      const userRes = await api.get("/user");
      setUser(userRes.data);

      navigate("/dashboard");
    } catch (err) {
      console.error("Error al iniciar sesión:", err);
      throw new Error("Credenciales inválidas");
    }
  };

    // ✅ Register
  const register = async (name, email, password) => {
    try {
      const res = await api.post("/register", { name, email, password });
      const token = res.data.authorization.token || res.data.authorization.access_token;

      // Guarda token
      localStorage.setItem("token", token);
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      // Obtén usuario
      const userRes = await api.get("/user");
      setUser(userRes.data);

      navigate("/dashboard");
    } catch (err) {
      console.error("Error al registrarse:", err);
      throw new Error("No se pudo registrar el usuario");
    }
  };

  // ✅ Logout
  const logout = async () => {
    try {
      await api.post("/logout");
    } catch (err) {
      console.warn("Error en logout (token ya expirado o inválido)", err);
    } finally {
      localStorage.removeItem("token");
      delete api.defaults.headers.common["Authorization"];
      setUser(null);
      navigate("/login");
    }
  };

  const refreshToken = async () => {
  try {
    const res = await api.post("/refresh");
    const newToken = res.data.authorization?.access_token;

    // ✅ Guardar el nuevo token
    localStorage.setItem("token", newToken);
    api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;

    console.log("🔄 Token renovado automáticamente");
  } catch (err) {
    console.error("Error al refrescar token:", err);
    logout(); // cerrar sesión si el refresh falla
  }
};

  return (
    <AuthContext.Provider value={{ user, login, register, logout, refreshToken, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
