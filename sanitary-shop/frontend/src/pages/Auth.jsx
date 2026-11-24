import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { errMsg } from '../api';
import { useApp } from '../context.jsx';
import { Field } from '../components/ui.jsx';

export default function Auth() {
  const [mode, setMode] = useState('login');
  const [f, setF] = useState({ name: '', email: '', phone: '', password: '' });
  const [busy, setBusy] = useState(false);
  const { login } = useApp();
  const nav = useNavigate();
  const up = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault(); setBusy(true);
    try {
      const { data } = await api.post(mode === 'login' ? '/auth/login' : '/auth/register', f);
      login(data); toast.success(`Welcome, ${data.user.name.split(' ')[0]}`);
      nav(data.user.role === 'admin' ? '/admin' : '/');
    } catch (x) { toast.error(errMsg(x)); } finally { setBusy(false); }
  };
  return (
    <form className="card auth" onSubmit={submit}>
      <h2>{mode === 'login' ? 'Log in' : 'Create your account'}</h2>
      {mode === 'register' && <Field label="Full name"><input required value={f.name} onChange={up('name')} /></Field>}
      <Field label="Email"><input type="email" required value={f.email} onChange={up('email')} /></Field>
      {mode === 'register' && <Field label="Mobile number (order updates by SMS)"><input required inputMode="numeric" maxLength={10} value={f.phone} onChange={up('phone')} /></Field>}
      <Field label="Password"><input type="password" required minLength={6} value={f.password} onChange={up('password')} /></Field>
      <button className="btn" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}</button>
      <button type="button" className="ghost" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
        {mode === 'login' ? 'New here? Create an account' : 'Already registered? Log in'}
      </button>
    </form>
  );
}
