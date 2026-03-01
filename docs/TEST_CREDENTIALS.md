# GHL India Ventures — Test Credentials

## Setup Instructions

1. Create users in **Supabase Auth** dashboard (Authentication > Users > Add User)
2. Run `docs/SETUP_CREDENTIALS.sql` in **Supabase SQL Editor**
3. Verify with the verification queries at the bottom of the SQL file

---

## Admin Portal (`/admin/login`)

| Email | Password | Role | Access |
|-------|----------|------|--------|
| superadmin@ghlindia.com | GHL@SuperAdmin2025! | Super Admin | Full access to all 14 modules |

---

## Staff Portal (`/staff/login`)

| Email | Password | Role | Department |
|-------|----------|------|------------|
| staff1@ghlindia.com | GHL@Staff2025! | CS Lead | Customer Service |
| staff2@ghlindia.com | GHL@Staff2025! | Relationship Manager | Sales |
| staff3@ghlindia.com | GHL@Staff2025! | Field Sales Executive | Sales |

**Note:** Employee Code field has been removed. Staff login uses email + password only.

---

## Client Dashboard (`/login`)

| Email | Password | KYC Status | Investment |
|-------|----------|------------|------------|
| client1@ghlindia.com | GHL@Client2025! | Verified | Rs 25,00,000 |
| client2@ghlindia.com | GHL@Client2025! | Pending | Rs 0 (new investor) |

---

## Login Flow Notes

- **Admin**: Email + Password > validates against `profiles.role` in ADMIN_ROLES whitelist
- **Staff**: Email + Password > validates `profiles` + `staff_profiles` tables exist
- **Client**: Email + Password (or Google OAuth or OTP) > validates `profiles` + `clients` tables
- Rate limiting: 5 failed attempts = 15 minute lockout (client-side, all portals)
- Client 1 is assigned to Staff 2 (Rahul Menon) as Relationship Manager
