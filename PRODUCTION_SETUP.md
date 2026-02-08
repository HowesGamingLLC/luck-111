# CoinKrazy MVP - Complete Production Setup Guide

## Overview
This guide walks you through setting up CoinKrazy as a production-ready gaming platform with real authentication, database integration, and game management.

---

## Phase 1: Database Setup (Supabase)

### Step 1.1: Create Supabase Tables
1. Go to: https://app.supabase.com → Select project `muasmmfdpmcqxgzcjlgz`
2. Go to **SQL Editor**
3. Create new query
4. Copy and run the entire `database.sql` file from the repo
5. ✅ All tables, indexes, and security policies created

**Tables Created:**
- `profiles` - User accounts and profiles
- `user_balances` - Currency balances (Gold Coins, Sweep Coins)
- `transactions` - All user transactions
- `games` - Game catalog
- `game_sessions` - Active game sessions
- `tournaments` - Tournament management
- `jackpot_pools` - Jackpot tracking
- `promotions` - Bonuses and promos
- `leaderboards` - Rankings

### Step 1.2: Create Admin User

#### Option A: Via Supabase Console (Easiest)
1. Go to **Authentication** → **Users**
2. Click **Add User**
3. Enter:
   - Email: `coinkrazy26@gmail.com`
   - Password: `admin123`
   - ✅ Check "Auto confirm user"
4. Click **Save**

#### Option B: Via SQL
```sql
-- Create user via SQL (if needed)
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at)
VALUES (
  'coinkrazy26@gmail.com',
  crypt('admin123', gen_salt('bf')),
  NOW()
);
```

### Step 1.3: Make User Admin
```sql
-- Run in SQL Editor
UPDATE profiles 
SET is_admin = true, verified = true, level = 50
WHERE email = 'coinkrazy26@gmail.com';
```

### Step 1.4: Initialize Default Data

```sql
-- Create jackpot pools
INSERT INTO jackpot_pools (name, pool_type, amount, max_amount, contribution_per_spin)
VALUES
  ('Mega Jackpot', 'mega', 347.25, 500, 0.01),
  ('Major Jackpot', 'major', 234.8, 250, 0.01),
  ('Minor Jackpot', 'minor', 87.45, 100, 0.01),
  ('Mini Jackpot', 'mini', 23.9, 50, 0.01);

-- Create sample games
INSERT INTO games (name, type, provider_id, description, rtp, volatility)
VALUES
  ('Gold Rush', 'slots', 'pragmaticplay', '5-reel action-packed slot', 96.50, 'high'),
  ('Classic Bingo', 'bingo', 'bingo-provider', 'Traditional bingo experience', 95.00, 'medium'),
  ('Texas Holdem', 'poker', 'poker-provider', 'Tournament poker games', 100.00, 'high'),
  ('European Roulette', 'roulette', 'table-games', 'Classic roulette wheel', 97.30, 'low'),
  ('Blackjack Pro', 'blackjack', 'table-games', 'Professional blackjack', 99.60, 'medium'),
  ('Baccarat', 'baccarat', 'table-games', 'High-stake baccarat', 98.50, 'medium');

-- Create welcome bonus promotion
INSERT INTO promotions (name, description, bonus_type, amount, currency, min_deposit, active)
VALUES
  ('Welcome Bonus', 'New player welcome package', 'welcome', 10000, 'GC', 0, true);
```

---

## Phase 2: Environment Configuration

