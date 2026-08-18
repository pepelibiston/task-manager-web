import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Añadir automáticamente el JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Gestionar respuestas
api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    const url = originalRequest.url || "";

    // No intentar refresh en login, register ni refresh
    const isAuthRequest =
      url.includes("/login") ||
      url.includes("/register") ||
      url.includes("/refresh");

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthRequest
    ) {
      originalRequest._retry = true;

      try {
        const response = await api.post("/refresh");

        const newToken =
          response.data.authorization?.token ||
          response.data.authorization?.access_token;

        if (!newToken) {
          throw new Error("La API no devolvió un nuevo token");
        }

        localStorage.setItem("token", newToken);

        api.defaults.headers.common["Authorization"] =
          `Bearer ${newToken}`;

        originalRequest.headers.Authorization =
          `Bearer ${newToken}`;

        console.log("🔄 Token renovado automáticamente");

        return api(originalRequest);

      } catch (refreshError) {
        console.error(
          "❌ No se pudo refrescar el token:",
          refreshError
        );

        localStorage.removeItem("token");
        delete api.defaults.headers.common["Authorization"];

        window.location.href = "/login";

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;