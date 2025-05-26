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
      
      // Try to store score as a special transaction
      try {
        await this.storeScoreAsTransaction(token, userId, userName, completionTime);
        console.log("[TivoliApiService] Score transaction stored successfully");
      } catch (transactionError) {
        console.error("[TivoliApiService] Failed to store score transaction:", transactionError);
        // Continue anyway - we'll try to get leaderboard data
      }
      
      // Try to get leaderboard to calculate rank
      try {
        const leaderboard = await this.getLeaderboard(50);
        const playerRank = leaderboard.leaderboard.findIndex(
          entry => entry.player_name === userName && entry.completion_time === completionTime
        ) + 1;

        return {
          rank: playerRank || leaderboard.total_players + 1,
          total_players: leaderboard.total_players,
        };
      } catch (leaderboardError) {
        console.error("[TivoliApiService] Failed to get leaderboard:", leaderboardError);
        // Return some default values
        return {
          rank: 1,
          total_players: 1,
        };
      }

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
   * Simplified payload to match API exactly
   */
  private static async storeScoreAsTransaction(
    token: string, 
    userId: string, 
    userName: string, 
    completionTime: number
  ): Promise<void> {
    const API_BASE_URL = import.meta.env.DEV ? "/api" : import.meta.env.VITE_API_URL || "/api";
    
    // Create a unique stamp_id for this score
    const scoreStampId = `gokart_score_${completionTime}_${Date.now()}`;
    
    // Simplified payload - try to match exactly what working transactions use
    const payload = {
      amusement_id: GAME_CONFIG.AMUSEMENT_ID,
      group_id: GAME_CONFIG.GROUP_ID,
      stake_amount: 0,
      payout_amount: completionTime,
      stamp_id: scoreStampId,
    };

    console.log("[TivoliApiService] Storing score as transaction:", payload);

    console.log("[TivoliApiService] Making transaction request to:", `${API_BASE_URL}/transactions`);
    console.log("[TivoliApiService] Request payload:", JSON.stringify(payload, null, 2));

    const response = await fetch(`${API_BASE_URL}/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "X-API-Key": import.meta.env.VITE_API_KEY || process.env.API_KEY || "",
      },
      body: JSON.stringify(payload),
    });

    console.log("[TivoliApiService] Transaction response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to store score transaction:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
        payload: payload,
        url: `${API_BASE_URL}/transactions`
      });
      throw new Error(`Failed to store score: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    console.log("[TivoliApiService] Score stored successfully as transaction:", result);
  }

  /**
   * Get all score transactions to build leaderboard
   * Fixed to properly identify score transactions
   */
  private static async getScoreTransactions(token: string): Promise<Array<{
    id: number;
    player_name: string;
    completion_time: number;
    completed_at: string;
  }>> {
    const API_BASE_URL = import.meta.env.DEV ? "/api" : import.meta.env.VITE_API_URL || "/api";
    const requestUrl = `${API_BASE_URL}/transactions?amusement_id=${GAME_CONFIG.AMUSEMENT_ID}`;
    
    console.log("[TivoliApiService] Fetching score transactions from:", requestUrl);
    
    // Fetch transactions for this specific amusement
    const response = await fetch(requestUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-API-Key": import.meta.env.VITE_API_KEY || process.env.API_KEY || "",
      },
    });

    console.log("[TivoliApiService] Transactions response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to fetch transactions:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
        url: requestUrl
      });
      throw new Error(`Failed to fetch transactions: ${response.status} - ${errorText}`);
    }

    const responseData = await response.json();
    console.log("[TivoliApiService] Raw API response:", responseData);
    console.log("[TivoliApiService] Response type:", typeof responseData);
    console.log("[TivoliApiService] Is array:", Array.isArray(responseData));

    // Handle different response formats
    let transactions;
    if (Array.isArray(responseData)) {
      transactions = responseData;
    } else if (responseData && typeof responseData === 'object') {
      // Check if response has a transactions property
      if (Array.isArray(responseData.transactions)) {
        transactions = responseData.transactions;
      } else if (Array.isArray(responseData.data)) {
        transactions = responseData.data;
      } else {
        console.error("[TivoliApiService] Unexpected response format:", responseData);
        throw new Error("API returned unexpected format - not an array of transactions");
      }
    } else {
      console.error("[TivoliApiService] Invalid response:", responseData);
      throw new Error("API returned invalid response");
    }

    console.log("[TivoliApiService] Parsed transactions:", transactions);
    console.log("[TivoliApiService] Transaction count:", transactions.length);
    
    // Filter for score transactions
    // We identify score transactions by stamp_id containing "gokart_score_"
    const scoreTransactions = transactions.filter(
      (t: any) => t.stamp_id && String(t.stamp_id).includes("gokart_score_")
    );

    console.log("[TivoliApiService] Filtered score transactions:", scoreTransactions);

    // Convert to leaderboard format
    return scoreTransactions.map((t: any) => ({
      id: t.id,
      player_name: this.getUserNameFromTransaction(t),
      completion_time: t.payout_amount, // We stored time in payout_amount
      completed_at: t.created_at || new Date().toISOString(),
    }));
  }

  /**
   * Extract user name from transaction - simplified version
   */
  private static getUserNameFromTransaction(transaction: any): string {
    // Try to get name from transaction user object
    if (transaction.user?.name) {
      return transaction.user.name;
    }
    
    // Try other common user name fields
    if (transaction.player_name) {
      return transaction.player_name;
    }
    
    if (transaction.username) {
      return transaction.username;
    }
    
    // Fallback to generic name
    return `Player ${transaction.id}`;
  }

  /**
   * Local storage fallback for score submission
   */
  private static submitScoreLocal(
    playerName: string, 
    completionTime: number
  ): Promise<{ rank: number; total_players: number }> {
    console.log("[TivoliApiService] Using local storage fallback for score submission");
    
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
    console.log("[TivoliApiService] Using local storage fallback for leaderboard");
    
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