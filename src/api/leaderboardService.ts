// src/api/leaderboardService.ts
import { GAME_CONFIG } from "../context/gameConfig";

const API_BASE_URL = import.meta.env.DEV
  ? "/api"
  : import.meta.env.VITE_API_URL || "/api";

console.log("🔧 Leaderboard API_BASE_URL set to:", API_BASE_URL);

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

/**
 * Submit a completed race time to the leaderboard
 */
export async function submitScore(
  jwt: string, 
  playerName: string, 
  completionTime: number
): Promise<{ rank: number; total_players: number }> {
  const fullUrl = `${API_BASE_URL}/leaderboard/submit`;
  console.log("🏆 Submitting score to:", fullUrl);
  console.log("📊 Score data:", { playerName, completionTime });
  
  try {
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
      "X-API-Key": import.meta.env.VITE_API_KEY || process.env.API_KEY || "",
    };

    console.log("📋 Request headers:", {
      ...headers,
      Authorization: jwt ? `Bearer ${jwt.substring(0, 20)}...` : "Missing",
      "X-API-Key": headers["X-API-Key"] ? `${headers["X-API-Key"].substring(0, 10)}...` : "Missing"
    });

    const response = await fetch(fullUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        amusement_id: GAME_CONFIG.AMUSEMENT_ID,
        player_name: playerName,
        completion_time: completionTime,
      }),
    });

    console.log("📡 Score submission response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Score submission failed:", errorText);
      
      let errorMessage: string;
      if (response.status === 401) {
        errorMessage = "Authentication failed - invalid JWT token";
      } else if (response.status === 403) {
        errorMessage = "Access forbidden - API key may be invalid";
      } else if (response.status === 404) {
        errorMessage = "Leaderboard endpoint not found";
      } else {
        errorMessage = `Failed to submit score: ${response.status} ${response.statusText}`;
      }

      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log("✅ Score submitted successfully:", result);
    return result;
  } catch (error) {
    console.error("💥 Error submitting score:", error);
    throw error;
  }
}

/**
 * Fetch the leaderboard for the game
 */
export async function getLeaderboard(
  jwt: string,
  limit: number = 10
): Promise<LeaderboardResponse> {
  const fullUrl = `${API_BASE_URL}/leaderboard?amusement_id=${GAME_CONFIG.AMUSEMENT_ID}&limit=${limit}`;
  console.log("📋 Fetching leaderboard from:", fullUrl);
  
  try {
    const headers = {
      Authorization: `Bearer ${jwt}`,
      "X-API-Key": import.meta.env.VITE_API_KEY || process.env.API_KEY || "",
    };

    console.log("📋 Request headers:", {
      Authorization: jwt ? `Bearer ${jwt.substring(0, 20)}...` : "Missing",
      "X-API-Key": headers["X-API-Key"] ? `${headers["X-API-Key"].substring(0, 10)}...` : "Missing"
    });

    const response = await fetch(fullUrl, {
      method: "GET",
      headers,
    });

    console.log("📡 Leaderboard fetch response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Leaderboard fetch failed:", errorText);
      
      let errorMessage: string;
      if (response.status === 401) {
        errorMessage = "Authentication failed - invalid JWT token";
      } else if (response.status === 403) {
        errorMessage = "Access forbidden - API key may be invalid";
      } else if (response.status === 404) {
        errorMessage = "Leaderboard endpoint not found";
      } else {
        errorMessage = `Failed to fetch leaderboard: ${response.status} ${response.statusText}`;
      }

      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log("✅ Leaderboard fetched successfully:", result);
    return result;
  } catch (error) {
    console.error("💥 Error fetching leaderboard:", error);
    throw error;
  }
}