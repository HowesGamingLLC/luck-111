import { EventEmitter } from "events";
import { Player } from "./GameEngine";

export interface Tournament {
  id: string;
  name: string;
  gameType: "poker" | "bingo" | "slots" | "mixed";
  type: "sit-n-go" | "scheduled" | "freeroll" | "satellite";
  status: "registering" | "starting" | "playing" | "finished" | "cancelled";
  buyIn: { gc: number; sc: number };
  prizePool: { gc: number; sc: number };
  structure: TournamentStructure;
  schedule: TournamentSchedule;
  participants: TournamentPlayer[];
  maxPlayers: number;
  currentLevel: number;
  blindSchedule?: BlindLevel[];
  payoutStructure: PayoutLevel[];
  startTime?: Date;
  endTime?: Date;
  createdAt: Date;
}

export interface TournamentStructure {
  startingChips?: number; // For poker
  startingCards?: number; // For bingo
  startingCredits?: number; // For slots
  levelDuration: number; // minutes
  breakDuration: number; // minutes
  breakFrequency: number; // levels between breaks
  lateRegistrationLevels: number;
}

export interface TournamentSchedule {
  registrationStart: Date;
  registrationEnd: Date;
  tournamentStart: Date;
  isRecurring: boolean;
  recurringPattern?: "daily" | "weekly" | "monthly";
  recurringTime?: string; // HH:MM format
}

export interface TournamentPlayer extends Player {
  registrationTime: Date;
  currentChips: number;
  position?: number; // Final finishing position
  eliminated?: boolean;
  eliminationTime?: Date;
  rebuyCount: number;
  addonCount: number;
}

export interface BlindLevel {
  level: number;
  smallBlind: number;
  bigBlind: number;
  ante?: number;
  duration: number; // minutes
}

export interface PayoutLevel {
  position: number;
  percentage: number; // Percentage of prize pool
  amount?: number; // Calculated amount
}

export interface TournamentResult {
  tournamentId: string;
  finalStandings: TournamentPlayer[];
  payouts: { playerId: string; amount: number; currency: "GC" | "SC" }[];
  duration: number; // minutes
  totalPlayers: number;
}

export interface BingoTournamentConfig {
  roundsPerMatch: number;
  cardsPerPlayer: number;
  patternProgression: string[]; // Patterns get harder each round
}

export interface SlotsTournamentConfig {
  totalSpins: number;
  allowedThemes: string[];
  scoringMethod: "total_win" | "biggest_win" | "win_frequency";
}

export interface MixedTournamentConfig {
  gameSequence: string[]; // Order of games to play
  pointsPerGame: number;
}

export class TournamentEngine extends EventEmitter {
  private tournaments: Map<string, Tournament> = new Map();
  private activeTournaments: Set<string> = new Set();
  private scheduledTournaments: NodeJS.Timeout[] = [];

  constructor() {
    super();
    this.initializeRecurringTournaments();
    this.startTournamentMonitoring();
  }

  private initializeRecurringTournaments(): void {
    // Daily freeroll tournaments
    this.createRecurringTournament({
      name: "Daily Freeroll Poker",
      gameType: "poker",
      type: "freeroll",
      buyIn: { gc: 0, sc: 0 },
      basePrizePool: { gc: 10000, sc: 100 },
      maxPlayers: 200,
      recurringPattern: "daily",
      startTime: "20:00", // 8 PM
    });

    this.createRecurringTournament({
      name: "Daily Bingo Bonanza",
      gameType: "bingo",
      type: "freeroll",
      buyIn: { gc: 0, sc: 0 },
      basePrizePool: { gc: 5000, sc: 50 },
      maxPlayers: 100,
      recurringPattern: "daily",
      startTime: "19:00", // 7 PM
    });

    // Weekly big tournaments
    this.createRecurringTournament({
      name: "Sunday Million",
      gameType: "poker",
      type: "scheduled",
      buyIn: { gc: 1000, sc: 10 },
      basePrizePool: { gc: 1000000, sc: 10000 },
      maxPlayers: 500,
      recurringPattern: "weekly",
      startTime: "21:00", // 9 PM Sunday
    });
  }

