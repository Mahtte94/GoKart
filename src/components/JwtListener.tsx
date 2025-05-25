
import { useEffect } from "react";

interface JwtListenerProps {
  onTokenReceived?: (token: string) => void;
}

export default function JwtListener({ onTokenReceived }: JwtListenerProps) {
  useEffect(() => {
    // DON'T clear token on load - only update when we receive a new one
    
    // Check if we're in an iframe
    const isInIframe = window.parent !== window;
    
    // Send GAME_READY message to parent if we're in an iframe
    if (isInIframe) {
      try {
        
        window.parent.postMessage({ type: "GAME_READY" }, "*");
      } catch (err) {
        console.error("[JwtListener] Failed to send GAME_READY:", err);
      }
    } 

    // Listen for token from parent window
    const handleMessage = (event: MessageEvent) => {
      // Validate origin - Tivoli's domain
      const allowedOrigins = [
        'https://tivoli.yrgobanken.vip',
        'http://localhost:3000', // for dev testing
      ];
      
      if (!allowedOrigins.includes(event.origin)) {
        return; // Ignore messages from other origins
      }
      

      
      const data = event.data;
      let jwt: string | null = null;

      // Check different formats the token might come in
      if (typeof data === "object") {
        if (data.jwt) jwt = data.jwt;
        else if (data.token) jwt = data.token;
        else if (data.type === "JWT_TOKEN" && data.token) jwt = data.token;
        else if (data.type === "INIT" && data.jwt) jwt = data.jwt; // Common pattern
      } else if (typeof data === "string" && data.startsWith("eyJ")) {
        jwt = data;
      }

      if (jwt && typeof jwt === "string") {
        localStorage.setItem("token", jwt);
        
        // Notify App component
        if (onTokenReceived) {
          onTokenReceived(jwt);
        }
        
        // Also dispatch event for other components
        window.dispatchEvent(new CustomEvent("token_received", { detail: jwt }));
      }
    };

    window.addEventListener("message", handleMessage);

    // If no token after 3 seconds and in iframe, resend GAME_READY
    const retryTimeout = setTimeout(() => {
      if (!localStorage.getItem("token") && isInIframe) {
        window.parent.postMessage({ type: "GAME_READY" }, "*");
      }
    }, 3000);

    return () => {
      window.removeEventListener("message", handleMessage);
      clearTimeout(retryTimeout);
    };
  }, [onTokenReceived]);

  return null;
}