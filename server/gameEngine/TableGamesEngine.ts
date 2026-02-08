import { GameEngine, Player, GameResult } from "./GameEngine";

export interface TableGame {
  id: string;
  type: "blackjack" | "roulette" | "baccarat";
  name: string;
  minBet: { gc: number; sc: number };
  maxBet: { gc: number; sc: number };
  maxPlayers: number;
  houseEdge: number;
}

export interface Card {
  suit: "hearts" | "diamonds" | "clubs" | "spades";
  rank:
    | "A"
    | "2"
    | "3"
    | "4"
    | "5"
    | "6"
    | "7"
    | "8"
    | "9"
    | "T"
    | "J"
    | "Q"
    | "K";
  value: number;
}

export interface TablePlayer extends Player {
  currentBet: number;
  currency: "GC" | "SC";
  position: number;
  // Blackjack specific
  hand?: Card[];
  isDoubledDown?: boolean;
  isSplit?: boolean;
  splitHands?: Card[][];
  // Baccarat specific
  baccaratBet?: "player" | "banker" | "tie";
  // Roulette specific
  rouletteBets?: RouletteBet[];
}

export interface RouletteBet {
  type:
    | "straight"
    | "split"
    | "street"
    | "corner"
    | "line"
    | "dozen"
    | "column"
    | "red"
    | "black"
    | "odd"
    | "even"
    | "low"
    | "high";
  numbers: number[];
  amount: number;
  payout: number;
}

export interface RouletteResult {
  number: number;
  color: "red" | "black" | "green";
  isOdd: boolean;
  dozen: number; // 1, 2, or 3
  column: number; // 1, 2, or 3
}

export interface BaccaratHand {
  cards: Card[];
  value: number;
  isNatural: boolean;
}

export interface BaccaratResult {
  playerHand: BaccaratHand;
  bankerHand: BaccaratHand;
  winner: "player" | "banker" | "tie";
}

export class TableGamesEngine extends GameEngine {
  private tables: Map<string, TableGame> = new Map();
  private gameStates: Map<string, any> = new Map();

  constructor() {
    super("table-games", 1, 50);
    this.initializeTables();
  }

  private initializeTables(): void {
    const tables: TableGame[] = [
      {
        id: "blackjack-1",
        type: "blackjack",
        name: "Classic Blackjack",
        minBet: { gc: 5, sc: 0.05 },
        maxBet: { gc: 500, sc: 5.0 },
        maxPlayers: 6,
        houseEdge: 0.5,
      },
      {
        id: "roulette-1",
        type: "roulette",
        name: "European Roulette",
        minBet: { gc: 1, sc: 0.01 },
        maxBet: { gc: 100, sc: 1.0 },
        maxPlayers: 12,
        houseEdge: 2.7,
      },
      {
        id: "baccarat-1",
        type: "baccarat",
        name: "Punto Banco",
        minBet: { gc: 10, sc: 0.1 },
        maxBet: { gc: 1000, sc: 10.0 },
        maxPlayers: 8,
        houseEdge: 1.06,
      },
    ];

    tables.forEach((table) => this.tables.set(table.id, table));
  }

  // Blackjack Implementation
  private createDeck(): Card[] {
    const suits: Card["suit"][] = ["hearts", "diamonds", "clubs", "spades"];
    const ranks: Card["rank"][] = [
      "A",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "T",
      "J",
      "Q",
      "K",
    ];
    const deck: Card[] = [];

    for (const suit of suits) {
      for (let i = 0; i < ranks.length; i++) {
        const rank = ranks[i];
        const value =
          rank === "A"
            ? 11
            : ["J", "Q", "K"].includes(rank)
              ? 10
              : rank === "T"
                ? 10
                : parseInt(rank);
        deck.push({ suit, rank, value });
      }
    }

    return this.shuffleArray(deck);
  }

  private calculateBlackjackScore(hand: Card[]): number {
    let score = 0;
    let aces = 0;

    for (const card of hand) {
      if (card.rank === "A") {
        aces++;
        score += 11;
      } else {
        score += card.value;
      }
    }

    // Adjust for aces
    while (score > 21 && aces > 0) {
      score -= 10;
      aces--;
    }

    return score;
  }

  private canAffordWager(
    playerId: string,
    amount: number,
    currency: "GC" | "SC",
  ): boolean {
    const player = this.getPlayer(playerId) as TablePlayer | undefined;
    if (!player) return false;

    if (currency === "GC") {
      return player.balance.goldCoins >= amount;
    } else {
      return player.balance.sweepCoins >= amount;
    }
  }

