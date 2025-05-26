// src/components/Leaderboard.tsx
import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Award, Clock, User, Loader2, RefreshCw, AlertCircle, Monitor } from 'lucide-react';
import TivoliApiService, { LeaderboardEntry, LeaderboardResponse } from '../api/TivoliApiService';

interface LeaderboardProps {
  onClose: () => void;
  playerRank?: number;
  isVisible: boolean;
  currentPlayerTime?: number;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ 
  onClose, 
  playerRank, 
  isVisible, 
  currentPlayerTime 
}) => {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await TivoliApiService.getLeaderboard(50);
      setLeaderboardData(data);
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
      setError('Kunde inte ladda topplistan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isVisible) {
      fetchLeaderboard();
    }
  }, [isVisible]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const minsStr = mins < 10 ? `0${mins}` : `${mins}`;
    const secsStr = secs < 10 ? `0${secs}` : `${secs}`;
    return `${minsStr}:${secsStr}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('sv-SE', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return (
          <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
            {rank}
          </div>
        );
    }
  };

  const getRankBackground = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border-yellow-500/30';
      case 2:
        return 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-gray-400/30';
      case 3:
        return 'bg-gradient-to-r from-amber-600/20 to-amber-700/20 border-amber-600/30';
      default:
        return 'bg-gray-800/50 border-gray-700/50';
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Trophy className="w-8 h-8 text-yellow-400" />
                <Monitor className="w-4 h-4 text-blue-200 absolute -bottom-1 -right-1" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Lokal Topplista</h2>
                <p className="text-blue-100 text-sm">
                  {leaderboardData ? `${leaderboardData.total_players} resultat på denna enhet` : 'Laddar...'}
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={fetchLeaderboard}
                disabled={loading}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                title="Uppdatera"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={onClose}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Local storage info */}
          <div className="mt-4 bg-white/10 rounded-lg p-3">
            <div className="flex items-center space-x-2 text-sm">
              <Monitor className="w-4 h-4" />
              <span>Resultat sparas lokalt på denna enhet</span>
            </div>
          </div>

          {/* Player's current rank display */}
          {playerRank && currentPlayerTime && (
            <div className="mt-3 bg-white/10 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Din placering:</span>
                <div className="flex items-center space-x-2">
                  <span className="font-bold">#{playerRank}</span>
                  <Clock className="w-4 h-4" />
                  <span className="font-mono">{formatTime(currentPlayerTime)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {loading && (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <span className="ml-3 text-gray-400">Laddar resultat...</span>
            </div>
          )}

          {error && (
            <div className="text-center py-12 px-6">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
              <div className="text-red-400 mb-4">{error}</div>
              <button
                onClick={fetchLeaderboard}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Försök igen
              </button>
            </div>
          )}

          {leaderboardData && !loading && (
            <>
              {leaderboardData.leaderboard.length > 0 ? (
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="space-y-3">
                    {leaderboardData.leaderboard.map((entry) => (
                      <div
                        key={entry.id}
                        className={`flex items-center justify-between p-4 rounded-lg border ${getRankBackground(entry.rank)} transition-all duration-200 hover:scale-[1.02]`}
                      >
                        <div className="flex items-center space-x-4">
                          {getRankIcon(entry.rank)}
                          <div>
                            <div className="flex items-center space-x-2">
                              <User className="w-4 h-4 text-gray-400" />
                              <span className="font-semibold text-white">{entry.player_name}</span>
                            </div>
                            <div className="text-sm text-gray-400">
                              {formatDate(entry.completed_at)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="flex items-center space-x-2 text-white font-mono text-lg">
                            <Clock className="w-4 h-4" />
                            <span>{formatTime(entry.completion_time)}</span>
                          </div>
                          <div className="text-sm text-gray-400">
                            #{entry.rank}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Scroll indicator at bottom */}
                  {leaderboardData.leaderboard.length >= 10 && (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="h-1 w-1 bg-gray-500 rounded-full animate-bounce"></div>
                        <div className="h-1 w-1 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="h-1 w-1 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <p className="mt-2">Scrolla för att se fler resultat</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center py-12 text-gray-400">
                  <div className="text-center">
                    <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg mb-2">Inga resultat än</p>
                    <p className="text-sm">Spela ett lopp för att sätta ditt första rekord!</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-800 px-6 py-4 border-t border-gray-700 flex-shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2 text-gray-400 text-sm">
              <Monitor className="w-4 h-4" />
              <p>Resultat sparas endast på denna enhet</p>
            </div>
            <button
              onClick={onClose}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors font-medium"
            >
              Stäng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;