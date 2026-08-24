import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080/api"
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("quickcart_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

export const authApi = {
  signup: (payload) => api.post("/auth/signup", payload).then((r) => r.data),
  adminSignup: (payload) => api.post("/auth/admin-signup", payload).then((r) => r.data),
  login: (payload) => api.post("/auth/login", payload).then((r) => r.data)
};

export const accountApi = {
  me: () => api.get("/account/me").then((r) => r.data),
  subscribe: () => api.post("/account/subscribe").then((r) => r.data),
  unsubscribe: () => api.post("/account/unsubscribe").then((r) => r.data)
};

export const storeApi = {
  list: (vertical, coords) =>
    api
      .get("/stores", { params: { ...(vertical ? { vertical } : {}), ...(coords ? { lat: coords.lat, lng: coords.lng } : {}) } })
      .then((r) => r.data),
  get: (id, coords) =>
    api.get(`/stores/${id}`, { params: coords ? { lat: coords.lat, lng: coords.lng } : {} }).then((r) => r.data),
  products: (id) => api.get(`/stores/${id}/products`).then((r) => r.data)
};

export const orderApi = {
  create: (payload) => api.post("/orders", payload).then((r) => r.data),
  mine: () => api.get("/orders/mine").then((r) => r.data),
  get: (id) => api.get(`/orders/${id}`).then((r) => r.data),
  tracking: (id) => api.get(`/orders/${id}/tracking`).then((r) => r.data)
};

export const adminApi = {
  stores: () => api.get("/admin/stores").then((r) => r.data),
  orders: () => api.get("/admin/orders").then((r) => r.data),
  stats: () => api.get("/admin/stats").then((r) => r.data)
};
