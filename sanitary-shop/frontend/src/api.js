import axios from 'axios';
const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');
const api = axios.create({ baseURL: base + '/api', timeout: 30000 });
api.interceptors.request.use((c) => {
  const t = localStorage.getItem('token');
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});
export const errMsg = (e) => e?.response?.data?.message || (e?.code === 'ECONNABORTED' ? 'Server is waking up, try again in a few seconds' : e?.message) || 'Something went wrong';
export const rs = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
export const dt = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
export default api;
