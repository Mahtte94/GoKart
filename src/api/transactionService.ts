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
    const res = await fetch(`${API_BASE_URL}/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt}`,
        "X-API-Key": GAME_CONFIG.API_KEY, // Use the API key from game config
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Transaction failed with response:", text);
      console.error("Response status:", res.status);
      console.error("Response headers:", [...res.headers.entries()]);

      let errorData: { error?: string; message?: string } = {};
      try {
        errorData = JSON.parse(text);
      } catch {
        errorData = { error: "Invalid error format from API" };
      }

      throw new Error(
        errorData.error || errorData.message || `Transaction failed with status ${res.status}`
      );
    }

    const responseData = await res.json();
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
  console.log("Sending buyTicket transaction with payload:", {
    amusement_id: GAME_CONFIG.AMUSEMENT_ID.toString(),
    stake_amount: GAME_CONFIG.COST,
  });

  return postTransaction(jwt, {
    amusement_id: GAME_CONFIG.AMUSEMENT_ID.toString(), // Convert to string
    stake_amount: GAME_CONFIG.COST,
    // Removed group_id as it's not in the API spec
  });
}

// Används för att rapportera vinst (ger pengar)
export async function reportPayout(jwt: string, amount: number): Promise<void> {
  console.log("Sending reportPayout transaction with payload:", {
    amusement_id: GAME_CONFIG.AMUSEMENT_ID.toString(),
    payout_amount: amount,
    stamp_id: GAME_CONFIG.STAMP_ID.toString(),
  });

  return postTransaction(jwt, {
    amusement_id: GAME_CONFIG.AMUSEMENT_ID.toString(), // Convert to string
    payout_amount: amount,
    stamp_id: GAME_CONFIG.STAMP_ID.toString(), // Convert to string
    // Removed group_id as it's not in the API spec
  });
}

// Om du behöver ge stämpel istället för/utöver pengar
export async function awardStamp(jwt: string): Promise<void> {
  console.log("Sending awardStamp transaction with payload:", {
    amusement_id: GAME_CONFIG.AMUSEMENT_ID.toString(),
    stamp_id: GAME_CONFIG.STAMP_ID.toString(),
  });

  return postTransaction(jwt, {
    amusement_id: GAME_CONFIG.AMUSEMENT_ID.toString(), // Convert to string
    stamp_id: GAME_CONFIG.STAMP_ID.toString(), // Convert to string
    // Removed group_id as it's not in the API spec
  });
}