  public playBlackjack(
    playerId: string,
    tableId: string,
    action: string,
    bet?: number,
  ): any {
    const table = this.tables.get(tableId);
    if (!table || table.type !== "blackjack") {
      return { success: false, error: "Invalid blackjack table" };
    }

    let gameState = this.gameStates.get(tableId) || {
      deck: this.createDeck(),
      dealerHand: [],
      playerHands: new Map(),
      bets: new Map(),
      stage: "betting",
    };

    const player = this.getPlayer(playerId) as TablePlayer;
    if (!player) {
      return { success: false, error: "Player not found" };
    }

    switch (action) {
      case "bet":
        if (!bet || bet < table.minBet.gc || bet > table.maxBet.gc) {
          return { success: false, error: "Invalid bet amount" };
        }

        player.currentBet = bet;
        gameState.bets.set(playerId, bet);

        // Deal initial cards
        const playerHand = [gameState.deck.pop()!, gameState.deck.pop()!];
        const dealerHand = [gameState.deck.pop()!, gameState.deck.pop()!];

        gameState.playerHands.set(playerId, playerHand);
        gameState.dealerHand = dealerHand;
        gameState.stage = "playing";

        return {
          success: true,
          playerHand,
          dealerCard: dealerHand[0], // Only show one dealer card
          playerScore: this.calculateBlackjackScore(playerHand),
        };

      case "hit":
        const hand = gameState.playerHands.get(playerId);
        if (!hand) return { success: false, error: "No active hand" };

        hand.push(gameState.deck.pop()!);
        const score = this.calculateBlackjackScore(hand);

        if (score > 21) {
          return { success: true, hand, score, result: "bust" };
        }

        return { success: true, hand, score };

      case "stand":
        return this.resolveBlackjackHand(playerId, gameState);

      case "double":
        if (!this.canAffordWager(playerId, player.currentBet, "GC")) {
          return { success: false, error: "Insufficient funds to double" };
        }

        const doubleHand = gameState.playerHands.get(playerId);
        if (!doubleHand) return { success: false, error: "No active hand" };

        player.currentBet *= 2;
        doubleHand.push(gameState.deck.pop()!);

        return this.resolveBlackjackHand(playerId, gameState);

      default:
        return { success: false, error: "Invalid action" };
    }
  }

  private resolveBlackjackHand(playerId: string, gameState: any): any {
    const playerHand = gameState.playerHands.get(playerId);
    const dealerHand = gameState.dealerHand;

    // Dealer hits to 17
    while (this.calculateBlackjackScore(dealerHand) < 17) {
      dealerHand.push(gameState.deck.pop()!);
    }

    const playerScore = this.calculateBlackjackScore(playerHand);
    const dealerScore = this.calculateBlackjackScore(dealerHand);

    let result = "";
    let payout = 0;
    const bet = gameState.bets.get(playerId);

    if (playerScore > 21) {
      result = "bust";
      payout = 0;
    } else if (dealerScore > 21) {
      result = "win";
      payout = bet * 2;
    } else if (playerScore > dealerScore) {
      result = "win";
      payout = bet * 2;
    } else if (playerScore < dealerScore) {
      result = "lose";
      payout = 0;
    } else {
      result = "push";
      payout = bet; // Return bet
    }

    // Award payout
    if (payout > 0) {
      this.addBalance(playerId, payout, "GC");
    }

    return {
      success: true,
      result,
      playerScore,
      dealerScore,
      dealerHand,
      payout,
    };
  }

  // Roulette Implementation
  public playRoulette(
    playerId: string,
    tableId: string,
    bets: RouletteBet[],
  ): any {
    const table = this.tables.get(tableId);
    if (!table || table.type !== "roulette") {
      return { success: false, error: "Invalid roulette table" };
    }

    // Generate random result (0-36 for European roulette)
    const randomNumber = Math.floor(Math.random() * 37);
    const result = this.generateRouletteResult(randomNumber);

    let totalPayout = 0;
    const betResults: any[] = [];

    for (const bet of bets) {
      const isWin = this.checkRouletteBet(bet, result);
      const payout = isWin ? bet.amount * bet.payout : 0;

      totalPayout += payout;
      betResults.push({
        type: bet.type,
        amount: bet.amount,
        isWin,
        payout,
      });
    }

    // Award total payout
    if (totalPayout > 0) {
      this.addBalance(playerId, totalPayout, "GC");
    }

    return {
      success: true,
      result,
      betResults,
      totalPayout,
    };
  }

  private generateRouletteResult(number: number): RouletteResult {
    const redNumbers = [
      1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
    ];

    return {
      number,
      color:
        number === 0 ? "green" : redNumbers.includes(number) ? "red" : "black",
      isOdd: number % 2 === 1,
      dozen: number === 0 ? 0 : Math.ceil(number / 12),
      column: number === 0 ? 0 : ((number - 1) % 3) + 1,
    };
  }

  private checkRouletteBet(bet: RouletteBet, result: RouletteResult): boolean {
    switch (bet.type) {
      case "straight":
        return bet.numbers.includes(result.number);
      case "red":
        return result.color === "red";
      case "black":
        return result.color === "black";
      case "odd":
        return result.isOdd && result.number !== 0;
      case "even":
        return !result.isOdd && result.number !== 0;
      case "low":
        return result.number >= 1 && result.number <= 18;
      case "high":
        return result.number >= 19 && result.number <= 36;
      case "dozen":
        return bet.numbers[0] === result.dozen;
      case "column":
        return bet.numbers[0] === result.column;
      default:
        return false;
    }
  }

