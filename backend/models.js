import mongoose from 'mongoose';
const { Schema, model } = mongoose, Id = Schema.Types.ObjectId;

export const User = model('User', new Schema({
  name: String, email: { type: String, unique: true }, phone: String, password_hash: String,
  role: { type: String, enum: ['tenant', 'landlord', 'admin'] },
}, { timestamps: true }));

export const Prefs = model('Prefs', new Schema({ user_id: { type: Id, unique: true }, data: Schema.Types.Mixed }));

export const Property = model('Property', new Schema({
  owner_id: { type: Id, ref: 'User' }, title: String, description: String, locality: String, rent: Number, deposit: Number, bedrooms: Number,
  furnishing: { type: String, default: 'unfurnished' }, amenities: [String], pets_allowed: Boolean, smoking_allowed: Boolean,
  max_occupants: { type: Number, default: 4 }, min_stay_months: { type: Number, default: 11 }, available_from: String,
  noise_ticks: { type: Number, default: 0 }, house_rules: [String], available: { type: Boolean, default: true },
  photos: [String], // base64 data URLs (resized in the browser)
}, { timestamps: true }));

export const Ticket = model('Ticket', new Schema({
  property_id: { type: Id, ref: 'Property' }, tenant_id: { type: Id, ref: 'User' }, title: String, description: String,
  priority: { type: String, default: 'medium' }, photos: [String],
  status: { type: String, enum: ['Open', 'In Progress', 'Resolved'], default: 'Open' },
}, { timestamps: true }));

const appSchema = new Schema({
  property_id: { type: Id, ref: 'Property' }, tenant_id: { type: Id, ref: 'User' }, message: String, phone: String, move_in: String,
  score: Number, fit: Boolean, // snapshot of the Owner Tenant Score at the time of applying
  status: { type: String, enum: ['Pending', 'Accepted', 'Rejected','Ended'], default: 'Pending' },
}, { timestamps: true });
appSchema.index({ property_id: 1, tenant_id: 1 }, { unique: true });
export const Application = model('Application', appSchema);

export const ser = ({ _id, __v, ...r }) => ({ ...r, id: String(_id) }); // frontend expects `id`
