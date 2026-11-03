import { useState } from 'react';
import { api, today } from '../api.js';
import { PageHeader, L, Checks, PhotoPicker } from '../ui.jsx';

export default function AddProperty({ meta, done }) {
  const [f, setF] = useState({ title: '', description: '', locality: Object.keys(meta.localities)[0], rent: '', deposit: '', bedrooms: 1, furnishing: 'unfurnished', amenities: [], pets_allowed: false, smoking_allowed: false, max_occupants: 4, min_stay_months: 11, available_from: today, noise: [], house_rules: [], photos: [] });
  const [err, setErr] = useState(''), [busy, setBusy] = useState(false);
  const set = (k, v) => setF({ ...f, [k]: v });
  const inp = (k, type = 'text') => <input type={type} value={f[k]} onChange={e => set(k, type === 'number' ? +e.target.value : e.target.value)} required />;
  const submit = async e => {
    e.preventDefault(); setBusy(true); setErr('');
    try { await api('/properties', 'POST', { ...f, noise_ticks: f.noise.length }); done(); } catch (x) { setErr(x.message); setBusy(false); }
  };
  return (<>
    <PageHeader theme="add" icon="🏗️" title="Add a Property" sub="Honest details and good photos help you attract well-matched tenants." />
    <form onSubmit={submit}>
      <section className="card"><h3>📝 Basics</h3>
        <div className="grid">
          <L t="Title">{inp('title')}</L>
          <L t="Locality"><select value={f.locality} onChange={e => set('locality', e.target.value)}>{Object.keys(meta.localities).map(l => <option key={l}>{l}</option>)}</select></L>
          <L t="Rent (₹/month)">{inp('rent', 'number')}</L><L t="Deposit (₹)">{inp('deposit', 'number')}</L>
          <L t="Bedrooms">{inp('bedrooms', 'number')}</L><L t="Max occupants">{inp('max_occupants', 'number')}</L>
          <L t="Minimum stay (months)">{inp('min_stay_months', 'number')}</L><L t="Available from">{inp('available_from', 'date')}</L>
          <L t="Furnishing"><select value={f.furnishing} onChange={e => set('furnishing', e.target.value)}><option value="unfurnished">Unfurnished</option><option value="semi">Semi-furnished</option><option value="furnished">Furnished</option></select></L>
        </div>
        <L t="Description (optional)"><textarea rows="3" value={f.description} onChange={e => set('description', e.target.value)} placeholder="Describe the home, the neighbourhood and what makes it special…" /></L>
      </section>
      <section className="card"><h3>📷 Photos <small className="muted">(optional, up to 4)</small></h3><PhotoPicker value={f.photos} onChange={v => set('photos', v)} /></section>
      <section className="card"><h3>🏠 Features &amp; rules</h3>
        <L t="Amenities"><Checks options={meta.amenities} value={f.amenities} onChange={v => set('amenities', v)} /></L>
        <L t="Noise around the property"><Checks options={meta.noiseOwner} value={f.noise} onChange={v => set('noise', v)} /></L>
        <L t="House rules"><Checks options={meta.rules} value={f.house_rules} onChange={v => set('house_rules', v)} /></L>
        <div className="checks"><label className={f.pets_allowed ? 'on' : ''}><input type="checkbox" checked={f.pets_allowed} onChange={e => set('pets_allowed', e.target.checked)} />🐕 Pets allowed</label>
          <label className={f.smoking_allowed ? 'on' : ''}><input type="checkbox" checked={f.smoking_allowed} onChange={e => set('smoking_allowed', e.target.checked)} />🚬 Smoking allowed</label></div>
      </section>
      {err && <p className="err">{err}</p>}
      <button className="btn big" disabled={busy}>{busy ? 'Saving…' : 'Add property'}</button>
    </form>
  </>);
}
