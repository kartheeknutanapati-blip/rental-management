import { useState } from 'react';

// ---------- decorative background: city skyline ----------
const B = [[0, 60, 90], [70, 50, 130], [130, 70, 70], [210, 45, 150], [265, 60, 100], [335, 80, 170], [425, 50, 110], [485, 65, 140], [560, 55, 80], [625, 75, 160], [710, 50, 100], [770, 70, 130], [850, 60, 90], [920, 80, 150], [1010, 55, 110], [1075, 60, 140], [1145, 55, 95]];
export const Skyline = () => (
  <svg viewBox="0 0 1200 200" preserveAspectRatio="none" aria-hidden="true">
    <defs><pattern id="win" width="12" height="14" patternUnits="userSpaceOnUse"><rect x="3" y="3" width="5" height="7" fill="#fff" opacity=".6" /></pattern></defs>
    {B.map(([x, w, h], i) => <g key={i}><rect x={x} y={200 - h} width={w} height={h} fill="currentColor" /><rect x={x} y={200 - h} width={w} height={h} fill="url(#win)" /></g>)}
  </svg>
);

// ---------- page banner: every page gets its own colour + icon ----------
const THEMES = {
  dashboard: ['#2f4bd8', '#7c3aed'], listings: ['#0f766e', '#14b8a6'], prefs: ['#9333ea', '#ec4899'], applications: ['#ea580c', '#f59e0b'],
  tickets: ['#dc2626', '#f97316'], add: ['#0369a1', '#38bdf8'], users: ['#334155', '#64748b'], detail: ['#1d4ed8', '#0ea5e9'],
};
export const PageHeader = ({ theme, icon, title, sub, children }) => (
  <section className="ph" style={{ '--c1': THEMES[theme][0], '--c2': THEMES[theme][1] }}>
    <div><h1>{title}</h1>{sub && <p>{sub}</p>}{children}</div>
    <span className="ph-icon" aria-hidden="true">{icon}</span>
  </section>
);
export const accent = theme => ({ '--accent': THEMES[theme][0] });

// ---------- form helpers ----------
export const L = ({ t, children }) => <label className="f"><span>{t}</span>{children}</label>;
export const Checks = ({ options, value = [], onChange }) => (
  <div className="checks">{options.map(o => (
    <label key={o} className={value.includes(o) ? 'on' : ''}><input type="checkbox" checked={value.includes(o)} onChange={e => onChange(e.target.checked ? [...value, o] : value.filter(x => x !== o))} />{o}</label>
  ))}</div>
);

// ---------- photos ----------
const shrink = f => new Promise(res => {
  const r = new FileReader();
  r.onload = () => { const img = new Image(); img.onload = () => {
    const s = Math.min(1, 800 / Math.max(img.width, img.height)), c = document.createElement('canvas');
    c.width = img.width * s; c.height = img.height * s; c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', 0.7));
  }; img.src = r.result; };
  r.readAsDataURL(f);
});
export function PhotoPicker({ value, onChange, max = 4 }) {
  const pick = async e => { const files = [...e.target.files].slice(0, max - value.length); onChange([...value, ...await Promise.all(files.map(shrink))]); e.target.value = ''; };
  return (
    <div className="photos">
      {value.map((src, i) => <div className="ph-thumb" key={i}><img src={src} alt="" /><button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))}>×</button></div>)}
      {value.length < max && <label className="ph-add">📷<small>Add photo</small><input type="file" accept="image/*" multiple hidden onChange={pick} /></label>}
    </div>
  );
}
export function Thumbs({ photos = [] }) {
  const [big, setBig] = useState(null);
  if (!photos.length) return null;
  return (<>
    <div className="photos">{photos.map((s, i) => <div className="ph-thumb" key={i} onClick={() => setBig(s)}><img src={s} alt="" /></div>)}</div>
    {big && <div className="lightbox" onClick={() => setBig(null)}><img src={big} alt="" /></div>}
  </>);
}
const hue = id => [...String(id)].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
export const PropImg = ({ p, tall }) => p.photos?.[0]
  ? <img className={'pimg' + (tall ? ' tall' : '')} src={p.photos[0]} alt={p.title} />
  : <div className={'pimg ph-art' + (tall ? ' tall' : '')} style={{ background: `linear-gradient(135deg,hsl(${hue(p.id)} 70% 62%),hsl(${hue(p.id) + 45} 70% 42%))` }}><span>🏠</span><small>{p.locality}</small></div>;
export function Gallery({ p }) {
  const list = p.photos || [], [i, setI] = useState(0);
  return (
    <div>
      {list.length ? <img className="pimg tall" src={list[i]} alt="" /> : <PropImg p={p} tall />}
      {list.length > 1 && <div className="photos" style={{ marginTop: 8 }}>{list.map((s, j) => <div key={j} className={'ph-thumb' + (i === j ? ' sel' : '')} onClick={() => setI(j)}><img src={s} alt="" /></div>)}</div>}
    </div>
  );
}

// ---------- score display ----------
export const ScoreBadge = ({ m }) => m.fit
  ? <span className={'badge ' + m.band.split(' ')[0]}>⭐ {m.score}/100 · {m.band}</span>
  : <span className="badge Not">Not a fit</span>;
export const Ring = ({ score, fit }) => {
  const c = !fit ? '#9ca3af' : score >= 80 ? '#059669' : score >= 60 ? '#d97706' : '#dc2626';
  return <div className="ring" style={{ '--v': score, '--c': c }}><div><b>{score}</b><small>/100</small></div></div>;
};
export const CRIT = {
  budget: ['Budget', 'Your monthly budget compared with the rent'],
  location: ['Location', 'Matches your preferred localities (same zone gets half credit)'],
  amenities: ['Amenities', 'How many of your wanted amenities are available'],
  size: ['Size', 'Bedrooms compared with what you need'],
  noise: ['Noise', 'Noise around the property vs how sensitive you are'],
  deposit: ['Deposit', 'Security deposit compared with your limit'],
  cleanliness: ['House rules', 'House rules you have agreed to follow'],
  stay: ['Stay length', 'Your planned stay vs the owner’s minimum stay'],
  furnishing: ['Furnishing', 'Furnishing compared with your preference'],
  movein: ['Move-in date', 'When it is available vs when you want to move'],
};
export const Status = ({ s }) => <span className={'badge st-' + s.replace(' ', '')}>{s}</span>;
