import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { LOCALITIES, AMENITIES, RULES, NOISE_OWNER, NOISE_TENANT, scoreProperty } from './score.js';
import { User, Prefs, Property, Ticket, Application, ser } from './models.js';

await mongoose.connect(process.env.MONGODB_URI);

const app = express();
app.set('trust proxy', 1);
app.use(express.json({ limit: '15mb' })); // photos arrive as base64
app.use(session({
  store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),   // cookie sessions stored in MongoDB (no JWT)
  secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: false,
  cookie: { httpOnly: true, maxAge: 7 * 864e5, sameSite: process.env.CROSS_SITE ? 'none' : 'lax', secure: !!process.env.CROSS_SITE },
}));

const need = (...roles) => (req, res, next) =>
  req.session.user && (!roles.length || roles.includes(req.session.user.role)) ? next() : res.status(401).json({ error: 'Not allowed' });
const h = fn => (req, res) => fn(req, res).catch(e => { console.error(e); res.status(500).json({ error: 'Server error' }); });
const ownedIds = uid => Property.find({ owner_id: uid }).distinct('_id');
const rentedIds = () => Application.distinct('property_id', { status: 'Accepted' });   // properties that currently have an accepted tenant
const pics = a => (Array.isArray(a) ? a : []).filter(x => typeof x === 'string' && x.startsWith('data:image/')).slice(0, 6);
const validId = id => mongoose.isValidObjectId(id);

// ---- Auth ----
app.post('/api/register', h(async (req, res) => {
  const { name, email, phone, password, role } = req.body;
  if (!name || !email || !password || password.length < 6 || !['tenant', 'landlord'].includes(role)) return res.status(400).json({ error: 'Invalid details (password min 6 chars)' });
  if (await User.exists({ email: email.toLowerCase() })) return res.status(400).json({ error: 'Email already registered' });
  const u = await User.create({ name, email: email.toLowerCase(), phone, password_hash: await bcrypt.hash(password, 10), role });
  req.session.user = { id: String(u._id), name: u.name, role: u.role }; res.json(req.session.user);
}));
app.post('/api/login', h(async (req, res) => {
  const u = await User.findOne({ email: String(req.body.email).toLowerCase() });
  if (!u || !(await bcrypt.compare(req.body.password || '', u.password_hash))) return res.status(401).json({ error: 'Wrong email or password' });
  req.session.user = { id: String(u._id), name: u.name, role: u.role }; res.json(req.session.user);
}));
app.post('/api/logout', (req, res) => req.session.destroy(() => res.json({ ok: true })));
app.get('/api/me', (req, res) => res.json(req.session.user || null));
app.get('/api/meta', (_, res) => res.json({ localities: LOCALITIES, amenities: AMENITIES, rules: RULES, noiseOwner: NOISE_OWNER, noiseTenant: NOISE_TENANT }));

// ---- Dashboard numbers ----
app.get('/api/stats', need(), h(async (req, res) => {
  const u = req.session.user, open = { status: { $ne: 'Resolved' } };
  if (u.role === 'tenant') {
    const rented = await rentedIds();
    const [properties, applications, tickets] = await Promise.all([
      Property.countDocuments({ available: true, _id: { $nin: rented } }),
      Application.countDocuments({ tenant_id: u.id }),
      Ticket.countDocuments({ tenant_id: u.id, ...open }),
    ]);
    return res.json({ properties, applications, tickets });
  }
  if (u.role === 'landlord') {
    const ids = await ownedIds(u.id);
    const [applications, tickets] = await Promise.all([Application.countDocuments({ property_id: { $in: ids }, status: 'Pending' }), Ticket.countDocuments({ property_id: { $in: ids }, ...open })]);
    return res.json({ properties: ids.length, applications, tickets });
  }
  const [users, properties, applications, tickets] = await Promise.all([User.countDocuments({ role: { $ne: 'admin' } }), Property.countDocuments(), Application.countDocuments(), Ticket.countDocuments(open)]);
  res.json({ users, properties, applications, tickets });
}));

// ---- Tenant preferences ----
app.get('/api/prefs', need('tenant'), h(async (req, res) => res.json((await Prefs.findOne({ user_id: req.session.user.id }).lean())?.data || null)));
app.put('/api/prefs', need('tenant'), h(async (req, res) => {
  await Prefs.updateOne({ user_id: req.session.user.id }, { data: req.body }, { upsert: true }); res.json({ ok: true });
}));

