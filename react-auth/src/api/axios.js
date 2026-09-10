import axios from "axios";

// ============================================================
// API GATEWAY
// ============================================================

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});


// ============================================================
// TOKEN
// ============================================================

const getToken = () => {
  return localStorage.getItem("token");
};

const saveToken = (token) => {
  localStorage.setItem("token", token);
};

const logout = () => {
  localStorage.removeItem("token");
  window.location.href = "/login";
};


// ============================================================
// REFRESH TOKEN
// ============================================================

// Evita hacer varios refresh simultáneamente.
// Si varias peticiones reciben 401 al mismo tiempo,
// todas esperan esta misma Promise.

let refreshPromise = null;

const refreshToken = async () => {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = api
    .get("/refresh")
    .then((response) => {
      const newToken =
        response.data.authorization?.token ||
        response.data.authorization?.access_token;

      if (!newToken) {
        throw new Error("La API no devolvió un nuevo token");
      }

      saveToken(newToken);

      console.log("🔄 Token renovado automáticamente");

      return newToken;
    })
    .catch((error) => {
      console.error(
        "❌ No se pudo refrescar el token:",
        error
      );

      logout();

      throw error;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
};


// ============================================================
// REQUEST INTERCEPTOR
// ============================================================

api.interceptors.request.use(
  (config) => {
    const token = getToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);


// ============================================================
// RESPONSE INTERCEPTOR
// ============================================================

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Solo actuar ante un 401
    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // Evitar bucles infinitos
    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    // Nunca hacer refresh sobre /refresh
    const url = originalRequest.url || "";

    if (url.includes("/refresh")) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const newToken = await refreshToken();

      originalRequest.headers.Authorization =
        `Bearer ${newToken}`;

      return api(originalRequest);

    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  }
);


// ============================================================
// DEFAULT EXPORT
// ============================================================

export default api;
