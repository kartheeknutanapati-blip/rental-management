import { useEffect, useState } from 'react';
import { api, money } from '../api.js';
import { PageHeader, PropImg, ScoreBadge } from '../ui.jsx';

export default function Listings({ role, meta, go }) {
  const [rows, setRows] = useState(null), [maxRent, setMaxRent] = useState(''), [loc, setLoc] = useState(''), [beds, setBeds] = useState('');
  const load = () => api('/properties').then(setRows);
  useEffect(() => { load(); }, []);
  const tenant = role === 'tenant';
  const shown = (rows || []).filter(p => (!maxRent || p.rent <= +maxRent) && (!loc || p.locality === loc) && (!beds || p.bedrooms === +beds));

  const toggleAvailable = async p => {
    if (!p.available && !confirm("Mark available again? The current tenant's accepted application will be closed and they will no longer be able to raise tickets.")) return;
    await api('/properties/' + p.id, 'PATCH', { available: !p.available });
    load();
  };

  return (<>
    <PageHeader theme="listings" icon="🏘️" title={tenant ? 'Browse Properties' : 'My Properties'}
      sub={tenant ? 'Homes ranked by your Owner Tenant Score. Click a property to see the details and why it scored that way.' : 'Everything you have listed. Rented homes are locked until the tenant vacates.'} />
    <div className="filters card">
      <input type="number" placeholder="Max rent ₹" value={maxRent} onChange={e => setMaxRent(e.target.value)} />
      <select value={loc} onChange={e => setLoc(e.target.value)}><option value="">All localities</option>{Object.keys(meta.localities).map(l => <option key={l}>{l}</option>)}</select>
      <select value={beds} onChange={e => setBeds(e.target.value)}><option value="">Any BHK</option>{[1, 2, 3].map(b => <option key={b} value={b}>{b} BHK</option>)}</select>
      <span className="muted">{shown.length} homes</span>
    </div>
    {tenant && rows?.length > 0 && !rows[0].match && <div className="card notice">🎯 Fill in <button className="link" onClick={() => go('prefs')}>your preferences</button> to see Owner Tenant Scores on every property.</div>}
    {rows && !shown.length && <div className="card empty">No properties found.{!tenant && <> <button className="link" onClick={() => go('add')}>Add your first property</button></>}</div>}
    <div className="pgrid">
      {shown.map(p => (
        <article key={p.id} className={'card prop' + (tenant ? ' click' : '')} onClick={() => tenant && go('detail', { id: p.id })}>
          <PropImg p={p} />
          <div className="pbody">
            <div className="row between">
              <h3>{p.title}</h3>
              {p.rented ? <span className="badge st-Accepted">🔒 Rented</span> : !p.available && <span className="badge Not">Unavailable</span>}
            </div>
            <p className="muted">📍 {p.locality} · {p.bedrooms} BHK · {p.furnishing}</p>
            <div className="row between"><b className="rent">{money(p.rent)}<small>/mo</small></b>{p.match && <ScoreBadge m={p.match} />}</div>
            {tenant
              ? <span className="link-hint">View details →</span>
              : <button className="btn sm" onClick={() => toggleAvailable(p)}>
                  {p.rented ? 'Tenant vacated: mark available' : p.available ? 'Mark unavailable' : 'Mark available'}
                </button>}
          </div>
        </article>
      ))}
    </div>
  </>);
}