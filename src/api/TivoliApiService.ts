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

  static getToken(): string | null {
    let token = localStorage.getItem("token");
    
    if (!token) {
      const urlParams = new URLSearchParams(window.location.search);
      token = urlParams.get('token');
      if (token) {
        localStorage.setItem("token", token);
      }
    }
    
    return token;
  }

  static async reportSpin(): Promise<void> {
    const token = this.getToken();

    if (!token) {
      if (this.isDevelopment || this.isEmbeddedGame) {
        console.warn(
          "[TivoliApiService] No token found – simulating spin transaction"
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

  static async reportWinnings(amount: number): Promise<void> {
    const token = this.getToken();

    if (!token) {
      if (this.isDevelopment || this.isEmbeddedGame) {
        console.warn(
          "[TivoliApiService] No token found – simulating winnings transaction"
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

  static async reportStamp(): Promise<void> {
    const token = this.getToken();

    if (!token) {
      if (this.isDevelopment || this.isEmbeddedGame) {
        console.warn(
          "[TivoliApiService] No token found – simulating stamp transaction"
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

  static async submitScore(
    playerName: string,
    completionTime: number
  ): Promise<{ rank: number; total_players: number }> {
    const token = this.getToken();

    if (token) {
      try {
        console.log("[TivoliApiService] Submitting score with real token");
        return await submitScore(token, playerName, completionTime);
      } catch (error) {
        console.error("Real API failed, falling back to mock:", error);
      }
    }

    if (this.isDevelopment) {
      console.warn("[TivoliApiService] Using mock score submission for development");
      return {
        rank: Math.floor(Math.random() * 10) + 1,
        total_players: Math.floor(Math.random() * 50) + 10
      };
    }

    throw new Error("Authentication required. Please launch this game from Tivoli.");
  }

  static async getLeaderboard(
    limit: number = 50
  ): Promise<LeaderboardResponse> {
    const token = this.getToken();

    if (token) {
      try {
        console.log("[TivoliApiService] Fetching real leaderboard");
        return await getLeaderboard(token, limit);
      } catch (error) {
        console.error("Real leaderboard API failed:", error);
      }
    }

    if (this.isDevelopment) {
      console.warn("[TivoliApiService] Using mock leaderboard for development");
      
      const mockTimes = [65, 73, 89, 92, 105, 118, 134, 157, 161, 177];
      const mockLeaderboard = mockTimes.slice(0, Math.min(limit, 10)).map((time, i) => ({
        id: i + 1,
        player_name: `Player ${i + 1}`,
        completion_time: time,
        completed_at: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
        rank: i + 1
      }));

      return {
        leaderboard: mockLeaderboard,
        total_players: mockLeaderboard.length,
        player_rank: undefined
      };
    }

    return {
      leaderboard: [],
      total_players: 0,
      player_rank: undefined
    };
  }

  static async getUserBalance(): Promise<number> {
    return 100;
  }
}

export default TivoliApiService;