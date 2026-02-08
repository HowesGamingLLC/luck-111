import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Trophy,
  Crown,
  Star,
  TrendingUp,
  Zap,
  Target,
  Gift,
  Search,
  Medal,
  Coins,
  Users,
  Calendar,
  Clock,
} from "lucide-react";

interface Player {
  id: string;
  name: string;
  avatar?: string;
  rank: number;
  value: number;
  change: number;
  level: number;
  verified: boolean;
  badge?: string;
}

// Mock leaderboard data
const mockLeaderboards: Record<string, Record<string, Player[]>> = {
  daily: {
    biggestWinners: [
      {
        id: "1",
        name: "CryptoKing",
        rank: 1,
        value: 2500,
        change: 5,
        level: 25,
        verified: true,
        badge: "VIP",
      },
      {
        id: "2",
        name: "LuckyLisa",
        rank: 2,
        value: 1850,
        change: 2,
        level: 18,
        verified: true,
      },
      {
        id: "3",
        name: "SpinMaster",
        rank: 3,
        value: 1420,
        change: -1,
        level: 22,
        verified: false,
      },
      {
        id: "4",
        name: "GoldRusher",
        rank: 4,
        value: 980,
        change: 3,
        level: 15,
        verified: true,
      },
      {
        id: "5",
        name: "John Doe",
        rank: 5,
        value: 850,
        change: 1,
        level: 12,
        verified: true,
      }, // Current user
      {
        id: "6",
        name: "WheelWizard",
        rank: 6,
        value: 720,
        change: -2,
        level: 19,
        verified: false,
      },
      {
        id: "7",
        name: "JackpotJoe",
        rank: 7,
        value: 650,
        change: 0,
        level: 14,
        verified: true,
      },
      {
        id: "8",
        name: "SpinQueen",
        rank: 8,
        value: 540,
        change: 4,
        level: 16,
        verified: true,
      },
    ],
    mostSpins: [
      {
        id: "1",
        name: "SpinAddict",
        rank: 1,
        value: 127,
        change: 2,
        level: 20,
        verified: true,
      },
      {
        id: "2",
        name: "WheelWarrior",
        rank: 2,
        value: 98,
        change: 1,
        level: 17,
        verified: false,
      },
      {
        id: "3",
        name: "NonStopGamer",
        rank: 3,
        value: 89,
        change: -1,
        level: 23,
        verified: true,
      },
      {
        id: "4",
        name: "John Doe",
        rank: 4,
        value: 76,
        change: 3,
        level: 12,
        verified: true,
      }, // Current user
    ],
    highestWinRate: [
      {
        id: "1",
        name: "PerfectRecord",
        rank: 1,
        value: 95,
        change: 0,
        level: 21,
        verified: true,
        badge: "Pro",
      },
      {
        id: "2",
        name: "AlwaysWins",
        rank: 2,
        value: 88,
        change: 1,
        level: 19,
        verified: true,
      },
      {
        id: "3",
        name: "LuckyStreak",
        rank: 3,
        value: 82,
        change: -1,
        level: 16,
        verified: false,
      },
      {
        id: "4",
        name: "John Doe",
        rank: 4,
        value: 68,
        change: 2,
        level: 12,
        verified: true,
      }, // Current user
    ],
  },
  weekly: {
    biggestWinners: [
      {
        id: "1",
        name: "WeeklyChamp",
        rank: 1,
        value: 15750,
        change: 0,
        level: 28,
        verified: true,
        badge: "Champion",
      },
      {
        id: "2",
        name: "BigWinner99",
        rank: 2,
        value: 12340,
        change: 1,
        level: 25,
        verified: true,
      },
      {
        id: "3",
        name: "GoldDigger",
        rank: 3,
        value: 9870,
        change: -1,
        level: 22,
        verified: true,
      },
      {
        id: "15",
        name: "John Doe",
        rank: 15,
        value: 4250,
        change: 5,
        level: 12,
        verified: true,
      }, // Current user
    ],
    mostSpins: [
      {
        id: "1",
        name: "SpinMachine",
        rank: 1,
        value: 892,
        change: 0,
        level: 24,
        verified: true,
      },
      {
        id: "2",
        name: "NeverStops",
        rank: 2,
        value: 756,
        change: 2,
        level: 21,
        verified: false,
      },
      {
        id: "8",
        name: "John Doe",
        rank: 8,
        value: 347,
        change: 1,
        level: 12,
        verified: true,
      }, // Current user
    ],
    highestWinRate: [
      {
        id: "1",
        name: "WeeklyPro",
        rank: 1,
        value: 92,
        change: 1,
        level: 26,
        verified: true,
      },
      {
        id: "2",
        name: "ConsistentWin",
        rank: 2,
        value: 89,
        change: 0,
        level: 23,
        verified: true,
      },
      {
        id: "12",
        name: "John Doe",
        rank: 12,
        value: 71,
        change: 3,
        level: 12,
        verified: true,
      }, // Current user
    ],
  },
};

