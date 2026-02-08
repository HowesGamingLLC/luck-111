-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users/Profiles Table (extends Supabase auth)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  verified BOOLEAN DEFAULT FALSE,
  avatar_url TEXT,
  kyc_status TEXT DEFAULT 'not_submitted' CHECK (kyc_status IN ('not_submitted', 'pending', 'approved', 'rejected')),
  kyc_documents JSONB,
  kyc_submitted_at TIMESTAMP,
  kyc_verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP,
  total_losses DECIMAL(10, 2) DEFAULT 0,
  jackpot_opt_in BOOLEAN DEFAULT FALSE,
  total_wagered JSONB DEFAULT '{"goldCoins": 0, "sweepCoins": 0}',
  total_won JSONB DEFAULT '{"goldCoins": 0, "sweepCoins": 0}',
  level INTEGER DEFAULT 1,
  referral_code TEXT UNIQUE,
  referrer_id UUID REFERENCES profiles(id),
  banned BOOLEAN DEFAULT FALSE,
  ban_reason TEXT,
  created_at_idx TIMESTAMP DEFAULT NOW()
);

-- User Balances Table
CREATE TABLE IF NOT EXISTS user_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  gold_coins DECIMAL(15, 2) DEFAULT 0,
  sweep_coins DECIMAL(15, 2) DEFAULT 0,
  bonus_coins DECIMAL(15, 2) DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('win', 'wager', 'bonus', 'deposit', 'withdrawal', 'refund')),
  currency TEXT NOT NULL CHECK (currency IN ('GC', 'SC')),
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  game_type TEXT,
  game_id TEXT,
  balance_before DECIMAL(15, 2),
  balance_after DECIMAL(15, 2),
  status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'failed')),
  created_at TIMESTAMP DEFAULT NOW(),
  created_at_idx TIMESTAMP DEFAULT NOW()
);

-- Games Table
CREATE TABLE IF NOT EXISTS games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('slots', 'bingo', 'poker', 'roulette', 'blackjack', 'baccarat', 'sportsbook')),
  provider_id TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  min_bet JSONB DEFAULT '{"gc": 1, "sc": 0.01}',
  max_bet JSONB DEFAULT '{"gc": 1000, "sc": 100}',
  rtp DECIMAL(5, 2),
  volatility TEXT CHECK (volatility IN ('low', 'medium', 'high')),
  features JSONB DEFAULT '[]',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Game Sessions Table
CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES games(id),
  session_token TEXT UNIQUE NOT NULL,
  start_time TIMESTAMP DEFAULT NOW(),
  end_time TIMESTAMP,
  wager DECIMAL(10, 2),
  win_amount DECIMAL(10, 2),
  currency TEXT CHECK (currency IN ('GC', 'SC')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  game_data JSONB,
  provably_fair_seed TEXT,
  client_seed TEXT,
  nonce INTEGER
);

-- Tournaments Table
CREATE TABLE IF NOT EXISTS tournaments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  game_type TEXT NOT NULL CHECK (game_type IN ('poker', 'bingo', 'slots', 'mixed')),
  type TEXT NOT NULL CHECK (type IN ('sit-n-go', 'scheduled', 'freeroll', 'satellite')),
  status TEXT DEFAULT 'registering' CHECK (status IN ('registering', 'starting', 'playing', 'finished', 'cancelled')),
  buy_in JSONB DEFAULT '{"gc": 0, "sc": 0}',
  prize_pool JSONB DEFAULT '{"gc": 0, "sc": 0}',
  max_players INTEGER DEFAULT 100,
  current_players INTEGER DEFAULT 0,
  structure JSONB,
  schedule JSONB,
  payout_structure JSONB,
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tournament Players Table
CREATE TABLE IF NOT EXISTS tournament_players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  registration_time TIMESTAMP DEFAULT NOW(),
  current_chips INTEGER DEFAULT 0,
  position INTEGER,
  eliminated BOOLEAN DEFAULT FALSE,
  elimination_time TIMESTAMP,
  rebuy_count INTEGER DEFAULT 0,
  addon_count INTEGER DEFAULT 0,
  payout_amount DECIMAL(10, 2) DEFAULT 0,
  UNIQUE(tournament_id, player_id)
);

