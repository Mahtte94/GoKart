import { useEffect, useState } from "react";
import TivoliApiService from "../api/TivoliApiService";

export function useTivoliAuth() {
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const initialToken = TivoliApiService.getToken();
    if (initialToken) {
      setToken(initialToken);
      setIsAuthenticated(true);
    }

    const handleTokenReceived = () => {
      const newToken = TivoliApiService.getToken();
      if (newToken) {
        setToken(newToken);
        setIsAuthenticated(true);
      }
    };

    window.addEventListener("tivoliTokenReceived", handleTokenReceived);

    return () => {
      window.removeEventListener("tivoliTokenReceived", handleTokenReceived);
    };
  }, []);

  return { token, isAuthenticated };
}
