import axios from "axios";

// ============================================================
// INSTANCIAS AXIOS
// ============================================================

export const apiAuth = axios.create({
  baseURL: import.meta.env.VITE_AUTH_API_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

export const apiTask = axios.create({
  baseURL: import.meta.env.VITE_TASK_API_URL,
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
  // Ya hay un refresh en curso
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = apiAuth
    .post("/refresh")
    .then((response) => {
      const newToken =
        response.data.authorization?.token ||
        response.data.authorization?.access_token;

      if (!newToken) {
        throw new Error(
          "La API no devolvió un nuevo token"
        );
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

const addAuthInterceptor = (api) => {
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
};


// Añadimos el JWT a ambas APIs
addAuthInterceptor(apiAuth);
addAuthInterceptor(apiTask);


// ============================================================
// RESPONSE INTERCEPTOR
// ============================================================

const addResponseInterceptor = (api) => {
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

      // Nunca intentar refresh sobre el propio endpoint /refresh
      const url = originalRequest.url || "";

      if (url.includes("/refresh")) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        // Si ya hay otro refresh en curso, esperará ese refresh.
        const newToken = await refreshToken();

        // Actualizar el token de la petición original
        originalRequest.headers.Authorization =
          `Bearer ${newToken}`;

        // Repetir la petición original
        return api(originalRequest);

      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }
  );
};


// Añadimos el interceptor a ambas APIs
addResponseInterceptor(apiAuth);
addResponseInterceptor(apiTask);


// ============================================================
// DEFAULT EXPORT
// ============================================================

export default apiAuth;