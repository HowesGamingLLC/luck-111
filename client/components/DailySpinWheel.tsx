import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useCurrency,
  CurrencyType,
  formatCurrency,
} from "@/contexts/CurrencyContext";
import { RotateCcw, Clock, Gem } from "lucide-react";

interface WheelSegment {
  label: string;
  value: number;
  currency: CurrencyType;
  color: string;
  probability: number;
}

interface DailySpinWheelProps {
  size?: number;
  onSpin?: (result: WheelSegment) => void;
  disabled?: boolean;
}

// Updated segments for SC rewards with better RTP
const dailySpinSegments: WheelSegment[] = [
  {
    label: "0.05 SC",
    value: 0.05,
    currency: CurrencyType.SC,
    color: "#8B5CF6",
    probability: 0.4,
  },
  {
    label: "0.10 SC",
    value: 0.1,
    currency: CurrencyType.SC,
    color: "#06B6D4",
    probability: 0.25,
  },
  {
    label: "0.25 SC",
    value: 0.25,
    currency: CurrencyType.SC,
    color: "#10B981",
    probability: 0.2,
  },
  {
    label: "0.50 SC",
    value: 0.5,
    currency: CurrencyType.SC,
    color: "#F59E0B",
    probability: 0.1,
  },
  {
    label: "0.75 SC",
    value: 0.75,
    currency: CurrencyType.SC,
    color: "#EF4444",
    probability: 0.04,
  },
  {
    label: "1.00 SC",
    value: 1.0,
    currency: CurrencyType.SC,
    color: "#EC4899",
    probability: 0.01,
  },
];

