// src/components/PlayerNameModal.tsx
import React, { useState, useRef, useEffect } from 'react';
import { User, Loader2, Trophy, Monitor } from 'lucide-react';

interface PlayerNameModalProps {
  isVisible: boolean;
  completionTime: number;
  onSubmit: (playerName: string) => void;
  onSkip: () => void;
  isSubmitting: boolean;
}

const PlayerNameModal: React.FC<PlayerNameModalProps> = ({
  isVisible,
  completionTime,
  onSubmit,
  onSkip,
  isSubmitting
}) => {
  const [playerName, setPlayerName] = useState<string>('');
  const [error, setError] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const minsStr = mins < 10 ? `0${mins}` : `${mins}`;
    const secsStr = secs < 10 ? `0${secs}` : `${secs}`;
    return `${minsStr}:${secsStr}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedName = playerName.trim();
    
    if (!trimmedName) {
      setError('Vänligen ange ett namn');
      return;
    }
    
    if (trimmedName.length < 2) {
      setError('Namnet måste vara minst 2 tecken långt');
      return;
    }
    
    if (trimmedName.length > 20) {
      setError('Namnet får inte vara längre än 20 tecken');
      return;
    }
    
    // Check for inappropriate content (basic filter)
    const inappropriateWords = ['fuck', 'shit', 'ass', 'damn', 'hell'];
    const hasInappropriate = inappropriateWords.some(word => 
      trimmedName.toLowerCase().includes(word.toLowerCase())
    );
    
    if (hasInappropriate) {
      setError('Vänligen använd ett lämpligt namn');
      return;
    }
    
    setError('');
    handleNameSubmit(trimmedName);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow letters, numbers, spaces, and basic punctuation
    const filteredValue = value.replace(/[^a-zA-ZåäöÅÄÖ0-9\s\-_.]/g, '');
    setPlayerName(filteredValue);
    
    if (error) {
      setError('');
    }
  };

  useEffect(() => {
    if (isVisible && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isVisible]);

  useEffect(() => {
    // Load saved name from localStorage if available
    const savedName = localStorage.getItem('gokart_player_name');
    if (savedName) {
      setPlayerName(savedName);
    }
  }, []);

  const handleNameSubmit = (name: string) => {
    // Save name to localStorage for future games
    localStorage.setItem('gokart_player_name', name);
    onSubmit(name);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 p-6 text-white rounded-t-xl">
          <div className="text-center">
            <Trophy className="w-12 h-12 mx-auto mb-3 text-yellow-400" />
            <h2 className="text-2xl font-bold mb-2">Grattis!</h2>
            <p className="text-green-100 mb-1">Du klarade loppet på</p>
            <div className="text-3xl font-mono font-bold text-yellow-400">
              {formatTime(completionTime)}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold text-white mb-2">
              Spara ditt resultat!
            </h3>
            <div className="flex items-center justify-center space-x-2 text-gray-400 text-sm">
              <Monitor className="w-4 h-4" />
              <p>Ditt resultat sparas lokalt på denna enhet</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={playerName}
                  onChange={handleNameChange}
                  placeholder="Ditt namn..."
                  maxLength={20}
                  disabled={isSubmitting}
                  className={`w-full pl-10 pr-4 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    error ? 'border-red-500' : 'border-gray-700'
                  } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
              </div>
              
              {error && (
                <p className="text-red-400 text-sm mt-2 flex items-center">
                  <span className="w-4 h-4 mr-1">⚠️</span>
                  {error}
                </p>
              )}
              
              <div className="text-right text-gray-500 text-xs mt-1">
                {playerName.length}/20
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onSkip}
                disabled={isSubmitting}
                className="flex-1 py-3 px-4 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Hoppa över
              </button>
              
              <button
                type="submit"
                disabled={isSubmitting || !playerName.trim()}
                className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Sparar...
                  </>
                ) : (
                  'Spara resultat'
                )}
              </button>
            </div>
          </form>

          <div className="mt-4 text-center">
            <div className="flex items-center justify-center space-x-2 text-gray-500 text-xs">
              <Monitor className="w-3 h-3" />
              <p>Resultatet visas på den lokala topplistan</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerNameModal;