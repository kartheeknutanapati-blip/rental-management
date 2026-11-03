import { useEffect, useState } from 'react';
import { api, money, fmtDate, today } from '../api.js';
import { PageHeader, Gallery, Ring, ScoreBadge, CRIT, Status, L } from '../ui.jsx';

const barColor = v => v >= 80 ? '#059669' : v >= 50 ? '#d97706' : '#dc2626';

export default function PropertyDetail({ id, go }) {
  const [p, setP] = useState(null), [err, setErr] = useState(''), [show, setShow] = useState(''), [msg, setMsg] = useState('');
  const [f, setF] = useState({ message: '', phone: '', move_in: today }), [busy, setBusy] = useState(false);
  const load = () => api('/properties/' + id).then(setP).catch(e => setErr(e.message));
  useEffect(() => { load(); }, [id]);
  if (err) return <div className="card empty">{err}</div>;
  if (!p) return <p className="center">Loading…</p>;
  const m = p.match;
  const apply = async e => {
    e.preventDefault(); setBusy(true);
    try { await api('/applications', 'POST', { ...f, property_id: p.id }); setShow(''); setMsg('Application sent! The owner can now see it. Track it under My Applications.'); load(); }
    catch (x) { setMsg(x.message); } finally { setBusy(false); }
  };
  return (<>
    <PageHeader theme="detail" icon="🏡" title={p.title} sub={`📍 ${p.locality} · ${p.bedrooms} BHK · ${p.furnishing}`} />
    <div className="detail">
      <div className="dleft">
        <Gallery p={p} />
        <section className="card">
          <div className="row between"><h2 className="rent">{money(p.rent)}<small>/month</small></h2><span className="muted">Deposit {money(p.deposit)}</span></div>
          {p.description && <p>{p.description}</p>}
          <div className="facts">
            <div><small>Bedrooms</small><b>{p.bedrooms}</b></div><div><small>Max occupants</small><b>{p.max_occupants}</b></div>
            <div><small>Minimum stay</small><b>{p.min_stay_months} mo</b></div><div><small>Available from</small><b>{fmtDate(p.available_from)}</b></div>
            <div><small>Pets</small><b>{p.pets_allowed ? 'Allowed' : 'Not allowed'}</b></div><div><small>Smoking</small><b>{p.smoking_allowed ? 'Allowed' : 'Not allowed'}</b></div>
          </div>
          <h4>Amenities</h4><div className="tags">{p.amenities?.length ? p.amenities.map(a => <span key={a}>✔ {a}</span>) : <span className="muted">None listed</span>}</div>
          <h4>House rules</h4><div className="tags">{p.house_rules?.length ? p.house_rules.map(a => <span key={a}>📜 {a}</span>) : <span className="muted">No special rules</span>}</div>
          <h4>Noise</h4><p className="muted">{p.noise_ticks ? `${p.noise_ticks} noise factor(s) nearby (from the owner’s listing).` : 'The owner reports no noise concerns nearby.'}</p>
        </section>
      </div>

      <div className="dright">
        {m ? (
          <section className="card why">
            <h3>Why this score?</h3>
            <div className="row" style={{ gap: 16 }}><Ring score={m.score} fit={m.fit} /><div><ScoreBadge m={m} /><p className="muted">{m.fit ? 'Weighted across 10 criteria based on your preferences.' : 'Some of your deal-breakers are not met, so no score is given.'}</p></div></div>
            {!m.fit && <ul className="fails">{m.failed.map(x => <li key={x}>⛔ {x}</li>)}</ul>}
            {m.fit && m.breakdown.map(b => (
              <div className="bar" key={b.key}>
                <div className="row between"><span><b>{CRIT[b.key][0]}</b> <small className="muted">{b.points}/{b.weight} pts</small></span><small>{b.score}%</small></div>
                <div className="track"><i style={{ width: b.score + '%', background: barColor(b.score) }} /></div>
                <small className="muted">{CRIT[b.key][1]}</small>
              </div>))}
          </section>
        ) : <section className="card notice">🎯 <button className="link" onClick={() => go('prefs')}>Set your preferences</button> to see how well this home fits you.</section>}

        <section className="card contact">
          <h3>Interested?</h3>
          {msg && <p className="ok">{msg}</p>}
          {p.application
            ? <p>Your application status: <Status s={p.application.status} /> <small className="muted">· sent {fmtDate(p.application.createdAt)}</small></p>
            : <div className="row"><button className="btn" onClick={() => setShow(show === 'apply' ? '' : 'apply')}>📨 Apply for this property</button>
                <button className="btn ghost" onClick={() => setShow(show === 'contact' ? '' : 'contact')}>📞 Contact owner</button></div>}
          {p.application && <button className="btn ghost sm" style={{ marginTop: 8 }} onClick={() => setShow(show === 'contact' ? '' : 'contact')}>📞 Contact owner</button>}
          {show === 'contact' && <div className="owner"><b>{p.owner.name}</b><a href={`mailto:${p.owner.email}`}>✉️ {p.owner.email}</a>{p.owner.phone && <a href={`tel:${p.owner.phone}`}>📱 {p.owner.phone}</a>}</div>}
          {show === 'apply' && (
            <form onSubmit={apply} className="apply">
              <L t="Message to the owner"><textarea rows="3" placeholder="Introduce yourself and your household…" value={f.message} onChange={e => setF({ ...f, message: e.target.value })} required /></L>
              <div className="grid2">
                <L t="Your phone"><input value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} required /></L>
                <L t="Planned move-in"><input type="date" value={f.move_in} onChange={e => setF({ ...f, move_in: e.target.value })} required /></L>
              </div>
              {m && <small className="muted">Your score ({m.fit ? m.score + '/100' : 'Not a fit'}) is shared with the owner.</small>}
              <button className="btn" disabled={busy}>{busy ? 'Sending…' : 'Send application'}</button>
            </form>)}
        </section>
      </div>
    </div>
  </>);
}
