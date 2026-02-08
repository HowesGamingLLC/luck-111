import { createHash, randomBytes } from "crypto";
import { EventEmitter } from "events";

export interface GameResult {
  gameId: string;
  playerId: string;
  outcome: any;
  winAmount: number;
  currency: "GC" | "SC";
  timestamp: Date;
  provablyFairSeed: string;
  clientSeed: string;
  nonce: number;
}

export interface Player {
  id: string;
  name: string;
  balance: {
    goldCoins: number;
    sweepCoins: number;
  };
  level: number;
  isBot?: boolean;
}

export abstract class GameEngine extends EventEmitter {
  protected players: Map<string, Player> = new Map();
  protected gameId: string;
  protected minPlayers: number;
  protected maxPlayers: number;

  constructor(gameId: string, minPlayers = 1, maxPlayers = 10) {
    super();
    this.gameId = gameId;
    this.minPlayers = minPlayers;
    this.maxPlayers = maxPlayers;
  }

  // Provably Fair RNG
  protected generateProvablyFairNumber(
    serverSeed: string,
    clientSeed: string,
    nonce: number,
    range: number = 100,
  ): number {
    const hash = createHash("sha256")
      .update(`${serverSeed}:${clientSeed}:${nonce}`)
      .digest("hex");

    // Convert first 8 hex chars to number and normalize to range
    const hexSubstring = hash.substring(0, 8);
    const intValue = parseInt(hexSubstring, 16);
    return intValue % range;
  }

  protected generateServerSeed(): string {
    return randomBytes(32).toString("hex");
  }

  protected validateClientSeed(clientSeed: string): boolean {
    return (
      typeof clientSeed === "string" &&
      clientSeed.length >= 1 &&
      clientSeed.length <= 64
    );
  }

  // Player Management
  addPlayer(player: Player): boolean {
    if (this.players.size >= this.maxPlayers) {
      return false;
    }
    this.players.set(player.id, player);
    this.emit("playerJoined", player);
    return true;
  }

  removePlayer(playerId: string): boolean {
    const removed = this.players.delete(playerId);
    if (removed) {
      this.emit("playerLeft", playerId);
    }
    return removed;
  }

  getPlayer(playerId: string): Player | undefined {
    return this.players.get(playerId);
  }

  getPlayers(): Player[] {
    return Array.from(this.players.values());
  }

  canStart(): boolean {
    return this.players.size >= this.minPlayers;
  }

  // Abstract methods that each game must implement
  abstract startGame(): void;
  abstract endGame(): void;
  abstract processAction(playerId: string, action: any): any;
  abstract getGameState(playerId?: string): any;
  abstract validateAction(playerId: string, action: any): boolean;

  // Transaction handling
  protected async deductBalance(
    playerId: string,
    amount: number,
    currency: "GC" | "SC",
  ): Promise<boolean> {
    const player = this.players.get(playerId);
    if (!player) return false;

    const currentBalance =
      currency === "GC" ? player.balance.goldCoins : player.balance.sweepCoins;
    if (currentBalance < amount) return false;

    if (currency === "GC") {
      player.balance.goldCoins -= amount;
    } else {
      player.balance.sweepCoins -= amount;
    }

    // In production, this would also update the database
    this.emit("balanceChanged", playerId, player.balance);
    return true;
  }

  protected async addBalance(
    playerId: string,
    amount: number,
    currency: "GC" | "SC",
  ): Promise<void> {
    const player = this.players.get(playerId);
    if (!player) return;

    if (currency === "GC") {
      player.balance.goldCoins += amount;
    } else {
      player.balance.sweepCoins += amount;
    }

    // In production, this would also update the database
    this.emit("balanceChanged", playerId, player.balance);
  }

  // Utility methods
  protected shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  protected generateId(): string {
    return randomBytes(16).toString("hex");
  }

  // Game lifecycle
  protected gameState_: "waiting" | "starting" | "playing" | "ended" =
    "waiting";

  get gameState(): string {
    return this.gameState_;
  }

  protected setState(
    state: "waiting" | "starting" | "playing" | "ended",
  ): void {
    this.gameState_ = state;
    this.emit("stateChanged", state);
  }
}
