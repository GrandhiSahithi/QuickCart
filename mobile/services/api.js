import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || "http://localhost:8080/api"
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("quickcart_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

export const authApi = {
  signup: (payload) => api.post("/auth/signup", payload).then((r) => r.data),
  login: (payload) => api.post("/auth/login", payload).then((r) => r.data)
};

export const storeApi = {
  list: (vertical) => api.get("/stores", { params: vertical ? { vertical } : {} }).then((r) => r.data),
  get: (id) => api.get(`/stores/${id}`).then((r) => r.data),
  products: (id) => api.get(`/stores/${id}/products`).then((r) => r.data)
};

export const orderApi = {
  create: (payload) => api.post("/orders", payload).then((r) => r.data),
  mine: () => api.get("/orders/mine").then((r) => r.data),
  get: (id) => api.get(`/orders/${id}`).then((r) => r.data),
  tracking: (id) => api.get(`/orders/${id}/tracking`).then((r) => r.data)
};
