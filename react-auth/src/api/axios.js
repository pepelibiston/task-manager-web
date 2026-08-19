import axios from "axios";

const apiAuth = axios.create({
  baseURL: import.meta.env.VITE_AUTH_API_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Añadir automáticamente el JWT
apiAuth.interceptors.request.use(
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
apiAuth.interceptors.response.use(
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
        const response = await apiAuth.post("/refresh");

        const newToken =
          response.data.authorization?.token ||
          response.data.authorization?.access_token;

        if (!newToken) {
          throw new Error("La apiAuth no devolvió un nuevo token");
        }

        localStorage.setItem("token", newToken);

        apiAuth.defaults.headers.common["Authorization"] =
          `Bearer ${newToken}`;

        originalRequest.headers.Authorization =
          `Bearer ${newToken}`;

        console.log("🔄 Token renovado automáticamente");

        return apiAuth(originalRequest);

      } catch (refreshError) {
        console.error(
          "❌ No se pudo refrescar el token:",
          refreshError
        );

        localStorage.removeItem("token");
        delete apiAuth.defaults.headers.common["Authorization"];

        window.location.href = "/login";

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiAuth;