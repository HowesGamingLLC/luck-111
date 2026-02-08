# CoinKrazy MVP - Setup Instructions

## Phase 1: Database Setup

1. **Go to Supabase Console**
   - Visit: https://app.supabase.com
   - Select your project: `muasmmfdpmcqxgzcjlgz`

2. **Execute SQL Schema**
   - Go to SQL Editor
   - Create new query
   - Copy the entire content from `database.sql`
   - Run the query
   - ✅ All tables, indexes, and RLS policies will be created

## Phase 2: Create Admin User

After running the SQL schema, you need to create the admin user. There are two ways:

### Option A: Using Supabase Console (Recommended)

1. Go to Authentication → Users
2. Click "Add User"
3. Email: `coinkrazy26@gmail.com`
4. Password: `admin123`
5. Check "Auto confirm user"
6. Create user

Then update the profile to make them admin:

1. Go to SQL Editor
2. Run this query:

```sql
UPDATE profiles
SET is_admin = true, verified = true
WHERE email = 'coinkrazy26@gmail.com';
```

### Option B: Using the Admin Setup Script

```bash
# Will be provided after auth context setup
```

## Phase 3: Verify Setup

Run this query to verify admin user exists:

```sql
SELECT id, email, name, is_admin, verified FROM profiles WHERE email = 'coinkrazy26@gmail.com';
```

You should see:

- is_admin: true
- verified: true

## Phase 4: Initialize Default Data

Run this query to create initial jackpot pools:

```sql
INSERT INTO jackpot_pools (name, pool_type, amount, max_amount, contribution_per_spin)
VALUES
  ('Mega Jackpot', 'mega', 347.25, 500, 0.01),
  ('Major Jackpot', 'major', 234.8, 250, 0.01),
  ('Minor Jackpot', 'minor', 87.45, 100, 0.01),
  ('Mini Jackpot', 'mini', 23.9, 50, 0.01)
ON CONFLICT DO NOTHING;
```

Insert sample games:

```sql
INSERT INTO games (name, type, provider_id, description, rtp, volatility, thumbnail_url)
VALUES
  ('Gold Rush', 'slots', 'pragmaticplay', '5-reel action-packed slot', 96.50, 'high', 'https://example.com/gold-rush.jpg'),
  ('Classic Bingo', 'bingo', 'bingo-provider', 'Traditional bingo experience', 95.00, 'medium', 'https://example.com/bingo.jpg'),
  ('Texas Holdem', 'poker', 'poker-provider', 'Tournament poker', 100.00, 'high', 'https://example.com/poker.jpg'),
  ('European Roulette', 'roulette', 'table-games', 'Classic roulette wheel', 97.30, 'low', 'https://example.com/roulette.jpg'),
  ('Blackjack Pro', 'blackjack', 'table-games', 'Professional blackjack', 99.60, 'medium', 'https://example.com/blackjack.jpg')
ON CONFLICT DO NOTHING;
```

## Phase 5: Test Authentication

1. Go to the app at http://localhost:8080
2. Click "Login"
3. Use credentials:
   - Email: `coinkrazy26@gmail.com`
   - Password: `admin123`
4. ✅ Should see dashboard as admin

## Environment Variables

Your `.env` file is already configured with:

```
VITE_SUPABASE_URL=https://muasmmfdpmcqxgzcjlgz.supabase.com
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Next Steps

1. ✅ Run database.sql in Supabase
2. ✅ Create admin user
3. ✅ Run initialization queries
4. ✅ Test login with admin account
5. ✅ App will automatically fetch real data from database

## Troubleshooting

**Issue: "useAuth must be used within an AuthProvider"**

- Solution: Ensure AuthProvider is rendering properly in App.tsx (already configured)

**Issue: Connection refused**

- Solution: Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env
- Verify they match your Supabase project

**Issue: Authentication fails**

- Solution: Verify user was created in Supabase auth
- Check that profile row exists for the user email

## Security Notes

⚠️ For production:

- Change admin password immediately after setup
- Enable 2FA in Supabase
- Set up email confirmation
- Configure CORS properly
- Enable SSL enforcement
