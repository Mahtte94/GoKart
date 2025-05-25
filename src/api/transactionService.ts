import { GAME_CONFIG } from "../context/gameConfig";

// src/api/transactionService.ts
const API_BASE_URL = import.meta.env.DEV
  ? "/api"
  : import.meta.env.VITE_API_URL || "/api";

// Den här funktionen skickar transaktionen till API:t
async function postTransaction(
  jwt: string,
  payload: Record<string, unknown>
): Promise<void> {
  console.log("API_BASE_URL is:", API_BASE_URL);

  try {
    console.log("Sending transaction with payload:", payload);
    console.log(
      "Using JWT token (first 10 chars):",
      jwt.substring(0, 10) + "..."
    );

    const res = await fetch(`${API_BASE_URL}/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt}`,
        "X-API-Key": GAME_CONFIG.API_KEY,
      },
      body: JSON.stringify(payload),
    });

    console.log("Transaction response status:", res.status);

    if (!res.ok) {
      const text = await res.text();
      console.error("Transaction failed with response:", text);

      let errorData: { error?: string; message?: string } = {};
      try {
        errorData = JSON.parse(text);
      } catch {
        errorData = { error: "Invalid error format from API" };
      }

      throw new Error(
        errorData.error || errorData.message || "Transaction failed"
      );
    }

    console.log("Transaction successful");
  } catch (err: unknown) {
    console.error("Transaction error:", err);
    const message =
      err instanceof Error ? err.message : "Unknown error during transaction";
    throw new Error(message);
  }
}

// Används för att rapportera ett spel (drar pengar)
export async function buyTicket(jwt: string): Promise<void> {
  console.log("Buying ticket with amusement ID:", GAME_CONFIG.AMUSEMENT_ID);
  return postTransaction(jwt, {
    amusement_id: GAME_CONFIG.AMUSEMENT_ID,
    group_id: GAME_CONFIG.GROUP_ID, // Add this to your game config
    stake_amount: GAME_CONFIG.COST,

    // user_id is passed via JWT token
  });
}

// Används för att rapportera vinst (ger pengar)
export async function reportPayout(jwt: string, amount: number): Promise<void> {
  console.log("Reporting payout of amount:", amount);
  return postTransaction(jwt, {
    amusement_id: GAME_CONFIG.AMUSEMENT_ID,
    group_id: GAME_CONFIG.GROUP_ID, // Add this to your game config
    payout_amount: amount,
    stamp_id: GAME_CONFIG.STAMP_ID,
    // user_id is passed via JWT token
  });
}

// Om du behöver ge stämpel istället för/utöver pengar
export async function awardStamp(jwt: string): Promise<void> {
  console.log("Awarding stamp with stamp ID:", GAME_CONFIG.STAMP_ID);
  return postTransaction(jwt, {
    amusement_id: GAME_CONFIG.AMUSEMENT_ID,
    group_id: GAME_CONFIG.GROUP_ID, // Add this to your game config
    stamp_id: GAME_CONFIG.STAMP_ID,
    // user_id is passed via JWT token
  });
}
