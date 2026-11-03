import { useEffect, useState } from 'react';
import { api, today } from '../api.js';
import { PageHeader, L, Checks } from '../ui.jsx';

export default function Prefs({ meta, go }) {
  const [p, setP] = useState({ budget: 30000, localities: [], bedrooms: 1, amenities: [], deposit_limit: 100000, move_in: today, stay_months: 12, furnishing: '', has_pets: false, smokes: false, occupants: 1, noise_q: [], rules_agreed: [] });
  const [msg, setMsg] = useState('');
  useEffect(() => { api('/prefs').then(d => d && setP(d)); }, []);
  const set = (k, v) => setP({ ...p, [k]: v });
  const num = k => e => set(k, +e.target.value);
  const save = async e => { e.preventDefault(); await api('/prefs', 'PUT', p); setMsg('Saved ✔'); setTimeout(() => go('listings'), 700); };
  return (<>
    <PageHeader theme="prefs" icon="🎯" title="My Preferences" sub="The more accurate this is, the better your Owner Tenant Scores will be." />
    <form onSubmit={save}>
      <section className="card"><h3>💰 Budget &amp; stay</h3>
        <div className="grid">
          <L t="Monthly budget (₹)"><input type="number" value={p.budget} onChange={num('budget')} required /></L>
          <L t="Deposit limit (₹)"><input type="number" value={p.deposit_limit} onChange={num('deposit_limit')} required /></L>
          <L t="Planned stay (months)"><input type="number" min="1" value={p.stay_months} onChange={num('stay_months')} /></L>
          <L t="Move-in date"><input type="date" value={p.move_in} onChange={e => set('move_in', e.target.value)} /></L>
        </div>
      </section>
      <section className="card"><h3>🛏️ The home</h3>
        <div className="grid">
          <L t="Bedrooms needed"><input type="number" min="1" value={p.bedrooms} onChange={num('bedrooms')} /></L>
          <L t="Occupants"><input type="number" min="1" value={p.occupants} onChange={num('occupants')} /></L>
          <L t="Furnishing"><select value={p.furnishing} onChange={e => set('furnishing', e.target.value)}><option value="">No preference</option><option value="unfurnished">Unfurnished</option><option value="semi">Semi-furnished</option><option value="furnished">Furnished</option></select></L>
        </div>
        <L t="Preferred localities (max 3)"><Checks options={Object.keys(meta.localities)} value={p.localities} onChange={v => v.length <= 3 && set('localities', v)} /></L>
        <L t="Amenities you want"><Checks options={meta.amenities} value={p.amenities} onChange={v => set('amenities', v)} /></L>
      </section>
      <section className="card"><h3>🌿 Lifestyle</h3>
        <L t="Noise: tick what applies to you"><Checks options={meta.noiseTenant} value={p.noise_q} onChange={v => set('noise_q', v)} /></L>
        <L t="House rules you agree to"><Checks options={meta.rules} value={p.rules_agreed} onChange={v => set('rules_agreed', v)} /></L>
        <div className="checks"><label className={p.has_pets ? 'on' : ''}><input type="checkbox" checked={p.has_pets} onChange={e => set('has_pets', e.target.checked)} />🐕 I have pets</label>
          <label className={p.smokes ? 'on' : ''}><input type="checkbox" checked={p.smokes} onChange={e => set('smokes', e.target.checked)} />🚬 I smoke</label></div>
      </section>
      <p><button className="btn big">Save preferences</button> <span className="ok">{msg}</span></p>
    </form>
  </>);
}
