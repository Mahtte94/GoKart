// src/api/TivoliApiService.ts
import { buyTicket, reportPayout, awardStamp } from "./transactionService";
import {
  submitScore,
  getLeaderboard,
  LeaderboardResponse,
} from "./leaderboardService";

class TivoliApiService {
  // Expanded development mode detection
  static isDevelopment =
    process.env.NODE_ENV === "development" ||
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname.includes("yrgobanken.vip") || // Add your domain
    window.location.hostname.includes("tivoli.yrgobanken.vip"); // Add subdomain

  /**
   * Hämtar token från localStorage
   */
  static getToken(): string | null {
    return localStorage.getItem("token");
  }

  /**
   * Rapportera att spelaren har snurrat (drar en "biljett")
   */
  static async reportSpin(): Promise<void> {
    const token = this.getToken();

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

    console.log("[TivoliApiService] Reporting spin with real token");
    return buyTicket(token);
  }

  /**
   * Rapportera att spelaren har vunnit (ger pengar)
   */
  static async reportWinnings(amount: number): Promise<void> {
    const token = this.getToken();

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

    console.log("[TivoliApiService] Reporting winnings with amount:", amount);
    return reportPayout(token, amount);
  }

  /**
   * Rapportera att spelaren får en stämpel (om det behövs separat från vinst)
   */
  static async reportStamp(): Promise<void> {
    const token = this.getToken();

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

    console.log("[TivoliApiService] Awarding stamp with real token");
    return awardStamp(token);
  }

  /**
   * Skicka in spelresultat till leaderboard
   */
  static async submitScore(
    playerName: string,
    completionTime: number
  ): Promise<{ rank: number; total_players: number }> {
    const token = this.getToken();

    if (!token) {
      if (this.isDevelopment) {
        console.warn(
          "[TivoliApiService] No token found – returning mock leaderboard data for development"
        );
        // Return mock data for development
        return {
          rank: Math.floor(Math.random() * 10) + 1,
          total_players: Math.floor(Math.random() * 50) + 10
        };
      } else {
        throw new Error(
          "Authentication required. Please launch this game from Tivoli."
        );
      }
    }

    console.log("[TivoliApiService] Submitting score:", {
      playerName,
      completionTime,
    });
    return submitScore(token, playerName, completionTime);
  }

  /**
   * Hämta leaderboard
   */
  static async getLeaderboard(
    limit: number = 50
  ): Promise<LeaderboardResponse> {
    const token = this.getToken();

    if (!token) {
      if (this.isDevelopment) {
        console.warn(
          "[TivoliApiService] No token found – returning mock leaderboard for development"
        );
        // Return mock leaderboard data
        const mockLeaderboard = Array.from({ length: Math.min(limit, 10) }, (_, i) => ({
          id: i + 1,
          player_name: `Player ${i + 1}`,
          completion_time: 60 + Math.floor(Math.random() * 120), // Random times between 1-3 minutes
          completed_at: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(), // Random date within last week
          rank: i + 1
        }));

        return {
          leaderboard: mockLeaderboard,
          total_players: mockLeaderboard.length,
          player_rank: undefined
        };
      } else {
        throw new Error(
          "Authentication required. Please launch this game from Tivoli."
        );
      }
    }

    console.log("[TivoliApiService] Fetching leaderboard with real token");
    return getLeaderboard(token, limit);
  }

  /**
   * (Valfritt) Hämta användarens saldo – placeholder just nu
   */
  static async getUserBalance(): Promise<number> {
    return 100; // Placeholder tills du integrerar riktig API-funktion
  }
}

export default TivoliApiService;