### Step 2.1: Update .env File
Your `.env` file is already configured with:
```
VITE_SUPABASE_URL=https://muasmmfdpmcqxgzcjlgz.supabase.com
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

### Step 2.2: Server Environment Variables (Optional for advanced setup)
Create `.env.local` or add to your deployment platform:
```
VITE_SUPABASE_URL=https://muasmmfdpmcqxgzcjlgz.supabase.com
VITE_SUPABASE_ANON_KEY=<your_anon_key>
```

---

## Phase 3: Test the Application

### Step 3.1: Start Dev Server
```bash
pnpm dev
```
App should be available at http://localhost:8080

### Step 3.2: Test Login
1. Go to http://localhost:8080
2. Click **Login**
3. Enter credentials:
   - Email: `coinkrazy26@gmail.com`
   - Password: `admin123`
4. ✅ Should see dashboard

### Step 3.3: Test Admin Features
1. After login, go to `/admin`
2. Should see admin panel with:
   - User management
   - Game management
   - Tournament creation
   - Analytics

### Step 3.4: Test Game Features
1. Go to **Games** section
2. Click on any game
3. Should load game session with real database integration
4. Wagers and wins record to database

---

## Phase 4: API Endpoints

All endpoints use real Supabase database:

### Transaction Endpoints
```
GET  /api/transactions?userId=xxx&limit=100    # Get user transactions
GET  /api/balance?userId=xxx                    # Get user balance
POST /api/transactions                          # Record new transaction
```

### Game Endpoints
```
GET  /api/games?type=slots                      # List all games
GET  /api/games/:id                             # Get specific game
POST /api/game-sessions                         # Create game session
POST /api/game-sessions/end                     # End game session
POST /api/game-sessions/validate                # Validate session
```

### Tournament Endpoints
```
GET  /api/tournaments                           # List tournaments
POST /api/tournaments                           # Create tournament
POST /api/tournaments/:id/register              # Register for tournament
POST /api/tournaments/:id/start                 # Start tournament
```

---

## Phase 5: Production Deployment

### Option A: Netlify Deployment
1. Push code to GitHub (already configured)
2. Connect GitHub repo to Netlify
3. Set environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy automatically on push

### Option B: Vercel Deployment
1. Import GitHub repository
2. Set environment variables (same as above)
3. Deploy

### Option C: Self-Hosted
1. Run `pnpm build`
2. Serve `dist/spa` folder as static files
3. Run `node dist/server/node-build.mjs` for backend

---

## Phase 6: Post-Launch Checklist

### Security
- [ ] Change admin password immediately
- [ ] Enable 2FA in Supabase
- [ ] Set up email verification
- [ ] Enable RLS policies (already configured)
- [ ] Set up CORS correctly
- [ ] Enable SSL enforcement

### Monitoring
- [ ] Set up error logging (ErrorBoundary in place)
- [ ] Monitor Supabase usage
- [ ] Set up alerts for API failures
- [ ] Review transaction logs

### Content
- [ ] Update game details and descriptions
- [ ] Add proper game thumbnails
- [ ] Configure bonus amounts
- [ ] Set tournament schedules
- [ ] Update terms and conditions

### Testing
- [ ] Test all game types
- [ ] Test tournament flow
- [ ] Test payment features
- [ ] Test KYC process
- [ ] Load testing with multiple users

---

## Key Features Implemented

### ✅ Authentication
- Real Supabase authentication
- Admin role management
- KYC status tracking
- Session management

### ✅ Wallet & Transactions
- Gold Coins (play money)
- Sweep Coins (real money)
- Real-time balance updates
- Complete transaction history
- Automatic balance validation

### ✅ Games
- Multiple game types (Slots, Bingo, Poker, Roulette, Blackjack, Baccarat)
- Game session management
- Provably fair RNG
- Wager tracking
- Win/loss recording

### ✅ Tournaments
- Tournament creation and scheduling
- Player registration
- Leaderboards
- Prize pool distribution
- Multiple tournament types

### ✅ Jackpots
- Progressive jackpots
- User opt-in system
- Contribution tracking
- Win notifications

### ✅ Leaderboards
- Daily/Weekly/Monthly rankings
- Multiple categories
- Real-time updates
- User position tracking

### ✅ Admin Panel
- User management
- Game management
- Tournament administration
- Analytics and reporting
- Admin action logging

### ✅ Production Ready
- Error boundaries for crashes
- Graceful Supabase integration
- Database validation
- Transaction safety
- RLS security policies

---

## Troubleshooting

### Login Issues
**Problem**: "Invalid credentials"
- **Solution**: Verify user exists in Supabase → Authentication → Users
- Check email confirmation status

**Problem**: "useAuth must be used within AuthProvider"
- **Solution**: This is already fixed with ErrorBoundary wrapper

### Database Issues
**Problem**: "Cannot connect to Supabase"
- **Solution**: Verify environment variables in .env
- Check Supabase project is active
- Verify API key hasn't expired

**Problem**: "Insufficient balance" on wagers
- **Solution**: User balance not initialized
- Run: `INSERT INTO user_balances (user_id, gold_coins, sweep_coins) VALUES (user_id, 10000, 100)`

### Game Issues
**Problem**: "Game not found"
- **Solution**: Verify games inserted in `games` table
- Check game `active` flag is true

**Problem**: Session validation fails
- **Solution**: Check `game_sessions` table has the session
- Verify session token matches

---

## Support & Maintenance

### Regular Tasks
- Monitor error logs daily
- Review user feedback
- Update game content monthly
- Analyze player behavior
- Adjust bonuses/payouts as needed

### Performance Optimization
- Index frequently queried columns (already done)
- Archive old transaction records
- Monitor database size
- Optimize expensive queries

### Updates
- Keep Supabase packages updated
- Update React and dependencies regularly
- Monitor security advisories
- Test thoroughly before deploying

---

## Summary

Your CoinKrazy MVP is now production-ready with:
✅ Real authentication and user management
✅ Complete database backend
✅ Game session management
✅ Transaction tracking
✅ Tournament system
✅ Leaderboards and rankings
✅ Admin controls
✅ Error handling
✅ Security policies

**Next Steps:**
1. Run database.sql in Supabase
2. Create admin user
3. Initialize games and jackpots
4. Test all features locally
5. Deploy to production
6. Monitor and maintain

Good luck with CoinKrazy! 🎰