// ---- Properties (tenants get them ranked by Owner Tenant Score) ----
app.get('/api/properties', need('tenant', 'landlord'), h(async (req, res) => {
  const u = req.session.user, rented = await rentedIds();
  const query = u.role === 'landlord' ? { owner_id: u.id } : { available: true, _id: { $nin: rented } };
  let rows = (await Property.find(query, { photos: { $slice: 1 } }).sort({ _id: -1 }).lean()).map(ser);
  if (u.role === 'tenant') {
    const pr = await Prefs.findOne({ user_id: u.id }).lean();
    if (pr) rows = rows.map(p => ({ ...p, match: scoreProperty(pr.data, p) }))
                       .sort((a, b) => (b.match.fit - a.match.fit) || (b.match.score - a.match.score));
  } else {
    const set = new Set(rented.map(String));
    rows = rows.map(p => ({ ...p, rented: set.has(p.id), available: p.available && !set.has(p.id) }));
  }
  res.json(rows);
}));

// one property: all photos, owner contact, and (for tenants) the full score breakdown + application status
app.get('/api/properties/:id', need('tenant', 'landlord'), h(async (req, res) => {
  if (!validId(req.params.id)) return res.status(404).json({ error: 'Not found' });
  const p = await Property.findById(req.params.id).populate('owner_id', 'name email phone').lean();
  const u = req.session.user;
  if (!p || (u.role === 'landlord' && String(p.owner_id._id) !== u.id)) return res.status(404).json({ error: 'Not found' });
  const out = { ...ser({ ...p, owner_id: String(p.owner_id._id) }), owner: { name: p.owner_id.name, email: p.owner_id.email, phone: p.owner_id.phone } };
  if (u.role === 'tenant') {
    const pr = await Prefs.findOne({ user_id: u.id }).lean();
    if (pr) out.match = scoreProperty(pr.data, out);
    const a = await Application.findOne({ property_id: p._id, tenant_id: u.id }).lean();
    if (a) out.application = { status: a.status, createdAt: a.createdAt };
  }
  res.json(out);
}));

app.post('/api/properties', need('landlord'), h(async (req, res) => {
  const { title, description, locality, rent, deposit, bedrooms, furnishing, amenities, pets_allowed, smoking_allowed, max_occupants, min_stay_months, available_from, noise_ticks, house_rules, photos } = req.body;
  const p = await Property.create({ owner_id: req.session.user.id, title, description, locality, rent, deposit, bedrooms, furnishing, amenities, pets_allowed: !!pets_allowed, smoking_allowed: !!smoking_allowed, max_occupants, min_stay_months, available_from, noise_ticks, house_rules, photos: pics(photos) });
  res.json(ser(p.toObject()));
}));
app.patch('/api/properties/:id', need('landlord'), h(async (req, res) => {
  const available = !!req.body.available;
  const r = await Property.updateOne({ _id: req.params.id, owner_id: req.session.user.id }, { available });
  // owner reopens the property = previous tenant has vacated, so close their accepted application
  if (available && r.matchedCount) await Application.updateMany({ property_id: req.params.id, status: 'Accepted' }, { status: 'Ended' });
  res.json({ ok: true });
}));

// ---- Applications (tenant applies, owner reviews) ----
app.post('/api/applications', need('tenant'), h(async (req, res) => {
  const u = req.session.user, { property_id, message, phone, move_in } = req.body;
  const p = validId(property_id) && await Property.findById(property_id).lean();
  if (!p || !p.available || (await rentedIds()).some(id => String(id) === String(p._id))) return res.status(400).json({ error: 'Property is not available' });
  if (await Application.exists({ property_id, tenant_id: u.id })) return res.status(400).json({ error: 'You have already applied for this property' });
  const pr = await Prefs.findOne({ user_id: u.id }).lean(), m = pr && scoreProperty(pr.data, ser(p));
  await Application.create({ property_id, tenant_id: u.id, message, phone, move_in, score: m?.score, fit: m?.fit });
  res.json({ ok: true });
}));
app.get('/api/applications', need('tenant', 'landlord'), h(async (req, res) => {
  const u = req.session.user;
  if (u.role === 'tenant') {
    const rows = await Application.find({ tenant_id: u.id }).sort({ _id: -1 }).populate('property_id', 'title locality rent bedrooms').lean();
    return res.json(rows.map(a => ({ ...ser(a), property: a.property_id && ser(a.property_id), property_id: a.property_id?._id })));
  }
  const rows = await Application.find({ property_id: { $in: await ownedIds(u.id) } }).sort({ _id: -1 })
    .populate('property_id', 'title locality rent').populate('tenant_id', 'name email phone').lean();
  const prefs = await Prefs.find({ user_id: { $in: rows.map(a => a.tenant_id?._id) } }).lean();
  const pm = Object.fromEntries(prefs.map(x => [String(x.user_id), x.data]));
  res.json(rows.map(a => {
    const d = pm[String(a.tenant_id?._id)] || {};
    return { ...ser(a), property: a.property_id && ser(a.property_id), tenant: a.tenant_id && { name: a.tenant_id.name, email: a.tenant_id.email, phone: a.tenant_id.phone },
      profile: { occupants: d.occupants, budget: d.budget, stay_months: d.stay_months, has_pets: d.has_pets, smokes: d.smokes } };
  }));
}));
app.patch('/api/applications/:id', need('landlord'), h(async (req, res) => {
  const { status } = req.body;
  if (!['Pending', 'Accepted', 'Rejected'].includes(status)) return res.status(400).json({ error: 'Bad status' });
  const a = await Application.findOne({ _id: req.params.id, property_id: { $in: await ownedIds(req.session.user.id) } });
  if (!a) return res.status(404).json({ error: 'Not found' });
  if (['Accepted', 'Ended'].includes(a.status)) return res.status(400).json({ error: 'An accepted application cannot be changed. Mark the property available again to take new applications.' });
  if (status === 'Accepted') {
    if (await Application.exists({ property_id: a.property_id, status: 'Accepted' })) return res.status(400).json({ error: 'This property already has an accepted tenant' });
    await Property.updateOne({ _id: a.property_id }, { available: false });   // rented out
  }
  a.status = status; await a.save();
  res.json({ ok: true });
}));