  private createRecurringTournament(config: {
    name: string;
    gameType: Tournament["gameType"];
    type: Tournament["type"];
    buyIn: { gc: number; sc: number };
    basePrizePool: { gc: number; sc: number };
    maxPlayers: number;
    recurringPattern: "daily" | "weekly" | "monthly";
    startTime: string;
  }): void {
    const now = new Date();
    let nextStart = new Date(now);

    // Calculate next occurrence
    const [hours, minutes] = config.startTime.split(":").map(Number);
    nextStart.setHours(hours, minutes, 0, 0);

    // If time has passed today, schedule for tomorrow/next week/next month
    if (nextStart <= now) {
      switch (config.recurringPattern) {
        case "daily":
          nextStart.setDate(nextStart.getDate() + 1);
          break;
        case "weekly":
          nextStart.setDate(nextStart.getDate() + 7);
          break;
        case "monthly":
          nextStart.setMonth(nextStart.getMonth() + 1);
          break;
      }
    }

    this.scheduleTournament({
      ...config,
      tournamentStart: nextStart,
      registrationStart: new Date(nextStart.getTime() - 60 * 60 * 1000), // 1 hour before
      registrationEnd: nextStart,
    });
  }

  public scheduleTournament(config: {
    name: string;
    gameType: Tournament["gameType"];
    type: Tournament["type"];
    buyIn: { gc: number; sc: number };
    basePrizePool: { gc: number; sc: number };
    maxPlayers: number;
    tournamentStart: Date;
    registrationStart: Date;
    registrationEnd: Date;
    recurringPattern?: "daily" | "weekly" | "monthly";
  }): string {
    const tournament: Tournament = {
      id: this.generateId(),
      name: config.name,
      gameType: config.gameType,
      type: config.type,
      status: "registering",
      buyIn: config.buyIn,
      prizePool: { ...config.basePrizePool },
      structure: this.getDefaultStructure(config.gameType),
      schedule: {
        registrationStart: config.registrationStart,
        registrationEnd: config.registrationEnd,
        tournamentStart: config.tournamentStart,
        isRecurring: !!config.recurringPattern,
        recurringPattern: config.recurringPattern,
        recurringTime: config.recurringPattern
          ? this.formatTime(config.tournamentStart)
          : undefined,
      },
      participants: [],
      maxPlayers: config.maxPlayers,
      currentLevel: 0,
      blindSchedule:
        config.gameType === "poker" ? this.generateBlindSchedule() : undefined,
      payoutStructure: this.generatePayoutStructure(config.maxPlayers),
      createdAt: new Date(),
    };

    this.tournaments.set(tournament.id, tournament);

    // Schedule automatic start
    const timeout = setTimeout(() => {
      this.startTournament(tournament.id);
    }, config.tournamentStart.getTime() - Date.now());

    this.scheduledTournaments.push(timeout);
    this.emit("tournamentScheduled", tournament);

    return tournament.id;
  }

  private getDefaultStructure(
    gameType: Tournament["gameType"],
  ): TournamentStructure {
    switch (gameType) {
      case "poker":
        return {
          startingChips: 10000,
          levelDuration: 15,
          breakDuration: 5,
          breakFrequency: 6,
          lateRegistrationLevels: 3,
        };
      case "bingo":
        return {
          startingCards: 4,
          levelDuration: 10,
          breakDuration: 2,
          breakFrequency: 5,
          lateRegistrationLevels: 1,
        };
      case "slots":
        return {
          startingCredits: 1000,
          levelDuration: 20,
          breakDuration: 3,
          breakFrequency: 0, // No breaks for slots tournaments
          lateRegistrationLevels: 0,
        };
      default:
        return {
          levelDuration: 15,
          breakDuration: 5,
          breakFrequency: 6,
          lateRegistrationLevels: 2,
        };
    }
  }

  private generateBlindSchedule(): BlindLevel[] {
    const levels: BlindLevel[] = [];
    let smallBlind = 25;
    let bigBlind = 50;

    for (let level = 1; level <= 20; level++) {
      levels.push({
        level,
        smallBlind,
        bigBlind,
        ante: level > 5 ? Math.floor(smallBlind * 0.1) : undefined,
        duration: 15,
      });

      // Increase blinds
      if (level % 2 === 0) {
        smallBlind = Math.floor(smallBlind * 1.5);
        bigBlind = Math.floor(bigBlind * 1.5);
      }
    }

    return levels;
  }

  private generatePayoutStructure(maxPlayers: number): PayoutLevel[] {
    const payouts: PayoutLevel[] = [];
    const payoutPositions = Math.max(1, Math.floor(maxPlayers * 0.15)); // Top 15% get paid

    // Standard tournament payout percentages
    const percentages = [
      40,
      25,
      15,
      10,
      6,
      4, // Top 6
      3,
      2,
      2,
      1.5,
      1.5,
      1.5,
      1.5,
      1,
      1,
      1, // 7th-16th
    ];

    for (
      let position = 1;
      position <= Math.min(payoutPositions, percentages.length);
      position++
    ) {
      payouts.push({
        position,
        percentage: percentages[position - 1],
      });
    }

    return payouts;
  }

