import { buyTicket, reportPayout, awardStamp } from "./transactionService";
import {
  submitScore,
  getLeaderboard,
  LeaderboardResponse,
} from "./leaderboardService";
import { decodeJwt } from "../components/decodeUtil";
import { GAME_CONFIG } from "../context/gameConfig";

interface TokenPayload {
  sub: string; // user ID
  name?: string; // user name
  exp: number;
  [key: string]: any;
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

  static async submitScore(
    playerName: string,
    completionTime: number
  ): Promise<{ rank: number; total_players: number }> {
    const token = this.getToken();
  
    if (!token) {
      if (this.isDevelopment) {
        console.warn("[TivoliApiService] No token - using local storage");
        return this.submitScoreLocal(playerName, completionTime);
      } else {
        throw new Error("Authentication required. Please launch this game from Tivoli.");
      }
    }

    try {
      // Decode JWT to get user info
      const decoded = decodeJwt<TokenPayload>(token);
      const userId = decoded?.sub;
      const userName = decoded?.name || playerName;

      console.log("[TivoliApiService] Submitting score via Tivoli API for user:", userName);
      
      // Store score as a special transaction
      await this.storeScoreAsTransaction(token, userId, userName, completionTime);
      
      // Get leaderboard to calculate rank
      const leaderboard = await this.getLeaderboard(50);
      const playerRank = leaderboard.leaderboard.findIndex(
        entry => entry.player_name === userName && entry.completion_time === completionTime
      ) + 1;

      return {
        rank: playerRank || leaderboard.total_players,
        total_players: leaderboard.total_players,
      };

    } catch (error) {
      console.error("Tivoli API score submission failed:", error);
      // Fallback to local storage
      return this.submitScoreLocal(playerName, completionTime);
    }
  }

  static async getLeaderboard(
    limit: number = 50
  ): Promise<LeaderboardResponse> {
    const token = this.getToken();
  
    if (!token) {
      if (this.isDevelopment) {
        console.warn("[TivoliApiService] No token - using local storage");
        return this.getLeaderboardLocal(limit);
      } else {
        return { leaderboard: [], total_players: 0, player_rank: undefined };
      }
    }

    try {
      console.log("[TivoliApiService] Fetching leaderboard from Tivoli API");
      
      // Get all score transactions for this amusement
      const scores = await this.getScoreTransactions(token);
      
      // Sort by completion time (fastest first)
      scores.sort((a, b) => a.completion_time - b.completion_time);
      
      // Add ranks and limit results
      const rankedScores = scores.map((score, index) => ({
        ...score,
        rank: index + 1
      }));

      const limitedScores = rankedScores.slice(0, limit);

      return {
        leaderboard: limitedScores,
        total_players: scores.length,
        player_rank: undefined,
      };

    } catch (error) {
      console.error("Tivoli API leaderboard failed:", error);
      // Fallback to local storage
      return this.getLeaderboardLocal(limit);
    }
  }

  /**
   * Store completion time as a special transaction
   */
  private static async storeScoreAsTransaction(
    token: string, 
    userId: string, 
    userName: string, 
    completionTime: number
  ): Promise<void> {
    const API_BASE_URL = import.meta.env.DEV ? "/api" : import.meta.env.VITE_API_URL || "/api";
    
    const payload = {
      amusement_id: GAME_CONFIG.AMUSEMENT_ID,
      group_id: GAME_CONFIG.GROUP_ID,
      stake_amount: completionTime, // Store completion time in stake_amount field
      payout_amount: 0, // Mark as score transaction with 0 payout
      stamp_id: `score_${userId}_${Date.now()}`, // Unique identifier for score transactions
    };

    console.log("[TivoliApiService] Storing score transaction:", payload);

    const response = await fetch(`${API_BASE_URL}/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "X-API-Key": import.meta.env.VITE_API_KEY || process.env.API_KEY || "",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[TivoliApiService] Failed to store score transaction:", errorText);
      throw new Error(`Failed to store score: ${response.status} - ${errorText}`);
    }

    console.log("[TivoliApiService] Score transaction stored successfully");
  }

  /**
   * Get all score transactions to build leaderboard
   */
  private static async getScoreTransactions(token: string): Promise<Array<{
    id: number;
    player_name: string;
    completion_time: number;
    completed_at: string;
  }>> {
    const API_BASE_URL = import.meta.env.DEV ? "/api" : import.meta.env.VITE_API_URL || "/api";
    
    console.log("[TivoliApiService] Fetching transactions for amusement:", GAME_CONFIG.AMUSEMENT_ID);

    const response = await fetch(`${API_BASE_URL}/transactions?amusement_id=${GAME_CONFIG.AMUSEMENT_ID}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-API-Key": import.meta.env.VITE_API_KEY || process.env.API_KEY || "",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[TivoliApiService] Failed to fetch transactions:", errorText);
      throw new Error(`Failed to fetch transactions: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("[TivoliApiService] Fetched transactions:", data);
    
    // Handle both array response and object with transactions array
    const transactions = Array.isArray(data) ? data : (data.transactions || data.data || []);
    
    // Filter for score transactions (payout_amount = 0 and stamp_id starts with "score_")
    const scoreTransactions = transactions.filter(
      (t: any) => t.payout_amount === 0 && String(t.stamp_id || '').startsWith("score_")
    );

    console.log("[TivoliApiService] Found score transactions:", scoreTransactions);

    // Convert to leaderboard format
    return scoreTransactions.map((t: any, index: number) => ({
      id: t.id || index,
      player_name: this.getUserNameFromTransaction(t),
      completion_time: t.stake_amount, // We stored time in stake_amount
      completed_at: t.created_at || t.completed_at || new Date().toISOString(),
    }));
  }

  /**
   * Extract user name from transaction - this might need adjustment based on API response
   */
  private static getUserNameFromTransaction(transaction: any): string {
    // Try multiple possible fields for user name
    if (transaction.user?.name) return transaction.user.name;
    if (transaction.player_name) return transaction.player_name;
    if (transaction.user?.username) return transaction.user.username;
    if (transaction.username) return transaction.username;
    
    // Extract from stamp_id if available (format: score_userId_timestamp)
    if (transaction.stamp_id && typeof transaction.stamp_id === 'string') {
      const parts = transaction.stamp_id.split('_');
      if (parts.length >= 2) {
        return `Player ${parts[1]}`;
      }
    }
    
    // Fallback to generic name with transaction ID
    return `Player ${transaction.id || Math.random().toString(36).substr(2, 5)}`;
  }

  /**
   * Local storage fallback for score submission
   */
  private static submitScoreLocal(
    playerName: string, 
    completionTime: number
  ): Promise<{ rank: number; total_players: number }> {
    console.log("[TivoliApiService] Using local storage for score submission");
    
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
   * Local storage fallback for leaderboard
   */
  private static getLeaderboardLocal(limit: number): Promise<LeaderboardResponse> {
    console.log("[TivoliApiService] Using local storage for leaderboard");
    
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