-- Leaderboard Rankings Table
CREATE TABLE IF NOT EXISTS leaderboards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  period TEXT NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly', 'all_time')),
  category TEXT NOT NULL CHECK (category IN ('biggest_winners', 'most_spins', 'highest_win_rate')),
  rank INTEGER,
  value DECIMAL(15, 2),
  change INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, period, category)
);

-- Jackpot Pools Table
CREATE TABLE IF NOT EXISTS jackpot_pools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  pool_type TEXT NOT NULL CHECK (pool_type IN ('mega', 'major', 'minor', 'mini')),
  amount DECIMAL(15, 2) DEFAULT 0,
  max_amount DECIMAL(15, 2) NOT NULL,
  contribution_per_spin DECIMAL(10, 2) DEFAULT 0.01,
  last_won_at TIMESTAMP,
  last_winner_id UUID REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Jackpot Contributions Table
CREATE TABLE IF NOT EXISTS jackpot_contributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  jackpot_id UUID NOT NULL REFERENCES jackpot_pools(id),
  amount DECIMAL(10, 2) NOT NULL,
  game_id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Bonuses and Promotions Table
CREATE TABLE IF NOT EXISTS promotions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  bonus_type TEXT NOT NULL CHECK (bonus_type IN ('welcome', 'deposit_match', 'free_spins', 'cashback', 'vip_bonus')),
  amount DECIMAL(10, 2),
  currency TEXT CHECK (currency IN ('GC', 'SC')),
  wagering_requirement INTEGER DEFAULT 0,
  min_deposit DECIMAL(10, 2),
  max_users INTEGER,
  claimed_count INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- User Bonuses Table
CREATE TABLE IF NOT EXISTS user_bonuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  promotion_id UUID NOT NULL REFERENCES promotions(id),
  amount DECIMAL(10, 2) NOT NULL,
  wagering_remaining DECIMAL(10, 2),
  claimed_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  used BOOLEAN DEFAULT FALSE
);

-- Referrals Table
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  bonus_amount DECIMAL(10, 2),
  currency TEXT CHECK (currency IN ('GC', 'SC')),
  claimed BOOLEAN DEFAULT FALSE,
  claimed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(referrer_id, referred_id)
);

-- Admin Actions Log Table
CREATE TABLE IF NOT EXISTS admin_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES profiles(id),
  action TEXT NOT NULL,
  target_user_id UUID REFERENCES profiles(id),
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_admin ON profiles(is_admin);
CREATE INDEX IF NOT EXISTS idx_profiles_created ON profiles(created_at_idx DESC);
CREATE INDEX IF NOT EXISTS idx_user_balances_user ON user_balances(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at_idx DESC);
CREATE INDEX IF NOT EXISTS idx_game_sessions_user ON game_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_game ON game_sessions(game_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_token ON game_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status);
CREATE INDEX IF NOT EXISTS idx_tournaments_created ON tournaments(created_at);
CREATE INDEX IF NOT EXISTS idx_tournament_players_tournament ON tournament_players(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_players_player ON tournament_players(player_id);
CREATE INDEX IF NOT EXISTS idx_leaderboards_period_category ON leaderboards(period, category);
CREATE INDEX IF NOT EXISTS idx_leaderboards_user ON leaderboards(user_id);
CREATE INDEX IF NOT EXISTS idx_jackpot_contributions_user ON jackpot_contributions(user_id);
CREATE INDEX IF NOT EXISTS idx_jackpot_contributions_pool ON jackpot_contributions(jackpot_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin ON admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created ON admin_logs(created_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE jackpot_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_bonuses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Profiles - Users can read all, but edit only their own (admins can edit all)
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id OR (SELECT is_admin FROM profiles WHERE id = auth.uid()));

-- Balances - Users can only see their own
CREATE POLICY "Users can view own balance" ON user_balances FOR SELECT USING (auth.uid() = user_id);

-- Transactions - Users can only see their own
CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT USING (auth.uid() = user_id);

-- Game Sessions - Users can only see their own
CREATE POLICY "Users can view own game sessions" ON game_sessions FOR SELECT USING (auth.uid() = user_id);

-- Admin logs - Only admins can view
CREATE POLICY "Only admins can view logs" ON admin_logs FOR SELECT USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()));
