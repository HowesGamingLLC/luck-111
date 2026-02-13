import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { IframeSlotGame } from "@/components/IframeSlotGame";
import { DemoSlotGame } from "@/components/DemoSlotGame";
import { CurrencySelector } from "@/components/CurrencySelector";
import { useCurrency, CurrencyType } from "@/contexts/CurrencyContext";
import {
  Crown,
  Coins,
  Gem,
  Star,
  Sparkles,
  Search,
  Filter,
  ArrowLeft,
  TrendingUp,
  Zap,
  Trophy,
  Loader2,
  RefreshCw,
  AlertTriangle,
  Grid,
  List,
  Globe,
  Gift,
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface SlotProvider {
  id: string;
  name: string;
  displayName: string;
  isActive: boolean;
  features: {
    hasIframe: boolean;
    supportsThumbnails: boolean;
    supportsSweepstakes: boolean;
  };
}

interface SlotGame {
  id: string;
  providerId: string;
  name: string;
  slug: string;
  thumbnailUrl: string;
  category: string;
  tags: string[];
  minBet: number;
  maxBet: number;
  rtp: number;
  volatility: "low" | "medium" | "high";
  paylines: number;
  reels: number;
  isPopular: boolean;
  isNew: boolean;
  isMobileOptimized: boolean;
  hasFreespins: boolean;
  hasBonus: boolean;
  hasJackpot: boolean;
  releaseDate: string;
  description: string;
  features: string[];
}

export default function EnhancedSlotsPage() {
  const [providers, setProviders] = useState<SlotProvider[]>([]);
  const [games, setGames] = useState<SlotGame[]>([]);
  const [filteredGames, setFilteredGames] = useState<SlotGame[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedVolatility, setSelectedVolatility] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("isPopular");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyType>(
    CurrencyType.GC,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [gamesPerPage] = useState(12);
  const [showOnlyFreeSpins, setShowOnlyFreeSpins] = useState(false);
  const [showOnlyBonus, setShowOnlyBonus] = useState(false);
  const [showOnlyJackpot, setShowOnlyJackpot] = useState(false);
  const [showPopularOnly, setShowPopularOnly] = useState(false);
  const [showNewOnly, setShowNewOnly] = useState(false);

  const { user } = useCurrency();

  // Load providers and games
  useEffect(() => {
    loadProviders();
    loadGames();
  }, []);

  // Filter and sort games when filters change
  useEffect(() => {
    filterAndSortGames();
  }, [
    games,
    selectedProvider,
    selectedCategory,
    selectedVolatility,
    searchQuery,
    sortBy,
    sortOrder,
  ]);

  const loadProviders = async () => {
    try {
      const response = await fetch("/api/slots/providers");
      if (!response.ok) throw new Error("Failed to load providers");

      const data = await response.json();
      if (data.success) {
        setProviders(data.providers);
      } else {
        console.error("Provider API returned error:", data.error);
      }
    } catch (err) {
      console.error("Error loading providers:", err);
      // Don't set error for providers as games error will be more informative
    }
  };

  const loadGames = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        limit: "100",
        offset: "0",
        sortBy: "name",
        sortOrder: "asc",
      });

      const response = await fetch(`/api/slots/games?${params}`);
      if (!response.ok) throw new Error("Failed to load games");

      const data = await response.json();
      if (data.success) {
        setGames(data.games);

        // Check what types of games we have
        const freeGames = data.games.filter(
          (g) =>
            g.providerId === "freeslotsgames" || g.providerId === "idevgames",
        );
        const paidGames = data.games.filter(
          (g) =>
            g.providerId !== "freeslotsgames" && g.providerId !== "idevgames",
        );

        if (data.games.length === 0) {
          setError(
            "No games available. This may be due to demo API credentials. Please configure real provider API keys to see live games.",
          );
        } else if (paidGames.length === 0 && freeGames.length > 0) {
          setError(
            "Currently showing free games only. Configure BGaming and Pragmatic Play API credentials to access premium slot games.",
          );
        } else {
          // Clear any previous errors when we have games
          setError(null);
        }

        // Preload thumbnails for better UX
        preloadThumbnails(data.games);
      } else {
        throw new Error(data.error || "Failed to load games");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load games";
      setError(
        `${errorMessage}. Please check your provider API configuration.`,
      );
      console.error("Error loading games:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const preloadThumbnails = async (gameList: SlotGame[]) => {
    try {
      const thumbnailUrls = gameList
        .map((game) => game.thumbnailUrl)
        .filter((url) => url && !url.includes("placeholder"));

      if (thumbnailUrls.length > 0) {
        await fetch("/api/thumbnails/preload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ urls: thumbnailUrls.slice(0, 20) }),
        });
      }
    } catch (err) {
      console.error("Error preloading thumbnails:", err);
    }
  };

  const filterAndSortGames = useCallback(() => {
    let filtered = [...games];

    // Filter by provider
    if (selectedProvider !== "all") {
      filtered = filtered.filter(
        (game) => game.providerId === selectedProvider,
      );
    }

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter((game) => game.category === selectedCategory);
    }

    // Filter by volatility
    if (selectedVolatility !== "all") {
      filtered = filtered.filter(
        (game) => game.volatility === selectedVolatility,
      );
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (game) =>
          game.name.toLowerCase().includes(query) ||
          game.description.toLowerCase().includes(query) ||
          game.tags.some((tag) => tag.toLowerCase().includes(query)),
      );
    }

    // Filter by features
    if (showOnlyFreeSpins) {
      filtered = filtered.filter((game) => game.hasFreespins);
    }

    if (showOnlyBonus) {
      filtered = filtered.filter((game) => game.hasBonus);
    }

    if (showOnlyJackpot) {
      filtered = filtered.filter((game) => game.hasJackpot);
    }

    if (showPopularOnly) {
      filtered = filtered.filter((game) => game.isPopular);
    }

    if (showNewOnly) {
      filtered = filtered.filter((game) => game.isNew);
    }

    // Sort games
    filtered.sort((a, b) => {
      let aVal: any = a[sortBy as keyof SlotGame];
      let bVal: any = b[sortBy as keyof SlotGame];

      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();

      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortOrder === "desc" ? -comparison : comparison;
    });

    setFilteredGames(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [
    games,
    selectedProvider,
    selectedCategory,
    selectedVolatility,
    searchQuery,
    sortBy,
    sortOrder,
    showOnlyFreeSpins,
    showOnlyBonus,
    showOnlyJackpot,
    showPopularOnly,
    showNewOnly,
  ]);

  // Get unique categories from games
  const categories = Array.from(new Set(games.map((game) => game.category)))
    .filter(Boolean)
    .sort();

  // Get paginated games
  const startIndex = (currentPage - 1) * gamesPerPage;
  const endIndex = startIndex + gamesPerPage;
  const paginatedGames = filteredGames.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredGames.length / gamesPerPage);

  const getVolatilityColor = (volatility: string) => {
    switch (volatility) {
      case "low":
        return "text-green-500 bg-green-500/20";
      case "medium":
        return "text-yellow-500 bg-yellow-500/20";
      case "high":
        return "text-red-500 bg-red-500/20";
      default:
        return "text-gray-500 bg-gray-500/20";
    }
  };

  const getProviderDisplayName = (providerId: string) => {
    const provider = providers.find((p) => p.id === providerId);
    return provider?.displayName || providerId.toUpperCase();
  };

  const handleGameLaunch = (gameId: string, success: boolean) => {
    if (success) {
      console.log(`Game ${gameId} launched successfully`);
    } else {
      console.error(`Failed to launch game ${gameId}`);
    }
  };

  const handleGameEnd = (gameId: string, sessionData?: any) => {
    console.log(`Game ${gameId} ended`, sessionData);
    // Refresh balance after game ends
    window.dispatchEvent(new CustomEvent("refreshBalance"));
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading slot games...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8">
      <div className="container">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link to="/games">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Games
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-display font-bold gradient-text">
              Slot Machines
            </h1>
            <p className="text-muted-foreground">
              Real slot games from BGaming and Pragmatic Play
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/games/slots/docs">
              <Button variant="outline" size="sm">
                <Globe className="h-4 w-4 mr-2" />
                API Docs
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={loadGames}
              disabled={isLoading}
            >
              <RefreshCw
                className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")}
              />
              Refresh
            </Button>
          </div>
        </div>

        {/* Player Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="glass">
            <CardContent className="p-4 text-center">
              <Coins className="h-6 w-6 mx-auto mb-2 text-gold" />
              <div className="text-sm text-muted-foreground">Gold Coins</div>
              <div className="font-bold text-gold">
                {user?.balance.goldCoins.toLocaleString() || 0} GC
              </div>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardContent className="p-4 text-center">
              <Gem className="h-6 w-6 mx-auto mb-2 text-teal" />
              <div className="text-sm text-muted-foreground">Sweep Coins</div>
              <div className="font-bold text-teal">
                {user?.balance.sweepCoins.toFixed(2) || "0.00"} SC
              </div>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardContent className="p-4 text-center">
              <Sparkles className="h-6 w-6 mx-auto mb-2 text-purple" />
              <div className="text-sm text-muted-foreground">
                Available Games
              </div>
              <div className="font-bold text-purple">
                {filteredGames.length}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {
                  filteredGames.filter(
                    (g) =>
                      g.providerId === "freeslotsgames" ||
                      g.providerId === "idevgames",
                  ).length
                }{" "}
                Free
              </div>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardContent className="p-4 text-center">
              <Star className="h-6 w-6 mx-auto mb-2 text-success" />
              <div className="text-sm text-muted-foreground">
                Active Providers
              </div>
              <div className="font-bold text-success">
                {providers.filter((p) => p.isActive).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p>{error}</p>
                {error.includes("demo") && (
                  <div className="text-sm">
                    <p className="font-medium">To enable live slot games:</p>
                    <ol className="list-decimal list-inside mt-1 space-y-1">
                      <li>
                        Configure your BGaming API credentials in the
                        environment variables
                      </li>
                      <li>Configure your Pragmatic Play API credentials</li>
                      <li>Restart the development server</li>
                    </ol>
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Free Games Info */}
        {games.length > 0 &&
          games.filter(
            (g) =>
              g.providerId !== "freeslotsgames" && g.providerId !== "idevgames",
          ).length === 0 &&
          !isLoading && (
            <Alert className="mb-6">
              <Sparkles className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-3">
                  <p className="font-medium">🎰 Free Slot Games Available!</p>
                  <p>
                    You're currently playing free slot games from our partner
                    providers. These games are:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                    <li>✅ Completely free to play</li>
                    <li>✅ No real money required</li>
                    <li>✅ Full-featured slot experiences</li>
                    <li>✅ Mobile and desktop compatible</li>
                  </ul>
                  <div className="flex gap-2 mt-3">
                    <Link to="/games/slots/docs">
                      <Button size="sm" variant="outline">
                        📖 API Documentation
                      </Button>
                    </Link>
                    <p className="text-sm text-muted-foreground flex items-center">
                      Want more games? Configure BGaming and Pragmatic Play API
                      credentials for premium slot access.
                    </p>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            variant={showPopularOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setShowPopularOnly(!showPopularOnly)}
            className="gap-2"
          >
            <Crown className="h-4 w-4" />
            Popular
          </Button>
          <Button
            variant={showNewOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setShowNewOnly(!showNewOnly)}
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            New
          </Button>
          <Button
            variant={showOnlyFreeSpins ? "default" : "outline"}
            size="sm"
            onClick={() => setShowOnlyFreeSpins(!showOnlyFreeSpins)}
            className="gap-2"
          >
            <Zap className="h-4 w-4" />
            Free Spins
          </Button>
          <Button
            variant={showOnlyBonus ? "default" : "outline"}
            size="sm"
            onClick={() => setShowOnlyBonus(!showOnlyBonus)}
            className="gap-2"
          >
            <Gift className="h-4 w-4" />
            Bonus
          </Button>
          <Button
            variant={showOnlyJackpot ? "default" : "outline"}
            size="sm"
            onClick={() => setShowOnlyJackpot(!showOnlyJackpot)}
            className="gap-2"
          >
            <Trophy className="h-4 w-4" />
            Jackpot
          </Button>
        </div>

        {/* Filters and Controls */}
        <Card className="glass mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters & Search
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search games by name, theme, or features..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter Controls */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Provider
                </label>
                <Select
                  value={selectedProvider}
                  onValueChange={setSelectedProvider}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Providers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Providers</SelectItem>
                    {providers.map((provider) => (
                      <SelectItem key={provider.id} value={provider.id}>
                        {provider.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Category
                </label>
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Volatility
                </label>
                <Select
                  value={selectedVolatility}
                  onValueChange={setSelectedVolatility}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Volatility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Volatility</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Sort By
                </label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="isPopular">Popular</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="rtp">RTP</SelectItem>
                    <SelectItem value="volatility">Volatility</SelectItem>
                    <SelectItem value="releaseDate">Release Date</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Order</label>
                <Select
                  value={sortOrder}
                  onValueChange={(value) =>
                    setSortOrder(value as "asc" | "desc")
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Ascending</SelectItem>
                    <SelectItem value="desc">Descending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Currency Selection */}
            <div>
              <CurrencySelector
                selectedCurrency={selectedCurrency}
                onCurrencyChange={setSelectedCurrency}
                variant="compact"
              />
            </div>
          </CardContent>
        </Card>

        {/* Games Grid/List */}
        {paginatedGames.length === 0 ? (
          <>
            {/* Show demo games when no real games are available */}
            {games.length === 0 && !isLoading ? (
              <DemoSlotGame />
            ) : (
              <Card className="glass">
                <CardContent className="p-8 text-center">
                  <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No games found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your filters or search terms
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <>
            <div
              className={cn(
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                  : "space-y-4",
              )}
            >
              {paginatedGames.map((game) => (
                <IframeSlotGame
                  key={`${game.providerId}-${game.id}`}
                  game={game}
                  currency={selectedCurrency}
                  mode="real"
                  onGameLaunch={handleGameLaunch}
                  onGameEnd={handleGameEnd}
                  onError={(error) => console.error("Game error:", error)}
                  className={viewMode === "list" ? "max-w-none" : ""}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>

                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>

                <Button
                  variant="outline"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}

        {/* Provider Information */}
        <Card className="glass mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-gold" />
              Slot Providers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {providers.map((provider) => (
                <div
                  key={provider.id}
                  className="flex items-center justify-between p-3 bg-card/50 rounded"
                >
                  <div>
                    <div className="font-semibold">{provider.displayName}</div>
                    <div className="text-sm text-muted-foreground">
                      {games.filter((g) => g.providerId === provider.id).length}{" "}
                      games
                    </div>
                  </div>
                  <Badge variant={provider.isActive ? "default" : "secondary"}>
                    {provider.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
