# Casino Slot Provider Setup Guide

This guide explains how to integrate real casino slot providers into your application to offer 200+ premium slot games to your users.

## Quick Start

Currently, your application includes **27 free slot games** from community providers. To add **200+ premium slot games**, you need to configure API credentials from real casino providers.

## Available Providers

### 1. **Pragmatic Play** (Recommended)
- **Games**: 200+ titles
- **Status**: Industry leader with high-quality games
- **Setup Time**: 1-2 weeks
- **Cost**: Revenue share model
- **Credentials Needed**: API Key, Operator ID, Secure Login

### 2. **BGaming**
- **Games**: 80+ titles
- **Status**: Innovative games with modern mechanics
- **Setup Time**: 1-2 weeks
- **Cost**: Revenue share model
- **Credentials Needed**: API Key, Operator ID

### 3. **Free Providers** (Already Included)
- **Free-Slots.Games**: 17 games (free to use)
- **iDev.Games**: 10 games (free to use)

## Step-by-Step Setup

### Option 1: Pragmatic Play Setup

#### Step 1: Get Partner API Credentials

1. Visit [Pragmatic Play Partners Portal](https://www.pragmaticplaypartners.com)
2. Click "Register" or "Apply Now"
3. Fill out the operator application form with:
   - Company information
   - Business details and license
   - Website information
   - Contact details
4. Complete Know Your Customer (KYC) verification
   - Provide business documents
   - Verify company registration
   - Bank account verification
5. After approval, create an integration profile:
   - Choose integration type (Game API)
   - Generate credentials:
     - **API Key**: Your authentication key
     - **Operator ID**: Your operator identifier
     - **Secure Login**: Login token for sessions

#### Step 2: Configure Environment Variables

Create or update your `.env` file (or set environment variables in your hosting platform):

```bash
# Pragmatic Play Credentials
PRAGMATIC_API_KEY=your_api_key_from_partner_portal
PRAGMATIC_OPERATOR_ID=your_operator_id
PRAGMATIC_SECURE_LOGIN=your_secure_login_token
```

**Security Note**: Never commit `.env` files to version control. Use environment variable management in your hosting platform.

#### Step 3: Restart Your Application

```bash
npm run dev
```

The server will:
- Load your Pragmatic Play credentials on startup
- Automatically fetch the game list (200+ games)
- Make games available in the `/games/slots` page

#### Step 4: Verify Integration

1. Open your application
2. Navigate to `/games/slots`
3. You should see Pragmatic Play games in the available games list
4. Check the provider health: Visit `/api/slots/admin/health` in your browser

### Option 2: BGaming Setup

#### Step 1: Get Partner API Credentials

1. Visit [BGaming Partners Page](https://www.bgaming.com/partners)
2. Complete the partnership application
3. Provide required documentation:
   - Business registration
   - Operator license information
   - Banking details
4. Wait for approval (usually 5-7 business days)
5. Once approved, you'll receive:
   - **API Key**: Authentication token
   - **Operator ID**: Your BGaming operator ID

#### Step 2: Configure Environment Variables

```bash
# BGaming Credentials
BGAMING_API_KEY=your_api_key_from_bgaming
BGAMING_OPERATOR_ID=your_operator_id
```

#### Step 3: Restart Application

```bash
npm run dev
```

#### Step 4: Verify Integration

BGaming games should now appear alongside other providers in your slots library.

## Current Implementation

The system supports multiple providers simultaneously. Here's how it works:

### Game Loading Flow

1. User navigates to `/games/slots`
2. Frontend requests: `GET /api/slots/games`
3. Backend queries all active providers:
   - Pragmatic Play (if configured)
   - BGaming (if configured)
   - Free-Slots.Games (always available)
   - iDev.Games (always available)
4. Results are combined, filtered, and sorted
5. Games display with filtering options:
   - By provider
   - By category
   - By volatility
   - By features (Free Spins, Bonus, Jackpot)
   - Popular and New games

### Architecture

```
Client (React)
    ↓
GET /api/slots/games
    ↓
Server (Express)
    ↓
Providers Map:
├── Pragmatic Play Provider
├── BGaming Provider
├── Free-Slots.Games Provider
├── iDev.Games Provider
    ↓
Combine & Return All Games
    ↓
Display in Frontend
```

## Filtering Options

Users can filter by:

### Quick Filters
- 👑 Popular
- ✨ New
- ⚡ Free Spins
- 🎁 Bonus
- 🏆 Jackpot

### Detailed Filters
- **Provider**: Pragmatic Play, BGaming, Free-Slots.Games, iDev.Games
- **Category**: Adventure, Casino, Fantasy, Space, Western, etc.
- **Volatility**: Low, Medium, High
- **Sort**: Popular, Name, RTP, Release Date

## API Endpoints

### Public Endpoints

```bash
# Get all providers
GET /api/slots/providers

# Get all games (with filters)
GET /api/slots/games?providerId=pragmaticplay&category=adventure&limit=20

# Get specific game
GET /api/slots/providers/pragmaticplay/games/book-of-ra
```

### Session Management

```bash
# Launch a game
POST /api/slots/launch
Body: {
  "gameId": "book-of-ra",
  "providerId": "pragmaticplay",
  "playerId": "user123",
  "currency": "GC",
  "mode": "real",
  "language": "en"
}

# Validate session
POST /api/slots/validate-session
Body: { "sessionToken": "token_here" }

# End session
POST /api/slots/end-session
Body: { "sessionToken": "token_here", "playTime": 300 }
```

## Troubleshooting

### Games Not Appearing

**Problem**: Provider games don't show in the slots page

**Solution**:
1. Verify environment variables are set correctly:
   ```bash
   echo $PRAGMATIC_API_KEY
   ```
2. Restart the development server:
   ```bash
   npm run dev
   ```
3. Check provider health:
   ```bash
   curl http://localhost:8080/api/slots/admin/health
   ```
4. Check server logs for errors

### Authentication Errors

**Problem**: "Provider is not responding" or "Invalid credentials"

**Solution**:
1. Double-check API key and Operator ID in `.env`
2. Verify credentials in provider dashboard
3. Check if account is active and enabled
4. Ensure IP is whitelisted (if required by provider)
5. Contact provider support

### Rate Limiting

**Problem**: "Too many requests" errors

**Solution**:
1. Check your provider account dashboard for rate limits
2. Upgrade your account tier if available
3. Implement caching in production
4. Reduce polling frequency

### Games Load Slowly

**Problem**: Games take a long time to load

**Solution**:
1. Cache the game list (already implemented on frontend)
2. Use pagination (default: 12 games per page)
3. Optimize provider API calls
4. Check network latency to provider

## Development vs Production

### Local Development

```bash
# .env
PRAGMATIC_API_KEY=dev_key_or_empty
BGAMING_API_KEY=dev_key_or_empty
```

Free games will always be available for testing without provider credentials.

### Production

Use environment variables from your hosting platform:
- **Netlify**: Build & Deploy → Environment variables
- **Vercel**: Settings → Environment Variables
- **Docker**: `docker run -e PRAGMATIC_API_KEY=xxx`
- **Traditional Hosting**: Set via control panel or configuration files

## API Key Security

**IMPORTANT**: Never commit API keys to git!

### Best Practices

1. **Use `.env` for local development**:
   ```bash
   echo ".env" >> .gitignore
   ```

2. **Use platform environment variables for production**:
   - Netlify: Settings → Environment
   - Vercel: Project Settings → Environment Variables
   - AWS: Secrets Manager or Parameter Store

3. **Rotate keys regularly** (every 90 days recommended)

4. **Use restricted API keys**:
   - Limit to your domain only
   - Restrict to specific IP addresses
   - Set rate limits on key

5. **Monitor usage**:
   - Check provider dashboard regularly
   - Set up alerts for unusual activity
   - Review API logs

## Performance Optimization

### Current Optimizations

✅ Games cached on frontend (5-minute TTL)
✅ Pagination (12 games per page)
✅ Thumbnail preloading
✅ Provider health checks
✅ Session timeout (30 minutes)

### Additional Recommendations

1. **Backend Caching**:
   - Cache game list for 1 hour
   - Invalidate on player action
   - Use Redis for distributed caching

2. **Database**:
   - Store game metadata in database
   - Sync daily with providers
   - Reduce API calls to providers

3. **CDN**:
   - Serve game thumbnails via CDN
   - Cache static assets
   - Use regional endpoints

## Support & Resources

- **Pragmatic Play Docs**: https://www.pragmaticplaypartners.com/documentation
- **BGaming Docs**: https://www.bgaming.com/integration-guide
- **Application Chat**: `/help` page in the app
- **Community Forums**: Check provider partner forums

## Comparison: Free vs Premium Providers

| Feature | Free | Pragmatic Play | BGaming |
|---------|------|---|---|
| Game Count | 27 | 200+ | 80+ |
| Cost | Free | Revenue Share | Revenue Share |
| Setup Time | Instant | 1-2 weeks | 1-2 weeks |
| Live Support | Limited | 24/7 | 24/7 |
| Analytics | Basic | Advanced | Advanced |
| Mobile Optimized | Yes | Yes | Yes |
| Tournament Support | No | Yes | Yes |
| Progressive Jackpot | Limited | Yes | Yes |

## Next Steps

1. **If you haven't registered**: Start with free providers (already active)
2. **If you want premium games**: Apply for Pragmatic Play or BGaming
3. **For questions**: Contact the providers' partner support teams
4. **For additional features**: Check provider documentation

## FAQ

**Q: Do I need credentials for free games?**
A: No, free games from Free-Slots.Games and iDev.Games are always available.

**Q: How long does provider approval take?**
A: 1-2 weeks for Pragmatic Play and BGaming. Requires KYC verification.

**Q: What payment model do providers use?**
A: Most use revenue sharing (e.g., 25-40% of player losses).

**Q: Can I use multiple providers?**
A: Yes! The system automatically aggregates games from all configured providers.

**Q: How are RTP and volatility determined?**
A: Each provider specifies these values. They're displayed in game details.

**Q: Is testing with demo credentials possible?**
A: Yes, but real credentials are needed for live play.

## Support

For issues or questions:
1. Check provider documentation
2. Contact provider support directly
3. Review application logs at `/api/slots/admin/health`
4. Open an issue in the application support system
