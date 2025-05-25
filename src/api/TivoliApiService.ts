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
    console.log("All URL params:", Object.fromEntries(new URLSearchParams(window.location.search)));
    
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
      'token', 'jwt', 'auth', 'access_token', 'bearer', 
      'sessionToken', 'authToken', 'userToken', 'tivoliToken'
    ];
    
    commonTokenNames.forEach(name => {
      const value = urlParams.get(name);
      if (value) {
        console.log(`Found token parameter '${name}':`, value.substring(0, 20) + "...");
      }
    });
    
    const hash = window.location.hash;
    if (hash) {
      console.log("URL hash:", hash);
      const hashParams = new URLSearchParams(hash.substring(1));
      commonTokenNames.forEach(name => {
        const value = hashParams.get(name);
        if (value) {
          console.log(`Found token in hash parameter '${name}':`, value.substring(0, 20) + "...");
        }
      });
    }
    
    console.log("=== END DEBUG ===");
  }

  static getToken(): string | null {
    if (!this._tokenSearched) {
      this.debugAuthentication();
      this._token = this.searchForToken();
      this._tokenSearched = true;
    }
    
    return this._token;
  }

  private static searchForToken(): string | null {
    let token: string | null = null;

    // 1. Check localStorage
    token = localStorage.getItem("token");
    if (token) {
      console.log("✅ Token found in localStorage");
      return token;
    }

    // 2. Check sessionStorage
    token = sessionStorage.getItem("token");
    if (token) {
      console.log("✅ Token found in sessionStorage");
      localStorage.setItem("token", token);
      return token;
    }

    // 3. Check URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParamNames = [
      'token', 'jwt', 'auth', 'access_token', 'bearer', 
      'sessionToken', 'authToken', 'userToken', 'tivoliToken'
    ];
    
    for (const paramName of tokenParamNames) {
      token = urlParams.get(paramName);
      if (token) {
        console.log(`✅ Token found in URL parameter '${paramName}'`);
        localStorage.setItem("token", token);
        return token;
      }
    }

    // 4. Check URL hash parameters
    const hash = window.location.hash;
    if (hash) {
      const hashParams = new URLSearchParams(hash.substring(1));
      for (const paramName of tokenParamNames) {
        token = hashParams.get(paramName);
        if (token) {
          console.log(`✅ Token found in hash parameter '${paramName}'`);
          localStorage.setItem("token", token);
          return token;
        }
      }
    }

    // 5. Check cookies
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (tokenParamNames.includes(name)) {
        console.log(`✅ Token found in cookie '${name}'`);
        localStorage.setItem("token", value);
        return value;
      }
    }

    // 6. Listen for postMessage from parent window
    if (!this._messageListenerAdded && window.top !== window.self) {
      this.setupMessageListener();
    }

    console.log("❌ No token found in any location");
    return null;
  }

  private static setupMessageListener(): void {
    this._messageListenerAdded = true;
    
    window.addEventListener('message', (event) => {
      console.log("📨 Received postMessage:", event);
      
      // Security check - only accept messages from Tivoli domains
      if (!event.origin.includes('yrgobanken.vip')) {
        console.log("🚫 Rejected message from untrusted origin:", event.origin);
        return;
      }
      
      let token = null;
      
      // Check different message formats
      if (typeof event.data === 'string') {
        // Direct token string
        token = event.data;
      } else if (event.data && typeof event.data === 'object') {
        // Object with token property
        token = event.data.token || 
                event.data.jwt || 
                event.data.auth || 
                event.data.authToken ||
                event.data.access_token;
      }
      
      if (token && typeof token === 'string' && token.length > 10) {
        console.log("✅ Token received via postMessage");
        this._token = token;
        localStorage.setItem("token", token);
        
        // Notify that token is now available
        window.dispatchEvent(new CustomEvent('tivoliTokenReceived', { detail: token }));
      }
    });
    
    // Request token from parent
    try {
      const requests = [
        { type: 'REQUEST_TOKEN' },
        { action: 'getToken' },
        { request: 'token' },
        'REQUEST_TOKEN'
      ];
      
      requests.forEach(request => {
        window.parent.postMessage(request, '*');
      });
      
      console.log("📤 Token requests sent to parent window");
    } catch (e) {
      console.log("❌ Could not request token from parent:", e);
    }
  }

  // Add method to manually set token (for testing)
  static setToken(token: string): void {
    this._token = token;
    localStorage.setItem("token", token);
    console.log("✅ Token manually set");
  }

  // Rest of your existing methods remain the same...
  static async reportSpin(): Promise<void> {
    const token = this.getToken();

    if (!token) {
      if (this.isDevelopment || this.isEmbeddedGame) {
        console.warn("[TivoliApiService] No token found – simulating spin transaction");
        return Promise.resolve();
      } else {
        throw new Error("Authentication required. Please launch this game from Tivoli.");
      }
    }

    console.log("[TivoliApiService] Reporting spin with real token");
    return buyTicket(token);
  }

  static async reportWinnings(amount: number): Promise<void> {
    const token = this.getToken();

    if (!token) {
      if (this.isDevelopment || this.isEmbeddedGame) {
        console.warn("[TivoliApiService] No token found – simulating winnings transaction");
        return Promise.resolve();
      } else {
        throw new Error("Authentication required. Please launch this game from Tivoli.");
      }
    }

    console.log("[TivoliApiService] Reporting winnings with amount:", amount);
    return reportPayout(token, amount);
  }

  static async reportStamp(): Promise<void> {
    const token = this.getToken();

    if (!token) {
      if (this.isDevelopment || this.isEmbeddedGame) {
        console.warn("[TivoliApiService] No token found – simulating stamp transaction");
        return Promise.resolve();
      } else {
        throw new Error("Authentication required. Please launch this game from Tivoli.");
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
        console.error("Real API failed:", error);
      }
    }

    if (this.isDevelopment || this.isEmbeddedGame) {
      console.warn("[TivoliApiService] Using mock score submission");
      return {
        rank: Math.floor(Math.random() * 10) + 1,
        total_players: Math.floor(Math.random() * 50) + 10
      };
    }

    throw new Error("Authentication required. Please launch this game from Tivoli.");
  }

  static async getLeaderboard(limit: number = 50): Promise<LeaderboardResponse> {
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