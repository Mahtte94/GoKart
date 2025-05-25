import { GAME_CONFIG } from "../context/gameConfig";

// Dynamiskt API-base-URL beroende på miljö
const API_BASE_URL = import.meta.env.DEV
  ? "/api"
  : import.meta.env.VITE_API_URL || "/api";

// Den här funktionen skickar transaktionen till API:t
async function postTransaction(
  jwt: string,
  payload: Record<string, unknown>
): Promise<void> {
  try {
    console.log("Sending transaction:", payload);
    console.log("Using API key:", GAME_CONFIG.API_KEY);
    console.log("Using JWT:", jwt?.substring(0, 20) + "...");
    
    const res = await fetch(`${API_BASE_URL}/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt}`,
        "X-API-Key": GAME_CONFIG.API_KEY, // ✅ Use the correct API key
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

    const responseData = await res.text();
    console.log("Transaction successful:", responseData);
  } catch (err: unknown) {
    console.error("Transaction error:", err);
    const message =
      err instanceof Error ? err.message : "Unknown error during transaction";
    throw new Error(message);
  }
}

// Används för att rapportera ett spel (drar pengar)
export async function buyTicket(jwt: string): Promise<void> {
  return postTransaction(jwt, {
    amusement_id: GAME_CONFIG.AMUSEMENT_ID,
    group_id: GAME_CONFIG.GROUP_ID,
    stake_amount: GAME_CONFIG.COST,
    // user_id is passed via JWT token
  });
}

// Används för att rapportera vinst (ger pengar)
export async function reportPayout(jwt: string, amount: number): Promise<void> {
  return postTransaction(jwt, {
    amusement_id: GAME_CONFIG.AMUSEMENT_ID,
    group_id: GAME_CONFIG.GROUP_ID,
    payout_amount: amount,
    stamp_id: GAME_CONFIG.STAMP_ID,
    // user_id is passed via JWT token
  });
}

// Om du behöver ge stämpel istället för/utöver pengar
export async function awardStamp(jwt: string): Promise<void> {
  return postTransaction(jwt, {
    amusement_id: GAME_CONFIG.AMUSEMENT_ID,
    group_id: GAME_CONFIG.GROUP_ID,
    stamp_id: GAME_CONFIG.STAMP_ID,
    // user_id is passed via JWT token
  });
}