  // Baccarat Implementation
  public playBaccarat(
    playerId: string,
    tableId: string,
    betType: "player" | "banker" | "tie",
    amount: number,
  ): any {
    const table = this.tables.get(tableId);
    if (!table || table.type !== "baccarat") {
      return { success: false, error: "Invalid baccarat table" };
    }

    const deck = this.createDeck();

    // Deal cards
    const playerCards = [deck.pop()!, deck.pop()!];
    const bankerCards = [deck.pop()!, deck.pop()!];

    // Calculate initial values
    let playerValue = this.calculateBaccaratValue(playerCards);
    let bankerValue = this.calculateBaccaratValue(bankerCards);

    // Third card rules
    const playerNatural = playerValue >= 8;
    const bankerNatural = bankerValue >= 8;

    if (!playerNatural && !bankerNatural) {
      // Player third card rule
      if (playerValue <= 5) {
        const thirdCard = deck.pop()!;
        playerCards.push(thirdCard);
        playerValue = this.calculateBaccaratValue(playerCards);

        // Banker third card rule (complex logic)
        const shouldBankerDraw = this.shouldBankerDrawThird(
          bankerValue,
          thirdCard.value,
        );
        if (shouldBankerDraw) {
          bankerCards.push(deck.pop()!);
          bankerValue = this.calculateBaccaratValue(bankerCards);
        }
      } else if (bankerValue <= 5) {
        // Banker draws if player stands and banker has 5 or less
        bankerCards.push(deck.pop()!);
        bankerValue = this.calculateBaccaratValue(bankerCards);
      }
    }

    // Determine winner
    let winner: "player" | "banker" | "tie";
    if (playerValue > bankerValue) {
      winner = "player";
    } else if (bankerValue > playerValue) {
      winner = "banker";
    } else {
      winner = "tie";
    }

    // Calculate payout
    let payout = 0;
    if (betType === winner) {
      switch (betType) {
        case "player":
          payout = amount * 2; // 1:1
          break;
        case "banker":
          payout = amount * 1.95; // 1:1 minus 5% commission
          break;
        case "tie":
          payout = amount * 9; // 8:1
          break;
      }
    }

    // Award payout
    if (payout > 0) {
      this.addBalance(playerId, payout, "GC");
    }

    const result: BaccaratResult = {
      playerHand: {
        cards: playerCards,
        value: playerValue,
        isNatural: playerNatural,
      },
      bankerHand: {
        cards: bankerCards,
        value: bankerValue,
        isNatural: bankerNatural,
      },
      winner,
    };

    return {
      success: true,
      result,
      payout,
      betType,
      amount,
    };
  }

  private calculateBaccaratValue(cards: Card[]): number {
    const total = cards.reduce((sum, card) => {
      const value =
        card.rank === "A"
          ? 1
          : ["J", "Q", "K"].includes(card.rank)
            ? 0
            : card.rank === "T"
              ? 0
              : parseInt(card.rank);
      return sum + value;
    }, 0);

    return total % 10;
  }

  private shouldBankerDrawThird(
    bankerValue: number,
    playerThirdCard: number,
  ): boolean {
    if (bankerValue >= 7) return false;
    if (bankerValue <= 2) return true;

    // Complex third card rules for banker
    const rules: { [key: number]: number[] } = {
      3: [0, 1, 2, 3, 4, 5, 6, 7, 9], // Draw unless player's third card is 8
      4: [2, 3, 4, 5, 6, 7],
      5: [4, 5, 6, 7],
      6: [6, 7],
    };

    return rules[bankerValue]?.includes(playerThirdCard) || false;
  }

  // Required GameEngine methods
  startGame(): void {
    this.setState("playing");
  }

  endGame(): void {
    this.setState("ended");
  }

  processAction(playerId: string, action: any): any {
    switch (action.gameType) {
      case "blackjack":
        return this.playBlackjack(
          playerId,
          action.tableId,
          action.action,
          action.bet,
        );
      case "roulette":
        return this.playRoulette(playerId, action.tableId, action.bets);
      case "baccarat":
        return this.playBaccarat(
          playerId,
          action.tableId,
          action.betType,
          action.amount,
        );
      default:
        return { success: false, error: "Unknown game type" };
    }
  }

  validateAction(playerId: string, action: any): boolean {
    const validGameTypes = ["blackjack", "roulette", "baccarat"];
    return validGameTypes.includes(action.gameType);
  }

  getGameState(playerId?: string): any {
    return {
      tables: Array.from(this.tables.values()),
      gameStates: playerId ? this.gameStates.get(playerId) : undefined,
    };
  }

  // Public API
  public getTables(): TableGame[] {
    return Array.from(this.tables.values());
  }

  public getTable(tableId: string): TableGame | undefined {
    return this.tables.get(tableId);
  }

  public joinTable(
    playerId: string,
    tableId: string,
  ): { success: boolean; error?: string } {
    const table = this.tables.get(tableId);
    if (!table) {
      return { success: false, error: "Table not found" };
    }

    const player = this.getPlayer(playerId);
    if (!player) {
      return { success: false, error: "Player not found" };
    }

    return { success: true };
  }
}
