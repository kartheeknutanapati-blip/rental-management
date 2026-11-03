import { useEffect, useState } from 'react';
import { api, money, fmtDate } from '../api.js';
import { PageHeader } from '../ui.jsx';

export function AdminUsers() {
  const [rows, setRows] = useState(null), [q, setQ] = useState('');
  const load = () => api('/admin/users').then(setRows);
  useEffect(() => { load(); }, []);
  const del = async u => { if (confirm(`Delete ${u.name}? Their properties, applications and tickets are removed too.`)) { await api('/admin/users/' + u.id, 'DELETE'); load(); } };
  const shown = (rows || []).filter(u => (u.name + u.email + u.role).toLowerCase().includes(q.toLowerCase()));
  return (<>
    <PageHeader theme="users" icon="👥" title="Users" sub="Every owner and tenant on the platform." />
    <div className="filters card"><input placeholder="Search name, email or role" value={q} onChange={e => setQ(e.target.value)} /><span className="muted">{shown.length} users</span></div>
    <div className="card tbl"><table><thead><tr><th>Name</th><th>Email (login ID)</th><th>Phone</th><th>Role</th><th>Joined</th><th /></tr></thead>
      <tbody>{shown.map(u => <tr key={u.id}><td><b>{u.name}</b></td><td>{u.email}</td><td>{u.phone || '–'}</td><td><span className={'badge role-' + u.role}>{u.role === 'landlord' ? 'owner' : u.role}</span></td><td>{fmtDate(u.createdAt)}</td>
        <td>{u.role !== 'admin' && <button className="btn sm danger" onClick={() => del(u)}>Delete</button>}</td></tr>)}</tbody></table></div>
  </>);
}

export function AdminProperties() {
  const [rows, setRows] = useState(null);
  const load = () => api('/admin/properties').then(setRows);
  useEffect(() => { load(); }, []);
  const del = async p => { if (confirm(`Remove "${p.title}"?`)) { await api('/admin/properties/' + p.id, 'DELETE'); load(); } };
  return (<>
    <PageHeader theme="listings" icon="🏢" title="All Properties" sub="Review and moderate every listing." />
    <div className="card tbl"><table><thead><tr><th>Property</th><th>Locality</th><th>Owner</th><th>Rent</th><th>Status</th><th /></tr></thead>
      <tbody>{(rows || []).map(p => <tr key={p.id}><td><b>{p.title}</b><br /><small className="muted">{p.bedrooms} BHK · {p.furnishing}</small></td><td>{p.locality}</td><td>{p.owner}</td><td>{money(p.rent)}</td>
        <td><span className={'badge ' + (p.available ? 'Great' : 'Not')}>{p.available ? 'Available' : 'Unavailable'}</span></td><td><button className="btn sm danger" onClick={() => del(p)}>Remove</button></td></tr>)}</tbody></table></div>
  </>);
}
