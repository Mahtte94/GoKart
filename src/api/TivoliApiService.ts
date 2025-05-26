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

      console.log("[TivoliApiService] Submitting score for user:", userName);
      
      // First try the dedicated leaderboard API
      try {
        console.log("[TivoliApiService] Trying dedicated leaderboard API");
        const result = await submitScore(token, userName, completionTime);
        console.log("[TivoliApiService] Leaderboard API success:", result);
        return result;
      } catch (leaderboardError) {
        console.warn("[TivoliApiService] Dedicated leaderboard API failed:", leaderboardError);
        // Continue to transaction approach
      }

      // Fallback: Try transaction-based approach with improved error handling
      console.log("[TivoliApiService] Trying transaction-based leaderboard");
      
      try {
        await this.storeScoreAsTransaction(token, userId, userName, completionTime);
        console.log("[TivoliApiService] Score transaction stored successfully");
      } catch (transactionError) {
        console.error("[TivoliApiService] Failed to store score transaction:", transactionError);
        // Don't throw - we'll still try to get existing leaderboard
      }
      
      // Try to get leaderboard data
      try {
        const leaderboard = await this.getLeaderboard(50);
        const playerEntry = leaderboard.leaderboard.find(
          entry => entry.player_name === userName
        );

        return {
          rank: playerEntry?.rank || leaderboard.total_players + 1,
          total_players: leaderboard.total_players,
        };
      } catch (leaderboardError) {
        console.error("[TivoliApiService] Failed to get leaderboard:", leaderboardError);
        // Return some default values rather than throwing
        return {
          rank: 1,
          total_players: 1,
        };
      }

    } catch (error) {
      console.error("Tivoli API score submission failed:", error);
      // Always fallback to local storage rather than throwing
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
      // First try the dedicated leaderboard API
      try {
        console.log("[TivoliApiService] Trying dedicated leaderboard API");
        const result = await getLeaderboard(token, limit);
        console.log("[TivoliApiService] Leaderboard API success:", result);
        return result;
      } catch (leaderboardError) {
        console.warn("[TivoliApiService] Dedicated leaderboard API failed:", leaderboardError);
        // Continue to transaction approach
      }

      // Fallback: Try transaction-based approach
      console.log("[TivoliApiService] Trying transaction-based leaderboard");
      
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
      // Always fallback to local storage rather than throwing
      return this.getLeaderboardLocal(limit);
    }
  }

  /**
   * Store completion time as a special transaction - simplified approach
   */
  private static async storeScoreAsTransaction(
    token: string, 
    userId: string, 
    userName: string, 
    completionTime: number
  ): Promise<void> {
    const API_BASE_URL = import.meta.env.DEV ? "/api" : import.meta.env.VITE_API_URL || "/api";
    
    // Try multiple payload formats in case one works
    const payloadOptions = [
      // Option 1: Minimal payload matching working transactions
      {
        amusement_id: GAME_CONFIG.AMUSEMENT_ID,
        group_id: GAME_CONFIG.GROUP_ID,
        stake_amount: 0,
        payout_amount: 0,
        stamp_id: `gokart_score_${completionTime}_${Date.now()}`,
      },
      // Option 2: Include completion time in different field
      {
        amusement_id: GAME_CONFIG.AMUSEMENT_ID,
        group_id: GAME_CONFIG.GROUP_ID,
        completion_time: completionTime,
        player_name: userName,
        stamp_id: `gokart_score_${completionTime}_${Date.now()}`,
      },
      // Option 3: Store in payout_amount as originally attempted
      {
        amusement_id: GAME_CONFIG.AMUSEMENT_ID,
        group_id: GAME_CONFIG.GROUP_ID,
        stake_amount: 0,
        payout_amount: completionTime,
        stamp_id: `gokart_score_${completionTime}_${Date.now()}`,
      }
    ];

    let lastError;

    for (let i = 0; i < payloadOptions.length; i++) {
      const payload = payloadOptions[i];
      
      try {
        console.log(`[TivoliApiService] Trying payload option ${i + 1}:`, payload);

        const response = await fetch(`${API_BASE_URL}/transactions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "X-API-Key": import.meta.env.VITE_API_KEY || process.env.API_KEY || "",
          },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          const result = await response.json();
          console.log("[TivoliApiService] Score stored successfully:", result);
          return; // Success - exit the function
        } else {
          const errorText = await response.text();
          console.warn(`[TivoliApiService] Payload option ${i + 1} failed:`, response.status, errorText);
          lastError = new Error(`${response.status}: ${errorText}`);
        }
      } catch (error) {
        console.warn(`[TivoliApiService] Payload option ${i + 1} error:`, error);
        lastError = error;
      }
    }

    // If all payload options failed, throw the last error
    throw lastError || new Error("All transaction payload options failed");
  }

  /**
   * Get all score transactions with improved error handling
   */
  private static async getScoreTransactions(token: string): Promise<Array<{
    id: number;
    player_name: string;
    completion_time: number;
    completed_at: string;
  }>> {
    const API_BASE_URL = import.meta.env.DEV ? "/api" : import.meta.env.VITE_API_URL || "/api";
    
    // Try different endpoint variations
    const endpointOptions = [
      `${API_BASE_URL}/transactions?amusement_id=${GAME_CONFIG.AMUSEMENT_ID}`,
      `${API_BASE_URL}/transactions`,
      `${API_BASE_URL}/api/transactions?amusement_id=${GAME_CONFIG.AMUSEMENT_ID}`,
    ];

    for (const endpoint of endpointOptions) {
      try {
        console.log("[TivoliApiService] Trying endpoint:", endpoint);
        
        const response = await fetch(endpoint, {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-API-Key": import.meta.env.VITE_API_KEY || process.env.API_KEY || "",
          },
        });

        if (!response.ok) {
          console.warn(`[TivoliApiService] Endpoint ${endpoint} failed:`, response.status);
          continue;
        }

        const responseData = await response.json();
        console.log("[TivoliApiService] Raw API response:", responseData);

        // Handle different response formats more robustly
        let transactions = [];
        
        if (Array.isArray(responseData)) {
          transactions = responseData;
        } else if (responseData && typeof responseData === 'object') {
          // Try different possible properties
          if (Array.isArray(responseData.transactions)) {
            transactions = responseData.transactions;
          } else if (Array.isArray(responseData.data)) {
            transactions = responseData.data;
          } else if (Array.isArray(responseData.results)) {
            transactions = responseData.results;
          } else {
            console.warn("[TivoliApiService] Unexpected response format:", responseData);
            continue;
          }
        } else {
          console.warn("[TivoliApiService] Invalid response format:", responseData);
          continue;
        }

        console.log("[TivoliApiService] Parsed transactions:", transactions);
        
        // Filter for score transactions with more flexible matching
        const scoreTransactions = transactions.filter((t: any) => {
          return t.stamp_id && (
            String(t.stamp_id).includes("gokart_score_") ||
            String(t.stamp_id).includes("score") ||
            (t.completion_time !== undefined) ||
            (t.player_name !== undefined)
          );
        });

        console.log("[TivoliApiService] Filtered score transactions:", scoreTransactions);

        // Convert to leaderboard format with better data extraction
        return scoreTransactions.map((t: any) => ({
          id: t.id || Date.now(),
          player_name: this.getUserNameFromTransaction(t),
          completion_time: this.getCompletionTimeFromTransaction(t),
          completed_at: t.created_at || t.completed_at || new Date().toISOString(),
        })).filter(entry => entry.completion_time > 0); // Filter out invalid times

      } catch (error) {
        console.warn(`[TivoliApiService] Error with endpoint ${endpoint}:`, error);
        continue;
      }
    }

    // If all endpoints failed, return empty array instead of throwing
    console.warn("[TivoliApiService] All transaction endpoints failed, returning empty array");
    return [];
  }

  /**
   * Extract completion time from transaction with multiple fallbacks
   */
  private static getCompletionTimeFromTransaction(transaction: any): number {
    // Try different possible fields where completion time might be stored
    if (transaction.completion_time !== undefined && transaction.completion_time > 0) {
      return transaction.completion_time;
    }
    
    if (transaction.payout_amount !== undefined && transaction.payout_amount > 0) {
      return transaction.payout_amount;
    }
    
    // Try to extract from stamp_id
    if (transaction.stamp_id && String(transaction.stamp_id).includes("gokart_score_")) {
      const match = String(transaction.stamp_id).match(/gokart_score_(\d+)_/);
      if (match && match[1]) {
        return parseInt(match[1], 10);
      }
    }
    
    // Fallback to a reasonable default
    return 999;
  }

  /**
   * Extract user name from transaction with multiple fallbacks
   */
  private static getUserNameFromTransaction(transaction: any): string {
    // Try different possible fields
    if (transaction.player_name) {
      return transaction.player_name;
    }
    
    if (transaction.user?.name) {
      return transaction.user.name;
    }
    
    if (transaction.username) {
      return transaction.username;
    }
    
    if (transaction.name) {
      return transaction.name;
    }
    
    // Fallback to generic name with ID
    return `Player ${transaction.id || 'Unknown'}`;
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