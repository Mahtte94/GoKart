import { useEffect } from "react";

interface JwtListenerProps {
  onTokenReceived?: (token: string) => void;
}

export default function JwtListener({ onTokenReceived }: JwtListenerProps) {
  useEffect(() => {
    // Check if we're in an iframe
    const isInIframe = window.parent !== window;
    
    console.log("[JwtListener] Starting JWT listener");
    console.log("[JwtListener] In iframe:", isInIframe);
    console.log("[JwtListener] Current origin:", window.location.origin);
    
    // Send GAME_READY message to parent if we're in an iframe
    if (isInIframe) {
      try {
        const message = { 
          type: "GAME_READY", 
          origin: window.location.origin,
          timestamp: Date.now()
        };
        console.log("[JwtListener] Sending GAME_READY message:", message);
        window.parent.postMessage(message, "*");
      } catch (err) {
        console.error("[JwtListener] Failed to send GAME_READY:", err);
      }
    }

    // Listen for token from parent window
    const handleMessage = (event: MessageEvent) => {
      console.log("[JwtListener] Received message:", event);
      console.log("[JwtListener] Message origin:", event.origin);
      console.log("[JwtListener] Message data:", event.data);
      
      // More permissive origin checking for development
      const allowedOrigins = [
        'https://tivoli.yrgobanken.vip',
        'https://yrgobanken.vip',
        'http://localhost:3000',
        'http://localhost:8080',
        'http://127.0.0.1:3000',
        // Add vercel domains for testing
        'https://go-kart-nine.vercel.app',
        // Allow same origin for embedded testing
        window.location.origin
      ];
      
      // In development, be more permissive
      const isDevelopment = process.env.NODE_ENV === 'development' || 
                           window.location.hostname === 'localhost';
      
      if (!isDevelopment && !allowedOrigins.includes(event.origin)) {
        console.log("[JwtListener] Message from disallowed origin:", event.origin);
        return;
      }

      const data = event.data;
      let jwt: string | null = null;

      // Check different formats the token might come in
      if (typeof data === "object" && data !== null) {
        // Standard formats
        if (data.jwt) jwt = data.jwt;
        else if (data.token) jwt = data.token;
        else if (data.type === "JWT_TOKEN" && data.token) jwt = data.token;
        else if (data.type === "INIT" && data.jwt) jwt = data.jwt;
        else if (data.type === "AUTH" && data.jwt) jwt = data.jwt;
        else if (data.type === "TOKEN" && data.value) jwt = data.value;
        
        // Tivoli specific formats (based on the API docs)
        else if (data.type === "TIVOLI_AUTH" && data.jwt) jwt = data.jwt;
        else if (data.authentication && data.authentication.jwt) jwt = data.authentication.jwt;
      } else if (typeof data === "string") {
        // Direct JWT string (starts with eyJ for JWT header)
        if (data.startsWith("eyJ")) {
          jwt = data;
        }
      }

      if (jwt && typeof jwt === "string") {
        console.log("[JwtListener] Valid JWT received:", jwt.substring(0, 50) + "...");
        
        // Validate JWT structure (should have 3 parts separated by dots)
        const jwtParts = jwt.split('.');
        if (jwtParts.length !== 3) {
          console.error("[JwtListener] Invalid JWT format - should have 3 parts");
          return;
        }
        
        try {
          // Try to decode the payload to validate
          const payload = JSON.parse(atob(jwtParts[1]));
          console.log("[JwtListener] JWT payload:", payload);
          
          // Check if token is expired
          if (payload.exp && payload.exp < Date.now() / 1000) {
            console.error("[JwtListener] JWT token is expired");
            return;
          }
          
          // Store token
          localStorage.setItem("token", jwt);
          console.log("[JwtListener] Token stored successfully");
          
          // Notify App component
          if (onTokenReceived) {
            onTokenReceived(jwt);
          }
          
          // Also dispatch event for other components
          window.dispatchEvent(new CustomEvent("token_received", { detail: jwt }));
          
        } catch (error) {
          console.error("[JwtListener] Failed to decode JWT:", error);
        }
      } else {
        console.log("[JwtListener] No valid JWT found in message");
      }
    };

    window.addEventListener("message", handleMessage);
    console.log("[JwtListener] Message listener added");

    // Send periodic GAME_READY messages for first 10 seconds if no token
    let retryCount = 0;
    const maxRetries = 5;
    const retryInterval = 2000; // 2 seconds

    const retryGameReady = () => {
      if (!localStorage.getItem("token") && isInIframe && retryCount < maxRetries) {
        retryCount++;
        console.log(`[JwtListener] Retry ${retryCount}/${maxRetries} - Sending GAME_READY`);
        try {
          window.parent.postMessage({ 
            type: "GAME_READY", 
            retry: retryCount,
            timestamp: Date.now()
          }, "*");
        } catch (err) {
          console.error("[JwtListener] Retry failed:", err);
        }
        
        setTimeout(retryGameReady, retryInterval);
      }
    };

    // Start retry sequence after initial delay
    const initialTimeout = setTimeout(retryGameReady, 1000);

    return () => {
      window.removeEventListener("message", handleMessage);
      clearTimeout(initialTimeout);
      console.log("[JwtListener] Cleanup completed");
    };
  }, [onTokenReceived]);

  return null;
}