// ---- Maintenance tickets ----
app.get('/api/tickets', need(), h(async (req, res) => {
  const u = req.session.user;
  const filter = u.role === 'tenant' ? { tenant_id: u.id } : u.role === 'landlord' ? { property_id: { $in: await ownedIds(u.id) } } : {};
  const rows = await Ticket.find(filter).sort({ _id: -1 }).populate('property_id', 'title').populate('tenant_id', 'name').lean();
  res.json(rows.map(t => ({ ...ser(t), property: t.property_id?.title, property_id: t.property_id?._id, tenant: t.tenant_id?.name, tenant_id: t.tenant_id?._id })));
}));
app.post('/api/tickets', need('tenant'), h(async (req, res) => {
  const { property_id, title, description, priority, photos } = req.body, u = req.session.user;
  if (!validId(property_id) || !(await Application.exists({ property_id, tenant_id: u.id, status: 'Accepted' })))
    return res.status(400).json({ error: 'You can raise tickets only for a property where your application was accepted' });
  res.json(ser((await Ticket.create({ property_id, tenant_id: u.id, title, description, priority, photos: pics(photos) })).toObject()));
}));
app.patch('/api/tickets/:id', need('landlord', 'admin'), h(async (req, res) => {
  const u = req.session.user, f = { _id: req.params.id };
  if (u.role === 'landlord') f.property_id = { $in: await ownedIds(u.id) };
  await Ticket.updateOne(f, { status: req.body.status }, { runValidators: true }); res.json({ ok: true });
}));

// ---- Admin ----
app.get('/api/admin/users', need('admin'), h(async (_, res) => res.json((await User.find().select('name email phone role createdAt').sort({ role: 1, _id: 1 }).lean()).map(ser))));
app.get('/api/admin/properties', need('admin'), h(async (_, res) => {
  const rows = await Property.find({}, { photos: { $slice: 1 } }).sort({ _id: -1 }).populate('owner_id', 'name').lean();
  res.json(rows.map(p => ({ ...ser(p), owner: p.owner_id?.name, owner_id: p.owner_id?._id })));
}));
app.delete('/api/admin/users/:id', need('admin'), h(async (req, res) => {
  const u = await User.findById(req.params.id);
  if (!u || u.role === 'admin') return res.status(400).json({ error: 'Cannot delete this user' });
  const ids = u.role === 'landlord' ? await ownedIds(u._id) : [];
  await Promise.all([Application.deleteMany({ $or: [{ tenant_id: u._id }, { property_id: { $in: ids } }] }), Ticket.deleteMany({ $or: [{ tenant_id: u._id }, { property_id: { $in: ids } }] }),
    Property.deleteMany({ owner_id: u._id }), Prefs.deleteMany({ user_id: u._id }), User.deleteOne({ _id: u._id })]);
  res.json({ ok: true });
}));
app.delete('/api/admin/properties/:id', need('admin'), h(async (req, res) => {
  await Promise.all([Application.deleteMany({ property_id: req.params.id }), Ticket.deleteMany({ property_id: req.params.id }), Property.deleteOne({ _id: req.params.id })]);
  res.json({ ok: true });
}));

app.listen(process.env.PORT || 4000, () => console.log('API running'));