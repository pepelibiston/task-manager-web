import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000/api",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Interceptor: añade el token a cada request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 👉 Interceptor para detectar errores 401 (token expirado)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si el token expiró y no se ha intentado refrescar aún
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Aquí llamamos a la función refreshToken() del AuthContext
        const auth = getAuthContext(); // función auxiliar
        await auth.refreshToken();

        // Reintentar la petición original con el nuevo token
        originalRequest.headers["Authorization"] = `Bearer ${localStorage.getItem("token")}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.error("❌ No se pudo refrescar el token:", refreshError);
        auth.logout(); // cerrar sesión si el refresh falla
      }
    }

    return Promise.reject(error);
  }
);

export default api;
