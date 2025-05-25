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
    addResult("Testing API connection...");
    
    try {
      // Test basic API connectivity
      const token = TivoliApiService.getToken();
      addResult(`Token exists: ${!!token}`);
      addResult(`Token valid: ${TivoliApiService.isTokenValid()}`);
      addResult(`Config: amusement_id=${GAME_CONFIG.AMUSEMENT_ID}, api_key=${GAME_CONFIG.API_KEY.substring(0, 10)}...`);
      
      if (token) {
        addResult("Testing spin transaction...");
        await TivoliApiService.reportSpin();
        addResult("✓ Spin transaction successful");
        
        addResult("Testing payout transaction...");
        await TivoliApiService.reportWinnings(1);
        addResult("✓ Payout transaction successful");
        
        addResult("Testing stamp transaction...");
        await TivoliApiService.reportStamp();
        addResult("✓ Stamp transaction successful");
        
        addResult("All API tests passed!");
      } else {
        addResult("❌ No token available for testing");
      }
    } catch (error) {
      addResult(`❌ API test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      
      <div className="flex gap-2 mb-2">
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