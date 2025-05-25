import { useEffect, useRef } from "react";

interface JwtListenerProps {
  onTokenReceived?: (token: string) => void;
}

export default function JwtListener({ onTokenReceived }: JwtListenerProps) {
  const hasInitialized = useRef(false);
  const checkInterval = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;
    
    console.log("[JwtListener] Starting comprehensive token detection...");
    
    // Function to check all possible token locations
    const findToken = (): string | null => {
      // 1. Check URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const urlToken = urlParams.get("token") || urlParams.get("jwt") || urlParams.get("auth");
      if (urlToken) {
        console.log("[JwtListener] Found token in URL params");
        return urlToken;
      }
      
      // 2. Check hash parameters
      if (window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const hashToken = hashParams.get("token") || hashParams.get("jwt") || hashParams.get("auth");
        if (hashToken) {
          console.log("[JwtListener] Found token in hash params");
          return hashToken;
        }
      }
      
      // 3. Check localStorage
      const localToken = localStorage.getItem("token") || localStorage.getItem("jwt");
      if (localToken && localToken !== "null" && localToken !== "undefined") {
        console.log("[JwtListener] Found token in localStorage");
        return localToken;
      }
      
      // 4. Check sessionStorage
      const sessionToken = sessionStorage.getItem("token") || sessionStorage.getItem("jwt");
      if (sessionToken) {
        console.log("[JwtListener] Found token in sessionStorage");
        return sessionToken;
      }
      
      // 5. Check global window variables
      const windowAny = window as any;
      if (windowAny.jwt || windowAny.token || windowAny.JWT_TOKEN) {
        console.log("[JwtListener] Found token in window object");
        return windowAny.jwt || windowAny.token || windowAny.JWT_TOKEN;
      }
      
      // 6. Check document cookies
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if ((name === 'token' || name === 'jwt') && value) {
          console.log("[JwtListener] Found token in cookies");
          return value;
        }
      }
      
      return null;
    };
    
    // Check immediately
    const immediateToken = findToken();
    if (immediateToken) {
      localStorage.setItem("token", immediateToken);
      if (onTokenReceived) {
        onTokenReceived(immediateToken);
      }
      window.dispatchEvent(new CustomEvent("token_received", { detail: immediateToken }));
      return;
    }
    
    // Set up periodic checking (every 500ms for 10 seconds)
    let checkCount = 0;
    const maxChecks = 20;
    
    checkInterval.current = setInterval(() => {
      checkCount++;
      console.log(`[JwtListener] Checking for token... (attempt ${checkCount}/${maxChecks})`);
      
      const token = findToken();
      if (token) {
        console.log("[JwtListener] Token found!");
        localStorage.setItem("token", token);
        if (onTokenReceived) {
          onTokenReceived(token);
        }
        window.dispatchEvent(new CustomEvent("token_received", { detail: token }));
        
        if (checkInterval.current) {
          clearInterval(checkInterval.current);
        }
      } else if (checkCount >= maxChecks) {
        console.log("[JwtListener] Stopped checking for token after 10 seconds");
        if (checkInterval.current) {
          clearInterval(checkInterval.current);
        }
      }
    }, 500);
    
    // Also listen for postMessage (keep existing approach)
    const handleMessage = (event: MessageEvent) => {
      console.log("[JwtListener] Message received:", event.origin, event.data);
      
      // Don't check origin in development
      if (process.env.NODE_ENV === "production") {
        const allowedOrigins = ['https://tivoli.yrgobanken.vip'];
        if (!allowedOrigins.includes(event.origin)) {
          return;
        }
      }
      
      const data = event.data;
      let jwt: string | null = null;
      
      if (typeof data === "string" && data.startsWith("eyJ")) {
        jwt = data;
      } else if (typeof data === "object" && data) {
        jwt = data.jwt || data.token || data.access_token || data.authToken;
      }
      
      if (jwt) {
        console.log("[JwtListener] Token received via postMessage!");
        localStorage.setItem("token", jwt);
        if (onTokenReceived) {
          onTokenReceived(jwt);
        }
        window.dispatchEvent(new CustomEvent("token_received", { detail: jwt }));
      }
    };
    
    window.addEventListener("message", handleMessage);
    
    // Send ready message to parent (if in iframe)
    if (window.parent !== window) {
      console.log("[JwtListener] Sending ready signal to parent");
      
      // Try multiple approaches
      setTimeout(() => {
        // Standard postMessage
        window.parent.postMessage({ type: "GAME_READY" }, "*");
        window.parent.postMessage("ready", "*");
        
        // Try dispatching events on the iframe element
        try {
          if (window.frameElement) {
            window.frameElement.dispatchEvent(new Event("load"));
            window.frameElement.dispatchEvent(new CustomEvent("gameready"));
          }
        } catch (e) {
          console.log("[JwtListener] Cannot access frameElement");
        }
      }, 100);
    }
    
    return () => {
      if (checkInterval.current) {
        clearInterval(checkInterval.current);
      }
      window.removeEventListener("message", handleMessage);
      hasInitialized.current = false;
    };
  }, [onTokenReceived]);
  
  return null;
}