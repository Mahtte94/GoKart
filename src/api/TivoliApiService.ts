import { buyTicket, reportPayout, awardStamp } from "./transactionService";
import { decodeJwt } from "../components/decodeUtil";
import { GAME_CONFIG } from "../context/gameConfig";

interface TokenPayload {
  sub: string; // user ID
  name?: string; // user name
  exp: number;
  [key: string]: any;
}

// Local leaderboard interfaces
export interface LeaderboardEntry {
  id: number;
  player_name: string;
  completion_time: number;
  completed_at: string;
  rank: number;
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  player_rank?: number;
  total_players: number;
}

class TivoliApiService {
  static isDevelopment =
    process.env.NODE_ENV === "development" ||
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

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

    return awardStamp(token);
  }

  /**
   * Submit score - LOCAL STORAGE ONLY
   * This stores scores locally on this device
   */
  static async submitScore(
    playerName: string,
    completionTime: number
  ): Promise<{ rank: number; total_players: number }> {
    console.log("[TivoliApiService] Using local leaderboard for score submission");
    
    const localScores = this.getLocalScores();
    const newScore = {
      id: Date.now(),
      player_name: playerName,
      completion_time: completionTime,
      completed_at: new Date().toISOString(),
      rank: 0
    };
    
    localScores.push(newScore);
    localScores.sort((a, b) => a.completion_time - b.completion_time);
    
    localScores.forEach((score, index) => {
      score.rank = index + 1;
    });
    
    localStorage.setItem('gokart_local_scores', JSON.stringify(localScores));
    
    const playerRank = localScores.findIndex(score => score.id === newScore.id) + 1;
    
    return Promise.resolve({
      rank: playerRank,
      total_players: localScores.length,
    });
  }

  /**
   * Get leaderboard - LOCAL STORAGE ONLY
   * This shows scores stored locally on this device
   */
  static async getLeaderboard(
    limit: number = 50
  ): Promise<LeaderboardResponse> {
    console.log("[TivoliApiService] Using local leaderboard");
    
    const localScores = this.getLocalScores();
    const limitedScores = localScores.slice(0, Math.min(limit, localScores.length));
    
    return Promise.resolve({
      leaderboard: limitedScores,
      total_players: localScores.length,
      player_rank: undefined,
    });
  }

  /**
   * Helper method to get local scores from localStorage
   */
  private static getLocalScores(): Array<{
    id: number;
    player_name: string;
    completion_time: number;
    completed_at: string;
    rank: number;
  }> {
    try {
      const stored = localStorage.getItem('gokart_local_scores');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Error loading local scores:", error);
      return [];
    }
  }
}

export default TivoliApiService;