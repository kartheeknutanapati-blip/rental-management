import { useState } from 'react';
import { api } from '../api.js';
import { Skyline } from '../ui.jsx';

const DEMO = [['👑 Admin', 'admin@rental.com', 'Admin@123'], ['🏢 Owner', 'owner1@rental.com', 'Owner@123'], ['🔑 Tenant', 'tenant1@rental.com', 'Tenant@123']];

export default function Auth({ onUser }) {
  const [f, setF] = useState({ name: '', email: '', phone: '', password: '', role: 'tenant' });
  const [reg, setReg] = useState(false), [err, setErr] = useState(''), [busy, setBusy] = useState(false);
  const set = k => e => setF({ ...f, [k]: e.target.value });
  const submit = async e => {
    e.preventDefault(); setErr(''); setBusy(true);
    try { onUser(await api(reg ? '/register' : '/login', 'POST', f)); } catch (x) { setErr(x.message); } finally { setBusy(false); }
  };
  return (
    <div className="auth-wrap">
      <div className="bg"><Skyline /></div>
      <aside className="auth-hero">
        <div className="brand">🔑 Smart Rental</div>
        <h1>Find a home that<br />actually <em>fits you</em>.</h1>
        <p>Every property gets an <b>Owner Tenant Score</b> out of 100, built from your budget, habits, location and house rules, so you know how suitable a home is before you visit.</p>
        <ul>
          <li>🏡 Verified owners &amp; honest house rules</li>
          <li>⭐ A transparent score, with the reasons behind it</li>
          <li>🛠️ Maintenance tickets with photos, in one place</li>
        </ul>
        <div className="skyline-strip"><Skyline /></div>
      </aside>
      <section className="auth-panel">
        <form className="auth-card" onSubmit={submit}>
          <div className="tabs">
            <button type="button" className={!reg ? 'on' : ''} onClick={() => setReg(false)}>Sign in</button>
            <button type="button" className={reg ? 'on' : ''} onClick={() => setReg(true)}>Register</button>
          </div>
          <h2>{reg ? 'Create your account' : 'Welcome back 👋'}</h2>
          <p className="sub">{reg ? 'Join as a tenant looking for a home or an owner listing one.' : 'Sign in to continue to your dashboard.'}</p>
          {reg && <div className="role-pick">
            {[['tenant', '🔑', 'I’m a tenant'], ['landlord', '🏢', 'I’m an owner']].map(([v, i, t]) => <button type="button" key={v} className={f.role === v ? 'on' : ''} onClick={() => setF({ ...f, role: v })}><span>{i}</span>{t}</button>)}
          </div>}
          {reg && <input placeholder="Full name" value={f.name} onChange={set('name')} required />}
          <input type="email" placeholder="Email" value={f.email} onChange={set('email')} required />
          {reg && <input placeholder="Phone (optional)" value={f.phone} onChange={set('phone')} />}
          <input type="password" placeholder="Password" value={f.password} onChange={set('password')} required />
          {err && <p className="err">{err}</p>}
          <button className="btn big" disabled={busy}>{busy ? 'Please wait…' : reg ? 'Create account' : 'Sign in'}</button>
          {!reg && <div className="demo">
            <small>Demo accounts (click to fill)</small>
            <div>{DEMO.map(([l, e, p]) => <button type="button" key={e} onClick={() => setF({ ...f, email: e, password: p })}>{l}</button>)}</div>
          </div>}
        </form>
      </section>
    </div>
  );
}
