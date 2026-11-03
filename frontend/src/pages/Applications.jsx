import { useEffect, useState } from 'react';
import { api, money, fmtDate } from '../api.js';
import { PageHeader, Status } from '../ui.jsx';

export default function Applications({ role, go }) {
  const [rows, setRows] = useState(null), [tab, setTab] = useState('All');
  const load = () => api('/applications').then(setRows);
  useEffect(() => { load(); }, []);
  const owner = role === 'landlord', list = rows || [];
  const count = s => s === 'All' ? list.length : list.filter(a => a.status === s).length;
  const shown = list.filter(a => tab === 'All' || a.status === tab);
  const decide = async (id, status) => { await api('/applications/' + id, 'PATCH', { status }); load(); };
  const score = a => a.score == null ? null : a.fit ? <span className="badge Good">⭐ {a.score}/100</span> : <span className="badge Not">Not a fit</span>;
  return (<>
    <PageHeader theme="applications" icon="📨" title={owner ? 'Applications' : 'My Applications'}
      sub={owner ? 'Tenants who applied for your properties, with their Owner Tenant Score.' : 'Homes you have applied for and where each application stands.'} />
    <div className="pills">{['All', 'Pending', 'Accepted', 'Rejected','Ended'].map(s => <button key={s} className={tab === s ? 'on' : ''} onClick={() => setTab(s)}>{s} <b>{count(s)}</b></button>)}</div>
    {rows && !shown.length && <div className="card empty">No applications here yet.{!owner && <> <button className="link" onClick={() => go('listings')}>Browse properties</button></>}</div>}
    {shown.map(a => (
      <article className={'card app st-bd-' + a.status} key={a.id}>
        <div className="row between">
          <div>
            <h3>{owner ? a.tenant?.name : a.property?.title}</h3>
            <p className="muted">{owner ? <>applied for <b>{a.property?.title}</b> · {a.property?.locality} · {money(a.property?.rent)}/mo</>
              : <>📍 {a.property?.locality} · {a.property?.bedrooms} BHK · {money(a.property?.rent)}/mo</>}</p>
          </div>
          <div className="row">{score(a)}<Status s={a.status} /></div>
        </div>
        {a.message && <blockquote>“{a.message}”</blockquote>}
        <small className="muted">Sent {fmtDate(a.createdAt)} · wants to move in {a.move_in ? fmtDate(a.move_in) : '–'}</small>
        {owner && <>
          <div className="tags" style={{ margin: '10px 0' }}>
            {a.profile.occupants && <span>👥 {a.profile.occupants} occupant(s)</span>}{a.profile.budget && <span>💰 budget {money(a.profile.budget)}</span>}
            {a.profile.stay_months && <span>🗓️ stay {a.profile.stay_months} mo</span>}{a.profile.has_pets && <span>🐕 has pets</span>}{a.profile.smokes && <span>🚬 smoker</span>}
          </div>
          <div className="row between">
            <div className="owner inline"><a href={`mailto:${a.tenant?.email}`}>✉️ {a.tenant?.email}</a>{(a.phone || a.tenant?.phone) && <a href={`tel:${a.phone || a.tenant.phone}`}>📱 {a.phone || a.tenant.phone}</a>}</div>
            {['Accepted', 'Ended'].includes(a.status)
          ? <small className="muted">🔒 {a.status === 'Accepted' ? 'Accepted: locked. To take new applications, mark the property available again in My Properties.' : 'Tenancy ended.'}</small>
         : <div className="row">
          {a.status !== 'Accepted' && <button className="btn sm ok-btn" onClick={() => decide(a.id, 'Accepted')}>✔ Accept</button>}
           {a.status !== 'Rejected' && <button className="btn sm danger" onClick={() => decide(a.id, 'Rejected')}>✕ Reject</button>}
           </div>}
          </div>
        </>}
        {!owner && <button className="btn ghost sm" style={{ marginTop: 8 }} onClick={() => go('detail', { id: a.property_id })}>View property</button>}
      </article>
    ))}
  </>);
}
