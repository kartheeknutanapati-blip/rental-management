// Run with:  npm run seed      (WARNING: wipes users, properties, applications, tickets and preferences first)
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { User, Prefs, Property, Ticket, Application } from './models.js';
import { scoreProperty } from './score.js';

await mongoose.connect(process.env.MONGODB_URI);
await Promise.all([User, Prefs, Property, Ticket, Application].map(m => m.deleteMany({})));

const day = n => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
const hash = pw => bcrypt.hashSync(pw, 10);

// ---------- users ----------
const people = [
  ['Admin', 'admin@rental.com', 'Admin@123', 'admin', '9000000000'],
  ['Ravi Kumar', 'owner1@rental.com', 'Owner@123', 'landlord', '9845012301'],
  ['Meera Nair', 'owner2@rental.com', 'Owner@123', 'landlord', '9845012302'],
  ['Suresh Gowda', 'owner3@rental.com', 'Owner@123', 'landlord', '9845012303'],
  ['Ananya Rao', 'tenant1@rental.com', 'Tenant@123', 'tenant', '9731000001'],
  ['Karthik S', 'tenant2@rental.com', 'Tenant@123', 'tenant', '9731000002'],
  ['Priya Menon', 'tenant3@rental.com', 'Tenant@123', 'tenant', '9731000003'],
  ['Arjun Reddy', 'tenant4@rental.com', 'Tenant@123', 'tenant', '9731000004'],
];
const U = {};
for (const [name, email, pw, role, phone] of people) U[email] = await User.create({ name, email, phone, role, password_hash: hash(pw) });
const [o1, o2, o3] = ['owner1', 'owner2', 'owner3'].map(k => U[k + '@rental.com']._id);

// ---------- properties ----------
const P = (owner, title, locality, rent, deposit, bedrooms, furnishing, amenities, pets, smoking, occ, stay, from, noise, rules, description) =>
  ({ owner_id: owner, title, locality, rent, deposit, bedrooms, furnishing, amenities, pets_allowed: pets, smoking_allowed: smoking, max_occupants: occ, min_stay_months: stay, available_from: day(from), noise_ticks: noise.length, house_rules: rules, description });
const all = ['parking', 'lift', 'power backup', 'water', 'security'];
const props = await Property.insertMany([
  P(o1, 'Sunny 2BHK near Indiranagar Metro', 'Indiranagar', 32000, 96000, 2, 'semi', ['parking', 'lift', 'power backup', 'water', 'security'], false, false, 4, 11, 5, ['main road'], ['regular cleaning', 'no indoor smoking', 'no loud parties'], 'Bright corner flat on the 3rd floor, 5 minutes from the metro. Modular kitchen, balcony and 24x7 security.'),
  P(o1, 'Cosy 1BHK for Working Professionals', 'Koramangala', 21000, 63000, 1, 'furnished', ['lift', 'power backup', 'water', 'security'], false, false, 2, 6, 10, ['market or bar nearby'], ['no loud parties', 'shoes off indoors'], 'Fully furnished studio-style 1BHK with AC, wardrobe and fast broadband point. Walkable cafes and gyms.'),
  P(o1, 'Spacious 3BHK Family Home', 'Jayanagar', 45000, 135000, 3, 'unfurnished', all, true, false, 6, 12, 20, [], ['regular cleaning', 'no wall damage'], 'Ground-floor independent house with garden, two-wheeler and car parking. Quiet tree-lined street near parks and schools.'),
  P(o1, 'Budget Single Room with Attached Bath', 'Shivajinagar', 9500, 19000, 1, 'semi', ['water', 'security'], false, false, 1, 3, 2, ['main road', 'market or bar nearby'], ['regular cleaning', 'no loud parties', 'no indoor smoking'], 'Compact room ideal for students and single professionals. Bus stop and market at the doorstep.'),
  P(o2, 'Modern 2BHK in Whitefield Tech Hub', 'Whitefield', 28000, 84000, 2, 'furnished', all, true, false, 4, 11, 8, ['construction nearby'], ['regular cleaning', 'no wall damage'], 'Gated community flat with clubhouse and pool, 10 minutes from the major tech parks. Pet friendly.'),
  P(o2, 'HSR Layout Sunlit 3BHK', 'HSR Layout', 38000, 114000, 3, 'semi', ['parking', 'lift', 'power backup', 'water'], true, false, 5, 11, 15, [], ['no indoor smoking', 'shoes off indoors'], 'Airy top-floor apartment with a terrace and plenty of cross ventilation. Close to the HSR sector markets.'),
  P(o2, 'Peaceful 2BHK in Malleshwaram', 'Malleshwaram', 24000, 72000, 2, 'unfurnished', ['parking', 'water', 'security'], false, false, 4, 11, 12, ['school or railway nearby'], ['regular cleaning', 'no loud parties', 'shoes off indoors'], 'Traditional neighbourhood with temples, parks and a vegetable market nearby. Ideal for small families.'),
  P(o2, 'Studio Apartment near MG Road', 'MG Road', 26000, 78000, 1, 'furnished', ['lift', 'power backup', 'water', 'security'], false, true, 2, 6, 3, ['main road', 'market or bar nearby'], ['no wall damage'], 'Central studio with metro access. Smoking permitted on the balcony. Perfect for those who love city life.'),
  P(o3, 'Affordable 2BHK in Yelahanka', 'Yelahanka', 15000, 45000, 2, 'unfurnished', ['parking', 'water', 'power backup'], true, false, 5, 11, 7, [], ['regular cleaning'], 'Peaceful, greener north Bengaluru locality with wide roads and easy access to the airport road.'),
  P(o3, 'Rajajinagar 1BHK with Parking', 'Rajajinagar', 17500, 52500, 1, 'semi', ['parking', 'lift', 'water', 'security'], false, false, 3, 11, 18, ['market or bar nearby'], ['no loud parties', 'no indoor smoking'], 'Well-connected 1BHK close to the metro and Orion Mall area. Covered parking available.'),
  P(o3, 'Premium 3BHK Penthouse Indiranagar', 'Indiranagar', 62000, 248000, 3, 'furnished', all, true, false, 5, 12, 25, [], ['regular cleaning', 'no wall damage', 'shoes off indoors'], 'Designer penthouse with private terrace, modular kitchen and branded fittings. Quiet, premium building.'),
  P(o3, 'Compact 1BHK in Koramangala', 'Koramangala', 19000, 57000, 1, 'unfurnished', ['water', 'security', 'power backup'], false, false, 2, 6, 1, ['construction nearby', 'market or bar nearby'], ['no loud parties'], 'Budget-friendly 1BHK in the middle of the startup hub. Short stays welcome.'),
]);

