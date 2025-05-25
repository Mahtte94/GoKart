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
  console.log("Sending transaction request:", {
    url: `${API_BASE_URL}/transactions`,
    payload,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt ? jwt.substring(0, 20) + '...' : 'null'}`,
      "X-API-Key": GAME_CONFIG.API_KEY.substring(0, 10) + '...',
    }
  });

  try {
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
    console.log("Transaction response headers:", Object.fromEntries(res.headers.entries()));

    if (!res.ok) {
      const text = await res.text();
      console.error("Transaction failed:", {
        status: res.status,
        statusText: res.statusText,
        responseText: text,
        headers: Object.fromEntries(res.headers.entries())
      });

      // Try to parse as JSON first, but handle plain text responses
      let errorMessage = `Transaction failed with status ${res.status}`;
      try {
        const errorData = JSON.parse(text);
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        // If it's not JSON, use the plain text response
        if (text && text.trim()) {
          errorMessage = `${errorMessage}: ${text.trim()}`;
        }
      }

      throw new Error(errorMessage);
    }

    // Handle successful response
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const responseData = await res.json();
      console.log("Transaction successful:", responseData);
    } else {
      const responseText = await res.text();
      console.log("Transaction successful (text response):", responseText);
    }
  } catch (err: unknown) {
    console.error("Transaction error:", err);
    if (err instanceof Error) {
      throw err; // Re-throw the original error with proper message
    } else {
      throw new Error("Unknown error during transaction");
    }
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