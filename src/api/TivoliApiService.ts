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

  static isStandaloneMode = import.meta.env.VITE_STANDALONE_MODE === "true";
  static debugMode = import.meta.env.VITE_DEBUG_MODE === "true";

  static log(message: string, ...args: any[]) {
    if (this.debugMode || this.isDevelopment) {
      console.log(`[TivoliApiService] ${message}`, ...args);
    }
  }

  static error(message: string, ...args: any[]) {
    console.error(`[TivoliApiService] ${message}`, ...args);
  }

  /**
   * Hämtar token från localStorage
   */
  static getToken(): string | null {
    const token = localStorage.getItem("token");
    this.log("Getting token:", token ? "Found" : "Not found");
    return token;
  }

  /**
   * Kontrollera om vi har en giltig token
   */
  static hasValidToken(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      // Decode JWT to check expiration
      const parts = token.split('.');
      if (parts.length !== 3) return false;
      
      const payload = JSON.parse(atob(parts[1]));
      const isExpired = payload.exp && payload.exp < Date.now() / 1000;
      
      this.log("Token validation:", { 
        hasToken: !!token, 
        isExpired,
        expiresAt: payload.exp ? new Date(payload.exp * 1000) : 'No expiration'
      });
      
      return !isExpired;
    } catch (error) {
      this.error("Token validation error:", error);
      return false;
    }
  }

  /**
   * Rapportera att spelaren har snurrat (drar en "biljett")
   */
  static async reportSpin(): Promise<void> {
    const token = this.getToken();
    this.log("reportSpin called", { hasToken: !!token });

    if (!token) {
      if (this.isDevelopment || this.isStandaloneMode) {
        this.log("No token found – simulating spin transaction (development mode)");
        return Promise.resolve();
      } else {
        const error = new Error("Authentication required. Please launch this game from Tivoli.");
        this.error("reportSpin failed:", error.message);
        throw error;
      }
    }

    if (!this.hasValidToken()) {
      const error = new Error("Token is invalid or expired. Please refresh the game.");
      this.error("reportSpin failed:", error.message);
      throw error;
    }

    try {
      this.log("Calling buyTicket with token");
      await buyTicket(token);
      this.log("buyTicket successful");
    } catch (error) {
      this.error("buyTicket failed:", error);
      throw error;
    }
  }

  /**
   * Rapportera att spelaren har vunnit (ger pengar)
   */
  static async reportWinnings(amount: number): Promise<void> {
    const token = this.getToken();
    this.log("reportWinnings called", { amount, hasToken: !!token });

    if (!token) {
      if (this.isDevelopment || this.isStandaloneMode) {
        this.log("No token found – simulating winnings transaction (development mode)");
        return Promise.resolve();
      } else {
        const error = new Error("Authentication required. Please launch this game from Tivoli.");
        this.error("reportWinnings failed:", error.message);
        throw error;
      }
    }

    if (!this.hasValidToken()) {
      const error = new Error("Token is invalid or expired. Please refresh the game.");
      this.error("reportWinnings failed:", error.message);
      throw error;
    }

    try {
      this.log("Calling reportPayout with token and amount:", amount);
      await reportPayout(token, amount);
      this.log("reportPayout successful");
    } catch (error) {
      this.error("reportPayout failed:", error);
      throw error;
    }
  }

  /**
   * Rapportera att spelaren får en stämpel (om det behövs separat från vinst)
   */
  static async reportStamp(): Promise<void> {
    const token = this.getToken();
    this.log("reportStamp called", { hasToken: !!token });

    if (!token) {
      if (this.isDevelopment || this.isStandaloneMode) {
        this.log("No token found – simulating stamp transaction (development mode)");
        return Promise.resolve();
      } else {
        const error = new Error("Authentication required. Please launch this game from Tivoli.");
        this.error("reportStamp failed:", error.message);
        throw error;
      }
    }

    if (!this.hasValidToken()) {
      const error = new Error("Token is invalid or expired. Please refresh the game.");
      this.error("reportStamp failed:", error.message);
      throw error;
    }

    try {
      this.log("Calling awardStamp with token");
      await awardStamp(token);
      this.log("awardStamp successful");
    } catch (error) {
      this.error("awardStamp failed:", error);
      throw error;
    }
  }

  static async submitScore(
    playerName: string,
    completionTime: number
  ): Promise<{ rank: number; total_players: number }> {
    const token = this.getToken();
    this.log("submitScore called", { playerName, completionTime, hasToken: !!token });

    if (token && this.hasValidToken()) {
      try {
        this.log("Submitting score with real token");
        const result = await submitScore(token, playerName, completionTime);
        this.log("Score submission successful:", result);
        return result;
      } catch (error) {
        this.error("Real API failed:", error);
      }
    }

    if (this.isDevelopment || this.isEmbeddedGame || this.isStandaloneMode) {
      this.log("Using mock score submission");
      const mockResult = {
        rank: Math.floor(Math.random() * 10) + 1,
        total_players: Math.floor(Math.random() * 50) + 10,
      };
      this.log("Mock score result:", mockResult);
      return mockResult;
    }

    const error = new Error("Authentication required. Please launch this game from Tivoli.");
    this.error("submitScore failed:", error.message);
    throw error;
  }

  static async getLeaderboard(
    limit: number = 50
  ): Promise<LeaderboardResponse> {
    const token = this.getToken();
    this.log("getLeaderboard called", { limit, hasToken: !!token });

    if (token && this.hasValidToken()) {
      try {
        this.log("Fetching real leaderboard");
        const result = await getLeaderboard(token, limit);
        this.log("Leaderboard fetch successful:", result);
        return result;
      } catch (error) {
        this.error("Real leaderboard API failed:", error);
      }
    }

    if (this.isDevelopment || this.isEmbeddedGame || this.isStandaloneMode) {
      this.log("Using mock leaderboard");

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

      const mockResult = {
        leaderboard: mockLeaderboard,
        total_players: mockLeaderboard.length,
        player_rank: undefined,
      };
      
      this.log("Mock leaderboard result:", mockResult);
      return mockResult;
    }

    return {
      leaderboard: [],
      total_players: 0,
      player_rank: undefined,
    };
  }

  /**
   * Debug function to check current state
   */
  static getDebugInfo() {
    const token = this.getToken();
    let tokenInfo = null;
    
    if (token) {
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          tokenInfo = {
            sub: payload.sub,
            exp: payload.exp,
            expiresAt: payload.exp ? new Date(payload.exp * 1000) : null,
            isExpired: payload.exp && payload.exp < Date.now() / 1000
          };
        }
      } catch (e) {
        tokenInfo = { error: "Invalid token format" };
      }
    }

    return {
      isDevelopment: this.isDevelopment,
      isEmbeddedGame: this.isEmbeddedGame,
      isStandaloneMode: this.isStandaloneMode,
      debugMode: this.debugMode,
      hasToken: !!token,
      tokenInfo,
      hostname: window.location.hostname,
      origin: window.location.origin,
      inIframe: window.parent !== window
    };
  }
}

export default TivoliApiService;