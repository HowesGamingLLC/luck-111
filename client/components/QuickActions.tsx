import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import {
  useCurrency,
  formatCurrency,
  CurrencyType,
} from "@/contexts/CurrencyContext";
import {
  Zap,
  ShoppingCart,
  Target,
  FileText,
  DollarSign,
  Gift,
  Crown,
  Settings,
  Users,
  TrendingUp,
  Coins,
  Gem,
  Calendar,
  Trophy,
  User,
  CreditCard,
  HelpCircle,
  MessageSquare,
  Bell,
  Shield,
  Star,
  ChevronDown,
  Plus,
  ArrowRight,
  ExternalLink,
  Gamepad2,
  Dice1,
  Spade,
  CircleDot,
  BarChart3,
  RefreshCw,
  Heart,
  Share2,
} from "lucide-react";

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  link?: string;
  onClick?: () => void;
  badge?: string;
  disabled?: boolean;
  requiresAuth?: boolean;
  requiresKyc?: boolean;
  category: "gaming" | "financial" | "account" | "social" | "support";
}

interface QuickActionsProps {
  layout?: "grid" | "list" | "compact";
  categories?: ("gaming" | "financial" | "account" | "social" | "support")[];
  maxItems?: number;
  showCategories?: boolean;
}

export function QuickActions({
  layout = "grid",
  categories = ["gaming", "financial", "account", "social", "support"],
  maxItems,
  showCategories = true,
}: QuickActionsProps) {
  const { user, isAuthenticated } = useAuth();
  const { user: currencyUser, canClaimDailySpin } = useCurrency();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showCustomDialog, setShowCustomDialog] = useState(false);

  const quickActions: QuickAction[] = [
    // Gaming Actions
    {
      id: "play-games",
      title: "Play Games",
      description: "Start playing your favorite casino games",
      icon: Gamepad2,
      color: "text-purple",
      link: "/games",
      category: "gaming",
      requiresAuth: true,
    },
    {
      id: "slots",
      title: "Slot Machines",
      description: "Spin the reels and win big",
      icon: Dice1,
      color: "text-gold",
      link: "/games/slots",
      category: "gaming",
      requiresAuth: true,
    },
    {
      id: "poker",
      title: "Poker Room",
      description: "Join a poker table",
      icon: Spade,
      color: "text-red-500",
      link: "/games/poker",
      category: "gaming",
      requiresAuth: true,
    },
    {
      id: "bingo",
      title: "Bingo Hall",
      description: "Play live bingo games",
      icon: CircleDot,
      color: "text-blue-500",
      link: "/games/bingo",
      category: "gaming",
      requiresAuth: true,
    },
    {
      id: "table-games",
      title: "Table Games",
      description: "Blackjack, Roulette, and more",
      icon: Target,
      color: "text-green-500",
      link: "/games/table",
      category: "gaming",
      requiresAuth: true,
    },
    {
      id: "sportsbook",
      title: "Sportsbook",
      description: "Bet on your favorite sports",
      icon: Trophy,
      color: "text-orange-500",
      link: "/games/sportsbook",
      category: "gaming",
      requiresAuth: true,
    },
    {
      id: "daily-spin",
      title: "Daily Spin",
      description: "Claim your free daily rewards",
      icon: RefreshCw,
      color: "text-teal",
      link: "/dashboard",
      badge: canClaimDailySpin() ? "Available" : "Claimed",
      disabled: !canClaimDailySpin(),
      category: "gaming",
      requiresAuth: true,
    },

    // Financial Actions
    {
      id: "buy-coins",
      title: "Buy Gold Coins",
      description: "Purchase coins to play more games",
      icon: ShoppingCart,
      color: "text-gold",
      link: "/store",
      category: "financial",
      requiresAuth: true,
    },
    {
      id: "withdraw",
      title: "Request Withdrawal",
      description: "Cash out your Sweep Coins",
      icon: DollarSign,
      color: "text-green-500",
      link: "/withdraw",
      badge: user?.kycStatus !== "approved" ? "KYC Required" : undefined,
      category: "financial",
      requiresAuth: true,
      requiresKyc: true,
    },
    {
      id: "wallet",
      title: "My Wallet",
      description: "View balance and transactions",
      icon: CreditCard,
      color: "text-purple",
      link: "/wallet/enhanced",
      category: "financial",
      requiresAuth: true,
    },
    {
      id: "bonuses",
      title: "Claim Bonuses",
      description: "View available promotions",
      icon: Gift,
      color: "text-red-500",
      link: "/bonuses",
      badge: "New",
      category: "financial",
      requiresAuth: true,
    },
    {
      id: "vip-rewards",
      title: "VIP Rewards",
      description: "Exclusive VIP member benefits",
      icon: Crown,
      color: "text-yellow-500",
      link: "/vip",
      badge:
        currencyUser?.level && currencyUser.level >= 5
          ? "Available"
          : "Level 5+",
      disabled: !currencyUser?.level || currencyUser.level < 5,
      category: "financial",
      requiresAuth: true,
    },

    // Account Actions
    {
      id: "profile",
      title: "My Profile",
      description: "View and edit your profile",
      icon: User,
      color: "text-blue-500",
      link: "/profile",
      category: "account",
      requiresAuth: true,
    },
    {
      id: "settings",
      title: "Account Settings",
      description: "Manage your account preferences",
      icon: Settings,
      color: "text-gray-500",
      link: "/account/settings",
      category: "account",
      requiresAuth: true,
    },
    {
      id: "kyc",
      title: "Identity Verification",
      description: "Complete KYC verification",
      icon: Shield,
      color: "text-orange-500",
      link: "/kyc",
      badge:
        user?.kycStatus === "approved"
          ? "Verified"
          : user?.kycStatus === "pending"
            ? "Pending"
            : user?.kycStatus === "rejected"
              ? "Rejected"
              : "Required",
      disabled: user?.kycStatus === "approved",
      category: "account",
      requiresAuth: true,
    },
    {
      id: "achievements",
      title: "Achievements",
      description: "Track your gaming milestones",
      icon: Star,
      color: "text-purple",
      link: "/achievements",
      category: "account",
      requiresAuth: true,
    },
    {
      id: "notifications",
      title: "Notifications",
      description: "Manage your notifications",
      icon: Bell,
      color: "text-blue-500",
      link: "/notifications",
      badge: "3",
      category: "account",
      requiresAuth: true,
    },

    // Social Actions
    {
      id: "leaderboard",
      title: "Leaderboard",
      description: "See top players and rankings",
      icon: TrendingUp,
      color: "text-green-500",
      link: "/leaderboard",
      category: "social",
    },
    {
      id: "referrals",
      title: "Refer Friends",
      description: "Invite friends and earn rewards",
      icon: Users,
      color: "text-blue-500",
      link: "/referrals",
      badge: "Earn $10",
      category: "social",
      requiresAuth: true,
    },
    {
      id: "share",
      title: "Share Wins",
      description: "Share your big wins on social media",
      icon: Share2,
      color: "text-pink-500",
      onClick: () => {
        // Implement social sharing functionality
        setShowCustomDialog(true);
      },
      category: "social",
      requiresAuth: true,
    },
    {
      id: "tournaments",
      title: "Tournaments",
      description: "Join competitive tournaments",
      icon: Trophy,
      color: "text-gold",
      link: "/tournaments",
      badge: "Live",
      category: "social",
      requiresAuth: true,
    },

    // Support Actions
    {
      id: "help",
      title: "Help Center",
      description: "Get help and find answers",
      icon: HelpCircle,
      color: "text-blue-500",
      link: "/help",
      category: "support",
    },
    {
      id: "support",
      title: "Contact Support",
      description: "Chat with our support team",
      icon: MessageSquare,
      color: "text-green-500",
      onClick: () => {
        // Implement chat support functionality
        setShowCustomDialog(true);
      },
      badge: "24/7",
      category: "support",
    },
    {
      id: "responsible-gaming",
      title: "Responsible Gaming",
      description: "Tools and resources for safe gaming",
      icon: Heart,
      color: "text-red-500",
      link: "/responsible-gaming",
      category: "support",
    },
  ];

  const filteredActions = quickActions
    .filter((action) => {
      if (
        selectedCategory !== "all" &&
        !categories.includes(action.category as any)
      )
        return false;
      if (selectedCategory !== "all" && action.category !== selectedCategory)
        return false;
      if (action.requiresAuth && !isAuthenticated) return false;
      return true;
    })
    .slice(0, maxItems);

  const categoryNames = {
    gaming: "Gaming",
    financial: "Financial",
    account: "Account",
    social: "Social",
    support: "Support",
  };

  const categoryCounts = categories.reduce(
    (acc, category) => {
      acc[category] = quickActions.filter(
        (action) => action.category === category,
      ).length;
      return acc;
    },
    {} as Record<string, number>,
  );

  const renderAction = (action: QuickAction) => {
    const Icon = action.icon;
    const isDisabled =
      action.disabled ||
      (action.requiresAuth && !isAuthenticated) ||
      (action.requiresKyc && user?.kycStatus !== "approved");

    const content = (
      <div
        className={`flex items-center ${layout === "list" ? "justify-between w-full" : layout === "compact" ? "gap-2" : "flex-col text-center"} ${isDisabled ? "opacity-50" : ""}`}
      >
        <div
          className={`flex items-center ${layout === "compact" ? "gap-2" : layout === "list" ? "gap-3" : "flex-col gap-2"}`}
        >
          <div
            className={`${layout === "compact" ? "w-8 h-8" : "w-10 h-10"} rounded-lg bg-muted/50 flex items-center justify-center`}
          >
            <Icon
              className={`${layout === "compact" ? "h-4 w-4" : "h-5 w-5"} ${action.color}`}
            />
          </div>
          <div className={layout === "list" ? "flex-1" : ""}>
            <h4
              className={`font-medium ${layout === "compact" ? "text-sm" : ""}`}
            >
              {action.title}
            </h4>
            {layout !== "compact" && (
              <p className="text-xs text-muted-foreground">
                {action.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {action.badge && (
            <Badge variant="secondary" className="text-xs">
              {action.badge}
            </Badge>
          )}
          {layout === "list" && (
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>
    );

    if (isDisabled) {
      return (
        <div
          key={action.id}
          className={`cursor-not-allowed ${layout === "grid" ? "p-4" : "p-3"} border border-border/50 rounded-lg`}
        >
          {content}
        </div>
      );
    }

    if (action.link) {
      return (
        <Link key={action.id} to={action.link}>
          <div
            className={`transition-all duration-200 hover:scale-105 hover:shadow-sm ${layout === "grid" ? "p-4" : "p-3"} border border-border rounded-lg hover:border-purple/50`}
          >
            {content}
          </div>
        </Link>
      );
    }

    if (action.onClick) {
      return (
        <div
          key={action.id}
          onClick={action.onClick}
          className={`cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-sm ${layout === "grid" ? "p-4" : "p-3"} border border-border rounded-lg hover:border-purple/50`}
        >
          {content}
        </div>
      );
    }

    return (
      <div
        key={action.id}
        className={`${layout === "grid" ? "p-4" : "p-3"} border border-border rounded-lg`}
      >
        {content}
      </div>
    );
  };

  if (layout === "compact") {
    return <div className="space-y-2">{filteredActions.map(renderAction)}</div>;
  }

  return (
    <Card className="glass">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-purple" />
            <span>Quick Actions</span>
          </CardTitle>
          <CardDescription>Common actions and shortcuts</CardDescription>
        </div>

        {showCategories && categories.length > 1 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                {selectedCategory === "all"
                  ? "All Actions"
                  : categoryNames[
                      selectedCategory as keyof typeof categoryNames
                    ]}
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSelectedCategory("all")}>
                All Actions ({quickActions.length})
              </DropdownMenuItem>
              {categories.map((category) => (
                <DropdownMenuItem
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                >
                  {categoryNames[category]} ({categoryCounts[category]})
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardHeader>

      <CardContent>
        {filteredActions.length === 0 ? (
          <div className="text-center py-8">
            <Zap className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No actions available</p>
            {!isAuthenticated && (
              <p className="text-sm text-muted-foreground mt-1">
                <Link to="/login" className="text-purple hover:underline">
                  Login
                </Link>{" "}
                to access more actions
              </p>
            )}
          </div>
        ) : (
          <div
            className={
              layout === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
                : "space-y-2"
            }
          >
            {filteredActions.map(renderAction)}
          </div>
        )}
      </CardContent>

      {/* Custom Action Dialog */}
      <Dialog open={showCustomDialog} onOpenChange={setShowCustomDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Feature Coming Soon</DialogTitle>
            <DialogDescription>
              This feature is currently in development and will be available
              soon.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={() => setShowCustomDialog(false)}>Got it</Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
