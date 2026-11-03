import { useEffect, useState } from 'react';
import './style.css';
import { api, NAV, ROLE } from './api.js';
import { Skyline } from './ui.jsx';
import Auth from './pages/Auth.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Listings from './pages/Listings.jsx';
import PropertyDetail from './pages/PropertyDetail.jsx';
import Prefs from './pages/Prefs.jsx';
import AddProperty from './pages/AddProperty.jsx';
import Applications from './pages/Applications.jsx';
import Tickets from './pages/Tickets.jsx';
import { AdminUsers, AdminProperties } from './pages/Admin.jsx';

export default function App() {
  const [user, setUser] = useState(undefined), [meta, setMeta] = useState(null), [page, setPage] = useState({ name: 'dashboard' }), [open, setOpen] = useState(false);
  useEffect(() => { api('/me').then(setUser); api('/meta').then(setMeta); }, []);
  if (user === undefined || !meta) return <p className="center">Loading…</p>;
  if (!user) return <Auth onUser={u => { setPage({ name: 'dashboard' }); setUser(u); }} />;

  const go = (name, params = {}) => { setPage({ name, ...params }); setOpen(false); window.scrollTo(0, 0); };
  const logout = async () => { await api('/logout', 'POST'); setUser(null); setOpen(false); };
  const role = user.role, P = page.name;
  const active = P === 'detail' ? 'listings' : P;

  return (<>
    <div className="bg"><Skyline /></div>
    <header className="top">
      <button className="burger" onClick={() => setOpen(true)} aria-label="Open menu">☰</button>
      <b className="logo">🔑 Smart Rental</b>
      <span className="chip">{user.name} · {ROLE[role]}</span>
    </header>

    <div className={'scrim' + (open ? ' on' : '')} onClick={() => setOpen(false)} />
    <aside className={'drawer' + (open ? ' on' : '')}>
      <div className="d-head"><span className="avatar">{user.name[0]}</span><div><b>{user.name}</b><small>{ROLE[role]}</small></div><button onClick={() => setOpen(false)} aria-label="Close menu">×</button></div>
      <nav>{NAV[role].map(([k, icon, label]) => <button key={k} className={active === k ? 'on' : ''} onClick={() => go(k)}><span>{icon}</span>{label}</button>)}</nav>
      <button className="logout" onClick={logout}>🚪 Logout</button>
    </aside>

    <main key={P + (page.id || '')}>
      {P !== 'dashboard' && (
        <div className="backs">
          {P === 'detail' && <button onClick={() => go('listings')}>← Back to listings</button>}
          <button onClick={() => go('dashboard')}>🏠 Dashboard</button>
        </div>)}
      {P === 'dashboard' && <Dashboard user={user} go={go} />}
      {P === 'listings' && (role === 'admin' ? <AdminProperties /> : <Listings role={role} meta={meta} go={go} />)}
      {P === 'detail' && <PropertyDetail id={page.id} go={go} />}
      {P === 'prefs' && <Prefs meta={meta} go={go} />}
      {P === 'add' && <AddProperty meta={meta} done={() => go('listings')} />}
      {P === 'applications' && <Applications role={role} go={go} />}
      {P === 'tickets' && <Tickets role={role} go={go} />}
      {P === 'users' && <AdminUsers />}
    </main>
  </>);
}