export function DailySpinWheel({
  size = 300,
  onSpin,
  disabled = false,
}: DailySpinWheelProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [lastResult, setLastResult] = useState<WheelSegment | null>(null);
  const [showResult, setShowResult] = useState(false);
  const wheelRef = useRef<HTMLDivElement>(null);

  const { canClaimDailySpin, claimDailySpin, updateBalance, user } =
    useCurrency();

  const [canSpin, setCanSpin] = useState(false);
  const [timeUntilNextSpin, setTimeUntilNextSpin] = useState("");

  // Check if user can spin and calculate time until next spin
  useEffect(() => {
    const updateSpinStatus = () => {
      const canClaim = canClaimDailySpin();
      setCanSpin(canClaim);

      if (!canClaim && user?.lastDailySpinClaim) {
        const now = new Date();
        const lastClaim = new Date(user.lastDailySpinClaim);
        const nextClaimTime = new Date(
          lastClaim.getTime() + 24 * 60 * 60 * 1000,
        );
        const timeDiff = nextClaimTime.getTime() - now.getTime();

        if (timeDiff > 0) {
          const hours = Math.floor(timeDiff / (1000 * 60 * 60));
          const minutes = Math.floor(
            (timeDiff % (1000 * 60 * 60)) / (1000 * 60),
          );
          setTimeUntilNextSpin(`${hours}h ${minutes}m`);
        }
      }
    };

    updateSpinStatus();
    const interval = setInterval(updateSpinStatus, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [canClaimDailySpin, user]);

  const handleSpin = async () => {
    if (isSpinning || !canSpin) return;

    setIsSpinning(true);
    setShowResult(false);

    // Claim the daily spin (updates lastDailySpinClaim)
    claimDailySpin();

    // Calculate random result based on probabilities
    const random = Math.random();
    let cumulativeProbability = 0;
    let selectedSegment = dailySpinSegments[0];

    for (const segment of dailySpinSegments) {
      cumulativeProbability += segment.probability;
      if (random <= cumulativeProbability) {
        selectedSegment = segment;
        break;
      }
    }

    // Calculate the angle for the selected segment
    const segmentAngle = 360 / dailySpinSegments.length;
    const selectedIndex = dailySpinSegments.indexOf(selectedSegment);
    const targetAngle = selectedIndex * segmentAngle;

    // Add multiple full rotations plus random offset for effect
    const spinAmount = 360 * (5 + Math.random() * 3) + targetAngle;
    const newRotation = rotation + spinAmount;

    setRotation(newRotation);

    // Complete spin after animation
    setTimeout(() => {
      setIsSpinning(false);
      setLastResult(selectedSegment);
      setShowResult(true);

      // Update user balance
      updateBalance(
        selectedSegment.currency,
        selectedSegment.value,
        `Daily Spin Wheel - Won ${formatCurrency(selectedSegment.value, selectedSegment.currency)}`,
        "win",
      );

      onSpin?.(selectedSegment);

      // Hide result after 3 seconds
      setTimeout(() => setShowResult(false), 3000);
    }, 4000);
  };

  const segmentAngle = 360 / dailySpinSegments.length;
  const radius = size / 2 - 20;

  return (
    <Card className="glass">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Gem className="h-5 w-5 text-teal" />
          Daily Sweep Coins Wheel
          {!canSpin && (
            <Badge variant="outline" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              {timeUntilNextSpin}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Wheel */}
        <div className="flex flex-col items-center space-y-4">
          <div className="relative" style={{ width: size, height: size }}>
            {/* Wheel */}
            <div
              ref={wheelRef}
              className="absolute inset-0 rounded-full border-4 border-teal shadow-2xl spin-wheel overflow-hidden"
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: isSpinning
                  ? "transform 4s cubic-bezier(0.23, 1, 0.32, 1)"
                  : "none",
              }}
            >
              {dailySpinSegments.map((segment, index) => {
                const startAngle = index * segmentAngle;
                const endAngle = startAngle + segmentAngle;

                // Calculate path for segment
                const startAngleRad = (startAngle * Math.PI) / 180;
                const endAngleRad = (endAngle * Math.PI) / 180;

                const x1 = radius + radius * Math.cos(startAngleRad);
                const y1 = radius + radius * Math.sin(startAngleRad);
                const x2 = radius + radius * Math.cos(endAngleRad);
                const y2 = radius + radius * Math.sin(endAngleRad);

                const largeArcFlag = segmentAngle > 180 ? 1 : 0;

                const pathData = `M ${radius} ${radius} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

                // Text position
                const textAngle = startAngle + segmentAngle / 2;
                const textAngleRad = (textAngle * Math.PI) / 180;
                const textRadius = radius * 0.7;
                const textX = radius + textRadius * Math.cos(textAngleRad);
                const textY = radius + textRadius * Math.sin(textAngleRad);

                return (
                  <svg
                    key={index}
                    className="absolute inset-0 w-full h-full"
                    viewBox={`0 0 ${size} ${size}`}
                  >
                    <path
                      d={pathData}
                      fill={segment.color}
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                    <text
                      x={textX}
                      y={textY}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="fill-white font-bold text-sm"
                      transform={`rotate(${textAngle} ${textX} ${textY})`}
                    >
                      {segment.label}
                    </text>
                  </svg>
                );
              })}
            </div>

            {/* Pointer */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1 z-10">
              <div className="w-0 h-0 border-l-[15px] border-r-[15px] border-b-[30px] border-l-transparent border-r-transparent border-b-teal drop-shadow-lg" />
            </div>

            {/* Center button */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
              <Button
                onClick={handleSpin}
                disabled={isSpinning || !canSpin || disabled}
                className="w-16 h-16 rounded-full bg-gradient-to-br from-teal to-teal-dark hover:scale-110 transition-transform duration-200 font-bold text-white shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSpinning ? (
                  <RotateCcw className="h-6 w-6 animate-spin" />
                ) : (
                  "SPIN"
                )}
              </Button>
            </div>

            {/* Result Overlay */}
            {showResult && lastResult && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                <div className="bg-white p-4 rounded-lg text-center shadow-lg">
                  <div className="text-lg font-bold text-teal mb-1">
                    🎉 You Won! 🎉
                  </div>
                  <div className="text-xl font-bold text-teal">
                    {lastResult.label}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Status Info */}
          <div className="text-center space-y-2">
            {canSpin ? (
              <div className="space-y-1">
                <p className="text-sm font-medium text-teal">
                  🎯 Daily Spin Available!
                </p>
                <p className="text-xs text-muted-foreground">
                  Win up to 1 SC • Next spin in 24 hours
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  ⏰ Daily Spin Used
                </p>
                <p className="text-xs text-muted-foreground">
                  Next spin available in {timeUntilNextSpin}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Prize Breakdown */}
        <div className="bg-card/30 p-3 rounded-lg">
          <h4 className="text-sm font-semibold mb-2 text-center">
            Prize Chances
          </h4>
          <div className="grid grid-cols-3 gap-2 text-xs">
            {dailySpinSegments.map((segment, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-teal font-medium">{segment.label}</span>
                <span className="text-muted-foreground">
                  {(segment.probability * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="text-xs text-center text-muted-foreground">
          <p>One free spin per 24 hours</p>
          <p>No purchase necessary • Must be 18+ to play</p>
        </div>
      </CardContent>
    </Card>
  );
}
