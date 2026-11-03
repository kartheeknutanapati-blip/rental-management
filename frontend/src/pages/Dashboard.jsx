import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { PageHeader } from '../ui.jsx';

const CARDS = {
  tenant: [['properties', '🔍', 'Homes available', 'listings'], ['applications', '📨', 'My applications', 'applications'], ['tickets', '🛠️', 'Open tickets', 'tickets']],
  landlord: [['properties', '🏢', 'My properties', 'listings'], ['applications', '📨', 'Pending applications', 'applications'], ['tickets', '🛠️', 'Open tickets', 'tickets']],
  admin: [['users', '👥', 'Users', 'users'], ['properties', '🏢', 'Properties', 'listings'], ['applications', '📨', 'Applications', null], ['tickets', '🛠️', 'Open tickets', 'tickets']],
};
const ACTIONS = {
  tenant: [['prefs', '🎯', 'Set your preferences', 'Tell us your budget, habits and must-haves so scores are personal.'], ['listings', '🔍', 'Browse properties', 'See every home ranked by how well it fits you.'], ['applications', '📨', 'Track applications', 'Follow the status of homes you applied for.']],
  landlord: [['add', '➕', 'Add a property', 'List a home with photos, house rules and noise details.'], ['applications', '📨', 'Review applications', 'See who applied and how well they match your home.'], ['tickets', '🛠️', 'Handle tickets', 'Keep maintenance requests moving to resolved.']],
  admin: [['users', '👥', 'Manage users', 'View and remove owner and tenant accounts.'], ['listings', '🏢', 'Moderate properties', 'Review every listing on the platform.'], ['tickets', '🛠️', 'Oversee tickets', 'Monitor maintenance requests across properties.']],
};

export default function Dashboard({ user, go }) {
  const [s, setS] = useState({});
  useEffect(() => { api('/stats').then(setS); }, []);
  const hello = { tenant: 'Ready to find a home that fits your life?', landlord: 'Manage your homes and meet well-matched tenants.', admin: 'Here is everything happening on the platform.' }[user.role];
  return (<>
    <PageHeader theme="dashboard" icon="🏙️" title={`Hello, ${user.name.split(' ')[0]}!`} sub={hello} />

    <div className="stats">
      {CARDS[user.role].map(([k, icon, label, to]) => (
        <button key={k} className="stat" onClick={() => to && go(to)} disabled={!to}><span>{icon}</span><b>{s[k] ?? '–'}</b><small>{label}</small></button>
      ))}
    </div>

    <section className="card feature">
      <div>
        <span className="tag">★ What makes us different</span>
        <h2>The Owner Tenant Score</h2>
        <p>Most rental sites only list homes. We tell you <b>how suitable</b> a home is. Each tenant–property pair gets a score out of 100 from ten weighted criteria such as budget, location, amenities, noise, house rules and move-in date. Hard deal-breakers like pets, smoking or occupancy are checked first. Open any property to see exactly <i>why</i> it earned its score.</p>
      </div>
      <div className="steps">
        <div><b>1</b>Share your needs</div><div><b>2</b>We score every home</div><div><b>3</b>See why, then apply</div>
      </div>
    </section>

    <h3 className="sec">Quick actions</h3>
    <div className="actions">
      {ACTIONS[user.role].map(([to, icon, t, d]) => <button className="card action" key={to} onClick={() => go(to)}><span>{icon}</span><b>{t}</b><small>{d}</small></button>)}
    </div>
  </>);
}
