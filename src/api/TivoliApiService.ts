import { buyTicket, reportPayout, awardStamp } from "./transactionService";
import {
  submitScore,
  getLeaderboard,
  LeaderboardResponse,
} from "./leaderboardService";

class TivoliApiService {
  static isDevelopment =
    process.env.NODE_ENV === "development" ||
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  static isEmbeddedGame =
    window.location.hostname.includes("vercel.app") ||
    window.location.hostname.includes("yrgobanken.vip") ||
    window.location.hostname.includes("tivoli.yrgobanken.vip");

  /**
   * Hämtar token från localStorage
   */
  static getToken(): string | null {
    return localStorage.getItem("token");
  }

  /**
   * Validera token (grundläggande kontroll)
   */
  static isTokenValid(): boolean {
    const token = this.getToken();
    if (!token) return false;
    
    // Allow test token in development
    if (token === "test-token-for-development") {
      return this.isDevelopment;
    }
    
    // Basic JWT format check
    return token.split('.').length === 3;
  }

  /**
   * Rapportera att spelaren har snurrat (drar en "biljett")
   */
  static async reportSpin(): Promise<void> {
    const token = this.getToken();

    console.log("[TivoliApiService] reportSpin called", {
      hasToken: !!token,
      isDevelopment: this.isDevelopment,
      isEmbeddedGame: this.isEmbeddedGame,
    });

    if (!token) {
      if (this.isDevelopment) {
        console.warn(
          "[TivoliApiService] No token found – simulating spin transaction (development mode)"
        );
        return Promise.resolve();
      } else {
        throw new Error(
          "Authentication required. Please launch this game from Tivoli."
        );
      }
    }

    if (!this.isTokenValid()) {
      throw new Error("Invalid token format. Please re-authenticate through Tivoli.");
    }

    try {
      return await buyTicket(token);
    } catch (error) {
      console.error("[TivoliApiService] Spin transaction failed:", error);
      throw new Error(`Failed to process game start: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Rapportera att spelaren har vunnit (ger pengar)
   */
  static async reportWinnings(amount: number): Promise<void> {
    const token = this.getToken();

    console.log("[TivoliApiService] reportWinnings called", {
      amount,
      hasToken: !!token,
      isDevelopment: this.isDevelopment,
      isEmbeddedGame: this.isEmbeddedGame,
    });

    if (!token) {
      if (this.isDevelopment) {
        console.warn(
          "[TivoliApiService] No token found – simulating winnings transaction (development mode)"
        );
        return Promise.resolve();
      } else {
        throw new Error(
          "Authentication required. Please launch this game from Tivoli."
        );
      }
    }

    if (!this.isTokenValid()) {
      throw new Error("Invalid token format. Please re-authenticate through Tivoli.");
    }

    try {
      return await reportPayout(token, amount);
    } catch (error) {
      console.error("[TivoliApiService] Winnings transaction failed:", error);
      throw new Error(`Failed to process winnings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Rapportera att spelaren får en stämpel (om det behövs separat från vinst)
   */
  static async reportStamp(): Promise<void> {
    const token = this.getToken();

    console.log("[TivoliApiService] reportStamp called", {
      hasToken: !!token,
      isDevelopment: this.isDevelopment,
      isEmbeddedGame: this.isEmbeddedGame,
    });

    if (!token) {
      if (this.isDevelopment) {
        console.warn(
          "[TivoliApiService] No token found – simulating stamp transaction (development mode)"
        );
        return Promise.resolve();
      } else {
        throw new Error(
          "Authentication required. Please launch this game from Tivoli."
        );
      }
    }

    if (!this.isTokenValid()) {
      throw new Error("Invalid token format. Please re-authenticate through Tivoli.");
    }

    try {
      return await awardStamp(token);
    } catch (error) {
      console.error("[TivoliApiService] Stamp transaction failed:", error);
      throw new Error(`Failed to award stamp: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async submitScore(
    playerName: string,
    completionTime: number
  ): Promise<{ rank: number; total_players: number }> {
    const token = this.getToken();

    console.log("[TivoliApiService] submitScore called", {
      playerName,
      completionTime,
      hasToken: !!token,
      isDevelopment: this.isDevelopment,
      isEmbeddedGame: this.isEmbeddedGame,
    });

    if (token && this.isTokenValid()) {
      try {
        console.log("[TivoliApiService] Submitting score with real token");
        return await submitScore(token, playerName, completionTime);
      } catch (error) {
        console.error("Real API failed:", error);
        // Don't fall back to mock in production unless specifically configured
        if (!this.isDevelopment && !this.isEmbeddedGame) {
          throw error;
        }
      }
    }

    if (this.isDevelopment || this.isEmbeddedGame) {
      console.warn("[TivoliApiService] Using mock score submission");
      return {
        rank: Math.floor(Math.random() * 10) + 1,
        total_players: Math.floor(Math.random() * 50) + 10,
      };
    }

    throw new Error(
      "Authentication required. Please launch this game from Tivoli."
    );
  }

  static async getLeaderboard(
    limit: number = 50
  ): Promise<LeaderboardResponse> {
    const token = this.getToken();

    console.log("[TivoliApiService] getLeaderboard called", {
      limit,
      hasToken: !!token,
      isDevelopment: this.isDevelopment,
      isEmbeddedGame: this.isEmbeddedGame,
    });

    if (token && this.isTokenValid()) {
      try {
        console.log("[TivoliApiService] Fetching real leaderboard");
        return await getLeaderboard(token, limit);
      } catch (error) {
        console.error("Real leaderboard API failed:", error);
        // Don't fall back to mock in production unless specifically configured
        if (!this.isDevelopment && !this.isEmbeddedGame) {
          throw error;
        }
      }
    }

    if (this.isDevelopment || this.isEmbeddedGame) {
      console.warn("[TivoliApiService] Using mock leaderboard");

      const mockTimes = [65, 73, 89, 92, 105, 118, 134, 157, 161, 177];
      const mockLeaderboard = mockTimes
        .slice(0, Math.min(limit, 10))
        .map((time, i) => ({
          id: i + 1,
          player_name: `Player ${i + 1}`,
          completion_time: time,
          completed_at: new Date(
            Date.now() - Math.random() * 86400000 * 7
          ).toISOString(),
          rank: i + 1,
        }));

      return {
        leaderboard: mockLeaderboard,
        total_players: mockLeaderboard.length,
        player_rank: undefined,
      };
    }

    return {
      leaderboard: [],
      total_players: 0,
      player_rank: undefined,
    };
  }
}

export default TivoliApiService;