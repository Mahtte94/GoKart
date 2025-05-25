import { GAME_CONFIG } from "../context/gameConfig";

// Dynamiskt API-base-URL beroende på miljö
const API_BASE_URL = import.meta.env.DEV
  ? "/api"
  : import.meta.env.VITE_API_URL || "/api";



 
  
  // Enhanced transaction function with better error handling
  async function postTransaction(
    jwt: string,
    payload: Record<string, unknown>
  ): Promise<void> {
    const fullUrl = `${API_BASE_URL}/transactions`;
    console.log("🚀 Making transaction request to:", fullUrl);
    console.log("📦 Payload:", payload);
    console.log("🔑 JWT present:", !!jwt);
    console.log("🔐 API Key present:", !!(import.meta.env.VITE_API_KEY || process.env.API_KEY));
    
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
  
      const res = await fetch(fullUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
  
      console.log("📡 Response status:", res.status);
      console.log("📡 Response statusText:", res.statusText);
  
      if (!res.ok) {
        const text = await res.text();
        console.error("❌ Transaction failed with response:", text);
        
        // Enhanced error handling based on common issues
        let errorMessage: string;
        
        if (res.status === 401) {
          errorMessage = "Authentication failed - JWT token may be invalid or expired";
        } else if (res.status === 403) {
          errorMessage = "Access forbidden - API key may be missing or invalid";
        } else if (res.status === 404) {
          errorMessage = "API endpoint not found - check if the API is deployed";
        } else if (res.status === 400) {
          errorMessage = "Bad request - check payload format";
        } else if (text.includes("ROUTER_EXTERNAL_TARGET_CONNECTION_ERROR")) {
          errorMessage = "Tivoli API service is temporarily unavailable";
        } else {
          errorMessage = `API request failed: ${res.status} ${res.statusText}`;
        }
  
        // Try to parse JSON error if possible
        try {
          const errorData = JSON.parse(text);
          if (errorData.error || errorData.message) {
            errorMessage = errorData.error || errorData.message;
          }
        } catch {
          // Use the errorMessage we already determined
        }
  
        throw new Error(errorMessage);
      }
  
      console.log("✅ Transaction successful");
    } catch (err: unknown) {
      console.error("💥 Transaction error:", err);
      
      if (err instanceof TypeError && err.message.includes("fetch")) {
        throw new Error("Network error: Unable to connect to Tivoli API. Check internet connection.");
      }
      
      const message = err instanceof Error ? err.message : "Unknown error during transaction";
      throw new Error(message);
    }
  }
  
  // Används för att rapportera ett spel (drar pengar)
  export async function buyTicket(jwt: string): Promise<void> {
    console.log("🎫 buyTicket called");
    return postTransaction(jwt, {
      amusement_id: GAME_CONFIG.AMUSEMENT_ID,
      group_id: GAME_CONFIG.GROUP_ID,
      stake_amount: GAME_CONFIG.COST,
    });
  }
  
  // Används för att rapportera vinst (ger pengar)
  export async function reportPayout(jwt: string, amount: number): Promise<void> {
    console.log("💰 reportPayout called with amount:", amount);
    return postTransaction(jwt, {
      amusement_id: GAME_CONFIG.AMUSEMENT_ID,
      group_id: GAME_CONFIG.GROUP_ID,
      stamp_id: GAME_CONFIG.STAMP_ID,
    });
  }
  
  // Om du behöver ge stämpel istället för/utöver pengar
  export async function awardStamp(jwt: string): Promise<void> {
    console.log("🏷️ awardStamp called");
    return postTransaction(jwt, {
      amusement_id: GAME_CONFIG.AMUSEMENT_ID,
      group_id: GAME_CONFIG.GROUP_ID,
      stamp_id: GAME_CONFIG.STAMP_ID,
    });
  }