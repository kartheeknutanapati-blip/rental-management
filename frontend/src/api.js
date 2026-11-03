export const today = new Date().toISOString().slice(0, 10);
export const money = n => '₹' + Number(n || 0).toLocaleString('en-IN');
export const fmtDate = d => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export const api = async (path, method = 'GET', body) => {
  const r = await fetch('/api' + path, { method, credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  const d = await r.json().catch(() => null);
  if (!r.ok) throw new Error(d?.error || 'Request failed');
  return d;
};

// Sidebar (hamburger menu) entries for each role: [page key, icon, label]
export const NAV = {
  tenant: [['dashboard', '🏠', 'Dashboard'], ['listings', '🔍', 'Browse Properties'], ['prefs', '🎯', 'My Preferences'], ['applications', '📨', 'My Applications'], ['tickets', '🛠️', 'Maintenance Tickets']],
  landlord: [['dashboard', '🏠', 'Dashboard'], ['listings', '🏢', 'My Properties'], ['add', '➕', 'Add Property'], ['applications', '📨', 'Applications'], ['tickets', '🛠️', 'Tickets']],
  admin: [['dashboard', '📊', 'Dashboard'], ['users', '👥', 'Users'], ['listings', '🏢', 'All Properties'], ['tickets', '🛠️', 'Tickets']],
};
export const ROLE = { tenant: 'Tenant', landlord: 'Owner', admin: 'Admin' };
