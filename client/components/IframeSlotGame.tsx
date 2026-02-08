import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  ExternalLink,
  RotateCcw,
  AlertTriangle,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { useCurrency, CurrencyType } from "@/contexts/CurrencyContext";
import { cn } from "@/lib/utils";

export interface SlotGameData {
  id: string;
  providerId: string;
  name: string;
  thumbnailUrl: string;
  minBet: number;
  maxBet: number;
  rtp: number;
  volatility: "low" | "medium" | "high";
  features: string[];
  description: string;
}

interface IframeSlotGameProps {
  game: SlotGameData;
  currency: CurrencyType;
  mode?: "real" | "demo";
  className?: string;
  onGameLaunch?: (gameId: string, success: boolean) => void;
  onGameEnd?: (gameId: string, sessionData?: any) => void;
  onError?: (error: string) => void;
}

interface GameSession {
  sessionToken: string;
  iframeUrl: string;
  playerId: string;
  startTime: number;
}

export function IframeSlotGame({
  game,
  currency,
  mode = "real",
  className,
  onGameLaunch,
  onGameEnd,
  onError,
}: IframeSlotGameProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isGameActive, setIsGameActive] = useState(false);
  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showComplianceModal, setShowComplianceModal] = useState(false);
  const [hasAgreedToTerms, setHasAgreedToTerms] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sessionCheckInterval = useRef<NodeJS.Timeout>();

  const { user, canAffordWager } = useCurrency();

  // Sweepstakes compliance check
  const isSweepstakesCompliant = useCallback(() => {
    // Free games always compliant
    if (
      game.providerId === "freeslotsgames" ||
      game.providerId === "idevgames"
    ) {
      return true;
    }

    if (mode === "demo") return true;
    if (currency === CurrencyType.GC) return true;

    // For sweep coins, additional compliance checks
    if (currency === CurrencyType.SC) {
      return hasAgreedToTerms && user?.verified;
    }

    return false;
  }, [mode, currency, hasAgreedToTerms, user?.verified, game.providerId]);

  // Launch game iframe
  const launchGame = useCallback(async () => {
    if (!isSweepstakesCompliant()) {
      setShowComplianceModal(true);
      return;
    }

    if (!user?.id) {
      setError("Please log in to play");
      return;
    }

    if (!canAffordWager(currency, game.minBet)) {
      setError(`Insufficient ${currency} balance. Minimum bet: ${game.minBet}`);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const launchParams = {
        gameId: game.id,
        providerId: game.providerId,
        playerId: user.id,
        currency: currency,
        mode: mode,
        language: "en",
        returnUrl: window.location.href,
        sessionId: generateSessionId(),
      };

      const response = await fetch("/api/slots/launch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(launchParams),
      });

      if (!response.ok) {
        throw new Error(`Launch failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.iframeUrl) {
        const session: GameSession = {
          sessionToken: data.sessionToken,
          iframeUrl: data.iframeUrl,
          playerId: user.id,
          startTime: Date.now(),
        };

        setGameSession(session);
        setIsGameActive(true);
        onGameLaunch?.(game.id, true);

        // Start session monitoring
        startSessionMonitoring(session.sessionToken);
      } else {
        throw new Error(data.error || "Launch failed");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to launch game";
      setError(errorMessage);
      onError?.(errorMessage);
      onGameLaunch?.(game.id, false);
    } finally {
      setIsLoading(false);
    }
  }, [
    game,
    currency,
    mode,
    user,
    hasAgreedToTerms,
    isSweepstakesCompliant,
    canAffordWager,
    onGameLaunch,
    onError,
  ]);

  // End game session
  const endGame = useCallback(async () => {
    if (!gameSession) return;

    setIsLoading(true);

    try {
      const sessionData = {
        sessionToken: gameSession.sessionToken,
        playTime: Date.now() - gameSession.startTime,
        gameId: game.id,
      };

      await fetch("/api/slots/end-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sessionData),
      });

      onGameEnd?.(game.id, sessionData);
    } catch (err) {
      console.error("Failed to end session:", err);
    } finally {
      setGameSession(null);
      setIsGameActive(false);
      setIsLoading(false);
      stopSessionMonitoring();
    }
  }, [gameSession, game.id, onGameEnd]);

  // Generate unique session ID
  const generateSessionId = () => {
    return `${user?.id}-${game.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Monitor game session
  const startSessionMonitoring = (sessionToken: string) => {
    sessionCheckInterval.current = setInterval(async () => {
      try {
        const response = await fetch("/api/slots/validate-session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ sessionToken }),
        });

        if (!response.ok) {
          throw new Error("Session validation failed");
        }

        const data = await response.json();
        if (!data.valid) {
          setError("Game session expired");
          endGame();
        }
      } catch (err) {
        console.error("Session check failed:", err);
      }
    }, 30000); // Check every 30 seconds
  };

  const stopSessionMonitoring = () => {
    if (sessionCheckInterval.current) {
      clearInterval(sessionCheckInterval.current);
      sessionCheckInterval.current = undefined;
    }
  };

  // Handle iframe messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!gameSession || !iframeRef.current) return;

      // Verify origin for security
      const allowedOrigins = [
        "https://bgaming.com",
        "https://api.pragmaticplay.net",
        "https://cdn.pragmaticplay.net",
      ];

      if (!allowedOrigins.some((origin) => event.origin.includes(origin))) {
        console.warn(
          "Received message from unauthorized origin:",
          event.origin,
        );
        return;
      }

      const { data } = event;

      switch (data.type) {
        case "gameLoaded":
          setIsLoading(false);
          break;
        case "gameEnded":
          endGame();
          break;
        case "gameError":
          setError(data.error || "Game error occurred");
          break;
        case "balanceUpdate":
          // Refresh user balance
          window.dispatchEvent(new CustomEvent("refreshBalance"));
          break;
        case "fullscreenRequest":
          setIsFullscreen(true);
          break;
        case "exitFullscreen":
          setIsFullscreen(false);
          break;
        default:
          console.log("Unknown message type:", data.type);
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
      stopSessionMonitoring();
    };
  }, [gameSession, endGame]);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;

    try {
      if (!isFullscreen) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error("Fullscreen toggle failed:", err);
    }
  }, [isFullscreen]);

  // Compliance modal for sweep coins
  const ComplianceModal = () => (
    <Dialog open={showComplianceModal} onOpenChange={setShowComplianceModal}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Sweepstakes Compliance
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            To play with Sweep Coins, you must:
          </p>
          <ul className="text-sm space-y-2 list-disc list-inside">
            <li>Be a verified user (completed KYC)</li>
            <li>Agree to sweepstakes terms and conditions</li>
            <li>Confirm you are in an eligible jurisdiction</li>
          </ul>

          {!user?.verified && (
            <Alert>
              <AlertDescription>
                Please complete identity verification to use Sweep Coins.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="terms-agreement"
              checked={hasAgreedToTerms}
              onChange={(e) => setHasAgreedToTerms(e.target.checked)}
              className="rounded border-border"
            />
            <label htmlFor="terms-agreement" className="text-sm">
              I agree to the sweepstakes terms and conditions
            </label>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowComplianceModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShowComplianceModal(false);
                if (isSweepstakesCompliant()) {
                  launchGame();
                }
              }}
              disabled={!isSweepstakesCompliant()}
              className="flex-1"
            >
              Continue
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

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

  if (isGameActive && gameSession) {
    return (
      <div
        ref={containerRef}
        className={cn(
          "relative bg-card rounded-lg overflow-hidden",
          isFullscreen && "fixed inset-0 z-50 bg-black",
          className,
        )}
      >
        {/* Game Controls */}
        <div
          className={cn(
            "absolute top-2 right-2 z-10 flex gap-2",
            isFullscreen && "top-4 right-4",
          )}
        >
          <Button
            size="sm"
            variant="secondary"
            onClick={toggleFullscreen}
            className="bg-background/80 backdrop-blur-sm"
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={endGame}
            disabled={isLoading}
            className="bg-destructive/80 backdrop-blur-sm"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "End Game"
            )}
          </Button>
        </div>

        {/* Game Iframe */}
        <iframe
          ref={iframeRef}
          src={gameSession.iframeUrl}
          className={cn(
            "w-full border-0",
            isFullscreen ? "h-screen" : "h-[600px]",
          )}
          title={`${game.name} - ${game.providerId}`}
          allow="fullscreen; payment; microphone"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
          onLoad={() => setIsLoading(false)}
        />

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p>Loading {game.name}...</p>
            </div>
          </div>
        )}

        <ComplianceModal />
      </div>
    );
  }

  return (
    <Card
      className={cn("slot-machine-card transition-all duration-200", className)}
    >
      <CardHeader className="text-center pb-4">
        <div className="relative">
          <img
            src={game.thumbnailUrl || "/placeholder.svg"}
            alt={game.name}
            className="w-full h-48 object-cover rounded-lg mb-4"
            onError={(e) => {
              e.currentTarget.src = "/placeholder.svg";
            }}
          />
          {/* Free game badge */}
          {game.providerId === "freeslotsgames" ||
          game.providerId === "idevgames" ? (
            <Badge className="absolute top-2 left-2 bg-success text-white">
              FREE
            </Badge>
          ) : (
            <Badge className="absolute top-2 left-2 bg-purple text-white">
              {game.providerId.toUpperCase()}
            </Badge>
          )}
          <Badge
            className={`absolute top-2 right-2 ${getVolatilityColor(game.volatility)}`}
          >
            {game.volatility.toUpperCase()}
          </Badge>
        </div>
        <CardTitle className="text-lg">{game.name}</CardTitle>
        <p className="text-sm text-muted-foreground">{game.description}</p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Game Stats */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Min Bet:</span>
            <span className="font-semibold ml-2">
              {game.minBet} {currency}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">RTP:</span>
            <span className="font-semibold ml-2">{game.rtp}%</span>
          </div>
        </div>

        {/* Features */}
        {game.features.length > 0 && (
          <div>
            <p className="text-sm text-muted-foreground mb-2">Features:</p>
            <div className="flex flex-wrap gap-1">
              {game.features.slice(0, 3).map((feature, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {feature}
                </Badge>
              ))}
              {game.features.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{game.features.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Launch Button */}
        <div className="flex gap-2">
          <Button
            onClick={launchGame}
            disabled={isLoading || !user}
            className="flex-1 btn-primary"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <ExternalLink className="h-4 w-4 mr-2" />
            )}
            {game.providerId === "freeslotsgames" ||
            game.providerId === "idevgames"
              ? "Play Free"
              : `Play ${mode === "demo" ? "Demo" : currency}`}
          </Button>

          {mode === "real" && (
            <Button
              onClick={() => {
                const demoParams = { ...arguments[0] };
                // This would launch in demo mode - implementation needed
              }}
              variant="outline"
              size="sm"
            >
              Demo
            </Button>
          )}
        </div>
      </CardContent>

      <ComplianceModal />
    </Card>
  );
}
