# Smart Property Rental (React + Node/Express + MongoDB)

## Run it
```bash
# 1. backend
cd backend
npm install
cp .env.example .env        # set MONGODB_URI and SESSION_SECRET
npm run seed                # loads demo users + 12 properties (WIPES existing data!)
npm run dev                 # API on http://localhost:4000

# 2. frontend (new terminal)
cd frontend
npm install
npm run dev                 # http://localhost:5173
```

## Logins (login ID = email)
| Role   | Name         | Login ID            | Password   |
|--------|--------------|---------------------|------------|
| Admin  | Admin        | admin@rental.com    | Admin@123  |
| Owner  | Ravi Kumar   | owner1@rental.com   | Owner@123  |
| Owner  | Meera Nair   | owner2@rental.com   | Owner@123  |
| Owner  | Suresh Gowda | owner3@rental.com   | Owner@123  |
| Tenant | Ananya Rao   | tenant1@rental.com  | Tenant@123 |
| Tenant | Karthik S    | tenant2@rental.com  | Tenant@123 |
| Tenant | Priya Menon  | tenant3@rental.com  | Tenant@123 |
| Tenant | Arjun Reddy  | tenant4@rental.com  | Tenant@123 |

The login page has "demo account" buttons that fill these in. Remove that block in `frontend/src/pages/Auth.jsx` before deploying.

## Notes
- Tenants can raise tickets only for homes where an owner has **accepted** their application (seed data already has accepted ones for tenant1, tenant2, tenant3).
- Photos are resized in the browser and stored in MongoDB as base64 (max 4 per property, 6 per ticket). Fine for a college project; use cloud storage for production.
- The scoring logic (`backend/score.js`) is unchanged.