const prizes = {
  daily: [
    { rank: 1, prize: "$500 Bonus", icon: Crown, color: "text-gold" },
    { rank: 2, prize: "$300 Bonus", icon: Medal, color: "text-gray-400" },
    { rank: 3, prize: "$200 Bonus", icon: Medal, color: "text-amber-600" },
    { rank: "4-10", prize: "$50 Bonus", icon: Gift, color: "text-purple" },
  ],
  weekly: [
    { rank: 1, prize: "$2,000 Jackpot", icon: Crown, color: "text-gold" },
    { rank: 2, prize: "$1,000 Bonus", icon: Medal, color: "text-gray-400" },
    { rank: 3, prize: "$500 Bonus", icon: Medal, color: "text-amber-600" },
    { rank: "4-25", prize: "$100 Bonus", icon: Gift, color: "text-purple" },
  ],
};

export default function Leaderboard() {
  const [selectedPeriod, setSelectedPeriod] = useState("daily");
  const [selectedCategory, setSelectedCategory] = useState("biggestWinners");
  const [searchQuery, setSearchQuery] = useState("");

  const currentUser = "John Doe";

  const getCurrentData = () => {
    return (
      mockLeaderboards[selectedPeriod as keyof typeof mockLeaderboards]?.[
        selectedCategory as keyof typeof mockLeaderboards.daily
      ] || []
    );
  };

  const filteredData = getCurrentData().filter((player) =>
    player.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-gold" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
    return (
      <span className="text-lg font-bold text-muted-foreground">#{rank}</span>
    );
  };

  const getValueLabel = () => {
    switch (selectedCategory) {
      case "biggestWinners":
        return "$";
      case "mostSpins":
        return "";
      case "highestWinRate":
        return "%";
      default:
        return "";
    }
  };

  const getCategoryIcon = () => {
    switch (selectedCategory) {
      case "biggestWinners":
        return <Coins className="h-5 w-5" />;
      case "mostSpins":
        return <Zap className="h-5 w-5" />;
      case "highestWinRate":
        return <Target className="h-5 w-5" />;
      default:
        return <Trophy className="h-5 w-5" />;
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8">
      <div className="container">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-display font-bold gradient-text mb-4">
            Leaderboard
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Compete with players worldwide and climb the ranks to win amazing
            prizes!
          </p>
        </div>

        {/* Controls */}
        <Card className="glass mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <Select
                  value={selectedPeriod}
                  onValueChange={setSelectedPeriod}
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Daily
                      </div>
                    </SelectItem>
                    <SelectItem value="weekly">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Weekly
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="biggestWinners">
                      <div className="flex items-center gap-2">
                        <Coins className="h-4 w-4" />
                        Biggest Winners
                      </div>
                    </SelectItem>
                    <SelectItem value="mostSpins">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        Most Spins
                      </div>
                    </SelectItem>
                    <SelectItem value="highestWinRate">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Highest Win Rate
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search players..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full sm:w-[250px]"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Leaderboard */}
          <div className="lg:col-span-3">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getCategoryIcon()}
                  {selectedCategory === "biggestWinners" && "Biggest Winners"}
                  {selectedCategory === "mostSpins" && "Most Spins"}
                  {selectedCategory === "highestWinRate" && "Highest Win Rate"}
                  <Badge variant="outline" className="ml-auto">
                    {selectedPeriod === "daily" ? "Today" : "This Week"}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Top players competing for amazing prizes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredData.map((player, index) => (
                    <div
                      key={player.id}
                      className={`flex items-center gap-4 p-4 rounded-lg transition-all duration-200 ${
                        player.name === currentUser
                          ? "bg-gradient-to-r from-purple/20 to-gold/20 border border-purple/50"
                          : "bg-card/50 hover:bg-card/80"
                      } ${player.rank <= 3 ? "border border-gold/30" : ""}`}
                    >
                      {/* Rank */}
                      <div className="w-12 flex justify-center">
                        {getRankIcon(player.rank)}
                      </div>

                      {/* Avatar */}
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={player.avatar} alt={player.name} />
                        <AvatarFallback>
                          {player.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>

                      {/* Player Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{player.name}</span>
                          {player.name === currentUser && (
                            <Badge className="bg-teal text-white text-xs">
                              You
                            </Badge>
                          )}
                          {player.verified && (
                            <Badge variant="outline" className="text-xs">
                              Verified
                            </Badge>
                          )}
                          {player.badge && (
                            <Badge className="bg-gradient-to-r from-purple to-gold text-white text-xs">
                              {player.badge}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Level {player.level}
                        </p>
                      </div>

                      {/* Value */}
                      <div className="text-right">
                        <div className="font-bold text-lg">
                          {getValueLabel()}
                          {player.value.toLocaleString()}
                        </div>
                        <div
                          className={`text-sm flex items-center gap-1 ${
                            player.change > 0
                              ? "text-success"
                              : player.change < 0
                                ? "text-destructive"
                                : "text-muted-foreground"
                          }`}
                        >
                          {player.change > 0 && (
                            <TrendingUp className="h-3 w-3" />
                          )}
                          {player.change !== 0 &&
                            `${player.change > 0 ? "+" : ""}${player.change}`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Prize Pool */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5 text-gold" />
                  {selectedPeriod === "daily" ? "Daily" : "Weekly"} Prizes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {prizes[selectedPeriod as keyof typeof prizes].map(
                  (prize, index) => {
                    const Icon = prize.icon;
                    return (
                      <div key={index} className="flex items-center gap-3">
                        <Icon className={`h-5 w-5 ${prize.color}`} />
                        <div className="flex-1">
                          <div className="text-sm font-medium">
                            Rank {prize.rank}
                          </div>
                          <div className={`text-sm ${prize.color}`}>
                            {prize.prize}
                          </div>
                        </div>
                      </div>
                    );
                  },
                )}
              </CardContent>
            </Card>

            {/* Competition Stats */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple" />
                  Competition Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple">2,847</div>
                  <p className="text-sm text-muted-foreground">
                    Active Players
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gold">$12,500</div>
                  <p className="text-sm text-muted-foreground">
                    Total Prize Pool
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-teal">6h 23m</div>
                  <p className="text-sm text-muted-foreground">
                    Time Remaining
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Your Position */}
            <Card className="glass border-purple/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-gold" />
                  Your Position
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold gradient-text mb-2">
                    #
                    {filteredData.find((p) => p.name === currentUser)?.rank ||
                      "N/A"}
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    {selectedCategory === "biggestWinners" && "Total Winnings"}
                    {selectedCategory === "mostSpins" && "Total Spins"}
                    {selectedCategory === "highestWinRate" && "Win Rate"}
                  </p>
                  <Button className="btn-primary w-full">
                    View Full Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