// ---------- tenant preferences ----------
const pref = (o) => ({ budget: 30000, localities: [], bedrooms: 1, amenities: [], deposit_limit: 100000, move_in: day(10), stay_months: 12, furnishing: '', has_pets: false, smokes: false, occupants: 1, noise_q: [], rules_agreed: [], ...o });
const prefs = {
  'tenant1@rental.com': pref({ budget: 34000, localities: ['Indiranagar', 'Koramangala', 'HSR Layout'], bedrooms: 2, amenities: ['parking', 'lift', 'security'], deposit_limit: 110000, occupants: 3, furnishing: 'semi', noise_q: ['works from home'], rules_agreed: ['regular cleaning', 'no indoor smoking', 'no loud parties', 'shoes off indoors', 'no wall damage'] }),
  'tenant2@rental.com': pref({ budget: 22000, localities: ['Koramangala', 'MG Road'], bedrooms: 1, amenities: ['lift', 'power backup'], deposit_limit: 70000, stay_months: 8, furnishing: 'furnished', smokes: true, rules_agreed: ['no wall damage', 'no loud parties'] }),
  'tenant3@rental.com': pref({ budget: 30000, localities: ['Whitefield', 'HSR Layout'], bedrooms: 2, amenities: ['parking', 'water', 'power backup'], deposit_limit: 90000, occupants: 2, has_pets: true, move_in: day(8), noise_q: ['light sleeper'], rules_agreed: ['regular cleaning', 'no wall damage'] }),
  'tenant4@rental.com': pref({ budget: 11000, localities: ['Shivajinagar', 'Rajajinagar'], bedrooms: 1, amenities: ['water', 'security'], deposit_limit: 25000, stay_months: 6, move_in: day(3), noise_q: ['studying for exams'], rules_agreed: ['regular cleaning', 'no loud parties', 'no indoor smoking'] }),
};
for (const [email, data] of Object.entries(prefs)) await Prefs.create({ user_id: U[email]._id, data });

// ---------- applications & tickets ----------
const t = k => U[k + '@rental.com']._id;
const apply = async (tenant, pi, status, message) => {
  const p = props[pi].toObject(), pr = prefs[tenant + '@rental.com'], m = scoreProperty(pr, { ...p, id: String(p._id) });
  return Application.create({ property_id: p._id, tenant_id: t(tenant), message, phone: U[tenant + '@rental.com'].phone, move_in: pr.move_in, score: m.score, fit: m.fit, status });
};
await apply('tenant1', 0, 'Accepted', 'Hi, we are a family of three and would love to move in next month.');
await apply('tenant1', 5, 'Pending', 'Interested in the HSR 3BHK as a backup option. Can we visit this weekend?');
await apply('tenant2', 1, 'Accepted', 'Working professional, looking for a 6-8 month stay. Happy to share ID proofs.');
await apply('tenant2', 7, 'Pending', 'The studio looks perfect since smoking on the balcony is allowed.');
await apply('tenant3', 4, 'Accepted', 'We have a small dog and are looking for a pet friendly home.');
await apply('tenant4', 3, 'Pending', 'Student preparing for exams, need a quiet room. Can the deposit be reduced?');
await apply('tenant4', 9, 'Rejected', 'Looking for a 1BHK near the metro.');

const ticket = (tenant, pi, title, description, priority, status) => Ticket.create({ property_id: props[pi]._id, tenant_id: t(tenant), title, description, priority, status });
await ticket('tenant1', 0, 'Kitchen tap is leaking', 'The kitchen sink tap has been dripping since yesterday and the cabinet below is getting wet.', 'high', 'Open');
await ticket('tenant1', 0, 'Balcony light not working', 'The balcony bulb holder seems to have a loose connection.', 'low', 'Resolved');
await ticket('tenant2', 1, 'AC not cooling', 'The bedroom AC runs but the room does not cool down. Needs servicing.', 'medium', 'In Progress');
await ticket('tenant3', 4, 'Water heater tripping the fuse', 'Every time the geyser is switched on the main fuse trips.', 'high', 'Open');

console.log('\nSeed complete: %d users, %d properties.\n', people.length, props.length);
console.table(people.map(([name, email, pw, role]) => ({ role, name, 'login id (email)': email, password: pw })));
await mongoose.disconnect();
