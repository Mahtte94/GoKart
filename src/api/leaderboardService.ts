// src/api/leaderboardService.ts
import { GAME_CONFIG } from "../context/gameConfig";

const API_BASE_URL = import.meta.env.DEV
  ? "/api"
  : import.meta.env.VITE_API_URL || "/api";

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
  console.log(`Submitting score: ${completionTime}s for player: ${playerName}`);
  
  try {
    const payload = {
      amusement_id: GAME_CONFIG.AMUSEMENT_ID.toString(), // Convert to string
      player_name: playerName,
      completion_time: completionTime,
    };

    console.log("Submitting score with payload:", payload);

    const response = await fetch(`${API_BASE_URL}/leaderboard/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt}`,
        "X-API-Key": GAME_CONFIG.API_KEY, // Use API key from game config
      },
      body: JSON.stringify(payload),
    });

    console.log("Score submission response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Score submission failed:", errorText);
      console.error("Response headers:", [...response.headers.entries()]);
      throw new Error(`Failed to submit score: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log("Score submitted successfully:", result);
    return result;
  } catch (error) {
    console.error("Error submitting score:", error);
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
  console.log("Fetching leaderboard...");
  
  try {
    const url = `${API_BASE_URL}/leaderboard?amusement_id=${GAME_CONFIG.AMUSEMENT_ID}&limit=${limit}`;
    console.log("Fetching leaderboard from URL:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${jwt}`,
        "X-API-Key": GAME_CONFIG.API_KEY, // Use API key from game config
      },
    });

    console.log("Leaderboard fetch response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Leaderboard fetch failed:", errorText);
      console.error("Response headers:", [...response.headers.entries()]);
      throw new Error(`Failed to fetch leaderboard: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log("Leaderboard fetched successfully:", result);
    return result;
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    throw error;
  }
}