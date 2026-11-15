import axios from "axios";
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://sanitary-shop.onrender.com/api",
});
api.interceptors.request.use((c) => {
  const t = localStorage.getItem("token");
  if (t) c.headers.Authorization = "Bearer " + t;
  return c;
});
export const err = (e) => e.response?.data?.message || e.message;
export default api;
