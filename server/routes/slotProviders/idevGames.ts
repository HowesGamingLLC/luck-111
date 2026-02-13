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

export class IdevGamesProvider extends BaseSlotProvider {
  constructor() {
    const provider: SlotProvider = {
      id: "idevgames",
      name: "idevgames",
      displayName: "iDev.Games",
      isActive: true,
      apiEndpoint: "https://idev.games",
      websiteUrl: "https://idev.games",
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

    super(provider, "free", "idev-games");
  }

  async getGames(
    params?: ProviderGameListParams,
  ): Promise<ProviderGameListResponse> {
    try {
      // Static list of HTML5 games from iDev.Games
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
      console.error("iDev.Games getGames error:", error);
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

      // Generate iframe URL for iDev.Games
      const iframeUrl = `https://idev.games/embed/${params.gameId}`;

      return {
        success: true,
        iframeUrl: iframeUrl,
        sessionToken: `idev-${params.playerId}-${params.gameId}-${Date.now()}`,
      };
    } catch (error) {
      console.error("iDev.Games launchGame error:", error);
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
    return sessionToken.startsWith("idev-");
  }

  private getStaticGameList(): SlotGame[] {
    return [
      // Classic Games
      {
        id: "casino-slot-machine",
        providerId: "idevgames",
        name: "Casino Slot Machine",
        slug: "casino-slot-machine",
        thumbnailUrl: "https://idev.games/img/games/casino-slot-machine.jpg",
        category: "casino",
        tags: ["classic", "casino", "fruit", "html5", "3-reel"],
        minBet: 0,
        maxBet: 0,
        rtp: 95.0,
        volatility: "medium",
        paylines: 5,
        reels: 3,
        isPopular: true,
        isNew: false,
        isMobileOptimized: true,
        hasFreespins: false,
        hasBonus: false,
        hasJackpot: false,
        releaseDate: "2023-01-01T00:00:00Z",
        description:
          "The timeless classic: a traditional 3-reel casino slot machine with fruit symbols, bells, and bars. Perfect for purists.",
        features: [
          "Classic Reels",
          "Fruit Symbols",
          "HTML5",
          "Mobile Optimized",
          "Traditional Design",
        ],
      },
      {
        id: "lucky-wheel",
        providerId: "idevgames",
        name: "Lucky Wheel",
        slug: "lucky-wheel",
        thumbnailUrl: "https://idev.games/img/games/lucky-wheel.jpg",
        category: "wheel",
        tags: ["wheel", "fortune", "lucky", "spin", "simple"],
        minBet: 0,
        maxBet: 0,
        rtp: 94.0,
        volatility: "low",
        paylines: 1,
        reels: 1,
        isPopular: false,
        isNew: false,
        isMobileOptimized: true,
        hasFreespins: false,
        hasBonus: false,
        hasJackpot: true,
        releaseDate: "2023-02-01T00:00:00Z",
        description:
          "Spin the wheel of fortune for exciting prizes. Simple, fun, and perfect for quick gaming sessions.",
        features: [
          "Wheel of Fortune",
          "Jackpot",
          "Simple Gameplay",
          "Lucky Spin",
          "Quick Rounds",
        ],
      },
      {
        id: "fruit-machine",
        providerId: "idevgames",
        name: "Fruit Machine",
        slug: "fruit-machine",
        thumbnailUrl: "https://idev.games/img/games/fruit-machine.jpg",
        category: "fruit",
        tags: ["fruit", "classic", "traditional", "retro", "bonus"],
        minBet: 0,
        maxBet: 0,
        rtp: 96.0,
        volatility: "medium",
        paylines: 3,
        reels: 3,
        isPopular: true,
        isNew: false,
        isMobileOptimized: true,
        hasFreespins: false,
        hasBonus: true,
        hasJackpot: false,
        releaseDate: "2022-12-01T00:00:00Z",
        description:
          "Classic fruit machine inspired by vintage arcade slots. Cherries, lemons, and plums with exciting bonus features.",
        features: [
          "Traditional Fruits",
          "Bonus Features",
          "Classic Design",
          "Retro Style",
          "Arcade Feel",
        ],
      },

      // Modern Games
      {
        id: "diamond-slots",
        providerId: "idevgames",
        name: "Diamond Slots",
        slug: "diamond-slots",
        thumbnailUrl: "https://idev.games/img/games/diamond-slots.jpg",
        category: "gems",
        tags: ["diamonds", "gems", "luxury", "sparkle", "premium"],
        minBet: 0,
        maxBet: 0,
        rtp: 95.5,
        volatility: "high",
        paylines: 25,
        reels: 5,
        isPopular: false,
        isNew: true,
        isMobileOptimized: true,
        hasFreespins: true,
        hasBonus: true,
        hasJackpot: false,
        releaseDate: "2024-01-01T00:00:00Z",
        description:
          "Sparkling gemstone slot with diamonds, rubies, and emeralds. Luxurious bonuses and free spins for the elite player.",
        features: [
          "Diamond Wilds",
          "Free Spins",
          "Gem Symbols",
          "Luxury Theme",
          "High Volatility",
        ],
      },
      {
        id: "vegas-slots",
        providerId: "idevgames",
        name: "Vegas Slots",
        slug: "vegas-slots",
        thumbnailUrl: "https://idev.games/img/games/vegas-slots.jpg",
        category: "vegas",
        tags: ["vegas", "casino", "neon", "entertainment", "las-vegas"],
        minBet: 0,
        maxBet: 0,
        rtp: 96.2,
        volatility: "medium",
        paylines: 20,
        reels: 5,
        isPopular: true,
        isNew: false,
        isMobileOptimized: true,
        hasFreespins: true,
        hasBonus: true,
        hasJackpot: true,
        releaseDate: "2023-06-01T00:00:00Z",
        description:
          "Experience the electrifying lights and big wins of Las Vegas. Neon casino atmosphere with free spins and jackpot features.",
        features: [
          "Vegas Theme",
          "Neon Lights",
          "Jackpot",
          "Entertainment",
          "Free Spins",
        ],
      },
      {
        id: "golden-temple",
        providerId: "idevgames",
        name: "Golden Temple",
        slug: "golden-temple",
        thumbnailUrl: "https://idev.games/img/games/golden-temple.jpg",
        category: "adventure",
        tags: ["temple", "gold", "adventure", "ancient", "treasure"],
        minBet: 0,
        maxBet: 0,
        rtp: 95.8,
        volatility: "medium",
        paylines: 15,
        reels: 5,
        isPopular: true,
        isNew: false,
        isMobileOptimized: true,
        hasFreespins: true,
        hasBonus: true,
        hasJackpot: false,
        releaseDate: "2023-07-01T00:00:00Z",
        description:
          "Explore the mysteries of an ancient golden temple. Discover hidden treasures, free spins, and mystical bonus rounds.",
        features: [
          "Ancient Symbols",
          "Free Spins",
          "Treasure Hunt",
          "Temple Theme",
          "Mystical Bonus",
        ],
      },
      {
        id: "ocean-treasures",
        providerId: "idevgames",
        name: "Ocean Treasures",
        slug: "ocean-treasures",
        thumbnailUrl: "https://idev.games/img/games/ocean-treasures.jpg",
        category: "ocean",
        tags: ["ocean", "sea", "treasure", "underwater", "marine"],
        minBet: 0,
        maxBet: 0,
        rtp: 96.0,
        volatility: "medium",
        paylines: 20,
        reels: 5,
        isPopular: false,
        isNew: false,
        isMobileOptimized: true,
        hasFreespins: true,
        hasBonus: true,
        hasJackpot: false,
        releaseDate: "2023-04-01T00:00:00Z",
        description:
          "Dive deep into the ocean to find pirate treasures, pearls, and mythical sea creatures. Underwater adventure awaits.",
        features: [
          "Underwater Symbols",
          "Free Spins",
          "Treasure Chest",
          "Marine Life",
          "Pirate Theme",
        ],
      },
      {
        id: "mystic-forest",
        providerId: "idevgames",
        name: "Mystic Forest",
        slug: "mystic-forest",
        thumbnailUrl: "https://idev.games/img/games/mystic-forest.jpg",
        category: "nature",
        tags: ["forest", "magic", "nature", "mystical", "fantasy"],
        minBet: 0,
        maxBet: 0,
        rtp: 95.9,
        volatility: "medium",
        paylines: 20,
        reels: 5,
        isPopular: false,
        isNew: false,
        isMobileOptimized: true,
        hasFreespins: true,
        hasBonus: true,
        hasJackpot: false,
        releaseDate: "2023-08-01T00:00:00Z",
        description:
          "Enter an enchanted forest filled with magical creatures and mystical powers. Wilds and free spins abound.",
        features: [
          "Magical Symbols",
          "Free Spins",
          "Wild Creatures",
          "Forest Theme",
          "Mystical Powers",
        ],
      },
      {
        id: "lucky-stars",
        providerId: "idevgames",
        name: "Lucky Stars",
        slug: "lucky-stars",
        thumbnailUrl: "https://idev.games/img/games/lucky-stars.jpg",
        category: "space",
        tags: ["stars", "lucky", "space", "cosmic", "bright"],
        minBet: 0,
        maxBet: 0,
        rtp: 96.1,
        volatility: "low",
        paylines: 15,
        reels: 5,
        isPopular: false,
        isNew: false,
        isMobileOptimized: true,
        hasFreespins: false,
        hasBonus: false,
        hasJackpot: false,
        releaseDate: "2023-03-01T00:00:00Z",
        description:
          "Look to the stars for luck and fortune. A cosmic slot with low volatility and consistent winning opportunities.",
        features: [
          "Star Symbols",
          "Cosmic Theme",
          "Lucky Feature",
          "Low Volatility",
          "Consistent Wins",
        ],
      },
      {
        id: "midnight-mystery",
        providerId: "idevgames",
        name: "Midnight Mystery",
        slug: "midnight-mystery",
        thumbnailUrl: "https://idev.games/img/games/midnight-mystery.jpg",
        category: "mystery",
        tags: ["mystery", "dark", "secret", "night", "thriller"],
        minBet: 0,
        maxBet: 0,
        rtp: 95.7,
        volatility: "high",
        paylines: 25,
        reels: 5,
        isPopular: false,
        isNew: false,
        isMobileOptimized: true,
        hasFreespins: true,
        hasBonus: true,
        hasJackpot: true,
        releaseDate: "2024-02-01T00:00:00Z",
        description:
          "Uncover the secrets of midnight in this mysterious thriller. Dark atmosphere with exciting bonus features and jackpot potential.",
        features: [
          "Mystery Symbols",
          "Secret Bonus",
          "Free Spins",
          "Dark Theme",
          "Jackpot",
        ],
      },
      {
        id: "rainbow-riches",
        providerId: "idevgames",
        name: "Rainbow Riches",
        slug: "rainbow-riches",
        thumbnailUrl: "https://idev.games/img/games/rainbow-riches.jpg",
        category: "lucky",
        tags: ["rainbow", "lucky", "gold", "fortune", "color"],
        minBet: 0,
        maxBet: 0,
        rtp: 96.3,
        volatility: "medium",
        paylines: 20,
        reels: 5,
        isPopular: true,
        isNew: false,
        isMobileOptimized: true,
        hasFreespins: true,
        hasBonus: true,
        hasJackpot: false,
        releaseDate: "2023-05-01T00:00:00Z",
        description:
          "Follow the rainbow to find the pot of gold. Colorful symbols and lucky features promise rich rewards.",
        features: [
          "Rainbow Symbols",
          "Free Spins",
          "Gold Pot",
          "Lucky Theme",
          "Colorful Design",
        ],
      },
    ];
  }
}
