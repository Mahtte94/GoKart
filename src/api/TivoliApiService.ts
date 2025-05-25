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
      
        if (token) {
          try {
            console.log("[TivoliApiService] Submitting score with real token");
            return await submitScore(token, playerName, completionTime);
          } catch (error) {
            console.error("Real API failed:", error);
          }
        }
      
        if (this.isDevelopment) {
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
      
        if (this.isDevelopment) {
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
    
    