  private startTournamentMonitoring(): void {
    // Check tournament statuses every minute
    setInterval(() => {
      this.checkTournamentStatuses();
    }, 60000);

    // Update tournament levels every 30 seconds
    setInterval(() => {
      this.updateTournamentLevels();
    }, 30000);
  }

  private checkTournamentStatuses(): void {
    const now = new Date();

    for (const [tournamentId, tournament] of this.tournaments) {
      // Start registration
      if (
        tournament.status === "registering" &&
        tournament.schedule.registrationStart <= now &&
        tournament.schedule.registrationEnd > now
      ) {
        this.emit("registrationOpen", tournament);
      }

      // Close registration
      if (
        tournament.status === "registering" &&
        tournament.schedule.registrationEnd <= now
      ) {
        this.startTournament(tournamentId);
      }

      // Handle Sit & Go tournaments
      if (
        tournament.type === "sit-n-go" &&
        tournament.status === "registering" &&
        tournament.participants.length >= tournament.maxPlayers
      ) {
        this.startTournament(tournamentId);
      }
    }
  }

  private updateTournamentLevels(): void {
    for (const tournamentId of this.activeTournaments) {
      const tournament = this.tournaments.get(tournamentId);
      if (!tournament || tournament.status !== "playing") continue;

      const levelDuration = tournament.structure.levelDuration * 60 * 1000; // Convert to ms
      const timeSinceStart =
        Date.now() - (tournament.startTime?.getTime() || 0);
      const expectedLevel = Math.floor(timeSinceStart / levelDuration);

      if (expectedLevel > tournament.currentLevel) {
        this.advanceTournamentLevel(tournamentId);
      }
    }
  }

  private advanceTournamentLevel(tournamentId: string): void {
    const tournament = this.tournaments.get(tournamentId);
    if (!tournament) return;

    tournament.currentLevel++;

    // Check for breaks
    if (
      tournament.structure.breakFrequency > 0 &&
      tournament.currentLevel % tournament.structure.breakFrequency === 0
    ) {
      this.emit("tournamentBreak", {
        tournamentId,
        level: tournament.currentLevel,
      });
    }

    this.emit("levelAdvanced", {
      tournamentId,
      level: tournament.currentLevel,
      blindLevel: tournament.blindSchedule?.[tournament.currentLevel - 1],
    });
  }

  private formatTime(date: Date): string {
    return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
  }

