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

  private static _token: string | null = null;
  private static _tokenSearched = false;
  private static _messageListenerAdded = false;

  static debugAuthentication(): void {
    console.log("=== TIVOLI AUTHENTICATION DEBUG ===");

    console.log("Current URL:", window.location.href);
    console.log("Hostname:", window.location.hostname);
    console.log(
      "All URL params:",
      Object.fromEntries(new URLSearchParams(window.location.search))
    );

    console.log("localStorage token:", localStorage.getItem("token"));
    console.log("sessionStorage token:", sessionStorage.getItem("token"));
    console.log("All localStorage keys:", Object.keys(localStorage));

    console.log("Is in iframe:", window.top !== window.self);
    console.log("Document referrer:", document.referrer);

    console.log("Document cookies:", document.cookie);

    try {
      console.log("Parent URL:", window.parent.location.href);
    } catch (e) {
      console.log("Cannot access parent URL (CORS blocked)");
    }

    const urlParams = new URLSearchParams(window.location.search);
    const commonTokenNames = [
      "token",
      "jwt",
      "auth",
      "access_token",
      "bearer",
      "sessionToken",
      "authToken",
      "userToken",
      "tivoliToken",
    ];

    commonTokenNames.forEach((name) => {
      const value = urlParams.get(name);
      if (value) {
        console.log(
          `Found token parameter '${name}':`,
          value.substring(0, 20) + "..."
        );
      }
    });

    const hash = window.location.hash;
    if (hash) {
      console.log("URL hash:", hash);
      const hashParams = new URLSearchParams(hash.substring(1));
      commonTokenNames.forEach((name) => {
        const value = hashParams.get(name);
        if (value) {
          console.log(
            `Found token in hash parameter '${name}':`,
            value.substring(0, 20) + "..."
          );
        }
      });
    }

    console.log("=== END DEBUG ===");
  }

  static getToken(): string | null {
    return localStorage.getItem("token");
  }

  // Rest of your existing methods remain the same...
  static async reportSpin(): Promise<void> {
    const token = this.getToken();
    if (!token || token === "dev-mode-token") {
      if (this.isDevelopment) {
        console.warn("[Dev mode] Simulating spin transaction.");
        return Promise.resolve();
      }
      throw new Error("Authentication required.");
    }

    return buyTicket(token);
  }

  static async reportWinnings(amount: number): Promise<void> {
    const token = this.getToken();
    if (!token || token === "dev-mode-token") {
      if (this.isDevelopment) {
        console.warn(`[Dev mode] Simulating payout: €${amount}`);
        return Promise.resolve();
      }
      throw new Error("Authentication required.");
    }

    return reportPayout(token, amount);
  }

  static async reportStamp(): Promise<void> {
    const token = this.getToken();
    if (!token || token === "dev-mode-token") {
      if (this.isDevelopment) {
        console.warn("[Dev mode] Simulating stamp award.");
        return Promise.resolve();
      }
      throw new Error("Authentication required.");
    }

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
        console.error("Real API failed:", error);
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

    if (token) {
      try {
        console.log("[TivoliApiService] Fetching real leaderboard");
        return await getLeaderboard(token, limit);
      } catch (error) {
        console.error("Real leaderboard API failed:", error);
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

  static async getUserBalance(): Promise<number> {
    return 100;
  }
}

export default TivoliApiService;
