
import { useEffect } from "react";

interface JwtListenerProps {
  onTokenReceived?: (token: string) => void;
}

export default function JwtListener({ onTokenReceived }: JwtListenerProps) {
  useEffect(() => {
    console.log("[JwtListener] Initializing...");
    
    // Check if we're in an iframe
    const isInIframe = window.parent !== window;
    console.log("[JwtListener] Is in iframe:", isInIframe);
    
    // Send GAME_READY message to parent if we're in an iframe
    if (isInIframe) {
      try {
        console.log("[JwtListener] Sending GAME_READY to parent");
        // Send to any origin during development
        window.parent.postMessage({ type: "GAME_READY" }, "*");
        
        // Also try common message formats
        window.parent.postMessage({ type: "READY" }, "*");
        window.parent.postMessage({ action: "ready" }, "*");
        window.parent.postMessage("ready", "*");
      } catch (err) {
        console.error("[JwtListener] Failed to send GAME_READY:", err);
      }
    }

    // Listen for token from parent window
    const handleMessage = (event: MessageEvent) => {
      console.log("[JwtListener] Message received from:", event.origin);
      console.log("[JwtListener] Message data:", event.data);
      
      // In development, temporarily accept all origins
      const isDev = process.env.NODE_ENV === "development";
      const allowedOrigins = [
        'https://tivoli.yrgobanken.vip',
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3000',
      ];
      
      if (!isDev && !allowedOrigins.includes(event.origin) && event.origin !== window.location.origin) {
        console.log("[JwtListener] Origin not allowed, ignoring message");
        return;
      }
      
      const data = event.data;
      let jwt: string | null = null;

      // Check many different formats the token might come in
      if (typeof data === "object" && data !== null) {
        // Common token field names
        const tokenFields = ['jwt', 'token', 'access_token', 'authToken', 'accessToken', 'jwtToken'];
        
        for (const field of tokenFields) {
          if (data[field] && typeof data[field] === 'string') {
            jwt = data[field];
            console.log(`[JwtListener] Found token in field: ${field}`);
            break;
          }
        }
        
        // Check for nested structures
        if (!jwt && data.data) {
          for (const field of tokenFields) {
            if (data.data[field] && typeof data.data[field] === 'string') {
              jwt = data.data[field];
              console.log(`[JwtListener] Found token in data.${field}`);
              break;
            }
          }
        }
        
        // Check for type-based messages
        if (!jwt && data.type) {
          const tokenTypes = ['JWT_TOKEN', 'TOKEN', 'INIT', 'AUTH', 'AUTHENTICATE'];
          if (tokenTypes.includes(data.type)) {
            jwt = data.token || data.jwt || data.payload;
            if (jwt) {
              console.log(`[JwtListener] Found token with type: ${data.type}`);
            }
          }
        }
      } else if (typeof data === "string") {
        // Check if it's a JWT (starts with eyJ)
        if (data.startsWith("eyJ")) {
          jwt = data;
          console.log("[JwtListener] Found token as string");
        }
        // Check if it's a JSON string
        else {
          try {
            const parsed = JSON.parse(data);
            if (parsed.token || parsed.jwt) {
              jwt = parsed.token || parsed.jwt;
              console.log("[JwtListener] Found token in JSON string");
            }
          } catch {
            // Not JSON, ignore
          }
        }
      }

      if (jwt && typeof jwt === "string") {
        console.log("[JwtListener] Valid token found, storing...");
        localStorage.setItem("token", jwt);
        
        // Notify App component
        if (onTokenReceived) {
          onTokenReceived(jwt);
        }
        
        // Dispatch multiple events to ensure they're caught
        window.dispatchEvent(new CustomEvent("token_received", { detail: jwt }));
        window.dispatchEvent(new CustomEvent("tivoliTokenReceived", { detail: jwt }));
        window.dispatchEvent(new Event("storage"));
      } else {
        console.log("[JwtListener] No valid token found in message");
      }
    };

    window.addEventListener("message", handleMessage);

    // Retry sending GAME_READY every 2 seconds if no token received
    let retryCount = 0;
    const maxRetries = 5;
    
    const retryInterval = setInterval(() => {
      if (!localStorage.getItem("token") && isInIframe && retryCount < maxRetries) {
        retryCount++;
        console.log(`[JwtListener] Retry ${retryCount}: Sending GAME_READY again`);
        window.parent.postMessage({ type: "GAME_READY" }, "*");
        window.parent.postMessage({ type: "READY" }, "*");
        window.parent.postMessage("ready", "*");
      } else {
        clearInterval(retryInterval);
      }
    }, 2000);

    return () => {
      window.removeEventListener("message", handleMessage);
      clearInterval(retryInterval);
    };
  }, [onTokenReceived]);

  return null;
}