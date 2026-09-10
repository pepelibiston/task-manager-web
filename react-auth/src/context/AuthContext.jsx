import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import api from "../api/axios";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  // ============================================================
  // CARGAR USUARIO SI EXISTE UN TOKEN
  // ============================================================

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // El interceptor de Axios también añadirá el token,
        // pero lo dejamos disponible desde el principio.
        api.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${token}`;

        const response = await api.get("/user");

        setUser(response.data);
      } catch (error) {
        console.error(
          "No se pudo recuperar el usuario:",
          error
        );

        localStorage.removeItem("token");

        delete api.defaults.headers.common[
          "Authorization"
        ];

        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // ============================================================
  // LOGIN
  // ============================================================

  const login = async (email, password) => {
    try {
      const response = await api.post("/login", {
        email,
        password,
      });

      const token =
        response.data.authorization?.token ||
        response.data.authorization?.access_token;

      if (!token) {
        throw new Error(
          "La API no devolvió un token"
        );
      }

      // Guardar token
      localStorage.setItem("token", token);

      // Guardarlo también en Axios
      api.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${token}`;

      // Obtener usuario autenticado
      const userResponse = await api.get("/user");

      setUser(userResponse.data);

      navigate("/dashboard");
    } catch (error) {
      console.error(
        "Error al iniciar sesión:",
        error
      );

      throw new Error("Credenciales inválidas");
    }
  };

  // ============================================================
  // REGISTER
  // ============================================================

  const register = async (
    name,
    email,
    password
  ) => {
    try {
      const response = await api.post("/register", {
        name,
        email,
        password,
      });

      const token =
        response.data.authorization?.token ||
        response.data.authorization?.access_token;

      if (!token) {
        throw new Error(
          "La API no devolvió un token"
        );
      }

      // Guardar token
      localStorage.setItem("token", token);

      // Guardarlo también en Axios
      api.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${token}`;

      // Obtener usuario autenticado
      const userResponse = await api.get("/user");

      setUser(userResponse.data);

      navigate("/dashboard");
    } catch (error) {
      console.error(
        "Error al registrarse:",
        error
      );

      throw new Error(
        "No se pudo registrar el usuario"
      );
    }
  };

  // ============================================================
  // LOGOUT
  // ============================================================

  const logout = async () => {
    try {
      await api.post("/logout");
    } catch (error) {
      console.warn(
        "Error en logout (token expirado o inválido):",
        error
      );
    } finally {
      localStorage.removeItem("token");

      delete api.defaults.headers.common[
        "Authorization"
      ];

      setUser(null);

      navigate("/login");
    }
  };

  // ============================================================
  // CONTEXT
  // ============================================================

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () =>
  useContext(AuthContext);