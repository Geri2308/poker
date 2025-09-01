import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Lock, Eye, EyeOff, Clock, Star } from 'lucide-react';
import BlindTimer from './BlindTimer';
import PokerTable from './PokerTable';

const AdminLogin = ({ onAdminLogin, onViewerMode }) => {
  const [code, setCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showBlindTimer, setShowBlindTimer] = useState(false);
  const [showPokerTable, setShowPokerTable] = useState(false);

  // Admin-Code (ändern Sie diesen nach Ihren Wünschen)
  const ADMIN_CODE = '2112'; // Sie können das zu jedem 4-stelligen Code ändern

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate loading delay
    setTimeout(() => {
      if (code === ADMIN_CODE) {
        onAdminLogin();
      } else if (code.length === 4) {
        setError('Falscher Code! Versuchen Sie es erneut.');
      } else {
        setError('Code muss 4-stellig sein.');
      }
      setIsLoading(false);
    }, 500);
  };

  const handleViewerMode = () => {
    onViewerMode();
  };

  const handleCodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Nur Zahlen
    if (value.length <= 4) {
      setCode(value);
      setError('');
    }
  };

  if (showBlindTimer) {
    return <BlindTimer onClose={() => setShowBlindTimer(false)} />;
  }

  if (showPokerTable) {
    return <PokerTable onClose={() => setShowPokerTable(false)} />;
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center px-4" 
      style={{
        backgroundImage: 'url(/poker-background.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="w-full max-w-md space-y-4">
        {/* Casino Poker Table Button */}
        <div className="text-center">
          <Button
            onClick={() => setShowPokerTable(true)}
            className="bg-red-600 hover:bg-red-500 text-white font-medium px-6 py-3 text-lg shadow-lg mb-3"
          >
            <Star className="mr-2 h-5 w-5" />
            Casino Poker
          </Button>
          <p className="text-gray-300 text-sm mt-1 mb-4">
            Spielen Sie Texas Hold'em gegen andere Spieler
          </p>
        </div>

        {/* Blind Timer Button */}
        <div className="text-center">
          <Button
            onClick={() => setShowBlindTimer(true)}
            className="bg-yellow-600 hover:bg-yellow-500 text-black font-medium px-6 py-3 text-lg shadow-lg"
          >
            <Clock className="mr-2 h-5 w-5" />
            Blind Timer
          </Button>
          <p className="text-gray-300 text-sm mt-2">
            Verwalten Sie Ihre Poker-Turnier Blindstufen
          </p>
        </div>

        {/* Login Card */}
        <Card className="w-full bg-black/80 backdrop-blur-sm border-yellow-500/30 shadow-2xl shadow-black/50">
          <CardHeader className="text-center">
            <CardTitle className="text-white text-2xl flex items-center justify-center space-x-2">
              <Lock className="h-6 w-6" />
              <span>Poker-Ranking</span>
            </CardTitle>
            <p className="text-gray-300 text-sm mt-2">
              Geben Sie Ihren Admin-Code ein oder nutzen Sie den Ansichtsmodus
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Input
                  type={showCode ? 'text' : 'password'}
                  value={code}
                  onChange={handleCodeChange}
                  placeholder="4-stelliger Code"
                  className="bg-black/50 border-yellow-500/50 text-white placeholder:text-gray-400 focus:border-yellow-500 focus:ring-yellow-500/20 text-center text-lg tracking-widest pr-10"
                  maxLength={4}
                />
                <button
                  type="button"
                  onClick={() => setShowCode(!showCode)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              
              {error && (
                <p className="text-red-400 text-sm text-center">{error}</p>
              )}

              <Button
                type="submit"
                disabled={code.length !== 4 || isLoading}
                className="w-full bg-yellow-600 hover:bg-yellow-500 text-gray-900 font-medium disabled:opacity-50"
              >
                {isLoading ? 'Überprüfe...' : 'Admin-Zugang'}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-600" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-black px-2 text-gray-400">oder</span>
              </div>
            </div>

            <Button
              onClick={handleViewerMode}
              variant="outline"
              className="w-full border-gray-500 text-gray-300 hover:bg-black/50 hover:text-white"
            >
              Nur Ansehen (für Spieler)
            </Button>

            <div className="text-center text-xs text-gray-400 mt-4">
              <p>👑 Admin: Kann Beträge ändern</p>
              <p>👁️ Ansicht: Kann nur Rankings sehen</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminLogin;