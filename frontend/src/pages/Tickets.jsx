import { useEffect, useState } from 'react';
import { api, fmtDate } from '../api.js';
import { PageHeader, L, PhotoPicker, Thumbs } from '../ui.jsx';

const STEPS = ['Open', 'In Progress', 'Resolved'], PRI = { low: '🟢 Low', medium: '🟡 Medium', high: '🔴 High' };

export default function Tickets({ role, go }) {
  const [rows, setRows] = useState(null), [homes, setHomes] = useState([]), [tab, setTab] = useState('All'), [err, setErr] = useState(''), [ok, setOk] = useState('');
  const [f, setF] = useState({ property_id: '', title: '', description: '', priority: 'medium', photos: [] });
  const load = () => api('/tickets').then(setRows);
  useEffect(() => {
    load();
    if (role === 'tenant') api('/applications').then(a => setHomes(a.filter(x => x.status === 'Accepted')));
  }, []);
  const list = rows || [], count = s => s === 'All' ? list.length : list.filter(t => t.status === s).length;
  const shown = list.filter(t => tab === 'All' || t.status === tab);
  const add = async e => {
    e.preventDefault(); setErr('');
    try { await api('/tickets', 'POST', f); setF({ ...f, title: '', description: '', photos: [] }); setOk('Ticket submitted ✔'); load(); } catch (x) { setErr(x.message); }
  };
  const setStatus = async (id, status) => { await api('/tickets/' + id, 'PATCH', { status }); load(); };
  return (<>
    <PageHeader theme="tickets" icon="🛠️" title="Maintenance Tickets" sub={role === 'tenant' ? 'Report a problem at your home and follow it until it is fixed.' : 'Track and resolve maintenance requests.'} />

    {role === 'tenant' && (
      <form className="card" onSubmit={add}>
        <h3>Report an issue</h3>
        {!homes.length
          ? <p className="muted">You can raise tickets once an owner accepts your application. <button type="button" className="link" onClick={() => go('applications')}>Check my applications</button></p>
          : <>
            <div className="grid">
              <L t="Your home"><select value={f.property_id} onChange={e => setF({ ...f, property_id: e.target.value })} required><option value="">Select property</option>{homes.map(h => <option key={h.id} value={h.property_id}>{h.property?.title}</option>)}</select></L>
              <L t="Issue title"><input placeholder="e.g. Kitchen tap leaking" value={f.title} onChange={e => setF({ ...f, title: e.target.value })} required /></L>
            </div>
            <div className="f"><span>Priority</span><div className="seg">{Object.keys(PRI).map(k => <button type="button" key={k} className={f.priority === k ? 'on ' + k : ''} onClick={() => setF({ ...f, priority: k })}>{PRI[k]}</button>)}</div></div>
            <L t="Describe the problem"><textarea rows="3" value={f.description} onChange={e => setF({ ...f, description: e.target.value })} required /></L>
            <div className="f"><span>Photos (optional)</span><PhotoPicker value={f.photos} onChange={v => setF({ ...f, photos: v })} /></div>
            {err && <p className="err">{err}</p>}{ok && <p className="ok">{ok}</p>}
            <button className="btn">Submit ticket</button>
          </>}
      </form>)}

    <div className="pills">{['All', ...STEPS].map(s => <button key={s} className={tab === s ? 'on' : ''} onClick={() => setTab(s)}>{s} <b>{count(s)}</b></button>)}</div>
    {rows && !shown.length && <div className="card empty">No tickets here. 🎉</div>}
    {shown.map(t => (
      <article className={'card ticket pri-' + t.priority} key={t.id}>
        <div className="row between"><h3>{t.title}</h3><span className="badge">{PRI[t.priority]}</span></div>
        <p className="muted">🏠 {t.property}{role !== 'tenant' && t.tenant && <> · reported by <b>{t.tenant}</b></>} · {fmtDate(t.createdAt)}</p>
        <p>{t.description}</p>
        <Thumbs photos={t.photos} />
        <div className="flow">{STEPS.map((s, i) => <span key={s} className={STEPS.indexOf(t.status) >= i ? 'done' : ''}><i>{i + 1}</i>{s}</span>)}</div>
        {role !== 'tenant' && <div className="row" style={{ marginTop: 10 }}>{STEPS.filter(s => s !== t.status).map(s => <button key={s} className="btn ghost sm" onClick={() => setStatus(t.id, s)}>Mark {s}</button>)}</div>}
      </article>))}
  </>);
}