  private generateId(): string {
    return `tournament-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public API Methods
  public createTournament(config: {
    name: string;
    gameType: Tournament["gameType"];
    type: Tournament["type"];
    buyIn: { gc: number; sc: number };
    prizePool: { gc: number; sc: number };
    maxPlayers: number;
    startTime: Date;
    structure?: Partial<TournamentStructure>;
  }): string {
    const tournament: Tournament = {
      id: this.generateId(),
      name: config.name,
      gameType: config.gameType,
      type: config.type,
      status: "registering",
      buyIn: config.buyIn,
      prizePool: config.prizePool,
      structure: {
        ...this.getDefaultStructure(config.gameType),
        ...config.structure,
      },
      schedule: {
        registrationStart: new Date(),
        registrationEnd: config.startTime,
        tournamentStart: config.startTime,
        isRecurring: false,
      },
      participants: [],
      maxPlayers: config.maxPlayers,
      currentLevel: 0,
      blindSchedule:
        config.gameType === "poker" ? this.generateBlindSchedule() : undefined,
      payoutStructure: this.generatePayoutStructure(config.maxPlayers),
      createdAt: new Date(),
    };

    this.tournaments.set(tournament.id, tournament);
    return tournament.id;
  }

  public registerPlayer(
    tournamentId: string,
    player: Player,
  ): { success: boolean; error?: string } {
    const tournament = this.tournaments.get(tournamentId);
    if (!tournament) {
      return { success: false, error: "Tournament not found" };
    }

    if (tournament.status !== "registering") {
      return { success: false, error: "Registration is closed" };
    }

    if (tournament.participants.length >= tournament.maxPlayers) {
      return { success: false, error: "Tournament is full" };
    }

    // Check if player is already registered
    if (tournament.participants.some((p) => p.id === player.id)) {
      return { success: false, error: "Player already registered" };
    }

    // Check if player can afford buy-in
    const canAffordGC = player.balance.goldCoins >= tournament.buyIn.gc;
    const canAffordSC = player.balance.sweepCoins >= tournament.buyIn.sc;

    if (!canAffordGC || !canAffordSC) {
      return { success: false, error: "Insufficient balance for buy-in" };
    }

    // Register player
    const tournamentPlayer: TournamentPlayer = {
      ...player,
      registrationTime: new Date(),
      currentChips: tournament.structure.startingChips || 0,
      rebuyCount: 0,
      addonCount: 0,
    };

    tournament.participants.push(tournamentPlayer);

    // Add to prize pool
    tournament.prizePool.gc += tournament.buyIn.gc;
    tournament.prizePool.sc += tournament.buyIn.sc;

    this.emit("playerRegistered", { tournamentId, player: tournamentPlayer });

    return { success: true };
  }

  public unregisterPlayer(
    tournamentId: string,
    playerId: string,
  ): { success: boolean; error?: string } {
    const tournament = this.tournaments.get(tournamentId);
    if (!tournament) {
      return { success: false, error: "Tournament not found" };
    }

    if (tournament.status !== "registering") {
      return {
        success: false,
        error: "Cannot unregister after registration closes",
      };
    }

    const playerIndex = tournament.participants.findIndex(
      (p) => p.id === playerId,
    );
    if (playerIndex === -1) {
      return { success: false, error: "Player not registered" };
    }

    const player = tournament.participants[playerIndex];
    tournament.participants.splice(playerIndex, 1);

    // Refund buy-in from prize pool
    tournament.prizePool.gc -= tournament.buyIn.gc;
    tournament.prizePool.sc -= tournament.buyIn.sc;

    this.emit("playerUnregistered", { tournamentId, playerId });

    return { success: true };
  }

  public startTournament(tournamentId: string): {
    success: boolean;
    error?: string;
  } {
    const tournament = this.tournaments.get(tournamentId);
    if (!tournament) {
      return { success: false, error: "Tournament not found" };
    }

    if (tournament.participants.length === 0) {
      tournament.status = "cancelled";
      this.emit("tournamentCancelled", tournament);
      return { success: false, error: "No participants" };
    }

    tournament.status = "starting";
    tournament.startTime = new Date();

    // Calculate final payouts
    this.calculatePayouts(tournament);

    setTimeout(() => {
      tournament.status = "playing";
      this.activeTournaments.add(tournamentId);
      this.emit("tournamentStarted", tournament);
    }, 10000); // 10 second delay for "starting" phase

    return { success: true };
  }

  private calculatePayouts(tournament: Tournament): void {
    const totalPrize = tournament.prizePool.gc + tournament.prizePool.sc;

    tournament.payoutStructure.forEach((payout) => {
      payout.amount = Math.floor(totalPrize * (payout.percentage / 100));
    });
  }

  public eliminatePlayer(
    tournamentId: string,
    playerId: string,
  ): { success: boolean; error?: string } {
    const tournament = this.tournaments.get(tournamentId);
    if (!tournament) {
      return { success: false, error: "Tournament not found" };
    }

    const player = tournament.participants.find((p) => p.id === playerId);
    if (!player) {
      return { success: false, error: "Player not found in tournament" };
    }

    player.eliminated = true;
    player.eliminationTime = new Date();
    player.position = tournament.participants.filter(
      (p) => p.eliminated,
    ).length;

    this.emit("playerEliminated", {
      tournamentId,
      playerId,
      position: player.position,
    });

    // Check if tournament should end
    const activePlayers = tournament.participants.filter((p) => !p.eliminated);
    if (activePlayers.length <= 1) {
      this.finishTournament(tournamentId);
    }

    return { success: true };
  }

  public finishTournament(tournamentId: string): TournamentResult | null {
    const tournament = this.tournaments.get(tournamentId);
    if (!tournament) return null;

    tournament.status = "finished";
    tournament.endTime = new Date();
    this.activeTournaments.delete(tournamentId);

    // Assign final positions
    const activePlayers = tournament.participants.filter((p) => !p.eliminated);
    activePlayers.forEach((player, index) => {
      player.position = index + 1;
    });

    // Sort by final position
    const finalStandings = tournament.participants.sort(
      (a, b) => (a.position || 999) - (b.position || 999),
    );

    // Distribute prizes
    const payouts = this.distributePrizes(tournament, finalStandings);

    const result: TournamentResult = {
      tournamentId,
      finalStandings,
      payouts,
      duration:
        tournament.endTime && tournament.startTime
          ? Math.floor(
              (tournament.endTime.getTime() - tournament.startTime.getTime()) /
                60000,
            )
          : 0,
      totalPlayers: tournament.participants.length,
    };

    this.emit("tournamentFinished", result);

    // Schedule next occurrence if recurring
    if (tournament.schedule.isRecurring) {
      this.scheduleNextRecurrence(tournament);
    }

    return result;
  }

  private distributePrizes(
    tournament: Tournament,
    finalStandings: TournamentPlayer[],
  ): { playerId: string; amount: number; currency: "GC" | "SC" }[] {
    const payouts: {
      playerId: string;
      amount: number;
      currency: "GC" | "SC";
    }[] = [];

    tournament.payoutStructure.forEach((payout) => {
      if (payout.position <= finalStandings.length && payout.amount) {
        const player = finalStandings[payout.position - 1];

        // Distribute based on buy-in currency ratio
        const gcRatio =
          tournament.buyIn.gc /
          (tournament.buyIn.gc + tournament.buyIn.sc || 1);
        const scRatio =
          tournament.buyIn.sc /
          (tournament.buyIn.gc + tournament.buyIn.sc || 1);

        if (gcRatio > 0) {
          payouts.push({
            playerId: player.id,
            amount: Math.floor(payout.amount * gcRatio),
            currency: "GC",
          });
        }

        if (scRatio > 0) {
          payouts.push({
            playerId: player.id,
            amount: Math.floor(payout.amount * scRatio),
            currency: "SC",
          });
        }
      }
    });

    return payouts;
  }

  private scheduleNextRecurrence(tournament: Tournament): void {
    if (
      !tournament.schedule.isRecurring ||
      !tournament.schedule.recurringPattern
    )
      return;

    const nextStart = new Date(tournament.schedule.tournamentStart);

    switch (tournament.schedule.recurringPattern) {
      case "daily":
        nextStart.setDate(nextStart.getDate() + 1);
        break;
      case "weekly":
        nextStart.setDate(nextStart.getDate() + 7);
        break;
      case "monthly":
        nextStart.setMonth(nextStart.getMonth() + 1);
        break;
    }

    this.scheduleTournament({
      name: tournament.name,
      gameType: tournament.gameType,
      type: tournament.type,
      buyIn: tournament.buyIn,
      basePrizePool: { gc: 0, sc: 0 }, // Reset base prize pool
      maxPlayers: tournament.maxPlayers,
      tournamentStart: nextStart,
      registrationStart: new Date(nextStart.getTime() - 60 * 60 * 1000),
      registrationEnd: nextStart,
      recurringPattern: tournament.schedule.recurringPattern,
    });
  }

  public getTournaments(
    gameType?: Tournament["gameType"],
    status?: Tournament["status"],
  ): Tournament[] {
    let tournaments = Array.from(this.tournaments.values());

    if (gameType) {
      tournaments = tournaments.filter((t) => t.gameType === gameType);
    }

    if (status) {
      tournaments = tournaments.filter((t) => t.status === status);
    }

    return tournaments.sort(
      (a, b) =>
        a.schedule.tournamentStart.getTime() -
        b.schedule.tournamentStart.getTime(),
    );
  }

  public getTournament(tournamentId: string): Tournament | undefined {
    return this.tournaments.get(tournamentId);
  }

  public getPlayerTournaments(playerId: string): Tournament[] {
    return Array.from(this.tournaments.values()).filter((t) =>
      t.participants.some((p) => p.id === playerId),
    );
  }

  public updatePlayerChips(
    tournamentId: string,
    playerId: string,
    chips: number,
  ): void {
    const tournament = this.tournaments.get(tournamentId);
    if (!tournament) return;

    const player = tournament.participants.find((p) => p.id === playerId);
    if (player) {
      player.currentChips = chips;

      if (chips <= 0) {
        this.eliminatePlayer(tournamentId, playerId);
      }
    }
  }

  public getLeaderboard(tournamentId: string): TournamentPlayer[] {
    const tournament = this.tournaments.get(tournamentId);
    if (!tournament) return [];

    return tournament.participants
      .sort((a, b) => (b.currentChips || 0) - (a.currentChips || 0))
      .map((player, index) => ({ ...player, position: index + 1 }));
  }

  public cancelTournament(tournamentId: string): {
    success: boolean;
    error?: string;
  } {
    const tournament = this.tournaments.get(tournamentId);
    if (!tournament) {
      return { success: false, error: "Tournament not found" };
    }

    if (
      tournament.status === "playing" ||
      tournament.status === "finished" ||
      tournament.status === "cancelled"
    ) {
      return {
        success: false,
        error: "Cannot cancel a tournament that is playing or already finished",
      };
    }

    tournament.status = "cancelled";
    this.emit("tournamentCancelled", tournament);

    return { success: true };
  }
}
