export const LOCALITIES = { Indiranagar:'East', Whitefield:'East', Koramangala:'South', 'HSR Layout':'South', Jayanagar:'South',
  Malleshwaram:'North', Yelahanka:'North', Rajajinagar:'West', 'MG Road':'Central', Shivajinagar:'Central' };
export const AMENITIES = ['parking', 'lift', 'power backup', 'water', 'security'];
export const RULES = ['regular cleaning', 'no indoor smoking', 'no loud parties', 'shoes off indoors', 'no wall damage'];
export const NOISE_OWNER = ['main road', 'market or bar nearby', 'school or railway nearby', 'construction nearby'];
export const NOISE_TENANT = ['works from home', 'light sleeper', 'studying for exams', 'young children or elderly at home'];

const FURN = { unfurnished: 0, semi: 1, furnished: 2 };
const W = { budget:22, location:15, amenities:12, size:10, noise:10, deposit:8, cleanliness:8, stay:5, furnishing:5, movein:5 };
const pct = (a, b) => Math.round(Math.min(1, a / b) * 100);

// t = tenant preferences, p = property row. Returns hard-rule result + weighted score out of 100.
export function scoreProperty(t, p) {
  const failed = [];
  if (t.has_pets && !p.pets_allowed) failed.push('Pets not allowed');
  if (t.smokes && !p.smoking_allowed) failed.push('Smoking not allowed');
  if (t.occupants > p.max_occupants) failed.push('Exceeds maximum occupants');
  if (p.rent > 1.15 * t.budget) failed.push('Rent is above 115% of your budget');

  const pref = t.localities || [], want = t.amenities || [], has = p.amenities || [], rules = p.house_rules || [];
  const lateWeeks = Math.max(0, Math.ceil((new Date(p.available_from) - new Date(t.move_in)) / 6048e5));
  const s = {
    budget: pct(t.budget, p.rent),
    location: pref.includes(p.locality) ? 100 : pref.some(l => LOCALITIES[l] === LOCALITIES[p.locality]) ? 50 : 0,
    amenities: want.length ? pct(want.filter(a => has.includes(a)).length, want.length) : 100,
    size: p.bedrooms >= t.bedrooms ? 100 : 40,
    noise: Math.max(0, 100 - 25 * Math.max(0, (1 + p.noise_ticks) - (5 - (t.noise_q || []).length))),
    deposit: pct(t.deposit_limit, p.deposit),
    cleanliness: rules.length ? pct(rules.filter(r => (t.rules_agreed || []).includes(r)).length, rules.length) : 100,
    stay: pct(t.stay_months, p.min_stay_months),
    furnishing: t.furnishing ? [100, 50, 0][Math.abs(FURN[t.furnishing] - FURN[p.furnishing])] : 100,
    movein: Math.max(0, 100 - 10 * lateWeeks),
  };
  const breakdown = Object.entries(W).map(([key, weight]) => ({ key, score: s[key], weight, points: +(s[key] * weight / 100).toFixed(2) }));
  const score = Math.round(breakdown.reduce((a, b) => a + b.points, 0));
  return { fit: !failed.length, failed, score, band: score >= 80 ? 'Great match' : score >= 60 ? 'Good match' : 'Weak match', breakdown };
}
