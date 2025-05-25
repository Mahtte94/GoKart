import React, { useState, useEffect } from 'react';
import TivoliApiService from '../api/TivoliApiService';

interface DebugPanelProps {
  isVisible: boolean;
  onClose: () => void;
}

const DebugPanel: React.FC<DebugPanelProps> = ({ isVisible, onClose }) => {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [testToken, setTestToken] = useState('');
  const [apiTestResult, setApiTestResult] = useState<string>('');

  useEffect(() => {
    if (isVisible) {
      setDebugInfo(TivoliApiService.getDebugInfo());
    }
  }, [isVisible]);

  const refreshDebugInfo = () => {
    setDebugInfo(TivoliApiService.getDebugInfo());
  };

  const setToken = () => {
    if (testToken.trim()) {
      localStorage.setItem('token', testToken.trim());
      alert('Token set successfully!');
      refreshDebugInfo();
    }
  };

  const clearToken = () => {
    localStorage.removeItem('token');
    alert('Token cleared!');
    refreshDebugInfo();
  };

  const testApiCall = async () => {
    setApiTestResult('Testing...');
    try {
      await TivoliApiService.reportSpin();
      setApiTestResult('✅ API call successful!');
    } catch (error) {
      setApiTestResult(`❌ API call failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">Debug Panel</h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* Debug Info */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold text-white">System Info</h3>
              <button 
                onClick={refreshDebugInfo}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
              >
                Refresh
              </button>
            </div>
            
            {debugInfo && (
              <div className="bg-gray-800 p-4 rounded text-sm text-gray-300 font-mono">
                <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
              </div>
            )}
          </div>

          {/* Token Management */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-2">Token Management</h3>
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={testToken}
                  onChange={(e) => setTestToken(e.target.value)}
                  placeholder="Paste JWT token here..."
                  className="flex-1 bg-gray-800 text-white p-2 rounded border border-gray-600"
                />
                <button 
                  onClick={setToken}
                  className="bg-green-600 text-white px-4 py-2 rounded"
                >
                  Set Token
                </button>
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={clearToken}
                  className="bg-red-600 text-white px-4 py-2 rounded"
                >
                  Clear Token
                </button>
                
                <button 
                  onClick={() => setTestToken('test-token-for-development')}
                  className="bg-yellow-600 text-white px-4 py-2 rounded"
                >
                  Use Test Token
                </button>
              </div>
            </div>
          </div>

          {/* API Testing */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-2">API Testing</h3>
            <div className="space-y-2">
              <button 
                onClick={testApiCall}
                className="bg-purple-600 text-white px-4 py-2 rounded w-full"
              >
                Test API Call (reportSpin)
              </button>
              
              {apiTestResult && (
                <div className="bg-gray-800 p-3 rounded text-sm text-gray-300">
                  {apiTestResult}
                </div>
              )}
            </div>
          </div>

          {/* Current Token Display */}
          {debugInfo?.hasToken && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-2">Current Token</h3>
              <div className="bg-gray-800 p-4 rounded text-sm text-gray-300 font-mono break-all">
                {localStorage.getItem('token')?.substring(0, 100)}...
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-900 p-4 rounded">
            <h4 className="text-white font-semibold mb-2">Debug Instructions:</h4>
            <ul className="text-blue-200 text-sm space-y-1">
              <li>1. Check if you're running in an iframe</li>
              <li>2. Verify the token is being received</li>
              <li>3. Test API calls with a valid token</li>
              <li>4. Check the console for detailed logs</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugPanel;