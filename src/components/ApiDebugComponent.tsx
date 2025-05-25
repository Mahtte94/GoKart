// src/components/ApiDebugComponent.tsx
// This is a temporary debugging component - remove in production
import React, { useState } from 'react';
import TivoliApiService from '../api/TivoliApiService';
import { GAME_CONFIG } from '../context/gameConfig';

const ApiDebugComponent: React.FC = () => {
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const clearResults = () => {
    setResults([]);
  };

  const testConnection = async () => {
    setLoading(true);
    addResult("=== API Connection Test ===");
    
    try {
      const token = TivoliApiService.getToken();
      addResult(`Token exists: ${!!token}`);
      addResult(`Token valid: ${TivoliApiService.isTokenValid()}`);
      
      if (token) {
        addResult(`Token preview: ${token.substring(0, 20)}...`);
        
        // Try to decode JWT to see payload
        try {
          const parts = token.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
            addResult(`JWT payload: ${JSON.stringify(payload, null, 2)}`);
            
            // Check if token is expired
            const now = Math.floor(Date.now() / 1000);
            if (payload.exp && payload.exp < now) {
              addResult("⚠️ Token is EXPIRED");
            } else {
              addResult("✓ Token is not expired");
            }
          }
        } catch (e) {
          addResult("❌ Could not decode JWT token");
        }
      }
      
      addResult(`Config: amusement_id=${GAME_CONFIG.AMUSEMENT_ID}, api_key=${GAME_CONFIG.API_KEY.substring(0, 10)}...`);
      addResult(`API Base URL: ${import.meta.env.DEV ? "/api (proxied)" : "/api"}`);
      
      if (token) {
        addResult("--- Testing Spin Transaction ---");
        try {
          await TivoliApiService.reportSpin();
          addResult("✓ Spin transaction successful");
        } catch (error) {
          addResult(`❌ Spin failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      } else {
        addResult("❌ No token available for testing");
      }
    } catch (error) {
      addResult(`❌ General test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const testRawAPI = async () => {
    setLoading(true);
    addResult("=== Raw API Test ===");
    
    const token = TivoliApiService.getToken();
    if (!token) {
      addResult("❌ No token available");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        amusement_id: GAME_CONFIG.AMUSEMENT_ID.toString(),
        stake_amount: GAME_CONFIG.COST,
      };

      addResult(`Making raw request to: ${import.meta.env.DEV ? "/api" : "/api"}/transactions`);
      addResult(`Payload: ${JSON.stringify(payload, null, 2)}`);

      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-API-Key': GAME_CONFIG.API_KEY,
        },
        body: JSON.stringify(payload)
      });

      addResult(`Response status: ${response.status} ${response.statusText}`);
      addResult(`Response headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2)}`);

      const responseText = await response.text();
      addResult(`Response body: ${responseText}`);

      if (response.ok) {
        addResult("✓ Raw API call successful");
      } else {
        addResult("❌ Raw API call failed");
      }
    } catch (error) {
      addResult(`❌ Raw API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const testToken = () => {
    // Set a test token for development
    localStorage.setItem("token", "test-token-for-development");
    addResult("Test token set for development");
  };

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white p-4 rounded-lg shadow-lg max-w-md z-50">
      <h3 className="text-sm font-bold mb-2">API Debug Panel</h3>
      
      <div className="flex gap-1 mb-2 flex-wrap">
        <button
          onClick={testToken}
          className="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs"
        >
          Set Test Token
        </button>
        <button
          onClick={testConnection}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-xs disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test API'}
        </button>
        <button
          onClick={testRawAPI}
          disabled={loading}
          className="bg-yellow-600 hover:bg-yellow-700 px-2 py-1 rounded text-xs disabled:opacity-50"
        >
          Raw API Test
        </button>
        <button
          onClick={clearResults}
          className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs"
        >
          Clear
        </button>
      </div>
      
      <div className="max-h-40 overflow-y-auto bg-gray-800 p-2 rounded text-xs">
        {results.length === 0 ? (
          <p className="text-gray-400">No test results yet</p>
        ) : (
          results.map((result, i) => (
            <div key={i} className="mb-1">
              {result}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ApiDebugComponent;