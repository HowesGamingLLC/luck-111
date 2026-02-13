import {
  BaseSlotProvider,
  SlotProvider,
  SlotGame,
  GameLaunchParams,
  GameLaunchResponse,
  ProviderGameListParams,
  ProviderGameListResponse,
  ProviderBalance,
} from "../../../shared/slotProviders";

export class FreeSlotsGamesProvider extends BaseSlotProvider {
  constructor() {
    const provider: SlotProvider = {
      id: "freeslotsgames",
      name: "freeslotsgames",
      displayName: "Free-Slots.Games",
      isActive: true,
      apiEndpoint: "https://free-slots.games",
      websiteUrl: "https://free-slots.games",
      supportedCurrencies: ["GC"], // Only free play
      features: {
        hasIframe: true,
        hasAPI: false, // Static game list
        supportsThumbnails: true,
        supportsFreeMoney: true,
        supportsSweepstakes: false, // Free games only
        supportsAutoplay: true,
        supportsMobileOptimized: true,
      },
    };

    super(provider, "free", "free-slots-games");
  }

  async getGames(
    params?: ProviderGameListParams,
  ): Promise<ProviderGameListResponse> {
    try {
      // Static list of popular free slots from Free-Slots.Games
      const staticGames = this.getStaticGameList();

      let filteredGames = [...staticGames];

      // Apply filters
      if (params?.search) {
        const query = params.search.toLowerCase();
        filteredGames = filteredGames.filter(
          (game) =>
            game.name.toLowerCase().includes(query) ||
            game.description.toLowerCase().includes(query) ||
            game.tags.some((tag) => tag.toLowerCase().includes(query)),
        );
      }

      if (params?.category && params.category !== "all") {
        filteredGames = filteredGames.filter(
          (game) => game.category === params.category,
        );
      }

      // Apply sorting
      if (params?.sortBy) {
        filteredGames.sort((a, b) => {
          let aVal: any = a[params.sortBy! as keyof SlotGame];
          let bVal: any = b[params.sortBy! as keyof SlotGame];

          if (typeof aVal === "string") aVal = aVal.toLowerCase();
          if (typeof bVal === "string") bVal = bVal.toLowerCase();

          const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
          return params.sortOrder === "desc" ? -comparison : comparison;
        });
      }

      // Apply pagination
      const offset = params?.offset || 0;
      const limit = params?.limit || 50;
      const paginatedGames = filteredGames.slice(offset, offset + limit);

      return {
        success: true,
        games: paginatedGames,
        total: filteredGames.length,
        hasMore: offset + limit < filteredGames.length,
      };
    } catch (error) {
      console.error("Free-Slots.Games getGames error:", error);
      return {
        success: false,
        games: [],
        total: 0,
        hasMore: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async getGameById(gameId: string): Promise<SlotGame | null> {
    const games = this.getStaticGameList();
    return games.find((game) => game.id === gameId) || null;
  }

  async launchGame(params: GameLaunchParams): Promise<GameLaunchResponse> {
    try {
      const game = await this.getGameById(params.gameId);
      if (!game) {
        return {
          success: false,
          error: "Game not found",
        };
      }

      // Generate iframe URL for Free-Slots.Games
      const iframeUrl = `https://free-slots.games/game/${params.gameId}?mode=free&embed=1`;

      return {
        success: true,
        iframeUrl: iframeUrl,
        sessionToken: `free-${params.playerId}-${params.gameId}-${Date.now()}`,
      };
    } catch (error) {
      console.error("Free-Slots.Games launchGame error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Launch failed",
      };
    }
  }

  async getPlayerBalance(playerId: string): Promise<ProviderBalance | null> {
    // Free games don't track balance - return unlimited free credits
    return {
      playerId: playerId,
      goldCoins: 999999, // Unlimited free credits
      sweepCoins: 0,
      lastUpdated: new Date().toISOString(),
    };
  }

  async validateSession(sessionToken: string): Promise<boolean> {
    // Free games sessions are always valid
    return sessionToken.startsWith("free-");
  }

  private getStaticGameList(): SlotGame[] {
    return [
      // Classic & Popular Games
      {
        id: "book-of-ra",
        providerId: "freeslotsgames",
        name: "Book of Ra",
        slug: "book-of-ra",
        thumbnailUrl: "https://free-slots.games/media/slots/book-of-ra.jpg",
        category: "adventure",
        tags: ["egypt", "adventure", "bonus", "freespins", "classic"],
        minBet: 0,
        maxBet: 0,
        rtp: 95.1,
        volatility: "high",
        paylines: 9,
        reels: 5,
        isPopular: true,
        isNew: false,
        isMobileOptimized: true,
        hasFreespins: true,
        hasBonus: true,
        hasJackpot: false,
        releaseDate: "2020-01-01T00:00:00Z",
        description:
          "Embark on an Egyptian adventure in search of the legendary Book of Ra. This classic slot features expanding symbols, free spins, and ancient treasures.",
        features: [
          "Expanding Symbols",
          "Free Spins",
          "Wild Symbols",
          "Gamble Feature",
        ],
      },
      {
        id: "starburst",
        providerId: "freeslotsgames",
        name: "Starburst",
        slug: "starburst",
        thumbnailUrl: "https://free-slots.games/media/slots/starburst.jpg",
        category: "space",
        tags: ["space", "gems", "wilds", "colorful", "low-volatility"],
        minBet: 0,
        maxBet: 0,
        rtp: 96.1,
        volatility: "low",
        paylines: 10,
        reels: 5,
        isPopular: true,
        isNew: false,
        isMobileOptimized: true,
        hasFreespins: false,
        hasBonus: false,
        hasJackpot: false,
        releaseDate: "2019-01-01T00:00:00Z",
        description:
          "A cosmic slot adventure with vibrant gemstones and expanding wild stars. Perfect for players seeking consistent, smaller wins.",
        features: [
          "Expanding Wilds",
          "Re-spins",
          "Both Ways Pay",
          "Cosmic Theme",
        ],
      },
      {
        id: "gonzo-quest",
        providerId: "freeslotsgames",
        name: "Gonzo's Quest",
        slug: "gonzo-quest",
        thumbnailUrl: "https://free-slots.games/media/slots/gonzo-quest.jpg",
        category: "adventure",
        tags: ["adventure", "aztec", "avalanche", "multiplier", "3d"],
        minBet: 0,
        maxBet: 0,
        rtp: 96.0,
        volatility: "medium",
        paylines: 20,
        reels: 5,
        isPopular: true,
        isNew: false,
        isMobileOptimized: true,
        hasFreespins: true,
        hasBonus: true,
        hasJackpot: false,
        releaseDate: "2019-06-01T00:00:00Z",
        description:
          "Join Gonzo on his epic quest for El Dorado with revolutionary cascading reels and increasing multipliers. Every win increases your next win multiplier.",
        features: [
          "Avalanche Reels",
          "Multipliers",
          "Free Falls",
          "Wild Symbols",
          "3D Graphics",
        ],
      },
      {
        id: "mega-moolah",
        providerId: "freeslotsgames",
        name: "Mega Moolah",
        slug: "mega-moolah",
        thumbnailUrl: "https://free-slots.games/media/slots/mega-moolah.jpg",
        category: "animals",
        tags: ["safari", "jackpot", "animals", "progressive", "wildlife"],
        minBet: 0,
        maxBet: 0,
        rtp: 88.1,
        volatility: "high",
        paylines: 25,
        reels: 5,
        isPopular: true,
        isNew: false,
        isMobileOptimized: true,
        hasFreespins: true,
        hasBonus: true,
        hasJackpot: true,
        releaseDate: "2018-01-01T00:00:00Z",
        description:
          "The legendary progressive jackpot slot with African safari theme. Known for life-changing wins with a massive accumulated jackpot.",
        features: [
          "Progressive Jackpot",
          "Free Spins",
          "Wild Symbols",
          "Safari Theme",
          "High Volatility",
        ],
      },
      {
        id: "dead-or-alive",
        providerId: "freeslotsgames",
        name: "Dead or Alive",
        slug: "dead-or-alive",
        thumbnailUrl: "https://free-slots.games/media/slots/dead-or-alive.jpg",
        category: "western",
        tags: ["western", "cowboys", "freespins", "sticky-wilds", "wanted"],
        minBet: 0,
        maxBet: 0,
        rtp: 96.8,
        volatility: "high",
        paylines: 9,
        reels: 5,
        isPopular: true,
        isNew: false,
        isMobileOptimized: true,
        hasFreespins: true,
        hasBonus: false,
        hasJackpot: false,
        releaseDate: "2019-03-01T00:00:00Z",
        description:
          "Wild West action with sticky wilds during free spins. Track down dangerous outlaws for explosive wins in this high-volatility classic.",
        features: [
          "Sticky Wilds",
          "Free Spins",
          "Western Theme",
          "High Volatility",
          "Wanted Posters",
        ],
      },
      {
        id: "immortal-romance",
        providerId: "freeslotsgames",
        name: "Immortal Romance",
        slug: "immortal-romance",
        thumbnailUrl:
          "https://free-slots.games/media/slots/immortal-romance.jpg",
        category: "horror",
        tags: ["vampire", "romance", "freespins", "chamber-bonus", "gothic"],
        minBet: 0,
        maxBet: 0,
        rtp: 96.9,
        volatility: "medium",
        paylines: 243,
        reels: 5,
        isPopular: true,
        isNew: false,
        isMobileOptimized: true,
        hasFreespins: true,
        hasBonus: true,
        hasJackpot: false,
        releaseDate: "2018-07-01T00:00:00Z",
        description:
          "A dark romance featuring four vampire chambers with unique free spin mechanics. Each character unlocks different bonus features and multipliers.",
        features: [
          "Chamber of Spins",
          "Multiple Characters",
          "Multiple Free Spins",
          "Vampire Theme",
          "Gothic Atmosphere",
        ],
      },

      // New Additions - Popular Providers
      {
        id: "sweet-bonanza",
        providerId: "freeslotsgames",
        name: "Sweet Bonanza",
        slug: "sweet-bonanza",
        thumbnailUrl: "https://free-slots.games/media/slots/sweet-bonanza.jpg",
        category: "candy",
        tags: ["candy", "colorful", "bonanza", "clusters", "fruit"],
        minBet: 0,
        maxBet: 0,
        rtp: 96.5,
        volatility: "high",
        paylines: 6,
        reels: 6,
        isPopular: true,
        isNew: false,
        isMobileOptimized: true,
        hasFreespins: true,
        hasBonus: true,
        hasJackpot: false,
        releaseDate: "2021-06-01T00:00:00Z",
        description:
          "A vibrant candy-themed slot with a cluster-pay system instead of paylines. Features cascading wins and a lucrative free spins round.",
        features: [
          "Cluster Pays",
          "Cascading Symbols",
          "Free Spins",
          "Bonus Multiplier",
          "Colorful Graphics",
        ],
      },
      {
        id: "gates-of-olympus",
        providerId: "freeslotsgames",
        name: "Gates of Olympus",
        slug: "gates-of-olympus",
        thumbnailUrl: "https://free-slots.games/media/slots/gates-olympus.jpg",
        category: "mythology",
        tags: ["greek", "gods", "mythology", "olympus", "high-pay"],
        minBet: 0,
        maxBet: 0,
        rtp: 96.5,
        volatility: "high",
        paylines: 20,
        reels: 6,
        isPopular: true,
        isNew: false,
        isMobileOptimized: true,
        hasFreespins: true,
        hasBonus: true,
        hasJackpot: false,
        releaseDate: "2021-03-01T00:00:00Z",
        description:
          "Enter the divine realm of Greek mythology with massive win potential. Features a unique hold-and-spin bonus with multiplier symbols.",
        features: [
          "Hold and Spin",
          "Multipliers",
          "Free Spins",
          "Cluster Pays",
          "Divine Symbols",
        ],
      },
      {
        id: "crazy-time",
        providerId: "freeslotsgames",
        name: "Crazy Time",
        slug: "crazy-time",
        thumbnailUrl: "https://free-slots.games/media/slots/crazy-time.jpg",
        category: "game-show",
        tags: ["game-show", "wheel", "bonus", "interactive", "live"],
        minBet: 0,
        maxBet: 0,
        rtp: 94.1,
        volatility: "high",
        paylines: 1,
        reels: 1,
        isPopular: true,
        isNew: false,
        isMobileOptimized: true,
        hasFreespins: false,
        hasBonus: true,
        hasJackpot: true,
        releaseDate: "2020-08-01T00:00:00Z",
        description:
          "A game-show style slot with a giant wheel, mini-games, and four exciting bonus features. High entertainment value with massive multiplier potential.",
        features: [
          "Wheel Bonus",
          "Mini Games",
          "Multipliers",
          "Game Show",
          "Interactive",
        ],
      },
      {
        id: "big-bass-bonanza",
        providerId: "freeslotsgames",
        name: "Big Bass Bonanza",
        slug: "big-bass-bonanza",
        thumbnailUrl: "https://free-slots.games/media/slots/big-bass-bonanza.jpg",
        category: "fishing",
        tags: ["fishing", "fish", "bonanza", "free-spins", "nature"],
        minBet: 0,
        maxBet: 0,
        rtp: 96.7,
        volatility: "high",
        paylines: 5,
        reels: 5,
        isPopular: true,
        isNew: false,
        isMobileOptimized: true,
        hasFreespins: true,
        hasBonus: true,
        hasJackpot: false,
        releaseDate: "2021-09-01T00:00:00Z",
        description:
          "Reel in massive wins with Big Bass Bonanza. Features explosive free spins with expanding symbols and increasing multipliers.",
        features: [
          "Free Spins",
          "Expanding Symbols",
          "Multipliers",
          "Fishing Theme",
          "Cascading",
        ],
      },
      {
        id: "starlight-princess",
        providerId: "freeslotsgames",
        name: "Starlight Princess",
        slug: "starlight-princess",
        thumbnailUrl:
          "https://free-slots.games/media/slots/starlight-princess.jpg",
        category: "fantasy",
        tags: ["fantasy", "princess", "magic", "sparkle", "enchanted"],
        minBet: 0,
        maxBet: 0,
        rtp: 96.5,
        volatility: "high",
        paylines: 20,
        reels: 5,
        isPopular: true,
        isNew: false,
        isMobileOptimized: true,
        hasFreespins: true,
        hasBonus: true,
        hasJackpot: false,
        releaseDate: "2022-02-01T00:00:00Z",
        description:
          "A magical fantasy adventure with a radiant princess. Cluster-pay mechanics and cascading reels create thrilling win combinations.",
        features: [
          "Cluster Pays",
          "Cascading",
          "Free Spins",
          "Magic Symbols",
          "Fantasy Theme",
        ],
      },
      {
        id: "jack-and-the-beanstalk",
        providerId: "freeslotsgames",
        name: "Jack and the Beanstalk",
        slug: "jack-and-the-beanstalk",
        thumbnailUrl: "https://free-slots.games/media/slots/jack-beanstalk.jpg",
        category: "fantasy",
        tags: ["fairy-tale", "walking-wilds", "freespins", "fantasy", "retro"],
        minBet: 0,
        maxBet: 0,
        rtp: 96.3,
        volatility: "medium",
        paylines: 20,
        reels: 5,
        isPopular: false,
        isNew: false,
        isMobileOptimized: true,
        hasFreespins: true,
        hasBonus: true,
        hasJackpot: false,
        releaseDate: "2020-05-01T00:00:00Z",
        description:
          "Climb the magical beanstalk with Jack. Walking wild symbols and free spins create exciting opportunities for treasure.",
        features: [
          "Walking Wilds",
          "Free Spins",
          "Treasure Collection",
          "Fairy Tale",
        ],
      },
      {
        id: "twin-spin",
        providerId: "freeslotsgames",
        name: "Twin Spin",
        slug: "twin-spin",
        thumbnailUrl: "https://free-slots.games/media/slots/twin-spin.jpg",
        category: "classic",
        tags: ["retro", "classic", "twin-reels", "modern", "linked"],
        minBet: 0,
        maxBet: 0,
        rtp: 96.6,
        volatility: "medium",
        paylines: 243,
        reels: 5,
        isPopular: false,
        isNew: false,
        isMobileOptimized: true,
        hasFreespins: false,
        hasBonus: false,
        hasJackpot: false,
        releaseDate: "2019-09-01T00:00:00Z",
        description:
          "Modern retro experience with linked twin reels. 243 ways to win provide frequent action and consistent gameplay.",
        features: [
          "Twin Reels",
          "243 Ways",
          "Retro Theme",
          "Linked Symbols",
          "Consistent Wins",
        ],
      },

      // Additional High-Quality Games
      {
        id: "reactoonz",
        providerId: "freeslotsgames",
        name: "Reactoonz",
        slug: "reactoonz",
        thumbnailUrl: "https://free-slots.games/media/slots/reactoonz.jpg",
        category: "cartoon",
        tags: ["cartoon", "aliens", "quirky", "fun", "cluster-pay"],
        minBet: 0,
        maxBet: 0,
        rtp: 96.2,
        volatility: "high",
        paylines: 5,
        reels: 7,
        isPopular: true,
        isNew: false,
        isMobileOptimized: true,
        hasFreespins: true,
        hasBonus: true,
        hasJackpot: false,
        releaseDate: "2018-06-01T00:00:00Z",
        description:
          "Meet the quirky Reactoonz aliens in this fun cluster-pay slot. Cascading wins, wild multipliers, and exciting bonus features.",
        features: [
          "Cluster Pays",
          "Cascading",
          "Wild Multipliers",
          "Bonus Round",
          "Cartoon Characters",
        ],
      },
      {
        id: "wild-swarm",
        providerId: "freeslotsgames",
        name: "Wild Swarm",
        slug: "wild-swarm",
        thumbnailUrl: "https://free-slots.games/media/slots/wild-swarm.jpg",
        category: "nature",
        tags: ["insects", "nature", "swarming", "wild", "organic"],
        minBet: 0,
        maxBet: 0,
        rtp: 96.1,
        volatility: "medium",
        paylines: 5,
        reels: 7,
        isPopular: false,
        isNew: false,
        isMobileOptimized: true,
        hasFreespins: true,
        hasBonus: true,
        hasJackpot: false,
        releaseDate: "2019-09-01T00:00:00Z",
        description:
          "Experience a natural swarming phenomenon with insect-themed slots. Wilds swarm the reels during bonus features for massive wins.",
        features: [
          "Swarming Wilds",
          "Free Spins",
          "Nature Theme",
          "Organic Graphics",
          "Bonus Feature",
        ],
      },
      {
        id: "pyramid-king",
        providerId: "freeslotsgames",
        name: "Pyramid King",
        slug: "pyramid-king",
        thumbnailUrl: "https://free-slots.games/media/slots/pyramid-king.jpg",
        category: "adventure",
        tags: ["egypt", "pyramid", "ancient", "adventure", "treasure"],
        minBet: 0,
        maxBet: 0,
        rtp: 95.5,
        volatility: "medium",
        paylines: 25,
        reels: 5,
        isPopular: false,
        isNew: false,
        isMobileOptimized: true,
        hasFreespins: true,
        hasBonus: true,
        hasJackpot: false,
        releaseDate: "2020-03-01T00:00:00Z",
        description:
          "Explore ancient Egyptian pyramids in search of hidden treasure. Free spins and bonus features unlock the secrets of the pharaohs.",
        features: [
          "Free Spins",
          "Bonus Rounds",
          "Scatter Pays",
          "Egyptian Theme",
          "Treasure Hunt",
        ],
      },
      {
        id: "theme-park",
        providerId: "freeslotsgames",
        name: "Theme Park",
        slug: "theme-park",
        thumbnailUrl: "https://free-slots.games/media/slots/theme-park.jpg",
        category: "fun",
        tags: ["amusement", "fun", "colorful", "carnival", "entertainment"],
        minBet: 0,
        maxBet: 0,
        rtp: 96.4,
        volatility: "medium",
        paylines: 40,
        reels: 5,
        isPopular: false,
        isNew: false,
        isMobileOptimized: true,
        hasFreespins: true,
        hasBonus: true,
        hasJackpot: false,
        releaseDate: "2018-11-01T00:00:00Z",
        description:
          "Enter a thrilling theme park full of rides and entertainment. Multiple bonus games and features create an exciting experience.",
        features: [
          "Multi-Bonus Games",
          "Free Spins",
          "Wild Multiplier",
          "Carnival Theme",
          "Entertainment",
        ],
      },
      {
        id: "wild-west-extravaganza",
        providerId: "freeslotsgames",
        name: "Wild West Extravaganza",
        slug: "wild-west-extravaganza",
        thumbnailUrl:
          "https://free-slots.games/media/slots/wild-west-extravaganza.jpg",
        category: "western",
        tags: ["western", "cowboys", "old-west", "gold", "adventure"],
        minBet: 0,
        maxBet: 0,
        rtp: 96.0,
        volatility: "medium",
        paylines: 30,
        reels: 5,
        isPopular: false,
        isNew: false,
        isMobileOptimized: true,
        hasFreespins: true,
        hasBonus: true,
        hasJackpot: false,
        releaseDate: "2019-05-01T00:00:00Z",
        description:
          "Get your guns ready for a wild west adventure. Saloon-themed bonus rounds and gold rush free spins promise exciting payouts.",
        features: [
          "Saloon Bonus",
          "Free Spins",
          "Gold Rush",
          "Western Theme",
          "Expanding Symbols",
        ],
      },
      {
        id: "jungle-spirits",
        providerId: "freeslotsgames",
        name: "Jungle Spirits",
        slug: "jungle-spirits",
        thumbnailUrl: "https://free-slots.games/media/slots/jungle-spirits.jpg",
        category: "nature",
        tags: ["jungle", "animals", "spirits", "wildlife", "exotic"],
        minBet: 0,
        maxBet: 0,
        rtp: 96.2,
        volatility: "medium",
        paylines: 25,
        reels: 5,
        isPopular: false,
        isNew: false,
        isMobileOptimized: true,
        hasFreespins: true,
        hasBonus: true,
        hasJackpot: false,
        releaseDate: "2020-04-01T00:00:00Z",
        description:
          "Discover mystical jungle spirits among exotic wildlife. Mysterious bonus features and free spins reveal hidden treasures.",
        features: [
          "Mystical Symbols",
          "Free Spins",
          "Animal Themes",
          "Jungle Spirit",
          "Exotic Features",
        ],
      },
    ];
  }
}
